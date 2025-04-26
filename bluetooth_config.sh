#!/usr/bin/env sh
# set_bluetooth_class.sh
# Usage: ./set_bluetooth_class.sh [hciX]
# Définit la Class of Device Bluetooth temporairement ET de façon persistante.

# --- CONFIGURATION ---
HCIDEV=${1:-hci0} # interface Bluetooth (défaut hci0)
CLASS="0x6c0420"  # Class of Device à appliquer
CONF="/etc/bluetooth/main.conf"

# --- RE-LAUNCH EN SUDO SI NON-ROOT ---
if [ "$(id -u)" != 0 ]; then
    echo "⚠️ Non root, relancement du script..."
    exec sudo "$0" "$@"
fi

# --- 1) APPLICATION TEMPORAIRE ---
echo "🔵  Applique temporairement Class=$CLASS sur $HCIDEV…"
hciconfig "$HCIDEV" class "$CLASS" &&
    echo "✅  Temporaire OK" ||
    {
        echo "❌ Échec hciconfig" >&2
        exit 1
    }

# --- 2) MISE À JOUR PERSISTANTE ---
# Crée le fichier si besoin
[ -f "$CONF" ] || echo "[General]" >"$CONF"

# S’assure d’avoir une section [General]
if ! grep -q '^\[General\]' "$CONF"; then
    echo "\n[General]" >>"$CONF"
fi

# Remplace ou ajoute la ligne Class = ...
if grep -q '^Class' "$CONF"; then
    sed -i "s/^Class.*/Class = $CLASS/" "$CONF"
else
    # ajoute juste après [General]
    sed -i "/^\[General\]/a Class = $CLASS" "$CONF"
fi

echo "✅  Persistant OK dans $CONF"

exit 0
