#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${ROOT_DIR}/dist/rider"
PLUGIN_XML="${ROOT_DIR}/Rider/resources/META-INF/plugin.xml"

if [ "${SKIP_THEME_SYNC:-0}" = "1" ]; then
  echo "Skipping palette sync because SKIP_THEME_SYNC=1."
elif command -v node >/dev/null 2>&1; then
  node "${ROOT_DIR}/scripts/sync-theme-palette.mjs"
else
  echo "Skipping palette sync: node is not installed." >&2
fi

if [ ! -f "${PLUGIN_XML}" ]; then
  echo "Missing plugin XML: ${PLUGIN_XML}" >&2
  exit 1
fi

VERSION="$(sed -n 's/.*<version>\(.*\)<\/version>.*/\1/p' "${PLUGIN_XML}" | head -n 1)"
if [ -z "${VERSION}" ]; then
  echo "Unable to read <version> from ${PLUGIN_XML}" >&2
  exit 1
fi

OUTPUT_JAR="${DIST_DIR}/LetsCollabThemes-${VERSION}.jar"

mkdir -p "${DIST_DIR}"

# Package plugin contents so META-INF/plugin.xml is at the JAR root.
jar --create --file "${OUTPUT_JAR}" -C "${ROOT_DIR}/Rider/resources" .

echo "Created ${OUTPUT_JAR}"