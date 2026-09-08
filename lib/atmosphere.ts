export type AtmosphereSettings={windKmh:number;windFrom:number;snow:number;traces:boolean;paused:boolean};
export const defaultAtmosphere:AtmosphereSettings={windKmh:20,windFrom:315,snow:0,traces:true,paused:false};
/** Wind bearing is the direction it comes FROM. World axes: X east, Z south. */
export function windVelocity(kmh:number,fromDegrees:number){const r=fromDegrees*Math.PI/180,speed=kmh/3.6;return {x:-Math.sin(r)*speed,z:Math.cos(r)*speed}}
export const compass=(degrees:number)=>['N','NE','E','SE','S','SW','W','NW'][Math.round(((degrees%360)+360)%360/45)%8];
export const snowLabel=(amount:number)=>amount===0?'Off':amount<30?'Light':amount<65?'Moderate':'Heavy';
