#!/usr/bin/env bash
set -euo pipefail

echo "[1/6] Verifying required CLIs"
command -v git >/dev/null
command -v npm >/dev/null

echo "[2/6] Install dependencies"
npm install

echo "[3/6] Verify test and build"
npm run test
npm run build

echo "[4/6] Supabase/Vercel authorization placeholders"
echo "- Create a new .env from .env.example and fill NEW project keys only"
echo "- Run: supabase login && supabase link --project-ref <new-project-ref>"
echo "- Run: vercel login && vercel link"

echo "[5/6] Set git remote target"
git remote get-url gen2-opencode >/dev/null

echo "[6/6] Ready to push manually"
echo "Run these after you confirm credentials and review changes:"
echo "  git add ."
echo "  git commit -m 'feat: complete janet sales calendar gen2 baseline'"
echo "  git push gen2-opencode main"
