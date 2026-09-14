# Legal OS – Production Security & Hardening Specification

## 1. Zero-Trust Network & Container Hardening
- **Non-Root Execution**: Containers run as non-root UID/GID `10001` (`legaluser`).
- **Read-Only Root Filesystem**: Core container filesystem is mounted read-only; writable ephemeral data is strictly confined to `/tmp` and `/app/uploads`.
- **Privilege Escalation**: `allowPrivilegeEscalation: false` and `drop: [ALL]` Linux capabilities enforced.
- **Kubernetes NetworkPolicy**: Restricts database and Redis traffic strictly to authorized pods in the `legal-os-prod` namespace.

## 2. Web Application Firewall (WAF) & Rate Limiting
- **Pattern Matching**: Automatically detects and drops malicious SQL Injection (`union select`, `1=1`), XSS (`<script>`), and Path Traversal (`../`, `etc/passwd`) payloads.
- **Scanner Filtering**: Drops bot scans from `sqlmap`, `nikto`, `nmap`, `masscan`.
- **Rate Limits**:
  - API General: 1,000 req / 15 min per IP
  - Auth & Payment Endpoints: 100 req / 15 min per IP

## 3. Secrets Management & Key Rotation
- Secrets are stored in Kubernetes `Secret` objects or injected at runtime via cloud KMS.
- Passwords and token secrets (`JWT_SECRET`, `SESSION_SECRET`, `DATABASE_URL`) must be rotated quarterly.
- Backups are encrypted with AES-256-CBC via OpenSSL prior to transmission to backup storage.
