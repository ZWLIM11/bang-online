import { initInteractions } from './interactions.js';
import { artwork, portrait } from './art.js';
let saloon = null;
import('./saloon.js').then(({createSaloon}) => { saloon = createSaloon(document.getElementById('scene-preview')); if(current) { mountSaloon(); if(state) saloon.update(state); } }).catch(error => { console.warn('3D scene unavailable', error); document.getElementById('scene-preview').textContent = '3D preview unavailable on this device. The table is still playable.'; });
function mountSaloon() { if(!saloon)return; saloon.mount(document.getElementById('saloon-canvas')); document.querySelector('.table-scene').classList.add('has-3d'); document.getElementById('camera-tools').classList.remove('hidden'); }
const $ = id => document.getElementById(id);
const api = async (path, data, token) => {
  const headers = { ...(data ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) };
  const response = await fetch(path, { ...(data ? { method: 'POST', body: JSON.stringify(data) } : {}), headers });
  const result = await response.json();
  if (!response.ok) throw Error(result.error || 'Request failed.');
  return result;
};
const session = JSON.parse(sessionStorage.getItem('saloon-session') || 'null');
let current = session;
let state = null;
let selected = null;
let selectedMode = 'hex';
let lastEffect = 0;
let timer;
const descriptions = {
  Shoot: 'Attack one player in weapon range. They may Dodge.',
  Dodge: 'Block a Shoot when you are targeted.',
  Tonic: 'Recover 1 health, up to your maximum.',
  Rifle: 'Equip a weapon with range 3.',
  'Dust Hex': 'Spell: attack one player within distance 2. They may Ward.',
  Ward: 'Block a spell when you are targeted.',
  'Lantern Burst': 'Spell: attack every other player. Each may Ward.'
};
const icons = { Shoot: '✷', Dodge: '↝', Tonic: '✚', Rifle: '⚑', 'Dust Hex': '✦', Ward: '◇', 'Lantern Burst': '☼' };
const toast = message => {
  $('toast').textContent = message;
  $('toast').classList.remove('hidden');
  clearTimeout(toast.timeout);
  toast.timeout = setTimeout(() => $('toast').classList.add('hidden'), 3500);
};
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const setSession = value => {
  current = value;
  sessionStorage.setItem('saloon-session', JSON.stringify(value));
  $('landing').classList.add('hidden');
  $('game').classList.remove('hidden');
  $('room-tag').textContent = `TABLE ${value.code}`;
  mountSaloon();
  refresh();
  clearInterval(timer);
  timer = setInterval(refresh, 800);
};
async function refresh() {
  if (!current) return;
  try {
    const next = await api(`/api/state?code=${encodeURIComponent(current.code)}`, undefined, current.token);
    if (!state || next.version !== state.version || next.phase !== state.phase) render(next);
    state = next;
  } catch (error) {
    clearInterval(timer);
    if (error.message === 'Room not found.') {
      sessionStorage.removeItem('saloon-session');
      current = null; state = null;
      $('game').classList.add('hidden');
      $('landing').classList.remove('hidden');
      $('room-tag').textContent = 'WILD WEST TABLETOP';
    }
    toast(error.message);
  }
}
async function action(payload) {
  try {
    const next = await api('/api/action', { code: current.code, action: payload }, current.token);
    if (next.left) { clearInterval(timer); sessionStorage.removeItem('saloon-session'); location.assign(location.pathname); return true; }
    render(next);
    state = next;
    return true;
  } catch (error) { toast(error.message); return false; }
}
function render(next) {
  $('game-mode').textContent = next.modeInfo.name.toUpperCase();
  $('game-title').textContent = next.winner || (next.started ? `${next.players.find(p => p.id === next.turnId)?.name}'s turn` : 'Waiting for gunslingers');
  $('status-pill').textContent = next.winner ? 'GAME OVER' : next.started ? next.phase.toUpperCase() : 'LOBBY';
  $('role-label').textContent = next.started ? `ROLE · ${next.role}` : 'Your cards will appear when the game starts';
  $('hand-count').textContent = next.started ? `${next.hand.length} cards · limit ${next.handLimit}` : '';
  $('deck-count').textContent = `${next.deckCount} DRAW`;
  $('discard-count').textContent = `${next.discardCount} DISCARD`;
  $('event-banner').classList.toggle('hidden', !next.event);
  if (next.event) $('event-banner').textContent = `${next.event.name}  ·  ${next.event.text}`;
  renderSeats(next); saloon?.update(next);
  renderHand(next);
  renderTargets(next);
  renderSidebar(next);
  renderControls(next); ui.update(next);
  const newest = next.history[0];
  if (lastEffect) next.history.filter(entry => entry.id > lastEffect && entry.effect && entry !== newest).reverse().forEach(entry => saloon?.play(entry.effect));
  if (newest?.effect && newest.id > lastEffect) {
    lastEffect = newest.id;
    showEffect(newest.effect, next);
  }
}
function renderSeats(next) {
  const area = $('seats'); area.replaceChildren();
  const count = next.players.length;
  next.players.forEach((player, i) => {
    const angle = (-90 + i * 360 / count) * Math.PI / 180;
    const seat = el('div', `seat ${player.id === next.selfId ? 'self' : ''} ${player.id === next.turnId && next.started ? 'active' : ''} ${player.hp <= 0 && next.started ? 'fallen' : ''}`);
    seat.dataset.playerId = player.id;
    seat.style.left = `${50 + Math.cos(angle) * 39}%`;
    seat.style.top = `${50 + Math.sin(angle) * 37}%`;
    const avatar = el('div', 'portrait-badge'); portrait(avatar, i);
    const info = el('button', 'seat-info'); info.type = 'button'; info.setAttribute('aria-label', 'Inspect ' + player.name); info.onclick = () => ui.player(player.id);
    info.append(el('strong', '', player.name + (player.id === next.selfId ? ' · YOU' : '')), el('small', '', next.started ? `${'●'.repeat(Math.max(0, player.hp))}  ${player.handCount} cards${player.weapon ? ' · Rifle' : ''}` : 'Waiting'));
    if (player.role) info.append(el('span', 'role-chip', player.role));
    seat.append(avatar, info); area.append(seat);
  });
}
function renderHand(next) {
  const hand = $('hand'); hand.replaceChildren();
  if (!next.started) return;
  next.hand.forEach(card => {
    const item = el('button', `hand-card ${card.type.includes('Hex') || card.type === 'Ward' || card.type.includes('Burst') ? 'arcane' : ''}`);
    item.type = 'button';
    item.append(el('span', 'card-corner', 'H&H'), el('span', 'card-icon', icons[card.type]), el('strong', '', card.type), el('small', '', descriptions[card.type]));
    artwork(item.querySelector('.card-icon'),card.type);
    if (card.id === selected) item.classList.add('selected');
    item.onclick = () => ui.inspect(card.id);
    hand.append(item);
  });
}
function renderTargets(next) {
  const target = $('target'); const previous = target.value; target.replaceChildren();
  target.append(new Option('Choose target', ''));
  next.players.filter(p => p.hp > 0 && p.id !== next.selfId).forEach(p => target.append(new Option(p.name, p.id)));
  target.value = previous || '';
}
function renderSidebar(next) {
  const info = $('table-info'); info.replaceChildren();
  info.append(el('p', '', `Room code: ${next.code}`), el('p', '', `Seats: ${next.players.length} / ${next.modeInfo.max}`), el('p', '', next.modeInfo.summary));
  $('start').classList.toggle('hidden', next.started || !next.host);
  const history = $('history'); history.replaceChildren();
  if (!next.history.length) history.append(el('p', 'quiet', 'The saloon is quiet.'));
  next.history.forEach(entry => history.append(el('p', '', entry.message)));
}
function renderControls(next) {
  const me = next.players.find(p => p.id === next.selfId);
  const myTurn = next.started && next.turnId === next.selfId && !next.winner;
  const responding = next.pending?.targetId === next.selfId;
  $('prompt').textContent = next.winner || (responding ? `${next.pending.type} targets you. Play ${next.pending.type === 'Shoot' ? 'Dodge' : 'Ward'} or take the hit.` : next.pending ? `Waiting for ${next.players.find(p => p.id === next.pending.targetId)?.name} to respond (${next.pending.index}/${next.pending.total}).` : next.phase === 'discard' && myTurn ? `Discard cards until you have ${next.handLimit}.` : myTurn ? 'Your turn. Select a card or end your turn.' : next.started ? `Waiting for ${next.players.find(p => p.id === next.turnId)?.name}.` : `Invite friends with code ${next.code}.`);
  $('play').classList.toggle('hidden', !myTurn || !!next.pending || next.phase !== 'play');
  $('end').classList.toggle('hidden', !myTurn || !!next.pending || next.phase !== 'play');
  $('target').classList.toggle('hidden', !myTurn || !!next.pending || next.phase !== 'play');
  $('block').classList.toggle('hidden', !responding);
  $('pass').classList.toggle('hidden', !responding);
  if (next.phase === 'discard' && myTurn) {
    $('play').classList.remove('hidden'); $('play').textContent = 'Discard selected';
  } else $('play').textContent = 'Play selected';
  if (next.started && me?.hp <= 0) $('prompt').textContent = 'You are out. You can watch the rest of the game.';
}
function showEffect(effect, next) {
  saloon?.play(effect);
  const announcement = document.getElementById('action-announcement'); announcement.textContent = effect.label || effect.kind.toUpperCase(); announcement.classList.remove('hidden'); clearTimeout(announcement.timeout); announcement.timeout = setTimeout(() => announcement.classList.add('hidden'), 2400);
  const stage = $('action-stage');
  $('action-icon').textContent = icons[effect.label] || (effect.kind === 'damage' ? '✷' : '✦');
  $('action-label').textContent = effect.label || effect.kind.toUpperCase();
  $('action-sub').textContent = next.history[0]?.message || '';
  stage.classList.remove('flash'); void stage.offsetWidth; stage.classList.add('flash');
  document.querySelectorAll('.seat').forEach((seat, i) => {
    if (next.players[i].id === effect.to || next.players[i].id === effect.from) {
      seat.classList.add('effect-glow');
      setTimeout(() => seat.classList.remove('effect-glow'), 1600);
    }
  });
  const scene = document.querySelector('.table-scene');
  const bounds = scene.getBoundingClientRect();
  const seatNodes = [...document.querySelectorAll('.seat')];
  const point = node => {
    const rect = node.getBoundingClientRect();
    return { x: rect.left + rect.width / 2 - bounds.left, y: rect.top + rect.height / 2 - bounds.top };
  };
  const center = point(stage);
  const sourceIndex = next.players.findIndex(p => p.id === effect.from);
  const targetIndex = next.players.findIndex(p => p.id === effect.to);
  const arcane = /Hex|Ward|Burst/.test(effect.label || '');
  const trail = (from, to) => {
    const beam = el('div', `effect-trail ${arcane ? 'spell-trail' : 'shot-trail'}`);
    beam.style.left = `${from.x}px`;
    beam.style.top = `${from.y}px`;
    beam.style.width = `${Math.hypot(to.x - from.x, to.y - from.y)}px`;
    beam.style.transform = `rotate(${Math.atan2(to.y - from.y, to.x - from.x)}rad)`;
    scene.append(beam);
    setTimeout(() => beam.remove(), 1300);
  };
  if (effect.kind === 'play' && sourceIndex >= 0) trail(point(seatNodes[sourceIndex]), center);
  if (targetIndex >= 0 && ['play', 'hit', 'damage', 'block', 'target'].includes(effect.kind)) trail(center, point(seatNodes[targetIndex]));
  if (effect.kind === 'play' && targetIndex < 0) {
    const pulse = el('div', `effect-pulse ${arcane ? 'spell-pulse' : ''}`);
    pulse.style.left = `${center.x}px`; pulse.style.top = `${center.y}px`;
    scene.append(pulse); setTimeout(() => pulse.remove(), 1200);
  }
}
async function loadModes() {
  try {
    const modes = await api('/api/modes');
    Object.entries(modes).forEach(([id, mode]) => {
      const button = el('button', `mode-option ${id === selectedMode ? 'chosen' : ''}`);
      button.type = 'button';
      button.append(el('span', 'mode-symbol', { classic: '♠', hex: '✦', highnoon: '☀', quick: '✷', showdown: '★' }[id]), el('strong', '', mode.name), el('small', '', `${mode.min}–${mode.max} players · ${mode.summary}`));
      button.onclick = () => { selectedMode = id; document.querySelectorAll('.mode-option').forEach(x => x.classList.remove('chosen')); button.classList.add('chosen'); };
      $('modes').append(button);
    });
  } catch (error) { toast(error.message); }
}
$('create').onclick = async () => { try { setSession(await api('/api/create', { name: $('name').value, mode: selectedMode })); } catch (error) { toast(error.message); } };
$('join').onclick = async () => { try { setSession(await api('/api/join', { name: $('name').value, code: $('join-code').value })); } catch (error) { toast(error.message); } };
$('start').onclick = () => action({ type: 'start' });
$('end').onclick = () => ui.end();
$('pass').onclick = () => action({ type: 'pass' });
$('play').onclick = () => {
  if (!selected) return toast('Select a card first.');
  action(state.phase === 'discard' ? { type: 'discard', cardId: selected } : { type: 'play', cardId: selected, targetId: $('target').value });
  selected = null;
};
$('block').onclick = () => {
  const needed = state.pending.type === 'Shoot' ? 'Dodge' : 'Ward';
  const card = state.hand.find(c => c.id === selected && c.type === needed) || state.hand.find(c => c.type === needed);
  if (!card) return toast(`You need a ${needed} card to block.`);
  action({ type: 'block', cardId: card.id }); selected = null;
};
$('copy').onclick = async () => {
  try { await navigator.clipboard.writeText(`${location.origin}/?join=${current.code}`); toast('Invite link copied.'); }
  catch { toast(`Share room code ${current.code}`); }
};
const invitation = new URLSearchParams(location.search).get('join');
if (invitation) $('join-code').value = invitation.toUpperCase();
document.getElementById('camera-seat').onclick = () => saloon?.reset();
document.getElementById('camera-top').onclick = () => saloon?.overhead();
const ui = initInteractions({ act: action, descriptions, icons, notify: toast, selectCard: id => { selected = id; if(state) renderHand(state); }, targetPlayer: id => { $('target').value = id; } });
loadModes();
if (current) setSession(current);



