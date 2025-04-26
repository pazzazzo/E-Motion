#!/bin/bash

FORCE=0
for arg in "$@"; do
  case "$arg" in
    --force|-f)
      FORCE=1
      ;;
  esac
done

if [ "$FORCE" -eq 0 ] && [ "$(id -u)" = "0" ]; then
  echo "❌  Ne lancez pas ce script en tant que root utilisez --force pour forcer l'execution." >&2
  exit 1
fi

if [ "$(id -u)" = "0" ]; then
  echo "⚠️  Exécution en root forcée par --force. Installation pour $(whoami)"
else
  echo "🔵  Installation pour $(whoami)"
fi
# Mettre à jour la liste des paquets
sudo apt-get update
echo "✅  Packages mis à jour"
# Installer les bibliothèques nécessaires pour Bluetooth
sudo apt-get install -y bluetooth bluez libbluetooth-dev libudev-dev curl ofono
echo "✅  Packages installés"

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null
then
    echo "⚠️ Node.js n'est pas installé. Installation de Node.js..."
    # installs nvm (Node Version Manager)
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    # download and install Node.js (you may need to restart the terminal)
    nvm install 20
    # verifies the right Node.js version is in the environment
    node -v # should print `v20.16.0`
    # verifies the right npm version is in the environment
    npm -v # should print `10.8.1`
else
    echo "✅ Node.js est installé."
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null
then
    echo "❌ npm n'est pas installé. Une erreur est survenue"
    exit
else
    echo "✅ npm est installé."
fi

# Installer les dépendances du projet Node.js
echo "✅ Installation des dépendances du projet Node.js..."
npm install

echo "✅ Installation terminée, configuration des tokens..."
node ./config.js
exit