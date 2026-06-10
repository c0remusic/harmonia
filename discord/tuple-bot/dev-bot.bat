@echo off
REM ── Mode DEV : relance le bot AUTOMATIQUEMENT a chaque modif de fichier.
REM    (node --watch, integre a Node 18+). Laisse la fenetre ouverte ; Ctrl+C pour arreter.
cd /d "%~dp0"

if not exist node_modules (
  echo Premiere fois : installation des dependances...
  call npm install
  echo.
)

REM Tuer toute instance deja en cours (garantit une seule instance).
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -like '*tuple-bot*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"

echo ================================================
echo   Tuple Bot - mode DEV (auto-reload a chaque save)
echo ================================================
echo.
node --watch "%~dp0index.js"
pause
