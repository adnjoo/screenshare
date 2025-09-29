#!/bin/bash

echo "🎬 Launching ScreenShare App..."

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Dependencies not found. Running setup..."
    ./setup.sh
fi

# Launch the app
echo "🚀 Starting ScreenShare..."
npm start

