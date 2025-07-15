#!/usr/bin/env node
// config.js (CommonJS, sans open@ESM)

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const qr = require("qrcode-terminal")
const { URLSearchParams } = require('url');

const DB_PATH = path.join(__dirname, 'src', 'database.json');

const SPOTIFY_SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-private',
  'playlist-modify-public',
  'user-read-playback-position',
  'user-top-read',
  'user-read-recently-played',
  'user-library-read',
  'streaming',
  'app-remote-control',
];

const SPOTIFY_CLIENT_ID = '65b708073fc0480ea92a077233ca87bd';
const DEVICE_AUTHORIZE_URL = 'https://accounts.spotify.com/oauth2/device/authorize';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';

async function oauthAuthorize() {
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    creation_point: 'https://login.app.spotify.com/?client_id=' +
      SPOTIFY_CLIENT_ID +
      '&utm_source=spotify&utm_medium=desktop-win32&utm_campaign=organic',
    intent: 'login',
    scope: [
      "ugc-image-upload",
      "user-read-playback-state",
      "user-modify-playback-state",
      "user-read-currently-playing",
      "app-remote-control",
      "streaming",
      "playlist-read-private",
      "playlist-read-collaborative",
      "playlist-modify-private",
      "playlist-modify-public",
      "user-follow-modify",
      "user-follow-read",
      "user-read-playback-position",
      "user-top-read",
      "user-read-recently-played",
      "user-library-modify",
      "user-library-read",
      "user-read-email",
      "user-read-private",
    ].join(','),
  });

  const res = await fetch(DEVICE_AUTHORIZE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      // 'User-Agent': 'Spotify/125700463 Win32_x86_64/0 (CarThing)',
      'Accept-Language': 'en-Latn-US,en-US;q=0.9',
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Device auth failed (${res.status}): ${err}`);
  }

  return res.json();
}

async function checkAuthStatus(deviceCode) {
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    device_code: deviceCode,
    grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  // 400 + error=authorization_pending means keep polling
  if (res.status === 400) {
    const body = await res.json();
    if (body.error === 'authorization_pending') {
      return {};
    }
    throw new Error(body.error_description || body.error);
  }

  if (!res.ok) {
    throw new Error(`Token poll failed (${res.status})`);
  }

  return res.json();
}

async function refreshAccessToken(refreshToken) {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: SPOTIFY_CLIENT_ID,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Refresh failed (${res.status}): ${err}`);
  }

  return res.json();
}

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve =>
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

function getSpotifyRefreshToken(config) {
  return new Promise(async (resolve, reject) => {
    let d = await oauthAuthorize()
    console.log(`🔑 Authentification Spotify, ouvrez ${d.verification_uri} sur un navigateur et entrez le code: ${d.user_code} ou scannez le QRCode:`);
    qr.generate(d.verification_uri_complete, { small: true })
    let deviceCode = d.device_code
    let interval = d.interval
    async function poll() {
      d = await checkAuthStatus(deviceCode)
      if (d.access_token) {
        console.log("✅ Authentification réussie !")
        console.log("✅ Refresh token réussi !")
        config['spotify-refresh-token'] = d.refresh_token;
        resolve(config)
      } else {
        console.log('Waiting for authorization...')
        setTimeout(async () => {
          await poll()
        }, interval * 1000);
      }
    }
    await poll()
  })
}

async function main() {
  let config = {};

  try {
    const raw = await fs.readFile(DB_PATH, 'utf-8');
    config = JSON.parse(raw);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('Erreur lecture JSON :', err);
      process.exit(1);
    }
  }

  // Flow OAuth pour spotify-refresh-token s'il manque
  if (!config['spotify-refresh-token']) {
    config = await getSpotifyRefreshToken(config);
  }

  // Écriture finale
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(config, null, 2), 'utf-8');
  console.log('✅ src/database.json mis à jour.');
  process.exit(0);
}

main().catch(err => {
  console.error('Erreur inattendue:', err);
  process.exit(1);
});
