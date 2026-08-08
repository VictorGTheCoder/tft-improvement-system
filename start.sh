#!/usr/bin/env sh
cd "$(dirname "$0")"
URL="http://localhost:8765/guided.html"
(command -v xdg-open >/dev/null && xdg-open "$URL" >/dev/null 2>&1) || (command -v open >/dev/null && open "$URL") || true
if command -v python3 >/dev/null; then python3 -m http.server 8765
elif command -v python >/dev/null; then python -m http.server 8765
else echo "Python introuvable. Ouvrez guided.html directement."; exit 1
fi
