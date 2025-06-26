
#!/bin/bash

echo "🚀 Starting Voice Agent in Local Mode..."

# Check if local-backend directory exists
if [ ! -d "local-backend" ]; then
  echo "❌ Local backend directory not found!"
  echo "Please make sure you're in the project root directory."
  exit 1
fi

# Set environment variable for local backend
export VITE_USE_LOCAL_BACKEND=true

# Start backend in background
echo "📡 Starting local backend..."
cd local-backend
if [ ! -d "node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  npm install
fi

npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Go back to project root and start frontend
cd ..
echo "🎨 Starting frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers are running!"
echo "🌐 Frontend: http://localhost:5173"
echo "📡 Backend API: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to press Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT
wait
