import {getPosition} from 'suncalc';
/** Interpret a selected daylight hour in Switzerland, independent of browser timezone. */
export function swissInstant(day:string,minutes:number){
 const noon=new Date(`${day}T12:00:00Z`);
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Zurich',hour:'2-digit',hourCycle:'h23'}).formatToParts(noon);
 const offset=Number(parts.find(p=>p.type==='hour')!.value)-12;
 return new Date(new Date(`${day}T00:00:00Z`).getTime()+(minutes-offset*60)*60000);
}
export function mountainSun(day:string,minutes:number){return getPosition(swissInstant(day,minutes),46.02,7.78)}
export const clockLabel=(minutes:number)=>`${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
