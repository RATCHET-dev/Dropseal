import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { pb, currentTeacher, logoutTeacher } from "../lib/pb";
import { APP_NAME } from "../lib/config";
import DeadlinePicker from "../components/DeadlinePicker.jsx";
import Stamp from "../components/Stamp.jsx";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const teacher = currentTeacher();
  const [folders, setFolders] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");

  const loadFolders = async () => {
    setLoading(true);
    try {
      const list = await pb.collection("folders").getFullList({
        filter: `teacher = "${teacher.id}"`,
        sort: "-created",
      });
      setFolders(list);

      const countEntries = await Promise.all(
        list.map(async (f) => {
          const res = await pb.collection("submissions").getList(1, 1, {
            filter: `folder = "${f.id}"`,
          });
          return [f.id, res.totalItems];
        })
      );
      setCounts(Object.fromEntries(countEntries));
    } catch (err) {
      setError(err?.message || "Couldn't load your folders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page dash-page">
      <header className="dash-header">
        <div className="container dash-header-inner">
          <Link to="/" className="brand-link">
            {APP_NAME}
          </Link>
          <div className="dash-header-right">
            <span className="muted">{teacher?.name || teacher?.email}</span>
            <button
              className="btn btn-outline btn-small"
              onClick={() => {
                logoutTeacher();
                navigate("/");
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="container dash-main">
        <div className="dash-toolbar">
          <h1>Your drop folders</h1>
          <button className="btn btn-kraft" onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? "Cancel" : "+ New folder"}
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {showCreate && (
          <CreateFolderForm
            teacherId={teacher.id}
            onCreated={() => {
              setShowCreate(false);
              loadFolders();
            }}
          />
        )}

        {loading ? (
          <p className="muted">Loading…</p>
        ) : folders.length === 0 ? (
          <div className="card empty-state">
            <p>No drop folders yet.</p>
            <p className="muted">Create one to get a shareable link for your class.</p>
          </div>
        ) : (
          <div className="folder-ledger">
            {folders.map((f) => (
              <FolderCard key={f.id} folder={f} submissionCount={counts[f.id]} />
            ))}
          </div>
        )}
      </main>

      <style>{`
        .dash-header { border-bottom: 1px solid var(--ink-line); padding: 18px 0; }
        .dash-header-inner { display: flex; align-items: center; justify-content: space-between; }
        .brand-link { font-family: var(--font-display); font-weight: 600; font-size: 19px; text-decoration: none; }
        .dash-header-right { display: flex; align-items: center; gap: 14px; font-size: 14px; }
        .btn-small { padding: 8px 14px; font-size: 13px; }
        .dash-main { padding: 40px 24px 64px; }
        .dash-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .dash-toolbar h1 { font-family: var(--font-display); font-size: 30px; margin: 0; }
        .empty-state { padding: 40px 24px; text-align: center; }
        .folder-ledger { display: flex; flex-direction: column; gap: 14px; }
      `}</style>
    </div>
  );
}

function CreateFolderForm({ teacherId, onCreated }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [deadline, setDeadline] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await pb.collection("folders").create({
        name,
        password,
        deadline,
        teacher: teacherId,
      });
      onCreated();
    } catch (err) {
      setError(err?.response?.message || err?.message || "Couldn't create the folder.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card create-folder-form" onSubmit={submit}>
      {error && <div className="error-banner">{error}</div>}
      <div className="field">
        <label htmlFor="folder-name">Folder name</label>
        <input
          id="folder-name"
          type="text"
          required
          placeholder="e.g. CIE 106 — Assignment 3"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="folder-password">Password students will enter</label>
        <input
          id="folder-password"
          type="text"
          required
          minLength={4}
          placeholder="e.g. drop2026"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Deadline</label>
        <DeadlinePicker onChange={setDeadline} />
      </div>
      <button type="submit" className="btn btn-kraft" disabled={busy}>
        {busy ? "Creating…" : "Create folder"}
      </button>

      <style>{`
        .create-folder-form { padding: 24px; margin-bottom: 24px; }
      `}</style>
    </form>
  );
}

function FolderCard({ folder, submissionCount }) {
  const [copied, setCopied] = useState(false);
  const studentLink = `${window.location.origin}${window.location.pathname}#/s/${folder.id}`;

  const copyLink = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(studentLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable, ignore silently
    }
  };

  return (
    <Link to={`/folder/${folder.id}`} className="folder-card card">
      <div className="folder-card-main">
        <h3>{folder.name}</h3>
        <p className="muted folder-card-meta">
          {submissionCount === undefined ? "…" : submissionCount} submission
          {submissionCount === 1 ? "" : "s"}
        </p>
        <button className="btn btn-outline btn-small" onClick={copyLink}>
          {copied ? "Copied!" : "Copy student link"}
        </button>
      </div>
      <div className="folder-card-stamp">
        <Stamp deadline={folder.deadline} size="small" />
      </div>

      <style>{`
        .folder-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 20px 22px;
          text-decoration: none;
          color: inherit;
          transition: border-color 0.15s ease;
        }
        .folder-card:hover { border-color: var(--kraft); }
        .folder-card-main h3 {
          font-family: var(--font-display);
          font-size: 19px;
          margin: 0 0 6px;
        }
        .folder-card-meta { margin: 0 0 12px; font-size: 13px; }
        .folder-card-stamp { flex-shrink: 0; }
      `}</style>
    </Link>
  );
}
