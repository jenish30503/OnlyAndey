with open('components/closed-screen.tsx', 'r') as f:
    code = f.read()

old_component = """        <div className="closed-egg-container">
          <div className="closed-zzz" aria-hidden="true">
            <span className="z z1">z</span>
            <span className="z z2">z</span>
            <span className="z z3">Z</span>
          </div>
          <img
            src="/sleeping-egg.svg"
            alt="Sleeping egg with a night cap"
            className="closed-egg-img"
          />
        </div>"""

new_component = """        <div className="closed-egg-wrapper">
          <img
            src="/sleeping-egg.png"
            alt="Sleeping egg"
            className="closed-egg-img"
          />
        </div>"""

if old_component in code:
    code = code.replace(old_component, new_component)
    with open('components/closed-screen.tsx', 'w') as f:
        f.write(code)
    print("Component patched successfully")
else:
    print("Could not find old component block")
