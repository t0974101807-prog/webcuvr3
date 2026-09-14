terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.26"
    }
  }
  backend "gcs" {
    bucket = "legal-os-terraform-state-prod"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# 1. VPC Network & Subnets (Layer 1: Private Subnets, No Public DB/Redis)
resource "google_compute_network" "vpc_network" {
  name                    = "legal-os-vpc-prod"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet_k8s" {
  name          = "legal-os-subnet-k8s"
  ip_cidr_range = "10.10.0.0/20"
  region        = var.region
  network       = google_compute_network.vpc_network.id

  secondary_ip_range {
    range_name    = "k8s-pod-range"
    ip_cidr_range = "10.20.0.0/16"
  }

  secondary_ip_range {
    range_name    = "k8s-service-range"
    ip_cidr_range = "10.30.0.0/20"
  }

  private_ip_google_access = true
}

# 2. GKE Production Cluster (Layer 3: HA Multi-Zonal Kubernetes)
resource "google_container_cluster" "primary" {
  name     = "legal-os-cluster-prod"
  location = var.region

  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.vpc_network.name
  subnetwork = google_compute_subnetwork.subnet_k8s.name

  ip_allocation_policy {
    cluster_secondary_range_name  = "k8s-pod-range"
    services_secondary_range_name = "k8s-service-range"
  }

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  master_auth {
    client_certificate_config {
      issue_client_certificate = false
    }
  }

  release_channel {
    channel = "REGULAR"
  }

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }
}

resource "google_container_node_pool" "primary_nodes" {
  name       = "legal-os-node-pool-prod"
  location   = var.region
  cluster    = google_container_cluster.primary.name
  node_count = 3

  autoscaling {
    min_node_count = 3
    max_node_count = 10
  }

  node_config {
    machine_type = "e2-standard-4"
    disk_size_gb = 100
    disk_type    = "pd-ssd"
    preemptible  = false

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    labels = {
      environment = "production"
      app         = "legal-os"
    }

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }
  }
}

# 3. Cloud SQL PostgreSQL (Layer 4: Private IP HA Database)
resource "google_sql_database_instance" "postgres_primary" {
  name             = "legal-os-db-primary"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier              = "db-custom-4-16384"
    availability_type = "REGIONAL" # HA across 2 zones

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "01:00"
      transaction_log_retention_days = 7
    }

    ip_configuration {
      ipv4_enabled    = false # STRICT: Not public
      private_network = google_compute_network.vpc_network.id
    }

    disk_size       = 100
    disk_type       = "PD_SSD"
    disk_autoresize = true
  }

  deletion_protection = true
}

# 4. Redis MemoryStore (Layer 5: HA In-Memory Cache/Queue)
resource "google_redis_instance" "redis_cache" {
  name               = "legal-os-redis-prod"
  tier               = "STANDARD_HA" # HA across 2 zones
  memory_size_gb     = 5
  region             = var.region
  authorized_network = google_compute_network.vpc_network.id

  redis_version     = "REDIS_7_0"
  auth_enabled      = true
  transit_encryption_mode = "SERVER_AUTHENTICATION"
}

# 5. Cloud Storage (Layer 6: Encrypted Document Object Storage)
resource "google_storage_bucket" "documents_bucket" {
  name          = "legal-os-documents-${var.project_id}"
  location      = var.region
  force_destroy = false

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  encryption {
    default_kms_key_name = google_kms_crypto_key.storage_key.id
  }
}

# 6. KMS Keys & Secret Manager (Layer 9: Secrets & Encryption at Rest)
resource "google_kms_key_ring" "keyring" {
  name     = "legal-os-keyring"
  location = var.region
}

resource "google_kms_crypto_key" "storage_key" {
  name     = "legal-os-storage-key"
  key_ring = google_kms_key_ring.keyring.id
  rotation_period = "7776000s" # 90 days
}

resource "google_secret_manager_secret" "app_secrets" {
  secret_id = "legal-os-production-secrets"

  replication {
    auto {}
  }
}
