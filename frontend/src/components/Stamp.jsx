import { useEffect, useRef, useState } from "react";
import { CRITICAL_THRESHOLD_SECONDS, URGENT_THRESHOLD_RATIO } from "../lib/config";

function formatRemaining(totalSeconds) {
  if (totalSeconds <= 0) return "00:00:00";
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const pad = (n) => String(n).padStart(2, "0");
  if (days > 0) return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * The countdown "ink stamp". Shows time remaining until `deadline`,
 * shifting from kraft-gold to stamp-red as time runs out, and
 * pressing down into a SEALED state once the deadline passes.
 *
 * `windowSeconds` (optional) is the total lifetime of the folder, used
 * only to compute the urgency ratio for the color shift. If omitted,
 * urgency falls back to an absolute threshold.
 */
export default function Stamp({ deadline, windowSeconds, onExpire, size = "large" }) {
  const deadlineMs = new Date(deadline).getTime();
  const [remainingMs, setRemainingMs] = useState(deadlineMs - Date.now());
  const firedExpireRef = useRef(false);

  useEffect(() => {
    const tick = () => setRemainingMs(deadlineMs - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineMs]);

  useEffect(() => {
    if (remainingMs <= 0 && !firedExpireRef.current) {
      firedExpireRef.current = true;
      onExpire?.();
    }
  }, [remainingMs, onExpire]);

  const remainingSeconds = Math.max(0, remainingMs / 1000);
  const expired = remainingMs <= 0;

  let urgency = "calm";
  if (!expired) {
    const ratio = windowSeconds ? remainingSeconds / windowSeconds : null;
    if (remainingSeconds <= CRITICAL_THRESHOLD_SECONDS || (ratio !== null && ratio <= URGENT_THRESHOLD_RATIO)) {
      urgency = "urgent";
    }
  }

  return (
    <div className={`stamp stamp-${size} stamp-${expired ? "sealed" : urgency}`}>
      <div className="stamp-ring">
        <div className="stamp-inner">
          {expired ? (
            <span className="stamp-text-sealed">SEALED</span>
          ) : (
            <>
              <span className="stamp-time">{formatRemaining(remainingSeconds)}</span>
              <span className="stamp-caption">remaining</span>
            </>
          )}
        </div>
      </div>

      <style>{`
        .stamp {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transform: rotate(-3deg);
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .stamp-ring {
          border-radius: 50%;
          border: 3px solid var(--kraft-bright);
          padding: 4px;
          transition: border-color 0.6s ease;
        }
        .stamp-inner {
          border-radius: 50%;
          border: 1px solid var(--kraft-bright);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-family: var(--font-mono);
          transition: border-color 0.6s ease;
        }
        .stamp-large .stamp-ring { padding: 6px; }
        .stamp-large .stamp-inner { width: 200px; height: 200px; }
        .stamp-large .stamp-time { font-size: 28px; }
        .stamp-medium .stamp-inner { width: 140px; height: 140px; }
        .stamp-medium .stamp-time { font-size: 19px; }
        .stamp-small .stamp-inner { width: 92px; height: 92px; }
        .stamp-small .stamp-time { font-size: 13px; }

        .stamp-time {
          font-weight: 600;
          letter-spacing: 0.02em;
          color: var(--kraft-bright);
          transition: color 0.6s ease;
        }
        .stamp-caption {
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--slate);
          margin-top: 4px;
        }

        .stamp-urgent .stamp-ring,
        .stamp-urgent .stamp-inner {
          border-color: var(--stamp-bright);
        }
        .stamp-urgent .stamp-time {
          color: var(--stamp-bright);
        }
        .stamp-urgent .stamp-ring {
          animation: stamp-pulse 1.4s ease-in-out infinite;
        }

        .stamp-sealed {
          transform: rotate(-6deg) scale(1.04);
        }
        .stamp-sealed .stamp-ring,
        .stamp-sealed .stamp-inner {
          border-color: var(--stamp);
        }
        .stamp-text-sealed {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 22px;
          letter-spacing: 0.06em;
          color: var(--stamp-bright);
        }
        .stamp-small .stamp-text-sealed { font-size: 14px; }
        .stamp-medium .stamp-text-sealed { font-size: 17px; }

        @keyframes stamp-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(181, 52, 42, 0.35); }
          50% { box-shadow: 0 0 0 8px rgba(181, 52, 42, 0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .stamp-urgent .stamp-ring { animation: none; }
          .stamp { transition: none; }
        }
      `}</style>
    </div>
  );
}
