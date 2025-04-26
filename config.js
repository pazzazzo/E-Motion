#!/usr/bin/env node
// ensureConfig.js (CommonJS, sans open@ESM)

const fs       = require('fs').promises;
const path     = require('path');
const readline = require('readline');
const http     = require('http');
const { exec } = require('child_process');

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

function openUrl(url) {
  let cmd;
  if (process.platform === 'win32') {
    cmd = `start "" "${url}"`;
  } else if (process.platform === 'darwin') {
    cmd = `open "${url}"`;
  } else {
    cmd = `xdg-open "${url}"`;
  }
  exec(cmd, err => {
    if (err) console.error('Erreur ouverture navigateur :', err);
  });
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

async function getSpotifyRefreshToken(config) {
  const clientId     = config['spotify-client-id'];
  const clientSecret = config['spotify-secret'];
  const redirectUri  = 'http://localhost:8888/callback';

  const authUrl = 'https://accounts.spotify.com/authorize?' +
    new URLSearchParams({
      response_type: 'code',
      client_id:     clientId,
      scope:         SPOTIFY_SCOPES.join(' '),
      redirect_uri:  redirectUri,
    });

  const server = http.createServer(async (req, res) => {
    if (!req.url.startsWith('/callback')) return;
    const url  = new URL(req.url, `http://${req.headers.host}`);
    const code = url.searchParams.get('code');

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('✔️ Authentification Spotify réussie, vous pouvez fermer cet onglet.');

    server.close();

    // Échange du code contre le refresh_token
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' +
          Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type:   'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });
    const data = await tokenRes.json();
    if (data.refresh_token) {
      config['spotify-refresh-token'] = data.refresh_token;
      console.log('✅ Spotify refresh token obtenu.');
    } else {
      console.error('❌ Impossible d’obtenir le refresh token :', data);
      process.exit(1);
    }
  });

  server.listen(8888, () => {
    console.log('➡️ Lancement du navigateur pour Spotify OAuth…');
    openUrl(authUrl);
  });

  await new Promise(resolve => server.on('close', resolve));
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

  const keys = [
    'mapbox-token',
    'spotify-secret',
    'wit-token',
    'map-api-key',
  ];
  for (const key of keys) {
    if (!config[key]) {
      config[key] = await ask(`Entrez votre ${key}: `);
    }
  }

  // Flow OAuth pour spotify-refresh-token s'il manque
  if (!config['spotify-refresh-token']) {
    config["spotify-client-id"] = await ask(`Entrez votre ${"spotify-client-id"}: `);
    await getSpotifyRefreshToken(config);
  }

  // Écriture finale
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(config, null, 2), 'utf-8');
  console.log('✅ src/database.json mis à jour.');
  process.exit(1);
}

main().catch(err => {
  console.error('Erreur inattendue:', err);
  process.exit(1);
});
