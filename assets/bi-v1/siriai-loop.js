/* Load siriai-loop-renderer.js before this file. */
class SiriaiLoop extends HTMLElement {
  static get observedAttributes(){return ['gap','speed','color','paused'];}
  constructor(){
    super();this.attachShadow({mode:'open'});
    this.shadowRoot.innerHTML='<style>:host{display:block;width:100%;min-width:0;min-height:0;aspect-ratio:56/41}canvas{display:block;width:100%;height:100%}</style><canvas role="img" aria-label="SIRIAI 순환 로고"></canvas>';
    this.canvas=this.shadowRoot.querySelector('canvas');this.ctx=this.canvas.getContext('2d');
    this.phase=0;this.visible=true;this.motion=matchMedia('(prefers-reduced-motion: reduce)');
    this.onMotion=()=>this.schedule();this.onVisibility=()=>this.schedule();
    this.image=new Image();this.image.onload=()=>{this.tint();this.resize();this.schedule()};
    this.image.src=window.SiriaiLoopRenderer.logoData;
  }
  connectedCallback(){
    this.sizeObserver=new ResizeObserver(()=>this.resize());this.sizeObserver.observe(this);
    this.visibilityObserver=new IntersectionObserver(([entry])=>{this.visible=entry.isIntersecting;this.schedule()});this.visibilityObserver.observe(this);
    this.motion.addEventListener('change',this.onMotion);document.addEventListener('visibilitychange',this.onVisibility);this.schedule();
  }
  disconnectedCallback(){cancelAnimationFrame(this.raf);this.raf=0;this.sizeObserver?.disconnect();this.visibilityObserver?.disconnect();this.motion.removeEventListener('change',this.onMotion);document.removeEventListener('visibilitychange',this.onVisibility);}
  attributeChangedCallback(name){if(name==='color')this.tint();this.draw();this.schedule();}
  get gap(){const n=Number(this.getAttribute('gap')??20);return Number.isFinite(n)?Math.max(0,Math.min(130,n)):20}
  get speed(){const n=Number(this.getAttribute('speed')??65);return Number.isFinite(n)?Math.max(0,Math.min(300,n)):65}
  pause(){this.setAttribute('paused','')}
  play(){this.removeAttribute('paused')}
  tint(){if(!this.image?.naturalWidth)return;this.ink=document.createElement('canvas');this.ink.width=this.image.naturalWidth;this.ink.height=this.image.naturalHeight;const c=this.ink.getContext('2d');c.drawImage(this.image,0,0);c.globalCompositeOperation='source-in';c.fillStyle=this.getAttribute('color')||getComputedStyle(this).color;c.fillRect(0,0,this.ink.width,this.ink.height);this.draw();}
  resize(){const rect=this.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.max(1,Math.round(rect.width*dpr));this.canvas.height=Math.max(1,Math.round(rect.height*dpr));this.draw();}
  draw(){if(this.ink)window.SiriaiLoopRenderer.render(this.ctx,this.ink,{width:this.canvas.width,height:this.canvas.height,gap:this.gap,phase:this.phase})}
  schedule(){cancelAnimationFrame(this.raf);this.raf=0;this.last=0;if(!this.isConnected||!this.ink)return;this.draw();if(this.hasAttribute('paused')||this.motion.matches||!this.visible||document.hidden||this.speed===0)return;this.raf=requestAnimationFrame(t=>this.tick(t));}
  tick(t){if(this.last)this.phase=(this.phase+Math.min((t-this.last)/1000,.05)*this.speed/window.SiriaiLoopRenderer.layout(this.gap).pitch)%1;this.last=t;this.draw();this.raf=requestAnimationFrame(t=>this.tick(t));}
}
if(!customElements.get('siriai-loop'))customElements.define('siriai-loop',SiriaiLoop);
