#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${ROOT_DIR}/dist/visualstudio"
SOLUTION_FILE="${ROOT_DIR}/VisualStudio/LetsCollabTheme.sln"

if command -v node >/dev/null 2>&1; then
  node "${ROOT_DIR}/scripts/sync-theme-palette.mjs"
else
  echo "Skipping palette sync: node is not installed." >&2
fi

if [ ! -f "${SOLUTION_FILE}" ]; then
  echo "Missing solution file: ${SOLUTION_FILE}" >&2
  exit 1
fi

VSTOOLS_PATH=""
if [ -n "${VSTOOLS_PATH_OVERRIDE:-}" ]; then
  VSTOOLS_PATH="${VSTOOLS_PATH_OVERRIDE}"
fi

if [ -z "${VSTOOLS_PATH}" ]; then
  for VSWHERE in "/c/Program Files (x86)/Microsoft Visual Studio/Installer/vswhere.exe" "/c/Program Files/Microsoft Visual Studio/Installer/vswhere.exe"; do
    if [ -f "${VSWHERE}" ]; then
      VS_INSTALL="$("${VSWHERE}" -latest -products "*" -property installationPath | head -n 1)"
      if [ -n "${VS_INSTALL}" ]; then
        if command -v cygpath >/dev/null 2>&1; then
          VS_INSTALL="$(cygpath -u "${VS_INSTALL}")"
        fi
        for CANDIDATE in "${VS_INSTALL}/MSBuild/Microsoft/VisualStudio/v18.0" "${VS_INSTALL}/MSBuild/Microsoft/VisualStudio/v17.0"; do
          if [ -d "${CANDIDATE}/VSSDK" ]; then
            VSTOOLS_PATH="${CANDIDATE}"
            break
          fi
        done
        if [ -n "${VSTOOLS_PATH}" ]; then
          break
        fi
      fi
    fi
  done
fi

if [ -z "${VSTOOLS_PATH}" ]; then
  shopt -s nullglob
  for CANDIDATE in /c/Program\ Files/Microsoft\ Visual\ Studio/2026/Professional/MSBuild/Microsoft/VisualStudio/v18.0 \
                   /c/Program\ Files/Microsoft\ Visual\ Studio/2026/*/MSBuild/Microsoft/VisualStudio/v18.0 \
                   /c/Program\ Files/Microsoft\ Visual\ Studio/2022/*/MSBuild/Microsoft/VisualStudio/v17.0 \
                   /e/Program\ Files/Microsoft\ Visual\ Studio/18/Professional/MSBuild/Microsoft/VisualStudio/v18.0 \
                   /e/Program\ Files/Microsoft\ Visual\ Studio/2026/Professional/MSBuild/Microsoft/VisualStudio/v18.0; do
    if [ -d "${CANDIDATE}/VSSDK" ]; then
      VSTOOLS_PATH="${CANDIDATE}"
      break
    fi
  done
  shopt -u nullglob
fi

if [ -z "${VSTOOLS_PATH}" ]; then
  echo "VSSDK targets not found. Install Visual Studio (with VSSDK) or Visual Studio Build Tools." >&2
  echo "Tip: set VSTOOLS_PATH_OVERRIDE to the folder containing VSSDK (e.g., C:/Program Files/Microsoft Visual Studio/2022/Community/MSBuild/Microsoft/VisualStudio/v17.0)." >&2
  exit 1
fi

MSBUILD=""
for VSWHERE in "/c/Program Files (x86)/Microsoft Visual Studio/Installer/vswhere.exe" "/c/Program Files/Microsoft Visual Studio/Installer/vswhere.exe"; do
  if [ -f "${VSWHERE}" ]; then
    MSBUILD="$("${VSWHERE}" -latest -products "*" -find "MSBuild/**/Bin/MSBuild.exe" | head -n 1)"
    if [ -n "${MSBUILD}" ]; then
      if command -v cygpath >/dev/null 2>&1; then
        MSBUILD="$(cygpath -u "${MSBUILD}")"
      fi
      break
    fi
  fi
done

if [ -z "${MSBUILD}" ]; then
  for CANDIDATE in "${VS_INSTALL:-}"/MSBuild/Current/Bin/MSBuild.exe "${VS_INSTALL:-}"/MSBuild/15.0/Bin/MSBuild.exe; do
    if [ -f "${CANDIDATE}" ]; then
      MSBUILD="${CANDIDATE}"
      break
    fi
  done
fi

if [ -z "${MSBUILD}" ]; then
  echo "MSBuild.exe not found. Install Visual Studio Build Tools or add MSBuild to PATH." >&2
  exit 1
fi

"${MSBUILD}" "${SOLUTION_FILE}" -t:Restore -p:Configuration=Release -p:Platform="Any CPU" -p:VSToolsPath="${VSTOOLS_PATH}"
"${MSBUILD}" "${SOLUTION_FILE}" -t:Rebuild -p:Configuration=Release -p:Platform="Any CPU" -p:VSToolsPath="${VSTOOLS_PATH}"

VSIX_SOURCE="$(ls -1 "${ROOT_DIR}/VisualStudio/bin/Release"/*.vsix | head -n 1)"
if [ -z "${VSIX_SOURCE}" ]; then
  echo "No VSIX found in VisualStudio/bin/Release" >&2
  exit 1
fi

mkdir -p "${DIST_DIR}"
cp "${VSIX_SOURCE}" "${DIST_DIR}/"

echo "Copied $(basename "${VSIX_SOURCE}") to ${DIST_DIR}"
