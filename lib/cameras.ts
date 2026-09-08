export type CameraFrame={datetime:number;status:string;structure?:{quarter?:{url_full?:string;w?:number;h?:number}}};
const cameraOffsetFormatter=new Intl.DateTimeFormat('en',{timeZone:'Europe/Zurich',timeZoneName:'shortOffset'});
// Roundshot stores camera wall-clock fields in a Unix-like number. Its viewer
// formats those fields with +0000; the Zermatt cameras use Europe/Zurich.
// Convert that wall clock to an actual instant before formatting or filtering.
export function cameraCaptureMillis(datetime:number){
 const nominal=datetime*1000;
 const zone=cameraOffsetFormatter.formatToParts(nominal).find(p=>p.type==='timeZoneName')?.value||'';
 const match=/GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(zone);
 if(!match)throw new Error('Camera timezone is unavailable.');
 const offset=(Number(match[2])*60+Number(match[3]||0))*60000*(match[1]==='+'?1:-1);
 return nominal-offset;
}
export function chooseFrames(images:CameraFrame[],now=Date.now()):[CameraFrame,CameraFrame]{
 const valid=images.filter(f=>f.status==='finished'&&Number.isFinite(f.datetime)&&cameraCaptureMillis(f.datetime)<=now&&f.structure?.quarter?.url_full?.startsWith('https://storage.roundshot.com/')).sort((a,b)=>a.datetime-b.datetime);
 if(valid.length<2)throw new Error('Not enough dated camera frames.');
 const date=(f:CameraFrame)=>new Intl.DateTimeFormat('en-CA',{timeZone:'UTC',year:'numeric',month:'2-digit',day:'2-digit'}).format(f.datetime*1000);
 const days=[...new Set(valid.map(date))].reverse();
 const hour=new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',hour:'2-digit',hourCycle:'h23'});
 // Around midnight, today's feed may contain only dark images. Keep the newest
 // available usable daytime pair and retain its actual date in the response.
 for(const d of days){const daylight=valid.filter(f=>{const h=Number(hour.format(f.datetime*1000));return date(f)===d&&h>=9&&h<=17});
  if(daylight.length<2)continue;
  const a=daylight[0],b=daylight[daylight.length-1];if(b.datetime-a.datetime>=1800)return [a,b];
 }
 throw new Error('Two separated daytime frames are unavailable. Try another camera.');
}
