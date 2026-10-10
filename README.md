# Hex & Holsters — saloon table prototype

A dependency-free, browser-based Wild West tabletop game. Players create a room, choose a mode, share the room code, and play on one synchronized saloon table. A player's hand and hidden role are sent only to that player; played cards, targets, responses, damage, equipment, and events are public.

## Run

Requires Node.js 20 or newer.

```sh
node server.js
```

Open `http://localhost:3000` in separate browser tabs or on devices that can reach this computer. Set `PORT` to choose another port. Run `node --test` for engine and Cloudflare adapter tests. Local Node rooms are held in memory and reset when the server restarts.

## Cloudflare hosting

This follows the deployment pattern of the `monopoly-deal` game: one Cloudflare Worker serves the site and `/api/*`, with one SQLite-backed Durable Object per multiplayer room. The browser and API use the same origin. Cloudflare rooms persist across Worker restarts, and inactive rooms expire 24 hours after the last game change.

`wrangler.jsonc` targets the existing `bang-online` Worker. After signing in to Cloudflare, deploy from this repository root:

```sh
npx wrangler@4 deploy
```

The deployed Worker URL is printed by Wrangler. A plain static Pages deployment cannot run the multiplayer room API by itself. Keep Cloudflare credentials out of this repository.

## Selectable modes

| Mode | Players | Rules in this prototype |
| --- | --- | --- |
| Classic Saloon | 4–7 | Hidden Sheriff, Deputy, Outlaw and Renegade roles; clockwise turns, range, shots, Dodge, healing and equipment. |
| Hex & Holsters | 4–7 | Classic roles plus Dust Hex, Ward and Lantern Burst. One spell per turn. |
| High Noon Events | 4–7 | Classic roles plus a public rotating event: Dust Storm, Open Bar or Long Shadows. |
| Quick Draw | 2–6 | Short free-for-all, one card drawn per turn. Last player alive wins. |
| Three-Seat Showdown | 3 | Public Deputy, Outlaw and Renegade roles with distinct targets. |

The game uses original card names and simplified card sets. It is a playable foundation, not a complete digital edition of BANG! or its expansions. The original tabletop rules and expansions are published by [dV Games](https://www.dvgiochi.com/area-download/index.cfm?lang=eng). Any commercial use of BANG! names, art, or exact content would require appropriate rights.

## Table action flow

1. The server validates the active player, card, target and range.
2. It removes the card from that player's private hand and publishes the play in the shared event log.
3. Every connected client displays the action on the centre of the table and highlights the seats involved.
4. A target may block with Dodge or Ward. The server resolves the response before damage.
5. The server sends each player a filtered view of the same authoritative game state.

The scene uses Three.js WebGL with original modeled cowboy figures, weapons, lanterns, mugs, ammunition, a wooden table and a furnished saloon bar. Drag to rotate the camera or switch between seated and overhead views. Weapon and spell effects follow public game events; costumes never reveal hidden roles. A CSS table remains available when WebGL cannot initialize. These are stylized procedural models, not photorealistic scanned people. Three.js 0.170.0 is vendored under its included MIT license.

