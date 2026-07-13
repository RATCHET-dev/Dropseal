import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { pb } from "../lib/pb";
import { APP_NAME } from "../lib/config";
import Stamp from "../components/Stamp.jsx";
import UploadZone from "../components/UploadZone.jsx";

const STAGE = {
  LOADING: "loading",
  NOT_FOUND: "not_found",
  SEALED: "sealed",
  PASSWORD: "password",
  UPLOAD: "upload",
  DONE: "done",
};

export default function StudentSubmit() {
  const { folderId } = useParams();
  const [stage, setStage] = useState(STAGE.LOADING);
  const [folderInfo, setFolderInfo] = useState(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [submitToken, setSubmitToken] = useState("");
  const [studentName, setStudentName] = useState("");
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await pb.send("/api/dropseal/folder-info", {
          method: "POST",
          body: { folderId },
        });
        if (cancelled) return;
        setFolderInfo(res);
        setStage(res.expired ? STAGE.SEALED : STAGE.PASSWORD);
      } catch (err) {
        if (!cancelled) setStage(STAGE.NOT_FOUND);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [folderId]);

  const verifyPassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setVerifying(true);
    try {
      const res = await pb.send("/api/dropseal/verify-password", {
        method: "POST",
        body: { folderId, password },
      });
      setSubmitToken(res.token);
      setStage(STAGE.UPLOAD);
    } catch (err) {
      setPasswordError(err?.response?.message || err?.message || "Couldn't verify that password.");
    } finally {
      setVerifying(false);
    }
  };

  const submitFiles = async (e) => {
    e.preventDefault();
    setUploadError("");
    if (files.length === 0) {
      setUploadError("Add at least one file before submitting.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("folder", folderId);
      formData.append("student_name", studentName);
      files.forEach((f) => formData.append("files", f));

      await pb.collection("submissions").create(formData, {
        headers: { "X-Submit-Token": submitToken },
      });
      setStage(STAGE.DONE);
    } catch (err) {
      setUploadError(err?.response?.message || err?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page student-page">
      <header className="student-header">
        <div className="container">
          <Link to="/" className="brand-link">
            {APP_NAME}
          </Link>
        </div>
      </header>

      <main className="container student-main">
        {stage === STAGE.LOADING && <p className="muted">Loading folder…</p>}

        {stage === STAGE.NOT_FOUND && (
          <div className="paper-card slip">
            <p className="eyebrow-dark">Drop folder</p>
            <h1>We couldn't find that folder</h1>
            <p>Double-check the link your teacher shared with you.</p>
          </div>
        )}

        {folderInfo && stage !== STAGE.LOADING && stage !== STAGE.NOT_FOUND && (
          <div className="paper-card slip">
            <p className="eyebrow-dark">Drop folder</p>
            <h1>{folderInfo.name}</h1>

            <div className="slip-stamp">
              <Stamp deadline={folderInfo.deadline} onExpire={() => setStage(STAGE.SEALED)} />
            </div>

            {stage === STAGE.SEALED && (
              <p className="slip-message">
                This folder's deadline has passed. It no longer accepts submissions.
              </p>
            )}

            {stage === STAGE.PASSWORD && (
              <form onSubmit={verifyPassword} className="slip-form">
                {passwordError && <div className="error-banner">{passwordError}</div>}
                <div className="field">
                  <label htmlFor="folder-password">Password</label>
                  <input
                    id="folder-password"
                    type="password"
                    required
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ask your teacher if you don't have this"
                  />
                </div>
                <button type="submit" className="btn btn-kraft" disabled={verifying}>
                  {verifying ? "Checking…" : "Unlock"}
                </button>
              </form>
            )}

            {stage === STAGE.UPLOAD && (
              <form onSubmit={submitFiles} className="slip-form">
                {uploadError && <div className="error-banner">{uploadError}</div>}
                <div className="field">
                  <label htmlFor="student-name">Your name</label>
                  <input
                    id="student-name"
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Full name, as your teacher has it"
                  />
                </div>
                <div className="field">
                  <label>Files</label>
                  <UploadZone files={files} onFilesChange={setFiles} disabled={uploading} />
                </div>
                <button type="submit" className="btn btn-kraft" disabled={uploading}>
                  {uploading ? "Submitting…" : "Submit"}
                </button>
              </form>
            )}

            {stage === STAGE.DONE && (
              <div className="received-stamp-wrap">
                <div className="received-stamp">RECEIVED</div>
                <p className="slip-message">
                  Thanks, {studentName.split(" ")[0] || "friend"} — your submission is in.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        .student-header { padding: 20px 0; }
        .brand-link {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 19px;
          text-decoration: none;
          color: var(--cream-text);
        }
        .student-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .slip {
          width: 100%;
          max-width: 460px;
          padding: 32px;
          text-align: center;
        }
        .eyebrow-dark {
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--stamp);
          margin: 0 0 6px;
        }
        .slip h1 {
          font-family: var(--font-display);
          font-size: 26px;
          margin: 0 0 20px;
        }
        .slip-stamp { display: flex; justify-content: center; margin-bottom: 22px; }
        .slip-form { text-align: left; }
        .slip-form .btn { width: 100%; margin-top: 6px; }
        .slip-message { font-size: 15px; opacity: 0.85; }

        .received-stamp-wrap { padding: 12px 0 4px; }
        .received-stamp {
          display: inline-block;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 28px;
          letter-spacing: 0.08em;
          color: var(--moss);
          border: 3px solid var(--moss);
          border-radius: 10px;
          padding: 10px 22px;
          transform: rotate(-4deg);
          animation: stamp-press 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes stamp-press {
          0% { transform: rotate(-4deg) scale(1.6); opacity: 0; }
          70% { transform: rotate(-4deg) scale(0.94); opacity: 1; }
          100% { transform: rotate(-4deg) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .received-stamp { animation: none; }
        }
      `}</style>
    </div>
  );
}
