import {BASE_CARDS,BASE_CHARACTERS,WEAPONS,cardLabel} from './base-catalog.js';
import {artwork} from './art.js';
export function createBaseUI({shell,text,actions,button,node,content,close,submit,selectCard,getState,getKind}){
 let lastKey='';
 const me=()=>getState().players.find(p=>p.id===getState().selfId);
 function cardView(c){const art=node('div',null,'card-showcase');artwork(art,c.type);content.append(art);text(cardLabel(c));text(BASE_CARDS[c.type]);}
 function choice(){const s=getState(),q=s.choice;if(!q||q.playerId!==s.selfId)return;shell('base-choice',q.title,'CHARACTER / CARD CHOICE');text(q.kind==='kit'?'Only you can see these cards. Keep two; the unselected card returns to the deck.':q.kind==='check'?'Both revealed cards will be discarded. Choose which result applies.':q.max>1?'Click in the order you want the cards discarded. The final card is the top card.':'Choose one option to continue.');
  const selected=[];const confirm=button('Confirm choice',()=>submit({type:'choose',ids:selected}),'primary');confirm.disabled=true;
  const grid=node('div',null,'base-options');content.append(grid);for(const o of q.options){const b=button('',()=>{const i=selected.indexOf(o.id);if(i>=0)selected.splice(i,1);else if(selected.length<q.max)selected.push(o.id);for(const child of grid.children){const index=selected.indexOf(child.dataset.option);child.setAttribute('aria-pressed',String(index>=0));child.querySelector('.pick-number').textContent=index>=0?String(index+1):'○';}confirm.disabled=selected.length<q.min;confirm.textContent=`Confirm ${selected.length} / ${q.min}`;},'base-option');b.dataset.option=o.id;b.setAttribute('aria-pressed','false');b.append(node('span','○','pick-number'),node('strong',o.label));if(o.card)b.append(node('small',BASE_CARDS[o.card.type]));grid.append(b);}actions(confirm);}
 function sid(){const s=getState();shell('base-sid','Sid Ketchum: choose two cards','HEAL ONE LIFE');const ids=[];const ok=button('Discard two and heal',()=>submit({type:'sid',ids}),'primary');ok.disabled=true;for(const c of s.hand){const b=button(cardLabel(c),()=>{const i=ids.indexOf(c.id);if(i>=0)ids.splice(i,1);else if(ids.length<2)ids.push(c.id);b.setAttribute('aria-pressed',String(ids.includes(c.id)));ok.disabled=ids.length!==2;},'base-option');content.append(b);}actions(ok,button('Cancel',close));}
 function rescue(){const s=getState();shell('base-rescue','Your character is losing their last life','LETHAL DAMAGE');text(`Recover ${s.dying.needed} life point(s) to survive. Damage-triggered draws happen only after survival.`);const buttons=[];const beer=s.hand.find(c=>c.type==='Beer');if(beer&&s.dying.canBeer)buttons.push(button('Use Beer',()=>submit({type:'rescue',cardId:beer.id}),'primary'));if(me().character.name==='Sid Ketchum'&&s.hand.length>=2)buttons.push(button('Use Sid: discard two',sid,'primary'));buttons.push(button('Accept elimination',()=>submit({type:'pass'})));actions(...buttons);}
 function response(){const s=getState(),p=s.pending;if(!p||p.targetId!==s.selfId)return;shell('base-response',`${p.type}: your response`,'INCOMING CARD');text(`Respond with ${p.needs}. ${p.blocksNeeded} cancellation effect(s) still required.${p.type==='Duel'?' A successful response passes the Duel back to the other player.':''}`);for(const source of p.barrels||[])content.append(button(`Try ${source} draw!`,()=>submit({type:'barrel',source}),'primary'));for(const id of p.responseCards){const c=s.hand.find(c=>c.id===id);content.append(button(`Use ${cardLabel(c)}`,()=>submit({type:'block',cardId:id}),'base-option'));}actions(button('Take one damage',()=>submit({type:'pass'})));}
 function resume(){const s=getState();if(s.choice?.playerId===s.selfId)choice();else if(s.dying?.playerId===s.selfId)rescue();else if(s.pending?.targetId===s.selfId)response();}
 function inspect(id){const s=getState(),c=s.hand.find(c=>c.id===id);if(!c)return;selectCard(id);shell('base-card',c.type,'CARD DETAILS');cardView(c);
  if(s.choice||s.dying||s.pending){text('Finish the current card or character choice before playing another card.');actions(button('Resolve my response',resume),button('Keep in hand',close));return;}
  if(s.turnId!==s.selfId||s.winner||me().eliminated){text('Wait for your turn to play.');return;}
  if(s.phase==='discard'){actions(button('Discard this card',()=>submit({type:'discard',cardId:id}),'primary'));return;}
  const type=c.type==='Missed!'&&me().character.name==='Calamity Janet'?'BANG!':c.type;
  if(type==='Missed!'){text('Keep this card for a shot response.');return;}
  if(type==='BANG!'&&s.usedShot&&!s.unlimitedShots){text('Your BANG! allowance is used for this turn.');return;}
  if(['BANG!','Duel','Panic!','Cat Balou','Jail'].includes(type)){
   text('Choose a target. In-play cards can be selected for Panic! and Cat Balou; a hand card is taken randomly.');
   for(const p of s.players.filter(p=>!p.eliminated&&(p.id!==s.selfId||['Panic!','Cat Balou','Jail'].includes(type)))){
    const out=type==='BANG!'&&p.distance>me().range||type==='Panic!'&&p.distance>1||type==='Jail'&&(p.role==='Sheriff'||p.equipment.some(c=>c.type==='Jail'));
    const steal=['Panic!','Cat Balou'].includes(type);
    const row=node('div',null,'base-target');row.append(node('strong',`${p.name} · distance ${p.distance}`));
    const count=p.handCount-Number(p.id===s.selfId);const b=button(steal?`Random hand card (${count})`:`Play on ${p.name}`,()=>submit({type:'play',cardId:id,targetId:p.id}),'secondary');b.disabled=out||(steal&&!count);row.append(b);
    if(steal)for(const equipment of p.equipment){const b=button(equipment.type,()=>submit({type:'play',cardId:id,targetId:p.id,equipmentId:equipment.id}),'secondary');b.disabled=out;row.append(b);}content.append(row);
   }
  }else{if(type==='Beer'&&(s.players.filter(p=>!p.eliminated).length===2||me().hp>=me().maxHp))text('Beer can be played, but gives no healing in this situation.');actions(button(WEAPONS[type]?'Equip weapon':'Play card',()=>submit({type:'play',cardId:id}),'primary'),button('Keep in hand',close));}
 }
 function rules(){shell('base-rules','BANG! base rules','OFFICIAL BASE SET');text('80 playing cards, all 16 base characters, hidden roles and three turn phases: draw, play, discard to your health. Sheriff starts and has one extra life. No custom magic spells are included.');text('Character and card choices pause the table: Kit keeps two of three; Lucky chooses one of two draw! results; Jesse and Pedro choose their first draw source; General Store is chosen clockwise.');for(const c of BASE_CHARACTERS){content.append(node('h3',`${c.name} · ${c.hp} life`));text(c.ability);}for(const [label,url]of [['Publisher rulebook','https://bang.dvgiochi.com/content/1/docs/01_bang_rules_EN.pdf'],['Publisher FAQ','https://www.dvgiochi.com/giochi/bang/download/Bang!_FAQ_ENG.pdf']]){const a=node('a',label,'rule-source');a.href=url;a.target='_blank';a.rel='noopener';content.append(a);}actions(button('Back to table',close));}
 function update(s,previous){const key=s.choice?.playerId===s.selfId?'choice:'+s.choice.id:s.dying?.playerId===s.selfId?'rescue:'+s.dying.needed:s.pending?.targetId===s.selfId?`response:${s.pending.source}:${s.pending.type}:${s.pending.index}:${s.pending.blocksNeeded}:${s.pending.barrels.join(',')}:${s.hand.map(c=>c.id).join(',')}`:'';
  if(key!==lastKey){if(key)resume();else if(getKind().startsWith('base-')&&!['base-rules','base-card'].includes(getKind()))close();lastKey=key;}
  if(getKind()==='base-card'&&previous?.version!==s.version)close();
 }
 return {inspect,resume,update,sid,rules};
}
