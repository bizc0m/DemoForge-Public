#!/bin/zsh
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_DIR"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not a git repository"
  exit 0
fi

if ! git config --get remote.origin.url >/dev/null 2>&1; then
  echo "No remote origin configured, skipping auto-push"
  exit 0
fi

branch="$(git branch --show-current)"
if [ -z "$branch" ]; then
  echo "No current branch, skipping auto-push"
  exit 0
fi

git push origin "$branch"
