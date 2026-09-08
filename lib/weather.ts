import type {AtmosphereSettings} from './atmosphere';
export type WeatherReading={temperature:number;wind:number;windDirection:number;gusts:number;snowfallCm:number;intervalSeconds:number;time:string;fetchedAt:string;place:{id:string;name:string;latitude:number;longitude:number;elevation?:number};grid:{latitude:number;longitude:number;elevation:number};source:{name:string;url:string;kind:'weather-model'}};
type SelectedPlace={id:string;short:string;lat:number;lng:number;alt?:number};
const record=(value:unknown):Record<string,unknown>=>{if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Missing weather data');return value as Record<string,unknown>};
const number=(value:unknown,min:number,max:number)=>{if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw new Error('Missing or invalid weather value');return value};
export function parseWeather(raw:unknown,place:SelectedPlace,now=Date.now()):WeatherReading{
 const data=record(raw),current=record(data.current),units=record(data.current_units);
 if(units.time!=='unixtime'||units.interval!=='seconds'||units.temperature_2m!=='°C'||units.wind_speed_10m!=='km/h'||units.wind_gusts_10m!=='km/h'||units.wind_direction_10m!=='°'||units.snowfall!=='cm')throw new Error('Unexpected weather units');
 const timestamp=number(current.time,0,now/1000+900);if(now-timestamp*1000>90*60*1000)throw new Error('Weather data is stale');
 return {temperature:number(current.temperature_2m,-100,70),wind:number(current.wind_speed_10m,0,500),windDirection:number(current.wind_direction_10m,0,360),gusts:number(current.wind_gusts_10m,0,500),snowfallCm:number(current.snowfall,0,100),intervalSeconds:number(current.interval,60,3600),time:new Date(timestamp*1000).toISOString(),fetchedAt:new Date(now).toISOString(),place:{id:place.id,name:place.short,latitude:place.lat,longitude:place.lng,...(place.alt?{elevation:place.alt}:{})},grid:{latitude:number(data.latitude,-90,90),longitude:number(data.longitude,-180,180),elevation:number(data.elevation,-500,9000)},source:{name:'Open-Meteo',url:'https://open-meteo.com/en/docs',kind:'weather-model'}};
}
/** Display density, not a forecast of deposited snow; zero/missing cannot create flakes. */
export function snowfallDensity(cm:number,intervalSeconds:number){if(!Number.isFinite(cm)||!Number.isFinite(intervalSeconds)||cm<=0||intervalSeconds<=0)return 0;return Math.min(100,Math.max(4,Math.sqrt(cm*3600/intervalSeconds)*45))}
export function atmosphereFromWeather(reading:WeatherReading|null,display:AtmosphereSettings):AtmosphereSettings{
 return {...display,windKmh:reading?.wind??0,windFrom:reading?.windDirection??0,snow:reading?snowfallDensity(reading.snowfallCm,reading.intervalSeconds):0};
}
export function weatherTime(iso:string){return new Date(iso).toLocaleString('en-GB',{timeZone:'Europe/Zurich',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'})}
