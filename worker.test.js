import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { SaloonRoom } from './server/worker.mjs';
import {act} from './game.js';

const base = 'https://bang.example';
const post = (path, input, token) => new Request(base + path, {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
  body: JSON.stringify(input)
});

function cloudflareMock() {
  const stores = new Map();
  const objects = new Map();
  const env = {
    ASSETS: { fetch: async () => new Response('site loaded', { status: 200 }) },
    ROOMS: {
      getByName(code) {
        if (!stores.has(code)) stores.set(code, new Map());
        if (!objects.has(code)) {
          const data = stores.get(code);
          const storage = {
            get: async key => data.get(key),
            put: async (key, value) => data.set(key, structuredClone(value)),
            setAlarm: async () => {},
            deleteAll: async () => data.clear()
          };
          const ctx = { storage, blockConcurrencyWhile: callback => callback() };
          const room = new SaloonRoom(ctx);
          objects.set(code, { fetch: async request => { await Promise.resolve(); return room.fetch(request); } });
        }
        return objects.get(code);
      }
    }
  };
  return { env, stores, objects };
}

test('base character choices survive Durable Object eviction and stay private',async()=>{
 const {env,stores,objects}=cloudflareMock();
 const created=await(await worker.fetch(post('/api/create',{name:'Kit',mode:'standard'}),env)).json();
 const others=[];for(let i=0;i<3;i++)others.push(await(await worker.fetch(post('/api/join',{name:'P'+i,code:created.code}),env)).json());
 await worker.fetch(post('/api/action',{code:created.code,action:{type:'start'}},created.token),env);
 const room=stores.get(created.code).get('room');if(room.choice?.cards)room.deck.push(...room.choice.cards);room.choice=null;room.pending=null;room.phase='play';room.turn=3;room.players[0].character={name:'Kit Carlson',hp:4};room.deck.push(...room.players[3].hand);room.players[3].hand=[];act(room,room.players[3].token,{type:'end'});objects.clear();
 const state=async token=>(await(await worker.fetch(new Request(`${base}/api/state?code=${created.code}`,{headers:{authorization:`Bearer ${token}`}}),env)).json());
 const owner=await state(created.token);assert.equal(owner.choice.options.length,3);assert.equal((await state(others[0].token)).choice.options.length,0);
 const response=await worker.fetch(post('/api/action',{code:created.code,action:{type:'choose',ids:owner.choice.options.slice(0,2).map(o=>o.id)}},created.token),env);assert.equal(response.status,200);assert.equal((await response.json()).choice,null);
});

test('Cloudflare Worker serves assets and preserves private multiplayer rooms', async () => {
  const { env, stores, objects } = cloudflareMock();
  assert.equal(await (await worker.fetch(new Request(base + '/'), env)).text(), 'site loaded');
  const created = await (await worker.fetch(post('/api/create', { name: 'Alice', mode: 'quick' }), env)).json();
  assert.match(created.code, /^[A-Z2-9]{6}$/);
  const joined = await (await worker.fetch(post('/api/join', { name: 'Bob', code: created.code }), env)).json();
  assert.ok(joined.token);
  const started = await worker.fetch(post('/api/action', { code: created.code, action: { type: 'start' } }, created.token), env);
  assert.equal(started.status, 200);
  const state = await (await worker.fetch(new Request(`${base}/api/state?code=${created.code}`, { headers: { authorization: `Bearer ${joined.token}` } }), env)).json();
  assert.equal(state.started, true);
  assert.equal(state.players.length, 2);
  assert.equal(state.players.find(player => player.id !== state.selfId).hand, undefined);
  assert.ok(stores.get(created.code).get('room').started);
  objects.clear(); // Simulate the Durable Object instance being evicted and recreated.
  const restored = await (await worker.fetch(new Request(`${base}/api/state?code=${created.code}`, { headers: { authorization: `Bearer ${joined.token}` } }), env)).json();
  assert.equal(restored.started, true);
  assert.equal(restored.players.length, 2);
});

test('Cloudflare Worker rejects missing credentials and cross-origin actions', async () => {
  const { env } = cloudflareMock();
  const created = await (await worker.fetch(post('/api/create', { name: 'Alice', mode: 'quick' }), env)).json();
  const denied = await worker.fetch(new Request(`${base}/api/state?code=${created.code}`), env);
  assert.equal(denied.status, 400);
  const foreign = await worker.fetch(new Request(base + '/api/create', { method: 'POST', headers: { origin: 'https://foreign.example' }, body: '{}' }), env);
  assert.equal(foreign.status, 403);
});
