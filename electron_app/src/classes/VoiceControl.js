const recorder = require("./recorder");
require("dotenv").config();
const WebSocket = require("ws");
const { spawn } = require("node:child_process");

class VoiceControl {
	constructor() {
		console.log("✅ VoiceControl class invoked");
		this.animationFrameID = null;
		this.placesList = document.getElementById("main-places");
		this.waypointsList = new Set();
		this.placesElementList = new Set();
		this.selectedPlace = null;
		this.clickNum = 0;
		this.micProcess = null;
		this.mic = document.getElementById("menu-voice");
		this.mic.style.background = `linear-gradient(41deg, #14d289 13%, #0f57ff 48%, #ea0b59 99%);`;
		this.mic.addEventListener("click", async () => {
			if (this.micProcess) {
				this.micProcess.micProcess.kill("SIGTERM");
				return;
			}
			if (this.ws) {
				this.ws.close();
				return;
			}
			if (this.animationFrameID) return;
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: false,
			});
			const audioContext = new AudioContext();
			const mediaStreamAudioSourceNode =
				audioContext.createMediaStreamSource(stream);
			const analyserNode = audioContext.createAnalyser();
			mediaStreamAudioSourceNode.connect(analyserNode);
			const pcmData = new Float32Array(analyserNode.fftSize);
			const onFrame = () => {
				analyserNode.getFloatTimeDomainData(pcmData);
				let sumSquares = 0.0;
				for (const amplitude of pcmData) {
					sumSquares += amplitude * amplitude;
				}
				let v = Math.sqrt(sumSquares / pcmData.length) * 100;
				this.mic.style.boxShadow = `0px 0px ${v * 1.2}px 1px rgba(98, 243, 103, 0.78) inset`;
				// console.log(v);

				this.mic.style.height = `${65 + v}px`;
				this.mic.style.width = `${65 + v}px`;

				this.animationFrameID = window.requestAnimationFrame(onFrame);
			};
			this.animationFrameID = window.requestAnimationFrame(onFrame);

			this.ws = new WebSocket(
				"wss://api.openai.com/v1/realtime?model=gpt-realtime",
				{
					headers: {
						Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
					},
				},
			);

			this.ws.on("open", () => {
				console.log("✅ Connecté à Realtime");

				this.ws.send(
					JSON.stringify({
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
										rate: 24000,
									},
									turn_detection: {
										type: "semantic_vad",
									},
								},
							},

							tools: [
								{
									type: "function",
									name: "run_actions",
									description:
										"Retourne les actions structurées à exécuter localement par l'application.",
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
																"audio.previous",
															],
														},
														place: { type: "string" },
														address: { type: "string" },
														level: { type: "number" },
														delta: { type: "number" },
														query: { type: "string" },
													},
													required: ["type"],
												},
											},
											reply: { type: "string" },
										},
										required: ["actions", "reply"],
									},
								},
							],

							tool_choice: "auto",
						},
					}),
				);

				this.startMicrophoneStreaming();
			});

			this.ws.on("message", async (raw) => {
				const event = JSON.parse(raw.toString());

				// Débogage utile
				if (
					event.type === "session.created" ||
					event.type === "session.updated" ||
					event.type === "input_audio_buffer.speech_started" ||
					event.type === "input_audio_buffer.speech_stopped" ||
					event.type === "response.created" ||
					event.type === "response.done"
				) {
					console.log("ℹ️", event.type);
				}

				// Quand le modèle a fini de générer les arguments de la fonction
				if (event.type === "response.function_call_arguments.done") {
					try {
						const args = JSON.parse(event.arguments);
						console.log("📦 Actions reçues:", JSON.stringify(args, null, 2));

						await this.executeActions(args);

						// On renvoie un résultat de fonction au modèle
						// pour garder la conversation cohérente.
						this.ws.send(
							JSON.stringify({
								type: "conversation.item.create",
								item: {
									type: "function_call_output",
									call_id: event.call_id,
									output: JSON.stringify({
										ok: true,
										executed: true,
									}),
								},
							}),
						);

						// Si tu veux ensuite que le modèle réponde en texte
						this.ws.send(
							JSON.stringify({
								type: "response.create",
								response: {
									output_modalities: ["text"],
								},
							}),
						);
					} catch (err) {
						console.error("❌ Erreur parsing/exécution:", err);
					}
				}

				// Texte assistant éventuel
				if (event.type === "response.output_text.done") {
					console.log("🤖", event.text);
					this.ws.close();
				}

				if (event.type === "error") {
					console.error("❌ Erreur Realtime:", JSON.stringify(event, null, 2));
				}
			});

			this.ws.on("close", () => {
				console.log("🔌 Connexion fermée");
				this.mic.style.boxShadow = `0px 0px 0px 1px rgba(0, 0, 0, 0) inset`;
				this.mic.style.height = `70px`;
				this.mic.style.width = `70px`;
				window.cancelAnimationFrame(this.animationFrameID);
				this.animationFrameID = null;
				analyserNode.disconnect();
				mediaStreamAudioSourceNode.disconnect();
				audioContext.close();
				stream.getTracks().forEach(function (track) {
					track.stop();
				});
				if (this.stopTimeout) {
					clearTimeout(this.stopTimeout);
					this.stopTimeout = null;
				}
				if (this.micProcess) {
					this.micProcess.kill("SIGTERM");
					this.micProcess = null;
				}
				this.ws = null
			});

			this.ws.on("error", (err) => {
				console.error("❌ WebSocket:", err);
			});

			// this.stopTimeout = setTimeout(() => {
			// 	if (this.recording) {
			// 		this.recording.stop();
			// 	}
			// }, 20000);
		});
	}

	startMicrophoneStreaming() {
		// Linux / ALSA : capture micro brut PCM 16-bit little-endian, mono, 24 kHz
		this.micProcess = spawn("arecord", [
			"-q",
			"-f",
			"S16_LE",
			"-c",
			"1",
			"-r",
			"24000",
			"-t",
			"raw",
		]);

		this.micProcess.stdout.on("data", (chunk) => {
			if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

			this.ws.send(
				JSON.stringify({
					type: "input_audio_buffer.append",
					audio: chunk.toString("base64"),
				}),
			);
		});

		this.micProcess.stderr.on("data", (data) => {
			const text = data.toString().trim();
			if (text) console.error("arecord:", text);
		});

		this.micProcess.on("close", (code) => {
			console.log(`🎤 Micro arrêté (code ${code})`);
		});

		console.log("🎤 Micro lancé, parle quand tu veux...");
	}

	async executeActions(payload) {
		const { actions = [], reply = "" } = payload;

		for (const action of actions) {
			switch (action.type) {
				case "gps.search":
					this.searchDirection(action.query);
					break;

				case "gps.navigate":
					console.log(`🧭 Navigation vers: ${action.address}`);
					break;

				case "audio.volume":
					console.log(`🔊 Volume à ${action.level}%`);
					break;

				case "audio.volume_delta":
					console.log(
						`🔊 Variation volume: ${action.delta > 0 ? "+" : ""}${action.delta}`,
					);
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

	searchDirection(query) {
		let placeName = query;
		mediaLoader.placeSearch.searchName(
			placeName,
			(places) => {
				this.clearWaypoints();
				this.clickNum = 0;
				this.selectedPlace = null;
				const bounds = new mapboxgl.LngLatBounds(
					...places.map((p) => [p.location.lng(), p.location.lat()]),
				);
				places.forEach(async (place) => {
					console.log(
						`Nom: ${place.displayName}\nAdresse: ${place.formattedAddress}`,
					);
					let dist = await mediaLoader.direction.getDistance([
						place.location.lng(),
						place.location.lat(),
					]);
					const placeElement = document.createElement("div");
					placeElement.className = "main-place";
					placeElement.addEventListener("click", () => {
						mediaLoader.direction.setMap({
							longitude: place.location.lng(),
							latitude: place.location.lat(),
						});
						if (this.selectedPlace !== placeElement) {
							this.clickNum = 1;
						} else {
							this.clickNum++;
						}
						this.selectedPlace = placeElement;
						if (this.clickNum == 1) {
							let i = -1;
							this.placesElementList.forEach((m) => {
								i++;
								if (m !== placeElement) {
									m.classList.add("back");
									m.classList.remove("selected");
								} else {
									m.classList.remove("back");
									m.classList.add("selected");
									this.placesList.classList.add("selected");

									this.placesList.style.setProperty(
										"--pointer",
										`${(i * this.placesList.clientHeight) / 4 + this.placesList.clientHeight / 8}px`,
									);
								}
							});
						} else {
							this.clearWaypoints();
							this.placesList.classList.remove("selected");
						}
					});
					this.addWaypoint(
						[place.location.lng(), place.location.lat()],
						bounds,
						placeElement,
					);

					const placeImage = document.createElement("img");
					placeImage.src = place.photos.length
						? place.photos[0].getURI({ maxHeight: 400 })
						: "./media/images/placeholder.jpg";
					placeImage.alt = "Place picture";
					placeImage.className = "main-place-image";

					const placeData = document.createElement("div");
					placeData.className = "main-place-data";

					const placeTitle = document.createElement("div");
					placeTitle.className = "main-place-title";
					placeTitle.textContent = place.displayName;

					const placeAddress = document.createElement("div");
					placeAddress.className = "main-place-address";
					placeAddress.textContent = place.formattedAddress;

					const placeReview = document.createElement("div");
					placeReview.className = "main-place-review";
					placeReview.innerHTML = this.formatReview(place);

					const placeDistance = document.createElement("div");
					placeDistance.className = "main-place-distance";
					placeDistance.innerHTML = `<span>${this.formatDistance(dist)}</span>`;

					placeData.appendChild(placeTitle);
					placeData.appendChild(placeAddress);
					placeData.appendChild(placeReview);

					placeElement.appendChild(placeImage);
					placeElement.appendChild(placeData);
					placeElement.appendChild(placeDistance);

					this.placesList.appendChild(placeElement);
				});
				mediaLoader.mapboxCamera.fitBounds(bounds);
			},
			{ max: 4 },
		);
	}

	formatReview(place) {
		let rate = place.rating;
		let intRate = Math.floor(rate);
		let semiRate = intRate < rate ? 1 : 0;
		let noRate = 5 - (intRate + semiRate);
		let result =
			`<span class="material-symbols-outlined filled">star</span>`.repeat(
				intRate,
			) +
			`<span class="material-symbols-outlined filled">star_half</span>`.repeat(
				semiRate,
			) +
			`<span class="material-symbols-outlined">star</span>`.repeat(noRate);
		return result;
	}
	formatDistance(dist) {
		if (dist.km) {
			return `${dist.km}.${(dist.m - (dist.m % 100)) / 100}km`;
		} else {
			return `${dist.m}m`;
		}
	}
	clearWaypoints() {
		this.waypointsList.forEach((m) => {
			m.remove();
			this.waypointsList.delete(m);
		});
		this.placesElementList.forEach((m) => {
			m.remove();
			this.placesElementList.delete(m);
		});
	}
	addWaypoint(coordinates, bounds, placeElement) {
		let m = new mapboxgl.Marker().setLngLat(coordinates);
		m.addTo(mediaLoader.map);
		this.waypointsList.add(m);
		this.placesElementList.add(placeElement);

		// bounds.extend(coordinates);
	}
}

module.exports = VoiceControl;
