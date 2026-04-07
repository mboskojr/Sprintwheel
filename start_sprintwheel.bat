@echo off
setlocal

cd /d "%~dp0"
cd backend

call venv\Scripts\activate.bat

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$proc = Start-Process python -ArgumentList '-m uvicorn app.main:app --host 127.0.0.1 --port 8000' -WindowStyle Minimized -PassThru;" ^
  "$proc.Id | Set-Content '..\sprintwheel_backend.pid'"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$health = 'http://127.0.0.1:8000/health';" ^
  "$appUrl = 'http://127.0.0.1:8000/';" ^
  "$chromePaths = @(" ^
  "  'C:\Program Files\Google\Chrome\Application\chrome.exe'," ^
  "  'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'," ^
  "  ($env:LOCALAPPDATA + '\Google\Chrome\Application\chrome.exe')" ^
  ");" ^
  "for ($i = 0; $i -lt 60; $i++) {" ^
  "  try {" ^
  "    $r = Invoke-WebRequest -Uri $health -UseBasicParsing -TimeoutSec 2;" ^
  "    if ($r.StatusCode -eq 200) {" ^
  "      $chrome = $chromePaths | Where-Object { Test-Path $_ } | Select-Object -First 1;" ^
  "      if ($chrome) {" ^
  "        Start-Process $chrome $appUrl" ^
  "      } else {" ^
  "        Start-Process $appUrl" ^
  "      }" ^
  "      exit 0" ^
  "    }" ^
  "  } catch {}" ^
  "  Start-Sleep -Seconds 1" ^
  "}" ^
  "Write-Host 'Sprintwheel backend did not start in time.'"

endlocal