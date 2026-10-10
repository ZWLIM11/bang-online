import * as T from './vendor/three.module.js';

// All figures and props are original meshes. No role is inferred from a costume.
export function createSaloon(host) {
  const scene = new T.Scene();
  scene.background = new T.Color('#bd9260');
  scene.fog = new T.FogExp2('#b78e60', .009);
  const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.domElement.setAttribute('aria-label', 'Interactive 3D saloon: drag to look around the table');
  host.append(renderer.domElement);
  const camera = new T.PerspectiveCamera(43, 1, .1, 65);
  const materials = {};
  const mat = (color, metalness = 0, roughness = .7) => materials[color + metalness] ||= new T.MeshStandardMaterial({ color, metalness, roughness });
  function mesh(parent, geometry, material, x=0,y=0,z=0) {
    const m = new T.Mesh(geometry, material); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m;
  }
  const box = (p,w,h,d,m,x=0,y=0,z=0) => mesh(p,new T.BoxGeometry(w,h,d),m,x,y,z);
  const cyl = (p,r1,r2,h,m,x=0,y=0,z=0) => mesh(p,new T.CylinderGeometry(r1,r2,h,40),m,x,y,z);
  const ball = (p,r,m,x=0,y=0,z=0) => mesh(p,new T.SphereGeometry(r,20,14),m,x,y,z);
  function rod(p,a,b,r,m) { const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av); const o=cyl(p,r,r,v.length(),m); o.position.copy(av.add(bv).multiplyScalar(.5)); o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize()); return o; }
  function texture(kind) {
    const c=document.createElement('canvas'); c.width=c.height=512; const ctx=c.getContext('2d');
    ctx.fillStyle=kind==='wood'?'#81502d':'#d4b887';ctx.fillRect(0,0,512,512);
    let seed=42; const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<1500;i++){ctx.strokeStyle=`rgba(${kind==='wood'?'35,15,5':'80,42,18'},${rand()*.19})`;ctx.lineWidth=rand()*2;ctx.beginPath();let y=rand()*512;ctx.moveTo(0,y);ctx.bezierCurveTo(140,y+rand()*18,350,y-rand()*18,512,y);ctx.stroke();}
    if(kind==='wood'){for(let y=0;y<512;y+=85){ctx.fillStyle='#211209';ctx.fillRect(0,y,512,3);}}
    const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
  }
  const wood = new T.MeshStandardMaterial({map:texture('wood'),roughness:.65});
  const dark=mat('#301c13'), brass=mat('#bd8b3c',.75,.28), steel=mat('#69777a',.88,.23), leather=mat('#33221c');
  box(scene,28,.2,25,wood,0,-.12,0);
  box(scene,27,9,.3,wood,0,4,-8);
  box(scene,27,9,.3,wood,0,4,9);
  box(scene,.3,9,17,wood,-13,4,.5);box(scene,.3,9,17,wood,13,4,.5);
  for(let x=-10;x<=10;x+=4){box(scene,.25,8,.3,dark,x,4,8.7);box(scene,2.2,2.8,.15,mat('#28716c'),x+1.6,4,8.65);box(scene,1.8,2.3,.18,mat('#b9d9d1'),x+1.6,4,8.5);}
  for(let x=-12;x<=12;x+=3)box(scene,.26,8,.4,dark,x,3.7,-7.7);
  box(scene,16,1.8,1.4,dark,0,.9,-6.8);box(scene,17,.17,1.8,wood,0,1.85,-6.8);
  for(let y=2.8;y<5;y+=1.2){box(scene,15,.14,.7,wood,0,y,-7.4);for(let x=-6.7;x<7;x+=.65){const b=new T.Group();scene.add(b);b.position.set(x,y+.1,-7.3);cyl(b,.11,.14,.48,mat(x%2?'#304535':'#61301c'),0,.24);cyl(b,.055,.055,.23,brass,0,.57);}}
  function sign(text,w,h){const c=document.createElement('canvas');c.width=1024;c.height=256;const q=c.getContext('2d');q.fillStyle='#392217';q.fillRect(0,0,1024,256);q.strokeStyle='#b88846';q.lineWidth=12;q.strokeRect(12,12,1000,232);q.fillStyle='#edc888';q.font='bold 110px Georgia';q.textAlign='center';q.fillText(text,512,165);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return mesh(scene,new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:t}),0,5.8,-7.58);}
  sign('HEX & HOLSTERS',8,2);
  // Sunlit windows and teal shutters give the room colour and depth.
  for(const side of [-1,1]){
    const windowMat=new T.MeshStandardMaterial({color:'#a9d9dd',emissive:'#81a8ab',emissiveIntensity:.8});
    box(scene,3,3.5,.12,windowMat,side*9,4,-7.7);
    for(const dx of [-1.55,0,1.55])box(scene,.13,3.7,.22,mat('#236c6a'),side*9+dx,4,-7.5);
    for(const y of [2.2,4,5.8])box(scene,3.3,.12,.22,mat('#236c6a'),side*9,y,-7.5);
  }
  const sun=new T.DirectionalLight('#ffe4ac',2.5);sun.position.set(-9,7,3);scene.add(sun);
  // Heavy carved tabletop, beveled brass rim and pedestal.
  cyl(scene,1,1.5,1.8,dark,0,.9);cyl(scene,4.15,4.05,.25,dark,0,1.9);
  cyl(scene,4.12,4.12,.07,brass,0,2.04);cyl(scene,4.04,4.04,.17,wood,0,2.13);
  const ring=mesh(scene,new T.TorusGeometry(3.75,.022,8,120),brass,0,2.223);ring.rotation.x=Math.PI/2;
  function gun(parent, rifle=false) {
    const g=new T.Group();parent.add(g);
    box(g,rifle?1.35:.68,.09,.10,steel,.18,.16);
    cyl(g,.13,.13,.21,steel,-.13,.11).rotation.x=Math.PI/2;
    const grip=box(g,.16,.32,.13,wood,-.36,-.06);grip.rotation.z=-.35;
    if(rifle)box(g,.48,.16,.14,wood,-.48,.1);
    const guard=mesh(g,new T.TorusGeometry(.1,.016,8,24),brass,-.17,-.045);guard.scale.x=.8;
    box(g,.08,.06,.035,steel,.43,.24);return g;
  }
  function lantern(x,z){const g=new T.Group();scene.add(g);g.position.set(x,2.24,z);cyl(g,.18,.22,.09,brass);cyl(g,.17,.2,.12,dark,0,.47);const glow=new T.MeshStandardMaterial({color:'#ffcf73',emissive:'#ff941c',emissiveIntensity:3});cyl(g,.10,.11,.32,glow,0,.23);for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5])rod(g,[Math.cos(a)*.15,.04,Math.sin(a)*.15],[Math.cos(a)*.15,.46,Math.sin(a)*.15],.018,brass);const l=new T.PointLight('#ffad48',13,6,2);l.position.set(x,2.8,z);scene.add(l);return l;}
  const lamps=[lantern(-2.7,0),lantern(2.7,0)];
  function mug(p,x,z){cyl(p,.15,.13,.28,mat('#9c6429',.35,.25),x,2.39,z);cyl(p,.145,.145,.025,mat('#f4d8a1'),x,2.54,z);const h=mesh(p,new T.TorusGeometry(.11,.035,8,20),brass,x+.17,2.39,z);h.scale.y=1.1;}
  mug(scene,-1.9,1.9);mug(scene,2,-1.8);
  for(let i=0;i<5;i++){cyl(scene,.045,.045,.19,brass,1.5+i*.12,2.34,1.8);ball(scene,.044,brass,1.5+i*.12,2.45,1.8);}
  const showGun=gun(scene,true);showGun.position.set(-1.5,2.27,2.2);showGun.rotation.set(Math.PI/2,0,.5);
  const cardMat=mat('#e1c796');
  for(let i=0;i<9;i++)box(scene,.53,.018,.79,cardMat,-.65,2.24+i*.019,0);
  box(scene,.5,.02,.76,mat('#7a2920'),-.65,2.415,0);
  for(let i=0;i<3;i++)box(scene,.53,.02,.79,cardMat,.7,2.24+i*.023,0);
  const figures=new Map(), effects=[];
  const palettes=[['#393b35','#922e23'],['#67452e','#dfb05b'],['#283b44','#8b6542'],['#4b3049','#d0a980'],['#82613b','#293e36'],['#322a28','#877a62'],['#484b59','#a24c28']];
  function figure(index) {
    const g=new T.Group(), [coatColor,scarfColor]=palettes[index%palettes.length];const coat=mat(coatColor),scarf=mat(scarfColor),skin=mat(['#bd8c65','#d2a078','#895f43'][index%3]);
    box(g,.87,.14,.77,wood,0,.83);box(g,.88,1.25,.12,wood,0,1.47,-.36);
    for(const x of [-.34,.34])for(const z of [-.27,.27])box(g,.09,.83,.09,dark,x,.42,z);
    const torso=cyl(g,.37,.30,.83,coat,0,1.48);torso.scale.z=.7;
    box(g,.20,.64,.03,mat('#d0b98c'),0,1.52,.27);
    for(const x of [-.1,.1]){box(g,.11,.67,.05,leather,x,1.48,.28).rotation.z=x>0?-.14:.14;}
    for(let y=1.3;y<1.8;y+=.13)ball(g,.022,brass,0,y,.31);
    cyl(g,.13,.15,.17,skin,0,1.97);
    const head=ball(g,.24,skin,0,2.2);head.scale.set(.82,1.25,.88);
    const nose=ball(g,.045,skin,0,2.2,.22);nose.scale.set(.7,1.3,1.2);
    for(const x of [-.085,.085]){
      const eye=ball(g,.036,mat('#ddcbb5'),x,2.27,.18);eye.scale.set(1,.5,.45);
      ball(g,.013,mat('#302b20'),x,2.272,.199);
      rod(g,[x-.039,2.307,.181],[x+.028,2.313,.19],.011,leather);
      ball(g,.043,skin,Math.sign(x)*.20,2.20,0);
    }
    rod(g,[-.055,2.105,.216],[.055,2.105,.216],.012,mat('#774a36'));
    for(const side of [-1,1]){
      const lapel=box(g,.16,.50,.045,coat,side*.19,1.62,.27);lapel.rotation.z=side*-.27;
      box(g,.12,.09,.025,leather,side*.23,1.48,.30);
      for(let j=0;j<4;j++)rod(g,[side*.3+j*.02,1.52,.73],[side*.3+j*.02,1.47,.8],.014,skin);
    }
    const beard=ball(g,.175,mat(index%2?'#4b3020':'#29201b'),0,2.07,.04);beard.scale.set(.85,.48,1);
    for(let i=0;i<18;i++){const a=(i/18)*Math.PI;rod(g,[Math.cos(a)*.14,2.10,.15+Math.sin(a)*.025],[Math.cos(a)*.125,2.01,.15],.008,mat(index%2?'#694832':'#413126'));}
    cyl(g,.17,.24,.12,scarf,0,1.94);const bandana=box(g,.20,.3,.055,scarf,.03,1.81,.29);bandana.rotation.z=.35;
    const brim=cyl(g,.43,.44,.055,leather,0,2.48);brim.scale.z=.85;brim.rotation.z=index%2?.08:-.06;
    const crown=cyl(g,.24,.29,.3,leather,0,2.64);crown.scale.z=.8;cyl(g,.285,.29,.07,scarf,0,2.53).scale.z=.8;
    let rightArm;
    for(const side of [-1,1]){const arm=new T.Group();arm.position.set(side*.31,1.77,0);g.add(arm);rod(arm,[0,0,0],[side*.19,-.37,.35],.12,coat);rod(arm,[side*.19,-.37,.35],[-side*.01,-.22,.69],.1,coat);ball(arm,.105,skin,-side*.01,-.22,.71);if(side===1)rightArm=arm;box(g,.21,.5,.25,coat,side*.2,1.03,.27);box(g,.23,.19,.4,leather,side*.2,.54,.5);}
    for(let j=0;j<3;j++){const c=box(g,.16,.26,.018,mat('#7e3025'),-.15+j*.14,1.67,.77);c.rotation.z=(j-1)*-.16;}
    const weapon=gun(g,true);weapon.position.set(.55,1.05,.3);weapon.rotation.z=-1.2;weapon.visible=false;
    const base=mesh(g,new T.TorusGeometry(.63,.028,8,40),brass,0,.08);base.rotation.x=Math.PI/2;
    const body=new T.Group();body.position.y=1.2;
    const parts=g.children.slice(6).filter(o=>o!==base);
    for(const o of parts){g.remove(o);o.position.y-=1.2;body.add(o);}g.add(body);
    const shootingGun=gun(body);shootingGun.position.set(.35,.45,.85);shootingGun.rotation.y=-Math.PI/2;shootingGun.visible=false;
    const flash=mesh(shootingGun,new T.ConeGeometry(.13,.4,7),new T.MeshBasicMaterial({color:'#ffe28a'}),.78,.16,0);flash.rotation.z=-Math.PI/2;
    return {g,weapon,base,torso,body,shootingGun,rightArm,flash,motion:null};
  }
  const fill=new T.HemisphereLight('#f5d9b2','#20130d',2);scene.add(fill);
  const key=new T.SpotLight('#ffdb9b',190,30,.8,.7,1.5);key.position.set(-3,9,5);key.target.position.set(0,1,0);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.bias=-.0003;scene.add(key,key.target);
  const rim=new T.DirectionalLight('#91acd0',2);rim.position.set(5,5,-4);scene.add(rim);
  let nextState=null, yaw=0, pitch=.40, distance=12.7, dragging=null, lastTime=0, first=false;
  const canvas=renderer.domElement;
  canvas.addEventListener('pointerdown',e=>{dragging=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;yaw-=(e.clientX-dragging[0])*.004;pitch=T.MathUtils.clamp(pitch+(e.clientY-dragging[1])*.003,first?-.5:.25,first?.6:1.15);dragging=[e.clientX,e.clientY];});
  canvas.addEventListener('pointerup',()=>dragging=null);canvas.addEventListener('pointercancel',()=>dragging=null);
  function update(state){nextState=state; const count=state.players.length;for(const [id,f]of figures){if(!state.players.some(p=>p.id===id)){scene.remove(f.g);f.g.traverse(o=>o.geometry?.dispose());figures.delete(id);}}
    state.players.forEach((p,i)=>{let f=figures.get(p.id);if(!f){f=figure(i);scene.add(f.g);figures.set(p.id,f);}const a=Math.PI+i*Math.PI*2/Math.max(count,1);f.g.position.set(Math.sin(a)*4.5,0,Math.cos(a)*4.5);f.g.rotation.y=a+Math.PI;f.weapon.visible=!!p.weapon;f.base.visible=p.id===state.turnId;f.g.scale.setScalar(1.35);f.g.scale.y=state.started&&p.hp<=0?.85:1.35;});
  }
  function play(effect){const from=figures.get(effect.from)?.g.position.clone()||new T.Vector3(0,0,0);const to=figures.get(effect.to)?.g.position.clone()||new T.Vector3(0,0,0);from.y=to.y=2.7;const spell=/Hex|Ward|Burst/.test(effect.label||'');const group=new T.Group();scene.add(group);const orb=ball(group,spell?.13:.06,new T.MeshBasicMaterial({color:spell?'#c599ff':'#ffe6a1'}));const light=new T.PointLight(spell?'#a867ff':'#ffbb55',12,4);group.add(light);let weapon;if(effect.label==='Shoot'||effect.label==='Rifle'){weapon=gun(group,effect.label==='Rifle');weapon.position.copy(from);weapon.scale.setScalar(1.3);}
    const shooter=figures.get(effect.from), victim=figures.get(effect.to);
    if(weapon){group.remove(weapon);weapon.traverse(o=>o.geometry?.dispose());}
    if(shooter&&effect.kind==='play')shooter.motion={kind:'shoot',start:performance.now(),target:to};
    if(victim&&['damage','block','eliminate'].includes(effect.kind))victim.motion={kind:effect.kind,start:performance.now()};
    if(shooter&&effect.kind==='emote')shooter.motion={kind:effect.label,start:performance.now()};
    if(effect.kind==='emote'||effect.kind==='start'||effect.kind==='win'){orb.visible=false;light.intensity=0;}
    const halo=mesh(group,new T.TorusGeometry(.36,.028,8,50),new T.MeshBasicMaterial({color:spell?'#ba88ff':'#ffc76b',transparent:true}));halo.rotation.x=Math.PI/2;halo.position.copy(to);effects.push({group,orb,light,halo,from,to,start:performance.now()});
  }
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame(time){requestAnimationFrame(frame);if(document.hidden||!host.isConnected||!host.clientWidth||time-lastTime<32)return;lastTime=time;
    const w=host.clientWidth,h=host.clientHeight;if(canvas.width!==Math.floor(w*renderer.getPixelRatio())||canvas.height!==Math.floor(h*renderer.getPixelRatio())){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
    const d=distance*(camera.aspect<1.1?1.3:1);
    const self=figures.get(nextState?.selfId);
    if(first&&self){const p=self.g.position;camera.position.set(p.x,3.45,p.z);const angle=Math.atan2(-p.x,-p.z)+yaw;camera.lookAt(p.x+Math.sin(angle)*6,3.1-pitch*4,p.z+Math.cos(angle)*6);}
    else{camera.position.set(Math.sin(yaw)*Math.cos(pitch)*d,2+Math.sin(pitch)*d,Math.cos(yaw)*Math.cos(pitch)*d);camera.lookAt(0,1.9,0);}
    for(const [id,f]of figures){f.body.visible=!(first&&id===nextState?.selfId);const p=nextState?.players.find(p=>p.id===id);const dead=nextState?.started&&p?.hp<=0;f.body.rotation.set(dead?.72:0,0,dead?.2:0);f.shootingGun.visible=false;if(f.motion&&!reduced){const age=(time-f.motion.start)/1000;if(age>2.1)f.motion=null;else{const pulse=Math.sin(Math.min(age/2.1,1)*Math.PI);switch(f.motion.kind){case 'shoot':f.shootingGun.visible=true;f.shootingGun.position.z=.85-Math.max(0,Math.sin(age*22))*.12;f.body.rotation.x=-pulse*.12;if(f.motion.target){const t=f.motion.target;f.body.rotation.y=Math.atan2(t.x-f.g.position.x,t.z-f.g.position.z)-f.g.rotation.y;}break;case 'damage':f.body.rotation.x=-pulse*.35;break;case 'block':f.body.rotation.z=pulse*.3;break;case 'wave':f.body.rotation.x=Math.sin(age*8)*.12;break;case 'cheers':f.body.rotation.z=Math.sin(age*6)*.13;f.shootingGun.visible=false;break;case 'taunt':f.body.rotation.y=Math.sin(age*7)*.25;break;}}}}
    lamps.forEach((l,i)=>l.intensity=13+(reduced?0:Math.sin(time*.004+i)*.8));
    for(const f of figures.values()){f.rightArm.rotation.set(0,0,0);f.flash.visible=false;if(f.motion&&!reduced){const t=(time-f.motion.start)/1000;const wave=Math.sin(Math.min(1,t/2.1)*Math.PI);if(f.motion.kind==='wave'){f.rightArm.rotation.x=-wave*1.5;f.rightArm.rotation.z=Math.sin(t*10)*.3;}if(f.motion.kind==='cheers')f.rightArm.rotation.x=-wave*.9;if(f.motion.kind==='shoot'){f.rightArm.rotation.x=-wave*.35;f.flash.visible=t>.2&&t<.38;}}}
    for(const [id,f]of figures){if(!reduced)f.torso.scale.y=1+Math.sin(time*.0015+f.g.position.x)*.012;const point=new T.Vector3().copy(f.g.position);point.y=3.9;point.project(camera);const label=document.querySelector(`[data-player-id="${CSS.escape(id)}"]`);if(label){label.style.left=`${(point.x*.5+.5)*100}%`;label.style.top=`${(-point.y*.5+.5)*100}%`;}}
    for(let i=effects.length-1;i>=0;i--){const e=effects[i],t=(time-e.start)/1500;e.orb.position.lerpVectors(e.from,e.to,Math.min(t*2,1));e.orb.position.y+=Math.sin(Math.min(t*2,1)*Math.PI)*(reduced?0:.65);e.light.position.copy(e.orb.position);e.halo.scale.setScalar(1+t*3);e.halo.material.opacity=1-t;if(t>1){scene.remove(e.group);e.group.traverse(o=>{o.geometry?.dispose();if(o.material?.isMeshBasicMaterial)o.material.dispose();});effects.splice(i,1);}}
    renderer.render(scene,camera);
  }
  requestAnimationFrame(frame);
  update({players:Array.from({length:5},(_,i)=>({id:`preview-${i}`,hp:4,weapon:i===1})),turnId:'preview-0'});
  return {update,play,mount(element){host=element;host.append(canvas);},firstPerson(){first=true;yaw=0;pitch=.08;},reset(){first=false;yaw=0;pitch=.40;},overhead(){first=false;yaw=0;pitch=1.13;}};
}

