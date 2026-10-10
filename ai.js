import {act,view} from './game.js';
// Bots only choose from the same filtered view a human receives.
export function botMove(s) {
  const me=s.players.find(p=>p.id===s.selfId);
  if(s.pending){const c=s.hand.find(c=>c.type===(s.pending.type==='Shoot'?'Dodge':'Ward'));return [c?{type:'block',cardId:c.id}:{type:'pass'}];}
  if(s.phase==='discard'){const c=[...s.hand].sort((a,b)=>Number(a.type==='Dodge')-Number(b.type==='Dodge'))[0];return [{type:'discard',cardId:c.id}];}
  const moves=[];
  const targets=s.players.filter(p=>p.id!==s.selfId&&p.hp>0).sort((a,b)=>{
    const score=p=>(s.role==='Outlaw'&&p.role==='Sheriff'?-10:0)+(['Sheriff','Deputy'].includes(s.role)&&p.role==='Sheriff'?100:0)+p.hp;
    return score(a)-score(b);
  });
  for(const c of s.hand){
    if(c.type==='Tonic'&&me.hp<me.maxHp)moves.unshift({type:'play',cardId:c.id});
    if(c.type==='Rifle'&&!me.weapon)moves.unshift({type:'play',cardId:c.id});
    if((c.type==='Shoot'&&!s.usedShot)||(c.type==='Dust Hex'&&!s.usedSpell))for(const p of targets){if(s.role==='Deputy'&&p.role==='Sheriff')continue;moves.push({type:'play',cardId:c.id,targetId:p.id});}
    if(c.type==='Lantern Burst'&&!s.usedSpell&&s.role!=='Deputy')moves.push({type:'play',cardId:c.id});
  }
  moves.push({type:'end'});return moves;
}
export function tickBots(room,now=Date.now()) {
  if(!room.started||room.winner||now<(room.nextBotAt||0))return false;
  const p=room.pending?room.players.find(p=>p.id===room.pending.targets[room.pending.index]):room.players[room.turn];
  if(!p?.bot)return false;
  const s=view(room,p.token);
  for(const move of botMove(s)){try{act(room,p.token,move);room.nextBotAt=now+1700;return true;}catch{ /* Engine rejects out-of-range or unavailable moves. */ }}
  return false;
}
