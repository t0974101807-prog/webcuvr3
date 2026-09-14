# Runbook: Security Incident & Threat Containment (P1)

## Symptoms
- Brute-force login attempts, SQLi/XSS signatures detected by WAF, or unauthorized admin privilege escalation attempt.

## Immediate Containment Steps
1. Block attacking IP subnet at Cloudflare / Ingress WAF level.
2. Invalidate all active user JWT tokens by rotating `SESSION_SECRET` and flushing session store:
   ```bash
   kubectl set env deployment/legal-os-backend -n legal-os SESSION_SECRET="RotatedSecureSecret2026!$(date +%s)"
   ```
3. Lock compromised user accounts:
   ```sql
   UPDATE users SET is_locked = 1 WHERE username = 'compromised_user';
   ```
4. Preserve forensic audit trails from `audit_logs` table.
