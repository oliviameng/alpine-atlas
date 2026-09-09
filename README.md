# Alpine Atlas

Explore Zermatt in 3D, then see the visual evidence behind what changed.

Built for the OpenAI GPT-6 Astra SF Hackathon, September 8, 2026.

**[Open the live demo](https://zermatt-mountain-atlas.oliviameng.chatgpt.site/?scene=reconstruction&view=matterhorn)** · **[Watch the demo video](https://www.loom.com/share/2aeb49305ee84ed38d3304aa39b7d558)**

The hosted demo is publicly accessible. Start with the Matterhorn orbit, then choose **Explore with Astra** to inspect dated image evidence.

## What it does

- A custom Three.js scene built from measured Swiss terrain, historical aerial imagery, and a modeled winter surface.
- A ten-second Matterhorn orbit, geographic compass, Swiss–Italian border, and a rock → glacier → river journey.
- Ready-made Astra experiences: choose a viewpoint, compare dated camera frames, then inspect the image regions supporting each observation.
- Sun-position visualization and wind/snow particles driven by clearly labeled Open-Meteo weather-model data or separate custom controls.
- A Zmuttgletscher pin with sourced historical area change, separate Swiss-wide glacier-volume context, and Protect Our Winters action resources.

## Run locally

Node.js 22.13 or newer is required.

```sh
npm ci
cp .env.example .env.local
# Set OPENAI_API_KEY in .env.local. Never commit your key.
npm run dev -- --host localhost --port 3000
```

Open http://localhost:3000/?scene=reconstruction&view=matterhorn.

Terrain, orbit, sunlight and research context work without a model key. Live Astra exploration requires API access to `gpt-6-astra`. The backend uses the OpenAI Responses API; your key stays server-side.

```sh
npx tsc --noEmit
npm run build
```

This public export removes the private Sites project binding. It retains vinext/React, the Cloudflare Vite runtime and API routes for local development. Hosted deployment requires configuring your own Cloudflare/Sites account and server secret.

## GPT-6 in development

GPT-6 Astra was used through Codex to build and refine the terrain pipeline, mesh/shader rendering, camera interactions, weather parsing, visual reasoning flow and evidence UI. The workflow included delegated source research, browser inspection, TypeScript/production builds, live API verification and iterative visual review. Human feedback drove the product scope and fidelity decisions.

## GPT-6 in the product

`app/api/explore/route.ts` streams two stages:

1. Astra calls the strict `explore_camera` tool to select a supported location and, when requested, a sunlight simulation time. The UI visibly follows that plan.
2. The server retrieves two dated official camera frames and sends them to Astra. Structured observations include normalized image regions; selecting an observation highlights its evidence and opens paired close-ups.

The application validates schemas, preserves source dates, rejects unavailable inputs and supports cancellation. An image region is never presented as a surveyed terrain coordinate. The hosted demo also offers an explicitly labeled recorded Astra run; its third-party camera-image snapshot is not redistributed in this source export. Use live exploration with your own key locally.

## Engineering and source data

Current terrain: 1,000,580 vertices and 1,997,160 triangles on a 20 m sampled grid, with unexaggerated elevations. This is the app grid spacing, not a claim of 20 m survey accuracy. Heights and imagery derive from swisstopo and retain their source metadata in `public/terrain/`.

The app combines a georeferenced overview texture and Matterhorn detail texture, custom snow/rock shading, terrain-horizon ambient shading, sun-aligned shadows, terrain-following waterways and camera motion. `scripts/bake-sky-visibility.cjs` reproduces the ambient-sky visibility attribute from the height grid.

Camera data: Zermatt Bergbahnen / Roundshot. Weather: Open-Meteo. Boundaries, routes and waterways: OpenStreetMap. Full credits and conditions are in [DATA-SOURCES.md](DATA-SOURCES.md).

## Practical limits

This is an exploration prototype, not navigation, an avalanche assessment, or a mountain safety recommendation. Historical imagery has varying capture dates and baked lighting. Snow, tree accents, sun lighting, wind particles and POV width are visual approximations. The app does not model terrain airflow, snow accumulation, glacier evolution or climate attribution from a pair of webcams. API calls and camera sources may fail independently.

## License

Original application code: MIT. Third-party dependencies and geospatial assets retain their own licenses and attribution requirements; see [DATA-SOURCES.md](DATA-SOURCES.md).
