# Tipsoi Driver

A Tipsoi-branded adaptation of the Ostad Driver browser game requested by the user. Original game and procedural world source: https://ostaddriver.com/ (retrieved 2026-11-01). Original authors retain their rights; no open-source license for the game was supplied with the page. Three.js retains its bundled MIT notice; fonts are SIL OFL.

Tipsoi logo and FastFace 8, FastFace 5 Pro FP and FastFace Go Lite product images are from https://tipsoi.pro/. Branding is incorporated into the vehicle livery, bazaar signs, roadside displays, loading screen and product catalogue. This project is an adaptation, not an original implementation of the reference game.

Play online: https://tipsoi-driver-bd.technologia-0924.chatgpt.site/

Run `npm start` (or `node serve.cjs`), then open http://127.0.0.1:4173. Node.js 18 or newer is required; no dependency installation is needed.

`dist/` contains the ready-to-host static game and all its runtime assets. `src/` contains the reference baseline and Tipsoi customization sources. After editing those sources, run `npm run build` to regenerate `dist/index.html`. Any static web host can serve `dist/`.

## Deploy to Vercel

1. In Vercel, choose **Add New → Project** and import `foysalinovace-rgb/tipsoi-bus-game`.
2. Keep **Root Directory** at the repository root (`./`).
3. Deploy. `vercel.json` selects the **Other** framework preset, runs `npm run build`, and publishes `dist/`. Dependency installation is skipped because this project has no npm dependencies.

No environment variables, backend server or database are required. Vercel serves the static game directly; `npm start` is only for local development. After connecting the repository, pushes to `main` can trigger production deployments through Vercel's Git integration.

Controls: W/S or arrows to accelerate/brake, A/D to steer, Space handbrake, H horn, C camera, V vehicle, M map, T time, G weather, R reset, Esc pause/settings, P Tipsoi products. Touch controls appear on mobile devices. Records are stored locally; the reference game's server API is disabled.

New games begin on the N3 Dhaka–Mymensingh Highway, just beyond the Dhaka junction, heading towards Mymensingh. The top-right **মেনু** button opens the device, graphics, map, camera, vehicle, time, weather, mirror, sound and basic-control options. The menu pauses driving while open; close it with its close button, the backdrop or Escape.

Choose **Traffic** in that menu: **High** keeps the previous traffic density, **Medium** uses 40% of High's eligible vehicle pool, and **Low** uses 20%. Changes apply immediately and are saved with the browser's settings. The pause/settings screen uses the same three presets. Actual visible vehicle counts depend on nearby roads and available spawn space.

**Low** is the default traffic preset. Existing browser settings migrate to Low once; subsequent manual preset changes remain saved. **Restart**, beside the top-right menu, returns the current vehicle to the N3 starting point and stops it, retaining the selected vehicle, camera, settings and driving records.

Scenery uses procedurally generated window/glass/concrete textures with world-sized floors, nearby roof parapets, water tanks, AC units and floor ledges. Trees use branched bark-textured trunks, cutout leaf clusters and curved palm fronds. Details remain instanced and are streamed around the player. Product billboards are taller, larger, double-faced and unaffected by fog or night lighting; clear approach corridors prevent generated trees and buildings from covering their faces. Distant signs still follow normal camera visibility and the existing streaming range.

High graphics is now the default: antialiasing, pixel ratio up to 2, 4096px desktop terrain (2048px touch devices), soft 2048px shadows, and high-resolution advertising textures. The garage dropdown and HUD graphics button switch between High and Balanced; the choice persists in this browser. Mirrors remain optional.

The open-road design uses a lavender garage selector and a rearranged HUD. Facebook, Privacy and update navigation have been removed. Billboard placements repeat every 240 in-game metres along non-narrow road splines, alternating sides and avoiding water. There are 593 valid positions in this world. A pool of 28 double-faced billboards follows the player within 1900 metres, sharing three product textures to keep rendering bounded.
