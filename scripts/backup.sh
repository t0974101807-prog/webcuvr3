#!/usr/bin/env bash
# ==============================================================================
# LEGAL OS – PRODUCTION AUTOMATED BACKUP & ENCRYPTION SCRIPT
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/legal-os}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-default_super_secret_backup_key_2026}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

mkdir -p "${BACKUP_DIR}"

echo "================================================================="
echo " [LEGAL OS BACKUP] Starting automated backup at ${TIMESTAMP}"
echo "================================================================="

# 1. PostgreSQL Database Dump (if running)
if [ -n "${DATABASE_URL:-}" ]; then
  PG_BACKUP_FILE="${BACKUP_DIR}/postgres_backup_${TIMESTAMP}.sql.gz.enc"
  echo "--> Dumping PostgreSQL database..."
  pg_dump "${DATABASE_URL}" | gzip -c | openssl enc -aes-256-cbc -salt -pbkdf2 -pass "pass:${ENCRYPTION_KEY}" -out "${PG_BACKUP_FILE}"
  echo "    PostgreSQL backup encrypted and saved to ${PG_BACKUP_FILE}"
fi

# 2. SQLite Database Backup (if SQLite is present in /app/data or root)
SQLITE_DB="${SQLITE_DB_PATH:-lawfirm.db}"
if [ -f "${SQLITE_DB}" ]; then
  SQLITE_BACKUP_FILE="${BACKUP_DIR}/sqlite_backup_${TIMESTAMP}.db.gz.enc"
  echo "--> Backing up SQLite database..."
  sqlite3 "${SQLITE_DB}" ".backup '${BACKUP_DIR}/temp.db'"
  gzip -c "${BACKUP_DIR}/temp.db" | openssl enc -aes-256-cbc -salt -pbkdf2 -pass "pass:${ENCRYPTION_KEY}" -out "${SQLITE_BACKUP_FILE}"
  rm -f "${BACKUP_DIR}/temp.db"
  echo "    SQLite backup encrypted and saved to ${SQLITE_BACKUP_FILE}"
fi

# 3. Document Uploads Storage Archive
UPLOADS_DIR="${UPLOAD_DIR:-uploads}"
if [ -d "${UPLOADS_DIR}" ]; then
  UPLOADS_BACKUP_FILE="${BACKUP_DIR}/uploads_backup_${TIMESTAMP}.tar.gz.enc"
  echo "--> Archiving document uploads..."
  tar -czf - "${UPLOADS_DIR}" | openssl enc -aes-256-cbc -salt -pbkdf2 -pass "pass:${ENCRYPTION_KEY}" -out "${UPLOADS_BACKUP_FILE}"
  echo "    Uploads archive encrypted and saved to ${UPLOADS_BACKUP_FILE}"
fi

# 4. Cleanup old backups according to retention policy
echo "--> Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "*_backup_*" -mtime +"${RETENTION_DAYS}" -exec rm -f {} \;

echo "================================================================="
echo " [LEGAL OS BACKUP] Backup routine completed successfully."
echo "================================================================="
