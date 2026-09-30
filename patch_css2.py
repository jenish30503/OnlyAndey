import sys
with open('app/globals.css', 'r') as f:
    code = f.read()

code = code.replace("  .closed-egg-container { margin-bottom: 4px; }\n  .closed-zzz { right: -12px; top: -4px; }\n", "")

with open('app/globals.css', 'w') as f:
    f.write(code)
