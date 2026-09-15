/* Current siriai.co.kr HERO_FIELD + its grain equation. Standalone adapter. */
window.SiriaiBackground=function(canvas){
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});
 if(!gl)throw Error('WebGL을 지원하는 브라우저가 필요합니다.');
 const vs='attribute vec2 aPos;varying vec2 vUv;void main(){vUv=aPos*.5+.5;gl_Position=vec4(aPos,0.,1.);}';
 const fs='precision highp float;varying vec2 vUv;uniform vec2 uRes;uniform float uTime;'+window.__heroFieldGLSL+`void main(){vec2 fc=vUv*uRes;vec3 col=background(vUv);float gA=hash(fc*.58);float gB=hash(fc*.31+19.);float grain=(gA*.55+gB*.45)-.5;float glum=max(col.r,max(col.g,col.b));col+=grain*(.12+.27*smoothstep(0.,.55,glum));gl_FragColor=vec4(col,1.);}`;
 function compile(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
 const p=gl.createProgram();gl.attachShader(p,compile(gl.VERTEX_SHADER,vs));gl.attachShader(p,compile(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));gl.useProgram(p);
 const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);const a=gl.getAttribLocation(p,'aPos');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);const resolution=gl.getUniformLocation(p,'uRes'),time=gl.getUniformLocation(p,'uTime');
 let raf=0,seconds=8,last=0,paused=false;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function draw(t=seconds,width,height){if(width&&height){canvas.width=width;canvas.height=height}else{const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.5);const w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h}gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(resolution,canvas.width,canvas.height);gl.uniform1f(time,t);gl.drawArrays(gl.TRIANGLES,0,3)}
 function tick(now){if(!paused&&!document.hidden&&!reduced.matches){if(last)seconds+=Math.min(.05,(now-last)/1000);draw()}last=now;raf=requestAnimationFrame(tick)}
 const resize=()=>draw();addEventListener('resize',resize);draw();raf=requestAnimationFrame(tick);
 return{draw,pause(){paused=true},play(){paused=false},destroy(){cancelAnimationFrame(raf);removeEventListener('resize',resize);gl.getExtension('WEBGL_lose_context')?.loseContext()}};
};
