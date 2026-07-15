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

// Emotional-Technology: the HERO's own language — abstract warm LIGHT + luminous haze + film grain.
// (Corrected: the first pass drifted into literal flowers/plants/mandalas — explicitly banned below.)
const STYLE = ' Abstract light and atmosphere ONLY. ABSOLUTELY NO recognizable object, NO flower, NO petals, NO plant or botanical form, NO mandala, NO kaleidoscope, NO ornament or symmetrical pattern, NO creature, NO chrome, NO polished glass, no faceted crystal, no machine-precise edges, no neon sci-fi. Premium soft cinematic atmosphere, warm diffuse light, glowing haze and drifting dust particles, heavy 35mm film grain that makes the glow tactile and analog — like a long-exposure photograph of light in a dark room. Soft feathered edges only, nothing hard. 1:1 square. No text, no watermark. The light form floats centred, about 55% of the frame, never touching the frame edges.';

const PROMPTS = [
  { id:'A1', text:'A soft cloud of warm amber dust and luminous haze drifting in pure black, diffuse and grainy at its outer reaches, growing denser and brighter inward until it resolves into one small clear bright amber core at its heart. The cloud fades softly into black well before the frame edges. ABSOLUTELY NO spiral, no vortex, no swirl, no radial rays, no sunburst, no lens flare, no star shape, no straight lines — only a drifting cloud of light and dust with one clear bright heart.' },
  { id:'A2', text:'Several soft amber cores of light suspended in a warm luminous haze, linked to one another by faint delicate threads of golden light. A quiet constellation — a warm network holding itself together across the dark.' },
  { id:'A3', text:'A slow luminous vortex of warm amber haze turning gently on itself in pure black, concentric currents of glowing light and drifting dust circling inward, each turn a little brighter and more defined than the last. A soft breathing cycle of refinement. ABSOLUTELY NO helix, no coil, no spring, no DNA strand, no rope, no ribbon, no hard bright line — only drifting light, dust and haze.' },
  { id:'S1', text:'One small intense magenta ember alone at the centre of a vast dark emptiness, its light only just beginning to bleed outward into a faint soft halo of glowing pink haze. Mostly darkness, very restrained and quiet — the very first spark of intention, not yet a bloom. Minimal, elemental, almost nothing but one point of warm light in the void.' },
  { id:'S2', text:'A warm magenta streak of light rushing through pure black, trailing a comet-tail of glowing pink particles and haze, caught mid-motion. Pure velocity rendered as light — fast, soft-edged, alive.' },
  { id:'S3', text:'Several soft currents of magenta light flowing together and braiding gently into one single luminous strand at the centre of pure black — many becoming one, calm and resolved. The braided strand is compact and floats centred with generous black margin on all sides, never reaching the frame edges. ABSOLUTELY NO ring, no vortex, no swirl, no orb, no sphere, no horizontal band spanning the frame, no plasma, no electricity, no starburst.' },
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
