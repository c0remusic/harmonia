@echo off
REM ── Sync UI : copie device/ui/index.html -> C:/TupleUI/index.html (jweb).
REM    A lancer apres chaque edit de l'UI (jweb ne s'autowatch pas : rouvrir le device ensuite).
copy /Y "%~dp0ui\index.html" "C:\TupleUI\index.html" >nul
if %errorlevel%==0 (
  echo UI synchronisee -> C:/TupleUI/index.html
) else (
  echo ECHEC de la copie — verifie que C:/TupleUI existe.
)
pause
