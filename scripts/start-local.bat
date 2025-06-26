
@echo off
echo 🚀 Starting Voice Agent in Local Mode...

if not exist "local-backend" (
  echo ❌ Local backend directory not found!
  echo Please make sure you're in the project root directory.
  pause
  exit /b 1
)

set VITE_USE_LOCAL_BACKEND=true

echo 📡 Starting local backend...
cd local-backend

if not exist "node_modules" (
  echo 📦 Installing backend dependencies...
  call npm install
)

start "Backend" cmd /k npm run dev

timeout /t 3 /nobreak > nul

cd ..
echo 🎨 Starting frontend...
start "Frontend" cmd /k npm run dev

echo.
echo ✅ Both servers are starting!
echo 🌐 Frontend: http://localhost:5173
echo 📡 Backend API: http://localhost:3001
echo.
echo Close both command windows to stop the servers
pause
