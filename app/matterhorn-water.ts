import * as THREE from 'three';
import {winterContext} from '@/lib/winter-context';
type Feature={geometry:{type:string;coordinates:unknown};properties:{name?:string;waterway?:string;natural?:string;water?:string}};
export type LandscapeMarker={element:HTMLElement;point:THREE.Vector3;id:string;kind:string};
export async function addMatterhornWater(scene:THREE.Scene,root:HTMLElement,heightAt:(x:number,z:number)=>number,location:(lng:number,lat:number,height:number)=>THREE.Vector3,markers:LandscapeMarker[],signal:AbortSignal,onProtect:()=>void){
 const response=await fetch('/terrain/zmutt-valley.geojson',{signal});if(!response.ok)throw new Error('Mapped waterways are unavailable.');
 const data=await response.json() as {features:Feature[]};const group=new THREE.Group();group.visible=false;scene.add(group);
 function points(coords:number[][]){const result:THREE.Vector3[]=[];for(let i=0;i<coords.length-1;i++){const a=location(coords[i][0],coords[i][1],0),b=location(coords[i+1][0],coords[i+1][1],0);const steps=Math.max(1,Math.ceil(a.distanceTo(b)/18));for(let j=0;j<steps;j++){const p=a.clone().lerp(b,j/steps);p.y=heightAt(p.x,p.z)+8;result.push(p)}}const c=coords.at(-1);if(c){const p=location(c[0],c[1],0);p.y=heightAt(p.x,p.z)+8;result.push(p)}return result;}
 for(const feature of data.features){const g=feature.geometry;const stream=feature.properties.waterway==='stream';const glacier=feature.properties.name==='Zmuttgletscher';const reservoir=feature.properties.name==='Stausee Zmutt';
  if(stream&&g.type==='LineString'){
   const path=points(g.coordinates as number[][]);if(path.length<2)continue;
   const curve=new THREE.CurvePath<THREE.Vector3>();for(let i=1;i<path.length;i++)curve.add(new THREE.LineCurve3(path[i-1],path[i]));
   group.add(new THREE.Mesh(new THREE.TubeGeometry(curve,path.length,4,5,false),new THREE.MeshBasicMaterial({color:'#a4edf0',transparent:true,opacity:.9})));
   group.add(new THREE.Mesh(new THREE.TubeGeometry(curve,path.length,11,5,false),new THREE.MeshBasicMaterial({color:'#83dfe8',transparent:true,opacity:.13,depthWrite:false})));
  }else if((glacier||reservoir)&&g.type==='Polygon'){
   const outline=points((g.coordinates as number[][][])[0]);const geometry=new THREE.BufferGeometry().setFromPoints(outline);
   const line=new THREE.Line(geometry,new THREE.LineDashedMaterial({color:glacier?'#d2e8f2':'#a4edf0',transparent:true,opacity:glacier?.55:.85,dashSize:glacier?70:35,gapSize:glacier?45:12,depthWrite:false}));line.computeLineDistances();group.add(line);
   if(reservoir){
    // Cartographic tint on the mapped reservoir, not a modeled water level.
    const ring=(g.coordinates as number[][][])[0].slice(0,-1).map(c=>location(c[0],c[1],0));
    const bounds=new THREE.Box2().setFromPoints(ring.map(p=>new THREE.Vector2(p.x,p.z)));group.userData.waterBounds={minX:bounds.min.x-15,maxX:bounds.max.x+15,minZ:bounds.min.y-15,maxZ:bounds.max.y+15};
    const flat=ring.map(p=>new THREE.Vector2(p.x,p.z));const triangles=THREE.ShapeUtils.triangulateShape(flat,[]);const vertices=new Float32Array(ring.length*3);
    ring.forEach((p,i)=>{vertices[i*3]=p.x;vertices[i*3+1]=heightAt(p.x,p.z)+8;vertices[i*3+2]=p.z});
    const fill=new THREE.BufferGeometry();fill.setAttribute('position',new THREE.BufferAttribute(vertices,3));fill.setIndex(triangles.flat());
    group.add(new THREE.Mesh(fill,new THREE.MeshBasicMaterial({color:'#82dee1',opacity:.42,transparent:true,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1})));
   }
  }
 }
 const pins=[{id:'zmutt-glacier',name:'Zmuttgletscher',lng:7.640246,lat:45.997514,kind:'glacier'},{id:'zmutt-reservoir',name:'Zmutt reservoir',lng:7.706734,lat:46.007998,kind:'water'},{id:'zmutt-river',name:'Zmuttbach',lng:7.726506,lat:46.007567,kind:'water'}];
 for(const pin of pins){const point=location(pin.lng,pin.lat,0);point.y=heightAt(point.x,point.z)+(pin.id==='zmutt-reservoir'?280:60);const isGlacier=pin.kind==='glacier';const element=document.createElement(isGlacier?'button':'div');element.className=`pin scene-pin water-pin ${isGlacier?'climate-pin':''}`;if(isGlacier){const data=winterContext.glacier;const name=document.createElement('strong');name.textContent=pin.name;const stat=document.createElement('span');stat.textContent=`≈${data.lossPercent}% less glacier area`;const period=document.createElement('small');period.textContent=`${data.startYear}–${data.endYear} · See evidence ↗`;element.appendChild(name);element.appendChild(stat);element.appendChild(period);element.setAttribute('aria-label',`${pin.name}: approximately ${data.lossPercent}% less glacier area, ${data.startYear} to ${data.endYear}. Open climate evidence and Protect Our Winters.`);element.onclick=onProtect}else{element.textContent=pin.name;element.style.pointerEvents='none';}element.dataset.visible='no';root.appendChild(element);markers.push({element,point,id:pin.id,kind:pin.kind})}
 return group;
}
