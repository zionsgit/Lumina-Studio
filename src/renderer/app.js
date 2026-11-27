import {
  AbstractShapeBg, AestheticFluidBg, AmbientLightBg, BigBlobBg,
  BlurDotBg, BlurGradientBg, ChaosWavesBg, CurveGradientBg,
  GridArrayBg, RandomCubesBg, StepGradientBg, SwirlingCurvesBg,
  TrianglesMosaicBg, WavyWavesBg
} from 'color4bg';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { I18N, GEN_I18N, PARAM_I18N } from './i18n.js';
import { PALETTE_CATEGORIES } from './palettes.js';
import { growToOutput, capturePreviewSize, getPreviewSize } from './normalize.js';

/* ------------------------------------------------------------------ *
 * generators
 * ------------------------------------------------------------------ */

function presetColors(category, name) {
  const cat = PALETTE_CATEGORIES.find((c) => c.name === category);
  const p = cat?.palettes.find((x) => x.name === name);
  if (!p) return null;
  const six = p.colors.slice(0, 6);
  while (six.length < 6) six.push(p.colors[six.length % p.colors.length]);
  return six;
}

const PALETTES = {
  vivid: ['#F00911', '#F3AA00', '#F6EE0B', '#39E90D', '#195ED2', '#F00911'],
  pastel: ['#D1ADFF', '#98D69B', '#FAE390', '#FFACD8', '#7DD5FF', '#D1ADFF'],
  pastelglossy: ['#FE8BFC', '#BD9FFB', '#8EDBFD', '#C4F5EF', '#E7F9FE', '#E9FFE0'],
  blue: ['#007FFE', '#3099FE', '#60B2FE', '#90CCFE', '#C0E5FE', '#F0FFFE'],
  deep: ['#0F0B2C', '#1C193E', '#453E55', '#112D4A', '#0B1E3E', '#02101D']
};

const GENERATORS = [
  {
    id: 'ambient-light', name: 'Ambient Light', sub: 'Curl noise · RTT',
    cls: AmbientLightBg, colors: presetColors('Black', 'Shades Of Dark Blue') || PALETTES.deep,
    params: [
      { name: 'speed', label: 'Speed', min: 1, max: 10, step: 1, value: 1 },
      { name: 'pattern scale', label: 'Scale', min: 0, max: 1, step: 0.05, value: 1 },
      { name: 'edge blur', label: 'Blur', min: 0, max: 1, step: 0.01, value: 0 },
      { name: 'brightness', label: 'Shape', min: 0, max: 1.2, step: 0.01, value: 0.2 },
      { name: 'darkness', label: 'Background', min: 0, max: 1, step: 0.01, value: 0 }
    ]
  },
  {
    id: 'aesthetic-fluid', name: 'Aesthetic Fluid', sub: 'Fluid gradient · RTT',
    cls: AestheticFluidBg, colors: presetColors('Red', 'Red Monotone') || PALETTES.pastel,
    params: [{ name: 'scale', label: 'Scale', min: 0.01, max: 0.3, step: 0.01, value: 0.15 }]
  },
  {
    id: 'abstract-shape', name: 'Abstract Shape', sub: 'Noise shape',
    cls: AbstractShapeBg, colors: presetColors('Black', 'Cold & Dark') || PALETTES.blue,
    params: [
      { name: 'noise', label: 'Noise', min: 0, max: 0.5, step: 0.01, value: 0.1 },
      { name: 'wavy', label: 'Wavy', min: 0, max: 20, step: 1, value: 10 }
    ]
  },
  {
    id: 'big-blob', name: 'Big Blob', sub: 'Soft blob',
    cls: BigBlobBg, colors: presetColors('Black', 'Black-Purple Gradient') || PALETTES.pastel, params: []
  },
  {
    id: 'blur-dot', name: 'Blur Dot', sub: 'Soft dots',
    cls: BlurDotBg, colors: presetColors('Black and White', 'It’s In Black & White') || PALETTES.pastelglossy, params: []
  },
  {
    id: 'blur-gradient', name: 'Blur Gradient', sub: 'Soft gradient',
    cls: BlurGradientBg, colors: presetColors('Blue', 'Dark Ocean Waters') || PALETTES.pastelglossy,
    params: [{ name: 'noise', label: 'Noise', min: 0, max: 0.5, step: 0.01, value: 0.1 }]
  },
  {
    id: 'chaos-waves', name: 'Chaos Waves', sub: 'Wave field',
    cls: ChaosWavesBg, colors: presetColors('Green', 'Dark Grass') || PALETTES.pastel,
    params: [
      { name: 'noise', label: 'Noise', min: 0, max: 0.5, step: 0.01, value: 0.1 },
      { name: 'speed', label: 'Speed', min: 1, max: 20, step: 1, value: 1 }
    ]
  },
  {
    id: 'curve-gradient', name: 'Curve Gradient', sub: 'Curved bands',
    cls: CurveGradientBg, colors: presetColors('Red', 'Dark Reds Sample') || PALETTES.pastelglossy,
    params: [
      { name: 'noise', label: 'Noise', min: 0, max: 0.5, step: 0.01, value: 0.1 },
      { name: 'speed', label: 'Speed', min: 1, max: 20, step: 1, value: 1 },
      { name: 'scale', label: 'Scale', min: 0.01, max: 4, step: 0.01, value: 1 }
    ]
  },
  {
    id: 'grid-array', name: 'Grid Array', sub: 'Animated grid',
    cls: GridArrayBg, colors: presetColors('Blue', 'Dark Blue Monotone') || PALETTES.blue,
    params: [
      { name: 'scale', label: 'Scale', min: 1, max: 200, step: 1, value: 100 },
      { name: 'u_w', label: 'Width', min: 0.1, max: 0.99, step: 0.01, value: 0.8 },
      { name: 'u_h', label: 'Height', min: 0.1, max: 0.99, step: 0.01, value: 0.8 },
      { name: 'amplitude', label: 'Amplitude', min: 0, max: 5, step: 0.01, value: 0.5 },
      { name: 'radius', label: 'Radius', min: 0, max: 1, step: 0.01, value: 0.1 },
      { name: 'borderwidth', label: 'Border', min: 0.01, max: 0.1, step: 0.01, value: 0.01 },
      { name: 'rotateCanvas', label: 'Rotate canvas', min: 0, max: 360, step: 1, value: 0 },
      { name: 'rotateUnit', label: 'Rotate unit', min: 0, max: 360, step: 1, value: 0 },
      { name: 'speed', label: 'Speed', min: 1, max: 10, step: 1, value: 5 }
    ]
  },
  {
    id: 'random-cubes', name: 'Random Cubes', sub: 'Cubes',
    cls: RandomCubesBg, colors: presetColors('Black', 'Shades Of Indigo') || PALETTES.pastelglossy, params: []
  },
  {
    id: 'step-gradient', name: 'Step Gradient', sub: 'Band steps',
    cls: StepGradientBg, colors: presetColors('Black', 'Black-Purple Gradient') || PALETTES.pastel, params: []
  },
  {
    id: 'swirling-curves', name: 'Swirling Curves', sub: 'Curve field',
    cls: SwirlingCurvesBg, colors: presetColors('Black', 'Cold & Dark') || PALETTES.pastelglossy,
    params: [
      { name: 'noise', label: 'Noise', min: 0, max: 0.5, step: 0.01, value: 0.1 },
      { name: 'speed', label: 'Speed', min: 0.1, max: 5, step: 0.01, value: 0.1 },
      { name: 'density', label: 'Density', min: 100, max: 2000, step: 100, value: 1500 },
      { name: 'scale', label: 'Scale', min: 0.1, max: 50, step: 0.1, value: 8 }
    ]
  },
  {
    id: 'triangles-mosaic', name: 'Triangles Mosaic', sub: 'Triangle field',
    cls: TrianglesMosaicBg, colors: presetColors('Green', 'Trees In The Amazon') || PALETTES.pastel,
    params: [
      { name: 'noise', label: 'Noise', min: 0, max: 0.5, step: 0.01, value: 0.1 },
      { name: 'speed', label: 'Speed', min: 1, max: 10, step: 1, value: 10 }
    ]
  },
  {
    id: 'wavy-waves', name: 'Wavy Waves', sub: 'Wave bands',
    cls: WavyWavesBg, colors: presetColors('Blue', 'Shades Of Dark Blue') || PALETTES.pastelglossy, params: []
  }
];


const SCENE_PRESETS = [
  {
    id: 'black-red',
    image: './scenes/black-red.jpg',
    generator: 'blur-gradient',
    zh: '黑红模糊背景',
    en: 'Black-red blurred background',
    themeZh: '黑红',
    themeEn: 'black-and-red',
    colors: ['#ff000d', '#2b1e90', '#09001f', '#040f00'],
    params: { noise: 0.1 },
    seed: 94634
  },
  {
    id: 'blue-ambient',
    image: './scenes/blue-ambient.jpg',
    generator: 'ambient-light',
    zh: '蓝色氛围光背景',
    en: 'Blue ambient light background',
    themeZh: '蓝色',
    themeEn: 'blue',
    colors: ['#007ffe', '#3099fe', '#60b2fe', '#90ccfe', '#c0e5fe', '#f0fffe'],
    params: { speed: 1, 'pattern scale': 1, 'edge blur': 0, brightness: 0.2, darkness: 0 },
    seed: 1000
  },
  {
    id: 'black-blur',
    image: './scenes/black-blur.jpg',
    generator: 'blur-gradient',
    zh: '黑色模糊渐变背景',
    en: 'Black blur gradient background',
    themeZh: '黑色',
    themeEn: 'black',
    colors: ['#212832', '#3f4659', '#8592a7', '#17181c'],
    params: { noise: 0.1 },
    seed: 94634
  },
  {
    id: 'red-blur',
    image: './scenes/red-blur.jpg',
    generator: 'blur-gradient',
    zh: '红色模糊渐变背景',
    en: 'Red blur gradient background',
    themeZh: '红色',
    themeEn: 'red',
    colors: ['#ff6601', '#ffae00', '#ff2e2e', '#cb000a'],
    params: { noise: 0.1 },
    seed: 94634
  }
];

const PREVIEW_FPS = 60;
const MAX_SECONDS = 60;
const MAX_PIXELS = 3840 * 2160;

const state = {
  generator: 'aesthetic-fluid',
  lang: 'zh',
  colors: [],
  seed: 1000,
  params: {},
  previewFrame: 0,
  playing: true,
  exporting: false,
  transform: { rotation: 0, scale: 1 },
  paletteCategory: 'Pastel',
  favorites: [],
  recent: []
};

let previewBg = null;
let previewRaf = null;
let lastNow = 0;
let acc = 0;

/* ------------------------------------------------------------------ *
 * dom
 * ------------------------------------------------------------------ */

const $ = (id) => document.getElementById(id);
const els = {
  generatorList: $('generator-list'),
  colorRow: $('color-row'),
  random: $('btn-random'),
  seed: $('seed'),
  stage: $('stage'),
  frame: $('preview-frame'),
  badge: $('preview-badge'),
  play: $('btn-play'),
  scrub: $('scrub'),
  time: $('time-label'),
  params: $('params'),
  preset: $('preset'),
  width: $('exp-w'),
  height: $('exp-h'),
  fps: $('exp-fps'),
  bitrate: $('exp-bitrate'),
  inPoint: $('in-point'),
  outPoint: $('out-point'),
  loop: $('loop-mode'),
  fade: $('fade'),
  fadeRow: $('fade-row'),
  summary: $('export-summary'),
  progressBar: $('progress-bar'),
  progressText: $('progress-text'),
  status: $('status'),
  exportBtn: $('btn-export'),
  pngBtn: $('btn-png'),
  rot: $('rot'),
  rotOut: $('rot-out'),
  paletteBtn: $('btn-palettes'),
  paletteModal: $('palette-modal'),
  paletteCats: $('palette-cats'),
  paletteGrid: $('palette-grid'),
  paletteClose: $('palette-close'),
  sceneBtn: $('btn-scenes'),
  sceneModal: $('scene-modal'),
  sceneGrid: $('scene-grid'),
  sceneClose: $('scene-close')
};

function currentGen() {
  return GENERATORS.find((g) => g.id === state.generator) || GENERATORS[0];
}

function t(key, params = {}) {
  const dict = I18N[state.lang] || I18N.zh;
  let out = dict[key] ?? I18N.zh[key] ?? key;
  for (const [k, v] of Object.entries(params)) out = out.replaceAll(`{${k}}`, String(v));
  return out;
}

function genName(g) {
  return state.lang === 'zh' ? (GEN_I18N[g.id]?.name || g.name) : g.name;
}

function genSub(g) {
  return state.lang === 'zh' ? (GEN_I18N[g.id]?.sub || g.sub) : g.sub;
}

function paramLabel(p) {
  return state.lang === 'zh' ? (PARAM_I18N[p.label] || p.label) : p.label;
}

let lastStatus = { key: 'ready', params: {}, kind: '' };

function setStatusKey(key, params = {}, kind = '') {
  lastStatus = { key, params, kind };
  els.status.textContent = t(key, params);
  els.status.className = 'status' + (kind ? ' ' + kind : '');
}

function setStatusRaw(text, kind = '') {
  lastStatus = { raw: text, kind };
  els.status.textContent = text;
  els.status.className = 'status' + (kind ? ' ' + kind : '');
}

function translateError(err) {
  const msg = err?.message || String(err);
  const map = {
    'An export is already running.': 'alreadyExporting',
    'No H.264 encoder configuration supported on this machine.': 'noEncoder',
    'Width and height must be at least 64.': 'minSize',
    'Resolution exceeds the 3840 × 2160 pixel budget.': 'pixelBudget',
    'Duration must be between 1 and 60 seconds.': 'durationRange',
    'Direct save is unavailable.': 'directSave'
  };
  return map[msg] ? t(map[msg]) : msg;
}

/* ------------------------------------------------------------------ *
 * deterministic render
 * ------------------------------------------------------------------ */

function stopLibraryLoop(bg) {
  // The constructor schedules a RAF. Swap _update for a no-op so the
  // currently queued callback stops rescheduling after one frame.
  bg.loop = true;
  bg._update = () => {};
}

function renderBgFrame(bg, frame) {
  bg.frame = frame;
  if (typeof bg._animate === 'function') bg._animate();

  bg.gl.clearColor(0, 0, 0, 1);
  bg.renderer.render({ scene: bg.scene, camera: bg.camera });

  if (bg.isRenderTarget && bg.rttPlane && bg.rttCamera) {
    bg.gl.clearColor(0, 0, 0, 1);
    bg.renderer.render({ scene: bg.rttPlane, camera: bg.rttCamera, target: bg.rtt });
  }
  bg.gl.finish();
}

/* ------------------------------------------------------------------ *
 * preview
 * ------------------------------------------------------------------ */

function makePreviewBg() {
  if (previewBg) {
    try { previewBg.destroy(); } catch (_) {}
    previewBg = null;
  }
  els.stage.innerHTML = '';

  const gen = currentGen();
  const bg = new gen.cls({
    dom: 'stage',
    colors: state.colors.slice(),
    seed: state.seed,
    loop: true
  });
  const livePreview = new URLSearchParams(location.search).has('live');
  if (!livePreview) stopLibraryLoop(bg);
  bg.loop = true;

  for (const p of gen.params) {
    try { bg.update(p.name, state.params[p.name]); } catch (_) {}
  }

  previewBg = bg;
  capturePreviewSize(bg.gl && bg.gl.canvas);
  applyPreviewTransform();
  state.previewFrame = 0;
  els.scrub.value = '0';

  // let the queued RAF from the constructor settle
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (!previewBg) return;
    renderBgFrame(previewBg, 0);
    updateTimeUI();
  }));

  if (!livePreview && !previewRaf) startPreviewLoop();
}

function startPreviewLoop() {
  lastNow = performance.now();
  acc = 0;
  const step = 1000 / PREVIEW_FPS;

  const tick = (now) => {
    previewRaf = requestAnimationFrame(tick);
    if (!previewBg || !state.playing || state.exporting) {
      lastNow = now;
      return;
    }
    acc += now - lastNow;
    lastNow = now;
    if (acc > 120) acc = 120;
    const steps = Math.floor(acc / step);
    if (steps <= 0) return;
    acc -= steps * step;

    for (let i = 0; i < steps; i++) {
      renderBgFrame(previewBg, state.previewFrame);
      state.previewFrame++;
    }
    updateTimeUI();
  };

  previewRaf = requestAnimationFrame(tick);
}

function updateTimeUI() {
  const seconds = state.previewFrame / PREVIEW_FPS;
  els.time.textContent = t('seconds', { s: seconds.toFixed(2) });
  els.scrub.value = String(Math.min(state.previewFrame, Number(els.scrub.max)));
}

/* ------------------------------------------------------------------ *
 * generator / params / colors
 * ------------------------------------------------------------------ */

function renderGeneratorList() {
  els.generatorList.innerHTML = '';
  for (const g of GENERATORS) {
    const btn = document.createElement('button');
    btn.className = 'gen-item' + (g.id === state.generator ? ' active' : '');
    btn.innerHTML = `
      <span class="gen-thumb" style="background:${g.colors[2]};"></span>
      <span class="gen-meta"><span class="gen-name">${genName(g)}</span><br><span class="gen-sub">${genSub(g)}</span></span>
    `;
    btn.addEventListener('click', () => setGenerator(g.id));
    els.generatorList.appendChild(btn);
  }
}

function renderColors() {
  els.colorRow.innerHTML = '';
  state.colors.forEach((color, i) => {
    const chip = document.createElement('label');
    chip.className = 'color-chip';
    chip.style.background = color;
    const input = document.createElement('input');
    input.type = 'color';
    input.value = color;
    input.addEventListener('input', () => {
      state.colors[i] = input.value;
      chip.style.background = input.value;
      if (previewBg) previewBg.colors(state.colors.slice());
    });
    chip.appendChild(input);
    els.colorRow.appendChild(chip);
  });
}

function renderParams() {
  els.params.innerHTML = '';
  const gen = currentGen();
  for (const p of gen.params) {
    const wrap = document.createElement('div');
    wrap.className = 'param';
    const id = 'param-' + p.name.replace(/\s+/g, '-');
    wrap.innerHTML = `
      <label for="${id}">${paramLabel(p)}</label>
      <output>${formatParam(state.params[p.name], p.step)}</output>
      <input id="${id}" type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${state.params[p.name]}" />
    `;
    const input = wrap.querySelector('input');
    const out = wrap.querySelector('output');
    input.addEventListener('input', () => {
      const v = Number(input.value);
      state.params[p.name] = v;
      out.textContent = formatParam(v, p.step);
      if (previewBg) {
        try { previewBg.update(p.name, v); } catch (_) {}
      }
    });
    els.params.appendChild(wrap);
  }
}

function formatParam(v, step) {
  const decimals = String(step).includes('.') ? Math.min(2, String(step).split('.')[1].length) : 0;
  return Number(v).toFixed(decimals);
}

function setGenerator(id) {
  const gen = GENERATORS.find((g) => g.id === id);
  if (!gen) return;
  state.generator = id;
  state.colors = gen.colors.slice();
  state.params = {};
  for (const p of gen.params) state.params[p.name] = p.value;
  state.previewFrame = 0;
  renderGeneratorList();
  renderColors();
  renderParams();
  applyAspect();
  makePreviewBg();
}

/* ------------------------------------------------------------------ *
 * export settings
 * ------------------------------------------------------------------ */

function readSettings() {
  let width = Math.round(Number(els.width.value) || 3840);
  let height = Math.round(Number(els.height.value) || 2160);
  width = Math.max(64, Math.min(3840, width));
  height = Math.max(64, Math.min(2160, height));
  const fps = Number(els.fps.value) || 30;
  const bitrate = Number(els.bitrate.value) || 16;
  let inPoint = Math.max(0, Number(els.inPoint.value) || 0);
  let outPoint = Number(els.outPoint.value) || 0;
  if (outPoint <= inPoint) outPoint = inPoint + 1;
  outPoint = Math.min(inPoint + MAX_SECONDS, outPoint);
  const duration = outPoint - inPoint;
  const loopMode = els.loop.value;
  const fade = Math.max(0.2, Math.min(1, Number(els.fade.value) || 0.8));
  return { width, height, fps, bitrate, inPoint, outPoint, duration, loopMode, fade };
}

function even(n) {
  return n % 2 === 0 ? n : n - 1;
}

function applyAspect() {
  const s = readSettings();
  els.frame.style.aspectRatio = `${s.width} / ${s.height}`;
  els.badge.textContent = `${s.width} × ${s.height}`;
}

function updateSummary() {
  const s = readSettings();
  const outSeconds = s.loopMode === 'pingpong' ? s.duration * 2 : s.duration;
  const frames = Math.round(s.duration * s.fps);
  const outFrames = s.loopMode === 'pingpong' ? frames * 2 - 1 : frames;
  const mb = (s.bitrate * outSeconds) / 8;
  const loopKey = s.loopMode === 'crossfade' ? 'loopCrossfade' : s.loopMode === 'pingpong' ? 'loopPingpong' : 'loopCut';
  let loopLine = t('summaryLoop', { loop: t(loopKey) });
  if (s.loopMode === 'crossfade') loopLine += t('summaryFade', { fade: s.fade.toFixed(1) });
  els.summary.innerHTML = [
    t('summaryOutput', { seconds: outSeconds.toFixed(2), frames: outFrames }),
    loopLine,
    t('summarySize', { mb: mb.toFixed(1), bitrate: s.bitrate })
  ].join('<br>');
  els.fadeRow.style.display = s.loopMode === 'crossfade' ? 'grid' : 'none';
}

function applyPreset() {
  const v = els.preset.value;
  if (v === 'custom') return;
  const [w, h] = v.split('x').map(Number);
  els.width.value = w;
  els.height.value = h;
  applyAspect();
  updateSummary();
  // re-create preview at the new aspect
  makePreviewBg();
}

/* ------------------------------------------------------------------ *
 * encoder
 * ------------------------------------------------------------------ */


function coverScale(width, height, degrees) {
  const r = (degrees * Math.PI) / 180;
  const c = Math.abs(Math.cos(r));
  const s = Math.abs(Math.sin(r));
  return Math.max((width * c + height * s) / width, (width * s + height * c) / height);
}

function applyPreviewTransform() {
  const canvas = els.stage.querySelector('canvas');
  if (!canvas) return;
  const s = readSettings();
  const factor = coverScale(s.width, s.height, state.transform.rotation) * state.transform.scale;
  canvas.style.transformOrigin = '50% 50%';
  canvas.style.transform = `rotate(${state.transform.rotation}deg) scale(${factor})`;
}

function setTransform(rotation) {
  state.transform.rotation = ((Number(rotation) || 0) % 360 + 360) % 360;
  state.transform.scale = 1;
  els.rot.value = String(state.transform.rotation);
  els.rotOut.textContent = `${state.transform.rotation}°`;
  applyPreviewTransform();
}

function makeTransformCanvas(source, width, height, rotation, scale, reuse) {
  if (rotation === 0 && scale === 1) return source;
  const out = reuse || document.createElement('canvas');
  out.width = width;
  out.height = height;
  const ctx = out.getContext('2d', { alpha: false });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);
  ctx.translate(width / 2, height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  const factor = coverScale(width, height, rotation) * scale;
  ctx.scale(factor, factor);
  ctx.drawImage(source, -width / 2, -height / 2, width, height);
  return out;
}


function previewPixelSize() {
  const live = previewBg && previewBg.gl && previewBg.gl.canvas;
  if (live && live.width > 0) return { width: live.width, height: live.height };
  return getPreviewSize() || { width: 1080, height: 608 };
}

async function pickCodec(width, height, fps, bitrate) {
  if (typeof VideoEncoder === 'undefined') {
    throw new Error('Hardware video encoding is unavailable in this build.');
  }
  const pixels = width * height;
  // Level 5.1 covers 4K; fall back through lower levels and the Main profile so
  // machines whose Media Foundation encoder is more limited still work.
  const candidates = pixels > 1920 * 1080
    ? ['avc1.640034', 'avc1.640033', 'avc1.640032', 'avc1.640028', 'avc1.4D4033']
    : ['avc1.640028', 'avc1.4D4028', 'avc1.640033', 'avc1.42E01E'];

  for (const codec of candidates) {
    try {
      const support = await VideoEncoder.isConfigSupported({
        codec, width, height, bitrate: bitrate * 1_000_000, framerate: fps
      });
      if (support.supported) return codec;
    } catch (_) {}
  }
  throw new Error('No H.264 encoder configuration supported on this machine.');
}


function createBgPreserved(Cls, params) {
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, attrs) {
    if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
      attrs = Object.assign({}, attrs, { preserveDrawingBuffer: true });
    }
    return orig.call(this, type, attrs);
  };
  try {
    return new Cls(params);
  } finally {
    HTMLCanvasElement.prototype.getContext = orig;
  }
}

async function exportMP4(options = {}) {
  if (state.exporting) throw new Error('An export is already running.');
  const s = readSettings();
  const width = even(s.width);
  const height = even(s.height);
  if (width < 64 || height < 64) throw new Error('Width and height must be at least 64.');
  if (width * height > MAX_PIXELS) throw new Error('Resolution exceeds the 3840 × 2160 pixel budget.');
  if (s.duration <= 0 || s.duration > MAX_SECONDS) throw new Error('Duration must be between 1 and 60 seconds.');

  state.exporting = true;
  els.exportBtn.disabled = true;
  els.progressBar.style.width = '0%';
  setStatusKey('preparing');

  const gen = currentGen();
  const reference = previewPixelSize();
  const buildWidth = Math.max(2, Math.round(reference.width));
  const buildHeight = Math.max(2, Math.round((buildWidth * height) / width));
  const stage = document.createElement('div');
  stage.id = 'export-stage';
  stage.style.cssText = `position:fixed;left:-20000px;top:0;width:${buildWidth}px;height:${buildHeight}px;`;
  document.body.appendChild(stage);

  let bg = null;
  let encoder = null;
  let muxer = null;
  const tail = [];
  const transformCanvas = document.createElement('canvas');
  const rotation = state.transform.rotation;
  const zoom = state.transform.scale;

  const cleanup = () => {
    for (const b of tail) { try { b.close(); } catch (_) {} }
    tail.length = 0;
    if (encoder && encoder.state !== 'closed') { try { encoder.close(); } catch (_) {} }
    if (bg) { try { bg.destroy(); } catch (_) {} }
    stage.remove();
    state.exporting = false;
    els.exportBtn.disabled = false;
  };

  try {
    bg = createBgPreserved(gen.cls, {
      dom: 'export-stage',
      colors: state.colors.slice(),
      seed: state.seed,
      loop: true
    });
    stopLibraryLoop(bg);
    bg.loop = true;
    for (const p of gen.params) {
      try { bg.update(p.name, state.params[p.name]); } catch (_) {}
    }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    growToOutput(bg, width, height);

    const bitrate = s.bitrate;
    const codec = await pickCodec(width, height, s.fps, bitrate);
    muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: { codec: 'avc', width, height, frameRate: s.fps },
      fastStart: 'in-memory'
    });
    encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => { throw e; }
    });
    encoder.configure({
      codec,
      width,
      height,
      bitrate: bitrate * 1_000_000,
      framerate: s.fps,
      latencyMode: 'quality',
      avc: { format: 'avc' }
    });

    const totalFrames = Math.max(1, Math.round(s.duration * s.fps));
    const fadeFrames = s.loopMode === 'crossfade'
      ? Math.max(1, Math.min(totalFrames - 1, Math.round(s.fade * s.fps)))
      : 0;

    // Pre-render the tail used by the crossfade. The first output frame
    // becomes the tail's first frame, so output[last] -> output[0] is seamless.
    for (let k = 0; k < fadeFrames; k++) {
      const animTime = s.inPoint + s.duration + k / s.fps;
      renderBgFrame(bg, Math.round(animTime * PREVIEW_FPS));
      const tailSource = makeTransformCanvas(bg.gl.canvas, width, height, rotation, zoom, transformCanvas);
      tail.push(await createImageBitmap(tailSource));
      setProgress(0, totalFrames, 'prerenderTail');
    }

    const blend = document.createElement('canvas');
    blend.width = width;
    blend.height = height;
    const blendCtx = blend.getContext('2d', { alpha: false });

    const outputFrames = s.loopMode === 'pingpong' ? totalFrames * 2 - 1 : totalFrames;

    for (let i = 0; i < outputFrames; i++) {
      const srcIndex = s.loopMode === 'pingpong'
        ? (i < totalFrames ? i : totalFrames * 2 - 2 - i)
        : i;
      const t = srcIndex / s.fps;
      renderBgFrame(bg, Math.round((s.inPoint + t) * PREVIEW_FPS));

      let source = makeTransformCanvas(bg.gl.canvas, width, height, rotation, zoom, transformCanvas);
      if (fadeFrames > 0 && i < fadeFrames) {
        blendCtx.globalAlpha = 1;
        blendCtx.drawImage(tail[i], 0, 0, width, height);
        blendCtx.globalAlpha = i / fadeFrames;
        blendCtx.drawImage(bg.gl.canvas, 0, 0, width, height);
        blendCtx.globalAlpha = 1;
        source = blend;
      }

      const frame = new VideoFrame(source, {
        timestamp: Math.round((i * 1_000_000) / s.fps),
        duration: Math.round(1_000_000 / s.fps)
      });
      encoder.encode(frame, { keyFrame: i % (s.fps * 2) === 0 });
      frame.close();

      if (encoder.encodeQueueSize > 6) {
        await new Promise((r) => setTimeout(r, 0));
      }
      if (i % 3 === 0) {
        setProgress(i + 1, outputFrames, 'encodingFrame', { i: i + 1, total: outputFrames });
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    setStatusKey('finalizing');
    await encoder.flush();
    encoder.close();
    encoder = null;
    muxer.finalize();
    const buffer = muxer.target.buffer;

    const name = `color4bg-${gen.id}-${width}x${height}-${s.fps}fps-${s.duration.toFixed(1)}s.mp4`;
    let saved = null;
    if (options.autoSavePath) {
      if (!window.desktop?.saveBufferDirect) throw new Error('Direct save is unavailable.');
      await window.desktop.saveBufferDirect(buffer, options.autoSavePath);
      saved = options.autoSavePath;
    } else if (window.desktop?.saveFile) {
      saved = await window.desktop.saveFile(buffer, name);
    }

    setProgress(outputFrames, outputFrames, 'done');
    if (saved) {
      setStatusKey('saved', { path: saved }, 'ok');
    } else {
      setStatusKey('cancelled');
    }
    return saved;
  } catch (err) {
    console.error(err);
    setStatusKey('exportFailed', { msg: translateError(err) }, 'err');
    throw err;
  } finally {
    cleanup();
  }
}

async function exportPng() {
  const s = readSettings();
  const width = even(s.width);
  const height = even(s.height);
  const reference = previewPixelSize();
  const buildWidth = Math.max(2, Math.round(reference.width));
  const buildHeight = Math.max(2, Math.round((buildWidth * height) / width));
  const stage = document.createElement('div');
  stage.id = 'png-stage';
  stage.style.cssText = `position:fixed;left:-20000px;top:0;width:${buildWidth}px;height:${buildHeight}px;`;
  document.body.appendChild(stage);
  let bg = null;
  try {
    bg = createBgPreserved(currentGen().cls, {
      dom: 'png-stage',
      colors: state.colors.slice(),
      seed: state.seed,
      loop: true
    });
    stopLibraryLoop(bg);
    bg.loop = true;
    for (const p of currentGen().params) {
      try { bg.update(p.name, state.params[p.name]); } catch (_) {}
    }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    growToOutput(bg, width, height);
    renderBgFrame(bg, state.previewFrame);
    const pngSource = makeTransformCanvas(bg.gl.canvas, width, height, state.transform.rotation, state.transform.scale);
    const blob = await new Promise((resolve) => pngSource.toBlob(resolve, 'image/png'));
    const buffer = await blob.arrayBuffer();
    const name = `color4bg-${currentGen().id}-${width}x${height}.png`;
    const saved = window.desktop?.saveFile ? await window.desktop.saveFile(buffer, name) : null;
    if (saved) setStatusKey('pngSaved', { path: saved }, 'ok'); else setStatusKey('pngCancelled');
  } catch (e) {
    setStatusKey('exportFailed', { msg: translateError(e) }, 'err');
  } finally {
    if (bg) { try { bg.destroy(); } catch (_) {} }
    stage.remove();
  }
}

let lastProgress = { done: 0, total: 0, key: '', params: {} };

function setProgress(done, total, key = '', params = {}) {
  lastProgress = { done, total, key, params };
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  els.progressBar.style.width = pct + '%';
  els.progressText.textContent = key ? t(key, params) : '';
}


function updateLangButtons() {
  document.querySelectorAll('.lang-switch button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === state.lang);
  });
}

function applyLanguage() {
  document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : 'en';
  const side = document.querySelector('.sidebar');
  const insp = document.querySelector('.inspector');
  const sideScroll = side ? side.scrollTop : 0;
  const inspScroll = insp ? insp.scrollTop : 0;

  for (const el of document.querySelectorAll('[data-i18n]')) {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  }

  els.play.textContent = state.playing ? t('pause') : t('play');
  els.play.title = `${t('pause')} / ${t('play')}`;

  renderGeneratorList();
  renderParams();
  updateSummary();
  updateTimeUI();

  if (lastStatus.raw) {
    els.status.textContent = lastStatus.raw;
    els.status.className = 'status' + (lastStatus.kind ? ' ' + lastStatus.kind : '');
  } else {
    els.status.textContent = t(lastStatus.key, lastStatus.params);
    els.status.className = 'status' + (lastStatus.kind ? ' ' + lastStatus.kind : '');
  }

  if (lastProgress.key) els.progressText.textContent = t(lastProgress.key, lastProgress.params);
  els.paletteClose.setAttribute('aria-label', t('close'));
  els.sceneClose.setAttribute('aria-label', t('close'));
  if (els.paletteModal.classList.contains('open')) {
    renderPaletteCats();
    renderPaletteGrid();
  }
  if (els.sceneModal.classList.contains('open')) {
    renderSceneGrid();
  }
  updateLangButtons();
  if (side) side.scrollTop = sideScroll;
  if (insp) insp.scrollTop = inspScroll;
}

function setLanguage(lang) {
  state.lang = lang === 'en' ? 'en' : 'zh';
  try { localStorage.setItem('studio.lang', state.lang); } catch (_) {}
  applyLanguage();
}


function loadStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

function saveStored(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
}

function findPalette(category, name) {
  const cat = PALETTE_CATEGORIES.find((c) => c.name === category);
  return cat?.palettes.find((p) => p.name === name) || null;
}

function allPaletteCategories() {
  const favorites = state.favorites.map((f) => {
    const p = findPalette(f.category, f.name);
    return p ? { name: p.name, colors: p.colors, category: f.category } : null;
  }).filter(Boolean);
  const recent = state.recent.map((r) => ({ name: r.name, colors: r.colors, category: r.category }));
  return [
    { name: '__favorites', zh: '收藏', en: 'Favorites', special: true, dot: '#c8a15a', palettes: favorites },
    { name: '__recent', zh: '最近使用', en: 'Recent', special: true, dot: '#6f6a62', palettes: recent },
    ...PALETTE_CATEGORIES
  ];
}

function paletteCatLabel(cat) {
  return state.lang === 'zh' ? (cat.zh || cat.name) : (cat.en || cat.name);
}

function paletteCatDot(cat) {
  return cat.dot || cat.palettes[0]?.colors[0] || '#888';
}

function isFavorite(category, name) {
  return state.favorites.some((f) => f.category === category && f.name === name);
}

function openPaletteModal() {
  const cats = allPaletteCategories();
  if (!cats.some((c) => c.name === state.paletteCategory)) {
    state.paletteCategory = cats.find((c) => c.name === 'Pastel')?.name || cats[0]?.name || '';
  }
  renderPaletteCats();
  renderPaletteGrid();
  els.paletteModal.classList.add('open');
  els.paletteModal.setAttribute('aria-hidden', 'false');
  els.paletteClose.setAttribute('aria-label', t('close'));
  els.paletteClose.focus();
}

function closePaletteModal() {
  els.paletteModal.classList.remove('open');
  els.paletteModal.setAttribute('aria-hidden', 'true');
}

function renderPaletteCats() {
  els.paletteCats.innerHTML = '';
  for (const cat of allPaletteCategories()) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'palette-cat' + (cat.special ? ' special' : '') + (cat.name === state.paletteCategory ? ' active' : '');
    btn.innerHTML = `<span class="dot" style="background:${paletteCatDot(cat)}"></span><span>${paletteCatLabel(cat)}</span>`;
    btn.addEventListener('click', () => {
      state.paletteCategory = cat.name;
      renderPaletteCats();
      renderPaletteGrid();
    });
    els.paletteCats.appendChild(btn);
  }
}

function renderPaletteGrid() {
  els.paletteGrid.innerHTML = '';
  const cat = allPaletteCategories().find((c) => c.name === state.paletteCategory);
  if (!cat) return;

  if (!cat.palettes.length) {
    const empty = document.createElement('div');
    empty.className = 'palette-empty';
    empty.textContent = t(cat.name === '__favorites' ? 'noFavorites' : 'noRecent');
    els.paletteGrid.appendChild(empty);
    return;
  }

  for (const p of cat.palettes) {
    const category = p.category || cat.name;
    const card = document.createElement('div');
    card.className = 'palette-card';
    card.setAttribute('role', 'button');
    card.tabIndex = 0;

    const strip = document.createElement('div');
    strip.className = 'palette-strip';
    for (const color of p.colors) {
      const sw = document.createElement('span');
      sw.style.background = color;
      strip.appendChild(sw);
    }

    const name = document.createElement('div');
    name.className = 'palette-name';
    name.textContent = p.name;
    name.title = p.name;

    const fav = isFavorite(category, p.name);
    const star = document.createElement('button');
    star.type = 'button';
    star.className = 'palette-star' + (fav ? ' fav' : '');
    star.textContent = fav ? '★' : '☆';
    star.title = t(fav ? 'unfavorite' : 'favorite');
    star.setAttribute('aria-label', star.title);
    star.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(category, p.name);
    });

    card.appendChild(strip);
    card.appendChild(name);
    card.appendChild(star);
    const apply = () => applyPalette(p.colors, p.name, category);
    card.addEventListener('click', apply);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        apply();
      }
    });
    els.paletteGrid.appendChild(card);
  }
}

function toggleFavorite(category, name) {
  const idx = state.favorites.findIndex((f) => f.category === category && f.name === name);
  if (idx >= 0) state.favorites.splice(idx, 1);
  else state.favorites.push({ category, name });
  saveStored('lumina.favorites.v1', state.favorites);
  renderPaletteCats();
  renderPaletteGrid();
}

function recordRecent(category, name, colors) {
  state.recent = [
    { category, name, colors: colors.slice() },
    ...state.recent.filter((r) => !(r.category === category && r.name === name))
  ].slice(0, 12);
  saveStored('lumina.recent.v1', state.recent);
}

function applyPalette(colors, name, category) {
  const base = colors.filter(Boolean);
  if (!base.length) return;
  const six = base.slice(0, 6);
  while (six.length < 6) six.push(base[six.length % base.length]);
  state.colors = six;
  renderColors();
  if (previewBg) previewBg.colors(state.colors.slice());
  recordRecent(category || state.paletteCategory, name, six);
  closePaletteModal();
  setStatusKey('paletteApplied', { name }, 'ok');
}


function sceneTitle(scene) {
  return state.lang === 'zh' ? scene.zh : scene.en;
}

function sceneTheme(scene) {
  return state.lang === 'zh' ? scene.themeZh : scene.themeEn;
}

function renderSceneGrid() {
  els.sceneGrid.innerHTML = '';
  for (const scene of SCENE_PRESETS) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'scene-card';

    const img = document.createElement('img');
    img.className = 'scene-thumb';
    img.src = scene.image;
    img.alt = sceneTitle(scene);
    img.draggable = false;

    const meta = document.createElement('div');
    meta.className = 'scene-meta';
    const name = document.createElement('div');
    name.className = 'scene-name';
    name.textContent = sceneTitle(scene);
    const theme = document.createElement('div');
    theme.className = 'scene-theme';
    theme.textContent = `${t('theme')} · ${sceneTheme(scene)}`;
    meta.appendChild(name);
    meta.appendChild(theme);

    card.appendChild(img);
    card.appendChild(meta);
    card.addEventListener('click', () => applyScene(scene));
    els.sceneGrid.appendChild(card);
  }
}

function openSceneModal() {
  renderSceneGrid();
  els.sceneModal.classList.add('open');
  els.sceneModal.setAttribute('aria-hidden', 'false');
  els.sceneClose.setAttribute('aria-label', t('close'));
  els.sceneClose.focus();
}

function closeSceneModal() {
  els.sceneModal.classList.remove('open');
  els.sceneModal.setAttribute('aria-hidden', 'true');
}

function applyScene(scene) {
  const gen = GENERATORS.find((g) => g.id === scene.generator);
  if (!gen) return;
  state.generator = scene.generator;
  state.seed = scene.seed;
  state.params = {};
  for (const p of gen.params) state.params[p.name] = p.value;
  Object.assign(state.params, scene.params);
  const six = scene.colors.slice(0, 6);
  while (six.length < 6) six.push(scene.colors[six.length % scene.colors.length]);
  state.colors = six;
  state.previewFrame = 0;
  els.seed.value = String(state.seed);
  renderGeneratorList();
  renderColors();
  renderParams();
  applyAspect();
  makePreviewBg();
  setTransform(0);
  closeSceneModal();
  setStatusKey('sceneApplied', { name: sceneTitle(scene) }, 'ok');
}

/* ------------------------------------------------------------------ *
 * events
 * ------------------------------------------------------------------ */

function bind() {
  els.seed.addEventListener('change', () => {
    state.seed = Math.max(1, Math.round(Number(els.seed.value) || 1000));
    els.seed.value = state.seed;
    if (previewBg) {
      previewBg.reset(state.seed);
      state.previewFrame = 0;
      requestAnimationFrame(() => renderBgFrame(previewBg, 0));
    }
  });

  els.random.addEventListener('click', () => {
    state.colors = state.colors.map(() => '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'));
    renderColors();
    if (previewBg) previewBg.colors(state.colors.slice());
  });

  els.paletteBtn.addEventListener('click', openPaletteModal);
  els.paletteClose.addEventListener('click', closePaletteModal);
  els.paletteModal.addEventListener('click', (e) => {
    if (e.target === els.paletteModal) closePaletteModal();
  });
  els.sceneBtn.addEventListener('click', openSceneModal);
  els.sceneClose.addEventListener('click', closeSceneModal);
  els.sceneModal.addEventListener('click', (e) => {
    if (e.target === els.sceneModal) closeSceneModal();
  });

  els.play.addEventListener('click', () => {
    state.playing = !state.playing;
    els.play.textContent = state.playing ? t('pause') : t('play');
  });

  els.rot.addEventListener('input', () => {
    state.transform.rotation = Number(els.rot.value);
    els.rotOut.textContent = `${state.transform.rotation}°`;
    applyPreviewTransform();
  });


  els.scrub.addEventListener('input', () => {
    state.previewFrame = Number(els.scrub.value);
    if (previewBg) renderBgFrame(previewBg, state.previewFrame);
    updateTimeUI();
  });

  for (const el of [els.width, els.height]) {
    el.addEventListener('change', () => {
      els.preset.value = 'custom';
      applyAspect();
      updateSummary();
      makePreviewBg();
    });
  }

  els.preset.addEventListener('change', applyPreset);
  for (const el of [els.fps, els.bitrate, els.inPoint, els.outPoint, els.loop, els.fade]) {
    el.addEventListener('input', updateSummary);
    el.addEventListener('change', updateSummary);
  }

  els.exportBtn.addEventListener('click', () => {
    exportMP4().catch(() => {});
  });
  els.pngBtn.addEventListener('click', () => { exportPng().catch(() => {}); });

  document.querySelectorAll('.lang-switch button').forEach((btn) => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && els.paletteModal.classList.contains('open')) {
      closePaletteModal();
      return;
    }
    if (e.key === 'Escape' && els.sceneModal.classList.contains('open')) {
      closeSceneModal();
      return;
    }
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault();
      els.play.click();
    }
  });
}

/* ------------------------------------------------------------------ *
 * boot
 * ------------------------------------------------------------------ */

function init() {
  try {
    const saved = localStorage.getItem('studio.lang');
    if (saved === 'en' || saved === 'zh') state.lang = saved;
  } catch (_) {}

  state.favorites = loadStored('lumina.favorites.v1', []);
  state.recent = loadStored('lumina.recent.v1', []);
  if (!Array.isArray(state.favorites)) state.favorites = [];
  if (!Array.isArray(state.recent)) state.recent = [];

  const gen = currentGen();
  state.colors = gen.colors.slice();
  state.params = {};
  for (const p of gen.params) state.params[p.name] = p.value;

  els.scrub.max = String(MAX_SECONDS * PREVIEW_FPS);
  renderColors();
  applyLanguage();
  bind();
  applyAspect();
  makePreviewBg();

  const params = new URLSearchParams(location.search);
  if (params.get('lang') === 'en' || params.get('lang') === 'zh') {
    setLanguage(params.get('lang'));
  }
  if (params.get('gen') && params.get('gen') !== state.generator) {
    setGenerator(params.get('gen'));
  }
  if (params.has('rot')) {
    setTransform(params.get('rot') || 0);
  }

  // automation / debugging hook
  window.__studio = {
    state,
    exportMP4,
    setGenerator,
    makePreviewBg,
    renderBgFrame,
    readSettings,
    setTransform,
    applyPreviewTransform,
    openPaletteModal,
    openSceneModal
  };
}

init();
