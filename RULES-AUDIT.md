# Rules audit — 11 October 2026

Sources: [official BANG! base rules](https://bang.dvgiochi.com/content/1/docs/01_bang_rules_EN.pdf) and [Dodge City rules](https://www.dvgiochi.com/giochi/dodgecity/download/bang_dodge_city-rules.pdf).

This build is an adaptation, not a complete digital edition. The reference picture guides appearance, not rules. In particular its Dynamite, Panic! and Winchester text is incorrect.

## Playable modes

- Classic Saloon: core hidden-role objectives, role distributions, Sheriff bonus, clockwise play, living-seat distance, one shot per turn, reactions, rewards and Sheriff penalty. Reduced original deck.
- Hex & Holsters: custom spell rules; not an official expansion.
- Saloon Events: three custom rotating events; renamed to avoid representing this as official High Noon.
- Quick Draw: custom free-for-all, one-card draw.
- Three-Seat Showdown: public cyclic objectives from Dodge City's three-player variant; three-card kill reward. Uses this project's reduced deck.

## Character coverage

Implemented and tested: Bart Cassidy, El Gringo, Rose Doolan, Paul Regret, Willy the Kid, Slab the Killer, Vulture Sam. Assigned without duplicates. Abilities are public; roles retain their visibility rules.

Not implemented: Black Jack, Calamity Janet, Jesse Jones, Jourdonnais, Kit Carlson, Lucky Duke, Pedro Ramirez, Sid Ketchum, Suzy Lafayette. They must not be presented as selectable/playable until their abilities and draw/response choices are supported.

## Card coverage

Shoot/Dodge use the basic attack/response pattern. Rifle stays in play at range three and is inherited/discarded on elimination. Tonic is a house card; unlike official Beer it works with two survivors and does not rescue lethal damage. Dust Hex, Ward and Lantern Burst are custom spells. Spell range uses the same adjusted distance as other actions.

Not implemented: the official 80-card distribution, suits/ranks, named guns, Beer, Saloon, Stagecoach, Wells Fargo, General Store, Panic!, Cat Balou, Duel, Gatling, Indians!, Barrel, Jail, Dynamite, Scope, Mustang and expansion decks. None are listed as playable in the skill library.

Image corrections: official Winchester range is five; Panic! steals one card at distance one; Dynamite is a delayed draw check and can cause three damage to its holder. It is not a one-damage attack against everyone.

## Presentation

Shared public play events drive a sequential animation queue, physical illustrated card motion to the table, and separate shooting, casting, drinking, equipping and hit reactions. Reconnecting skips old animation history. Log rows open details and remain available on mobile. Characters are self-contained procedural meshes, not photorealistic scans or externally downloaded rigs.
