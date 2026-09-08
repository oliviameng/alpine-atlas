import {loadCameraMetadata,loadCameraImage} from '@/lib/camera-source';
import {cameraIds,type CameraId} from '@/lib/exploration';
export async function GET(request:Request){
 const query=new URL(request.url).searchParams;const id=query.get('place')||'';
 if(!cameraIds.includes(id as CameraId))return Response.json({error:'Unknown camera.'},{status:404});
 try{
  const signal=AbortSignal.any([request.signal,AbortSignal.timeout(55_000)]);
  const pair=await loadCameraMetadata(id as CameraId,signal);
  const {bytes,source,capturedAt}=await loadCameraImage(pair[query.get('frame')==='b'?1:0],signal);
  return new Response(bytes,{headers:{'Content-Type':'image/jpeg','Cache-Control':'no-store','X-Capture-Time':capturedAt,'X-Image-Source':source,'X-Camera-Name':id}});
 }catch{return Response.json({error:'Recent camera images are unavailable. Open the official viewer or the recorded example.'},{status:502})}
}
