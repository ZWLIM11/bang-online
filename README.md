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
| BANG! base rules | 4–7 | All 16 base characters, 80 playing cards, suits/ranks, choice abilities and official base card effects. |
| Hex & Holsters | 4–7 | Classic roles plus Dust Hex, Ward and Lantern Burst. One spell per turn. |
| Saloon Events (house mode) | 4–7 | Classic roles plus a public rotating event: Dust Storm, Open Bar or Long Shadows. |
| Quick Draw | 2–6 | Short free-for-all, one card drawn per turn. Last player alive wins. |
| Three-Seat Showdown | 3 | Public cyclic roles, all 16 base characters and the base 80-card deck. |

Base-rules tables implement the base set. The other house modes retain simplified original decks. Expansion decks are not included; magic spells belong only to Hex & Holsters. The original tabletop rules and expansions are published by [dV Games](https://www.dvgiochi.com/area-download/index.cfm?lang=eng). Any commercial use of BANG! names, art, or exact content would require appropriate rights.

## Table action flow

1. The server validates the active player, card, target and range.
2. It removes the card from that player's private hand and publishes the play in the shared event log.
3. Every connected client displays the action on the centre of the table and highlights the seats involved.
4. A target chooses a legal card or character response. The server resolves checks, damage and possible rescue before continuing.
5. The server sends each player a filtered view of the same authoritative game state.

The scene uses Three.js WebGL with original modeled cowboy figures, weapons, lanterns, mugs, ammunition, a wooden table and a furnished saloon bar. Drag to rotate the camera or switch between seated and overhead views. Weapon and spell effects follow public game events; costumes never reveal hidden roles. A CSS table remains available when WebGL cannot initialize. These are stylized procedural models, not photorealistic scanned people. Three.js 0.170.0 is vendored under its included MIT license.


## Interactive presentation
Cards open illustrated detail dialogs with legal target choices. Player nameplates and the right-hand saloon desk expose public information, private role help, the skill library, rules, and invites. Incoming attacks open response dialogs; turn hints and optional sound alerts guide play. Quit leaves a lobby (transferring host) or forfeits an active seat. Character portraits and skill illustrations are original generated raster artwork; the actual 3D characters remain procedural models with refined facial and clothing details.

Artwork: built-in image_gen created public/art/portraits.png and public/art/cards.png. Prompt brief: a precise 4×2 atlas of realistic adult Western character busts under warm saloon lighting; and a precise 4×2 atlas of realistic revolver, deflected bullet, tonic, rifle, dust hex, magical ward, lantern burst, and crossed revolvers illustrations on aged parchment. No text or gutters. Portrait assignment is cosmetic and does not identify roles.

## Solo play, AI and character interaction
Use Play solo with AI for an immediate match in the selected mode. Lobby hosts can fill to four seats (three for Showdown, at least the mode minimum) or remove AI before starting. AI uses filtered player views and server-validated moves, with approximately 1.7 seconds between decisions. Bot progression runs while an authenticated client polls the room; an unattended room pauses. AI is rules-based rather than an LLM and does not read opponents' private cards or hidden roles.

My seat gives a seated first-person camera; drag to look around. Seated view and Table view restore overview cameras. Tip hat, Cheers and Challenge publish shared character gestures with a three-second cooldown. Shooting uses character aim/recoil and a muzzle flash, blocked attacks lean aside, damage recoils, and eliminated figures slump. These are procedural animations, not motion-captured characters or free-roaming controls.

The daylight art asset public/art/saloon-daylight.png was created with built-in image_gen. Prompt: cinematic sunlit frontier saloon, honey-colored wood, teal window frames, swinging doors onto a red-rock town, amber lamps, poker table, chairs and balcony, bright inviting atmosphere, realistic materials, no people, no text, no black vignette.

## October 11 rules and presentation audit

See [RULES-AUDIT.md](RULES-AUDIT.md) for publisher sources and coverage. Fresh base-rules tables include all 16 characters and all 80 cards, with private/public choice dialogs, accurate response types, equipment, delayed checks and lethal rescue. Previously started rooms retain their old engine; create a fresh base-rules table. Custom magic and event modes are separately labelled.

The seated camera now begins at your own seat. Models use shaped torsos, jaws, eyelids, hats, belts, holsters and seated legs. Casting sends an illustrated 3D card onto the table; drink/equip/cast/shoot have different motions. Log entries are raised clickable panels and remain visible at mobile widths. No external character models or rigs were added.
