import React, { useState, useEffect } from "react";

const API_URL = "https://fraud-backend-wsgp.onrender.com";

const RISK = {
  LOW:      { hex: "#22c55e", symbol: "●" },
  MEDIUM:   { hex: "#f59e0b", symbol: "▲" },
  HIGH:     { hex: "#f97316", symbol: "◆" },
  CRITICAL: { hex: "#ef4444", symbol: "■" },
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
    <div style={{ background: "#060d1a", border: "1px solid #0a1628", borderRadius: 15, padding: "26px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
        <span style={{ fontSize: 9, color: "#1e3a5f", letterSpacing: ".12em", textTransform: "uppercase" }}>Transaction History</span>
        <div style={{ flex: 1, height: 1, background: "#0a1628" }} />
        <span style={{ fontSize: 9, color: "#1e3a5f" }}>LAST 20</span>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "40px 0", fontSize: 11, color: "#1e3a5f" }}>Loading history ···</div>
      )}

      {error && (
        <div style={{ background: "#1a0000", border: "1px solid #ef444430", borderRadius: 8, padding: "10px 13px", fontSize: 11, color: "#f87171" }}>{error}</div>
      )}

      {!loading && !error && history.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", fontSize: 11, color: "#1e3a5f" }}>
          No transactions yet. Run a prediction to see history here.
        </div>
      )}

      {!loading && history.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: '"DM Mono", monospace' }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #0a1628" }}>
                {["Time", "Amount", "Hour", "Txns/hr", "Intl", "Risk", "Score", "Verdict"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 9, color: "#334155", letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((row) => {
                const r = RISK[row.risk_tier] || RISK.LOW;
                return (
                  <tr key={row.id} style={{ borderBottom: "1px solid #060d1a", transition: "background .15s" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#080f1c"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "10px 12px", color: "#475569" }}>{fmt(row.created_at)}</td>
                    <td style={{ padding: "10px 12px", color: "#cbd5e1" }}>₹{row.amount.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "10px 12px", color: "#475569" }}>{row.hour.toFixed(0)}:00</td>
                    <td style={{ padding: "10px 12px", color: "#475569" }}>{row.transactions_last_hour}</td>
                    <td style={{ padding: "10px 12px", color: row.is_international ? "#3b82f6" : "#1e3a5f" }}>{row.is_international ? "Yes" : "No"}</td>
                    <td style={{ padding: "10px 12px", color: r.hex }}>{r.symbol} {row.risk_tier}</td>
                    <td style={{ padding: "10px 12px", color: r.hex, fontWeight: 500 }}>{(row.probability * 100).toFixed(1)}%</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ background: row.fraud ? "#1a0000" : "#001a08", border: `1px solid ${row.fraud ? "#ef444430" : "#22c55e30"}`, color: row.fraud ? "#f87171" : "#4ade80", borderRadius: 5, padding: "2px 8px", fontSize: 9, letterSpacing: ".06em" }}>
                        {row.fraud ? "FRAUD" : "SAFE"}
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