import * as THREE from 'three';
import {windVelocity,type AtmosphereSettings} from '@/lib/atmosphere';
/** Illustrative particles driven by a uniform wind, not a terrain airflow solver. */
export function createMountainWeather(scene:THREE.Scene,camera:THREE.PerspectiveCamera,heightAt:(x:number,z:number)=>number){
 const snowCount=2600,traceCount=100,traceSteps=6;
 const particles=new Float32Array(snowCount*3);const offsets=new Float32Array(snowCount*3);
 // A reproducible distribution prevents the scene from changing when a slider moves.
 let seed=4711;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 for(let i=0;i<offsets.length;i++)offsets[i]=random();
 const snowGeometry=new THREE.BufferGeometry();snowGeometry.setAttribute('position',new THREE.BufferAttribute(particles,3).setUsage(THREE.DynamicDrawUsage));
 const snowMaterial=new THREE.PointsMaterial({color:'#f3f9ff',size:2.2,sizeAttenuation:false,transparent:true,opacity:.7,depthWrite:false,fog:false});
 snowMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
 float radius=length(gl_PointCoord-vec2(.5));if(radius>.5)discard;`);shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`diffuseColor.a*=1.-smoothstep(.15,.5,length(gl_PointCoord-vec2(.5)));
 #include <opaque_fragment>`)};
 const snow=new THREE.Points(snowGeometry,snowMaterial);snow.frustumCulled=false;snow.visible=false;scene.add(snow);
 const tracePositions=new Float32Array(traceCount*traceSteps*6),traceColors=new Float32Array(tracePositions.length),seeds=new Float32Array(traceCount*3);for(let i=0;i<seeds.length;i++)seeds[i]=random();
 for(let i=0;i<traceCount*traceSteps;i++){const alpha=(i%traceSteps+1)/traceSteps;for(let vertex=0;vertex<2;vertex++){const j=i*6+vertex*3;traceColors[j]=.015+alpha*.045;traceColors[j+1]=.15+alpha*.3;traceColors[j+2]=.23+alpha*.36}}
 const traceGeometry=new THREE.BufferGeometry();traceGeometry.setAttribute('position',new THREE.BufferAttribute(tracePositions,3).setUsage(THREE.DynamicDrawUsage));traceGeometry.setAttribute('color',new THREE.BufferAttribute(traceColors,3));
 const traceMaterial=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.85,depthWrite:false,fog:false});const traces=new THREE.LineSegments(traceGeometry,traceMaterial);traces.frustumCulled=false;scene.add(traces);
 let elapsed=0,lastNow=0,lastMode:boolean|null=null;const anchor=new THREE.Vector3();const forward=new THREE.Vector3();const wrap=(v:number,n:number)=>(v%n+n)%n;
 return {update(now:number,settings:AtmosphereSettings,pov:boolean){
 const dt=lastNow?Math.min((now-lastNow)/1000,.06):0;lastNow=now;if(!settings.paused)elapsed+=dt;
 const velocity=windVelocity(settings.windKmh,settings.windFrom);const side=pov?110:18000,vertical=pov?80:8000;
 if(lastMode!==pov){anchor.copy(camera.position);lastMode=pov;}
 // Wrap particles around the moving camera, preserving world-space wind direction.
 const snowVisible=settings.snow>0;snow.visible=snowVisible;
 if(snowVisible){const active=Math.round(snowCount*settings.snow/100);snowGeometry.setDrawRange(0,active);snowMaterial.size=pov?2.5:2;
 const fallSpeed=pov?2.3:95;const visualScale=pov?1:25;
 for(let i=0;i<active;i++){const j=i*3;const worldX=anchor.x+(offsets[j]-.5)*side+velocity.x*elapsed*visualScale;
 const worldZ=anchor.z+(offsets[j+2]-.5)*side+velocity.z*elapsed*visualScale;
 const x=camera.position.x+wrap(worldX-camera.position.x+side/2,side)-side/2;
 const z=camera.position.z+wrap(worldZ-camera.position.z+side/2,side)-side/2;
 const worldY=anchor.y+offsets[j+1]*vertical-elapsed*fallSpeed;
 let y=camera.position.y+wrap(worldY-camera.position.y+vertical*.35,vertical)-vertical*.35;
 if(y<heightAt(x,z)+.8)y=camera.position.y+vertical*.65;
 particles[j]=x;particles[j+1]=y;particles[j+2]=z;
 }snowGeometry.attributes.position.needsUpdate=true;}
 traces.visible=settings.traces&&settings.windKmh>0;
 if(traces.visible){camera.getWorldDirection(forward);const cx=pov?camera.position.x+forward.x*90:4000,cz=pov?camera.position.z+forward.z*90:-2200,extent=pov?260:7500;
 const visualScale=pov?1:16;const length=pov?10:250;const norm=Math.hypot(velocity.x,velocity.z)||1,dx=velocity.x/norm,dz=velocity.z/norm;
 for(let i=0;i<traceCount;i++){const x=cx+wrap(seeds[i*3]*extent+velocity.x*elapsed*visualScale,extent)-extent/2,z=cz+wrap(seeds[i*3+1]*extent+velocity.z*elapsed*visualScale,extent)-extent/2;const y=heightAt(x,z)+(pov?3+seeds[i*3+2]*15:100+seeds[i*3+2]*300);
 for(let step=0;step<traceSteps;step++){const j=(i*traceSteps+step)*6;for(let end=0;end<2;end++){const t=(step+end)/traceSteps;tracePositions[j+end*3]=x-dx*length*(1-t);tracePositions[j+end*3+1]=y+Math.sin(t*Math.PI)*length*.018;tracePositions[j+end*3+2]=z-dz*length*(1-t);}}
 }traceGeometry.attributes.position.needsUpdate=true;}
 },dispose(){scene.remove(snow,traces);snowGeometry.dispose();snowMaterial.dispose();traceGeometry.dispose();traceMaterial.dispose();}};
}
