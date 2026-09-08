'use client';
import {useEffect, useRef, useState} from 'react';
import {ArrowUpRight, ArrowUp, Check, ChevronRight, Crosshair, LoaderCircle, MapPin, Sparkles, Sun, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import WinterContext from './winter-context';
import {captureLabel, validateAnswer, validatePlan, type EvidenceFrame, type ExploreAnswer, type ExploreEvent, type ExplorePlan, type Region} from '@/lib/exploration';

type Props = {open: boolean; onOpen: (open: boolean) => void; currentPlace: string; day: string; minutes: number; onPlan: (plan: ExplorePlan) => void; onFocus: (place: string) => void; onSunlight: (minutes: number) => void};
const experiences = [
 {title:'See what changed', detail:'Rothorn · compare two dated camera views', prompt:'What changed at Rothorn?', icon:Crosshair},
 {title:'Follow the light', detail:'Sunnegga · explore sunlight and visual evidence', prompt:'Compare the light at Sunnegga', icon:Sun},
 {title:'Look around Blauherd', detail:'Let Astra guide you through the camera evidence', prompt:'Explore Blauherd', icon:MapPin},
];
const title = (id: string) => id.charAt(0).toUpperCase() + id.slice(1);

function FrameImage({frame, region, detail = false}: {frame: EvidenceFrame; region?: Region; detail?: boolean}) {
 const ratio = frame.height / frame.width;
 let x = 0, y = 0, w = 1, h = 1;
 if (detail && region) {
  const pad = .035;
  x = Math.max(0, region.x - pad); y = Math.max(0, region.y - pad);
  w = Math.min(1 - x, region.width + pad * 2); h = Math.min(1 - y, region.height + pad * 2);
 }
 return <svg className={detail ? 'evidence-crop' : 'evidence-panorama'} preserveAspectRatio={detail ? 'xMidYMid slice' : 'xMidYMid meet'} viewBox={`${x * 1000} ${y * 1000 * ratio} ${w * 1000} ${h * 1000 * ratio}`} role="img" aria-label={`${detail ? 'Highlighted detail from' : 'Full view,'} image ${frame.id}`}>
  <image href={frame.image} width="1000" height={1000 * ratio}/>
  {!detail && region && <rect x={region.x * 1000} y={region.y * 1000 * ratio} width={region.width * 1000} height={region.height * 1000 * ratio} fill="#d0ef8233" stroke="#d0ef82" strokeWidth="2" vectorEffect="non-scaling-stroke"/>}
 </svg>;
}

export default function AstraExplorer({open, onOpen, currentPlace, day, minutes, onPlan, onFocus, onSunlight}: Props) {
 const [choosing, setChoosing] = useState(true);
 const [customQuestion, setCustomQuestion] = useState(false);
 const [prompt, setPrompt] = useState('');
 const [question, setQuestion] = useState('');
 const [plan, setPlan] = useState<ExplorePlan | null>(null);
 const [frames, setFrames] = useState<EvidenceFrame[]>([]);
 const [answer, setAnswer] = useState<ExploreAnswer | null>(null);
 const [selected, setSelected] = useState(0);
 const [inspection, setInspection] = useState(0);
 const [stage, setStage] = useState<'idle' | 'planning' | 'images' | 'reading' | 'done'>('idle');
 const [error, setError] = useState('');
 const [generatedAt, setGeneratedAt] = useState('');
 const [simulated, setSimulated] = useState(false);
 const [recorded, setRecorded] = useState(false);
 const [climateOpen, setClimateOpen] = useState(false);
 const job = useRef(0);
 const controller = useRef<AbortController | null>(null);
 const scroll = useRef<HTMLDivElement>(null);
 const evidenceDetail = useRef<HTMLDivElement>(null);
 useEffect(() => {if (inspection) evidenceDetail.current?.scrollIntoView({block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});}, [inspection]);
 const busy = stage === 'planning' || stage === 'images' || stage === 'reading';
 useEffect(() => () => {controller.current?.abort();}, []);
 useEffect(() => {if (!open && controller.current) {controller.current.abort();controller.current = null;job.current++;setStage(s => s === 'done' ? s : 'idle');}}, [open]);
 function stop() {job.current++;controller.current?.abort();controller.current = null;setStage('idle');setError('Exploration stopped. Ask again whenever you’re ready.');}
 async function ask(text: string) {
  const value = text.trim(); if (!value) return;
  controller.current?.abort(); const abort = new AbortController();controller.current = abort;const id = ++job.current;
  setChoosing(false);setCustomQuestion(false);setQuestion(value);setPrompt(value);setPlan(null);setFrames([]);setAnswer(null);setSelected(0);setError('');setGeneratedAt('');setSimulated(false);setRecorded(false);setClimateOpen(false);setStage('planning');onOpen(true);
  requestAnimationFrame(() => {if (scroll.current) scroll.current.scrollTop = 0;});
  try {
   const r = await fetch('/api/explore', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({prompt: value, currentPlace, simulationDate: day}), signal: abort.signal});
   if (!r.ok) {const data = await r.json() as {error?:string};throw new Error(data.error || 'Astra is unavailable. Please try again.');}
   if (!r.body) throw new Error('The exploration connection could not open.');
   const reader = r.body.getReader();const decoder = new TextDecoder();let buffer = '';let finished = false;
   const receive = (line: string) => {
    if (id !== job.current || !line.trim()) return;
    const event = JSON.parse(line) as ExploreEvent;
    if (event.type === 'error') throw new Error(event.error);
    if (event.type === 'plan') {setPlan(event.plan);setStage('images');onPlan(event.plan);setSimulated(event.plan.sunlightMinutes !== null);setClimateOpen(event.plan.showClimateContext === true);}
    if (event.type === 'frames') {setFrames(event.frames);setStage('reading');}
    if (event.type === 'answer') {setAnswer(event.answer);setGeneratedAt(event.generatedAt);setStage('done');finished = true;}
   };
   while (true) {const {value: chunk, done} = await reader.read();if (done) break;buffer += decoder.decode(chunk, {stream: true});let newline;while ((newline = buffer.indexOf('\n')) >= 0) {const line = buffer.slice(0, newline);buffer = buffer.slice(newline + 1);receive(line);}}
   buffer += decoder.decode();if (buffer.trim()) receive(buffer);
   if (!finished && id === job.current) throw new Error('The connection ended before Astra finished. Please try again.');
  } catch (e) {if (id === job.current && !abort.signal.aborted) {setError(e instanceof Error ? e.message : 'The exploration could not finish.');setStage('idle');abort.abort();}}
  finally {if (id === job.current) controller.current = null;}
 }
 const observation = answer?.observations[selected];
 async function replay() {
  controller.current?.abort();job.current++;
  try {
   const r = await fetch('/demo/rothorn-evidence.json');if (!r.ok) throw new Error();
   const saved = await r.json() as {question:string;plan:ExplorePlan;frames:EvidenceFrame[];answer:ExploreAnswer;generatedAt:string};
   const p = validatePlan(saved.plan);const a = validateAnswer(saved.answer);
   setChoosing(false);setCustomQuestion(false);setQuestion(saved.question);setPrompt(saved.question);setPlan(p);setFrames(saved.frames);setAnswer(a);setGeneratedAt(saved.generatedAt);setRecorded(true);setSelected(0);setError('');setStage('done');setSimulated(false);setClimateOpen(p.showClimateContext === true);onOpen(true);onPlan(p);
   requestAnimationFrame(() => {if (scroll.current) scroll.current.scrollTop = 0;});
  } catch {setError('The recorded example could not load. Please retry the live exploration.');}
 }
 function inspect(index: number) {setSelected(index);setInspection(n => n + 1);}
 const clock = `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;
 if (!open) return <div className="astra-explorer collapsed ambient-explorer"><button className="astra-ambient-button" onClick={() => onOpen(true)} aria-label="Explore with Astra" aria-haspopup="dialog"><span className="astra-ambient-icon"><Sparkles size={20}/></span><span>Explore with Astra</span><ChevronRight size={15}/></button></div>;
 return <section className="astra-explorer expanded" role="dialog" aria-modal="false" aria-label="Explore with Astra">
  <div className="astra-heading"><div><Sparkles size={18}/><span>{choosing ? 'Explore with Astra' : recorded ? 'Recorded Astra exploration' : 'Exploring with Astra'}</span></div><Button variant="ghost" size="icon" aria-label="Close Astra exploration" onClick={() => onOpen(false)}><X/></Button></div>
  {!choosing && <div className="astra-experience-nav"><button disabled={busy} onClick={() => {setChoosing(true);setCustomQuestion(false);}}>All experiences<ChevronRight size={13}/></button><span>{question}</span></div>}
  {customQuestion && <form className="astra-question" onSubmit={e => {e.preventDefault();void ask(prompt);}}>
   <Input aria-label="Ask Astra about the mountain" placeholder="What would you like to explore?" maxLength={600} value={prompt} onChange={e => setPrompt(e.target.value)} disabled={busy} autoFocus/>
   <Button type="submit" size="icon" aria-label="Explore this question" disabled={!prompt.trim() || busy}><ArrowUp/></Button>
  </form>}
  <div className="astra-scroll" ref={scroll}>
   {choosing ? <div className="astra-experience-menu">
    <span className="experience-eyebrow">A closer look at the Alps</span><h2>Follow your curiosity.</h2><p>Pick a place. Astra explores its dated images and shows you the evidence.</p>
    {error && <p className="error" role="alert">{error}</p>}
    <div className="astra-experience-cards">{experiences.map(({title,detail,prompt,icon:Icon}) => <button key={title} onClick={() => void ask(prompt)}><span className="experience-icon"><Icon size={20}/></span><span><strong>{title}</strong><small>{detail}</small></span><ChevronRight size={16}/></button>)}</div>
    <button className="experience-replay" onClick={() => void replay()}><Sparkles size={15}/><span>Watch a recorded exploration<small>8 September · previously completed Astra run</small></span><ArrowUpRight size={14}/></button>
    <button className="experience-custom" aria-expanded={customQuestion} onClick={() => setCustomQuestion(v => !v)}>{customQuestion ? 'Hide question field' : 'Ask your own question'}</button>
    {answer && <button className="experience-custom" onClick={() => {setChoosing(false);setCustomQuestion(false);}}>Return to your last exploration<ChevronRight size={13}/></button>}
   </div> : <>
   {recorded && <p className="astra-recorded">Recorded example · 8 September 2026<br/>A previously completed Astra run, replayed without a new model request.</p>}
   <div className="astra-journey" aria-label="Exploration progress">
    {[{label: 'Ask', complete: !!plan, active: stage === 'planning'}, {label: 'Explore', complete: frames.length > 0, active: stage === 'images'}, {label: 'Evidence', complete: !!answer, active: stage === 'reading'}].map((s, i) => <div key={s.label} className={s.complete ? 'complete' : s.active ? 'active' : ''}><span>{s.complete ? <Check size={12}/> : s.active ? <LoaderCircle size={12} className="spinner"/> : i + 1}</span>{s.label}</div>)}
   </div>
   {busy && <Button className="experience-stop" variant="ghost" onClick={stop}><X size={14}/>Stop exploration</Button>}
   {busy && <p className="astra-status" role="status">{stage === 'planning' ? 'Astra is choosing a mountain view…' : stage === 'images' ? `Exploring ${title(plan?.place || currentPlace)} · fetching dated images…` : 'Astra is reading the images and locating its evidence…'}</p>}
   {plan && <div className="astra-location"><button onClick={() => onFocus(plan.place)}><MapPin size={15}/>{title(plan.place)}<Crosshair size={14}/></button><p>{plan.reason}</p>{simulated && <small className="astra-simulation">Sunlight simulation · {day} · {clock} Zurich</small>}</div>}
   {error && <div role="alert" className="astra-error"><p>{error}</p><Button variant="secondary" onClick={() => void ask(question)}>Try this question again</Button><Button variant="ghost" onClick={() => void replay()}>Open recorded example · 8 Sept</Button></div>}
   {frames.length > 0 && <div className="astra-evidence">
    <div className="astra-section-label">{answer ? 'Follow the evidence' : 'The views Astra is reading'}<span>Provider dates · Zurich</span></div>
    <div className={`evidence-frame-grid ${frames[0].width / frames[0].height < 3 ? 'photo-pair' : ''}`}>{frames.map(frame => <figure key={frame.id} className="evidence-frame"><figcaption><span><b>{frame.id}</b>{captureLabel(frame.capturedAt)}</span><a href={frame.source} target="_blank" rel="noreferrer" aria-label={`Open original image ${frame.id}`}>Original<ArrowUpRight size={12}/></a></figcaption><FrameImage frame={frame} region={observation?.regions.find(r => r.image === frame.id)}/></figure>)}</div>
    <p className="evidence-source">© Zermatt Bergbahnen / Roundshot · latest available daytime pair{frames[0].capturedAt.slice(0, 10) ? ` · ${new Date(frames[0].capturedAt).getUTCFullYear()}` : ''}</p>
   </div>}
   {answer && <div className="astra-answer" aria-live="polite"><span className="astra-section-label">Astra’s read of the mountain</span><h2>{answer.headline}</h2><p>{answer.summary}</p></div>}
   {(answer || plan?.showClimateContext || (error && plan)) && <WinterContext open={climateOpen} onOpen={setClimateOpen}/>}
   {answer && <>
    <div className="astra-observations" aria-label="Visual observations">{answer.observations.map((o, i) => <button key={i} className={i === selected ? 'selected' : ''} aria-pressed={i === selected} onClick={() => inspect(i)}><span className="observation-number">{i + 1}</span><span><strong>{o.title}</strong>{i === selected && <span className="observation-detail">{o.detail}</span>}</span><Crosshair size={15}/></button>)}</div>
    {observation && <div className="evidence-detail" ref={evidenceDetail}><div className="astra-section-label">Look closer · {observation.title}<span>Approximate regions selected by Astra</span></div><div className="evidence-crops">{observation.regions.map(region => {const frame = frames.find(f => f.id === region.image);return frame ? <figure key={region.image}><b>{region.image}</b><FrameImage frame={frame} region={region} detail/></figure> : null;})}</div></div>}
    <div className="astra-unknowns"><strong>Beyond these views</strong>{answer.unknowns.map((u, i) => <p key={i}>{u}</p>)}</div>
    <div className="astra-next"><Button variant="secondary" onClick={() => {onSunlight(990);setSimulated(true);}}><Sun size={16}/>Explore 16:30 sunlight</Button><p>{simulated ? `Modeled sunlight · ${day} · ${clock} Zurich` : 'Separate clear-sky simulation on the 3D terrain.'}</p>{simulated && <small>Camera images retain their original light and capture dates.</small>}</div>
    <p className="astra-provenance">{recorded ? 'Recorded result from' : 'Generated with'} gpt-6-astra · {captureLabel(generatedAt)} Zurich<br/>Image regions are approximate, not positions on the terrain.</p>
   </>}
   </>}
  </div>
 </section>;
}
