@echo off
cd /d "%~dp0"

:: 1. Injecter le base64 du screenshot dans index.html -> index_deploy.html
python inject_b64.py
if errorlevel 1 (
    echo ERREUR: inject_b64.py a echoue
    pause
    exit /b 1
)

:: 2. Deployer index_deploy.html comme index.html sur Vercel
copy /Y index_deploy.html index.html
echo Deploiement Vercel...
vercel --prod

pause
