const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d", { alpha: false });

const btnStart = document.getElementById("btnStart");
const btnMic = document.getElementById("btnMic");
const fileInput = document.getElementById("file");
const audioEl = document.getElementById("audio");

const fftSlider = document.getElementById("fft");
const fftVal = document.getElementById("fftVal");

let ac, analyser, srcNode, data;
let running = false;

const BANDS = 300;

// Resize canvas with devicePixelRatio for crisp bars
function resize() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(canvas.clientWidth * dpr);
  canvas.height = Math.floor(canvas.clientHeight * dpr);
}
window.addEventListener("resize", resize);
resize();

function ensureAudioContext() {
  if (ac) return;
  ac = new (window.AudioContext || window.webkitAudioContext)();

  analyser = ac.createAnalyser();
  analyser.smoothingTimeConstant = 0.75;

  setFFTSize(parseInt(fftSlider.value, 10));

  data = new Uint8Array(analyser.frequencyBinCount);

  fftSlider.addEventListener("input", () => {
    setFFTSize(parseInt(fftSlider.value, 10));
  });
}

function setFFTSize(size) {
  // fftSize must be power of two
  analyser.fftSize = size;
  fftVal.textContent = `${analyser.fftSize} (bins: ${analyser.frequencyBinCount})`;
  data = new Uint8Array(analyser.frequencyBinCount);
}

function connectSource(node) {
  // Clean previous
  try { srcNode?.disconnect(); } catch {}
  try { audioEl.pause(); } catch {}

  srcNode = node;
  srcNode.connect(analyser);
  analyser.connect(ac.destination);
}

function startRenderLoop() {
  if (running) return;
  running = true;

  const loop = () => {
    if (!running) return;
    analyser.getByteFrequencyData(data);

    // Clear
    ctx.fillStyle = "#0b0b10";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Build 300 band values by grouping FFT bins
    // frequencyBinCount depends on fftSize.
    const binCount = data.length;
    const binsPerBand = binCount / BANDS;

    const w = canvas.width;
    const h = canvas.height;

    const gap = Math.max(1, Math.floor(w / 900)); // small gap that scales
    const barW = (w - gap * (BANDS - 1)) / BANDS;

    // Optional: emphasize low frequencies a bit with a curve
    // (visual trick; not "true" equal energy per band)
    for (let i = 0; i < BANDS; i++) {
      const start = Math.floor(i * binsPerBand);
      const end = Math.floor((i + 1) * binsPerBand);

      let sum = 0;
      let count = 0;
      for (let b = start; b < end && b < binCount; b++) {
        sum += data[b];
        count++;
      }
      const avg = count ? (sum / count) : 0;

      // Nonlinear scaling for nicer visuals
      const v = Math.pow(avg / 255, 1.6);
      const barH = v * h;

      const x = i * (barW + gap);
      const y = h - barH;

      // Color by band index (simple gradient without hardcoding palette)
      const hue = (i / BANDS) * 280 + 40; // 40..320
      ctx.fillStyle = `hsl(${hue} 90% 55%)`;
      ctx.fillRect(x, y, barW, barH);
    }

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
}

async function startFromAudioElement() {
  ensureAudioContext();
  await ac.resume();

  // must be created after user gesture in many browsers
  const mediaSrc = ac.createMediaElementSource(audioEl);
  connectSource(mediaSrc);

  audioEl.loop = true;
  await audioEl.play();
  startRenderLoop();
}

btnStart.addEventListener("click", async () => {
  // Demo: generate a simple oscillator if no file loaded
  ensureAudioContext();
  await ac.resume();

  const osc = ac.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.value = 110;

  const gain = ac.createGain();
  gain.gain.value = 0.06;

  osc.connect(gain);
  connectSource(gain);

  osc.start();
  startRenderLoop();
});

btnMic.addEventListener("click", async () => {
  ensureAudioContext();
  await ac.resume();

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mic = ac.createMediaStreamSource(stream);
  connectSource(mic);
  startRenderLoop();
});

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  audioEl.src = url;
  await startFromAudioElement();
});
