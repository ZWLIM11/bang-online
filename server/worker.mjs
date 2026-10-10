import { act, createRoom, joinRoom, MODES, startRoom, view } from '../game.js';

const json = (value, status = 200) => Response.json(value, { status, headers: { 'cache-control': 'no-store' } });
const codePattern = /^[A-Z2-9]{6}$/;
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const makeCode = () => {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return [...bytes].map(byte => alphabet[byte % alphabet.length]).join('');
};
const parseBody = async request => {
  const raw = await request.text();
  if (raw.length > 10000) throw Error('Request too large.');
  return JSON.parse(raw || '{}');
};

export default {
  async fetch(request, env) {
    try {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (request.headers.get('origin') && request.headers.get('origin') !== url.origin) return json({ error: 'Origin not allowed.' }, 403);
    if (url.pathname === '/api/health' && request.method === 'GET') return json({ ok: true });
    if (url.pathname === '/api/modes' && request.method === 'GET') return json(MODES);
    if (url.pathname === '/api/create' && request.method === 'POST') {
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = makeCode();
        const response = await env.ROOMS.getByName(code).fetch(new Request(`https://room/create?code=${code}`, request.clone()));
        if (response.status !== 409) return response;
      }
      return json({ error: 'Could not create a unique room. Try again.' }, 503);
    }
    let code, route;
    if (url.pathname === '/api/join' && request.method === 'POST') {
      // Joining needs the body code for compatibility with the local Node server.
      const input = await parseBody(request.clone());
      code = String(input.code || '').toUpperCase(); route = 'join';
    } else if (url.pathname === '/api/action' && request.method === 'POST') {
      const input = await parseBody(request.clone());
      code = String(input.code || '').toUpperCase(); route = 'action';
    } else if (url.pathname === '/api/state' && request.method === 'GET') {
      code = String(url.searchParams.get('code') || '').toUpperCase(); route = 'state';
    } else return json({ error: 'Not found.' }, 404);
    if (!codePattern.test(code)) return json({ error: 'Enter a valid six-character room code.' }, 400);
    return env.ROOMS.getByName(code).fetch(new Request(`https://room/${route}`, request));
    } catch (error) { return json({ error: error.message || 'Request failed.' }, 400); }
  }
};

export class SaloonRoom {
  constructor(ctx) {
    this.ctx = ctx;
    this.room = null;
    this.rates = new Map();
    ctx.blockConcurrencyWhile(async () => { this.room = await ctx.storage.get('room'); });
  }

  async fetch(request) {
    return this.ctx.blockConcurrencyWhile(async () => {
      try {
        const address = request.headers.get('cf-connecting-ip') || 'local';
        const now = Date.now();
        const rate = this.rates.get(address) || { time: now, count: 0 };
        if (now - rate.time > 60000) { rate.time = now; rate.count = 0; }
        this.rates.set(address, rate);
        if (++rate.count > 1200) return json({ error: 'Please slow down.' }, 429);
        if (this.rates.size > 500) this.rates.clear();

        const url = new URL(request.url);
        const input = request.method === 'POST' ? await parseBody(request) : {};
        let result;
        let changed = false;
        if (url.pathname === '/create' && request.method === 'POST') {
          if (this.room) return json({ error: 'Room code already in use.' }, 409);
          this.room = createRoom(input.mode, input.name, url.searchParams.get('code'));
          result = { code: this.room.code, token: this.room.players[0].token };
          changed = true;
        } else {
          if (!this.room) return json({ error: 'Room not found.' }, 404);
          const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
          if (url.pathname === '/join' && request.method === 'POST') {
            const player = joinRoom(this.room, input.name);
            result = { code: this.room.code, token: player.token };
            changed = true;
          } else if (url.pathname === '/state' && request.method === 'GET') {
            result = view(this.room, token);
          } else if (url.pathname === '/action' && request.method === 'POST') {
            if (input.action?.type === 'start') startRoom(this.room, token);
            else act(this.room, token, input.action || {});
            result = input.action?.type === 'leave' ? { left: true } : view(this.room, token);
            changed = true;
          } else return json({ error: 'Method not allowed.' }, 405);
        }
        if (changed) {
          await this.ctx.storage.put('room', this.room);
          await this.ctx.storage.setAlarm(Date.now() + 86400000);
        }
        return json(result);
      } catch (error) { return json({ error: error.message || 'Request failed.' }, 400); }
    });
  }

  async alarm() {
    await this.ctx.storage.deleteAll();
    this.room = null;
  }
}
