// Mechanics/data transcribed from dV Games' base rulebook and card list.
export const BASE_CHARACTERS = [
 ['Bart Cassidy',4,'After surviving damage, draw one card per health lost.'],
 ['Black Jack',4,'Reveal your second normal turn draw. A heart or diamond gives one extra card.'],
 ['Calamity Janet',4,'Use BANG! as Missed! and Missed! as BANG!, including in Duels and Indians! responses.'],
 ['El Gringo',3,'After surviving damage from another player’s card, take a random card from their hand per health lost.'],
 ['Jesse Jones',4,'Choose your first turn draw: the deck or a random card from another player’s hand.'],
 ['Jourdonnais',4,'One innate Barrel check per incoming shot, in addition to an equipped Barrel.'],
 ['Kit Carlson',4,'Look at the top three cards. Keep two and put the other back on top.'],
 ['Lucky Duke',4,'For each draw! check, reveal two cards and choose one result. Discard both.'],
 ['Paul Regret',3,'Other players see you at distance +1; stacks with Mustang.'],
 ['Pedro Ramirez',4,'Choose your first turn draw from the deck or the top of the discard pile.'],
 ['Rose Doolan',4,'See others at distance −1, minimum 1; stacks with Scope.'],
 ['Sid Ketchum',4,'Discard any two hand cards to heal one, including out of turn or to survive lethal damage.'],
 ['Slab the Killer',4,'Your BANG! needs two Missed! effects. Gatling still needs only one.'],
 ['Suzy Lafayette',4,'Draw when your hand becomes empty. During a Duel, wait until it finishes.'],
 ['Vulture Sam',4,'Take all hand and in-play cards from an eliminated player.'],
 ['Willy the Kid',4,'Play any number of BANG! cards on your turn.']
].map(([name,hp,ability])=>({name,hp,ability}));
export const WEAPONS={'Volcanic':1,'Schofield':2,'Remington':3,'Rev. Carabine':4,'Winchester':5};
export const BASE_CARDS={
 'BANG!':'Shoot one other player within weapon range. Normally one BANG! per turn.',
 'Missed!':'Cancel one incoming shot. Slab’s BANG! requires two cancellation effects.',
 'Beer':'Heal yourself by one. May save lethal damage. Has no effect with only two survivors.',
 'Saloon':'Heal every living player by one. Play on your turn, never as a lethal rescue.',
 'Stagecoach':'Draw two cards.','Wells Fargo':'Draw three cards.',
 'General Store':'Reveal one card per living player. Each chooses one, starting with you and going clockwise.',
 'Panic!':'Steal a random hand card or choose equipment from a player at distance one. Gun range does not help.',
 'Cat Balou':'Discard a random hand card or choose equipment from any player, regardless of distance.',
 'Duel':'Target any opponent. Alternate discarding BANG!, target first; the first to stop loses one health.',
 'Gatling':'Shoot every other player, regardless of distance. Does not use your BANG! allowance.',
 'Indians!':'Every other player must discard BANG! or lose one health. No Barrel or Missed! defense.',
 'Barrel':'Before using Missed!, reveal a draw! card. A heart cancels one shot effect.',
 'Jail':'Equip on any non-Sheriff. At their next turn a heart lets them act; otherwise they skip. Then discard Jail.',
 'Dynamite':'Equip on yourself. Next turn, spades 2–9 explodes for three damage; otherwise pass left. Check before Jail.',
 'Mustang':'Other players see you at distance +1.','Scope':'You see other players at distance −1, minimum 1.',
 ...Object.fromEntries(Object.entries(WEAPONS).map(([name,range])=>[name,`Equip range ${range}. Replaces your previous gun.${name==='Volcanic'?' Allows unlimited BANG! cards.':''}`]))
};
export const SUITS={hearts:'♥',diamonds:'♦',clubs:'♣',spades:'♠'};
export const cardLabel=c=>`${c.type} · ${{11:'J',12:'Q',13:'K',14:'A'}[c.rank]||c.rank||''}${SUITS[c.suit]||''}`;
// Each row is [type, suit, ranks]. Deck is exactly 80 cards, including duplicate ranks.
export const DECK_ROWS=[
 ['BANG!','spades',[14]],['BANG!','diamonds',[2,3,4,5,6,7,8,9,10,11,12,13,14]],['BANG!','clubs',[2,3,4,5,6,7,8,9]],['BANG!','hearts',[12,13,14]],
 ['Missed!','clubs',[10,11,12,13,14]],['Missed!','spades',[2,3,4,5,6,7,8]],
 ['Beer','hearts',[6,7,8,9,10,11]],['Saloon','hearts',[5]],['Stagecoach','spades',[9,9]],['Wells Fargo','hearts',[3]],
 ['General Store','clubs',[9]],['General Store','spades',[12]],['Panic!','hearts',[11,12,14]],['Panic!','diamonds',[8]],
 ['Cat Balou','hearts',[13]],['Cat Balou','diamonds',[9,10,11]],['Duel','diamonds',[12]],['Duel','spades',[11]],['Duel','clubs',[8]],
 ['Gatling','hearts',[10]],['Indians!','diamonds',[13,14]],['Barrel','spades',[12,13]],['Dynamite','hearts',[2]],
 ['Jail','spades',[10,11]],['Jail','hearts',[4]],['Mustang','hearts',[8,9]],['Scope','spades',[14]],
 ['Volcanic','spades',[10]],['Volcanic','clubs',[10]],['Schofield','clubs',[11,12]],['Schofield','spades',[13]],
 ['Remington','clubs',[13]],['Rev. Carabine','clubs',[14]],['Winchester','spades',[8]]
];
