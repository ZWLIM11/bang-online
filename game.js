import {startBase,actBase,viewBase} from './base-game.js';
// Web Crypto is available in both Node.js and Cloudflare Workers.
const randomUUID = () => crypto.randomUUID();
const randomInt = max => {
  if (!Number.isSafeInteger(max) || max < 1) throw Error('Invalid shuffle range.');
  const limit = Math.floor(0x100000000 / max) * max;
  const number = new Uint32Array(1);
  do { crypto.getRandomValues(number); } while (number[0] >= limit);
  return number[0] % max;
};

export const MODES = {
  standard: {name:'BANG! · base rules',min:4,max:7,summary:'All 16 base characters, 80 cards, choice abilities and official card effects. No custom spells.'},
  classic: { name: 'Classic BANG! · base rules', min: 4, max: 7, summary: 'All 16 base characters and the official 80-card deck. No custom spells.' },
  hex: { name: 'Hex & Holsters · house mode', min: 4, max: 7, summary: 'Custom reduced deck with Dust Hex, Ward and Lantern Burst. Not official BANG! rules.' },
  highnoon: { name: 'Saloon Events · house mode', min: 4, max: 7, summary: 'Three original rotating events. Not the official High Noon expansion.' },
  quick: { name: 'Quick Draw', min: 2, max: 6, summary: 'A short free-for-all. Last player standing wins.' },
  showdown: { name: 'Three-Seat Showdown', min: 3, max: 3, summary: 'Official three-player cyclic roles with all 16 base characters and the base deck.' }
};

export const CHARACTERS = [
  {name:'Bart Cassidy',hp:4,ability:'Draw a card for each health point lost.'},
  {name:'El Gringo',hp:3,ability:'Take a random card from the attacker for each health point lost, if they have any.'},
  {name:'Rose Doolan',hp:4,ability:'See other players at distance 1 less, minimum 1.'},
  {name:'Paul Regret',hp:3,ability:'Other players see you at distance 1 greater.'},
  {name:'Willy the Kid',hp:4,ability:'Play any number of Shoot cards during your turn.'},
  {name:'Slab the Killer',hp:4,ability:'Your Shoot requires two Dodge cards to stop.'},
  {name:'Vulture Sam',hp:4,ability:'Collect the cards and equipment of eliminated players.'}
];

const EVENTS = [
  { name: 'Dust Storm', text: 'Weapon range is reduced by 1 (minimum 1).' },
  { name: 'Open Bar', text: 'The active player heals 1 at the start of their turn.' },
  { name: 'Long Shadows', text: 'Hand limit is 1 higher this round.' }
];

const shuffle = items => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};
const card = type => ({ id: randomUUID(), type });
const active = room => room.players.filter(p => p.hp > 0);
const log = (room, message, effect = null) => {
  room.version++;
  room.history.unshift({ id: room.version, message, effect });
  room.history.length = Math.min(room.history.length, 30);
};
const draw = (room, player, amount) => {
  for (let i = 0; i < amount; i++) {
    if (!room.deck.length) room.deck = shuffle(room.discard.splice(0));
    if (room.deck.length) player.hand.push(room.deck.pop());
  }
};

export function createRoom(mode, name, code = randomUUID().slice(0, 6).toUpperCase()) {
  if (!MODES[mode]) throw Error('Choose a valid mode.');
  const host = { id: randomUUID(), token: randomUUID(), name: cleanName(name), hp: 0, maxHp: 0, hand: [], role: null, weapon: null };
  return { code, mode, host: host.id, players: [host], started: false, turn: 0, phase: 'lobby', pending: null, deck: [], discard: [], eventIndex: -1, usedShot: false, usedSpell: false, history: [], version: 0, winner: null };
}
export function cleanName(name) {
  const value = String(name || '').trim().slice(0, 20);
  if (!value) throw Error('Enter a player name.');
  return value.replace(/[<>]/g, '');
}
export function joinRoom(room, name) {
  if (room.started) throw Error('This game has already started.');
  if (room.players.length >= MODES[room.mode].max) throw Error('This table is full.');
  const player = { id: randomUUID(), token: randomUUID(), name: cleanName(name), hp: 0, maxHp: 0, hand: [], role: null, weapon: null };
  room.players.push(player);
  if (!room.host) room.host = player.id;
  log(room, `${player.name} joined the table.`);
  return player;
}

function rolesFor(mode, count) {
  if (mode === 'quick') return Array(count).fill('Gunslinger');
  if (mode === 'showdown') return shuffle(['Deputy', 'Outlaw', 'Renegade']);
  const roles = ['Sheriff', 'Renegade', 'Outlaw', 'Outlaw'];
  if (count >= 5) roles.push('Deputy');
  if (count >= 6) roles.push('Outlaw');
  if (count >= 7) roles.push('Deputy');
  return shuffle(roles);
}
function buildDeck(mode) {
  const amounts = { Shoot: 28, Dodge: 17, Tonic: 12, Rifle: 8 };
  if (mode === 'hex') Object.assign(amounts, { 'Dust Hex': 9, Ward: 8, 'Lantern Burst': 4 });
  return shuffle(Object.entries(amounts).flatMap(([type, amount]) => Array.from({ length: amount }, () => card(type))));
}
export function startRoom(room, token) {
  const mode = MODES[room.mode];
  if (room.players[0].token !== token) throw Error('Only the host can start the game.');
  if (room.started) throw Error('Game already started.');
  if (room.players.length < mode.min) throw Error(`${mode.name} needs at least ${mode.min} players.`);
  if(['standard','classic','showdown'].includes(room.mode)){startBase(room);return;}
  const roles = rolesFor(room.mode, room.players.length);
  const characters = shuffle(CHARACTERS);
  room.deck = buildDeck(room.mode);
  room.players.forEach((p, i) => {
    p.role = roles[i];
    p.character = characters[i];
    p.maxHp = p.character.hp + (p.role === 'Sheriff' ? 1 : 0);
    p.hp = p.maxHp;
    draw(room, p, p.hp);
  });
  room.started = true;
  room.turn = Math.max(0, room.players.findIndex(p => p.role === 'Sheriff' || (room.mode === 'showdown' && p.role === 'Deputy')));
  room.phase = 'play';
  beginTurn(room);
  log(room, `${room.players[room.turn].name} begins.`, { kind: 'start' });
}
function beginTurn(room) {
  const player = room.players[room.turn];
  room.usedShot = false;
  room.usedSpell = false;
  if (room.mode === 'highnoon' && (room.eventIndex < 0 || player.role === 'Sheriff')) {
    room.eventIndex = (room.eventIndex + 1) % EVENTS.length;
    log(room, `${EVENTS[room.eventIndex].name}: ${EVENTS[room.eventIndex].text}`, { kind: 'event', label: EVENTS[room.eventIndex].name });
  }
  if (room.mode === 'highnoon' && EVENTS[room.eventIndex].name === 'Open Bar') player.hp = Math.min(player.maxHp, player.hp + 1);
  draw(room, player, room.mode === 'quick' ? 1 : 2);
  room.phase = 'play';
}
function nextTurn(room) {
  if (room.winner) return;
  do { room.turn = (room.turn + 1) % room.players.length; } while (room.players[room.turn].hp <= 0);
  beginTurn(room);
  log(room, `${room.players[room.turn].name}'s turn.`);
}
function distance(room, a, b) {
  const living = active(room);
  const ai = living.indexOf(a), bi = living.indexOf(b);
  const gap = Math.abs(ai - bi);
  return Math.max(1, Math.min(gap, living.length - gap) + (b.character?.name === 'Paul Regret' ? 1 : 0) - (a.character?.name === 'Rose Doolan' ? 1 : 0));
}
function checkWinner(room, killer, victim) {
  const living = active(room);
  if (room.mode === 'quick') {
    if (living.length === 1) room.winner = `${living[0].name} wins the Quick Draw.`;
  } else if (room.mode === 'showdown') {
    const target = { Deputy: 'Renegade', Renegade: 'Outlaw', Outlaw: 'Deputy' };
    if (killer?.role && victim.role === target[killer.role]) room.winner = `${killer.name} wins the Showdown.`;
    else if (living.length === 1) room.winner = `${living[0].name} wins the Showdown.`;
  } else {
    const sheriff = room.players.find(p => p.role === 'Sheriff');
    if (sheriff.hp <= 0) {
      const renegades = living.filter(p => p.role === 'Renegade');
      room.winner = living.length === 1 && renegades.length === 1 ? `${renegades[0].name} wins as Renegade.` : 'Outlaws win.';
    } else if (!living.some(p => p.role === 'Outlaw' || p.role === 'Renegade')) room.winner = 'Sheriff and Deputies win.';
  }
  if (room.winner) { room.phase = 'finished'; log(room, room.winner, { kind: 'win', label: room.winner }); }
}
function damage(room, target, source, type) {
  target.hp--;
  log(room, `${target.name} loses 1 health.`, { kind: 'damage', from: source?.id, to: target.id, label: type });
  if (target.hp>0 && target.character?.name === 'Bart Cassidy') draw(room,target,1);
  if (target.hp>0 && target.character?.name === 'El Gringo' && source?.hand.length) target.hand.push(...source.hand.splice(randomInt(source.hand.length),1));
  if (target.hp <= 0) {
    const scavenger = active(room).find(p=>p.character?.name === 'Vulture Sam');
    const possessions = [...target.hand, ...(target.weaponCard ? [target.weaponCard] : [])];
    if(scavenger) scavenger.hand.push(...possessions); else room.discard.push(...possessions);
    target.hand = [];
    target.weapon = null;
    target.weaponCard = null;
    log(room, `${target.name} is eliminated. Role: ${target.role}.`, { kind: 'eliminate', to: target.id });
    if(room.mode === 'showdown' && source) draw(room,source,3);
    if (room.mode !== 'quick' && room.mode !== 'showdown') {
      if (target.role === 'Outlaw' && source) draw(room, source, 3);
      if (source?.role === 'Sheriff' && target.role === 'Deputy') {
        room.discard.push(...source.hand,...(source.weaponCard?[source.weaponCard]:[])); source.hand = []; source.weapon = null; source.weaponCard = null;
      }
    }
    checkWinner(room, source, target);
  }
}
function resolvePending(room, blocked) {
  const pending = room.pending;
  const target = room.players.find(p => p.id === pending.targets[pending.index]);
  const source = room.players.find(p => p.id === pending.source);
  log(room, blocked ? `${target.name} blocks ${pending.type}.` : `${target.name} takes ${pending.type}.`, { kind: blocked ? 'block' : 'hit', from: source.id, to: target.id, label: pending.type });
  if (!blocked) damage(room, target, source, pending.type);
  if (room.winner) { room.pending = null; return; }
  pending.index++;
  if (pending.index >= pending.targets.length) { room.pending = null; room.phase = 'play'; }
  else log(room, `${room.players.find(p => p.id === pending.targets[pending.index]).name} may respond.`, { kind: 'target', to: pending.targets[pending.index], label: pending.type });
  if (room.players[room.turn].hp <= 0 && !room.pending) nextTurn(room);
}
export function act(room, token, action) {
  const player = room.players.find(p => p.token === token);
  if (!token || !player) throw Error('Player not found.');
  if (action.type === 'fillBots') {
    if (room.started || room.host !== player.id) throw Error('Only the host can add bots before the game starts.');
    const wanted = Math.min(MODES[room.mode].max, Math.max(MODES[room.mode].min, Number(action.count) || 4));
    const names = ['Cassidy', 'Ruby', 'Doc', 'Bonnie', 'Django', 'Pearl'];
    while (room.players.length < wanted) { const p = joinRoom(room, `${names[room.players.length-1]} · AI`); p.bot = true; }
    return;
  }
  if (action.type === 'removeBots') {
    if (room.started || room.host !== player.id) throw Error('Only the host can remove bots in the lobby.');
    room.players = room.players.filter(p => !p.bot); log(room, 'AI seats are now open for friends.'); return;
  }
  if (action.type === 'emote') {
    if (!['wave','cheers','taunt'].includes(action.emote)) throw Error('Unknown gesture.');
    if (Date.now()-(player.lastEmote||0)<3000) throw Error('Wait a moment before another gesture.');
    player.lastEmote=Date.now(); log(room, `${player.name} ${ {wave:'tips their hat',cheers:'raises a toast',taunt:'challenges the table'}[action.emote]}.`, {kind:'emote',from:player.id,label:action.emote}); return;
  }
  if(room.official){actBase(room,token,action);return;}
  if (action.type === 'leave') {
    if (!room.started) {
      room.players = room.players.filter(p => p !== player);
      if (room.host === player.id) room.host = room.players[0]?.id || null;
      log(room, `${player.name} left the table.`);
      return;
    }
    if (player.hp > 0 && !room.winner) {
      player.hp = 0; room.discard.push(...player.hand,...(player.weaponCard?[player.weaponCard]:[])); player.hand = []; player.weapon = null; player.weaponCard = null;
      log(room, `${player.name} forfeited and left. Role: ${player.role}.`, {kind:'eliminate',to:player.id});
      checkWinner(room, null, player);
      if (!active(room).length) { room.winner = 'The table is empty.'; room.phase = 'finished'; }
      if (room.winner) room.pending = null;
      else {
        if (room.pending) {
          const p = room.pending;
          p.targets = p.targets.slice(p.index).filter(id => room.players.some(x => x.id === id && x.hp > 0)); p.index = 0;
          if (!p.targets.length) { room.pending = null; room.phase = 'play'; }
        }
        if (!room.pending && room.players[room.turn].hp <= 0) nextTurn(room);
      }
    }
    player.token = null;
    return;
  }
  if (!room.started || room.winner) throw Error('No active game.');
  if (room.pending) {
    const target = room.players.find(p => p.id === room.pending.targets[room.pending.index]);
    if (target !== player) throw Error('Waiting for another player to respond.');
    if (action.type === 'pass') { resolvePending(room, false); return; }
    if (action.type !== 'block') throw Error('Choose Block or Take Hit.');
    const needed = room.pending.type === 'Shoot' ? 'Dodge' : 'Ward';
    const index = player.hand.findIndex(c => c.id === action.cardId && c.type === needed);
    if (index < 0) throw Error(`You need a ${needed} card.`);
    room.discard.push(...player.hand.splice(index, 1));
    if ((room.pending.blocksNeeded || 1) > 1) {
      room.pending.blocksNeeded--;
      log(room,`${player.name} plays Dodge. One more Dodge is required against Slab the Killer.`,{kind:'block',to:player.id,label:'Dodge'});
      return;
    }
    resolvePending(room, true);
    return;
  }
  if (room.players[room.turn] !== player) throw Error('Wait for your turn.');
  if (room.phase === 'discard') {
    if (action.type !== 'discard') throw Error('Discard down to your hand limit.');
    const index = player.hand.findIndex(c => c.id === action.cardId);
    if (index < 0) throw Error('Card not in your hand.');
    room.discard.push(...player.hand.splice(index, 1));
    log(room, `${player.name} discards a card.`);
    if (player.hand.length <= handLimit(room, player)) nextTurn(room);
    return;
  }
  if (action.type === 'end') {
    if (player.hand.length > handLimit(room, player)) { room.phase = 'discard'; log(room, `${player.name} must discard to ${handLimit(room, player)} cards.`); }
    else nextTurn(room);
    return;
  }
  if (action.type !== 'play') throw Error('Invalid action.');
  const index = player.hand.findIndex(c => c.id === action.cardId);
  if (index < 0) throw Error('Card not in your hand.');
  const played = player.hand[index];
  const target = room.players.find(p => p.id === action.targetId && p.hp > 0);
  if (played.type === 'Shoot') {
    if (room.usedShot && player.character?.name !== 'Willy the Kid') throw Error('Only one Shoot card per turn.');
    if (!target || target === player) throw Error('Choose another player.');
    const range = Math.max(1, (player.weapon ? 3 : 1) - (room.mode === 'highnoon' && EVENTS[room.eventIndex].name === 'Dust Storm' ? 1 : 0));
    if (distance(room, player, target) > range) throw Error('Target is out of range.');
    room.usedShot = true;
  } else if (played.type === 'Dust Hex') {
    if (room.usedSpell) throw Error('Only one spell per turn.');
    if (!target || target === player || distance(room, player, target) > 2) throw Error('Choose a player within distance 2.');
    room.usedSpell = true;
  } else if (played.type === 'Lantern Burst') {
    if (room.usedSpell) throw Error('Only one spell per turn.');
    room.usedSpell = true;
  } else if (played.type === 'Dodge' || played.type === 'Ward') throw Error('Save this card for a response.');
  else if (played.type === 'Tonic' && player.hp >= player.maxHp) throw Error('Health is already full.');
  else if (played.type === 'Rifle' && player.weapon) throw Error('You already have a Rifle equipped.');
  player.hand.splice(index, 1);
  if (played.type !== 'Rifle') room.discard.push(played);
  log(room, `${player.name} plays ${played.type}${target ? ` on ${target.name}` : ''}.`, { kind: 'play', from: player.id, to: target?.id, label: played.type });
  if (played.type === 'Rifle') { player.weapon = 'Rifle'; player.weaponCard = played; }
  if (played.type === 'Tonic') player.hp = Math.min(player.maxHp, player.hp + 1);
  if (['Shoot', 'Dust Hex', 'Lantern Burst'].includes(played.type)) {
    const targets = played.type === 'Lantern Burst' ? room.players.filter(p => p.hp > 0 && p !== player).map(p => p.id) : [target.id];
    room.pending = { type: played.type, source: player.id, targets, index: 0, blocksNeeded: played.type === 'Shoot' && player.character?.name === 'Slab the Killer' ? 2 : 1 };
    room.phase = 'response';
  }
}
function handLimit(room, player) {
  return Math.max(1, player.hp + (room.mode === 'highnoon' && EVENTS[room.eventIndex].name === 'Long Shadows' ? 1 : 0));
}
export function view(room, token) {
  if(room.official)return viewBase(room,token,MODES[room.mode]);
  const self = room.players.find(p => p.token === token);
  if (!token || !self) throw Error('Player not found.');
  return {
    code: room.code, mode: room.mode, modeInfo: MODES[room.mode], started: room.started,
    host: room.host === self.id, selfId: self.id, hand: self.hand,
    role: self.role, version: room.version, phase: room.phase, winner: room.winner,
    turnId: room.players[room.turn]?.id,
    pending: room.pending && { type: room.pending.type, source: room.pending.source, targetId: room.pending.targets[room.pending.index], index: room.pending.index + 1, total: room.pending.targets.length, blocksNeeded: room.pending.blocksNeeded || 1 },
    usedShot: room.usedShot, usedSpell: room.usedSpell,
    event: room.mode === 'highnoon' && room.eventIndex >= 0 ? EVENTS[room.eventIndex] : null,
    deckCount: room.deck.length, discardCount: room.discard.length, handLimit: self.hp > 0 ? handLimit(room, self) : 0,
    players: room.players.map(p => ({ id: p.id, name: p.name, character:p.character || null, distance:room.started&&p.hp>0&&self.hp>0?distance(room,self,p):null, bot: !!p.bot, hp: p.hp, maxHp: p.maxHp, handCount: p.hand.length, weapon: p.weapon, role: p === self || p.role === 'Sheriff' || room.mode === 'showdown' || p.hp <= 0 || room.winner ? p.role : null })),
    history: room.history.slice(0, 15)
  };
}
