import * as THREE from 'three';
// Reference boundary from OpenStreetMap, draped over the measured terrain.
export async function addMatterhornBorder(group:THREE.Group,heightAt:(x:number,z:number)=>number,location:(lng:number,lat:number,height:number)=>THREE.Vector3,signal:AbortSignal){
 const response=await fetch('/terrain/matterhorn-border.geojson',{signal});if(!response.ok)return;
 const data=await response.json() as {features:{geometry:{type:string;coordinates:number[][]}}[]};if(signal.aborted)return;
 for(const feature of data.features){if(feature.geometry.type!=='LineString')continue;const points:THREE.Vector3[]=[];const coords=feature.geometry.coordinates;
  for(let i=0;i<coords.length-1;i++){const a=location(coords[i][0],coords[i][1],0),b=location(coords[i+1][0],coords[i+1][1],0);const count=Math.max(1,Math.ceil(a.distanceTo(b)/20));for(let j=0;j<count;j++){const point=a.clone().lerp(b,j/count);point.y=heightAt(point.x,point.z)+14;points.push(point)}}
  const end=coords.at(-1);if(end){const point=location(end[0],end[1],0);point.y=heightAt(point.x,point.z)+14;points.push(point)}
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineDashedMaterial({color:'#efd29a',dashSize:55,gapSize:35,transparent:true,opacity:.76,depthWrite:false}));line.computeLineDistances();group.add(line);
 }
}
