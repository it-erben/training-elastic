#!/usr/bin/env bash
set -euo pipefail

OUTDIR="pdf"
mkdir -p "$OUTDIR"

for deck in slides/*/slides.md; do
  name=$(basename "$(dirname "$deck")")
  echo "Rendering $deck -> $OUTDIR/$name.pdf"
  npx @marp-team/marp-cli "$deck" --pdf --allow-local-files -o "$OUTDIR/$name.pdf"
done

echo "Done. PDFs in $OUTDIR/"
