/* 6px density lattice. Rendering uses interpolated marching squares, not cell outlines. */
(function(root){
'use strict';
const CFG=Object.freeze({cell:6,width:720,height:2304,chunk:24,iso:128,surface:234,saveKey:'niwahori-v03-soil-lab-v1',interval:.31,impact:.085,reach:84});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function noise(x,y,n=0){let h=Math.imul(x+431,374761393)^Math.imul(y+97,668265263)^Math.imul(n+13,1274126177);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;}
const ROCKS=[
 {x:363,y:370,rx:17,ry:21,ore:'iron',hp:3},
 {x:391,y:464,rx:42,ry:30,ore:null,hp:4},
 {x:344,y:548,rx:25,ry:30,ore:'gold',hp:4},
 {x:278,y:617,rx:36,ry:44,ore:null,hp:4},
 {x:372,y:722,rx:38,ry:28,ore:'iron',hp:4},
 {x:433,y:839,rx:28,ry:35,ore:'gem',hp:5},
 {x:347,y:955,rx:44,ry:32,ore:null,hp:5},
 {x:303,y:1080,rx:25,ry:31,ore:'gold',hp:4},
 {x:400,y:1262,rx:49,ry:35,ore:null,hp:5},
 {x:345,y:1390,rx:26,ry:30,ore:'gem',hp:5},
 {x:295,y:1565,rx:35,ry:48,ore:'iron',hp:4},
 {x:390,y:1750,rx:38,ry:34,ore:'gold',hp:5},
 {x:355,y:1990,rx:29,ry:40,ore:'gem',hp:5}
];
class Terrain{
 constructor(){this.cols=CFG.width/CFG.cell+1;this.rows=CFG.height/CFG.cell+1;this.data=new Uint8Array(this.cols*this.rows);this.rocks=ROCKS.map((r,i)=>({...r,id:i,health:r.hp,discovered:false,collected:false,broken:false,exposure:0}));this.dirty=new Set();this.revisions=0;this.nodeVisits=0;
  for(let y=0;y<this.rows;y++)for(let x=0;x<this.cols;x++){const wx=x*6,wy=y*6,surf=this.surface(wx),ground=wy-surf;let hole=1e6;if(wy<270)hole=Math.abs(wx-360)-29;else hole=Math.hypot(wx-360,wy-270)-29;this.data[y*this.cols+x]=clamp(Math.round(128+Math.min(ground,hole)*28),0,255);}
 }
 surface(x){return CFG.surface+Math.sin(x*.027)*2.6+Math.sin(x*.089)*1.2;}
 get(x,y){if(x<0||x>=this.cols||y>=this.rows)return 255;if(y<0)return 0;return this.data[y*this.cols+x];}
 density(x,y){const gx=x/6,gy=y/6,ix=Math.floor(gx),iy=Math.floor(gy),tx=gx-ix,ty=gy-iy;return (this.get(ix,iy)*(1-tx)+this.get(ix+1,iy)*tx)*(1-ty)+(this.get(ix,iy+1)*(1-tx)+this.get(ix+1,iy+1)*tx)*ty;}
 solid(x,y){return this.density(x,y)>=128;}
 rockAt(x,y){for(const r of this.rocks){if(r.broken||r.collected)continue;const a=Math.atan2((y-r.y)/r.ry,(x-r.x)/r.rx),j=1+.09*Math.sin(a*5+r.id)+.055*Math.sin(a*3+1);if(((x-r.x)/r.rx)**2+((y-r.y)/r.ry)**2<j*j)return r;}return null;}
 hard(x,y){return y>330+Math.sin(x*.025)*24&&Math.sin(x*.019+y*.015)>-.25||y>1100;}
 material(x,y){const r=this.rockAt(x,y);return r?'rock':this.hard(x,y)?'hard':'soil';}
 mark(x,y){for(let cy=Math.floor((y-4)/CFG.chunk);cy<=Math.floor((y+4)/CFG.chunk);cy++)for(let cx=Math.floor((x-4)/CFG.chunk);cx<=Math.floor((x+4)/CFG.chunk);cx++)if(cx>=0&&cy>=0)this.dirty.add(`${cx},${cy}`);}
 edit(ix,iy,value){const i=iy*this.cols+ix,n=clamp(Math.round(value),0,255);if(this.data[i]===n)return;this.data[i]=n;this.mark(ix,iy);}
 dig(x,y,tool,stroke){let removed=0,changed=0,hitRock=null,hardHits=0,soilHits=0;const rx=tool==='pick'?24:30,ry=tool==='pick'?22:25;
  const minX=clamp(Math.floor((x-rx)/6),1,this.cols-2),maxX=clamp(Math.ceil((x+rx)/6),1,this.cols-2),minY=clamp(Math.floor((y-ry)/6),0,this.rows-3),maxY=clamp(Math.ceil((y+ry)/6),0,this.rows-3);
  for(let iy=minY;iy<=maxY;iy++)for(let ix=minX;ix<=maxX;ix++){this.nodeVisits++;const wx=ix*6,wy=iy*6;if(wy<this.surface(wx)+14&&Math.abs(wx-360)>30)continue;const d=Math.hypot((wx-x)/rx,(wy-y)/ry);if(d>=1)continue;const before=this.get(ix,iy);if(before===0)continue;const rock=this.rockAt(wx,wy),hard=!rock&&this.hard(wx,wy),strength=rock?(tool==='pick'?100:12):hard?(tool==='pick'?155:95):(tool==='shovel'?460:300),amount=strength*Math.pow(1-d,.42);this.edit(ix,iy,before-amount);changed++;if(before>=128){if(rock)hitRock=rock;else if(hard)hardHits++;else soilHits++;if(this.get(ix,iy)<128)removed++;}}
  let broken=null,collapse=false;
  if(hitRock&&tool==='pick'){hitRock.health--;for(let yy=hitRock.y-hitRock.ry;yy<=hitRock.y+hitRock.ry+24;yy+=24)for(let xx=hitRock.x-hitRock.rx;xx<=hitRock.x+hitRock.rx+24;xx+=24)this.mark(Math.floor(xx/6),Math.floor(yy/6));if(hitRock.health<=0){broken=hitRock;this.breakRock(hitRock);removed+=24;}}
  // Occasional local hard-soil slough. Never flood-fill the whole terrain.
  if(hardHits>4&&stroke%7===0){collapse=true;for(let iy=minY;iy<=maxY+2;iy++)for(let ix=minX;ix<=maxX;ix++){if(iy>=this.rows-2)continue;const wx=ix*6,wy=iy*6;if(this.hard(wx,wy)&&!this.rockAt(wx,wy)&&Math.hypot((wx-x)/37,(wy-y)/31)<1){const before=this.get(ix,iy);this.edit(ix,iy,before-140);if(before>=128&&this.get(ix,iy)<128)removed++;}}}
  if(changed)this.revisions++;return {removed,changed,rock:hitRock,broken,collapse,material:hitRock?'rock':hardHits>soilHits?'hard':'soil'};
 }
 breakRock(r){r.broken=true;const x0=Math.max(1,Math.floor((r.x-r.rx*1.2)/6)),x1=Math.min(this.cols-2,Math.ceil((r.x+r.rx*1.2)/6)),y0=Math.floor((r.y-r.ry*1.2)/6),y1=Math.ceil((r.y+r.ry*1.2)/6);for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const a=Math.atan2((y*6-r.y)/r.ry,(x*6-r.x)/r.rx),j=1+.09*Math.sin(a*5+r.id)+.055*Math.sin(a*3+1);if(((x*6-r.x)/r.rx)**2+((y*6-r.y)/r.ry)**2<j*j)this.edit(x,y,0);}}
 exposure(r){let air=0;for(let i=0;i<24;i++){const a=i/24*Math.PI*2,rr=1.25;air+=!this.solid(r.x+Math.cos(a)*r.rx*rr,r.y+Math.sin(a)*r.ry*rr);}r.exposure=air/24;return r.exposure;}
 encode(){const out=[];let last=this.data[0],count=0;for(const n of this.data){if(n===last&&count<255)count++;else{out.push(count,last);last=n;count=1;}}out.push(count,last);let binary='';for(let i=0;i<out.length;i+=16384)binary+=String.fromCharCode(...out.slice(i,i+16384));return btoa(binary);}
 restore(encoded){const raw=atob(encoded);if(raw.length%2||raw.length>this.data.length*2)throw Error('Invalid density data');const next=new Uint8Array(this.data.length);let cursor=0;for(let i=0;i<raw.length;i+=2){const count=raw.charCodeAt(i),value=raw.charCodeAt(i+1);if(!count||cursor+count>next.length)throw Error('Invalid density run');next.fill(value,cursor,cursor+count);cursor+=count;}if(cursor!==next.length)throw Error('Incomplete terrain');this.data=next;this.dirty.clear();}
}
// Clockwise corners TL,TR,BR,BL; edges top,right,bottom,left.
const POLYGONS={1:[[0,4,7]],2:[[4,1,5]],3:[[0,1,5,7]],4:[[5,2,6]],5:[[0,4,7],[5,2,6]],6:[[4,1,2,6]],7:[[0,1,2,6,7]],8:[[7,6,3]],9:[[0,4,6,3]],10:[[4,1,5],[7,6,3]],11:[[0,1,5,6,3]],12:[[7,5,2,3]],13:[[0,4,5,2,3]],14:[[4,1,2,3,7]],15:[[0,1,2,3]]};
function polygonCell(ctx,values,x,y){const mask=values.reduce((m,n,i)=>m|(n>=128?1<<i:0),0);if(!mask)return;const t=(a,b)=>clamp((128-a)/(b-a||1),0,1),v=[[x,y],[x+6,y],[x+6,y+6],[x,y+6],[x+t(values[0],values[1])*6,y],[x+6,y+t(values[1],values[2])*6],[x+t(values[3],values[2])*6,y+6],[x,y+t(values[0],values[3])*6]];let polys=POLYGONS[mask];if((mask===5||mask===10)&&values.reduce((a,b)=>a+b,0)/4>=128)polys=mask===5?[[0,4,5,2,6,7]]:[[4,1,5,6,3,7]];for(const poly of polys){ctx.moveTo(...v[poly[0]]);for(let i=1;i<poly.length;i++)ctx.lineTo(...v[poly[i]]);ctx.closePath();}}
root.SoilLab={CFG,Terrain,noise,clamp,polygonCell};
})(typeof window==='undefined'?globalThis:window);
