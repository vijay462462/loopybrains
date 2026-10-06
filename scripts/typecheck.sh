#!/usr/bin/env bash
# Optional type check of the JavaScript with TypeScript (no build step, nothing changes in the app).
# It reports likely mistakes such as using a value that may be missing. Many notes are harmless guesses; read, do not obey blindly.
cd "$(dirname "$0")/../docs"
npx --yes -p typescript tsc --noEmit --allowJs --checkJs --strict false --target es2022 --module esnext --moduleResolution bundler --lib es2022,dom --skipLibCheck $( [ $# -gt 0 ] && echo "$@" || echo brain-*.js ) 2>&1 | grep -v "?v=" | head -60
