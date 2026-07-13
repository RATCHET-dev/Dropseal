import { Link } from "react-router-dom";
import { APP_NAME, APP_TAGLINE } from "../lib/config";
import { isTeacherLoggedIn } from "../lib/pb";

export default function Landing() {
  const loggedIn = isTeacherLoggedIn();

  return (
    <div className="page landing">
      <header className="landing-header">
        <div className="container landing-header-inner">
          <span className="brand">{APP_NAME}</span>
          <Link to={loggedIn ? "/dashboard" : "/teacher"} className="btn btn-outline btn-small">
            {loggedIn ? "Dashboard" : "Teacher sign in"}
          </Link>
        </div>
      </header>

      <main className="landing-hero container">
        <div className="landing-hero-text">
          <p className="eyebrow">Classroom drop folders</p>
          <h1>{APP_NAME}</h1>
          <p className="landing-tagline">{APP_TAGLINE}</p>
          <p className="landing-body">
            Make a folder, give it a password and a deadline, and share one link with your
            class. Every submission lands in one place. The moment the clock runs out, the
            folder seals itself — no late uploads to chase down.
          </p>
          <div className="landing-ctas">
            <Link to={loggedIn ? "/dashboard" : "/teacher"} className="btn btn-kraft">
              {loggedIn ? "Go to your dashboard" : "Create a drop folder"}
            </Link>
          </div>
          <p className="landing-student-note muted">
            Submitting to a class? Use the link your teacher shared with you.
          </p>
        </div>

        <div className="landing-hero-visual" aria-hidden="true">
          <div className="hero-stamp">
            <div className="hero-stamp-ring">
              <div className="hero-stamp-inner">
                <span className="hero-stamp-text">OPEN</span>
                <span className="hero-stamp-caption">until sealed</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="landing-footer container muted">
        Built for classrooms. One password, one deadline, one folder.
      </footer>

      <style>{`
        .landing-header {
          border-bottom: 1px solid var(--ink-line);
          padding: 20px 0;
        }
        .landing-header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .brand {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 20px;
          letter-spacing: 0.01em;
        }
        .btn-small { padding: 9px 16px; font-size: 13px; }

        .landing-hero {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 56px;
          padding: 72px 24px;
          flex-wrap: wrap;
        }
        .landing-hero-text { flex: 1 1 420px; max-width: 560px; }
        .landing-hero h1 {
          font-family: var(--font-display);
          font-size: 56px;
          font-weight: 700;
          margin: 8px 0 14px;
          line-height: 1.02;
        }
        .landing-tagline {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 19px;
          color: var(--kraft-bright);
          margin: 0 0 20px;
        }
        .landing-body {
          font-size: 16px;
          line-height: 1.6;
          color: var(--cream-text);
          opacity: 0.88;
          margin: 0 0 28px;
        }
        .landing-ctas { margin-bottom: 18px; }
        .landing-student-note { font-size: 14px; }

        .landing-hero-visual {
          flex: 0 0 auto;
          display: flex;
          justify-content: center;
        }
        .hero-stamp { transform: rotate(-5deg); }
        .hero-stamp-ring {
          border-radius: 50%;
          border: 3px solid var(--kraft-bright);
          padding: 6px;
        }
        .hero-stamp-inner {
          width: 220px;
          height: 220px;
          border-radius: 50%;
          border: 1px solid var(--kraft-bright);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: var(--font-mono);
        }
        .hero-stamp-text {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 34px;
          letter-spacing: 0.08em;
          color: var(--kraft-bright);
        }
        .hero-stamp-caption {
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--slate);
          margin-top: 6px;
        }

        .landing-footer {
          padding: 24px;
          font-size: 13px;
          border-top: 1px solid var(--ink-line);
        }

        @media (max-width: 640px) {
          .landing-hero h1 { font-size: 40px; }
          .landing-hero { padding: 48px 20px; gap: 36px; }
          .hero-stamp-inner { width: 170px; height: 170px; }
        }
      `}</style>
    </div>
  );
}
