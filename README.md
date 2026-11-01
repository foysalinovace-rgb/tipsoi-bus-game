# Tipsoi Driver

A Tipsoi-branded adaptation of the Ostad Driver browser game requested by the user. Original game and procedural world source: https://ostaddriver.com/ (retrieved 2026-11-01). Original authors retain their rights; no open-source license for the game was supplied with the page. Three.js retains its bundled MIT notice; fonts are SIL OFL.

Tipsoi logo and FastFace 8, FastFace 5 Pro FP and FastFace Go Lite product images are from https://tipsoi.pro/. Branding is incorporated into the vehicle livery, bazaar signs, roadside displays, loading screen and product catalogue. This project is an adaptation, not an original implementation of the reference game.

Play online: https://tipsoi-driver-bd.technologia-0924.chatgpt.site/

Run `npm start` (or `node serve.cjs`), then open http://127.0.0.1:4173. Node.js 18 or newer is required; no dependency installation is needed.

`dist/` contains the ready-to-host static game and all its runtime assets. `src/` contains the reference baseline and Tipsoi customization sources. After editing those sources, run `npm run build` to regenerate `dist/index.html`. Any static web host can serve `dist/`.

Controls: W/S or arrows to accelerate/brake, A/D to steer, Space handbrake, H horn, C camera, V vehicle, M map, T time, G weather, R reset, Esc pause/settings, P Tipsoi products. Touch controls appear on mobile devices. Records are stored locally; the reference game's server API is disabled.

High graphics is now the default: antialiasing, pixel ratio up to 2, 4096px desktop terrain (2048px touch devices), soft 2048px shadows, and high-resolution advertising textures. The garage dropdown and HUD graphics button switch between High and Balanced; the choice persists in this browser. Mirrors remain optional.

The open-road design uses a lavender garage selector and a rearranged HUD. Facebook, Privacy and update navigation have been removed. Billboard placements repeat every 240 in-game metres along non-narrow road splines, alternating sides and avoiding water. There are 593 valid positions in this world. A pool of 28 double-faced billboards follows the player within 1900 metres, sharing three product textures to keep rendering bounded.
