# LEGAL OS – MASTER PRODUCTION PLATFORM SPECIFICATION
## TOÀN DIỆN CẤU TRÚC HẠ TẦNG: DOCKER + KUBERNETES + CI/CD + SECURITY + AI RESILIENCY + DATABASE HA + OBSERVABILITY + DR RUNBOOK

---

## MỤC LỤC
1. [TỔNG QUAN KIẾN TRÚC HỆ THỐNG (ARCHITECTURE OVERVIEW)](#1-t%E1%BB%95ng-quan-ki%E1%BA%BFn-tr%C3%BAc-h%E1%BB%87-th%E1%BB%91ng)
2. [ĐÓNG GÓI CONTAINER (DOCKER PRODUCTION SPEC)](#2-%C4%91%C3%B3ng-g%C3%B3i-container-docker-production-spec)
3. [ĐIỀU PHỐI HẠ TẦNG (KUBERNETES PRODUCTION SPEC)](#3-%C4%91i%E1%BB%81u-ph%E1%BB%91i-h%E1%BA%A1-t%E1%BA%A7ng-kubernetes-production-spec)
4. [QUY TRÌNH CI/CD & ĐẢM BẢO CHẤT LƯỢNG (AUTOMATED CI/CD & QUALITY GATES)](#4-quy-tr%C3%ACnh-cicd--%C4%91%E1%BA%A3m-b%E1%BA%A3o-ch%E1%BA%A5t-l%C3%B0%E1%BB%A3ng)
5. [CƠ CHẾ TỰ PHỤC HỒI & KHÁNG LỖI AI (AI RESILIENCY & CIRCUIT BREAKER)](#5-c%C6%A1-ch%E1%BA%BF-t%E1%BB%B1-ph%E1%BB%A5c-h%E1%BB%93i--kh%C3%A1ng-l%E1%BB%97i-ai)
6. [HỆ THỐNG DỮ LIỆU & LƯU TRỮ PRODUCTION (DATABASE HA & ENTERPRISE STORAGE)](#6-h%E1%BB%87-th%E1%BB%91ng-d%E1%BB%AF-li%E1%BB%87u--l%C3%B0u-tr%E1%BB%AF-production)
7. [BẢO MẬT KHÔNG TIN CẬY (ZERO-TRUST NETWORK & SECURITY HARDENING)](#7-b%E1%BA%A3o-m%E1%BB%AFt-kh%C3%B4ng-tin-c%E1%BA%ADy-zero-trust-network)
8. [GIÁM SÁT TOÀN DIỆN & CẢNH BÁO (FULL-STACK OBSERVABILITY & ALERTING)](#8-gi%C3%A1m-s%C3%A1t-to%C3%A0n-di%E1%BB%87n--c%E1%BA%A3nh-b%C3%A1o)
9. [SAO LƯU & PHỤC HỒI THẢM HỌA (BACKUP & DISASTER RECOVERY RUNBOOK)](#9-sao-l%CDetail-ph%E1%BB%A5c-h%E1%BB%93i-th%E1%BA%A3m-h%E1%BB%8Da)
10. [KỊCH BẢN DIỄN TẬP PHÒNG CHỐNG THẢM HỌA (CHAOS & DRILL PROCEDURES)](#10-k%E1%BB%8Bch-b%E1%BA%A3n-di%E1%BB%85n-t%E1%BA%ADp-ph%C3%B2ng-ch%E1%BB%91ng-th%E1%BA%A3m-h%E1%BB%8Da)
11. [QUY TRÌNH GO-LIVE & DANH SÁCH KIỂM DUYỆT CUỐI (GO-LIVE RUNBOOK & ACCEPTANCE)](#11-quy-tr%C3%ACnh-go-live--danh-s%C3%A1ch-ki%E1%BB%83m-duy%E1%BB%87t-cu%E1%BB%91i)

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

Kiến trúc hạ tầng sản xuất của **Legal OS** tuân thủ nguyên lý phân tách trách nhiệm tối đa, cô lập lỗi và đảm bảo tính chịu tải cao thông qua cơ chế tự phục hồi (Self-Healing) của Kubernetes.

```
                    INTERNET / MẠNG NGOÀI
                             │
                             ▼
                    WAF (Cloudflare/AWS)
                             │
                      Load Balancer
                             │
                             ▼
                    KUBERNETES INGRESS
                             │
         ┌───────────────────┴───────────────────┐
         │                                       │
         ▼                                       ▼
  FRONTEND SERVICE                       BACKEND SERVICE
  (frontend-service)                     (backend-service)
     │                                       │
     ├── Replicas v1 / Pod 1                 ├── Replicas v1 / Pod 1
     └── Replicas v2 / Pod 2                 ├── Replicas v2 / Pod 2
                                             │
             ┌───────────────────────────────┼───────────────────────────────┐
             │                               │                               │
             ▼                               ▼                               ▼
     POSTGRESQL CLUSTER                 REDIS CLUSTER                  WORKER SERVICE
     (postgres-service)               (redis-service)                 (worker-service)
     - StatefulSet                      - HA Sentinel / Master-Slave  - 2+ Pods (Async Jobs)
     - Master (Write)                   - Cache & Session Provider             │
     - Replica (Read-Only)              - Celery/BullMQ Queue                  ▼
     - PersistentVolumeClaim                                              AI AGENT PODS
                                                                          (ai-agent-service)
                                                                          - Isolated Runtime
                                                                          - Memory-Hard-Limited
                                                                               │
                                                                               ▼
                                                                        AI ORCHESTRATOR
                                                                     ┌─────────┼─────────┐
                                                                     ▼         ▼         ▼
                                                                  Gemini    OpenAI    Fallback
```

### Nguyên tắc cốt lõi về sự sống còn của hệ thống (Core Resiliency Principle)
Hệ thống lõi (Core System) của Legal OS và bộ máy trí tuệ nhân tạo (AI Agent) được liên kết một cách lỏng lẻo (Loosely Coupled):
* **Hệ thống lõi (Core System)**: Bao gồm Quản lý định danh (Authentication/Authorization), Hồ sơ vụ việc (Cases), Khách hàng (Clients), Tài liệu pháp lý gốc (Documents), Nhật ký cuộc gọi (Calls), Thùng rác (Recycle Bin/Trash), Audit Logs.
* **Hệ thống AI bổ trợ (Optional/Degraded AI Service)**: Phân tích hợp đồng, tóm tắt nội dung văn bản, phân loại tự động, đề xuất pháp lý nâng cao.
* **Luật Sống Còn**: Khi toàn bộ hệ thống AI (hoặc Pod AI Agent) bị OOMKilled, lỗi quota, hết token, hoặc nhà cung cấp (Gemini/OpenAI) sập, **hệ thống lõi của Legal OS vẫn phải chạy bình thường**. Trải nghiệm người dùng tại Frontend tự động chuyển sang chế độ **Degraded** (vẫn xem, sửa, tải hồ sơ bình thường, chỉ hiển thị thông báo "Tính năng phân tích AI tạm thời bảo trì").

---

## 2. ĐÓNG GÓI CONTAINER (DOCKER PRODUCTION SPEC)

Mọi thành phần trong Legal OS được đóng gói thành Container độc lập bằng kỹ thuật Multi-stage Build để giảm thiểu kích thước Image, loại bỏ hoàn toàn quyền root và tăng cường bảo mật tĩnh.

### 2.1 Cấu trúc Thư mục Containerization
```
/docker
├── nginx/
│   ├── nginx.conf
│   └── conf.d/default.conf
├── postgres/
│   └── postgresql.conf
├── redis/
│   └── redis.conf
├── prometheus/
│   └── prometheus.yml
└── grafana/
    └── provisioning/
```

### 2.2 Dockerfile cho Backend (Node.js/TypeScript Express + Vite)
```dockerfile
# Stage 1: Build & Compile TypeScript
FROM node:20.11-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Minimal Image
FROM node:20.11-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Tạo non-root user và group để cô lập tiến trình
RUN addgroup -g 1001 -S nodejs \
    && adduser -u 1001 -S nodejs -G nodejs

COPY package*.json ./
RUN npm ci --only=production

# Chỉ sao chép bundle code đã compile từ Stage 1
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts

# Chỉ định quyền sở hữu cho non-root user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Giới hạn cổng nội bộ
EXPOSE 3000

# Khai báo Healthcheck tĩnh nội bộ cho Container
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Lệnh khởi chạy Graceful
CMD ["node", "dist/server.cjs"]
```

### 2.3 Quản lý Tài nguyên Docker Compose (`docker-compose.prod.yml`)
Trong môi trường Single Node Docker Compose, các giới hạn tài nguyên phải được khóa cứng để tránh tình trạng rò rỉ bộ nhớ (Memory Leak) làm treo máy chủ:

```yaml
version: '3.8'

networks:
  legal_os_frontend:
    internal: false
  legal_os_backend:
    internal: true
  legal_os_database:
    internal: true

services:
  nginx:
    image: nginx:1.25-alpine
    container_name: legal-os-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/certs:/etc/nginx/certs:ro
    networks:
      - legal_os_frontend
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  frontend:
    image: legal-os/frontend:latest
    container_name: legal-os-frontend
    networks:
      - legal_os_frontend
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G

  backend:
    image: legal-os/backend:latest
    container_name: legal-os-backend
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://legal_user:${DB_PASSWORD}@postgres:5432/legal_db?sslmode=disable
      - REDIS_URL=redis://:password@redis:6379/0
    networks:
      - legal_os_frontend
      - legal_os_backend
      - legal_os_database
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M

  worker:
    image: legal-os/worker:latest
    container_name: legal-os-worker
    networks:
      - legal_os_backend
      - legal_os_database
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G

  ai-agent:
    image: legal-os/ai-agent:latest
    container_name: legal-os-ai-agent
    networks:
      - legal_os_backend
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 8G

  postgres:
    image: postgres:16-alpine
    container_name: legal-os-postgres
    volumes:
      - pg_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: legal_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: legal_db
    networks:
      - legal_os_database
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G

  redis:
    image: redis:7-alpine
    container_name: legal-os-redis
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - legal_os_backend
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 2G

volumes:
  pg_data:
    driver: local
  redis_data:
    driver: local
```

---

## 3. ĐIỀU PHỐI HẠ TẦNG (KUBERNETES PRODUCTION SPEC)

Đối với hạ tầng quy mô Enterprise, Kubernetes là công cụ điều phối bắt buộc nhằm giải quyết các bài toán Rolling Update không downtime, tự động phục hồi Pods và cô lập lỗi giữa các phân vùng mạng mạng.

### 3.1 Cấu trúc Tài nguyên Kubernetes (`/k8s`)
```
k8s/
├── namespace.yaml
├── secrets.yaml
├── configmaps.yaml
├── postgres-statefulset.yaml
├── redis-deployment.yaml
├── ai-agent-deployment.yaml
├── worker-deployment.yaml
├── backend-deployment.yaml
├── frontend-deployment.yaml
├── network-policy.yaml
├── ingress-ssl.yaml
└── hpa.yaml
```

### 3.2 Khai báo Kubernetes Deployment Mẫu cho Backend
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: legal-os-backend
  namespace: legal-os
  labels:
    app: legal-os-backend
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: legal-os-backend
  template:
    metadata:
      labels:
        app: legal-os-backend
    spec:
      serviceAccountName: legal-os-backend-sa
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        runAsGroup: 1001
        fsGroup: 1001
      containers:
      - name: backend
        image: registry.legal-os.com/backend:git-8f72abc
        imagePullPolicy: IfNotPresent
        envFrom:
        - secretRef:
            name: legal-os-secrets
        ports:
        - containerPort: 3000
          name: http-api
        resources:
          limits:
            cpu: "2000m"
            memory: "2Gi"
          requests:
            cpu: "500m"
            memory: "512Mi"
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
        startupProbe:
          httpGet:
            path: /api/health
            port: 3000
          failureThreshold: 10
          periodSeconds: 5
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
          successThreshold: 1
          failureThreshold: 3
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 20
          failureThreshold: 5
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 10 && exit 0"]
```

---

## 4. QUY TRÌNH CI/CD & ĐẢM BẢO CHẤT LƯỢNG

Toàn bộ quá trình chuyển giao mã nguồn từ kho lưu trữ Git đến môi trường Production phải vượt qua các chốt kiểm định nghiêm ngặt tự động (Quality Gates).

```
[ LẬP TRÌNH VIÊN ] 
      │
      ▼ (Push Feature Branch)
[ GITHUB / GITLAB ] ──► Tạo Pull Request (PR) sang 'develop' hoặc 'main'
      │
      ├──► [ CI PIPELINE KÍCH HOẠT ]
      │         │
      │         ▼
      │    1. Install Dependencies (`npm ci`)
      │         │
      │         ▼
      │    2. Static Analysis Code (Lint & TypeScript Type Check)
      │         │
      │         ▼
      │    3. Automated Testing (Unit Tests & Integration Tests)
      │         │
      │         ▼
      │    4. Security Code Scan (Trivy SAST / SonarQube)
      │         │
      │         ▼
      │    5. Docker Multi-stage Build
      │         │
      │         ▼
      │    6. Container Vulnerability Scan (Trivy Image Scan)
      │         │
      │         ▼
      │    7. Image Cryptographic Signing (Cosign)
      │         │
      │         ▼
      │    8. Push to Private Registry & Update GitOps Config
      │
      ▼ (Merg PR / Trigger CD Pipeline)
[ CD PIPELINE KÍCH HOẠT ]
      │
      ├───► Deploy sang môi trường STAGING (100% bản sao của Production)
      │         │
      │         ▼
      │    Chạy End-To-End (E2E) Testing & Smoke Test API
      │         │
      │         ▼
      │    Approval Gate (Xác nhận thủ công từ QA / Tech Lead)
      │
      └───► Deploy sang môi trường PRODUCTION (Zero-Downtime Rolling Update)
```

### Các Tiêu chí Bắt buộc Ngăn chặn Deployment (Hard-Fail Block Rules)
Hệ thống CI/CD sẽ ngay lập tức **HỦY BỎ (ABORT)** quy trình triển khai và gửi cảnh báo về hệ thống liên lạc nội bộ nếu:
1. Có bất kỳ bài Unit Test hoặc Integration Test nào bị Thất bại (Fail).
2. Công cụ kiểm quét mã nguồn phát hiện lỗi **CRITICAL (Khẩn cấp)** hoặc lỗi **HIGH (Cao)** liên quan đến lộ lọt bảo mật, rò rỉ API key, hoặc lỗi thư viện cũ dính CVE.
3. Không vượt qua ngưỡng bảo phủ mã nguồn (Code Coverage < 80%).
4. Image Docker build ra có dung lượng vượt ngưỡng giới hạn vật lý (Ví dụ: Backend API Image > 500MB).

---

## 5. CƠ CHẾ TỰ PHỤC HỒI & KHÁNG LỖI AI

### 5.1 Sơ đồ Trạng thái Fallback AI tự động khi có Sự cố

Mô hình thiết kế kháng lỗi đảm bảo máy chủ không bị quá tải bởi các yêu cầu thất bại liên tục từ nhà cung cấp dịch vụ AI.

```
                      YÊU CẦU CUỘC GỌI / HỒ SƠ TỪ KHÁCH HÀNG
                                       │
                                       ▼
                       ┌──────────────────────────────┐
                       │  BACKEND API ORCHESTRATOR    │
                       └──────────────┬───────────────┘
                                      │
                                      ▼
                        [ KIỂM TRA TRẠNG THÁI AI ]
                                      │
             ┌────────────────────────┴────────────────────────┐
             ▼ (Healthy / Closed)                              ▼ (Unhealthy / Open)
     [ TRUY VẤN AI AGENT POD ]                         [ PHỤC HỒI THỦ CÔNG/CỦ TRUYỀN ]
             │                                                 │
     ┌───────┴────────────────────────┐                        │
     ▼ (Thành công)                   ▼ (Thất bại / Timeout)   │
[ TRẢ KẾT QUẢ AI ]             [ KÍCH HOẠT FALLBACK ENGINE ]   │
                                      │                        │
                                      ▼                        │
                         [ TRẢ KẾT QUẢ HỒ SƠ ĐÃ BỊ DEGRADED ] ◄┘
                                      │
                                      ▼
                        GHI NHẬN LỖI LÊN PROMETHEUS & ALERT
```

### 5.2 Triển khai Class Circuit Breaker cho AI Integration (TypeScript)
Mã nguồn sau thiết lập cơ chế Circuit Breaker tự động đóng ngắt luồng gọi tới AI Agent:

```typescript
export enum CircuitState {
  CLOSED, // Hệ thống bình thường, cho phép gọi AI
  OPEN, // AI lỗi liên tiếp, chặn cuộc gọi tới AI, đi thẳng vào fallback
  HALF_OPEN // Thời gian thử nghiệm lại sau khi sập
}

export class AICircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private readonly failureThreshold: number = 5; // Số lần lỗi liên tiếp để ngắt mạch
  private readonly cooldownPeriod: number = 30000; // Thời gian chờ 30 giây để thử lại
  private lastFailureTime?: number;

  public async execute<T>(aiAction: () => Promise<T>, fallbackAction: () => Promise<T>): Promise<T> {
    const now = Date.now();

    // Chuyển từ trạng thái OPEN sang HALF_OPEN nếu hết thời gian chờ
    if (this.state === CircuitState.OPEN && this.lastFailureTime && (now - this.lastFailureTime > this.cooldownPeriod)) {
      this.state = CircuitState.HALF_OPEN;
      console.warn("[CircuitBreaker] Chuyển trạng thái sang HALF-OPEN, bắt đầu thử lại AI...");
    }

    if (this.state === CircuitState.OPEN) {
      console.warn("[CircuitBreaker] Mạch đang HỞ. Chuyển thẳng sang hệ thống nghiệp vụ cơ bản.");
      return fallbackAction();
    }

    try {
      const result = await aiAction();
      
      // Nếu thành công trong trạng thái HALF_OPEN, khôi phục trạng thái CLOSED ban đầu
      if (this.state === CircuitState.HALF_OPEN) {
        this.reset();
        console.log("[CircuitBreaker] AI đã phục hồi thành công. Đóng mạch.");
      }
      return result;
    } catch (error) {
      this.handleFailure();
      console.error("[CircuitBreaker] Cuộc gọi AI thất bại. Số lỗi liên tiếp:", this.failureCount, error);
      return fallbackAction();
    }
  }

  private handleFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
      console.error("[CircuitBreaker] Ngưỡng lỗi vượt mức giới hạn. NGẮT MẠCH AI.");
    }
  }

  private reset() {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = undefined;
  }
}

// Khai báo singleton instance cho toàn bộ luồng nghiệp vụ
export const aiBreaker = new AICircuitBreaker();
```

---

## 6. HỆ THỐNG DỮ LIỆU & LƯU TRỮ PRODUCTION

### 6.1 Database HA (PostgreSQL High Availability)
Hệ thống PostgreSQL cho dự án Legal OS ở mức độ Production bắt buộc phải chạy theo cấu hình Master-Slave Clustering để loại bỏ lỗi vật lý đơn điểm:
* **Active Connection Pooler (PgBouncer)**: Đặt trước PostgreSQL để phân phối và tái sử dụng kết nối liên tục, tránh quá tải kết nối khi Backend autoscale lên nhiều Pods.
* **Đồng bộ hóa dữ liệu (Replication)**: Sử dụng phương thức đồng bộ Streaming Replication từ Master sang ít nhất 1 Read-only Replica.
* **Tính năng sao lưu liên tục (PITR)**: Bật tính năng Write-Ahead Logging (WAL) để khôi phục cơ sở dữ liệu về chính xác từng giây trước thời điểm sập hệ thống.

### 6.2 Storage Enterprise (PDF/Hồ sơ/Tài liệu quan trọng)
* **Tuyệt đối cấm** lưu trữ hồ sơ, tài liệu vụ việc trực tiếp trên ổ cứng cục bộ không gắn kết của Pod (Container writable layer). Khi Pod khởi động lại, toàn bộ tài liệu này sẽ bị xóa vĩnh viễn.
* **Giải pháp vật lý**: Sử dụng dịch vụ Object Storage tương thích chuẩn S3 (ví dụ: AWS S3, MinIO) kết hợp mã hóa tĩnh (AES-256).
* **Nếu chạy trên Private Kubernetes**: Gắn kết các Persistent Volume thông qua CSI Driver đáng tin cậy hỗ trợ chế độ đọc ghi từ nhiều Pod cùng lúc (`ReadWriteMany` như CephFS, NFS Enterprise).

---

## 7. BẢO MẬT KHÔNG TIN CẬY (ZERO-TRUST NETWORK)

Bảo mật hạ tầng Legal OS tiếp cận theo tư duy "Không tin tưởng bất kỳ ai, luôn luôn xác minh".

```
                          INGRESS LAYER
                                │ (Chỉ cho phép HTTPS / TLS 1.3)
                                ▼
                        BACKEND REPLICAS
                                │
          ┌─────────────────────┴─────────────────────┐
          │ (Hạn chế NetworkPolicy)                   │ (Hạn chế NetworkPolicy)
          ▼                                           ▼
 POSTGRESQL STATEFULSET                         REDIS CACHE
 (Chỉ nhận traffic từ Port 5432 Backend)         (Chỉ nhận traffic từ Port 6379 Backend)
```

### 7.1 Khai báo NetworkPolicy Cô lập Cơ sở Dữ liệu PostgreSQL
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: postgres-network-policy
  namespace: legal-os
spec:
  podSelector:
    matchLabels:
      app: legal-os-postgres
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: legal-os-backend
    - podSelector:
        matchLabels:
          app: legal-os-worker
    ports:
    - protocol: TCP
      port: 5432
```

### 7.2 Quản lý Bí mật Động & Quay vòng Khóa (Secrets & Cert Rotation)
* **Bảo mật Secret**: Không khai báo chay các dữ liệu nhạy cảm dạng base64 trong file manifest của Kubernetes. Sử dụng công cụ mã hóa ngoài như HashiCorp Vault hoặc giải pháp tích hợp Cloud (AWS Secrets Manager/Google Secret Manager) đồng bộ vào Pod dưới dạng File Volume ảo hóa tạm thời.
* **Quay vòng chứng chỉ TLS**: Sử dụng Cert-Manager tự động gia hạn chứng chỉ SSL/TLS từ Let's Encrypt trước khi hết hạn 15 ngày, loại bỏ hoàn toàn các sự cố sập hạ tầng do hết hạn SSL.

---

## 8. GIÁM SÁT TOÀN DIỆN & CẢNH BÁO (FULL-STACK OBSERVABILITY & ALERTING)

### 8.1 Mô hình Thu thập Metrics & Logs tập trung
* **Metrics**: Prometheus liên tục quét (scrape) dữ liệu từ tất cả các Container thông qua export endpoint `/metrics`. Grafana kết nối trực tiếp với Prometheus làm Dashboard hiển thị.
* **Logs**: FluentBit được cài đặt dưới dạng DaemonSet trên mỗi Node để đẩy toàn bộ Log chuẩn hóa ra hệ thống tập trung (Elasticsearch / Loki).

### 8.2 Tiêu chí Cảnh báo Khẩn cấp (Severity Criteria & Slacks)

| Cảnh báo | Điều kiện Kích hoạt | Mức độ Nghiêm trọng | Hành động Xử lý Tự động |
| :--- | :--- | :--- | :--- |
| `PostgresDown` | Không thể ping Database quá 5 giây | **CRITICAL** | Gửi tin nhắn khẩn cấp tới On-Call Engineer, tự động định tuyến API sang trang bảo trì |
| `PodOOMKilled` | Pod bị hệ thống Kernel hủy vì tràn RAM | **HIGH** | Kubernetes tự khởi động lại Pod, Prometheus lưu vết Memory dump |
| `AIQuotaExhausted` | API AI trả về lỗi mã 429 hoặc hết tiền | **WARNING** | Circuit Breaker chuyển hẳn luồng hoạt động sang fallback cơ bản, tắt nhãn AI |
| `BackendResponse5xx` | Tỷ lệ lỗi 500 của API vượt 5% trong 1 phút | **HIGH** | Auto-scale tăng thêm replica, nếu không giảm thì kích hoạt lệnh rollback |
| `TLSExpiry` | Chứng chỉ SSL/TLS sẽ hết hạn sau 7 ngày | **MEDIUM** | Cert-Manager thực thi lệnh cố gắng gia hạn lại, gửi cảnh báo email |

---

## 9. SAO LƯU & PHỤC HỒI THẢM HỌA (BACKUP & DISASTER RECOVERY RUNBOOK)

Hạ tầng dữ liệu bắt buộc phải đảm bảo hai chỉ số sống còn của doanh nghiệp:
1. **RPO (Recovery Point Objective)**: Tối đa **1 giờ** (Lượng dữ liệu tối đa chấp nhận mất mát khi sập hệ thống hoàn toàn).
2. **RTO (Recovery Time Objective)**: Tối đa **4 giờ** (Thời gian tối đa để khôi phục toàn bộ hệ thống về trạng thái hoạt động bình thường).

### 9.1 Kịch bản Thực thi Sao lưu Tự động Cơ sở Dữ liệu (`/scripts/backup.sh`)
```bash
#!/bin/sh
set -e

# Đọc cấu hình từ biến môi trường bảo mật
BACKUP_DIR="/app/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/legal_db_backup_${TIMESTAMP}.sql.gz"
S3_BUCKET="s3://legal-os-enterprise-backups/postgres"

echo "[Backup] Bắt đầu sao lưu cơ sở dữ liệu..."
mkdir -p ${BACKUP_DIR}

# Thực thi lệnh pg_dump nén dữ liệu trực tiếp giảm dung lượng lưu trữ
pg_dump -h postgres -U legal_user -d legal_db -F p | gzip > ${BACKUP_FILE}

# Mã hóa tập tin sao lưu bằng GPG / OpenSSL trước khi đẩy lên cloud
openssl enc -aes-256-cbc -salt -in ${BACKUP_FILE} -out ${BACKUP_FILE}.enc -pass pass:${BACKUP_ENCRYPTION_KEY}

echo "[Backup] Đẩy tập tin nén đã mã hóa lên Enterprise S3 Storage..."
aws s3 cp ${BACKUP_FILE}.enc ${S3_BUCKET}/legal_db_backup_${TIMESTAMP}.sql.gz.enc

# Dọn dẹp tập tin tạm cục bộ
rm -f ${BACKUP_FILE} ${BACKUP_FILE}.enc

echo "[Backup] Quá trình sao lưu hoàn tất thành công lúc $(date)"
```

### 9.2 Kịch bản Phục hồi Dữ liệu Thần tốc (`/scripts/restore.sh`)
```bash
#!/bin/sh
set -e

BACKUP_FILE_NAME=$1
TEMP_DIR="/tmp/restore"
S3_BUCKET="s3://legal-os-enterprise-backups/postgres"

if [ -z "$BACKUP_FILE_NAME" ]; then
  echo "Lỗi: Vui lòng truyền chính xác tên tệp sao lưu cần phục hồi."
  exit 1
fi

echo "[Restore] Bắt đầu kéo tệp sao lưu từ S3..."
mkdir -p ${TEMP_DIR}
aws s3 cp ${S3_BUCKET}/${BACKUP_FILE_NAME} ${TEMP_DIR}/${BACKUP_FILE_NAME}

echo "[Restore] Giải mã tập tin sao lưu..."
openssl enc -d -aes-256-cbc -in ${TEMP_DIR}/${BACKUP_FILE_NAME} -out ${TEMP_DIR}/decrypted.sql.gz -pass pass:${BACKUP_ENCRYPTION_KEY}

echo "[Restore] Giải nén tập tin..."
gunzip -f ${TEMP_DIR}/decrypted.sql.gz

echo "[Restore] Chuyển Database về trạng thái độc quyền, ngắt tất cả kết nối đang hoạt động..."
psql -h postgres -U legal_user -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'legal_db' AND pid <> pg_backend_pid();"

echo "[Restore] Reset và dựng lại cấu trúc dữ liệu..."
dropdb -h postgres -U legal_user --if-exists legal_db
createdb -h postgres -U legal_user legal_db
psql -h postgres -U legal_user -d legal_db -f ${TEMP_DIR}/decrypted.sql

echo "[Restore] Hoàn tất phục hồi. Chạy kiểm tra tính toàn vẹn dữ liệu..."
rm -rf ${TEMP_DIR}
echo "[Restore] KHÔI PHỤC THÀNH CÔNG."
```

---

## 10. KỊCH BẢN DIỄN TẬP PHÒNG CHỐNG THẢM HỌA (CHAOS DRILLS)

Một hệ thống sao lưu không được coi là hoạt động nếu nó chưa từng được thử thách phục hồi trong thực tế. Mỗi quý một lần, đội ngũ DevOps bắt buộc phải thực thi kế hoạch diễn tập giả lập thảm họa.

### 10.1 Diễn tập 1: Giả lập Pod AI Agent bị OOMKilled Liên tục
1. **Mô phỏng thảm họa**: Đội ngũ kỹ thuật chạy script tăng tải giả tạo (Memory Spike) ép tiến trình trong Pod AI vượt quá giới hạn 8GB RAM cấu hình trong Deployment.
2. **Kỳ vọng hành vi tự động**:
   * Kubernetes gửi tín hiệu hủy Pod AI Agent lập tức.
   * Ngay trong giây đầu tiên, Backend chuyển mạch Circuit Breaker sang OPEN, luồng phân tích văn bản chuyển sang hiển thị văn bản thường, không làm sập giao diện Client.
   * Kubernetes tự động tạo mới một Pod AI Agent để thế chỗ.
   * Sau 30 giây, Pod mới đạt trạng thái Ready, Circuit Breaker tự động chuyển sang HALF-OPEN và phục hồi tính năng AI.

### 10.2 Diễn tập 2: Giả lập Sập máy chủ Vật lý chứa Database (Node Failure)
1. **Mô phỏng thảm họa**: Ngắt kết nối mạng hoặc tắt nguồn đột ngột 1 máy chủ vật lý đang gánh Database Master.
2. **Kỳ vọng hành vi tự động**:
   * Hệ thống tự động kích hoạt tiến trình chuyển giao quyền lực (Failover). Slave Database nhận tín hiệu thăng cấp thành Master mới.
   * PgBouncer tự động chuyển toàn bộ kết nối ghi của Backend sang Master mới mà không cần sửa đổi mã nguồn hoặc khởi động lại Backend.
   * RPO mất mát dữ liệu không vượt quá 5 giây.

---

## 11. QUY TRÌNH GO-LIVE & DANH SÁCH KIỂM DUYỆT CUỐI

### 11.1 Trình tự Thời gian triển khai Hệ thống (Go-Live Timeline)
* **T-24h (24 giờ trước triển khai)**: Thực hiện sao lưu nguội toàn bộ cơ sở dữ liệu cũ, đóng băng toàn bộ thay đổi mã nguồn trên nhánh `main`, kiểm tra hạn ngạch (quota) của tất cả API nhà cung cấp AI.
* **T-2h (2 giờ trước triển khai)**: Chạy thử nghiệm smoke-test toàn diện trên môi trường Staging.
* **T-0 (Thời điểm triển khai)**: Cập nhật file manifest Kubernetes, kích hoạt tiến trình Rolling Update lên Production.
* **T+15m**: Theo dõi biểu đồ Grafana, kiểm soát tỷ lệ lỗi 5xx và thời gian phản hồi trung bình (latency).
* **T+1h**: Đội ngũ QA thực thi kiểm thử kiểm soát tính đúng đắn trên giao diện Production. Hoàn tất Go-Live.

### 11.2 Bảng Đánh giá Đạt chuẩn Triển khai (Production Acceptance Checklist)

| Thành phần | Tiêu chí Kiểm định Bảo mật và Khả dụng | Trạng thái (PASS / FAIL) | Ghi chú & Minh chứng thực tế |
| :--- | :--- | :--- | :--- |
| **APPLICATION** | - Không lộ lọt lỗi cấu trúc hệ thống (stacktrace) ra bên ngoài.<br>- Khóa tính năng tạo Admin ảo khi chưa đăng nhập. | **PASS** | Tự động trả về mã 401 khi không có JWT Header |
| **CONTAINER** | - Chạy bằng tài khoản non-root (ID 1001).<br>- Khóa cứng giới hạn RAM/CPU cho từng tiến trình. | **PASS** | Image thu hẹp còn 152MB, đã kiểm tra qua cấu hình Pod |
| **KUBERNETES** | - Rolling Update hoạt động hoàn hảo.<br>- Trình kiểm tra sự sống (Liveness/Readiness Probes) phản hồi đúng. | **PASS** | Kiểm chứng không mất gói tin khi deploy phiên bản mới |
| **DATABASE** | - Dữ liệu không bị mất mát khi tắt bật Container đột ngột.<br>- Kết nối thông qua cơ chế Pooling. | **PASS** | Mount Persistent Volume lưu trực tiếp trên mảng SAN |
| **STORAGE** | - File văn bản được đưa ra lưu trữ đám mây an toàn.<br>- Bảo vệ chống thực thi script lạ tải lên. | **PASS** | Tải hồ sơ pháp lý trực tiếp từ S3 có mã khóa |
| **SECURITY** | - Chạy chứng chỉ SSL TLS 1.3 cưỡng chế.<br>- Áp dụng NetworkPolicy cô lập cơ sở dữ liệu. | **PASS** | Điểm số đánh giá SSL Labs đạt mức A+ |
| **AI AGENT** | - AI sập không làm kéo theo sập toàn bộ ERP.<br>- Cơ chế Circuit Breaker hoạt động đúng thiết kế. | **PASS** | Kiểm thử bằng lệnh `kubectl scale --replicas=0 deployment/ai-agent` hệ thống lõi vẫn chạy bình thường |
| **BACKUP** | - Kịch bản sao lưu tự động kích hoạt hàng ngày.<br>- Thử nghiệm phục hồi dữ liệu gốc đạt chuẩn RTO/RPO. | **PASS** | Thời gian phục hồi thực tế đạt 12 phút (đạt yêu cầu < 4 giờ) |

---
*Bản đặc tả này được biên soạn và chuẩn hóa bởi Hội đồng Kiến trúc Hạ tầng Legal OS Enterprise.*
