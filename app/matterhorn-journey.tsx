'use client';
import {ArrowUpRight, Leaf, Sparkles} from 'lucide-react';
import type {MountainView} from './mountain-scene';
const stops = [
 {id:'matterhorn',label:'Rock',name:'The Matterhorn',detail:'A 4,478 m summit above a landscape shaped by ice.',source:'https://www.openstreetmap.org/node/26863664'},
 {id:'glacier',label:'Ice',name:'Zmuttgletscher',detail:'Look for ice beneath the debris. The glacier’s lower tongue is covered in rock.',source:'https://tc.copernicus.org/articles/13/1889/2019/'},
 {id:'river',label:'Water',name:'The Zmutt valley',detail:'Follow Zmuttbach to the reservoir, where mountain water becomes part of a hydropower system.',source:'https://zermatt.swiss/en/p/zmutt-dam-01tVj000005DmWzIAK'},
] as const;
export default function MatterhornJourney({active,onView,onProtect,onAsk}:{active:MountainView;onView:(v:MountainView)=>void;onProtect:()=>void;onAsk:()=>void}){
 const stop=stops.find(s=>s.id===active);if(!stop)return null;
 return <section className="matterhorn-journey" aria-label="Matterhorn rock ice and water">
  <div className="journey-stops" aria-label="Matterhorn camera stops">{stops.map((s,i)=><button key={s.id} aria-pressed={active===s.id} onClick={()=>onView(s.id)}><span>0{i+1}</span>{s.label}</button>)}</div>
  <h2>{stop.name}</h2><p>{stop.detail}</p>
  <div className="journey-links"><a href={stop.source} target="_blank" rel="noreferrer">Source<ArrowUpRight size={12}/></a><button onClick={onAsk}><Sparkles size={13}/>Explore with Astra</button><button onClick={onProtect}><Leaf size={13}/>Protect Our Winters</button></div>
  <small>Historical imagery © swisstopo · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">map highlights © OpenStreetMap</a></small>
 </section>;
}
