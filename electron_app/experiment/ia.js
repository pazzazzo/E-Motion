require("dotenv").config();
const WebSocket = require("ws");
const { spawn } = require("node:child_process");

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY manquant dans le fichier .env");
}

const ws = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-realtime", {
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
  }
});

// Petit exécuteur local
async function executeActions(payload) {
  const { actions = [], reply = "" } = payload;

  for (const action of actions) {
    switch (action.type) {
      case "gps.search":
        console.log(`🧭 Recherche GPS: ${action.query}`);
        break;

      case "gps.navigate":
        console.log(`🧭 Navigation vers: ${action.address}`);
        break;

      case "audio.volume":
        console.log(`🔊 Volume à ${action.level}%`);
        break;

      case "audio.volume_delta":
        console.log(`🔊 Variation volume: ${action.delta > 0 ? "+" : ""}${action.delta}`);
        break;

      case "audio.play":
        console.log(`🎵 Lecture: ${action.query || "musique"}`);
        break;

      case "audio.pause":
        console.log("⏸️ Pause");
        break;

      case "audio.next":
        console.log("⏭️ Suivant");
        break;

      case "audio.previous":
        console.log("⏮️ Précédent");
        break;

      default:
        console.log("⚠️ Action inconnue:", action);
    }
  }

  if (reply) {
    console.log("💬", reply);
  }
}

let micProcess = null;

function startMicrophoneStreaming() {
  // Linux / ALSA : capture micro brut PCM 16-bit little-endian, mono, 24 kHz
  micProcess = spawn("arecord", [
    "-q",
    "-f", "S16_LE",
    "-c", "1",
    "-r", "24000",
    "-t", "raw"
  ]);

  micProcess.stdout.on("data", (chunk) => {
    if (ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({
      type: "input_audio_buffer.append",
      audio: chunk.toString("base64")
    }));
  });

  micProcess.stderr.on("data", (data) => {
    const text = data.toString().trim();
    if (text) console.error("arecord:", text);
  });

  micProcess.on("close", (code) => {
    console.log(`🎤 Micro arrêté (code ${code})`);
  });

  console.log("🎤 Micro lancé, parle quand tu veux...");
}

ws.on("open", () => {
  console.log("✅ Connecté à Realtime");

  ws.send(JSON.stringify({
    type: "session.update",
    session: {
      type: "realtime",
      model: "gpt-realtime",

      // On veut surtout des appels de fonction / texte,
      // pas forcément de voix renvoyée au début
      output_modalities: ["text"],

      instructions: `
Tu es le moteur décisionnel d'un assistant vocal embarqué.
Tu dois TOUJOURS utiliser la fonction run_actions pour toute commande utilisateur exploitable.
N'invente jamais de donnée absente.
Si la destination n'est pas une adresse précise, utilise gps.search.
Si l'adresse est précise, utilise gps.navigate.
Ne cherche pas toi-même l'adresse. Quand l'utilisateur te demande d'aller quelque part, même si ce n'est pas précis, tu y va en gps.search.
Pour le son :
- "mets le son à X" => audio.volume
- "monte le son" / "baisse le son" => audio.volume_delta
- "mets de la musique" => audio.play
- "pause" => audio.pause
- "suivante" => audio.next
- "précédente" => audio.previous
`,

      audio: {
        input: {
          format: {
            type: "audio/pcm",
            rate: 24000
          },
          turn_detection: {
            type: "semantic_vad"
          }
        }
      },

      tools: [
        {
          type: "function",
          name: "run_actions",
          description: "Retourne les actions structurées à exécuter localement par l'application.",
          parameters: {
            type: "object",
            additionalProperties: false,
            properties: {
              actions: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    type: {
                      type: "string",
                      enum: [
                        "gps.search",
                        "gps.navigate",
                        "audio.volume",
                        "audio.volume_delta",
                        "audio.play",
                        "audio.pause",
                        "audio.next",
                        "audio.previous"
                      ]
                    },
                    place: { type: "string" },
                    address: { type: "string" },
                    level: { type: "number" },
                    delta: { type: "number" },
                    query: { type: "string" }
                  },
                  required: ["type"]
                }
              },
              reply: { type: "string" }
            },
            required: ["actions", "reply"]
          }
        }
      ],

      tool_choice: "auto"
    }
  }));

  startMicrophoneStreaming();
});

// Arrêt propre
process.on("SIGINT", () => {
  console.log("\n🛑 Arrêt demandé");
  if (micProcess) micProcess.kill("SIGTERM");
  ws.close();
  process.exit(0);
});