import React, { useState, useEffect } from "react";

const API_URL = "https://fraud-backend-wsgp.onrender.com";

const RISK = {
  LOW:      { ink: "var(--green)",  symbol: "✓", label: "Cleared" },
  MEDIUM:   { ink: "var(--amber)",  symbol: "△", label: "Review"  },
  HIGH:     { ink: "var(--orange)", symbol: "◇", label: "Flagged" },
  CRITICAL: { ink: "var(--red)",    symbol: "✕", label: "Blocked" },
};

export default function HistoryPage({ token }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`${API_URL}/history?limit=20`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) setError(data.detail || "Failed to load history.");
        else setHistory(data);
      } catch {
        setError("Cannot reach backend.");
      }
      setLoading(false);
    };
    load();
  }, [token]);

  const fmt = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) +
      "  " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
        <span style={{ fontSize: 9, color: "var(--ink-soft)", letterSpacing: ".12em", textTransform: "uppercase" }}>Case Ledger</span>
        <div style={{ flex: 1, height: 1, background: "var(--rule)" }} />
        <span style={{ fontSize: 9, color: "var(--ink-faint)" }}>LAST 20 ENTRIES</span>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "40px 0", fontSize: 11, color: "var(--ink-faint)" }}>Pulling case files ···</div>
      )}

      {error && (
        <div style={{ background: "var(--red-bg)", borderLeft: "3px solid var(--red)", padding: "10px 13px", fontSize: 11, color: "var(--red)" }}>{error}</div>
      )}

      {!loading && !error && history.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", fontSize: 11, color: "var(--ink-faint)" }}>
          The ledger is empty. Assess a transaction to open the first entry.
        </div>
      )}

      {!loading && history.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "var(--mono)" }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid var(--ink)" }}>
                {["Filed", "Amount", "Hour", "Txns/hr", "Intl", "Verdict", "Score", "Status"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 9, color: "var(--ink-soft)", letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600, fontFamily: "var(--serif)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((row, idx) => {
                const r = RISK[row.risk_tier] || RISK.LOW;
                return (
                  <tr key={row.id} style={{ borderBottom: "1px solid var(--rule)", background: idx % 2 === 1 ? "var(--paper)" : "transparent", transition: "background .15s" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--paper3)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 1 ? "var(--paper)" : "transparent"}>
                    <td style={{ padding: "10px 12px", color: "var(--ink-soft)" }}>{fmt(row.created_at)}</td>
                    <td style={{ padding: "10px 12px", color: "var(--ink)", fontWeight: 500 }}>₹{row.amount.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "10px 12px", color: "var(--ink-soft)" }}>{row.hour.toFixed(0)}:00</td>
                    <td style={{ padding: "10px 12px", color: "var(--ink-soft)" }}>{row.transactions_last_hour}</td>
                    <td style={{ padding: "10px 12px", color: row.is_international ? "var(--ink)" : "var(--ink-faint)" }}>{row.is_international ? "Yes" : "No"}</td>
                    <td style={{ padding: "10px 12px", color: r.ink, fontWeight: 600 }}>{r.symbol} {r.label}</td>
                    <td style={{ padding: "10px 12px", color: r.ink, fontWeight: 600 }}>{(row.probability * 100).toFixed(1)}%</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        border: `1px solid ${row.fraud ? "var(--red)" : "var(--green)"}`,
                        color: row.fraud ? "var(--red)" : "var(--green)",
                        padding: "2px 8px", fontSize: 9, letterSpacing: ".06em",
                      }}>
                        {row.fraud ? "FLAGGED" : "CLEAR"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}