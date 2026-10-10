export const cardTypes=['Shoot','Dodge','Tonic','Rifle','Dust Hex','Ward','Lantern Burst'];
export function artwork(element,type){const i=cardTypes.indexOf(type);element.classList.add('illustrated-card');element.style.backgroundPosition=`${(Math.max(0,i)%4)*100/3}% ${i<4?0:100}%`;element.textContent='';element.setAttribute('aria-hidden','true');}
export function portrait(element,index){element.classList.add('portrait-art');element.style.backgroundPosition=`${(index%4)*100/3}% ${index<4?0:100}%`;}
