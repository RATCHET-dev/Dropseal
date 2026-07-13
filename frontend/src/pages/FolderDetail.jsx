import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { pb } from "../lib/pb";
import { APP_NAME } from "../lib/config";
import Stamp from "../components/Stamp.jsx";

export default function FolderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [folder, setFolder] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const f = await pb.collection("folders").getOne(id);
      setFolder(f);
      const subs = await pb.collection("submissions").getFullList({
        filter: `folder = "${id}"`,
        sort: "-created",
      });
      setSubmissions(subs);
    } catch (err) {
      setError(err?.response?.message || err?.message || "Couldn't load this folder.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const studentLink = `${window.location.origin}${window.location.pathname}#/s/${id}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(studentLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const deleteFolder = async () => {
    if (!window.confirm(`Delete "${folder.name}" and every submission in it? This can't be undone.`)) {
      return;
    }
    try {
      await pb.collection("folders").delete(id);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.message || err?.message || "Couldn't delete the folder.");
    }
  };

  const deleteSubmission = async (subId) => {
    if (!window.confirm("Remove this submission?")) return;
    try {
      await pb.collection("submissions").delete(subId);
      setSubmissions((prev) => prev.filter((s) => s.id !== subId));
    } catch (err) {
      setError(err?.response?.message || err?.message || "Couldn't remove that submission.");
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container" style={{ padding: 40 }}>
          <p className="muted">Loading…</p>
        </div>
      </div>
    );
  }

  if (error && !folder) {
    return (
      <div className="page">
        <div className="container" style={{ padding: 40 }}>
          <div className="error-banner">{error}</div>
          <Link to="/dashboard" className="btn btn-outline">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page folder-detail-page">
      <header className="dash-header">
        <div className="container dash-header-inner">
          <Link to="/" className="brand-link">
            {APP_NAME}
          </Link>
          <Link to="/dashboard" className="btn btn-outline btn-small">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="container folder-detail-main">
        {error && <div className="error-banner">{error}</div>}

        <div className="folder-detail-top">
          <div>
            <p className="eyebrow">Drop folder</p>
            <h1>{folder.name}</h1>
            <div className="share-row">
              <input readOnly value={studentLink} onFocus={(e) => e.target.select()} />
              <button className="btn btn-kraft btn-small" onClick={copyLink}>
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
            <p className="muted folder-password-note">
              Password: <code>{folder.password}</code>
            </p>
            <button className="btn btn-danger btn-small" onClick={deleteFolder} style={{ marginTop: 18 }}>
              Delete folder
            </button>
          </div>
          <Stamp deadline={folder.deadline} size="medium" />
        </div>

        <h2 className="submissions-heading">
          Submissions <span className="muted">({submissions.length})</span>
        </h2>

        {submissions.length === 0 ? (
          <div className="card empty-state">
            <p>No submissions yet.</p>
          </div>
        ) : (
          <ul className="submissions-list">
            {submissions.map((s) => (
              <li key={s.id} className="card submission-item">
                <div className="submission-main">
                  <strong>{s.student_name}</strong>
                  <span className="muted submission-time">
                    {new Date(s.created).toLocaleString()}
                  </span>
                </div>
                <div className="submission-files">
                  {s.files.map((filename) => (
                    <a
                      key={filename}
                      href={pb.files.getURL(s, filename)}
                      target="_blank"
                      rel="noreferrer"
                      className="submission-file-link"
                    >
                      {filename}
                    </a>
                  ))}
                </div>
                <button
                  className="btn btn-outline btn-small submission-remove"
                  onClick={() => deleteSubmission(s.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      <style>{`
        .dash-header { border-bottom: 1px solid var(--ink-line); padding: 18px 0; }
        .dash-header-inner { display: flex; align-items: center; justify-content: space-between; }
        .brand-link { font-family: var(--font-display); font-weight: 600; font-size: 19px; text-decoration: none; }
        .btn-small { padding: 8px 14px; font-size: 13px; }
        .folder-detail-main { padding: 40px 24px 64px; }
        .folder-detail-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 32px;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }
        .folder-detail-top h1 { font-family: var(--font-display); font-size: 32px; margin: 6px 0 18px; }
        .share-row { display: flex; gap: 8px; max-width: 460px; }
        .share-row input {
          flex: 1;
          font-family: var(--font-mono);
          font-size: 13px;
          padding: 10px 12px;
          border-radius: 7px;
          border: 1px solid var(--ink-line);
          background: var(--ink);
          color: var(--cream-text);
        }
        .folder-password-note { margin: 14px 0 0; font-size: 14px; }
        .folder-password-note code {
          font-family: var(--font-mono);
          background: var(--ink);
          padding: 2px 8px;
          border-radius: 4px;
          color: var(--kraft-bright);
        }
        .submissions-heading { font-family: var(--font-display); font-size: 22px; margin-bottom: 16px; }
        .empty-state { padding: 32px 22px; text-align: center; }
        .submissions-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
        .submission-item {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        .submission-main { display: flex; flex-direction: column; gap: 4px; min-width: 160px; }
        .submission-time { font-size: 12px; }
        .submission-files { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 180px; }
        .submission-file-link {
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--kraft-bright);
          text-decoration: none;
          word-break: break-all;
        }
        .submission-file-link:hover { text-decoration: underline; }
        .submission-remove { margin-left: auto; }
      `}</style>
    </div>
  );
}
