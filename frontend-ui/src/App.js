import React, { useState, useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import AuthPage    from "./AuthPage";
import HistoryPage from "./HistoryPage";

const FontLoader = () => {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@600;700;800&display=swap";
    document.head.appendChild(link);
  }, []);
  return null;
};

const RISK = {
  LOW:      { label: "Low Risk",      symbol: "●", hex: "#22c55e", bg: "#052010" },
  MEDIUM:   { label: "Medium Risk",   symbol: "▲", hex: "#f59e0b", bg: "#1c1000" },
  HIGH:     { label: "High Risk",     symbol: "◆", hex: "#f97316", bg: "#1c0800" },
  CRITICAL: { label: "Critical Risk", symbol: "■", hex: "#ef4444", bg: "#1a0000" },
};

function getTier(p) {
  if (p >= 0.75) return "CRITICAL";
  if (p >= 0.50) return "HIGH";
  if (p >= 0.25) return "MEDIUM";
  return "LOW";
}

function AnimatedPct({ value }) {
  const [disp, setDisp] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / 900, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisp(value * ease);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  return <>{disp.toFixed(1)}%</>;
}

function Gauge({ probability }) {
  const pct = Math.min(probability * 100, 100);
  const tier = getTier(probability);
  const { hex } = RISK[tier];
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct), 80); return () => clearTimeout(t); }, [pct]);
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#475569", fontFamily: "var(--mono)", marginBottom: 6 }}>
        <span>0%</span><span style={{ color: hex, fontWeight: 500 }}>{pct.toFixed(1)}%</span><span>100%</span>
      </div>
      <div style={{ position: "relative", height: 5, background: "#111c2e", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,#22c55e,#f59e0b 45%,#f97316 68%,#ef4444)", opacity: 0.15 }} />
        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${w}%`, background: hex, borderRadius: 999, boxShadow: `0 0 10px ${hex}99`, transition: "width .9s cubic-bezier(.23,1,.32,1)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#1e3a5f", fontFamily: "var(--mono)", marginTop: 4, letterSpacing: "0.05em" }}>
        <span>LOW</span><span>MEDIUM</span><span>HIGH</span><span>CRITICAL</span>
      </div>
    </div>
  );
}

function Pill({ label, value, accent }) {
  return (
    <div style={{ flex: 1, background: "#050d19", borderRadius: 10, padding: "11px 12px", textAlign: "center", borderTop: `2px solid ${accent || "#1e3a5f"}` }}>
      <div style={{ fontSize: 9, color: "#334155", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--mono)", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 700, color: accent || "#e2e8f0", fontFamily: "var(--display)", letterSpacing: "-0.02em" }}>{value}</div>
    </div>
  );
}

function Field({ label, hint, ...props }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 10, color: "#334155", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--mono)", marginBottom: 6 }}>{label}</label>
      <input {...props} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ width: "100%", background: "#030810", border: `1px solid ${focus ? "#2563eb" : "#111c2e"}`, borderRadius: 9, padding: "11px 13px", color: "#e2e8f0", fontSize: 14, fontFamily: "var(--mono)", outline: "none", transition: "border-color .18s, box-shadow .18s", boxShadow: focus ? "0 0 0 3px #2563eb14" : "none" }}
      />
      {hint && <div style={{ fontSize: 10, color: "#1e3a5f", marginTop: 5, fontFamily: "var(--mono)", lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

const TT = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "#080f1c", border: "1px solid #111c2e", borderRadius: 8, padding: "9px 13px", fontSize: 11, fontFamily: "var(--mono)", boxShadow: "0 8px 32px #00000080" }}>
      <div style={{ color: "#cbd5e1", fontWeight: 500, marginBottom: 3 }}>{d.feature}</div>
      <div style={{ color: d.impact > 0 ? "#f87171" : "#4ade80" }}>{d.impact > 0 ? "+" : ""}{d.impact.toFixed(4)}</div>
      <div style={{ color: "#334155", marginTop: 2, fontSize: 10 }}>{d.type === "rule" ? "business rule" : "ml signal"}</div>
    </div>
  );
};

const Trigger = ({ text }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#110500", border: "1px solid #f9731618", borderLeft: "3px solid #f97316", borderRadius: 8, padding: "9px 14px", fontSize: 12, color: "#fdba74", fontFamily: "var(--mono)" }}>
    <span style={{ color: "#f97316", fontSize: 9 }}>◆</span>{text}
  </div>
);

const ExCard = ({ feature, impact, type }) => {
  const up = impact > 0;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 9, background: up ? "#0f0200" : "#000f05", border: `1px solid ${up ? "#ef444418" : "#22c55e18"}`, borderRadius: 9, padding: "9px 13px" }}>
      <span style={{ color: up ? "#f87171" : "#4ade80", fontSize: 11, marginTop: 1, flexShrink: 0 }}>{up ? "▲" : "▼"}</span>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, lineHeight: 1.5 }}>
        <span style={{ color: up ? "#fca5a5" : "#86efac", fontWeight: 500 }}>{feature}</span>
        <span style={{ color: "#334155", marginLeft: 7 }}>{up ? "increasing risk" : "reducing risk"}</span>
        {type === "rule" && <span style={{ marginLeft: 7, fontSize: 9, background: "#111c2e", color: "#475569", padding: "1px 5px", borderRadius: 3 }}>rule</span>}
      </div>
    </div>
  );
};

const API_URL = "https://fraud-backend-wsgp.onrender.com";

export default function App() {
  const [token, setToken]   = useState(() => localStorage.getItem("fg_token") || "");
  const [email, setEmail]   = useState(() => localStorage.getItem("fg_email") || "");
  const [tab, setTab]       = useState("analyze"); // "analyze" | "history"

  const handleLogin = (t, e) => { setToken(t); setEmail(e); };
  const handleLogout = () => {
    localStorage.removeItem("fg_token");
    localStorage.removeItem("fg_email");
    setToken(""); setEmail("");
    setResult(null); setExpls([]); setRuleExpls([]);
  };

  const [amount, setAmount]       = useState("");
  const [time, setTime]           = useState("");
  const [txns, setTxns]           = useState("");
  const [intl, setIntl]           = useState(false);
  const [result, setResult]       = useState(null);
  const [expls, setExpls]         = useState([]);
  const [ruleExpls, setRuleExpls] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [ready, setReady]         = useState(false);

  useEffect(() => { setTimeout(() => setReady(true), 80); }, []);

  if (!token) return <><FontLoader /><AuthPage onLogin={handleLogin} /></>;

  const loadSample = (type) => {
    if (type === "normal") { setAmount("450"); setTime("14"); setTxns("3"); setIntl(false); }
    else { setAmount("85000"); setTime("2"); setTxns("25"); setIntl(true); }
    setResult(null); setExpls([]); setRuleExpls([]);
  };

  const authHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,   
  };

  const analyze = async () => {
    if (!amount || !time || !txns) return;
    setLoading(true);
    try {
      const body = { amount: +amount, time: +time, transactions_last_hour: +txns, is_international: intl };
      const [pr, er] = await Promise.all([
        fetch(`${API_URL}/predict`, { method: "POST", headers: authHeaders, body: JSON.stringify(body) }),
        fetch(`${API_URL}/explain`, { method: "POST", headers: authHeaders, body: JSON.stringify(body) }),
      ]);

      if (pr.status === 401) { handleLogout(); return; }

      const pd = await pr.json(), ed = await er.json();
      setResult(pd);
      setExpls(ed.explanations || []);
      setRuleExpls(ed.rule_explanations || []);
    } catch { alert("Backend not reachable."); }
    setLoading(false);
  };

  const tier = result ? getTier(result.probability) : null;
  const rc   = tier ? RISK[tier] : null;
  const chart = expls.slice(0, 8);

  return (
    <>
      <FontLoader />
      <style>{`
        :root { --mono:"DM Mono",monospace; --display:"Syne",sans-serif; }
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#030810}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.35}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
      `}</style>

      <div style={{ minHeight: "100vh", background: "#030810", color: "#e2e8f0", fontFamily: "var(--mono)", opacity: ready ? 1 : 0, transition: "opacity .4s" }}>

        {/* HEADER */}
        <header style={{ borderBottom: "1px solid #0a1628", height: 58, padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#03081099", backdropFilter: "blur(12px)", zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: "linear-gradient(135deg,#1e40af,#6d28d9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🛡</div>
            <div>
              <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 14, letterSpacing: "-.01em", color: "#f1f5f9" }}>FraudGuard AI</div>
              <div style={{ fontSize: 9, color: "#1e3a5f", letterSpacing: ".08em" }}>REAL-TIME TRANSACTION RISK ENGINE</div>
            </div>
          </div>

          {/* Right side — status + user + logout */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 10, color: "#1e3a5f", letterSpacing: ".05em" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", display: "inline-block", animation: "blink 2.2s infinite" }} />
              SYSTEM ONLINE
            </div>
            <div style={{ fontSize: 10, color: "#334155" }}>{email}</div>
            <button onClick={handleLogout}
              style={{ background: "transparent", border: "1px solid #1e3a5f", borderRadius: 7, padding: "5px 12px", color: "#475569", fontSize: 10, fontFamily: "var(--mono)", cursor: "pointer", letterSpacing: ".05em", transition: "all .15s" }}
              onMouseEnter={(e) => { e.target.style.borderColor = "#ef4444"; e.target.style.color = "#f87171"; }}
              onMouseLeave={(e) => { e.target.style.borderColor = "#1e3a5f"; e.target.style.color = "#475569"; }}>
              LOGOUT
            </button>
          </div>
        </header>

        <main style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 22px" }}>

          {/* TAB NAV */}
          <div style={{ display: "flex", gap: 4, marginBottom: 28, background: "#060d1a", border: "1px solid #0a1628", borderRadius: 11, padding: 4, width: "fit-content" }}>
            {[
              { key: "analyze", label: "◎  Analyze" },
              { key: "history", label: "▤  History" },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: tab === key ? "#0f1e30" : "transparent", color: tab === key ? "#e2e8f0" : "#334155", fontSize: 11, fontFamily: "var(--mono)", cursor: "pointer", letterSpacing: ".05em", transition: "all .15s" }}>
                {label}
              </button>
            ))}
          </div>

          {/* HISTORY TAB */}
          {tab === "history" && <HistoryPage token={token} />}

          {/* ANALYZE TAB */}
          {tab === "analyze" && (
            <>
              {/* SAMPLE ROW */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26 }}>
                <span style={{ fontSize: 9, color: "#1e3a5f", letterSpacing: ".1em" }}>QUICK TEST</span>
                {[
                  { key: "normal",     label: "● Normal",     color: "#22c55e" },
                  { key: "suspicious", label: "■ Suspicious", color: "#ef4444" },
                ].map(({ key, label, color }) => (
                  <button key={key} onClick={() => loadSample(key)}
                    style={{ background: "transparent", border: `1px solid ${color}30`, borderRadius: 999, padding: "5px 13px", color, fontSize: 10, fontFamily: "var(--mono)", cursor: "pointer", letterSpacing: ".03em", transition: "background .15s" }}
                    onMouseEnter={(e) => { e.target.style.background = `${color}12`; }}
                    onMouseLeave={(e) => { e.target.style.background = "transparent"; }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* TWO-COLUMN GRID */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

                {/* INPUT */}
                <div style={{ background: "#060d1a", border: "1px solid #0a1628", borderRadius: 15, padding: "26px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
                    <span style={{ fontSize: 9, color: "#1e3a5f", letterSpacing: ".12em", textTransform: "uppercase" }}>Transaction Details</span>
                    <div style={{ flex: 1, height: 1, background: "#0a1628" }} />
                  </div>
                  <Field label="Transaction Amount (₹)" hint="Amounts above ₹5,000 activate higher-risk checks" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  <Field label="Hour of Day  (0–23)" hint="0 = midnight · 14 = 2 PM · late night raises suspicion" type="number" placeholder="14" min="0" max="23" value={time} onChange={(e) => setTime(e.target.value)} />
                  <Field label="Transactions in Last Hour" hint="Frequency above 10/hr signals card testing behaviour" type="number" placeholder="5" value={txns} onChange={(e) => setTxns(e.target.value)} />

                  <div onClick={() => setIntl(!intl)}
                    style={{ display: "flex", alignItems: "center", gap: 12, background: "#030810", border: `1px solid ${intl ? "#2563eb40" : "#0a1628"}`, borderRadius: 9, padding: "11px 13px", cursor: "pointer", marginBottom: 18, transition: "border-color .15s" }}>
                    <div style={{ width: 15, height: 15, borderRadius: 4, border: `1.5px solid ${intl ? "#3b82f6" : "#1e3a5f"}`, background: intl ? "#3b82f6" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s", fontSize: 10, color: "#fff" }}>
                      {intl && "✓"}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "#cbd5e1" }}>International Transaction</div>
                      <div style={{ fontSize: 10, color: "#1e3a5f", marginTop: 2 }}>Cross-border payments carry additional risk weighting</div>
                    </div>
                  </div>

                  <button onClick={analyze} disabled={loading}
                    style={{ width: "100%", padding: "13px", borderRadius: 11, border: "none", background: loading ? "#0a1628" : "linear-gradient(135deg,#1d4ed8,#6d28d9)", color: loading ? "#334155" : "#fff", fontSize: 12, fontWeight: 600, fontFamily: "var(--display)", letterSpacing: ".04em", cursor: loading ? "not-allowed" : "pointer", transition: "all .2s", boxShadow: loading ? "none" : "0 4px 20px #1d4ed828" }}>
                    {loading ? "ANALYZING  ···" : "ANALYZE TRANSACTION"}
                  </button>
                </div>

                {/* RESULT */}
                <div style={{ background: rc ? rc.bg : "#060d1a", border: `1px solid ${rc ? rc.hex + "25" : "#0a1628"}`, borderRadius: 15, padding: "26px 24px", transition: "all .4s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
                    <span style={{ fontSize: 9, color: "#1e3a5f", letterSpacing: ".12em", textTransform: "uppercase" }}>Risk Analysis</span>
                    <div style={{ flex: 1, height: 1, background: rc ? rc.hex + "20" : "#0a1628" }} />
                  </div>

                  {result ? (
                    <div style={{ animation: "fadeUp .35s ease" }}>
                      <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 30, color: rc.hex, letterSpacing: "-.03em", display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span style={{ filter: `drop-shadow(0 0 8px ${rc.hex}88)` }}>{rc.symbol}</span>
                        {rc.label}
                      </div>
                      <div style={{ fontSize: 9, color: "#334155", letterSpacing: ".1em" }}>FRAUD PROBABILITY SCORE</div>
                      <Gauge probability={result.probability} />
                      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                        <Pill label="Final Score" value={<AnimatedPct value={result.probability * 100} />} accent={rc.hex} />
                        <Pill label="ML Score"    value={`${(result.ml_score * 100).toFixed(1)}%`}        accent="#3b82f6" />
                        <Pill label="Rule Boost"  value={`+${(result.rule_boost * 100).toFixed(1)}%`}     accent="#7c3aed" />
                      </div>
                      {ruleExpls.length > 0 && (
                        <div style={{ marginTop: 20 }}>
                          <div style={{ fontSize: 9, color: "#334155", letterSpacing: ".1em", marginBottom: 8 }}>RISK TRIGGERS DETECTED</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {ruleExpls.map((r, i) => <Trigger key={i} text={r.feature} />)}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 190, textAlign: "center" }}>
                      <div style={{ fontSize: 34, opacity: .12, marginBottom: 12 }}>◎</div>
                      <div style={{ fontSize: 11, color: "#0a1628" }}>Enter details and click Analyze</div>
                      <div style={{ fontSize: 10, color: "#070e1b", marginTop: 3 }}>or choose a quick test above</div>
                    </div>
                  )}
                </div>
              </div>

              {/* SHAP CHART */}
              {expls.length > 0 && (
                <div style={{ background: "#060d1a", border: "1px solid #0a1628", borderRadius: 15, padding: "26px 24px", marginTop: 18, animation: "fadeUp .4s .1s both" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                    <div>
                      <div style={{ fontSize: 9, color: "#1e3a5f", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 4 }}>Feature Impact  ·  SHAP + Business Rules</div>
                      <div style={{ fontSize: 10, color: "#0f1e30" }}>Sorted by absolute contribution magnitude</div>
                    </div>
                    <div style={{ display: "flex", gap: 14, fontSize: 10, color: "#334155" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: 2, background: "#ef4444", display: "inline-block" }} /> RISK</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: 2, background: "#22c55e", display: "inline-block" }} /> SAFE</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chart} layout="vertical" margin={{ left: 145, right: 20, top: 2, bottom: 2 }}>
                      <XAxis type="number" stroke="#0a1628" tick={{ fontSize: 9, fill: "#1e3a5f", fontFamily: "var(--mono)" }} axisLine={{ stroke: "#0a1628" }} tickLine={false} />
                      <YAxis type="category" dataKey="feature" width={138} tick={{ fontSize: 10, fill: "#64748b", fontFamily: "var(--mono)" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<TT />} cursor={{ fill: "#ffffff03" }} />
                      <ReferenceLine x={0} stroke="#111c2e" strokeWidth={1} />
                      <Bar dataKey="impact" radius={[0, 4, 4, 0]} maxBarSize={20}>
                        {chart.map((e, i) => <Cell key={i} fill={e.impact > 0 ? "#ef4444" : "#22c55e"} fillOpacity={0.88} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* AI EXPLANATION */}
              {expls.length > 0 && (
                <div style={{ background: "#060d1a", border: "1px solid #0a1628", borderRadius: 15, padding: "26px 24px", marginTop: 18, animation: "fadeUp .4s .2s both" }}>
                  <div style={{ fontSize: 9, color: "#1e3a5f", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 16 }}>AI Decision Explanation</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                    {expls.filter((e) => Math.abs(e.impact) > 0.01).slice(0, 8).map((e, i) => <ExCard key={i} {...e} />)}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 28, textAlign: "center", fontSize: 9, color: "#070e1b", letterSpacing: ".06em" }}>
                FRAUDGUARD AI · ENSEMBLE ML + BUSINESS RULES · DEMONSTRATION BUILD
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}