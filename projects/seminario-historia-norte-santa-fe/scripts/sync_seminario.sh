#!/usr/bin/env bash
# Sync local Seminar files into the repository (one-way: source -> repo)
# Usage: ./sync_seminario.sh [--dry-run]
set -euo pipefail
DRY_RUN=false
if [[ "${1-}" == "--dry-run" ]]; then
  DRY_RUN=true
fi

SOURCE_DIR="/Users/eljaso/Documents/Trabajo/Docencia/Seminaro historia norte de santa fe"
DEST_DIR="$(cd "$(dirname "$0")/.." && pwd)"

RSYNC_OPTS=(--archive --verbose --compress --human-readable --delete)
if [[ "$DRY_RUN" == true ]]; then
  RSYNC_OPTS+=(--dry-run)
fi

# Exclude common macOS/temporary files
RSYNC_EXCLUDES=("--exclude=.DS_Store" "--exclude=Thumbs.db" "--exclude=**/.git/**" "--exclude=**/.DS_Store")

echo "Syncing from: $SOURCE_DIR"
echo "To repo path: $DEST_DIR"

rsync "${RSYNC_OPTS[@]}" "${RSYNC_EXCLUDES[@]}" "$SOURCE_DIR/" "$DEST_DIR/"

echo "Done. Review changes with: git status && git --no-pager diff --name-status"