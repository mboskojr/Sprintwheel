@echo off
setlocal

cd /d "%~dp0"

if not exist sprintwheel_backend.pid (
    echo No PID file found. Sprintwheel may not be running.
    pause
    exit /b
)

set /p BACKEND_PID=<sprintwheel_backend.pid

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$backendPid = %BACKEND_PID%;" ^
  "try {" ^
  "  Stop-Process -Id $backendPid -Force -ErrorAction Stop;" ^
  "  Write-Host 'Sprintwheel backend stopped.'" ^
  "} catch {" ^
  "  Write-Host 'Could not stop backend process. It may already be closed.'" ^
  "}"

del sprintwheel_backend.pid >nul 2>&1

endlocal
pause