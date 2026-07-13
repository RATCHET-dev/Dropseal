import { useEffect, useState } from "react";

const PRESETS = [
  { label: "1 hour", minutes: 60 },
  { label: "4 hours", minutes: 240 },
  { label: "24 hours", minutes: 1440 },
  { label: "1 week", minutes: 10080 },
];

function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

/**
 * Lets a teacher set a deadline either as a specific date & time
 * (e.g. "July 15, 11:59 PM") or as a duration from right now (e.g.
 * "4 hours from now"). Always reports back a plain ISO string via
 * onChange.
 */
export default function DeadlinePicker({ onChange }) {
  const [mode, setMode] = useState("duration");
  const [customMinutes, setCustomMinutes] = useState(240);
  const [specificValue, setSpecificValue] = useState(() => {
    const d = new Date(Date.now() + 4 * 60 * 60 * 1000);
    return toLocalInputValue(d);
  });

  useEffect(() => {
    if (mode === "duration") {
      const iso = new Date(Date.now() + customMinutes * 60 * 1000).toISOString();
      onChange(iso);
    } else {
      if (specificValue) {
        onChange(new Date(specificValue).toISOString());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, customMinutes, specificValue]);

  return (
    <div className="deadline-picker">
      <div className="dp-toggle">
        <button
          type="button"
          className={`dp-toggle-btn ${mode === "duration" ? "active" : ""}`}
          onClick={() => setMode("duration")}
        >
          From now
        </button>
        <button
          type="button"
          className={`dp-toggle-btn ${mode === "specific" ? "active" : ""}`}
          onClick={() => setMode("specific")}
        >
          Specific time
        </button>
      </div>

      {mode === "duration" ? (
        <div className="dp-duration">
          <div className="dp-presets">
            {PRESETS.map((p) => (
              <button
                type="button"
                key={p.label}
                className={`dp-preset ${customMinutes === p.minutes ? "active" : ""}`}
                onClick={() => setCustomMinutes(p.minutes)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="dp-custom-row">
            <label htmlFor="dp-custom-minutes">Custom (minutes from now)</label>
            <input
              id="dp-custom-minutes"
              type="number"
              min="5"
              step="5"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(Math.max(5, Number(e.target.value) || 5))}
            />
          </div>
        </div>
      ) : (
        <div className="field" style={{ marginBottom: 0 }}>
          <input
            type="datetime-local"
            value={specificValue}
            onChange={(e) => setSpecificValue(e.target.value)}
          />
        </div>
      )}

      <style>{`
        .deadline-picker { display: flex; flex-direction: column; gap: 12px; }
        .dp-toggle { display: flex; gap: 8px; }
        .dp-toggle-btn {
          flex: 1;
          padding: 9px 12px;
          border-radius: 7px;
          border: 1px solid var(--ink-line);
          background: var(--ink);
          color: var(--slate);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .dp-toggle-btn.active {
          border-color: var(--kraft);
          color: var(--kraft-bright);
          background: rgba(200, 145, 42, 0.1);
        }
        .dp-presets { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
        .dp-preset {
          padding: 7px 12px;
          border-radius: 6px;
          border: 1px solid var(--ink-line);
          background: transparent;
          color: var(--cream-text);
          font-size: 13px;
          cursor: pointer;
        }
        .dp-preset.active {
          border-color: var(--kraft-bright);
          background: var(--kraft);
          color: #1a1204;
          font-weight: 600;
        }
        .dp-custom-row { display: flex; align-items: center; gap: 10px; }
        .dp-custom-row label { font-size: 13px; color: var(--slate); }
        .dp-custom-row input {
          width: 90px;
          padding: 8px 10px;
          border-radius: 6px;
          border: 1px solid var(--ink-line);
          background: var(--ink);
          color: var(--cream-text);
          font-family: var(--font-mono);
        }
      `}</style>
    </div>
  );
}
