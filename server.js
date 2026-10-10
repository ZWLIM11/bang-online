import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { act, createRoom, joinRoom, MODES, startRoom, view } from './game.js';

const root = fileURLToPath(new URL('./public/', import.meta.url));
const rooms = new Map();
const mime = { '.png': 'image/png', '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
const json = (res, code, data) => {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(data));
};
const body = async req => {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 10000) throw Error('Request too large.');
  }
  return JSON.parse(raw || '{}');
};
const getRoom = code => {
  const room = rooms.get(String(code || '').trim().toUpperCase());
  if (!room) throw Error('Room not found.');
  return room;
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname === '/api/modes' && req.method === 'GET') return json(res, 200, MODES);
    if (url.pathname === '/api/create' && req.method === 'POST') {
      const data = await body(req);
      const room = createRoom(data.mode, data.name);
      rooms.set(room.code, room);
      return json(res, 200, { code: room.code, token: room.players[0].token });
    }
    if (url.pathname === '/api/join' && req.method === 'POST') {
      const data = await body(req);
      const player = joinRoom(getRoom(data.code), data.name);
      return json(res, 200, { code: data.code.toUpperCase(), token: player.token });
    }
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (url.pathname === '/api/state' && req.method === 'GET') return json(res, 200, view(getRoom(url.searchParams.get('code')), token));
    if (url.pathname === '/api/action' && req.method === 'POST') {
      const data = await body(req);
      const room = getRoom(data.code);
      if (data.action?.type === 'start') startRoom(room, token);
      else act(room, token, data.action || {});
      return json(res, 200, data.action?.type === 'leave' ? { left: true } : view(room, token));
    }
    if (req.method !== 'GET') return json(res, 404, { error: 'Not found.' });
    const filename = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    if (!['index.html', 'style.css', 'fx.css', 'client.js', 'scene.css', 'saloon.js', 'interactions.js', 'interactions.css', 'art.js', 'art/portraits.png', 'art/cards.png', 'vendor/three.module.js'].includes(filename)) return json(res, 404, { error: 'Not found.' });
    const bytes = await readFile(join(root, filename));
    res.writeHead(200, { 'content-type': mime[extname(filename)], 'cache-control': 'no-cache' });
    res.end(bytes);
  } catch (error) {
    json(res, 400, { error: error.message || 'Request failed.' });
  }
});

const port = Number(process.env.PORT || 3000);
server.listen(port, () => console.log(`Saloon table ready at http://localhost:${port}`));



