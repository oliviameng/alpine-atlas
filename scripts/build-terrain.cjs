const fs=require('fs'),path=require('path'),zlib=require('zlib');
const decode=require('/tmp/zermatt-mountain-demo/node_modules/@here/quantized-mesh-decoder').default;
const root='/tmp/alpine-terrain-asset',origin={longitude:7.73,latitude:46.0}, R=6378137,rad=Math.PI/180;
const scaleX=R*rad*Math.cos(origin.latitude*rad),scaleZ=R*rad;
const p=[],idx=[],tiles=[];let minHeight=Infinity,maxHeight=-Infinity,flipped=0;
const geographic={west:Infinity,south:Infinity,east:-Infinity,north:-Infinity};
for(let x=4269;x<=4274;x++)for(let y=3093;y<=3096;y++){
 const z=12,size=180/2**z,west=-180+x*size,south=-90+y*size;
 let b=fs.readFileSync(path.join(root,'tiles',`${z}-${x}-${y}.terrain`));if(b[0]===31&&b[1]===139)b=zlib.gunzipSync(b);
 const d=decode(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),{maxDecodingStep:2}),n=d.vertexData.length/3,base=p.length/3;
 geographic.west=Math.min(geographic.west,west);geographic.south=Math.min(geographic.south,south);geographic.east=Math.max(geographic.east,west+size);geographic.north=Math.max(geographic.north,south+size);
 for(let i=0;i<n;i++){
 const lng=west+size*d.vertexData[i]/32767,lat=south+size*d.vertexData[i+n]/32767,h=d.header.minHeight+(d.header.maxHeight-d.header.minHeight)*d.vertexData[i+2*n]/32767;
 p.push((lng-origin.longitude)*scaleX,h,(origin.latitude-lat)*scaleZ);minHeight=Math.min(minHeight,h);maxHeight=Math.max(maxHeight,h);
 }
 for(let i=0;i<d.triangleIndices.length;i+=3){let a=base+d.triangleIndices[i],b=base+d.triangleIndices[i+1],c=base+d.triangleIndices[i+2];
 const ny=(p[b*3+2]-p[a*3+2])*(p[c*3]-p[a*3])-(p[b*3]-p[a*3])*(p[c*3+2]-p[a*3+2]);
 if(ny<0){[b,c]=[c,b];flipped++;}idx.push(a,b,c);
 }
 tiles.push({z,x,y,vertexCount:n,triangleCount:d.triangleIndices.length/3,minHeight:d.header.minHeight,maxHeight:d.header.maxHeight});
}
const positions=new Float32Array(p),indices=new Uint32Array(idx);
fs.writeFileSync(path.join(root,'positions.bin'),Buffer.from(positions.buffer));fs.writeFileSync(path.join(root,'indices.bin'),Buffer.from(indices.buffer));
function elevationAt(lng,lat){const x=(lng-origin.longitude)*scaleX,z=(origin.latitude-lat)*scaleZ;
 for(let i=0;i<indices.length;i+=3){const ai=indices[i]*3,bi=indices[i+1]*3,ci=indices[i+2]*3,ax=p[ai],az=p[ai+2],bx=p[bi],bz=p[bi+2],cx=p[ci],cz=p[ci+2];
 if(x<Math.min(ax,bx,cx)||x>Math.max(ax,bx,cx)||z<Math.min(az,bz,cz)||z>Math.max(az,bz,cz))continue;
 const den=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);if(Math.abs(den)<1e-6)continue;
 const wa=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/den,wb=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/den,wc=1-wa-wb;
 if(wa>=-1e-6&&wb>=-1e-6&&wc>=-1e-6)return{x,y:wa*p[ai+1]+wb*p[bi+1]+wc*p[ci+1],z,method:'triangle barycentric interpolation'};
 }return null;}
const landmarks=[{name:'Rothorn webcam',longitude:7.797409,latitude:46.021509,cameraAltitude:3105},{name:'Sunnegga webcam',longitude:7.770068,latitude:46.017246,cameraAltitude:2290},{name:'Blauherd webcam',longitude:7.786053,latitude:46.016699,cameraAltitude:2582},{name:'Matterhorn approximate summit',longitude:7.6586,latitude:45.9763},{name:'Zermatt approximate center',longitude:7.7491,latitude:46.0207}].map(l=>({...l,meshPosition:elevationAt(l.longitude,l.latitude)}));
const manifest={format:'Float32 XYZ positions and Uint32 triangle indices, little endian',origin,coordinateSystem:{x:'east meters',y:'swisstopo source elevation meters (unmodified)',z:'south meters',projection:'local equirectangular; x=(lng-origin.lng)*R*pi/180*cos(origin.lat), z=(origin.lat-lat)*R*pi/180',earthRadius:R,metersPerLongitudeDegree:scaleX,metersPerLatitudeDegree:scaleZ},files:{positions:'positions.bin',indices:'indices.bin'},vertexCount:positions.length/3,indexCount:indices.length,triangleCount:indices.length/3,minHeight,maxHeight,bbox:{min:[(geographic.west-origin.longitude)*scaleX,minHeight,(origin.latitude-geographic.north)*scaleZ],max:[(geographic.east-origin.longitude)*scaleX,maxHeight,(origin.latitude-geographic.south)*scaleZ]},geographicBounds:geographic,requestedBounds:{west:7.62,south:45.93,east:7.84,north:46.07},source:{attribution:'Terrain © swisstopo',metadata:'https://3d.geo.admin.ch/ch.swisstopo.terrain.3d/v1/layer.json',documentation:'https://docs.geo.admin.ch/visualize-data/terrain-service.html',tileTemplate:'https://3d.geo.admin.ch/ch.swisstopo.terrain.3d/v1/20250101/{z}/{x}/{y}.terrain?v=1.43646.0',tileGeneration:'20250101',format:'quantized-mesh-1.0',scheme:'global-geodetic TMS (EPSG:4326)',zoom:12},processing:'Original tile vertices and triangle topology concatenated. Quantized coordinates decoded to geographic coordinates and projected to local meters. No invented terrain, resampling, height exaggeration, or mesh simplification. Complete boundary tiles retained.',flippedTrianglesForYUp:flipped,tiles,landmarks};
fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2));
if(positions.some(v=>!Number.isFinite(v)))throw Error('Nonfinite position');if(indices.some(v=>v>=positions.length/3))throw Error('Index out of range');
if(minHeight<500||maxHeight<4000||maxHeight>5000)throw Error('Implausible terrain elevations');
console.log(JSON.stringify({vertexCount:manifest.vertexCount,triangleCount:manifest.triangleCount,minHeight,maxHeight,bbox:manifest.bbox,flipped,landmarks},null,2));
