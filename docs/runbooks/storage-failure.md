# Runbook: Object Storage Failure (P2)

## Symptoms
- Document upload or download requests fail with S3 500 / Connection Timeout errors.

## Mitigation
- Backend switches document upload to local fallback staging disk (`/tmp/uploads-staging/`).
- Once S3 connectivity is re-established, the sync worker reconciles staging files into S3 object storage.
