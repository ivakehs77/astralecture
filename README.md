# Astralecture

Astralecture is an interactive 3D educational web experience for exploring the Sun, the eight planets, their moons, and the scale of the solar system in real time.

The project combines cinematic camera movement, real-time planet rendering, guided tour storytelling, and science facts into a single showcase website built for both learning and presentation.

## Features

- Interactive 3D exploration of the Sun and all 8 planets
- Guided tour mode with educational narration flow
- Planet facts panel with atmosphere, gravity, temperature, moons, diameter, and year length
- Compare-to-Earth educational summaries
- Real-time camera orbit and zoom controls
- Planet rotation, orbital motion, and moon systems
- Custom Sun shader and stylized deep-space background
- Ambient audio and narration toggles
- Responsive UI built for showcase presentation

## Tech Stack

- HTML
- CSS
- JavaScript
- [Three.js](https://threejs.org/) for 3D rendering
- [Vite](https://vitejs.dev/) for development and production builds
- Web Audio API for ambient sound
- Speech Synthesis API for narration

## Project Structure

- `index.html` - app structure and UI layout
- `styles.css` - visual styling, layout, spacing, and responsive behavior
- `app.js` - 3D scene setup, interactions, animation, camera logic, facts, tour flow, and audio
- `public/textures/` - planet and ring textures
- `vite.config.js` - Vite build configuration

## Run Locally

Install dependencies once:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Or run on a fixed localhost port:

```bash
npm run dev -- --host 127.0.0.1 --port 4175
```

## Production Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Deployment

This project is ready to deploy on platforms like:

- Vercel
- Cloudflare Pages
- Netlify

For Vercel, the default Vite settings should work:

- Build command: `npm run build`
- Output directory: `dist`

## Purpose

Astralecture was built as a standout AI/web showcase project that demonstrates:

- interactive frontend engineering
- 3D graphics in the browser
- educational product design
- animation and cinematic presentation

