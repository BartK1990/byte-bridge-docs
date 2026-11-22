// Renders the animated Protocol Bridge logos (site/assets/logo-{light,dark}.gif, copied to
// docs/src/assets/): the shared-spine PB mark with bits crossing the lens truss, top lane left to
// right, bottom lane right to left. The mark is the one in branding/icon-dark.svg of the
// application repository, with the inside of the lens cleared so the bits read.
//
//   npm install --no-save playwright   (once; uses its Chromium)   and ImageMagick (`convert`)
//   node scripts/render-logo.cjs
const { chromium } = require('playwright');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, rmSync, copyFileSync } = require('node:fs');
const { join } = require('node:path');
const os = require('node:os');

const repo = join(__dirname, '..');
const W = 480, H = 513;                 // viewBox 40 22 520 556 at 0.923
const FRAMES = 112, STEP = 40, HOLD = 520;

const P = 'M335 30H405A145.8 145.8 0 0 1 405 321.6H335ZM345 94.8H405A81 81 0 0 1 405 256.8H345Z';
const B = 'M265.8 30H413.4A129.6 129.6 0 0 1 413.4 289.2H414.6A140.4 140.4 0 0 1 414.6 570H265.8A10.8 10.8 0 0 1 255 559.2V40.8A10.8 10.8 0 0 1 265.8 30ZM345 94.8H413.4A59.4 81 0 0 1 413.4 256.8H345ZM345 321.6H414.6A70.2 91.8 0 0 1 414.6 505.2H345Z';
const LENS = 'M135 289.2A229.5 229.5 0 0 1 465 289.2A229.5 229.5 0 0 1 135 289.2Z';
const STRUTS = 'M217.5 239.5V338.9M300 224.2V354.2M382.5 239.5V338.9';
const ARROWS = 'M136 276.7 111 289.2 136 301.7ZM464 276.7 489 289.2 464 301.7Z';

// Bits: a fixed pseudo-random sequence so every render is the same.
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const lanes = [{ y: 254, dir: 1 }, { y: 337, dir: -1 }];
const bits = [];
for (const lane of lanes) {
    for (let k = 0; k < 14; k++) bits.push({ lane, start: k * 0.17 + rnd() * 0.06, v: rnd() < 0.5 ? '0' : '1' });
}
const TRAVEL = 1.9;                      // seconds to cross the lens

function svg(ink, t) {
    const text = bits.map(b => {
        const u = (t - b.start) / TRAVEL;
        if (u <= 0 || u >= 1) return '';
        const x = b.lane.dir > 0 ? 110 + u * 380 : 490 - u * 380;
        return `<text x="${x.toFixed(1)}" y="${b.lane.y}">${b.v}</text>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 22 520 556" width="${W}" height="${H}">
  <defs>
    <mask id="cut" maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="600">
      <rect width="600" height="600" fill="#fff"/>
      <path d="${LENS}" fill="#000"/>
      <g fill="none" stroke="#000" stroke-linejoin="round">
        <path d="${LENS}" stroke-width="53.8" stroke-miterlimit="8"/>
        <path d="M135 289.2H465" stroke-width="62.5"/>
      </g>
      <path d="${ARROWS}" stroke="#000" stroke-width="35" stroke-linejoin="round"/>
    </mask>
    <clipPath id="lens"><path d="${LENS}"/></clipPath>
  </defs>
  <g fill="${ink}" fill-rule="evenodd" mask="url(#cut)">
    <path d="${P}" transform="matrix(-1 0 0 1 600 0)"/>
    <path d="${B}"/>
  </g>
  <g clip-path="url(#lens)" fill="${ink}" font-family="DejaVu Sans Mono, Consolas, monospace" font-weight="700" font-size="36" text-anchor="middle">${text}</g>
  <g fill="none" stroke="#f2a33a" stroke-linejoin="round">
    <path d="${LENS}" stroke-width="18.8" stroke-miterlimit="8"/>
    <path d="M135 289.2H465" stroke-width="27.5"/>
    <path d="${STRUTS}" stroke-width="13.8" stroke-linecap="round"/>
  </g>
  <path d="${ARROWS}" fill="#f2a33a"/>
</svg>`;
}

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    for (const [name, ink] of [['light', '#111828'], ['dark', '#f3f4f6']]) {
        const dir = mkdtempSync(join(os.tmpdir(), 'logo-'));
        const files = [];
        for (let i = 0; i <= FRAMES; i++) {
            const t = i === 0 ? 0 : (i - 1) * STEP / 1000;
            await page.setContent(`<body style="margin:0;background:transparent">${svg(ink, t)}</body>`);
            const f = join(dir, `f${String(i).padStart(3, '0')}.png`);
            await page.screenshot({ path: f, omitBackground: true });
            files.push(f);
        }
        const out = join(repo, 'site', 'assets', `logo-${name}.gif`);
        execFileSync('convert', ['-dispose', 'previous', '-delay', String(HOLD / 10), files[0],
            '-delay', String(STEP / 10), ...files.slice(1), '-loop', '0', '-layers', 'Optimize', out]);
        copyFileSync(out, join(repo, 'docs', 'src', 'assets', `logo-${name}.gif`));
        rmSync(dir, { recursive: true });
    }
    await browser.close();
})();
