# Tipsoi Driver

A Tipsoi-branded adaptation of the Ostad Driver browser game requested by the user. Original game and procedural world source: https://ostaddriver.com/ (retrieved 2026-11-01). Original authors retain their rights; no open-source license for the game was supplied with the page. Three.js retains its bundled MIT notice; fonts are SIL OFL.

The Dhaka-only city layout adapts the avenue/street grid and neighborhood ordering of https://baperrasta.com/ (inspected 2026-11-02), by Omar Faruqe Riyad. `src/dhaka-layout.json` records those place names and their grid ordering. `src/dhaka.js` rebuilds the streets and scenery for this game's engine: smaller blocks fit the existing 1:20 Bangladesh map, while road widths remain driveable. This is a bounded adaptation rather than a full-size or geographically exact reproduction. No Baper Rasta vehicle models, gameplay systems or executable bundle are included.

Only the Dhaka city rectangle gains the local street grid, metro viaduct/stations, brick sidewalks, yellow/black curbs, ground-floor shops, utility wires, parks and selected landmarks. National route coordinates and the existing vehicle roster remain intact. New city roads are excluded from NPC vehicle spawning; existing traffic continues on its retained routes. Open **Menu → Map → DHAKA CITY** to visit Shahbag, Gulistan, Mirpur 10, Uttara or Jatrabari. The other cities and rural farming scenery retain their existing implementation.

Dhaka has dedicated building-mounted Tipsoi product billboards sharing the existing three advertising textures. The city ring is 24 metres wide and the four highway links are 28 metres wide. The four national-road crossings at the city boundary widen to 28 metres on dry sections and taper back to their existing width within 160 metres; bridge widths remain unchanged. The wider surface also participates in driving traction and ground height. Building placement, sidewalks, curbs, metro piers and farming plots leave these approaches clear. Trees and their crowns are excluded from road ends, junction mouths and highway exits; city park and street trees use the same entrance checks.

Signals and passenger shelters use complete footprint checks against all nearby roads, intersections, roundabouts and widened highway exits. Shelters, benches, waiting passengers, signs and collision shapes move together to a safe roadside site; stop arc positions follow their relocated shelter. Signal poles and lights move to the roadside while their traffic controller and stop line remain on the approach. Shelters sit on concrete pads, and signal foundations meet the ground. Building approaches, trees and farm plots respect the reserved sites. If an approach has no safe pole position, its controller still operates without placing a pole in a lane.

Usable sidewalk sections throughout Dhaka and completed roadside bazaars have parked three-wheel vendor vans selling clothes, vegetables and fruit. Clothing vans display folded and hanging garments; produce vans have filled crates, striped canopies and Bengali signs. Each van has a seller and two animated customers who approach, browse, reach towards the goods and leave with shopping bags in a repeating shopping scene. Vans and customer routes stay on the sidewalk, leaving the curbside walking strip, building entrances, traffic lanes, bus stops and signals clear. Only the nearest 96 stalls and their characters are rendered; other stalls appear as the player travels. Bazaar stalls render only while their parent bazaar is loaded. These are scenery actors, separate from the traffic vehicle pool.

The elevated Dhaka metro has two tracks and two four-car trains. The service calls at Uttara North, Mirpur 10, Shahbag and Jatrabari, with acceleration, braking, station dwell and sliding doors that remain closed while moving. Each train shuttles along its own track and reverses at the terminals without teleporting. Both ends finish inside covered terminal headhouses with buffer stops; platforms cover the complete train length. Sleepers, overhead wires, safe centre-line piers and roadside station stairs complete the viaduct. Metro animation pauses with the game and remains separate from the road-vehicle traffic pool.

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

Every streamed apartment building and rural home has a 5.6-metre driveable access lane from the existing road to its entrance. Buildings face their approach; candidates without a clear connection are omitted. Trees, electricity poles and bollards leave the access lanes open. Existing service stations, markets and village terminals retain their road-facing forecourts.

Suitable flat roadside fields contain planted rice rows and farmers tending them with hoes. Crops cycle from seedlings through green growth, golden maturity and harvest over three minutes of running game time. Two animated farmers work in each plot; up to 24 plots, 48 farmers and 6,500 instanced crop clumps stream around the player. Water, forests, buildings and access lanes remain clear. Crop positions are cached between terrain updates to avoid repeatedly sampling the ground during growth animation.

High graphics is now the default: antialiasing, pixel ratio up to 2, 4096px desktop terrain (2048px touch devices), soft 2048px shadows, and high-resolution advertising textures. The garage dropdown and HUD graphics button switch between High and Balanced; the choice persists in this browser. Mirrors remain optional.

The open-road design uses a lavender garage selector and a rearranged HUD. Facebook, Privacy and update navigation have been removed. Billboard placements repeat every 240 in-game metres along non-narrow road splines, alternating sides and avoiding water. There are 593 valid positions in this world. A pool of 28 double-faced billboards follows the player within 1900 metres, sharing three product textures to keep rendering bounded.
