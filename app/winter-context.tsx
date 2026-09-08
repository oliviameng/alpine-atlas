'use client';
import {ArrowUpRight, ChevronDown, Leaf, TrainFront, Wrench, Users} from 'lucide-react';
import {winterContext} from '@/lib/winter-context';

export default function WinterContext({open, onOpen, standalone = false}: {open: boolean; onOpen: (open: boolean) => void; standalone?: boolean}) {
 const {report, pow, glacier} = winterContext;
 return <section className={`winter-context ${open ? 'is-open' : ''}`} aria-label="Winter over time">
  <button className="winter-toggle" disabled={standalone} aria-expanded={open} aria-controls="winter-long-view" onClick={() => onOpen(!open)}>
   <Leaf size={19}/><span><strong>Protect Our Winters</strong><small>Winter over time · evidence & actions</small></span><ChevronDown size={17}/>
  </button>
  {open && <div id="winter-long-view" className="winter-body">
   <p className="winter-timescale"><span>{standalone?'Care for the places you love':'These images · hours'}</span>{standalone?'Explore the longer view of winter, and how Protect Our Winters brings the outdoor community together for climate action.':'Clouds, shadows and fresh snow can change within hours. This camera pair cannot establish a climate trend.'}</p>
   <div className="winter-record local-glacier-record">
    <span className="winter-kicker">{glacier.name} · {glacier.startYear}–{glacier.endYear}</span>
    <div className="winter-stat"><strong>≈−{glacier.lossPercent}%</strong><span>glacier area<br/>historical record</span></div>
    <p>{glacier.startArea} ± 0.34 → {glacier.endArea} ± 0.02 km². About 26% less area, calculated from the study’s measurements.</p>
    <p className="winter-caption">The whole glacier, including tributaries · area, not ice volume or today’s snow cover.</p>
    <a className="winter-source" href={glacier.url} target="_blank" rel="noreferrer">{glacier.title}<ArrowUpRight size={14}/></a>
   </div>
   <div className="winter-record">
    <span className="winter-kicker">Swiss glaciers · {report.startYear}–{report.endYear}</span>
    <div className="winter-stat"><strong>−{report.lossPercent}%</strong><span>total glacier<br/>ice volume</span></div>
    <div className="winter-volume" role="img" aria-label={`Swiss glacier ice volume relative to 2015: 2015, 100 percent; 2025, ${100 - report.lossPercent} percent. A ${report.lossPercent} percent reduction, according to GLAMOS.`}>
     <div><span>{report.startYear}</span><div><i style={{width: '100%'}}/></div><b>100%</b></div>
     <div><span>{report.endYear}</span><div><i style={{width: `${100 - report.lossPercent}%`}}/></div><b>{100 - report.lossPercent}%</b></div>
    </div>
    <p className="winter-caption">Share of {report.startYear} ice volume · national estimate</p>
    <p>Measured and estimated across Switzerland. This does not measure snow on Zermatt’s pistes or today’s conditions.</p>
    <a className="winter-source" href={report.url} target="_blank" rel="noreferrer">{report.title}<ArrowUpRight size={14}/></a>
    <small>Published {report.published}</small>
   </div>
   <div className="winter-action">
    <span className="winter-kicker">Care for the mountains</span>
    <h3>Keep winter in the picture.</h3>
    <p><a href={pow.workUrl} target="_blank" rel="noreferrer">Protect Our Winters Switzerland<ArrowUpRight size={13}/></a> brings the outdoor community together for climate action. Its guidance connects everyday choices with a collective voice.</p>
    <ul><li><TrainFront size={16}/><span>Use public transport or share the journey.</span></li><li><Wrench size={16}/><span>Care for gear so it lasts longer.</span></li><li><Users size={16}/><span>Learn, share what matters, and get involved.</span></li></ul>
    <a className="winter-cta" href={pow.actionUrl} target="_blank" rel="noreferrer">Explore POW’s actions<ArrowUpRight size={16}/></a>
    <small>Independent educational context · no POW affiliation</small>
   </div>
  </div>}
 </section>;
}
