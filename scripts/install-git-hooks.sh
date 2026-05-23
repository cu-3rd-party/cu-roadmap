#!/usr/bin/env sh

set -eu

root_dir=$(git rev-parse --show-toplevel)
hooks_dir="$root_dir/.githooks"

git config core.hooksPath "$hooks_dir"

printf '%s\n' "Configured Git hooks path: $hooks_dir"
