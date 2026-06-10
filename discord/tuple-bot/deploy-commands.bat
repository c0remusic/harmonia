@echo off
REM ── Enregistre / met a jour les slash-commands aupres de Discord.
REM    A lancer : une fois au tout debut, puis a chaque ajout ou modif de commande.
cd /d "%~dp0"

if not exist node_modules (
  echo Premiere fois : installation des dependances...
  call npm install
  echo.
)

echo Enregistrement des slash-commands aupres de Discord...
node deploy-commands.js

echo.
echo ------------------------------------------------
echo Termine. Si "Aucune erreur" ci-dessus, tu peux
echo fermer cette fenetre et lancer start-bot.bat.
echo ------------------------------------------------
pause
