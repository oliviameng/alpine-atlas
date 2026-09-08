import {places} from '@/lib/places';
import {parseWeather} from '@/lib/weather';
export async function GET(request:Request){
 const id=new URL(request.url).searchParams.get('place');const place=places.find(p=>p.id===id);
 if(!place)return Response.json({error:'Unknown location'},{status:400});
 try{
  const params=new URLSearchParams({latitude:String(place.lat),longitude:String(place.lng),current:'temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,snowfall',wind_speed_unit:'kmh',precipitation_unit:'mm',temperature_unit:'celsius',timezone:'UTC',timeformat:'unixtime',...(place.alt?{elevation:String(place.alt)}:{})});
  const response=await fetch(`https://api.open-meteo.com/v1/forecast?${params}`,{signal:AbortSignal.timeout(12000),cache:'no-store'});
  if(!response.ok)throw new Error('Weather provider unavailable');
  return Response.json(parseWeather(await response.json(),place),{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Current weather data is unavailable. No simulated values have been substituted.'},{status:502,headers:{'Cache-Control':'no-store'}})}
}
