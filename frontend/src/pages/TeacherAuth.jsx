import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { pb } from "../lib/pb";
import { APP_NAME } from "../lib/config";

export default function TeacherAuth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "register") {
        if (password !== passwordConfirm) {
          throw new Error("Passwords don't match.");
        }
        await pb.collection("teachers").create({
          name,
          email,
          password,
          passwordConfirm,
        });
      }
      await pb.collection("teachers").authWithPassword(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(readableError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page auth-page">
      <div className="container auth-container">
        <Link to="/" className="brand-link">
          {APP_NAME}
        </Link>

        <div className="card auth-card">
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${mode === "login" ? "active" : ""}`}
              onClick={() => setMode("login")}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === "register" ? "active" : ""}`}
              onClick={() => setMode("register")}
            >
              Create account
            </button>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={submit}>
            {mode === "register" && (
              <div className="field">
                <label htmlFor="name">Your name</label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mr. Richmond"
                />
              </div>
            )}
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            {mode === "register" && (
              <div className="field">
                <label htmlFor="passwordConfirm">Confirm password</label>
                <input
                  id="passwordConfirm"
                  type="password"
                  required
                  minLength={8}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                />
              </div>
            )}

            <button type="submit" className="btn btn-kraft auth-submit" disabled={busy}>
              {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .auth-page { display: flex; align-items: center; justify-content: center; padding: 24px; }
        .auth-container { max-width: 420px; display: flex; flex-direction: column; align-items: center; gap: 24px; }
        .brand-link {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 22px;
          text-decoration: none;
        }
        .auth-card { width: 100%; padding: 28px; }
        .auth-tabs { display: flex; gap: 8px; margin-bottom: 20px; }
        .auth-tab {
          flex: 1;
          padding: 10px;
          border-radius: 7px;
          border: 1px solid var(--ink-line);
          background: transparent;
          color: var(--slate);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
        }
        .auth-tab.active {
          border-color: var(--kraft);
          color: var(--kraft-bright);
          background: rgba(200, 145, 42, 0.1);
        }
        .auth-submit { width: 100%; margin-top: 6px; }
      `}</style>
    </div>
  );
}

function readableError(err) {
  const msg = err?.response?.message || err?.message;
  if (msg && msg.toLowerCase().includes("failed to authenticate")) {
    return "That email and password don't match our records.";
  }
  return msg || "Something went wrong. Please try again.";
}
