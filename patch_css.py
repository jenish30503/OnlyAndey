import sys
with open('app/globals.css', 'r') as f:
    code = f.read()

code = code.replace(
    ".closed-page { min-height: 100svh; display: flex; flex-direction: column; background: var(--coral); color: var(--ink); }",
    ".closed-page { min-height: 100svh; display: flex; flex-direction: column; background: #e0552f; color: var(--ink); }"
)

old_css = """.closed-egg-container { position: relative; margin-bottom: 8px; }
.closed-egg-img { width: clamp(180px, 55vw, 260px); height: auto; object-fit: contain; display: block; margin: 0 auto; }
.closed-zzz { position: absolute; top: -8px; right: -20px; display: flex; gap: 2px; align-items: flex-end; }
.z { font-weight: 800; color: var(--ink); }
.z1 { font-size: clamp(14px, 3vw, 20px); animation: zzz-float 3s ease-in-out infinite; }
.z2 { font-size: clamp(18px, 4vw, 26px); animation: zzz-float 3s ease-in-out 0.4s infinite; }
.z3 { font-size: clamp(24px, 5vw, 34px); animation: zzz-float 3s ease-in-out 0.8s infinite; }
@keyframes zzz-float { 0%, 100% { transform: translateY(0); opacity: 0.7; } 50% { transform: translateY(-8px); opacity: 1; } }"""

new_css = """.closed-egg-wrapper {
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
}"""

if old_css in code:
    code = code.replace(old_css, new_css)
else:
    print("Could not find old css")

with open('app/globals.css', 'w') as f:
    f.write(code)
