@echo off
REM ── Arrete le Tuple Bot (le process node lance depuis ce dossier),
REM    qu'il ait ete lance par start-bot.bat ou en arriere-plan.
powershell -NoProfile -Command "$p = Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -like '*tuple-bot*' }; if ($p) { $p | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; Write-Host ('Bot arrete (PID ' + $_.ProcessId + ')') } } else { Write-Host 'Aucun bot en cours.' }"
pause
