@echo off
cd /d "%~dp0"
start "" http://localhost:8765/guided.html
where py >nul 2>nul && py -m http.server 8765 && goto :eof
where python >nul 2>nul && python -m http.server 8765 && goto :eof
echo Python est introuvable. Ouvrez guided.html directement ou installez Python.
pause
