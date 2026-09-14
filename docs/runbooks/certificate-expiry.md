# Runbook: TLS Certificate Expiry Alert (P2)

## Symptoms
- Prometheus alert `TLSCertificateExpiringSoon` (< 14 days remaining).

## Mitigation
- Check cert-manager status:
  ```bash
  kubectl get certificate -n legal-os
  kubectl describe challenge -n legal-os
  ```
- Force certificate renewal via Let's Encrypt / cert-manager:
  ```bash
  kubectl renew certificate legal-os-tls -n legal-os || kubectl delete secret legal-os-tls -n legal-os
  ```
