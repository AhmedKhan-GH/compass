#!/usr/bin/env bash
#
# catalog-lint.sh — enforce the PLATFORM.md §5.6 "catalog is the only door" rule.
#
# Instrument/UI source under src/ may only include third-party headers that the
# library catalog (§5.2) approves. This script greps the sources for
# angle-bracket #include lines and fails (exit 1) on any third-party header that
# is not on the allow-list below.
#
# Allow-list:
#   - C/C++ standard library   : angle includes with no slash (e.g. <vector>, <cmath>)
#   - wxWidgets                : <wx/...>
#   - GLM                      : <glm/...>
#   - system OpenGL / GLEW     : <GL/...>, <OpenGL/...>
#   - project-local headers    : any quoted include ("plot/...", "main_frame.h", ...)
#
# Quoted includes are always treated as project-local and allowed.
#
# Usage: bash scripts/catalog-lint.sh   (run from the repo root)

set -u

# Resolve repo root from this script's location so it works from any CWD.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

SRC_DIR="${REPO_ROOT}/src"

if [ ! -d "${SRC_DIR}" ]; then
  echo "catalog-lint: no src/ directory found at ${SRC_DIR}; nothing to scan."
  exit 0
fi

# Collect instrument/UI sources. libcompass/ (framework) is excluded — the
# catalog rule governs instrument code, not the framework itself.
files=$(find "${SRC_DIR}" \
  -type d -name libcompass -prune -o \
  -type f \( -name '*.cpp' -o -name '*.h' \) -print)

violations=0
scanned=0

for f in ${files}; do
  scanned=$((scanned + 1))
  # Pull out angle-bracket includes with their line numbers.
  # Matches:  #include <path/to/header.h>
  while IFS=: read -r lineno header; do
    [ -z "${header}" ] && continue

    # Standard library: no slash in the header name.
    case "${header}" in
      */*) : ;;                         # has a slash — keep checking prefixes
      *)   continue ;;                  # no slash — standard library, allow
    esac

    # Allowed catalog / system prefixes (compass:: targets + system frameworks).
    case "${header}" in
      wx/*|glm/*|GL/*|OpenGL/*|nlohmann/*|glad/*|compass/*)
        continue ;;
    esac

    # Anything else is a non-catalog third-party include.
    rel="${f#${REPO_ROOT}/}"
    echo "${rel}:${lineno}: non-catalog include: <${header}>"
    violations=$((violations + 1))
  done < <(grep -nE '^[[:space:]]*#[[:space:]]*include[[:space:]]*<[^>]+>' "${f}" \
             | sed -E 's/^([0-9]+):[[:space:]]*#[[:space:]]*include[[:space:]]*<([^>]+)>.*/\1:\2/')
done

echo "catalog-lint: scanned ${scanned} file(s) under src/."

if [ "${violations}" -gt 0 ]; then
  echo "catalog-lint: FAILED — ${violations} non-catalog include(s) found."
  echo "  The catalog (PLATFORM.md §5.2) is the only door. Add the library to the"
  echo "  catalog or drop the dependency; instrument code may not include arbitrary"
  echo "  third-party headers."
  exit 1
fi

echo "catalog-lint: OK — all third-party includes are catalog-approved."
exit 0
