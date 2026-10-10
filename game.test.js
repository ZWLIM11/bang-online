import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { act, createRoom, joinRoom, MODES, startRoom, view } from './game.js';

const setup = mode => {
  const room = createRoom(mode, 'Host');
  for (let i = 1; i < MODES[mode].min; i++) joinRoom(room, `Player ${i}`);
  startRoom(room, room.players[0].token);
  return room;
};
const addCard = (player, type) => {
  const card = { id: randomUUID(), type };
  player.hand.push(card);
  return card;
};

test('all selectable modes start at their required player count', () => {
  for (const mode of Object.keys(MODES)) {
    const room = setup(mode);
    assert.equal(room.started, true);
    assert.equal(room.players.length, MODES[mode].min);
    assert.ok(room.players.every(p => p.hand.length > 0));
  }
});

test('hidden roles and hands stay private in classic mode', () => {
  const room = setup('classic');
  const viewer = room.players.find(p => p.role !== 'Sheriff');
  const rival = room.players.find(p => p !== viewer && p.role !== 'Sheriff');
  const state = view(room, viewer.token);
  assert.equal(state.role, viewer.role);
  assert.equal(state.players.find(p => p.id === rival.id).role, null);
  assert.equal(state.players.find(p => p.id === rival.id).handCount, rival.hand.length);
  assert.equal(state.players.find(p => p.id === rival.id).hand, undefined);
});

test('shooting opens a shared response and Dodge blocks damage', () => {
  const room = setup('quick');
  const shooter = room.players[room.turn];
  const target = room.players.find(p => p !== shooter);
  const shoot = addCard(shooter, 'Shoot');
  const dodge = addCard(target, 'Dodge');
  const hp = target.hp;
  act(room, shooter.token, { type: 'play', cardId: shoot.id, targetId: target.id });
  assert.equal(view(room, target.token).pending.targetId, target.id);
  assert.equal(view(room, shooter.token).pending.targetId, target.id);
  act(room, target.token, { type: 'block', cardId: dodge.id });
  assert.equal(target.hp, hp);
  assert.equal(room.pending, null);
});

test('spells appear publicly and Ward blocks them', () => {
  const room = setup('hex');
  const caster = room.players[room.turn];
  const target = room.players[(room.turn + 1) % room.players.length];
  const spell = addCard(caster, 'Dust Hex');
  const ward = addCard(target, 'Ward');
  const hp = target.hp;
  act(room, caster.token, { type: 'play', cardId: spell.id, targetId: target.id });
  assert.equal(room.history[0].effect.label, 'Dust Hex');
  assert.equal(view(room, room.players[(room.turn + 2) % room.players.length].token).pending.type, 'Dust Hex');
  act(room, target.token, { type: 'block', cardId: ward.id });
  assert.equal(target.hp, hp);
});

test('showdown roles are public and high noon has a public event', () => {
  const showdown = setup('showdown');
  const spectator = view(showdown, showdown.players[0].token);
  assert.ok(spectator.players.every(p => p.role));
  const noon = setup('highnoon');
  assert.ok(view(noon, noon.players[1].token).event?.name);
});

test('leaving lobby transfers host and removes access', () => {
  const r=createRoom('quick','Host'); const old=r.players[0].token; const other=joinRoom(r,'Guest');
  act(r,old,{type:'leave'}); assert.equal(r.host,other.id); assert.equal(r.players.length,1); assert.throws(()=>view(r,old));
});
test('forfeit during an attack resolves winner and revokes access', () => {
  const r=setup('quick'); const a=r.players[r.turn], b=r.players.find(p=>p!==a); const token=b.token;
  const c=addCard(a,'Shoot'); act(r,a.token,{type:'play',cardId:c.id,targetId:b.id});
  act(r,token,{type:'leave'}); assert.equal(r.pending,null); assert.equal(r.phase,'finished'); assert.match(r.winner,/Host/); assert.throws(()=>view(r,token)); assert.throws(()=>view(r,null));
});
test('leaving active turn advances a three-player game', () => {
  const r=createRoom('quick','One'); joinRoom(r,'Two');joinRoom(r,'Three');startRoom(r,r.players[0].token);
  act(r,r.players[0].token,{type:'leave'});assert.equal(r.turn,1);assert.equal(r.phase,'play');assert.equal(r.winner,null);
});
