import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const canvas = document.getElementById("universe-canvas");
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1;

const zoomSlider = document.getElementById("zoom-slider");
const timeSlider = document.getElementById("time-slider");
const tourButton = document.getElementById("tour-btn");
const resetButton = document.getElementById("reset-btn");
const audioButton = document.getElementById("audio-btn");
const narrationButton = document.getElementById("narration-btn");
const mediaStatus = document.getElementById("media-status");
const modeLabel = document.getElementById("mode-label");
const destinationLabel = document.getElementById("destination-label");
const destinationGrid = document.getElementById("destination-grid");
const prevBodyButton = document.getElementById("prev-body-btn");
const nextBodyButton = document.getElementById("next-body-btn");
const tourKicker = document.getElementById("tour-kicker");
const tourTitle = document.getElementById("tour-title");
const tourDescription = document.getElementById("tour-description");
const tourStepCount = document.getElementById("tour-step-count");
const tourProgressFill = document.getElementById("tour-progress-fill");
const tourVisit = document.getElementById("tour-visit");
const tourHighlight = document.getElementById("tour-highlight");
const tourStopButton = document.getElementById("tour-stop-btn");
const tourNarrationButton = document.getElementById("tour-narration-btn");

const focusLabel = document.getElementById("focus-label");
const scaleLabel = document.getElementById("scale-label");
const eraLabel = document.getElementById("era-label");
const expansionLabel = document.getElementById("expansion-label");
const objectType = document.getElementById("object-type");
const objectTitle = document.getElementById("object-title");
const objectDescription = document.getElementById("object-description");
const factMoons = document.getElementById("fact-moons");
const factAtmosphere = document.getElementById("fact-atmosphere");
const factDay = document.getElementById("fact-day");
const factTemp = document.getElementById("fact-temp");
const factDiameter = document.getElementById("fact-diameter");
const factGravity = document.getElementById("fact-gravity");
const factDistance = document.getElementById("fact-distance");
const factYear = document.getElementById("fact-year");
const factCompare = document.getElementById("fact-compare");
const factNote = document.getElementById("fact-note");

const canvasTooltip = document.createElement("div");
canvasTooltip.className = "canvas-tooltip";
document.body.appendChild(canvasTooltip);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;
const MIN_CAMERA_DISTANCE = 7;
const MAX_CAMERA_DISTANCE = 180;

const state = {
  width: window.innerWidth,
  height: window.innerHeight,
  mode: "interactive",
  selectedBody: "sun",
  hoveredBody: null,
  audioEnabled: false,
  narrationEnabled: false,
  time: 0.42,
  targetTime: 0.42,
  cameraDistance: 58,
  targetCameraDistance: 58,
  yaw: 0.28,
  targetYaw: 0.28,
  pitch: 0.2,
  targetPitch: 0.2,
  dragging: false,
  lastX: 0,
  lastY: 0,
  tourStepIndex: 0,
  tourStepElapsed: 0,
  bodyScreenPositions: {},
  galacticOrbitAngle: 0,
  narratedStepKey: null,
  narrationSpeaking: false,
  narrationToken: 0,
  introActive: true,
  introElapsed: 0,
  transitionBoost: 0,
  lastPinchDist: null,
};

// Tracks all active pointer IDs for multi-touch gesture support
const activePointers = new Map();

const bodies = {
  sun: {
    id: "sun",
    name: "Sun",
    shortType: "G-Type Star",
    color: "#ffd17d",
    radius: 8.6,
    orbitRadius: 0,
    orbitSpeed: 0,
    visitDistance: 29,
    facts: {
      moons: "0",
      atmosphere: "Mostly hydrogen and helium",
      day: "Rotates in about 25-35 Earth days",
      temperature: "About 5,500 C at the surface",
      diameter: "1.39 million km",
      gravity: "274 m/s² at the photosphere",
      distance: "About 26,000 light-years from Sagittarius A*",
      year: "About 230 million years around the Milky Way",
      compare: "Compared with Earth, the Sun is not a place to stand on. It is the energy source that makes Earth's climate and life possible.",
      note: "Learning cue: the Sun is a star, not a planet. Its gravity holds the solar system together and its energy drives climates and weather on nearby worlds.",
    },
    description:
      "The Sun is the central star of our solar system and the main source of light and heat for every planet that orbits it.",
  },
  mercury: {
    id: "mercury",
    name: "Mercury",
    shortType: "Rocky Planet",
    color: "#bca18d",
    radius: 0.62,
    orbitRadius: 18,
    orbitSpeed: 4.7,
    visitDistance: 8.5,
    facts: {
      moons: "0",
      atmosphere: "Thin exosphere with oxygen, sodium, hydrogen, helium, and potassium",
      day: "One solar day lasts 176 Earth days",
      temperature: "About -180 C to 430 C",
      diameter: "4,879 km",
      gravity: "3.7 m/s²",
      distance: "57.9 million km",
      year: "88 Earth days",
      compare: "Compared with Earth, Mercury is much smaller, has almost no atmosphere, and experiences far more extreme temperature swings.",
      note: "Learning cue: Mercury shows what happens when a world has almost no atmosphere. Without insulation, daytime and nighttime temperatures become extreme.",
    },
    description:
      "Mercury is the closest planet to the Sun and races around it faster than any other planet in the solar system.",
  },
  venus: {
    id: "venus",
    name: "Venus",
    shortType: "Rocky Planet",
    color: "#dfbf8a",
    radius: 1.08,
    orbitRadius: 30,
    orbitSpeed: 3.5,
    visitDistance: 9.5,
    facts: {
      moons: "0",
      atmosphere: "About 96.5% carbon dioxide and 3.5% nitrogen",
      day: "243 Earth days, and it spins backward",
      temperature: "About 465 C average",
      diameter: "12,104 km",
      gravity: "8.9 m/s²",
      distance: "108.2 million km",
      year: "225 Earth days",
      compare: "Compared with Earth, Venus is nearly Earth-sized but has a toxic atmosphere and runaway greenhouse heating that makes it far less habitable.",
      note: "Learning cue: Venus is a greenhouse warning. Its thick carbon dioxide atmosphere traps heat so effectively that it is even hotter than Mercury.",
    },
    description:
      "Venus is a rocky planet wrapped in bright clouds, but beneath them lies a crushing atmosphere and the hottest surface of any planet.",
  },
  earth: {
    id: "earth",
    name: "Earth",
    shortType: "Ocean World",
    color: "#70b7ff",
    radius: 1.16,
    orbitRadius: 42,
    orbitSpeed: 2.9,
    visitDistance: 10,
    facts: {
      moons: "1",
      atmosphere: "About 78% nitrogen, 21% oxygen, plus argon and trace gases",
      day: "24 hours",
      temperature: "About 15 C average",
      diameter: "12,756 km",
      gravity: "9.8 m/s²",
      distance: "149.6 million km",
      year: "365 days",
      compare: "Earth is the reference world in this tour: breathable air, liquid water, moderate temperatures, and a year length that defines our calendar.",
      note: "Learning cue: Earth stands out because it combines liquid water, moderate temperatures, and an atmosphere shaped in part by life itself.",
    },
    description:
      "Earth is an ocean world with a breathable atmosphere, active geology, and the only known surface where life is widespread.",
  },
  mars: {
    id: "mars",
    name: "Mars",
    shortType: "Rocky Planet",
    color: "#db8667",
    radius: 0.88,
    orbitRadius: 56,
    orbitSpeed: 2.4,
    visitDistance: 9.5,
    facts: {
      moons: "2",
      atmosphere: "About 95% carbon dioxide, 2.7% nitrogen, 1.6% argon, traces of oxygen",
      day: "24.6 hours",
      temperature: "About -65 C average",
      diameter: "6,792 km",
      gravity: "3.7 m/s²",
      distance: "227.9 million km",
      year: "687 Earth days",
      compare: "Compared with Earth, Mars is smaller, colder, and has much weaker gravity, but it is one of the best places to study past habitability.",
      note: "Learning cue: Mars helps scientists study planetary change. It is cold and dry today, but its surface still preserves evidence that liquid water once moved there.",
    },
    description:
      "Mars is a cold desert planet with ice caps, giant volcanoes, huge canyons, and one of the best records of ancient water in the solar system.",
  },
  jupiter: {
    id: "jupiter",
    name: "Jupiter",
    shortType: "Gas Giant",
    color: "#e2b982",
    radius: 3.45,
    orbitRadius: 78,
    orbitSpeed: 1.2,
    visitDistance: 16,
    facts: {
      moons: "95 known moons",
      atmosphere: "Mostly hydrogen and helium with traces of methane and ammonia",
      day: "About 10 hours",
      temperature: "Cloud tops near -145 C",
      diameter: "142,984 km",
      gravity: "23.1 m/s²",
      distance: "778.6 million km",
      year: "11.9 Earth years",
      compare: "Compared with Earth, Jupiter is vastly larger, has no solid surface, and has a year that lasts nearly 12 Earth years.",
      note: "Learning cue: Jupiter's enormous mass shapes the whole solar system. It drives powerful storms and strongly influences many nearby moons and small bodies.",
    },
    description:
      "Jupiter is the largest planet, a gas giant made mostly of hydrogen and helium with cloud bands, intense storms, and huge gravitational influence.",
  },
  saturn: {
    id: "saturn",
    name: "Saturn",
    shortType: "Ringed Gas Giant",
    color: "#edd8a6",
    radius: 2.55,
    orbitRadius: 102,
    orbitSpeed: 0.8,
    visitDistance: 16,
    facts: {
      moons: "146 known moons",
      atmosphere: "Mostly hydrogen and helium with methane and ammonia traces",
      day: "About 10.7 hours",
      temperature: "Cloud tops near -178 C",
      diameter: "120,536 km",
      gravity: "9.0 m/s²",
      distance: "1.43 billion km",
      year: "29.5 Earth years",
      compare: "Compared with Earth, Saturn is a giant gas world with lower average density and a famous ring system that Earth does not have.",
      note: "Learning cue: Saturn's rings are not a solid disk. They are made of countless pieces of ice and rock orbiting together in thin bands.",
    },
    description:
      "Saturn is a giant planet best known for its spectacular rings, which make it one of the clearest examples of orbital structure in the solar system.",
  },
  uranus: {
    id: "uranus",
    name: "Uranus",
    shortType: "Ice Giant",
    color: "#8bd4eb",
    radius: 2.05,
    orbitRadius: 128,
    orbitSpeed: 0.55,
    visitDistance: 13,
    facts: {
      moons: "27 known moons",
      atmosphere: "Mostly hydrogen and helium with methane that gives it a blue-green tint",
      day: "About 17 hours",
      temperature: "Cloud tops near -224 C",
      diameter: "51,118 km",
      gravity: "8.7 m/s²",
      distance: "2.87 billion km",
      year: "84 Earth years",
      compare: "Compared with Earth, Uranus is colder, much larger, and tilted so dramatically that its seasons are far more extreme.",
      note: "Learning cue: Uranus is unusual because it rotates on its side. That extreme tilt creates long, dramatic seasons unlike those on Earth.",
    },
    description:
      "Uranus is an ice giant with a blue-green color from methane and an extreme sideways tilt that changes how sunlight reaches it.",
  },
  neptune: {
    id: "neptune",
    name: "Neptune",
    shortType: "Ice Giant",
    color: "#6485ff",
    radius: 1.98,
    orbitRadius: 156,
    orbitSpeed: 0.4,
    visitDistance: 13,
    facts: {
      moons: "16 known moons",
      atmosphere: "Mostly hydrogen and helium with methane and high-altitude hazes",
      day: "About 16 hours",
      temperature: "Cloud tops near -214 C",
      diameter: "49,528 km",
      gravity: "11.0 m/s²",
      distance: "4.5 billion km",
      year: "164.8 Earth years",
      compare: "Compared with Earth, Neptune is far larger, far colder, and so distant from the Sun that its year lasts almost 165 Earth years.",
      note: "Learning cue: Neptune is far from the Sun, yet its atmosphere is still highly active. It has some of the fastest winds measured on any planet.",
    },
    description:
      "Neptune is the farthest major planet from the Sun, a deep-blue ice giant with strong storms and extremely fast winds.",
  },
};

const destinations = Object.values(bodies);
const destinationIds = destinations.map((body) => body.id);

const bodyCinematics = {
  sun: { distance: 39, yaw: 0.4, pitch: 0.18, offsetX: -3.05, offsetY: 1.28 },
  mercury: { distance: 7.9, yaw: 0.84, pitch: 0.12, offsetX: -1.2, offsetY: 0.45 },
  venus: { distance: 8.8, yaw: 0.66, pitch: 0.16, offsetX: -1.5, offsetY: 0.6 },
  earth: { distance: 10.4, yaw: 0.58, pitch: 0.2, offsetX: -1.9, offsetY: 0.72 },
  mars: { distance: 9.2, yaw: 0.92, pitch: 0.18, offsetX: -1.45, offsetY: 0.55 },
  jupiter: { distance: 18.2, yaw: 0.56, pitch: 0.22, offsetX: -2.6, offsetY: 1.05 },
  saturn: { distance: 16.8, yaw: 0.44, pitch: 0.24, offsetX: -2.4, offsetY: 0.9 },
  uranus: { distance: 13.8, yaw: 0.74, pitch: 0.2, offsetX: -1.9, offsetY: 0.72 },
  neptune: { distance: 14.4, yaw: 0.7, pitch: 0.22, offsetX: -2, offsetY: 0.78 },
};

const axialTiltDegrees = {
  sun: 7.25,
  mercury: 0.03,
  venus: 177.0,
  earth: 23.44,
  mars: 25.19,
  jupiter: 3.13,
  saturn: 26.73,
  uranus: 97.77,
  neptune: 28.32,
};

// Compressed showcase rotation model based on real axial behavior:
// fast rotators stay visibly faster, slow rotators stay slower, and
// retrograde planets rotate in the correct direction.
const axialRotationRates = {
  sun: 0.11,
  mercury: 0.009,
  venus: -0.005,
  earth: 0.17,
  mars: 0.165,
  jupiter: 0.31,
  saturn: 0.27,
  uranus: -0.12,
  neptune: 0.24,
};

const orbitalMotionScale = {
  mercury: 1.8,
  venus: 1.32,
  earth: 1.0,
  mars: 0.78,
  jupiter: 0.22,
  saturn: 0.09,
  uranus: 0.032,
  neptune: 0.016,
};

function hashMoonValue(seed) {
  const x = Math.sin(seed * 127.1) * 43758.5453123;
  return x - Math.floor(x);
}

function generateMoonSystem({
  count,
  majorMoons = [],
  minRadius,
  maxRadius,
  startDistance,
  endDistance,
  speedMin,
  speedMax,
  palette,
  inclination = 0.24,
}) {
  const moons = [...majorMoons];

  for (let index = majorMoons.length; index < count; index += 1) {
    const t = count <= 1 ? 0 : index / (count - 1);
    const spreadT = Math.pow(t, 1.08);
    const seed = index + count * 0.37;
    const distance =
      startDistance +
      (endDistance - startDistance) * spreadT +
      (hashMoonValue(seed) - 0.5) * ((endDistance - startDistance) / Math.max(count * 0.75, 8));
    const sizeBias = Math.pow(1 - t, 1.65);
    const radius =
      minRadius +
      (maxRadius - minRadius) * (0.12 + sizeBias * 0.88) * (0.72 + hashMoonValue(seed + 2.1) * 0.4);
    const speed = speedMax - (speedMax - speedMin) * Math.pow(t, 0.72);
    const paletteIndex = Math.floor(hashMoonValue(seed + 4.2) * palette.length) % palette.length;
    const tone = palette[paletteIndex];

    moons.push({
      radius,
      distance,
      speed,
      color: tone.color,
      accent: tone.accent,
      inclination: (hashMoonValue(seed + 9.4) - 0.5) * inclination,
    });
  }

  return moons.slice(0, count);
}

const moonSystems = {
  earth: generateMoonSystem({
    count: 1,
    majorMoons: [{ radius: 0.22, distance: 2.45, speed: 1.9, color: "#d7d9df", accent: "#9da3b1", inclination: 0.08 }],
    minRadius: 0.22,
    maxRadius: 0.22,
    startDistance: 2.45,
    endDistance: 2.45,
    speedMin: 1.9,
    speedMax: 1.9,
    palette: [{ color: "#d7d9df", accent: "#9da3b1" }],
  }),
  mars: generateMoonSystem({
    count: 2,
    majorMoons: [
      { radius: 0.1, distance: 1.55, speed: 3.1, color: "#b0a298", accent: "#786b62", inclination: 0.1 },
      { radius: 0.08, distance: 2.05, speed: 2.2, color: "#8f8277", accent: "#62564f", inclination: -0.08 },
    ],
    minRadius: 0.08,
    maxRadius: 0.1,
    startDistance: 1.55,
    endDistance: 2.05,
    speedMin: 2.2,
    speedMax: 3.1,
    palette: [
      { color: "#b0a298", accent: "#786b62" },
      { color: "#8f8277", accent: "#62564f" },
    ],
  }),
  jupiter: generateMoonSystem({
    count: 95,
    majorMoons: [
      { radius: 0.24, distance: 5.7, speed: 2.4, color: "#efe7c9", accent: "#b09e7f", inclination: 0.06 },
      { radius: 0.2, distance: 6.8, speed: 1.9, color: "#d7ba88", accent: "#8b6f49", inclination: -0.04 },
      { radius: 0.28, distance: 7.9, speed: 1.55, color: "#cab394", accent: "#83735d", inclination: 0.03 },
      { radius: 0.18, distance: 9.1, speed: 1.22, color: "#bca586", accent: "#75634f", inclination: -0.02 },
    ],
    minRadius: 0.034,
    maxRadius: 0.16,
    startDistance: 10,
    endDistance: 31,
    speedMin: 0.2,
    speedMax: 1.15,
    inclination: 0.44,
    palette: [
      { color: "#d9cfbf", accent: "#8e816f" },
      { color: "#c7b39a", accent: "#725f4d" },
      { color: "#e5dccd", accent: "#958978" },
      { color: "#b9ab97", accent: "#6a5d50" },
    ],
  }),
  saturn: generateMoonSystem({
    count: 146,
    majorMoons: [
      { radius: 0.24, distance: 5.5, speed: 1.7, color: "#d8c7aa", accent: "#90795d", inclination: 0.06 },
      { radius: 0.13, distance: 6.8, speed: 1.34, color: "#c5b39b", accent: "#7e6c59", inclination: -0.05 },
      { radius: 0.11, distance: 8.1, speed: 1.05, color: "#a99b8e", accent: "#6a6056", inclination: 0.04 },
    ],
    minRadius: 0.026,
    maxRadius: 0.11,
    startDistance: 8.9,
    endDistance: 28.5,
    speedMin: 0.16,
    speedMax: 0.94,
    inclination: 0.36,
    palette: [
      { color: "#ddd4c7", accent: "#8e826f" },
      { color: "#cdbca3", accent: "#75634e" },
      { color: "#b8ada0", accent: "#64584f" },
      { color: "#f0e5d1", accent: "#9b8b72" },
    ],
  }),
  uranus: generateMoonSystem({
    count: 27,
    majorMoons: [
      { radius: 0.12, distance: 3.9, speed: 1.5, color: "#d6edf0", accent: "#8eb9c1", inclination: 0.1 },
      { radius: 0.1, distance: 4.8, speed: 1.18, color: "#b8d2d9", accent: "#7296a0", inclination: -0.08 },
    ],
    minRadius: 0.034,
    maxRadius: 0.09,
    startDistance: 5.4,
    endDistance: 13.8,
    speedMin: 0.26,
    speedMax: 0.88,
    inclination: 0.42,
    palette: [
      { color: "#d7eef4", accent: "#8bb7c1" },
      { color: "#bfd5db", accent: "#6f97a0" },
      { color: "#e5f6f7", accent: "#97bcc4" },
    ],
  }),
  neptune: generateMoonSystem({
    count: 16,
    majorMoons: [
      { radius: 0.16, distance: 4.2, speed: 1.45, color: "#cfc3b5", accent: "#8b8074", inclination: 0.08 },
    ],
    minRadius: 0.04,
    maxRadius: 0.09,
    startDistance: 4.9,
    endDistance: 11.8,
    speedMin: 0.3,
    speedMax: 0.94,
    inclination: 0.38,
    palette: [
      { color: "#d4c8bb", accent: "#887b70" },
      { color: "#b6ada3", accent: "#6e655e" },
      { color: "#e0d6cb", accent: "#93897e" },
    ],
  }),
};

function getBodyPresentation(bodyId) {
  return bodyCinematics[bodyId] ?? { distance: 12, yaw: 0.36, pitch: 0.2, offsetX: -1.6, offsetY: 0.6 };
}

const guidedTourSteps = [
  {
    zoomDistance: 104,
    yaw: 0.22,
    pitch: 0.16,
    bodyId: null,
    kicker: "Guided Tour",
    title: "Welcome to the Milky Way",
    description:
      "This is our home galaxy. As the tour begins, remember the scale: our solar system is just one tiny neighborhood inside the Milky Way.",
    visit: "Milky Way",
    highlight: "Big idea: the solar system is part of a much larger galaxy",
    duration: 2600,
  },
  ...destinations.map((body) => ({
    bodyId: body.id,
    zoomDistance: getBodyPresentation(body.id).distance,
    yaw: getBodyPresentation(body.id).yaw,
    pitch: getBodyPresentation(body.id).pitch,
    kicker: body.shortType,
    title: body.name,
    description: `${body.description} Compare its atmosphere, gravity, day length, and year to see how different planets can be from one another.`,
    visit: body.name,
    highlight:
      body.id === "sun"
        ? `Key lesson: stars power planetary systems`
        : `Key lesson: ${body.facts.moons} | Year length: ${body.facts.year}`,
    duration: 3200,
  })),
];

const runtime = {
  ready: false,
  renderer: null,
  composer: null,
  scene: null,
  camera: null,
  raycaster: null,
  pointer: null,
  clock: null,
  targetVector: null,
  cameraLookAt: null,
  systemGroup: null,
  solarOrbitGroup: null,
  galaxyGroup: null,
  starfield: null,
  postPass: null,
  bodyNodes: {},
  textureLoader: null,
  audioContext: null,
  audioMasterGain: null,
  audioPadGain: null,
  audioPulseGain: null,
  audioOscillators: [],
};

function syncTourMode() {
  document.body.classList.toggle("is-tour-active", state.mode === "tour");
}

function scaleName(distance) {
  if (distance < 14) return "Planet Close-Up";
  if (distance < 30) return "Inner Solar System";
  if (distance < 55) return "Outer Solar System";
  if (distance < 110) return "Milky Way View";
  return "Wide Cosmic View";
}

function eraName(time) {
  if (time < 0.24) return "Early Universe";
  if (time < 0.48) return "Present Day";
  if (time < 0.76) return "Approaching Merger";
  return "Far Future";
}

function expansionName(time) {
  if (time < 0.24) return "Rapid Inflation";
  if (time < 0.48) return "Subtle Drift";
  if (time < 0.76) return "Merger Pull";
  return "Accelerating Expansion";
}

function getFocus() {
  const body = bodies[state.selectedBody];
  return {
    title: body.name,
    type: body.shortType,
    description: body.description,
    label: body.name,
  };
}

function populateDestinations() {
  destinationGrid.innerHTML = "";
  destinations.forEach((body) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "destination-chip";
    button.dataset.body = body.id;
    button.innerHTML = `${body.name}<small>${body.shortType}</small>`;
    button.addEventListener("click", () => visitBody(body.id));
    destinationGrid.appendChild(button);
  });
}

function syncDestinationButtons() {
  destinationGrid.querySelectorAll(".destination-chip").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.body === state.selectedBody);
  });
}

function syncTourOverlay() {
  if (state.mode !== "tour") return;
  const step = guidedTourSteps[state.tourStepIndex];
  if (!step) return;
  tourKicker.textContent = step.kicker;
  tourTitle.textContent = step.title;
  tourDescription.textContent = step.description;
  tourVisit.textContent = step.visit;
  tourHighlight.textContent = step.highlight;
  const stepNumber = Math.min(state.tourStepIndex + 1, guidedTourSteps.length);
  tourStepCount.textContent = `Stop ${stepNumber} of ${guidedTourSteps.length}`;
  tourProgressFill.style.width = `${(stepNumber / guidedTourSteps.length) * 100}%`;
}

function syncFactsForSelectedBody() {
  const body = bodies[state.selectedBody];
  const focus = getFocus();
  focusLabel.textContent = focus.label;
  scaleLabel.textContent = scaleName(state.cameraDistance);
  eraLabel.textContent = eraName(state.time);
  expansionLabel.textContent = expansionName(state.time);
  objectType.textContent = focus.type;
  objectTitle.textContent = focus.title;
  objectDescription.textContent = focus.description;
  factMoons.textContent = body.facts.moons;
  factAtmosphere.textContent = body.facts.atmosphere;
  factDay.textContent = body.facts.day;
  factTemp.textContent = body.facts.temperature;
  factDiameter.textContent = body.facts.diameter;
  factGravity.textContent = body.facts.gravity;
  factDistance.textContent = body.facts.distance;
  factYear.textContent = body.facts.year;
  factCompare.textContent = body.facts.compare;
  factNote.textContent = body.facts.note;
}

function syncMediaUi() {
  audioButton.textContent = state.audioEnabled ? "Sound on" : "Enable sound";
  narrationButton.textContent = state.narrationEnabled ? "Narration on" : "Enable narration";
  tourNarrationButton.textContent = state.narrationEnabled ? "Voice on" : "Voice off";
  mediaStatus.textContent = `${state.audioEnabled ? "Ambient soundtrack is on." : "Ambient soundtrack is off."} ${state.narrationEnabled ? "Guided voice is on." : "Guided voice is off."}`;
}

function syncHeroStatus() {
  modeLabel.textContent = state.mode === "tour" ? "Guided Planet Tour" : "Interactive Explore";
  destinationLabel.textContent = state.mode === "tour" ? guidedTourSteps[state.tourStepIndex]?.visit ?? bodies[state.selectedBody].name : bodies[state.selectedBody].name;
}

function syncUi() {
  zoomSlider.value = String(
    Math.round(((MAX_CAMERA_DISTANCE - state.targetCameraDistance) / (MAX_CAMERA_DISTANCE - 12)) * 1000)
  );
  timeSlider.value = String(Math.round(state.targetTime * 1000));
  syncFactsForSelectedBody();
  syncDestinationButtons();
  syncTourOverlay();
  syncMediaUi();
  syncHeroStatus();
}

function primeCinematicTransition(strength = 1) {
  state.transitionBoost = Math.max(state.transitionBoost, strength);
}

function showTooltip() {
  const hovered = state.hoveredBody ? bodies[state.hoveredBody] : null;
  const position = hovered ? state.bodyScreenPositions[hovered.id] : null;
  if (!hovered || !position) {
    canvasTooltip.classList.remove("is-visible");
    return;
  }

  canvasTooltip.textContent = `Visit ${hovered.name}`;
  canvasTooltip.style.left = `${position.x}px`;
  canvasTooltip.style.top = `${position.y}px`;
  canvasTooltip.classList.add("is-visible");
}

function stopGuidedTour() {
  stopIntro();
  state.mode = "interactive";
  state.tourStepIndex = 0;
  state.tourStepElapsed = 0;
  state.narratedStepKey = null;
  state.narrationSpeaking = false;
  state.narrationToken += 1;
  primeCinematicTransition(0.65);
  tourButton.textContent = "Start planet tour";
  syncTourMode();
  syncUi();
  window.speechSynthesis?.cancel?.();
}

function startGuidedTour() {
  stopIntro();
  state.mode = "tour";
  state.tourStepIndex = 0;
  state.tourStepElapsed = 0;
  state.narratedStepKey = null;
  state.narrationSpeaking = false;
  state.targetYaw = 0.22;
  state.targetPitch = 0.16;
  state.targetCameraDistance = guidedTourSteps[0].zoomDistance;
  primeCinematicTransition(1);
  tourButton.textContent = "Restart planet tour";
  syncTourMode();
  syncUi();
}

function visitBody(bodyId) {
  stopIntro();
  const body = bodies[bodyId];
  if (!body) return;
  const presentation = getBodyPresentation(bodyId);
  state.mode = "interactive";
  state.selectedBody = bodyId;
  state.targetCameraDistance = presentation.distance;
  state.targetYaw = presentation.yaw;
  state.targetPitch = presentation.pitch;
  primeCinematicTransition(0.82);
  tourButton.textContent = "Start planet tour";
  syncTourMode();
  syncUi();
  speakCurrentSelection();
}

function cycleBody(step) {
  const currentIndex = destinationIds.indexOf(state.selectedBody);
  const nextIndex = (currentIndex + step + destinationIds.length) % destinationIds.length;
  visitBody(destinationIds[nextIndex]);
}

function resetView() {
  stopIntro();
  state.mode = "interactive";
  state.selectedBody = "sun";
  state.targetCameraDistance = 58;
  state.cameraDistance = 58;
  state.targetTime = 0.42;
  state.time = 0.42;
  state.targetYaw = 0.28;
  state.yaw = 0.28;
  state.targetPitch = 0.2;
  state.pitch = 0.2;
  state.tourStepIndex = 0;
  state.tourStepElapsed = 0;
  state.hoveredBody = null;
  primeCinematicTransition(0.72);
  tourButton.textContent = "Start planet tour";
  syncTourMode();
  syncUi();
}

function createCanvasTexture(THREE, painter) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 1024;
  textureCanvas.height = 512;
  const textureCtx = textureCanvas.getContext("2d");
  painter(textureCtx, textureCanvas.width, textureCanvas.height);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

async function loadTexture(path, options = {}) {
  const texture = await runtime.textureLoader.loadAsync(path);
  if (options.colorSpace !== false) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }
  if (isMobile) {
    const img = texture.image;
    const maxW = 512, maxH = 256;
    if (img.width > maxW || img.height > maxH) {
      const cap = document.createElement("canvas");
      cap.width = maxW;
      cap.height = maxH;
      cap.getContext("2d").drawImage(img, 0, 0, maxW, maxH);
      texture.image = cap;
    }
  } else {
    texture.anisotropy = Math.min(8, runtime.renderer.capabilities.getMaxAnisotropy());
  }
  texture.needsUpdate = true;
  return texture;
}

function buildTextureVariants(THREE, texture, options = {}) {
  const image = texture.image;
  const width = image.width;
  const height = image.height;
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = width;
  sourceCanvas.height = height;
  const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  sourceCtx.drawImage(image, 0, 0, width, height);
  const sourceData = sourceCtx.getImageData(0, 0, width, height);

  const heightMap = new Float32Array(width * height);
  for (let index = 0; index < heightMap.length; index += 1) {
    const pixelIndex = index * 4;
    const r = sourceData.data[pixelIndex] / 255;
    const g = sourceData.data[pixelIndex + 1] / 255;
    const b = sourceData.data[pixelIndex + 2] / 255;
    heightMap[index] = r * 0.299 + g * 0.587 + b * 0.114;
  }

  const getHeight = (x, y) => {
    const wrappedX = (x + width) % width;
    const wrappedY = (y + height) % height;
    return heightMap[wrappedY * width + wrappedX];
  };

  const normalCanvas = document.createElement("canvas");
  normalCanvas.width = width;
  normalCanvas.height = height;
  const normalCtx = normalCanvas.getContext("2d");
  const normalData = normalCtx.createImageData(width, height);
  const normalStrength = options.normalStrength ?? 2.5;

  const roughnessCanvas = document.createElement("canvas");
  roughnessCanvas.width = width;
  roughnessCanvas.height = height;
  const roughnessCtx = roughnessCanvas.getContext("2d");
  const roughnessData = roughnessCtx.createImageData(width, height);
  const roughnessBias = options.roughnessBias ?? 0.68;
  const roughnessContrast = options.roughnessContrast ?? 0.42;

  const specularCanvas = document.createElement("canvas");
  specularCanvas.width = width;
  specularCanvas.height = height;
  const specularCtx = specularCanvas.getContext("2d");
  const specularData = specularCtx.createImageData(width, height);
  const specularBias = options.specularBias ?? 0.12;
  const specularBoost = options.specularBoost ?? 0.36;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const left = getHeight(x - 1, y);
      const right = getHeight(x + 1, y);
      const up = getHeight(x, y - 1);
      const down = getHeight(x, y + 1);
      const dx = (right - left) * normalStrength;
      const dy = (down - up) * normalStrength;
      const dz = 1;
      const invLength = 1 / Math.hypot(dx, dy, dz);
      const nx = dx * invLength;
      const ny = dy * invLength;
      const nz = dz * invLength;

      const targetIndex = (y * width + x) * 4;
      normalData.data[targetIndex] = Math.round((nx * 0.5 + 0.5) * 255);
      normalData.data[targetIndex + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      normalData.data[targetIndex + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      normalData.data[targetIndex + 3] = 255;

      const luminance = getHeight(x, y);
      const roughness = Math.min(1, Math.max(0, roughnessBias + (0.5 - luminance) * roughnessContrast));
      const roughnessValue = Math.round(roughness * 255);
      roughnessData.data[targetIndex] = roughnessValue;
      roughnessData.data[targetIndex + 1] = roughnessValue;
      roughnessData.data[targetIndex + 2] = roughnessValue;
      roughnessData.data[targetIndex + 3] = 255;

      const spec = Math.min(1, Math.max(0, specularBias + luminance * specularBoost));
      const specularValue = Math.round(spec * 255);
      specularData.data[targetIndex] = specularValue;
      specularData.data[targetIndex + 1] = specularValue;
      specularData.data[targetIndex + 2] = specularValue;
      specularData.data[targetIndex + 3] = 255;
    }
  }

  normalCtx.putImageData(normalData, 0, 0);
  roughnessCtx.putImageData(roughnessData, 0, 0);
  specularCtx.putImageData(specularData, 0, 0);

  const normalMap = new THREE.CanvasTexture(normalCanvas);
  normalMap.colorSpace = THREE.NoColorSpace;
  normalMap.wrapS = texture.wrapS;
  normalMap.wrapT = texture.wrapT;
  normalMap.anisotropy = texture.anisotropy;

  const roughnessMap = new THREE.CanvasTexture(roughnessCanvas);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.wrapS = texture.wrapS;
  roughnessMap.wrapT = texture.wrapT;
  roughnessMap.anisotropy = texture.anisotropy;

  const specularMap = new THREE.CanvasTexture(specularCanvas);
  specularMap.colorSpace = THREE.NoColorSpace;
  specularMap.wrapS = texture.wrapS;
  specularMap.wrapT = texture.wrapT;
  specularMap.anisotropy = texture.anisotropy;

  return { normalMap, roughnessMap, specularMap };
}

function paintBands(ctx, width, height, colors, noiseStrength = 16) {
  const stripeHeight = height / colors.length;
  colors.forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, index * stripeHeight, width, stripeHeight + 1);
  });
  for (let y = 0; y < height; y += 1) {
    const alpha = 0.08 + ((Math.sin(y * 0.11) + 1) * 0.04);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(0, y, width, 1);
  }
  for (let i = 0; i < 2400; i += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 4 + Math.random() * noiseStrength;
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
    ctx.fillRect(x, y, size, 1 + Math.random() * 2);
  }
}

function createPlanetTexture(THREE, bodyId) {
  return createCanvasTexture(THREE, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    if (bodyId === "sun") {
      const baseGradient = ctx.createLinearGradient(0, 0, width, height);
      baseGradient.addColorStop(0, "#fff3b6");
      baseGradient.addColorStop(0.22, "#ffd06a");
      baseGradient.addColorStop(0.52, "#ff9f34");
      baseGradient.addColorStop(1, "#bf4310");
      ctx.fillStyle = baseGradient;
      ctx.fillRect(0, 0, width, height);

      for (let band = 0; band < 40; band += 1) {
        const y = (band / 40) * height;
        const ribbon = ctx.createLinearGradient(0, y, width, y + height * 0.05);
        ribbon.addColorStop(0, `rgba(255, ${165 + (band % 35)}, 28, 0.018)`);
        ribbon.addColorStop(0.32, `rgba(255, ${215 + (band % 25)}, 90, 0.06)`);
        ribbon.addColorStop(0.68, `rgba(255, ${180 + (band % 30)}, 44, 0.08)`);
        ribbon.addColorStop(1, `rgba(255, ${135 + (band % 24)}, 10, 0.024)`);
        ctx.fillStyle = ribbon;
        ctx.fillRect(0, y, width, height * (0.013 + (band % 4) * 0.003));
      }

      for (let i = 0; i < 2800; i += 1) {
        const hueShift = i % 7 === 0 ? 22 : 0;
        ctx.fillStyle = `rgba(255, ${168 + (i % 62)}, ${16 + hueShift}, ${0.018 + Math.random() * 0.045})`;
        ctx.beginPath();
        ctx.arc(
          Math.random() * width,
          Math.random() * height,
          8 + Math.random() * 34,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      for (let i = 0; i < 220; i += 1) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radiusX = 34 + Math.random() * 150;
        const radiusY = 12 + Math.random() * 56;
        ctx.fillStyle = `rgba(112, 24, 0, ${0.045 + Math.random() * 0.075})`;
        ctx.beginPath();
        ctx.ellipse(x, y, radiusX, radiusY, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < 180; i += 1) {
        const startX = Math.random() * width;
        const startY = Math.random() * height;
        ctx.strokeStyle = `rgba(255, ${190 + (i % 40)}, 82, ${0.045 + Math.random() * 0.07})`;
        ctx.lineWidth = 1.5 + Math.random() * 5.5;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(
          startX + 60 + Math.random() * 180,
          startY - 40 - Math.random() * 70,
          startX + 120 + Math.random() * 220,
          startY + 16 + Math.random() * 80,
          startX + 220 + Math.random() * 320,
          startY + Math.random() * 60
        );
        ctx.stroke();
      }

      const hotCore = ctx.createRadialGradient(width * 0.5, height * 0.5, width * 0.04, width * 0.5, height * 0.5, width * 0.42);
      hotCore.addColorStop(0, "rgba(255, 248, 210, 0.42)");
      hotCore.addColorStop(0.35, "rgba(255, 220, 126, 0.18)");
      hotCore.addColorStop(1, "rgba(255, 220, 126, 0)");
      ctx.fillStyle = hotCore;
      ctx.fillRect(0, 0, width, height);
      return;
    }
    if (bodyId === "earth") {
      ctx.fillStyle = "#2d68c4";
      ctx.fillRect(0, 0, width, height);
      for (let i = 0; i < 80; i += 1) {
        ctx.fillStyle = i % 2 === 0 ? "#74d07a" : "#d1c388";
        ctx.beginPath();
        ctx.ellipse(
          Math.random() * width,
          Math.random() * height,
          40 + Math.random() * 120,
          20 + Math.random() * 70,
          Math.random() * Math.PI,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      for (let i = 0; i < 120; i += 1) {
        ctx.fillStyle = `rgba(255,255,255,${0.08 + Math.random() * 0.12})`;
        ctx.beginPath();
        ctx.ellipse(
          Math.random() * width,
          Math.random() * height,
          20 + Math.random() * 90,
          10 + Math.random() * 20,
          Math.random() * Math.PI,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      return;
    }
    if (bodyId === "jupiter") {
      paintBands(ctx, width, height, ["#f2d6b3", "#d8a878", "#efcfb5", "#a05f3f", "#e9c89e", "#c88e64"], 22);
      ctx.fillStyle = "rgba(196,102,68,0.7)";
      ctx.beginPath();
      ctx.ellipse(width * 0.66, height * 0.54, 120, 54, 0, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    if (bodyId === "saturn") {
      paintBands(ctx, width, height, ["#f5e2b4", "#caa77d", "#eed7a4", "#a07d59", "#f6e8c0"], 16);
      return;
    }
    if (bodyId === "uranus") {
      paintBands(ctx, width, height, ["#d8f6ff", "#94e1e9", "#78c8d9", "#bfeff7"], 12);
      return;
    }
    if (bodyId === "neptune") {
      paintBands(ctx, width, height, ["#5e82ff", "#3058d2", "#7db7ff", "#264cbc"], 16);
      return;
    }
    if (bodyId === "venus") {
      paintBands(ctx, width, height, ["#f4d8a7", "#d4a86f", "#edd3a5", "#b88a53", "#e5c594"], 14);
      return;
    }
    if (bodyId === "mars") {
      paintBands(ctx, width, height, ["#8f4734", "#c06449", "#8a4631", "#e39b79"], 18);
      return;
    }
    paintBands(ctx, width, height, ["#9a8c7c", "#7d7167", "#b8a894", "#655e56"], 10);
  });
}

function createRingTexture(THREE) {
  return createCanvasTexture(THREE, (ctx, width, height) => {
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, "rgba(240,220,170,0)");
    gradient.addColorStop(0.18, "rgba(240,220,170,0.65)");
    gradient.addColorStop(0.5, "rgba(255,255,255,0.9)");
    gradient.addColorStop(0.82, "rgba(240,220,170,0.65)");
    gradient.addColorStop(1, "rgba(240,220,170,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    for (let x = 0; x < width; x += 3) {
      ctx.fillStyle = `rgba(255,255,255,${0.03 + Math.random() * 0.08})`;
      ctx.fillRect(x, 0, 1, height);
    }
  });
}

function createAtmosphereShell(body, color, opacity, scale = 1.08) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(body.radius * scale, isMobile ? 32 : 64, isMobile ? 32 : 64),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    })
  );
}

function createFresnelShell(THREE, radius, color, options = {}) {
  const uniforms = {
    glowColor: { value: new THREE.Color(color) },
    intensity: { value: options.intensity ?? 0.95 },
    power: { value: options.power ?? 2.8 },
    edgeBoost: { value: options.edgeBoost ?? 1.2 },
  };

  return new THREE.Mesh(
    new THREE.SphereGeometry(radius * (options.scale ?? 1.08), 64, 64),
    new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vNormal = normalize(mat3(modelMatrix) * normal);
          vViewDir = normalize(cameraPosition - worldPosition.xyz);
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float intensity;
        uniform float power;
        uniform float edgeBoost;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), power);
          float glow = clamp(fresnel * edgeBoost, 0.0, 1.0) * intensity;
          gl_FragColor = vec4(glowColor * glow, glow);
        }
      `,
    })
  );
}

function createSunMaterial(THREE) {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      colorDeep: { value: new THREE.Color("#9f2c08") },
      colorMid: { value: new THREE.Color("#ef6412") },
      colorHot: { value: new THREE.Color("#ffb22e") },
      colorCore: { value: new THREE.Color("#fff1be") },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 colorDeep;
      uniform vec3 colorMid;
      uniform vec3 colorHot;
      uniform vec3 colorCore;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 5; i++) {
          value += amplitude * noise(p);
          p *= 2.03;
          amplitude *= 0.52;
        }
        return value;
      }

      float ridge(float h) {
        h = abs(h);
        return 1.0 - h;
      }

      void main() {
        vec2 uv = vUv;
        float t = time * 0.12;
        vec2 sphereUv = vec2(uv.x * 1.25, uv.y);
        vec2 warpA = vec2(
          fbm(sphereUv * 5.5 + vec2(t * 1.2, -t * 0.4)),
          fbm(sphereUv * 6.0 + vec2(-t * 0.5, t * 0.9))
        );
        vec2 warpB = vec2(
          fbm(sphereUv * 11.0 - vec2(t * 1.5, t * 0.7)),
          fbm(sphereUv * 10.0 + vec2(t * 0.9, -t * 1.1))
        );
        vec2 flowUv = sphereUv * 4.0 + warpA * 1.15 + warpB * 0.28;

        float convection = fbm(flowUv + vec2(t * 1.45, -t * 0.38));
        float cells = smoothstep(0.22, 0.9, convection);
        float plasmaBands = sin((uv.y + fbm(uv * 4.5 + vec2(t * 0.5, -t * 0.25)) * 0.18) * 34.0 + t * 6.2) * 0.5 + 0.5;
        float ribbonNoise = ridge(fbm(uv * 14.0 + vec2(t * 2.0, -t * 1.2)) - 0.5);
        float filamentMask = smoothstep(0.45, 0.93, ribbonNoise);
        float granules = smoothstep(0.48, 0.92, fbm(uv * 18.0 - vec2(t * 1.2, t * 0.65)));
        float hotCore = smoothstep(0.68, 0.98, fbm(uv * 8.0 + warpA * 0.9 - vec2(t * 0.7, t * 0.55)));

        vec3 color = mix(colorDeep, colorMid, cells);
        color = mix(color, colorHot, plasmaBands * 0.28 + filamentMask * 0.23);
        color = mix(color, colorCore, hotCore * 0.42 + granules * 0.14);

        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 2.5);
        color += colorHot * fresnel * 0.08;

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
}

function createEarthCloudMaterial(THREE, cloudMap) {
  return new THREE.ShaderMaterial({
    uniforms: {
      cloudMap: { value: cloudMap },
      glowColor: { value: new THREE.Color("#9fd3ff") },
      time: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        vUv = uv;
        vNormal = normalize(mat3(modelMatrix) * normal);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D cloudMap;
      uniform vec3 glowColor;
      uniform float time;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;

      void main() {
        vec2 uv = vec2(fract(vUv.x + time * 0.0025), vUv.y);
        vec4 cloud = texture2D(cloudMap, uv);
        float alpha = cloud.a * 0.8;
        alpha = smoothstep(0.18, 0.82, alpha);

        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 4.2);
        vec3 color = mix(vec3(0.92, 0.96, 1.0), glowColor, fresnel * 0.55);
        float finalAlpha = alpha * (0.46 + fresnel * 0.35);

        gl_FragColor = vec4(color, finalAlpha);
      }
    `,
  });
}

function createSaturnRingMaterial(THREE, ringTexture) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ringMap: { value: ringTexture },
      ringTint: { value: new THREE.Color("#f2e8cd") },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      void main() {
        vUv = uv;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D ringMap;
      uniform vec3 ringTint;
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;

      void main() {
        vec4 ringSample = texture2D(ringMap, vUv);
        float radialFade = smoothstep(0.03, 0.22, vUv.y) * (1.0 - smoothstep(0.78, 0.98, vUv.y));
        float banding = 0.82 + sin(vUv.y * 120.0) * 0.06 + sin(vUv.y * 250.0) * 0.04;
        float alpha = ringSample.a * radialFade * banding;
        if (alpha < 0.03) discard;

        vec3 lightDir = normalize(-vWorldPosition);
        float diffuse = clamp(dot(normalize(vWorldNormal), lightDir), 0.0, 1.0);
        float forwardScatter = pow(1.0 - abs(dot(normalize(vWorldNormal), normalize(cameraPosition - vWorldPosition))), 1.9);
        vec3 color = ringTint * (0.34 + diffuse * 0.46 + forwardScatter * 0.22);
        color *= mix(vec3(0.88, 0.84, 0.78), vec3(1.0), ringSample.rgb);

        gl_FragColor = vec4(color, alpha * 0.82);
      }
    `,
  });
}

function stopIntro() {
  if (!state.introActive) return;
  state.introActive = false;
  state.introElapsed = 0;
}

function createMoonTexture(THREE, baseColor, accentColor) {
  return createCanvasTexture(THREE, (ctx, width, height) => {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, baseColor);
    gradient.addColorStop(1, accentColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    for (let index = 0; index < 90; index += 1) {
      const alpha = 0.06 + Math.random() * 0.16;
      ctx.fillStyle = `rgba(40, 32, 24, ${alpha})`;
      ctx.beginPath();
      ctx.arc(
        Math.random() * width,
        Math.random() * height,
        6 + Math.random() * 22,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  });
}

function createLensGlowSprite(THREE, options = {}) {
  const size = options.size ?? 512;
  return new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createCanvasTexture(THREE, (ctx, width, height) => {
        const gradient = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, size * 0.5);
        gradient.addColorStop(0, options.core ?? "rgba(255,250,230,0.92)");
        gradient.addColorStop(0.18, options.mid ?? "rgba(255,204,120,0.68)");
        gradient.addColorStop(0.52, options.outer ?? "rgba(255,130,44,0.16)");
        gradient.addColorStop(1, "rgba(255,130,44,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: options.opacity ?? 0.88,
    })
  );
}

function createCinematicGradePass(THREE) {
  return new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      saturation: { value: 1.04 },
      contrast: { value: 1.03 },
      warmth: { value: 0.018 },
      vignetteStrength: { value: 0.07 },
      glowBoost: { value: 0.02 },
      grainAmount: { value: 0.004 },
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(state.width, state.height) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float saturation;
      uniform float contrast;
      uniform float warmth;
      uniform float vignetteStrength;
      uniform float glowBoost;
      uniform float grainAmount;
      uniform float time;
      uniform vec2 resolution;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      void main() {
        vec2 uv = vUv;
        vec4 sampleColor = texture2D(tDiffuse, uv);
        vec3 color = sampleColor.rgb;

        float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
        color = mix(vec3(luminance), color, saturation);
        color = (color - 0.5) * contrast + 0.5;

        color.r += warmth * 0.9;
        color.g += warmth * 0.2;
        color.b -= warmth * 0.45;

        color += pow(max(color, vec3(0.0)), vec3(2.2)) * glowBoost;
        color = pow(max(color + vec3(0.028), vec3(0.0)), vec3(0.94));

        vec2 centered = uv - 0.5;
        float vignette = smoothstep(0.88, 0.16, dot(centered, centered) * 1.65);
        color *= mix(1.0 - vignetteStrength, 1.0, vignette);

        float noise = hash((uv * resolution) + vec2(time * 60.0, time * 19.0)) - 0.5;
        color += noise * grainAmount;

        gl_FragColor = vec4(color, sampleColor.a);
      }
    `,
  });
}

function ensureAudioEngine() {
  if (runtime.audioContext) return runtime.audioContext;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  const context = new AudioContextClass();
  const masterGain = context.createGain();
  masterGain.gain.value = 0.0001;
  masterGain.connect(context.destination);

  const padGain = context.createGain();
  padGain.gain.value = 0.14;
  padGain.connect(masterGain);

  const pulseGain = context.createGain();
  pulseGain.gain.value = 0.04;
  pulseGain.connect(masterGain);

  const baseFrequencies = [110, 164.81, 220];
  runtime.audioOscillators = baseFrequencies.map((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = index === 1 ? "triangle" : "sine";
    oscillator.frequency.value = frequency;
    const gainNode = context.createGain();
    gainNode.gain.value = index === 1 ? 0.08 : 0.05;
    oscillator.connect(gainNode);
    gainNode.connect(padGain);
    oscillator.start();
    return { oscillator, gainNode, baseFrequency: frequency };
  });

  const pulseOscillator = context.createOscillator();
  pulseOscillator.type = "sine";
  pulseOscillator.frequency.value = 440;
  const pulseLfo = context.createOscillator();
  pulseLfo.type = "sine";
  pulseLfo.frequency.value = 0.11;
  const pulseLfoGain = context.createGain();
  pulseLfoGain.gain.value = 24;
  pulseLfo.connect(pulseLfoGain);
  pulseLfoGain.connect(pulseOscillator.frequency);
  pulseOscillator.connect(pulseGain);
  pulseOscillator.start();
  pulseLfo.start();

  runtime.audioContext = context;
  runtime.audioMasterGain = masterGain;
  runtime.audioPadGain = padGain;
  runtime.audioPulseGain = pulseGain;
  return context;
}

async function setAudioEnabled(enabled) {
  state.audioEnabled = enabled;
  const context = ensureAudioEngine();
  if (!context || !runtime.audioMasterGain) {
    syncUi();
    return;
  }
  if (enabled) {
    await context.resume();
  }
  const now = context.currentTime;
  runtime.audioMasterGain.gain.cancelScheduledValues(now);
  runtime.audioMasterGain.gain.linearRampToValueAtTime(enabled ? 0.9 : 0.0001, now + 0.8);
  syncUi();
}

function setNarrationEnabled(enabled) {
  state.narrationEnabled = enabled;
  if (!enabled) {
    window.speechSynthesis?.cancel?.();
  }
  state.narratedStepKey = null;
  state.narrationSpeaking = false;
  state.narrationToken += 1;
  syncUi();
}

function speakText(text) {
  if (!state.narrationEnabled || !("speechSynthesis" in window) || !text) return;
  const token = state.narrationToken + 1;
  state.narrationToken = token;
  state.narrationSpeaking = true;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.8;
  utterance.pitch = 0.92;
  utterance.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice =
    voices.find((voice) => /Samantha|Ava|Allison|Daniel/i.test(voice.name)) ??
    voices.find((voice) => voice.lang?.startsWith("en")) ??
    null;
  if (preferredVoice) utterance.voice = preferredVoice;
  utterance.onend = () => {
    if (state.narrationToken === token) {
      state.narrationSpeaking = false;
    }
  };
  utterance.onerror = () => {
    if (state.narrationToken === token) {
      state.narrationSpeaking = false;
    }
  };
  window.speechSynthesis.speak(utterance);
}

function speakCurrentSelection() {
  if (state.mode === "tour") return;
  const body = bodies[state.selectedBody];
  if (!body) return;
  speakText(`${body.name}. ${body.description} ${body.facts.note}`);
}

function syncTourNarration() {
  if (state.mode !== "tour" || !state.narrationEnabled) return;
  const step = guidedTourSteps[state.tourStepIndex];
  if (!step) return;
  const stepKey = `${state.tourStepIndex}:${step.visit}`;
  if (state.narratedStepKey === stepKey) return;
  state.narratedStepKey = stepKey;
  speakText(`${step.title}. ${step.description} Highlight: ${step.highlight}.`);
}

async function loadPlanetTextureSet() {
  const earthDay = await loadTexture("/textures/earth_day.jpg");
  const earthClouds = await loadTexture("/textures/earth_clouds.png");
  const earthNormal = await loadTexture("/textures/earth_normal.jpg", { colorSpace: false });
  const earthSpecular = await loadTexture("/textures/earth_specular.jpg", { colorSpace: false });
  const mercury = await loadTexture("/textures/mercury.jpg");
  const venusSurface = await loadTexture("/textures/venus_surface.jpg");
  const mars = await loadTexture("/textures/mars.jpg");
  const jupiter = await loadTexture("/textures/jupiter.jpg");
  const saturn = await loadTexture("/textures/saturn.jpg");
  const saturnRing = await loadTexture("/textures/saturn_ring.png");
  const uranus = await loadTexture("/textures/uranus.jpg");
  const neptune = await loadTexture("/textures/neptune.jpg");

  return {
    earthDay,
    earthClouds,
    earthNormal,
    earthSpecular,
    mercury,
    mercuryMaps: isMobile ? null : buildTextureVariants(THREE, mercury, { normalStrength: 3.8, roughnessBias: 0.82, specularBias: 0.08, specularBoost: 0.18 }),
    venusSurface,
    venusMaps: isMobile ? null : buildTextureVariants(THREE, venusSurface, { normalStrength: 1.4, roughnessBias: 0.9, roughnessContrast: 0.22, specularBias: 0.06, specularBoost: 0.12 }),
    mars,
    marsMaps: isMobile ? null : buildTextureVariants(THREE, mars, { normalStrength: 2.4, roughnessBias: 0.78, roughnessContrast: 0.36, specularBias: 0.05, specularBoost: 0.1 }),
    jupiter,
    jupiterMaps: isMobile ? null : buildTextureVariants(THREE, jupiter, { normalStrength: 0.8, roughnessBias: 0.58, roughnessContrast: 0.18, specularBias: 0.12, specularBoost: 0.22 }),
    saturn,
    saturnMaps: isMobile ? null : buildTextureVariants(THREE, saturn, { normalStrength: 0.7, roughnessBias: 0.6, roughnessContrast: 0.16, specularBias: 0.1, specularBoost: 0.18 }),
    saturnRing,
    uranus,
    uranusMaps: isMobile ? null : buildTextureVariants(THREE, uranus, { normalStrength: 0.45, roughnessBias: 0.52, roughnessContrast: 0.12, specularBias: 0.15, specularBoost: 0.18 }),
    neptune,
    neptuneMaps: isMobile ? null : buildTextureVariants(THREE, neptune, { normalStrength: 0.6, roughnessBias: 0.5, roughnessContrast: 0.14, specularBias: 0.16, specularBoost: 0.2 }),
  };
}

function createStarfield(THREE) {
  const group = new THREE.Group();
  const starMap = createCanvasTexture(THREE, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    const gradient = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, width * 0.5);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.25, "rgba(255,255,255,0.95)");
    gradient.addColorStop(0.6, "rgba(255,255,255,0.32)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  });
  const layers = [
    { count: isMobile ? 1500 : 4400, spread: [1900, 1150, 1900], size: 1.9, opacity: 1, color: 0xffffff, speed: 0.032 },
    { count: isMobile ? 600 : 1800, spread: [1450, 900, 1450], size: 2.7, opacity: 0.48, color: 0xd8e7ff, speed: -0.02 },
    { count: isMobile ? 300 : 900, spread: [1100, 760, 1100], size: 3.7, opacity: 0.24, color: 0xffebc8, speed: 0.012 },
  ];

  layers.forEach((layer, index) => {
    const starGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(layer.count * 3);

    for (let i = 0; i < layer.count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * layer.spread[0];
      positions[i * 3 + 1] = (Math.random() - 0.5) * layer.spread[1];
      positions[i * 3 + 2] = (Math.random() - 0.5) * layer.spread[2];
    }

    starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      map: starMap,
      color: layer.color,
      size: layer.size,
      transparent: true,
      opacity: layer.opacity,
      depthWrite: false,
      sizeAttenuation: true,
      alphaTest: 0.08,
      blending: THREE.AdditiveBlending,
    });

    const stars = new THREE.Points(starGeometry, material);
    stars.userData.rotationSpeed = layer.speed;
    stars.userData.baseOpacity = layer.opacity;
    stars.userData.twinkleOffset = index * 0.9 + Math.random() * Math.PI;
    group.add(stars);
  });

  return group;
}

function setMaterialOpacity(material, opacity) {
  if (!material) return;
  material.opacity = opacity;
  material.transparent = opacity < 0.999;
  material.needsUpdate = true;
}

function createGalaxyBackdrop(THREE) {
  const group = new THREE.Group();

  const createNebulaMap = (palette, density = 16, haze = 0.2) =>
    createCanvasTexture(THREE, (ctx, width, height) => {
      ctx.clearRect(0, 0, width, height);

      const base = ctx.createLinearGradient(0, 0, width, height);
      base.addColorStop(0, "rgba(0,0,0,0)");
      base.addColorStop(0.32, "rgba(20,28,54,0.18)");
      base.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, width, height);

      palette.forEach((tone, index) => {
        for (let i = 0; i < density; i += 1) {
          const x = width * (0.08 + Math.random() * 0.84);
          const y = height * (0.1 + Math.random() * 0.8);
          const radius = width * (0.06 + Math.random() * 0.18) * (1 + index * 0.12);
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
          gradient.addColorStop(0, tone.core);
          gradient.addColorStop(0.35, tone.mid);
          gradient.addColorStop(1, tone.edge);
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      for (let i = 0; i < 1800; i += 1) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = 0.6 + Math.random() * 1.8;
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * haze})`;
        ctx.fillRect(x, y, size, size);
      }
    });

  const nebulaLayers = [
    {
      size: [620, 260],
      position: [-28, -4, -185],
      rotationX: -Math.PI * 0.4,
      rotationZ: -0.08,
      opacity: 0.28,
      driftSpeed: 0.014,
      driftAmplitude: 5,
      texture: createNebulaMap(
        [
          { core: "rgba(255,178,108,0.24)", mid: "rgba(204,94,58,0.14)", edge: "rgba(204,94,58,0)" },
          { core: "rgba(111,125,255,0.18)", mid: "rgba(56,79,173,0.11)", edge: "rgba(56,79,173,0)" },
        ],
        14,
        0.05
      ),
    },
    {
      size: [560, 220],
      position: [92, 32, -210],
      rotationX: -Math.PI * 0.36,
      rotationZ: 0.22,
      opacity: 0.2,
      driftSpeed: 0.01,
      driftAmplitude: 7,
      texture: createNebulaMap(
        [
          { core: "rgba(118,168,255,0.18)", mid: "rgba(76,108,201,0.11)", edge: "rgba(76,108,201,0)" },
          { core: "rgba(255,230,188,0.14)", mid: "rgba(214,149,99,0.08)", edge: "rgba(214,149,99,0)" },
        ],
        11,
        0.035
      ),
    },
    {
      size: [420, 180],
      position: [-138, 54, -225],
      rotationX: -Math.PI * 0.3,
      rotationZ: -0.38,
      opacity: 0.14,
      driftSpeed: 0.018,
      driftAmplitude: 4,
      texture: createNebulaMap(
        [
          { core: "rgba(255,164,129,0.16)", mid: "rgba(171,84,74,0.09)", edge: "rgba(171,84,74,0)" },
          { core: "rgba(182,141,255,0.13)", mid: "rgba(103,76,182,0.08)", edge: "rgba(103,76,182,0)" },
        ],
        9,
        0.025
      ),
    },
  ];

  nebulaLayers.forEach((layer) => {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(layer.size[0], layer.size[1], 1, 1),
      new THREE.MeshBasicMaterial({
        map: layer.texture,
        transparent: true,
        opacity: layer.opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    plane.position.set(...layer.position);
    plane.rotation.x = layer.rotationX;
    plane.rotation.z = layer.rotationZ;
    plane.userData.baseOpacity = layer.opacity;
    plane.userData.driftSpeed = layer.driftSpeed;
    plane.userData.driftAmplitude = layer.driftAmplitude;
    plane.userData.basePositionY = layer.position[1];
    plane.userData.nebulaLayer = true;
    group.add(plane);
  });

  const andromeda = new THREE.Mesh(
    new THREE.PlaneGeometry(196, 56),
    new THREE.MeshBasicMaterial({
      map: createCanvasTexture(THREE, (ctx, width, height) => {
        ctx.clearRect(0, 0, width, height);

        const paintGalaxyLayer = (scaleX, scaleY, alpha, colorStops, rotation = 0) => {
          ctx.save();
          ctx.translate(width * 0.5, height * 0.5);
          ctx.rotate(rotation);
          ctx.scale(scaleX, scaleY);
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.17);
          colorStops.forEach(([stop, color]) => gradient.addColorStop(stop, color));
          ctx.fillStyle = gradient;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(0, 0, width * 0.17, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          ctx.globalAlpha = 1;
        };

        paintGalaxyLayer(
          2.9,
          0.32,
          1,
          [
            [0, "rgba(255,245,226,1)"],
            [0.12, "rgba(255,225,185,0.92)"],
            [0.34, "rgba(208,183,138,0.46)"],
            [0.7, "rgba(145,162,206,0.18)"],
            [1, "rgba(145,162,206,0)"],
          ]
        );

        paintGalaxyLayer(
          3.45,
          0.22,
          0.88,
          [
            [0, "rgba(255,235,208,0.42)"],
            [0.18, "rgba(226,203,165,0.25)"],
            [0.58, "rgba(141,164,227,0.12)"],
            [1, "rgba(141,164,227,0)"],
          ],
          0.04
        );

        ctx.save();
        ctx.translate(width * 0.5, height * 0.5);
        ctx.scale(1.5, 0.72);
        const core = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.18);
        core.addColorStop(0, "rgba(255,245,228,0.96)");
        core.addColorStop(0.16, "rgba(255,236,201,0.86)");
        core.addColorStop(0.38, "rgba(215,230,255,0.46)");
        core.addColorStop(0.7, "rgba(146,170,232,0.12)");
        core.addColorStop(1, "rgba(146,170,232,0)");
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(0, 0, width * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        for (let i = 0; i < 5; i += 1) {
          ctx.save();
          ctx.translate(width * 0.5, height * 0.5);
          ctx.rotate((i - 2) * 0.11);
          ctx.scale(2.45 - i * 0.16, 0.18 + i * 0.04);
          const arm = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.17);
          arm.addColorStop(0, "rgba(214,225,255,0.18)");
          arm.addColorStop(0.26, "rgba(162,184,245,0.16)");
          arm.addColorStop(0.48, "rgba(255,201,154,0.08)");
          arm.addColorStop(1, "rgba(148,173,234,0)");
          ctx.fillStyle = arm;
          ctx.beginPath();
          ctx.arc(0, 0, width * 0.17, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        ctx.fillStyle = "rgba(44,34,22,0.18)";
        for (let i = 0; i < 4; i += 1) {
          ctx.beginPath();
          ctx.ellipse(
            width * 0.5,
            height * 0.5 + (i - 1.5) * 1.65,
            width * (0.23 + i * 0.052),
            height * (0.022 + i * 0.01),
            0.13,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        for (let i = 0; i < 1200; i += 1) {
          const x = width * (0.11 + Math.random() * 0.78);
          const y = height * (0.19 + Math.random() * 0.62);
          const dx = (x - width * 0.5) / (width * 0.46);
          const dy = (y - height * 0.5) / (height * 0.2);
          const falloff = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
          if (falloff <= 0) continue;
          const warm = Math.random() > 0.82;
          ctx.fillStyle = warm
            ? `rgba(255,216,170,${0.012 + falloff * 0.065})`
            : `rgba(214,226,255,${0.01 + falloff * 0.05})`;
          ctx.fillRect(x, y, 0.7 + Math.random() * 1.1, 0.7 + Math.random() * 1.1);
        }

        ctx.save();
        ctx.translate(width * 0.62, height * 0.81);
        ctx.rotate(-0.22);
        ctx.scale(0.95, 0.62);
        const companion = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.06);
        companion.addColorStop(0, "rgba(255,248,236,0.58)");
        companion.addColorStop(0.24, "rgba(221,228,255,0.34)");
        companion.addColorStop(1, "rgba(221,228,255,0)");
        ctx.fillStyle = companion;
        ctx.beginPath();
        ctx.arc(0, 0, width * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }),
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  andromeda.position.set(220, 94, -360);
  andromeda.rotation.z = 0.34;
  andromeda.userData.baseOpacity = 0.4;
  group.add(andromeda);

  return group;
}

function updateGalaxyBackdropVisibility() {
  if (!runtime.galaxyGroup) return;
  const fade = clamp((state.cameraDistance - 18) / 36, 0, 1);
  runtime.galaxyGroup.children.forEach((child) => {
    const baseOpacity = child.userData.baseOpacity ?? child.material?.opacity ?? 1;
    if (child.material) {
      setMaterialOpacity(child.material, baseOpacity * fade);
    }
  });
}

async function create3DScene() {
  runtime.renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isMobile,
    alpha: true,
    powerPreference: "high-performance",
  });
  runtime.renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  runtime.renderer.setSize(state.width, state.height);
  runtime.renderer.outputColorSpace = THREE.SRGBColorSpace;
  runtime.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  runtime.renderer.toneMappingExposure = 1.06;

  if (!isMobile) {
    runtime.composer = new EffectComposer(runtime.renderer);
  }

  runtime.scene = new THREE.Scene();
  runtime.scene.background = new THREE.Color("#01040a");
  runtime.camera = new THREE.PerspectiveCamera(48, state.width / state.height, 0.1, 2000);
  runtime.raycaster = new THREE.Raycaster();
  runtime.pointer = new THREE.Vector2();
  runtime.clock = new THREE.Clock();
  runtime.targetVector = new THREE.Vector3();
  runtime.cameraLookAt = new THREE.Vector3();
  runtime.solarOrbitGroup = new THREE.Group();
  runtime.systemGroup = new THREE.Group();
  runtime.textureLoader = new THREE.TextureLoader();
  runtime.starfield = createStarfield(THREE);
  runtime.scene.add(runtime.starfield);
  if (!isMobile) {
    runtime.galaxyGroup = createGalaxyBackdrop(THREE);
    runtime.scene.add(runtime.galaxyGroup);
  }
  runtime.scene.add(runtime.solarOrbitGroup);
  runtime.solarOrbitGroup.add(runtime.systemGroup);

  if (!isMobile) {
    runtime.composer.addPass(new RenderPass(runtime.scene, runtime.camera));
    runtime.composer.addPass(
      new UnrealBloomPass(new THREE.Vector2(state.width, state.height), 0.38, 0.58, 0.94)
    );
    runtime.postPass = createCinematicGradePass(THREE);
    runtime.composer.addPass(runtime.postPass);
  }

  if (!isMobile) {
    const ambient = new THREE.AmbientLight(0xc6d9ff, 0.82);
    runtime.scene.add(ambient);
    const hemisphere = new THREE.HemisphereLight(0xb6dcff, 0x101827, 0.82);
    runtime.scene.add(hemisphere);
    const sunLight = new THREE.PointLight(0xffddb0, 5.7, 1440, 1.45);
    sunLight.position.set(0, 0, 0);
    runtime.scene.add(sunLight);
    const rimLight = new THREE.DirectionalLight(0xb4d0ff, 0.88);
    rimLight.position.set(120, 50, -180);
    runtime.scene.add(rimLight);
    const fillLight = new THREE.DirectionalLight(0xf6d3a2, 0.42);
    fillLight.position.set(-140, 30, 120);
    runtime.scene.add(fillLight);
  }

  const textures = await loadPlanetTextureSet();

  destinations.forEach((body, index) => {
    let material;
    if (isMobile && body.id !== "sun") {
      const mobileTexMap = {
        mercury: textures.mercury, venus: textures.venusSurface,
        earth: textures.earthDay, mars: textures.mars,
        jupiter: textures.jupiter, saturn: textures.saturn,
        uranus: textures.uranus, neptune: textures.neptune,
      };
      material = new THREE.MeshBasicMaterial({ map: mobileTexMap[body.id] ?? null });
    } else if (body.id === "sun") {
      material = createSunMaterial(THREE);
    } else if (body.id === "mercury") {
      material = new THREE.MeshStandardMaterial({
        map: textures.mercury,
        normalMap: textures.mercuryMaps?.normalMap ?? null,
        normalScale: new THREE.Vector2(0.7, 0.7),
        roughnessMap: textures.mercuryMaps?.roughnessMap ?? null,
        roughness: 0.96,
        metalness: 0.02,
        color: new THREE.Color("#c8beb2"),
      });
    } else if (body.id === "venus") {
      material = new THREE.MeshStandardMaterial({
        map: textures.venusSurface,
        normalMap: textures.venusMaps?.normalMap ?? null,
        normalScale: new THREE.Vector2(0.18, 0.18),
        roughnessMap: textures.venusMaps?.roughnessMap ?? null,
        roughness: 0.88,
        metalness: 0.0,
        color: new THREE.Color("#f0ddbc"),
      });
    } else if (body.id === "earth") {
      material = new THREE.MeshPhongMaterial({
        map: textures.earthDay,
        normalMap: textures.earthNormal,
        normalScale: new THREE.Vector2(0.85, 0.85),
        specularMap: textures.earthSpecular,
        specular: new THREE.Color("#9ec7ff"),
        shininess: 28,
      });
    } else if (body.id === "mars") {
      material = new THREE.MeshStandardMaterial({
        map: textures.mars,
        normalMap: textures.marsMaps?.normalMap ?? null,
        normalScale: new THREE.Vector2(0.36, 0.36),
        roughnessMap: textures.marsMaps?.roughnessMap ?? null,
        roughness: 0.94,
        metalness: 0.02,
        color: new THREE.Color("#e4a285"),
      });
    } else if (body.id === "jupiter") {
      material = new THREE.MeshStandardMaterial({
        map: textures.jupiter,
        normalMap: textures.jupiterMaps?.normalMap ?? null,
        normalScale: new THREE.Vector2(0.08, 0.08),
        roughnessMap: textures.jupiterMaps?.roughnessMap ?? null,
        roughness: 0.8,
        metalness: 0.01,
        color: new THREE.Color("#eed8b5"),
      });
    } else if (body.id === "saturn") {
      material = new THREE.MeshStandardMaterial({
        map: textures.saturn,
        normalMap: textures.saturnMaps?.normalMap ?? null,
        normalScale: new THREE.Vector2(0.07, 0.07),
        roughnessMap: textures.saturnMaps?.roughnessMap ?? null,
        roughness: 0.83,
        metalness: 0.01,
        color: new THREE.Color("#f2e6c8"),
      });
    } else if (body.id === "uranus") {
      material = new THREE.MeshStandardMaterial({
        map: textures.uranus,
        normalMap: textures.uranusMaps?.normalMap ?? null,
        normalScale: new THREE.Vector2(0.05, 0.05),
        roughnessMap: textures.uranusMaps?.roughnessMap ?? null,
        roughness: 0.68,
        metalness: 0.01,
        color: new THREE.Color("#d3f0f4"),
      });
    } else if (body.id === "neptune") {
      material = new THREE.MeshStandardMaterial({
        map: textures.neptune,
        normalMap: textures.neptuneMaps?.normalMap ?? null,
        normalScale: new THREE.Vector2(0.06, 0.06),
        roughnessMap: textures.neptuneMaps?.roughnessMap ?? null,
        roughness: 0.66,
        metalness: 0.01,
        color: new THREE.Color("#8eb3ff"),
      });
    } else {
      const texture = createPlanetTexture(THREE, body.id);
      material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: body.id === "sun" ? 0.68 : 0.94,
        metalness: 0.02,
        emissive: body.id === "sun" ? new THREE.Color("#ff9933") : new THREE.Color("#111111"),
        emissiveIntensity: body.id === "sun" ? 1.25 : 0.05,
      });
    }

    const mesh = new THREE.Mesh(new THREE.SphereGeometry(body.radius, isMobile ? 32 : 64, isMobile ? 32 : 64), material);
    mesh.userData.bodyId = body.id;
    mesh.userData.rotationSpeed = axialRotationRates[body.id] ?? 0.12;
    mesh.userData.orbitPhase = index * 0.36;
    mesh.rotation.z = THREE.MathUtils.degToRad(axialTiltDegrees[body.id] ?? 0);

    const pivot = new THREE.Object3D();
    pivot.rotation.y = index * 0.36;
    pivot.rotation.z = (index % 2 === 0 ? 1 : -1) * index * 0.012;
    mesh.position.x = body.orbitRadius;
    pivot.add(mesh);

    if (body.id === "saturn") {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(body.radius * 1.45, body.radius * 2.25, isMobile ? 32 : 128),
        createSaturnRingMaterial(THREE, textures.saturnRing)
      );
      ring.rotation.x = Math.PI * 0.5;
      ring.rotation.z = 0.14;
      ring.userData.bodyId = body.id;
      mesh.add(ring);
    }

    const moonPivots = [];
    const allMoonDefs = moonSystems[body.id] ?? [];
    const moonDefinitions = isMobile ? allMoonDefs.slice(0, 4) : allMoonDefs;
    if (moonDefinitions.length > 0) {
      const moonRig = new THREE.Group();
      moonRig.position.x = body.orbitRadius;
      moonRig.rotation.z = mesh.rotation.z * 0.9;
      pivot.add(moonRig);

      moonDefinitions.forEach((moon, moonIndex) => {
        const moonPivot = new THREE.Object3D();
        moonPivot.rotation.y = (moonIndex / moonDefinitions.length) * Math.PI * 2;
        moonPivot.rotation.z = moon.inclination ?? ((moonIndex % 2 === 0 ? 1 : -1) * 0.08);
        moonPivot.userData.orbitSpeed = moon.speed;
        moonPivot.userData.orbitPhase = moonIndex * 0.37;

        const moonMaterial = isMobile
          ? new THREE.MeshBasicMaterial({ color: moon.color })
          : new THREE.MeshStandardMaterial({
              map: createMoonTexture(THREE, moon.color, moon.accent),
              roughness: 0.96,
              metalness: 0.01,
            });
        const moonMesh = new THREE.Mesh(
          new THREE.SphereGeometry(moon.radius, isMobile ? 8 : 14, isMobile ? 8 : 14),
          moonMaterial
        );
        moonMesh.position.x = moon.distance;
        moonMesh.userData.rotationSpeed = moon.speed * 0.16;
        moonPivot.add(moonMesh);

        moonRig.add(moonPivot);
        moonPivots.push(moonPivot);
      });
    }

    if (body.id === "earth" && !isMobile) {
      const clouds = new THREE.Mesh(
        new THREE.SphereGeometry(body.radius * 1.02, 64, 64),
        createEarthCloudMaterial(THREE, textures.earthClouds)
      );
      clouds.userData.rotationSpeed = 0.12;
      mesh.add(clouds);
      mesh.add(createAtmosphereShell(body, "#69a7ff", 0.08, 1.025));
      mesh.add(createFresnelShell(THREE, body.radius, "#88c8ff", { intensity: 0.12, power: 4.8, scale: 1.03, edgeBoost: 0.52 }));
      mesh.add(createFresnelShell(THREE, body.radius, "#dff4ff", { intensity: 0.06, power: 6.0, scale: 1.015, edgeBoost: 0.38 }));
    }

    if (body.id === "mars") {
      mesh.add(createAtmosphereShell(body, "#ef8d62", 0.035, 1.025));
    }

    if (body.id === "venus") {
      mesh.add(createAtmosphereShell(body, "#ffd7a6", 0.08, 1.03));
    }

    if (body.id === "jupiter") {
      mesh.add(createAtmosphereShell(body, "#e7c596", 0.028, 1.02));
    }

    if (body.id === "saturn") {
      mesh.add(createAtmosphereShell(body, "#efe1bd", 0.025, 1.02));
    }

    if (body.id === "uranus") {
      mesh.add(createAtmosphereShell(body, "#b8f7ff", 0.045, 1.025));
    }

    if (body.id === "neptune") {
      mesh.add(createAtmosphereShell(body, "#6ea0ff", 0.05, 1.03));
    }

    runtime.systemGroup.add(pivot);
    runtime.bodyNodes[body.id] = { body, mesh, pivot, moonPivots };
  });

  runtime.solarOrbitGroup.position.set(-112, -6, -148);
}

function resize() {
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  if (!runtime.ready) return;
  runtime.camera.aspect = state.width / state.height;
  runtime.camera.updateProjectionMatrix();
  runtime.renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  runtime.renderer.setSize(state.width, state.height);
  runtime.composer?.setSize(state.width, state.height);
  runtime.postPass?.uniforms.resolution.value.set(state.width, state.height);
}

function worldPositionForBody(bodyId) {
  const node = runtime.bodyNodes[bodyId];
  if (!node) return new THREE.Vector3();
  const position = new THREE.Vector3();
  node.mesh.getWorldPosition(position);
  return position;
}

function getFramedLookAtTarget() {
  const baseTarget = worldPositionForBody(state.selectedBody);

  if (state.mode === "tour") {
    const step = guidedTourSteps[state.tourStepIndex];
    if (step && !step.bodyId) {
      return new THREE.Vector3(0, 0, 0);
    }
  }

  const body = bodies[state.selectedBody];
  if (!body) return baseTarget;
  const presentation = getBodyPresentation(state.selectedBody);

  if (state.cameraDistance > 24) {
    return baseTarget;
  }

  const right = new THREE.Vector3(Math.sin(state.yaw), 0, -Math.cos(state.yaw)).normalize();
  const down = new THREE.Vector3(0, -1, 0);
  const offset = right
    .multiplyScalar(body.radius * presentation.offsetX)
    .add(down.multiplyScalar(body.radius * presentation.offsetY));
  return baseTarget.clone().add(offset);
}

function updateBodyScreenPositions() {
  const { camera } = runtime;
  state.bodyScreenPositions = {};
  destinations.forEach((body) => {
    const projected = worldPositionForBody(body.id).clone().project(camera);
    state.bodyScreenPositions[body.id] = {
      x: ((projected.x + 1) * 0.5) * state.width,
      y: ((-projected.y + 1) * 0.5) * state.height,
    };
  });
}

function animateScene(dt) {
  const { systemGroup, solarOrbitGroup, galaxyGroup, starfield, camera, postPass } = runtime;

  if (state.introActive && state.mode === "interactive") {
    state.introElapsed += dt;
    const introT = clamp(state.introElapsed / 8.5, 0, 1);
    const eased = 1 - Math.pow(1 - introT, 2.2);
    state.targetCameraDistance = lerp(88, 54, eased);
    state.targetYaw = lerp(-0.28, 0.24, eased);
    state.targetPitch = lerp(0.08, 0.2, eased);
    if (introT >= 1) {
      state.introActive = false;
      state.introElapsed = 0;
    }
  }

  state.transitionBoost = Math.max(0, state.transitionBoost - dt * 0.7);
  const transitionResponse = state.mode === "tour" ? 0.06 : 0.04;
  const transitionLift = state.transitionBoost * 0.055;
  state.time = lerp(state.time, state.targetTime, 0.04);
  state.cameraDistance = lerp(state.cameraDistance, state.targetCameraDistance, transitionResponse + transitionLift);
  state.yaw = lerp(state.yaw, state.targetYaw, 0.065 + transitionLift);
  state.pitch = lerp(state.pitch, state.targetPitch, 0.06 + transitionLift * 0.9);

  const expansionFactor = 1 + Math.pow(state.time, 2.2) * 0.3;
  const orbitalTimeFactor = 0.18 + Math.pow(state.time, 1.7) * 2.8;
  systemGroup.scale.setScalar(expansionFactor);
  if (galaxyGroup) galaxyGroup.rotation.z = state.time * 0.12;
  updateGalaxyBackdropVisibility();
  if (starfield) {
    starfield.children.forEach((layer, index) => {
      layer.rotation.y += dt * layer.userData.rotationSpeed;
      layer.material.opacity =
        layer.userData.baseOpacity * (0.88 + Math.sin(state.time * 8 + index + layer.userData.twinkleOffset) * 0.12);
    });
  }
  if (galaxyGroup) {
    galaxyGroup.children.forEach((child, index) => {
      if (!child.userData.nebulaLayer) return;
      child.rotation.z += dt * child.userData.driftSpeed;
      child.position.y =
        child.userData.basePositionY +
        Math.sin(state.time * 3.2 + index * 1.4 + state.galacticOrbitAngle * 0.8) * child.userData.driftAmplitude;
    });
  }
  if (postPass) {
    postPass.uniforms.time.value += dt;
  }
  if (runtime.audioContext && runtime.audioPadGain && runtime.audioPulseGain) {
    const now = runtime.audioContext.currentTime;
    const zoomEnergy = 1 - clamp((state.cameraDistance - 10) / 70, 0, 1);
    const cosmicEnergy = 0.1 + state.time * 0.9;
    runtime.audioPadGain.gain.setTargetAtTime(0.08 + zoomEnergy * 0.08, now, 0.4);
    runtime.audioPulseGain.gain.setTargetAtTime(0.02 + cosmicEnergy * 0.03, now, 0.4);
    runtime.audioOscillators.forEach(({ oscillator, baseFrequency }) => {
      oscillator.frequency.setTargetAtTime(baseFrequency * (1 + state.time * 0.018), now, 0.8);
    });
  }

  // Stylized galactic orbit around Sagittarius A*.
  state.galacticOrbitAngle += dt * 0.045;
  solarOrbitGroup.position.set(
    -185 + Math.cos(state.galacticOrbitAngle) * 72,
    -6,
    -150 + Math.sin(state.galacticOrbitAngle) * 28
  );
  solarOrbitGroup.rotation.y = -state.galacticOrbitAngle + Math.PI * 0.35;

  Object.values(runtime.bodyNodes).forEach(({ body, mesh, pivot, moonPivots = [] }) => {
    const orbitRate = orbitalMotionScale[body.id] ?? 0;
    pivot.rotation.y += dt * orbitalTimeFactor * orbitRate;
    mesh.rotation.y += dt * mesh.userData.rotationSpeed;
    if (body.id === "sun" && mesh.material.uniforms?.time) {
      mesh.material.uniforms.time.value += dt;
    }
    mesh.children.forEach((child) => {
      if (child.userData.rotationSpeed) child.rotation.y += dt * child.userData.rotationSpeed;
      if (body.id === "earth" && child.material?.uniforms?.time) {
        child.material.uniforms.time.value += dt;
      }
      if (child.type === "Sprite") {
        child.material.rotation += dt * 0.02;
      }
    });
    moonPivots.forEach((moonPivot) => {
      moonPivot.rotation.y += dt * orbitalTimeFactor * 0.55 * moonPivot.userData.orbitSpeed;
      moonPivot.children.forEach((child) => {
        if (child.userData.rotationSpeed) child.rotation.y += dt * child.userData.rotationSpeed;
      });
    });
  });

  const currentStep = state.mode === "tour" ? guidedTourSteps[state.tourStepIndex] : null;
  if (currentStep) {
    state.targetCameraDistance = currentStep.zoomDistance;
    state.targetYaw = currentStep.yaw;
    state.targetPitch = currentStep.pitch;
    if (currentStep.bodyId) {
      const previousBody = state.selectedBody;
      state.selectedBody = currentStep.bodyId;
      if (previousBody !== currentStep.bodyId) {
        primeCinematicTransition(0.92);
      }
    }
    state.tourStepElapsed += dt * 1000;
    const settleDelta = Math.abs(state.cameraDistance - currentStep.zoomDistance);
    const minStepDuration = state.narrationEnabled ? 1800 : currentStep.duration;
    const narrationSettled = !state.narrationEnabled || !state.narrationSpeaking;
    if (state.tourStepElapsed > minStepDuration && settleDelta < 0.8 && narrationSettled) {
      state.tourStepIndex += 1;
      state.tourStepElapsed = 0;
      state.narratedStepKey = null;
      if (state.tourStepIndex >= guidedTourSteps.length) {
        stopGuidedTour();
      }
    }
  }
  syncTourNarration();

  const targetPosition = getFramedLookAtTarget();

  runtime.cameraLookAt.lerp(targetPosition, 0.08 + transitionLift * 0.8);

  const cinematicDrift =
    state.mode === "interactive" && state.cameraDistance < 20
      ? Math.sin(runtime.clock.elapsedTime * 0.28 + bodies[state.selectedBody].radius) * (0.038 + state.transitionBoost * 0.028)
      : 0;
  const cinematicLift =
    state.mode === "interactive" && state.cameraDistance < 20
      ? Math.sin(runtime.clock.elapsedTime * 0.19 + 0.4) * (0.012 + state.transitionBoost * 0.01)
      : 0;
  const cameraYaw = state.yaw + cinematicDrift;
  const cameraPitch = state.pitch + cinematicLift;
  const distance = state.cameraDistance;
  const x = runtime.cameraLookAt.x + Math.cos(cameraYaw) * Math.cos(cameraPitch) * distance;
  const y = runtime.cameraLookAt.y + Math.sin(cameraPitch) * distance * 0.62 + 6;
  const z = runtime.cameraLookAt.z + Math.sin(cameraYaw) * Math.cos(cameraPitch) * distance;
  camera.position.set(x, y, z);
  camera.lookAt(runtime.cameraLookAt);

  updateBodyScreenPositions();
  showTooltip();
  syncUi();
  if (isMobile) {
    runtime.renderer.render(runtime.scene, runtime.camera);
  } else {
    runtime.composer.render();
  }
}

function pickBody(clientX, clientY) {
  if (!runtime.ready) return null;
  const rect = canvas.getBoundingClientRect();
  runtime.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  runtime.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  runtime.raycaster.setFromCamera(runtime.pointer, runtime.camera);
  const intersects = runtime.raycaster.intersectObjects(
    Object.values(runtime.bodyNodes).map((node) => node.mesh),
    true
  );
  const first = intersects.find((entry) => entry.object.userData.bodyId);
  return first ? first.object.userData.bodyId : null;
}

function onPointerDown(event) {
  stopIntro();
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  state.dragging = true;
  state.lastX = event.clientX;
  state.lastY = event.clientY;
  if (state.mode === "tour") stopGuidedTour();
  canvas.setPointerCapture?.(event.pointerId);
}

function onPointerMove(event) {
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  if (activePointers.size >= 2) {
    // Pinch-to-zoom: measure distance change between two fingers
    const pts = [...activePointers.values()];
    const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
    if (state.lastPinchDist !== null) {
      const delta = state.lastPinchDist - dist;
      state.targetCameraDistance = clamp(
        state.targetCameraDistance + delta * 0.12,
        MIN_CAMERA_DISTANCE,
        MAX_CAMERA_DISTANCE
      );
    }
    state.lastPinchDist = dist;
    return;
  }

  state.lastPinchDist = null;
  state.hoveredBody = pickBody(event.clientX, event.clientY);
  if (!state.dragging) return;
  const dx = event.clientX - state.lastX;
  const dy = event.clientY - state.lastY;
  state.targetYaw += dx * 0.005;
  state.targetPitch = clamp(state.targetPitch + dy * 0.003, -0.3, 0.55);
  state.lastX = event.clientX;
  state.lastY = event.clientY;
}

function onPointerUp(event) {
  if (event?.pointerId !== undefined) activePointers.delete(event.pointerId);
  if (activePointers.size < 2) state.lastPinchDist = null;
  if (activePointers.size === 0) state.dragging = false;
}

function onCanvasClick(event) {
  const bodyId = pickBody(event.clientX, event.clientY);
  if (bodyId) visitBody(bodyId);
}

function onWheel(event) {
  event.preventDefault();
  stopIntro();
  if (state.mode === "tour") stopGuidedTour();
  state.targetCameraDistance = clamp(state.targetCameraDistance + event.deltaY * 0.03, MIN_CAMERA_DISTANCE, MAX_CAMERA_DISTANCE);
}

function onKeyDown(event) {
  stopIntro();
  if (event.key.toLowerCase() === "f") {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }
  if (event.key === "ArrowLeft") cycleBody(-1);
  if (event.key === "ArrowRight") cycleBody(1);
}

function attachUiEvents() {
  zoomSlider.addEventListener("input", (event) => {
    if (state.mode === "tour") stopGuidedTour();
    const value = Number(event.target.value) / 1000;
    state.targetCameraDistance = lerp(MAX_CAMERA_DISTANCE, 12, value);
  });

  timeSlider.addEventListener("input", (event) => {
    if (state.mode === "tour") stopGuidedTour();
    state.targetTime = Number(event.target.value) / 1000;
  });

  tourButton.addEventListener("click", startGuidedTour);
  resetButton.addEventListener("click", resetView);
  audioButton.addEventListener("click", () => {
    setAudioEnabled(!state.audioEnabled).catch((error) => console.warn("Audio toggle failed", error));
  });
  narrationButton.addEventListener("click", () => setNarrationEnabled(!state.narrationEnabled));
  tourNarrationButton.addEventListener("click", () => setNarrationEnabled(!state.narrationEnabled));
  prevBodyButton.addEventListener("click", () => cycleBody(-1));
  nextBodyButton.addEventListener("click", () => cycleBody(1));
  tourStopButton.addEventListener("click", stopGuidedTour);

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("pointerleave", (event) => {
    state.hoveredBody = null;
    activePointers.delete(event.pointerId);
    if (activePointers.size < 2) state.lastPinchDist = null;
    if (activePointers.size === 0) state.dragging = false;
  });
  canvas.addEventListener("click", onCanvasClick);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("resize", resize);

  // FAB panel toggles (tablet/mobile)
  const hudFab = document.getElementById("hud-fab");
  const infoFab = document.getElementById("info-fab");
  const leftRail = document.querySelector(".left-rail");
  const infoCard = document.querySelector(".info-card");

  const isSmallScreen = window.innerWidth <= 1100;

  // On mobile/tablet: start with panels hidden so the 3D canvas is front and centre
  if (isSmallScreen && leftRail) {
    leftRail.classList.add("is-hidden");
    hudFab?.setAttribute("aria-expanded", "false");
  }
  if (isSmallScreen && infoCard) {
    infoCard.classList.add("is-hidden");
    infoFab?.setAttribute("aria-expanded", "false");
  }

  if (hudFab && leftRail) {
    hudFab.addEventListener("click", () => {
      const hidden = leftRail.classList.toggle("is-hidden");
      hudFab.classList.toggle("is-active", !hidden);
      hudFab.setAttribute("aria-expanded", String(!hidden));
    });
  }

  if (infoFab && infoCard) {
    infoFab.addEventListener("click", () => {
      const hidden = infoCard.classList.toggle("is-hidden");
      infoFab.classList.toggle("is-active", !hidden);
      infoFab.setAttribute("aria-expanded", String(!hidden));
    });
  }

  // Swap hint text on touch devices
  const hintEl = document.getElementById("hint-text");
  if (hintEl && navigator.maxTouchPoints > 0) {
    hintEl.innerHTML = "Drag to orbit &middot; Pinch to zoom &middot; Tap planets to inspect them.";
  }

  // Planet Visits collapse toggle (mobile)
  const collapseBtn = document.getElementById("control-collapse-btn");
  const controlBody = document.getElementById("control-body");
  if (collapseBtn && controlBody) {
    collapseBtn.addEventListener("click", () => {
      const open = controlBody.classList.toggle("is-open");
      collapseBtn.setAttribute("aria-expanded", String(open));
    });
  }

  // Brief "tap icons" hint on mobile so users discover the FABs
  if (isSmallScreen && navigator.maxTouchPoints > 0) {
    const hint = document.createElement("div");
    hint.className = "mobile-tap-hint";
    hint.textContent = "Tap the icons below to open panels";
    document.body.appendChild(hint);
    hint.addEventListener("animationend", () => hint.remove());
  }
}

window.advanceTime = (ms) => {
  if (!runtime.ready) return;
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  const delta = ms / 1000 / steps;
  for (let index = 0; index < steps; index += 1) {
    animateScene(delta);
  }
};

window.render_game_to_text = () =>
  JSON.stringify({
    coordinateSystem: "3D scene projected onto canvas; x right, y down in screen space",
    mode: state.mode,
    selectedBody: state.selectedBody,
    hoveredBody: state.hoveredBody,
    cameraDistance: Number(state.cameraDistance.toFixed(2)),
    yaw: Number(state.yaw.toFixed(3)),
    pitch: Number(state.pitch.toFixed(3)),
    time: Number(state.time.toFixed(3)),
    targetTime: Number(state.targetTime.toFixed(3)),
    focus: bodies[state.selectedBody].name,
    scale: scaleName(state.cameraDistance),
    era: eraName(state.time),
    expansion: expansionName(state.time),
  });

async function init() {
  await create3DScene();
  runtime.ready = true;
  attachUiEvents();
  populateDestinations();
  resetView();

  function frame() {
    const dt = runtime.clock.getDelta();
    animateScene(dt);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

init().catch((error) => {
  console.error("Failed to initialize 3D scene", error);
  tourTitle.textContent = "3D Scene Failed to Load";
  tourDescription.textContent =
    "The renderer could not initialize. Check the browser console and network access to the Three.js module CDN.";
  document.body.classList.add("is-tour-active");
});
