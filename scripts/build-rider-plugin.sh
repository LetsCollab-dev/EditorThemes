#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${ROOT_DIR}/dist/rider"
PLUGIN_XML="${ROOT_DIR}/Rider/resources/META-INF/plugin.xml"

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