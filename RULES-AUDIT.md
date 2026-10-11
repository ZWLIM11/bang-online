# Rules audit — 11 October 2026

## Sources and scope

- [Publisher base rulebook](https://bang.dvgiochi.com/content/1/docs/01_bang_rules_EN.pdf)
- [Publisher FAQ](https://www.dvgiochi.com/giochi/bang/download/Bang!_FAQ_ENG.pdf)
- [Publisher base card list](https://bang.dvgiochi.com/cardslist.php?id=1)
- [Dodge City three-player rules](https://www.dvgiochi.com/giochi/dodgecity/download/bang_dodge_city-rules.pdf)

The reference picture guides appearance, not rules. Its Dynamite, Panic! and Winchester descriptions are incorrect: Dynamite can deal three damage to its holder, Panic! steals within distance one, and Winchester has range five.

## New base-rules tables

BANG! base rules (4–7 players) and the legacy Classic identifier now use a separate authoritative engine with the 80-card base distribution, suits/ranks, all 16 unique base characters, role objectives, Sheriff health bonus, draw/play/discard phases, living-seat distance, equipment, reactions and elimination rewards/penalties. Three-Seat Showdown uses the same cards and characters with Dodge City's public cyclic objectives and three-card elimination reward.

Character choices are explicit: Kit Carlson privately keeps two of three; Lucky Duke chooses one of two public draw-check results and discards both; Jesse Jones and Pedro Ramirez choose their first draw source; Sid Ketchum selects two hand cards to heal. General Store is selected clockwise. Black Jack reveals the second normal draw. Calamity Janet swaps BANG!/Missed!, Jourdonnais stacks with Barrel, and Suzy waits for a Duel to finish. Bart and El Gringo only draw after surviving damage. Vulture inherits before a Sheriff/Deputy penalty.

Implemented base cards: BANG!, Missed!, Beer, Saloon, Stagecoach, Wells Fargo, General Store, Panic!, Cat Balou, Duel, Gatling, Indians!, Barrel, Jail, Dynamite, Mustang, Scope, Volcanic, Schofield, Remington, Rev. Carabine and Winchester. Choice dialogs cover reactions, Barrel checks, lethal Beer/Sid rescue, equipment targets and elimination discard order. Dynamite resolves before Jail. Weapons affect BANG! range, not Panic! distance.

## Explicit exclusions / house modes

This is not every published expansion or a tournament platform. Dodge City expansion cards/characters, official High Noon, A Fistful of Cards, Wild West Show, Gold Rush, The Valley of Shadows, Armed & Dangerous, Great Train Robbery, Legends and other expansion sets are not included. The three-player variant is included without adding Dodge City's expansion deck.

Hex & Holsters retains its original reduced deck and three custom magic cards: Dust Hex, Ward and Lantern Burst. BANG!'s base game has no magic-spell deck. Saloon Events has three original house events, not the official High Noon expansion. Quick Draw remains a custom free-for-all. These modes use the original seven-character subset and do not claim full base rules. Forfeit and AI pacing are digital house behavior.

Previously started rooms retain their original engine for compatibility. Create a fresh BANG! base-rules table to use the new rules. AI uses filtered player views and resolves the same server-validated choices as humans.

## Verification

Automated engine and Worker tests cover character choices, hand privacy, legal responses, distance, guns, lethal rescue, Duel attribution, Jail/Dynamite ordering, Vulture penalties, discard order, three-player rewards and Durable Object eviction during a private choice. Repeated full AI games check progress and conservation of all 80 unique card IDs. Browser verification covers a real Kit Carlson choice and the resulting hand. This is implementation coverage, not a claim that every possible interaction has been exhaustively proven.
