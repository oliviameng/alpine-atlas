import * as THREE from 'three';

export type TerrainManifest={
  grid:{nx:number;nz:number;spacingX:number;spacingZ:number};
  bbox:{min:number[]};
  origin:{longitude:number;latitude:number};
  coordinateSystem:{metersPerLongitudeDegree:number;metersPerLatitudeDegree:number};
};
export type SurfaceManifest={zoom:number;tileBounds:{minX:number;maxX:number;minY:number;maxY:number}};

// Keep the full measured grid, but transfer only its heights (4 MB rather than 48 MB).
export function buildTerrainGeometry(heights:Float32Array,terrain:TerrainManifest,surface:SurfaceManifest){
  const {nx,nz,spacingX,spacingZ}=terrain.grid;
  if(heights.length!==nx*nz)throw new Error('Incomplete mountain height data');
  const positions=new Float32Array(nx*nz*3),uv=new Float32Array(nx*nz*2);
  const indices=new Uint32Array((nx-1)*(nz-1)*6);
  const {minX,maxX,minY,maxY}=surface.tileBounds,scale=2**surface.zoom;
  let cursor=0;
  for(let row=0;row<nz;row++){
    const z=terrain.bbox.min[2]+row*spacingZ;
    const lat=terrain.origin.latitude-z/terrain.coordinateSystem.metersPerLatitudeDegree;
    const ty=(1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2*scale;
    const v=1-(ty-minY)/(maxY-minY+1);
    for(let col=0;col<nx;col++){
      const i=row*nx+col,x=terrain.bbox.min[0]+col*spacingX;
      if(!Number.isFinite(heights[i]))throw new Error('Invalid mountain elevation');
      positions.set([x,heights[i],z],i*3);
      const lng=terrain.origin.longitude+x/terrain.coordinateSystem.metersPerLongitudeDegree;
      uv[i*2]=((lng+180)/360*scale-minX)/(maxX-minX+1);uv[i*2+1]=v;
      if(row<nz-1&&col<nx-1){const b=i+1,c=i+nx,d=c+1;indices.set([i,c,b,b,c,d],cursor);cursor+=6;}
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  geometry.setIndex(new THREE.BufferAttribute(indices,1));
  geometry.computeVertexNormals();
  // Smooth lighting across source-TIN transitions without altering the measured surface.
  const normal=geometry.getAttribute('normal').array as Float32Array;
  const scratch=new Float32Array(normal.length);
  for(let pass=0;pass<2;pass++){
    for(let row=0;row<nz;row++)for(let col=0;col<nx;col++){
      const i=(row*nx+col)*3,left=(row*nx+Math.max(0,col-1))*3,right=(row*nx+Math.min(nx-1,col+1))*3;
      for(let axis=0;axis<3;axis++)scratch[i+axis]=(normal[left+axis]+normal[i+axis]*2+normal[right+axis])*.25;
    }
    for(let row=0;row<nz;row++)for(let col=0;col<nx;col++){
      const i=(row*nx+col)*3,above=(Math.max(0,row-1)*nx+col)*3,below=(Math.min(nz-1,row+1)*nx+col)*3;
      for(let axis=0;axis<3;axis++)normal[i+axis]=(scratch[above+axis]+scratch[i+axis]*2+scratch[below+axis])*.25;
    }
  }
  geometry.normalizeNormals();geometry.computeBoundingSphere();
  return geometry;
}
