import {BASE_CHARACTERS,BASE_CARDS,DECK_ROWS,WEAPONS,cardLabel} from './public/base-catalog.js';

const uid=()=>crypto.randomUUID();
const random=n=>{const a=new Uint32Array(1),limit=Math.floor(2**32/n)*n;do{crypto.getRandomValues(a);}while(a[0]>=limit);return a[0]%n;};
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=random(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
const byId=(r,id)=>r.players.find(p=>p.id===id);
const living=r=>r.players.filter(p=>!p.eliminated);
const is=(p,name)=>p.character?.name===name;
const has=(p,type)=>p.equipment.some(c=>c.type===type);
const gun=p=>p.equipment.find(c=>WEAPONS[c.type]);
const note=(r,message,effect=null)=>{r.version++;r.history.unshift({id:r.version,message,effect});r.history.length=Math.min(60,r.history.length);};
const take=(r,n)=>{const a=[];for(let i=0;i<n;i++){if(!r.deck.length)r.deck=shuffle(r.discard.splice(0));if(r.deck.length)a.push(r.deck.pop());}return a;};
const draw=(r,p,n)=>p.hand.push(...take(r,n));
const throwCards=(r,p,ids)=>{const selected=ids.map(id=>p.hand.find(c=>c.id===id));if(new Set(ids).size!==ids.length||selected.some(c=>!c))throw Error('Choose distinct cards from your hand.');p.hand=p.hand.filter(c=>!ids.includes(c.id));r.discard.push(...selected);return selected;};
const clockwise=(r,p)=>{const i=r.players.indexOf(p);return Array.from({length:r.players.length},(_,j)=>r.players[(i+j)%r.players.length]).filter(p=>!p.eliminated);};
export function baseDistance(r,a,b){if(a===b)return 0;const alive=living(r),gap=Math.abs(alive.indexOf(a)-alive.indexOf(b));return Math.max(1,Math.min(gap,alive.length-gap)+Number(has(b,'Mustang'))+Number(is(b,'Paul Regret'))-Number(has(a,'Scope'))-Number(is(a,'Rose Doolan')));}
export const baseRange=p=>WEAPONS[gun(p)?.type]||1;
const unlimited=p=>is(p,'Willy the Kid')||has(p,'Volcanic');
const bang=(p,c)=>c.type==='BANG!'||(is(p,'Calamity Janet')&&c.type==='Missed!');
const missed=(p,c)=>c.type==='Missed!'||(is(p,'Calamity Janet')&&c.type==='BANG!');
function choice(r,p,kind,title,options,min=1,max=min,extra={}){r.choice={id:uid(),playerId:p.id,kind,title,options,min,max,...extra};note(r,`${p.name}: ${title}`);}
function suzy(r){if(r.winner)return;for(const p of living(r)){if(p.hp>0&&is(p,'Suzy Lafayette')&&!p.hand.length&&!(r.pending?.type==='Duel'&&[r.pending.source,r.pending.duelOpponent].includes(p.id))){draw(r,p,1);if(p.hand.length)note(r,`${p.name} draws for Suzy Lafayette.`);}}}
function finish(r){const alive=living(r);if(r.mode==='showdown'){if(alive.length===1)r.winner=`${alive[0].name} wins the Showdown.`;}else{const sheriff=r.players.find(p=>p.role==='Sheriff');if(sheriff.eliminated)r.winner=alive.length===1&&alive[0].role==='Renegade'?`${alive[0].name} wins as Renegade.`:'Outlaws win.';else if(!alive.some(p=>['Outlaw','Renegade'].includes(p.role)))r.winner='Sheriff and Deputies win.';}if(!alive.length)r.winner='The table is empty.';if(r.winner){r.phase='finished';r.pending=null;r.choice=null;r.dying=null;note(r,r.winner,{kind:'win',label:r.winner});}return !!r.winner;}
export function startBase(r){
 r.official=true;r.started=true;r.pending=null;r.choice=null;r.dying=null;r.discard=[];r.history=[];r.usedShot=false;r.usedSpell=false;
 r.deck=shuffle(DECK_ROWS.flatMap(([type,suit,ranks])=>ranks.map(rank=>({id:uid(),type,suit,rank}))));
 let roles=r.mode==='showdown'?['Deputy','Outlaw','Renegade']:['Sheriff','Renegade','Outlaw','Outlaw',...(r.players.length>=5?['Deputy']:[]),...(r.players.length>=6?['Outlaw']:[]),...(r.players.length>=7?['Deputy']:[])];roles=shuffle(roles);const chars=shuffle(BASE_CHARACTERS);
 r.players.forEach((p,i)=>{p.role=roles[i];p.character=chars[i];p.maxHp=p.character.hp+Number(p.role==='Sheriff');p.hp=p.maxHp;p.eliminated=false;p.equipment=[];p.hand=[];p.weapon=null;draw(r,p,p.hp);});
 r.turn=r.players.findIndex(p=>p.role===(r.mode==='showdown'?'Deputy':'Sheriff'));begin(r);
}
function begin(r){if(r.winner)return;r.phase='start';r.turnStage=0;r.usedShot=false;note(r,`${r.players[r.turn].name}'s turn.`);advanceStart(r);}
function next(r){if(r.winner)return;do{r.turn=(r.turn+1)%r.players.length;}while(r.players[r.turn].eliminated);begin(r);}
function removeEquipment(r,p,type){const i=p.equipment.findIndex(c=>c.type===type);if(i>=0){const [c]=p.equipment.splice(i,1);r.discard.push(c);return c;}}
function advanceStart(r){
 if(r.choice||r.dying||r.winner)return;const p=r.players[r.turn];if(p.eliminated){next(r);return;}
 while(r.turnStage<3){const stage=r.turnStage++;
  if(stage===0&&has(p,'Dynamite')){check(r,p,'Dynamite');return;}
  if(stage===1&&has(p,'Jail')){check(r,p,'Jail');return;}
  if(stage===2){
   if(is(p,'Kit Carlson')){const cards=take(r,3);if(cards.length){choice(r,p,'kit','Choose two cards to keep',cards.map(c=>({id:c.id,label:cardLabel(c),card:c})),Math.min(2,cards.length),Math.min(2,cards.length),{cards,private:true});return;}}
   else if(is(p,'Jesse Jones')){choice(r,p,'jesse','Choose your first draw source',[{id:'deck',label:'Draw from the deck'},...living(r).filter(x=>x!==p&&x.hand.length).map(x=>({id:x.id,label:`Random card from ${x.name}`}))]);return;}
   else if(is(p,'Pedro Ramirez')&&r.discard.length){choice(r,p,'pedro','Choose your first draw source',[{id:'deck',label:'Draw from the deck'},{id:'discard',label:cardLabel(r.discard.at(-1)),card:r.discard.at(-1)}]);return;}
   else{const cards=take(r,2);p.hand.push(...cards);if(is(p,'Black Jack')&&cards[1]){note(r,`${p.name} reveals ${cardLabel(cards[1])} for Black Jack.`,{kind:'reveal',label:cardLabel(cards[1])});if(['hearts','diamonds'].includes(cards[1].suit))draw(r,p,1);}}
  }
 }
 r.phase='play';suzy(r);
}
function check(r,p,type){const cards=take(r,is(p,'Lucky Duke')?2:1);if(cards.length===2){choice(r,p,'check',`Lucky Duke: choose a ${type} result`,cards.map(c=>({id:c.id,label:cardLabel(c),card:c})),1,1,{cards,checkType:type});return;}r.discard.push(...cards);applyCheck(r,p,type,cards[0]);}
function applyCheck(r,p,type,c){note(r,`${p.name}: ${type} check ${c?cardLabel(c):'no card available'}.`,{kind:'reveal',label:type});
 if(type==='Dynamite'){const dynamite=removeEquipment(r,p,'Dynamite');if(c?.suit==='spades'&&c.rank>=2&&c.rank<=9){hurt(r,p,null,3,'Dynamite','start');return;}if(dynamite){r.discard.splice(r.discard.indexOf(dynamite),1);const to=clockwise(r,p)[1]||p;to.equipment.push(dynamite);note(r,`Dynamite passes to ${to.name}.`);}advanceStart(r);}
 else if(type==='Jail'){removeEquipment(r,p,'Jail');if(c?.suit!=='hearts'){note(r,`${p.name} skips this turn in Jail.`);next(r);}else advanceStart(r);}
 else if(r.pending){if(c?.suit==='hearts'){r.pending.blocksNeeded--;note(r,`${p.name} cancels one shot with ${type}.`,{kind:'block',to:p.id,label:type});if(!r.pending.blocksNeeded)advanceAttack(r);} }
}
function survivalAbility(r,p,source,amount){if(is(p,'Bart Cassidy'))draw(r,p,amount);if(is(p,'El Gringo')&&source&&source!==p){for(let i=0;i<amount&&source.hand.length;i++)p.hand.push(...source.hand.splice(random(source.hand.length),1));}suzy(r);}
function hurt(r,p,source,amount,type,after){p.hp-=amount;note(r,`${p.name} loses ${amount} health to ${type}.`,{kind:'damage',from:source?.id,to:p.id,label:type});if(p.hp<=0){r.dying={playerId:p.id,sourceId:source?.id,amount,type,after};const beers=living(r).length>2?p.hand.filter(c=>c.type==='Beer').length:0;const enoughBeer=beers>=1-p.hp;const enoughSid=is(p,'Sid Ketchum')&&beers+Math.floor((p.hand.length-beers)/2)>=1-p.hp;if(!enoughBeer&&!enoughSid)eliminate(r,p,source,after);return;}survivalAbility(r,p,source,amount);continueAfter(r,after);}
function continueAfter(r,after){if(r.winner)return;if(after==='attack')advanceAttack(r);else if(after==='start')advanceStart(r);else if(after==='leaveTurn')next(r);suzy(r);}
function eliminate(r,p,source,after,ordered=null){
 const cards=[...p.hand,...p.equipment],vulture=living(r).find(x=>x!==p&&x.hp>0&&is(x,'Vulture Sam'));
 if(!vulture&&!ordered&&cards.length>1&&p.token){choice(r,p,'deathOrder','Choose discard order (last selected becomes the top)',cards.map(c=>({id:c.id,label:cardLabel(c),card:c})),cards.length,cards.length,{private:true,sourceId:source?.id,after});return;}
 if(vulture)vulture.hand.push(...cards);else r.discard.push(...(ordered||cards));p.hand=[];p.equipment=[];p.eliminated=true;p.hp=0;r.dying=null;
 note(r,`${p.name} is eliminated. Role: ${p.role}.`,{kind:'eliminate',to:p.id});
 if(source&&source!==p&&!source.eliminated){if(r.mode==='showdown'||p.role==='Outlaw')draw(r,source,3);if(source.role==='Sheriff'&&p.role==='Deputy'){const possessions=[...source.hand,...source.equipment];if(possessions.length>1){choice(r,source,'penaltyOrder','Sheriff penalty: choose discard order',possessions.map(c=>({id:c.id,label:cardLabel(c),card:c})),possessions.length,possessions.length,{private:true,after,victimId:p.id});return;}r.discard.push(...possessions);source.hand=[];source.equipment=[];}}
 finishElimination(r,p,source,after);
}
function finishElimination(r,p,source,after){if(r.mode==='showdown'&&source&&source!==p&&({Deputy:'Renegade',Renegade:'Outlaw',Outlaw:'Deputy'}[source.role]===p.role))r.winner=`${source.name} wins the Showdown.`;if(finish(r))return;continueAfter(r,after);}
function advanceAttack(r){const p=r.pending;if(!p)return;if(p.type==='Duel'){r.pending=null;r.phase='play';suzy(r);if(r.players[r.turn].eliminated)next(r);return;}
 do{p.index++;}while(p.index<p.targets.length&&byId(r,p.targets[p.index]).eliminated);
 if(p.index>=p.targets.length){r.pending=null;r.phase='play';suzy(r);if(r.players[r.turn].eliminated)next(r);}else{p.blocksNeeded=1;p.barrelUsed=[];note(r,`${byId(r,p.targets[p.index]).name} may respond to ${p.type}.`);}
}
function choose(r,p,a){const q=r.choice;if(!q||q.playerId!==p.id)throw Error('This choice belongs to another player.');const ids=a.ids;if(!Array.isArray(ids)||ids.length<q.min||ids.length>q.max||new Set(ids).size!==ids.length||ids.some(id=>!q.options.some(o=>o.id===id)))throw Error('Choose the required number of distinct options.');
 if(q.kind==='jesse'&&ids[0]!=='deck'&&(!byId(r,ids[0])?.hand.length||byId(r,ids[0]).eliminated))throw Error('That hand is now empty. Choose the deck.');
 r.choice=null;
 if(q.kind==='kit'){p.hand.push(...q.cards.filter(c=>ids.includes(c.id)));r.deck.push(...q.cards.filter(c=>!ids.includes(c.id)));advanceStart(r);}
 else if(q.kind==='jesse'){if(ids[0]==='deck')draw(r,p,1);else{const from=byId(r,ids[0]);p.hand.push(...from.hand.splice(random(from.hand.length),1));suzy(r);}draw(r,p,1);advanceStart(r);}
 else if(q.kind==='pedro'){if(ids[0]==='discard')p.hand.push(r.discard.pop());else draw(r,p,1);draw(r,p,1);advanceStart(r);}
 else if(q.kind==='check'){r.discard.push(...q.cards);applyCheck(r,p,q.checkType,q.cards.find(c=>c.id===ids[0]));}
 else if(q.kind==='store'){const c=r.store.cards.find(c=>c.id===ids[0]);r.store.cards=r.store.cards.filter(x=>x!==c);p.hand.push(c);r.store.index++;storeChoice(r);}
 else if(q.kind==='deathOrder'){const cards=[...p.hand,...p.equipment];eliminate(r,p,byId(r,q.sourceId),q.after,ids.map(id=>cards.find(c=>c.id===id)));}
 else if(q.kind==='penaltyOrder'){const cards=[...p.hand,...p.equipment];r.discard.push(...ids.map(id=>cards.find(c=>c.id===id)));p.hand=[];p.equipment=[];finishElimination(r,byId(r,q.victimId),p,q.after);}
 note(r,`${p.name} completes ${q.kind==='kit'?'Kit Carlson’s draw':q.kind==='check'?'the draw! check':'the choice'}.`);suzy(r);
}
function storeChoice(r){if(r.store.index>=r.store.players.length||!r.store.cards.length){r.discard.push(...r.store.cards);r.store=null;r.phase='play';suzy(r);return;}const p=byId(r,r.store.players[r.store.index]);choice(r,p,'store','Choose one card from General Store',r.store.cards.map(c=>({id:c.id,label:cardLabel(c),card:c})));}
function sid(r,p,a){if(!is(p,'Sid Ketchum')||p.eliminated||p.hp>=p.maxHp)throw Error('Sid cannot heal now.');if(!Array.isArray(a.ids)||a.ids.length!==2)throw Error('Choose exactly two hand cards.');throwCards(r,p,a.ids);p.hp++;note(r,`${p.name} uses Sid Ketchum to heal.`,{kind:'play',from:p.id,label:'Beer'});if(r.dying?.playerId===p.id&&p.hp>0){const d=r.dying;r.dying=null;survivalAbility(r,p,byId(r,d.sourceId),d.amount);continueAfter(r,d.after);}suzy(r);if(r.phase==='discard'&&r.players[r.turn]===p&&p.hand.length<=p.hp)next(r);}
export function actBase(r,token,a){const p=r.players.find(p=>p.token===token);if(!p||!token)throw Error('Player not found.');
 if(a.type==='leave'){leave(r,p);return;}
 if(r.winner)throw Error('The game has ended.');
 if(a.type==='choose'){choose(r,p,a);return;}
 if(a.type==='sid'){if(r.choice||((r.pending||r.dying||r.phase==='start')&&r.dying?.playerId!==p.id))throw Error('Finish the current effect before healing, unless saving your last life.');sid(r,p,a);return;}
 if(r.choice)throw Error('A player must finish their choice first.');
 if(r.dying){const d=r.dying;if(d.playerId!==p.id)throw Error('Waiting for a lethal-damage response.');if(a.type==='pass'){eliminate(r,p,byId(r,d.sourceId),d.after);return;}const c=p.hand.find(c=>c.id===a.cardId&&c.type==='Beer');if(a.type!=='rescue'||!c||living(r).length<=2)throw Error('Use Beer or Sid to survive, or accept elimination.');throwCards(r,p,[c.id]);p.hp++;note(r,`${p.name} uses Beer to survive.`,{kind:'play',from:p.id,label:'Beer'});if(p.hp>0){r.dying=null;survivalAbility(r,p,byId(r,d.sourceId),d.amount);continueAfter(r,d.after);}return;}
 if(p.eliminated)throw Error('You are eliminated.');
 if(r.pending){const attack=r.pending;if(attack.targets[attack.index]!==p.id)throw Error('Waiting for another response.');
  if(a.type==='barrel'){if(!['BANG!','Gatling'].includes(attack.type)||attack.barrelUsed.includes(a.source)||!((a.source==='Barrel'&&has(p,'Barrel'))||(a.source==='Jourdonnais'&&is(p,'Jourdonnais'))))throw Error('That Barrel check is unavailable.');attack.barrelUsed.push(a.source);check(r,p,a.source);return;}
  if(a.type==='pass'){hurt(r,p,byId(r,attack.source),1,attack.type,'attack');return;}
  const c=p.hand.find(c=>c.id===a.cardId),needsBang=['Duel','Indians!'].includes(attack.type);if(a.type!=='block'||!c||!(needsBang?bang(p,c):missed(p,c)))throw Error(`Respond with ${needsBang?'BANG!':'Missed!'}.`);
  throwCards(r,p,[c.id]);note(r,`${p.name} responds with ${c.type}.`,{kind:'block',to:p.id,label:c.type});
  if(attack.type==='Duel'){const other=p.id===attack.source?attack.duelOpponent:attack.source;attack.targets=[other];attack.index=0;}
  else if(--attack.blocksNeeded<=0)advanceAttack(r);suzy(r);return;
 }
 if(r.players[r.turn]!==p)throw Error('Wait for your turn.');
 if(r.phase==='discard'){if(a.type!=='discard')throw Error('Discard excess cards.');throwCards(r,p,[a.cardId]);note(r,`${p.name} discards.`);suzy(r);if(p.hand.length<=p.hp)next(r);return;}
 if(r.phase!=='play')throw Error('Finish the start-of-turn steps.');
 if(a.type==='end'){if(p.hand.length>p.hp){r.phase='discard';note(r,`${p.name} must discard to ${p.hp} cards.`);}else next(r);return;}
 if(a.type!=='play')throw Error('Choose a card to play.');
 const c=p.hand.find(c=>c.id===a.cardId);if(!c||!BASE_CARDS[c.type])throw Error('Card not in your hand.');
 const type=c.type==='Missed!'&&is(p,'Calamity Janet')?'BANG!':c.type,target=byId(r,a.targetId);
 const targeted=['BANG!','Panic!','Cat Balou','Duel','Jail'].includes(type);
 if(targeted&&(!target||target.eliminated||(target===p&&!['Panic!','Cat Balou','Jail'].includes(type))))throw Error('Choose a legal living player.');
 if(type==='BANG!'&&((r.usedShot&&!unlimited(p))||baseDistance(r,p,target)>baseRange(p)))throw Error(r.usedShot&&!unlimited(p)?'One BANG! per turn.':'Target is out of range.');
 if(type==='Panic!'&&baseDistance(r,p,target)>1)throw Error('Panic! requires distance one.');
 if(type==='Missed!')throw Error('Keep Missed! for a response.');
 const recipient=type==='Jail'?target:p,equipment=!!WEAPONS[type]||['Barrel','Jail','Dynamite','Mustang','Scope'].includes(type);
 if(equipment&&has(recipient,type))throw Error('A duplicate cannot be placed in play.');
 if(type==='Jail'&&target.role==='Sheriff')throw Error('The Sheriff cannot be jailed.');
 let stolen;
 if(['Panic!','Cat Balou'].includes(type)){const hand=target.hand.filter(x=>x!==c);if(a.equipmentId)stolen=target.equipment.find(x=>x.id===a.equipmentId);else if(hand.length)stolen=hand[random(hand.length)];if(!stolen)throw Error('Choose a card from the target’s hand or equipment.');}
 p.hand=p.hand.filter(x=>x!==c);if(!equipment)r.discard.push(c);
 note(r,`${p.name} plays ${c.type}${targeted?` on ${target.name}`:''}.`,{kind:'play',from:p.id,to:targeted?target.id:undefined,label:type});
 if(equipment){if(WEAPONS[type]){const previous=gun(p);if(previous)removeEquipment(r,p,previous.type);}recipient.equipment.push(c);}
 else if(type==='Beer'){if(living(r).length>2)p.hp=Math.min(p.maxHp,p.hp+1);}
 else if(type==='Saloon')living(r).forEach(x=>x.hp=Math.min(x.maxHp,x.hp+1));
 else if(type==='Stagecoach'||type==='Wells Fargo')draw(r,p,type==='Stagecoach'?2:3);
 else if(stolen){target.hand=target.hand.filter(x=>x!==stolen);target.equipment=target.equipment.filter(x=>x!==stolen);if(type==='Panic!')p.hand.push(stolen);else r.discard.push(stolen);}
 else if(type==='General Store'){r.store={cards:take(r,living(r).length),players:clockwise(r,p).map(x=>x.id),index:0};storeChoice(r);}
 else if(['BANG!','Gatling','Indians!','Duel'].includes(type)){
  if(type==='BANG!')r.usedShot=true;
  r.pending={type,source:p.id,targets:['Gatling','Indians!'].includes(type)?clockwise(r,p).slice(1).map(x=>x.id):[target.id],index:0,blocksNeeded:type==='BANG!'&&is(p,'Slab the Killer')?2:1,barrelUsed:[],duelOpponent:type==='Duel'?target.id:null};r.phase='response';
 }
 suzy(r);
}
function leave(r,p){
 // Forfeit is a digital house action, never a credited kill.
 if(p.eliminated||r.winner){p.token=null;note(r,`${p.name} left.`);return;}
 if(r.choice?.playerId===p.id){const q=r.choice;r.choice=null;if(q.kind==='kit')r.deck.push(...q.cards);else if(q.kind==='check')r.discard.push(...q.cards);}
 if(r.dying?.playerId===p.id)r.dying=null;
 const possessions=[...p.hand,...p.equipment],vulture=living(r).find(x=>x!==p&&is(x,'Vulture Sam'));if(vulture)vulture.hand.push(...possessions);else r.discard.push(...possessions);p.hand=[];p.equipment=[];p.hp=0;p.eliminated=true;p.token=null;note(r,`${p.name} forfeits. Role: ${p.role}.`,{kind:'eliminate',to:p.id});
 if(finish(r))return;
 if(r.store){const index=r.store.players.indexOf(p.id);if(index>=0&&index<r.store.index)r.store.index--;r.store.players=r.store.players.filter(id=>id!==p.id);if(!r.choice)storeChoice(r);}
 if(r.pending){if(r.pending.type==='Duel'&&[r.pending.source,r.pending.duelOpponent].includes(p.id)){r.pending=null;r.phase='play';}else if(r.pending.targets[r.pending.index]===p.id)advanceAttack(r);}
 if(r.players[r.turn].eliminated&&!r.pending&&!r.choice)next(r);suzy(r);
}
export function viewBase(r,token,modeInfo){const p=r.players.find(p=>p.token===token);if(!token||!p)throw Error('Player not found.');
 const pending=r.pending,needsBang=pending&&['Duel','Indians!'].includes(pending.type);
 const q=r.choice&&{id:r.choice.id,playerId:r.choice.playerId,title:r.choice.title,kind:r.choice.kind,min:r.choice.min,max:r.choice.max,options:r.choice.playerId===p.id||!r.choice.private?r.choice.options:[],checkType:r.choice.checkType};
 const responseCards=pending?p.hand.filter(c=>needsBang?bang(p,c):missed(p,c)).map(c=>c.id):[];
 return {official:true,code:r.code,mode:r.mode,modeInfo,started:true,host:r.host===p.id,selfId:p.id,hand:p.hand,role:p.role,version:r.version,phase:r.phase,winner:r.winner,turnId:r.players[r.turn].id,choice:q,
 dying:r.dying&&{playerId:r.dying.playerId,needed:1-byId(r,r.dying.playerId).hp,canBeer:living(r).length>2},
 pending:pending&&{type:pending.type,source:pending.source,targetId:pending.targets[pending.index],index:pending.index+1,total:pending.targets.length,blocksNeeded:pending.blocksNeeded,needs:needsBang?'BANG!':'Missed!',responseCards,barrels:['BANG!','Gatling'].includes(pending.type)?[...(has(p,'Barrel')?['Barrel']:[]),...(is(p,'Jourdonnais')?['Jourdonnais']:[])].filter(x=>!pending.barrelUsed.includes(x)):[]},
 usedShot:r.usedShot,usedSpell:false,unlimitedShots:unlimited(p),event:null,deckCount:r.deck.length,discardCount:r.discard.length,discardTop:r.discard.at(-1)||null,handLimit:Math.max(0,p.hp),
 players:r.players.map(x=>({id:x.id,name:x.name,bot:!!x.bot,hp:x.hp,maxHp:x.maxHp,eliminated:x.eliminated,character:x.character,handCount:x.hand.length,equipment:x.equipment,weapon:gun(x)?.type||null,range:baseRange(x),distance:!p.eliminated&&!x.eliminated?baseDistance(r,p,x):null,role:x===p||x.role==='Sheriff'||r.mode==='showdown'||x.eliminated||r.winner?x.role:null})),history:r.history.slice(0,30)};
}
