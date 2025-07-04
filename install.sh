#!/bin/bash

# Default: do not force execution
FORCE=0
for arg in "$@"; do
  case "$arg" in
  --force | -f)
    FORCE=1
    ;;
  esac
done

# Prevent running as root unless --force is provided
if [ "$FORCE" -eq 0 ] && [ "$(id -u)" = "0" ]; then
  echo "❌  Do not run this script as root; use --force to force execution." >&2
  exit 1
fi

# Indicate whether running as root was forced or normal install
if [ "$(id -u)" = "0" ]; then
  echo "⚠️  Root execution forced by --force. Installing for $(whoami)"
else
  echo "🔵  Installing for $(whoami)"
fi

# Update package list
sudo apt-get update
echo "✅  Packages updated"

# Install necessary Bluetooth libraries
sudo apt-get install -y bluetooth bluez libbluetooth-dev libudev-dev curl ofono
echo "✅  Packages installed"

# Check if Node.js is installed
if ! command -v node &>/dev/null; then
  echo "⚠️  Node.js is not installed. Installing Node.js..."

  set -euo pipefail
  export NVM_DIR="$HOME/.nvm"
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

  if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
  else
    echo "❌  nvm.sh not found in $NVM_DIR"
    exit 1
  fi

  # download and install Node.js (you may need to restart the terminal)
  nvm install 22.15.0
  # verifies the right Node.js version is in the environment
  node -v # should print `v20.16.0`
  # verifies the right npm version is in the environment
  npm -v # should print `10.8.1`
else
  echo "✅  Node.js is installed."
fi

# Check if npm is installed
if ! command -v npm &>/dev/null; then
  echo "❌  npm is not installed. An error occurred."
  exit 1
else
  echo "✅  npm is installed."
fi

# Install Node.js project dependencies
echo "✅  Installing Node.js project dependencies..."
npm install

echo "✅  Installation complete, configuring tokens..."
node ./config.js

exit 0
