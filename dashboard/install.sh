#!/bin/bash

# Mettre à jour la liste des paquets
sudo apt-get update

# Installer les bibliothèques nécessaires pour Bluetooth
sudo apt-get install -y bluetooth bluez libbluetooth-dev libudev-dev curl

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null
then
    echo "Node.js n'est pas installé. Installation de Node.js..."
    # installs nvm (Node Version Manager)
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    # download and install Node.js (you may need to restart the terminal)
    nvm install 20
    # verifies the right Node.js version is in the environment
    node -v # should print `v20.16.0`
    # verifies the right npm version is in the environment
    npm -v # should print `10.8.1`
else
    echo "Node.js est installé."
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null
then
    echo "npm n'est pas installé. Une erreur est survenue"
    exit
else
    echo "npm est installé."
fi

# Installer les dépendances du projet Node.js
echo "Installation des dépendances du projet Node.js..."
npm install

echo "Installation terminée."
exit