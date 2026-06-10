@echo off
REM ── Lance le Tuple Bot. Le bot reste en ligne tant que cette fenetre est ouverte.
REM    Double-clique ce fichier pour demarrer. Ctrl+C (ou fermer la fenetre) pour arreter.
cd /d "%~dp0"

if not exist node_modules (
  echo Premiere fois : installation des dependances...
  call npm install
  echo.
)

REM Tuer toute instance deja en cours (evite deux bots qui se battent = crash).
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -like '*tuple-bot*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"

echo ================================================
echo   Tuple Bot - demarrage
echo   (laisse cette fenetre ouverte tant qu'il tourne)
echo ================================================
echo.
node "%~dp0index.js"

echo.
echo ------------------------------------------------
echo Le bot s'est arrete. Lis les messages ci-dessus
echo (token manquant dans .env ? erreur de commande ?).
echo ------------------------------------------------
pause
