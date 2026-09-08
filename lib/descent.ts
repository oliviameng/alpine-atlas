export type RoutePoint={x:number;y:number;z:number};
/** Signed angle along travel: positive descends, negative climbs; not maximum terrain slope. */
export function descentAngle(a:RoutePoint,b:RoutePoint){
 const run=Math.hypot(b.x-a.x,b.z-a.z);
 return run<.001?0:Math.atan2(a.y-b.y,run)*180/Math.PI;
}
export const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
export type DescentReadout={slope:number;ahead:number;speed:number;progress:number;remaining:number;offset:number;finished:boolean};
export const initialReadout:DescentReadout={slope:0,ahead:0,speed:0,progress:0,remaining:0,offset:0,finished:false};
