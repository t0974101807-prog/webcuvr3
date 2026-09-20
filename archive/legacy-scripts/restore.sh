#!/usr/bin/env bash
# ==============================================================================
# LEGAL OS – PRODUCTION DATABASE RESTORE & DECRYPTION SCRIPT
# ==============================================================================
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <path_to_encrypted_backup_file> [target_destination]"
  echo "Example: $0 /var/backups/legal-os/postgres_backup_20260824.sql.gz.enc postgresql://user:pass@host:5432/db"
  exit 1
fi

BACKUP_FILE="$1"
TARGET_DEST="${2:-}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-default_super_secret_backup_key_2026}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file '${BACKUP_FILE}' not found."
  exit 1
fi

echo "================================================================="
echo " [LEGAL OS RESTORE] Initiating restore from ${BACKUP_FILE}"
echo "================================================================="

TMP_RESTORE_DIR=$(mktemp -d)
trap 'rm -rf "${TMP_RESTORE_DIR}"' EXIT

if [[ "${BACKUP_FILE}" == *"postgres_backup"* ]]; then
  echo "--> Decrypting and restoring PostgreSQL database..."
  openssl enc -d -aes-256-cbc -pbkdf2 -pass "pass:${ENCRYPTION_KEY}" -in "${BACKUP_FILE}" | gzip -d > "${TMP_RESTORE_DIR}/restore.sql"
  
  if [ -n "${TARGET_DEST}" ]; then
    psql "${TARGET_DEST}" < "${TMP_RESTORE_DIR}/restore.sql"
    echo "    PostgreSQL restored successfully into ${TARGET_DEST}"
  else
    echo "    Decrypted SQL generated at ${TMP_RESTORE_DIR}/restore.sql"
  fi

elif [[ "${BACKUP_FILE}" == *"sqlite_backup"* ]]; then
  TARGET_SQLITE="${TARGET_DEST:-lawfirm.db}"
  echo "--> Decrypting and restoring SQLite database to ${TARGET_SQLITE}..."
  openssl enc -d -aes-256-cbc -pbkdf2 -pass "pass:${ENCRYPTION_KEY}" -in "${BACKUP_FILE}" | gzip -d > "${TARGET_SQLITE}"
  echo "    SQLite database restored successfully."

elif [[ "${BACKUP_FILE}" == *"uploads_backup"* ]]; then
  TARGET_UPLOADS="${TARGET_DEST:-uploads}"
  echo "--> Decrypting and extracting uploads to ${TARGET_UPLOADS}..."
  mkdir -p "${TARGET_UPLOADS}"
  openssl enc -d -aes-256-cbc -pbkdf2 -pass "pass:${ENCRYPTION_KEY}" -in "${BACKUP_FILE}" | tar -xzf - -C "${TARGET_UPLOADS}"
  echo "    Uploads extracted successfully."
fi

echo "================================================================="
echo " [LEGAL OS RESTORE] Restore completed successfully."
echo "================================================================="
