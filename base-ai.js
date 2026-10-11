import {WEAPONS} from './public/base-catalog.js';
export function baseBotMove(s){
 const me=s.players.find(p=>p.id===s.selfId),is=name=>me.character?.name===name;
 if(s.choice?.playerId===me.id){const q=s.choice;let options=[...q.options];
  if(q.kind==='check'){const good=c=>q.checkType==='Dynamite'?!(c.suit==='spades'&&c.rank>=2&&c.rank<=9):c.suit==='hearts';options.sort((a,b)=>Number(good(b.card))-Number(good(a.card)));}
  if(['kit','store'].includes(q.kind)){const score=c=>c.type==='Beer'&&me.hp<me.maxHp?10:c.type==='BANG!'?8:c.type==='Missed!'?7:WEAPONS[c.type]?6:3;options.sort((a,b)=>score(b.card)-score(a.card));}
  return [{type:'choose',ids:options.slice(0,q.min).map(o=>o.id)}];
 }
 if(s.dying?.playerId===me.id){const beer=s.hand.find(c=>c.type==='Beer');if(s.dying.canBeer&&beer)return [{type:'rescue',cardId:beer.id}];if(is('Sid Ketchum')&&s.hand.length>=2)return [{type:'sid',ids:s.hand.slice(0,2).map(c=>c.id)}];return [{type:'pass'}];}
 if(s.pending){if(s.pending.barrels?.length)return [{type:'barrel',source:s.pending.barrels[0]}];const c=s.pending.responseCards[0];return [c?{type:'block',cardId:c}:{type:'pass'}];}
 if(s.phase==='discard')return [{type:'discard',cardId:s.hand.find(c=>!['BANG!','Missed!','Beer'].includes(c.type))?.id||s.hand[0].id}];
 const moves=[],targets=s.players.filter(p=>p.id!==me.id&&!p.eliminated).sort((a,b)=>((s.role==='Outlaw'&&a.role==='Sheriff'?-10:0)+a.hp)-((s.role==='Outlaw'&&b.role==='Sheriff'?-10:0)+b.hp));
 for(const c of s.hand){const play={type:'play',cardId:c.id};
  if(c.type==='Beer'&&me.hp<me.maxHp&&s.players.filter(p=>!p.eliminated).length>2)moves.unshift(play);
  else if(['Stagecoach','Wells Fargo','General Store'].includes(c.type))moves.unshift(play);
  else if(WEAPONS[c.type]&&(!me.weapon||WEAPONS[c.type]>me.range))moves.unshift(play);
  else if(['Barrel','Scope','Mustang','Dynamite'].includes(c.type)&&!me.equipment.some(e=>e.type===c.type))moves.unshift(play);
  else if(c.type==='Saloon'&&me.hp<me.maxHp)moves.push(play);
  else if(['Gatling','Indians!'].includes(c.type)&&s.role!=='Deputy')moves.push(play);
  else if(['BANG!','Duel','Panic!','Cat Balou','Jail'].includes(c.type)||(is('Calamity Janet')&&c.type==='Missed!'))for(const p of targets){if(s.role==='Deputy'&&p.role==='Sheriff')continue;moves.push({...play,targetId:p.id,...(!p.handCount&&p.equipment.length?{equipmentId:p.equipment[0].id}:{})});}
 }
 if(is('Sid Ketchum')&&me.hp<me.maxHp&&s.hand.length>3)moves.unshift({type:'sid',ids:s.hand.slice(-2).map(c=>c.id)});
 moves.push({type:'end'});return moves;
}
