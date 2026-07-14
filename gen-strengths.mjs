/* ─────────────────────────────────────────────────────────────────────────
   gen-strengths.mjs — generate the 6 strengths images via the Gemini API
   ("Nano Banana" = gemini-2.5-flash-image). The API path returns images WITHOUT
   the visible ✦ corner badge (invisible SynthID provenance still applies).

   RUN (set your own key — this script never prints it):
     Windows PowerShell:  $env:GEMINI_API_KEY="AIza..."; node gen-strengths.mjs
     Git Bash / macOS:    GEMINI_API_KEY="AIza..." node gen-strengths.mjs

   Get a key: https://aistudio.google.com/apikey
   Output: assets/strengths/A1.png … S3.png  (1:1, on pure black)
   Options:  node gen-strengths.mjs A1 S3     # only these ids
             node gen-strengths.mjs --n 3     # 3 variants each -> A1_1.png ...
   ───────────────────────────────────────────────────────────────────────── */

import { writeFile, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';

// key from env OR a local git-ignored key file (gemini-key.txt / .gemini-key / .env.local).
// The raw value is used only as an API header; it is never printed.
function loadKey() {
  const env = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (env && env.trim()) return env.trim();
  for (const f of ['gemini-key.txt', '.gemini-key', '.env.local', '.env']) {
    try {
      const raw = readFileSync(f, 'utf8');
      const m = raw.match(/(?:GEMINI_API_KEY|GOOGLE_API_KEY)\s*=\s*(.+)/);
      const val = (m ? m[1] : raw).trim().replace(/^["']|["']$/g, '');
      if (val && val.length > 20 && !/\s/.test(val)) return val;
    } catch { /* file not present — try next */ }
  }
  return null;
}
const KEY = loadKey();
if (!KEY) {
  console.error('✗ No API key found.');
  console.error('  Create a file "gemini-key.txt" in this folder containing ONLY your key, then re-run.');
  console.error('  (Get a key: https://aistudio.google.com/apikey — the file is git-ignored, never committed.)');
  process.exit(1);
}

// models tried in order (first that works wins)
const MODELS = ['gemini-2.5-flash-image', 'gemini-2.5-flash-image-preview', 'gemini-2.0-flash-preview-image-generation'];
const OUT = 'assets/strengths';

const STYLE = ' Pure black background (#000). Isolated sculptural form in glass, frosted matte, and polished chrome. Warm rim lighting: amber #FFC70D / orange #FF6B21 / pink #E62E61. Cinema 4D + Octane render aesthetic, volumetric glow, soft depth-of-field, photorealistic materials, precise specular highlights. No text, no labels, no watermark, no signature. 1:1 square. Generous empty black margin in the bottom-right corner.';

const PROMPTS = [
  { id:'A1', text:'Abstract sculptural study: three translucent fractured glass shards, semi-transparent and angular, emerging from a pure black void. Shards gradually align toward a centered focal point, as if coalescing into singular clarity. Warm amber rim-light (#FFC70D) catches the sharp edges and internal fractures. Negative space within the shards suggests depth. Premium editorial studio lighting mood.' },
  { id:'A2', text:'Abstract sculptural network: a central matte frosted-glass sphere as root, with precision-cut geometric branches (thin angular planes, isometric angles) radiating outward. Small polished chrome nodes at connection points, catching orange rim-light (#FF6B21). Interior pathways suggested by subtle internal geometry. Clean architectural precision meeting organic growth. Premium gallery lighting.' },
  { id:'A3', text:'Abstract sculptural spiral: a smooth satin-matte organic form spiraling upward, suggesting cycles of iteration and refinement. Soft pink rim-light (#E62E61) traces the ascending curve. Implied motion frozen in form; each turn subtly more refined than the last. Volumetric glow hints at forward momentum. Minimalist, contemplative.' },
  { id:'S1', text:'Abstract sculptural pedestal: a solid geometric platform rising from a pure black void, minimal and grounded. Base is matte frosted glass (diffuse, inviting), stem is precise polished chrome catching warm amber-orange light (#FFC70D, #FF6B21). Soft volumetric glow emanates from within, defining the void around it. Suggests stability and emergence. Gallery studio lighting, premium restraint.' },
  { id:'S2', text:'Abstract sculptural motion study: layered stacked glass and chrome forms, each slightly offset as if mid-rotation or assembly. Highly reflective surfaces catch electric orange/pink accent glows (#FF6B21, #E62E61) at glancing angles. A suggestion of kinetic energy frozen in form. Modular components in dynamic harmony. Energetic yet refined.' },
  { id:'S3', text:'Abstract sculptural harmony: nested concentric forms (a mix of frosted glass, translucent matte, and polished chrome), perfectly aligned in a symmetric radial composition. Each component subtly distinct yet visually unified. Balanced warm rim-lighting in soft amber + pink (#FFC70D + #E62E61 blend). Serene, composed, holistic. Suggests user-centered integration and a coherent design system.' },
];

const args = process.argv.slice(2);
let variants = 1;
const nIdx = args.indexOf('--n');
if (nIdx >= 0) { variants = Math.max(1, parseInt(args[nIdx+1]||'1', 10)); args.splice(nIdx, 2); }
const only = args.filter(a => /^[AS][123]$/i.test(a)).map(a => a.toUpperCase());
const jobs = PROMPTS.filter(p => !only.length || only.includes(p.id));

async function callModel(model, prompt) {
  const bodies = [
    { contents:[{ role:'user', parts:[{ text: prompt }] }], generationConfig:{ responseModalities:['IMAGE'], imageConfig:{ aspectRatio:'1:1' } } },
    { contents:[{ role:'user', parts:[{ text: prompt }] }], generationConfig:{ responseModalities:['IMAGE'] } },
    { contents:[{ role:'user', parts:[{ text: prompt }] }] },
  ];
  let lastErr = '';
  for (const body of bodies) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method:'POST', headers:{ 'content-type':'application/json', 'x-goog-api-key': KEY }, body: JSON.stringify(body),
    });
    if (res.status === 404) return { notFound:true };
    const j = await res.json().catch(()=>({}));
    if (!res.ok) { lastErr = (j.error && j.error.message) || ('HTTP '+res.status);
      if (/imageConfig|aspectRatio|Unknown name|responseModalities/i.test(lastErr)) continue;  // retry simpler body
      return { error: lastErr }; }
    const parts = (((j.candidates||[])[0]||{}).content||{}).parts || [];
    const img = parts.find(p => p.inlineData || p.inline_data);
    if (img) return { data: (img.inlineData||img.inline_data).data };
    lastErr = 'no image part in response';
  }
  return { error: lastErr };
}

async function gen(job, suffix) {
  const prompt = job.text + STYLE;
  for (const model of MODELS) {
    for (let attempt=1; attempt<=3; attempt++) {
      const r = await callModel(model, prompt);
      if (r.notFound) break;                     // try next model
      if (r.data) {
        const file = `${OUT}/${job.id}${suffix}.png`;
        await writeFile(file, Buffer.from(r.data, 'base64'));
        console.log(`  ✓ ${file}  (${model}, ${(Buffer.from(r.data,'base64').length/1024).toFixed(0)} KB)`);
        return true;
      }
      console.log(`  … ${job.id}${suffix} ${model} attempt ${attempt} failed: ${r.error}`);
      await new Promise(s=>setTimeout(s, 1500*attempt));
    }
  }
  console.error(`  ✗ ${job.id}${suffix} — all models/attempts failed`);
  return false;
}

await mkdir(OUT, { recursive: true });
console.log(`Generating ${jobs.length} image(s)${variants>1?` × ${variants} variants`:''} → ${OUT}/`);
let ok = 0, total = 0;
for (const job of jobs) {
  for (let v=0; v<variants; v++) {
    total++;
    const suffix = variants>1 ? `_${v+1}` : '';
    if (await gen(job, suffix)) ok++;
  }
}
console.log(`\nDone: ${ok}/${total} saved. (API path → no visible ✦ badge; invisible SynthID remains.)`);
if (ok < total) process.exit(1);
