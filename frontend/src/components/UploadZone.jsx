import { useRef, useState } from "react";

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadZone({ files, onFilesChange, disabled }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList);
    onFilesChange([...files, ...incoming]);
  };

  const removeAt = (idx) => {
    onFilesChange(files.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div
        className={`upload-zone ${dragging ? "dragging" : ""} ${disabled ? "disabled" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled && e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="upload-zone-label">
          <strong>Drop files here</strong>
          <span className="muted"> or click to browse</span>
        </div>
      </div>

      {files.length > 0 && (
        <ul className="file-list">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="file-list-item">
              <span className="file-list-name">{f.name}</span>
              <span className="file-list-size">{formatBytes(f.size)}</span>
              {!disabled && (
                <button type="button" className="file-list-remove" onClick={() => removeAt(i)} aria-label={`Remove ${f.name}`}>
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <style>{`
        .upload-zone {
          border: 2px dashed var(--ink-line);
          border-radius: 10px;
          padding: 28px 16px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .upload-zone:hover, .upload-zone.dragging {
          border-color: var(--kraft-bright);
          background: rgba(200, 145, 42, 0.06);
        }
        .upload-zone.disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
        .upload-zone-label { font-size: 15px; }
        .file-list {
          list-style: none;
          margin: 12px 0 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .file-list-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--ink);
          border: 1px solid var(--ink-line);
          border-radius: 7px;
          padding: 8px 10px;
          font-size: 13px;
        }
        .file-list-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: var(--font-mono);
        }
        .file-list-size { color: var(--slate); font-family: var(--font-mono); font-size: 12px; }
        .file-list-remove {
          background: none;
          border: none;
          color: var(--slate);
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
          padding: 0 4px;
        }
        .file-list-remove:hover { color: var(--stamp-bright); }
      `}</style>
    </div>
  );
}
