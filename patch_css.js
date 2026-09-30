const fs = require('fs');
let code = fs.readFileSync('app/globals.css', 'utf8');

// Update background of closed-page to perfectly match the image background
code = code.replace(
  ".closed-page { min-height: 100svh; display: flex; flex-direction: column; background: var(--coral); color: var(--ink); }",
  ".closed-page { min-height: 100svh; display: flex; flex-direction: column; background: #e0552f; color: var(--ink); }"
);

// Replace the egg CSS
const oldCss = \`.closed-egg-container { position: relative; margin-bottom: 8px; }
.closed-egg-img { width: clamp(180px, 55vw, 260px); height: auto; object-fit: contain; display: block; margin: 0 auto; }
.closed-zzz { position: absolute; top: -8px; right: -20px; display: flex; gap: 2px; align-items: flex-end; }
.z { font-weight: 800; color: var(--ink); }
.z1 { font-size: clamp(14px, 3vw, 20px); animation: zzz-float 3s ease-in-out infinite; }
.z2 { font-size: clamp(18px, 4vw, 26px); animation: zzz-float 3s ease-in-out 0.4s infinite; }
.z3 { font-size: clamp(24px, 5vw, 34px); animation: zzz-float 3s ease-in-out 0.8s infinite; }
@keyframes zzz-float { 0%, 100% { transform: translateY(0); opacity: 0.7; } 50% { transform: translateY(-8px); opacity: 1; } }\`;

const newCss = \`.closed-egg-wrapper {
  width: clamp(200px, 60vw, 280px);
  aspect-ratio: 576 / 325;
  overflow: hidden;
  position: relative;
  margin: 0 auto 12px;
}
.closed-egg-img {
  position: absolute;
  top: -55.0769%;
  left: 0;
  width: 100%;
  height: auto;
  display: block;
}\`;

code = code.replace(oldCss, newCss);

// Remove any remaining closed-zzz if any
if (code.includes('.closed-zzz')) {
  console.log("Still found .closed-zzz! Manual check required.");
}

fs.writeFileSync('app/globals.css', code);
