'use client'

export function ClosedScreen() {
  return (
    <div className="closed-page">
      <header className="closed-header">
        <a href="/" className="wordmark" aria-label="Only Andey home">
          <img src="/logo.png" alt="Only Andey" className="wordmark-logo" />
        </a>
        <div className="closed-header-divider" />
      </header>

      <main className="closed-main">
        <div className="closed-egg-wrapper">
          <img
            src="/sleeping-egg.png"
            alt="Sleeping egg"
            className="closed-egg-img"
          />
        </div>

        <h1 className="closed-headline">
          <span className="closed-soja">Soja</span>
          <br />
          <span className="closed-bhenkandey">bhenkandey.</span>
        </h1>

        <p className="closed-subtext">
          We&apos;re closed for the night. Orders open again
          <br />
          tomorrow.
        </p>

        <div className="closed-pill">
          <span className="closed-moon">🌙</span>
          <span>Closed for tonight</span>
        </div>
      </main>
    </div>
  )
}
