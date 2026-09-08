import {cameraCaptureMillis, chooseFrames, type CameraFrame} from './cameras';
import {cameraIds, type CameraId, type EvidenceFrame} from './exploration';

function signalFor(signal?: AbortSignal) { return signal ? AbortSignal.any([signal, AbortSignal.timeout(15_000)]) : AbortSignal.timeout(15_000); }
export async function loadCameraMetadata(id: CameraId, signal?: AbortSignal): Promise<[CameraFrame, CameraFrame]> {
 if (!cameraIds.includes(id)) throw new Error('Unknown camera.');
 async function metadata(query=''){
 const response = await fetch(`https://zbag.roundshot.com/${id}/structure.json${query}`, {signal: signalFor(signal), redirect: 'manual'});
 if (!response.ok) throw new Error('The camera provider is unavailable. Try another mountain view.');
 const data = await response.json() as {images?: CameraFrame[]};
 if (!Array.isArray(data.images)) throw new Error('The camera provider returned no dated images.');
 return data.images;
 }
 try{return chooseFrames(await metadata());}catch(error){if(signal?.aborted)throw error;}
 // Official viewer's date selector uses days=0&to=ISO. Around midnight its
 // default response contains only the new day. Retrieve the prior day explicitly.
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).format(Date.now());
 for(const daysAgo of [1,2]){
  const previous=new Date(Date.parse(`${today}T18:00:00Z`)-daysAgo*86400000).toISOString();
  try{return chooseFrames(await metadata(`?days=0&to=${encodeURIComponent(previous)}`));}catch(error){if(signal?.aborted)throw error;}
 }
 throw new Error('Recent daytime camera pairs are unavailable. Open the recorded example or try another camera.');
}
export async function loadCameraImage(frame: CameraFrame, signal?: AbortSignal) {
 const source = frame.structure?.quarter?.url_full;
 if (!source) throw new Error('This camera frame has no image.');
 const parsed = new URL(source);
 if (parsed.protocol !== 'https:' || parsed.hostname !== 'storage.roundshot.com') throw new Error('The camera image source is not supported.');
 const response = await fetch(source, {redirect: 'manual', signal: signalFor(signal)});
 if (!response.ok || !response.headers.get('content-type')?.startsWith('image/jpeg')) throw new Error('A camera image is unavailable. Try another view.');
 if (Number(response.headers.get('content-length') || 0) > 8_000_000) throw new Error('This camera image is too large.');
 const bytes = await response.arrayBuffer();
 if (bytes.byteLength > 8_000_000) throw new Error('This camera image is too large.');
 return {bytes, source, capturedAt: new Date(cameraCaptureMillis(frame.datetime)).toISOString()};
}
export async function loadEvidenceFrames(id: CameraId, signal?: AbortSignal): Promise<EvidenceFrame[]> {
 const pair = await loadCameraMetadata(id, signal);
 return Promise.all(pair.map(async (frame, index) => {
  const {bytes, source, capturedAt} = await loadCameraImage(frame, signal);
  // Quarter-resolution panoramas remain small enough for the Worker and image input.
  const image = `data:image/jpeg;base64,${Buffer.from(bytes).toString('base64')}`;
  return {id: index === 0 ? 'A' : 'B', image, source, capturedAt, width: frame.structure?.quarter?.w || 3358, height: frame.structure?.quarter?.h || 512};
 }));
}
