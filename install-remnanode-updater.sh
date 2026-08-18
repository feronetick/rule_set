#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Installer for RemnaNode custom rules updater (site-rules.dat & ip-rules.dat)
# Repository: https://github.com/feronetick/rule_set
# ==============================================================================

RULES_DIR="/usr/local/share/xray"
UPDATER_SCRIPT="/usr/local/bin/update-remnanode-rules.sh"
CRON_FILE="/etc/cron.d/remnanode-rules-update"

# Check root privileges
if [ "$(id -u)" != "0" ]; then
    echo "Error: This script must be run as root." >&2
    exit 1
fi

echo "==> Creating rules directory at ${RULES_DIR}..."
mkdir -p "${RULES_DIR}"

# Deploy updater script
echo "==> Creating updater script at ${UPDATER_SCRIPT}..."
cat << 'EOF' > "${UPDATER_SCRIPT}"
#!/usr/bin/env bash
set -euo pipefail

RULES_DIR="/usr/local/share/xray"
BASE_URL="https://raw.githubusercontent.com/feronetick/rule_set/main"

mkdir -p "${RULES_DIR}"

# Download to temporary files first to ensure integrity
echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Starting rules update..."

for FILE in site-rules.dat ip-rules.dat; do
    TMP_FILE="${RULES_DIR}/${FILE}.tmp"
    TARGET_FILE="${RULES_DIR}/${FILE}"
    
    if curl -sSL -f --connect-timeout 15 --max-time 60 -o "${TMP_FILE}" "${BASE_URL}/${FILE}"; then
        # Ensure file is not empty
        if [ -s "${TMP_FILE}" ]; then
            mv -f "${TMP_FILE}" "${TARGET_FILE}"
            echo "Successfully updated ${FILE}"
        else
            echo "Error: Downloaded ${FILE} is empty" >&2
            rm -f "${TMP_FILE}"
            exit 1
        fi
    else
        echo "Error: Failed to download ${FILE}" >&2
        rm -f "${TMP_FILE}"
        exit 1
    fi
done

# Fastest restart of Xray
echo "Reloading RemnaNode container..."
if docker ps --format '{{.Names}}' | grep -q "^remnanode$"; then
    docker restart remnanode > /dev/null
    echo "RemnaNode container restarted."
else
    echo "Warning: remnanode container is not running." >&2
fi

echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Rules update complete."
EOF

chmod +x "${UPDATER_SCRIPT}"

# Initial download & sync
echo "==> Running initial rules download..."
"${UPDATER_SCRIPT}"

# Setup Cron (06:00 Ekaterinburg / UTC+5 = 01:00 UTC)
echo "==> Installing cron job at ${CRON_FILE} (01:00 UTC / 06:00 YEKT)..."
cat << 'EOF' > "${CRON_FILE}"
# Update RemnaNode custom rules daily at 06:00 Ekaterinburg (01:00 UTC)
0 1 * * * root /usr/local/bin/update-remnanode-rules.sh >> /var/log/remnanode-rules-update.log 2>&1
EOF

chmod 0644 "${CRON_FILE}"

echo "==> Installation finished successfully!"
