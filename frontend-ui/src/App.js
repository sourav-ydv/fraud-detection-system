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
    link.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700;9..144,900&family=IBM+Plex+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);
  return null;
};

const GlobalStyle = () => (
  <style>{`
    :root{
      --paper:#EAE2CE;
      --paper2:#F6F1E3;
      --paper3:#DED2B0;
      --ink:#23201A;
      --ink-soft:#6E6452;
      --ink-faint:#A2967D;
      --rule:#C9B98E;
      --green:#33522F;
      --green-bg:#E9EEDF;
      --amber:#86591A;
      --amber-bg:#F3E9D2;
      --orange:#9C4A1C;
      --orange-bg:#F1E0CC;
      --red:#8A2424;
      --red-bg:#F1DDD6;
      --serif:"Fraunces",serif;
      --mono:"IBM Plex Mono",monospace;
    }
    *{box-sizing:border-box}
    body{
      margin:0;
      background-color:var(--paper);
      background-image:
        radial-gradient(circle at 1px 1px, rgba(35,32,26,0.05) 1px, transparent 0);
      background-size:4px 4px;
    }
    input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}
    @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    @keyframes stampIn{0%{opacity:0;transform:scale(1.5) rotate(-14deg)}60%{opacity:1}100%{opacity:1;transform:scale(1) rotate(-4deg)}}
  `}</style>
);

const RISK = {
  LOW:      { label: "Cleared",      verdict: "CLEARED",  symbol: "✓", ink: "var(--green)",  bg: "var(--green-bg)"  },
  MEDIUM:   { label: "Needs Review", verdict: "REVIEW",   symbol: "△", ink: "var(--amber)",  bg: "var(--amber-bg)"  },
  HIGH:     { label: "Flagged",      verdict: "FLAGGED",  symbol: "◇", ink: "var(--orange)", bg: "var(--orange-bg)" },
  CRITICAL: { label: "Blocked",      verdict: "BLOCKED",  symbol: "✕", ink: "var(--red)",    bg: "var(--red-bg)"    },
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
  const { ink } = RISK[tier];
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct), 80); return () => clearTimeout(t); }, [pct]);
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--ink-soft)", fontFamily: "var(--mono)", marginBottom: 7 }}>
        <span>0</span><span style={{ color: ink, fontWeight: 600 }}>{pct.toFixed(1)}%</span><span>100</span>
      </div>
      <div style={{ position: "relative", height: 14, background: "var(--paper)", border: "1px solid var(--rule)" }}>
        {[25, 50, 75].map((m) => (
          <div key={m} style={{ position: "absolute", left: `${m}%`, top: 0, bottom: 0, width: 1, background: "var(--rule)" }} />
        ))}
        <div style={{ position: "absolute", top: 1, left: 1, bottom: 1, width: `calc(${w}% - 2px)`, background: ink, transition: "width .9s cubic-bezier(.23,1,.32,1)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--ink-faint)", fontFamily: "var(--mono)", marginTop: 4, letterSpacing: "0.08em" }}>
        <span>CLEARED</span><span>REVIEW</span><span>FLAGGED</span><span>BLOCKED</span>
      </div>
    </div>
  );
}

function Pill({ label, value, accent }) {
  return (
    <div style={{ flex: 1, background: "var(--paper2)", padding: "11px 12px", textAlign: "center", borderTop: `3px solid ${accent || "var(--rule)"}` }}>
      <div style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--mono)", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 700, color: accent || "var(--ink)", fontFamily: "var(--serif)", letterSpacing: "-0.01em" }}>{value}</div>
    </div>
  );
}

function Field({ label, hint, ...props }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 10, color: "var(--ink-soft)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--mono)", marginBottom: 6 }}>{label}</label>
      <input {...props} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1.5px solid ${focus ? "var(--ink)" : "var(--rule)"}`, borderRadius: 0, padding: "8px 2px", color: "var(--ink)", fontSize: 14, fontFamily: "var(--mono)", outline: "none", transition: "border-color .18s" }}
      />
      {hint && <div style={{ fontSize: 10, color: "var(--ink-faint)", marginTop: 5, fontFamily: "var(--mono)", lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

const TT = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "var(--paper2)", border: "1px solid var(--rule)", padding: "9px 13px", fontSize: 11, fontFamily: "var(--mono)", boxShadow: "3px 3px 0 var(--rule)" }}>
      <div style={{ color: "var(--ink)", fontWeight: 500, marginBottom: 3 }}>{d.feature}</div>
      <div style={{ color: d.impact > 0 ? "var(--red)" : "var(--green)" }}>{d.impact > 0 ? "+" : ""}{d.impact.toFixed(4)}</div>
      <div style={{ color: "var(--ink-faint)", marginTop: 2, fontSize: 10 }}>{d.type === "rule" ? "business rule" : "ml signal"}</div>
    </div>
  );
};

const Trigger = ({ text }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--orange-bg)", borderLeft: "3px solid var(--orange)", padding: "9px 14px", fontSize: 12, color: "var(--ink)", fontFamily: "var(--mono)" }}>
    <span style={{ color: "var(--orange)", fontSize: 11 }}>◇</span>{text}
  </div>
);

const ExCard = ({ feature, impact, type }) => {
  const up = impact > 0;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 9, background: "var(--paper2)", borderLeft: `3px solid ${up ? "var(--red)" : "var(--green)"}`, padding: "9px 13px" }}>
      <span style={{ color: up ? "var(--red)" : "var(--green)", fontSize: 11, marginTop: 2, flexShrink: 0, fontFamily: "var(--mono)" }}>{up ? "+" : "−"}</span>
      <div style={{ fontSize: 11, lineHeight: 1.5 }}>
        <span style={{ color: "var(--ink)", fontWeight: 600, fontFamily: "var(--mono)" }}>{feature}</span>
        <span style={{ color: "var(--ink-soft)", marginLeft: 7, fontFamily: "var(--serif)", fontStyle: "italic" }}>{up ? "raised the risk" : "lowered the risk"}</span>
        {type === "rule" && <span style={{ marginLeft: 7, fontSize: 9, background: "var(--paper3)", color: "var(--ink-soft)", padding: "1px 5px" }}>rule</span>}
      </div>
    </div>
  );
};

function StampVerdict({ tier }) {
  const r = RISK[tier];
  return (
    <div style={{ display: "inline-block", transform: "rotate(-4deg)", animation: "stampIn .5s cubic-bezier(.2,1.4,.4,1)" }}>
      <div style={{
        border: `3px solid ${r.ink}`, color: r.ink, fontFamily: "var(--serif)", fontWeight: 800,
        fontSize: 26, letterSpacing: "0.08em", padding: "6px 20px", textTransform: "uppercase",
        boxShadow: `0 0 0 1px ${r.ink} inset`, position: "relative",
      }}>
        <span style={{ marginRight: 10 }}>{r.symbol}</span>{r.verdict}
      </div>
    </div>
  );
}

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
  const [caseNo]                  = useState(() => `FG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);

  useEffect(() => { setTimeout(() => setReady(true), 80); }, []);

  if (!token) return <><FontLoader /><GlobalStyle /><AuthPage onLogin={handleLogin} /></>;

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
      <GlobalStyle />

      <div style={{ minHeight: "100vh", color: "var(--ink)", fontFamily: "var(--mono)", opacity: ready ? 1 : 0, transition: "opacity .4s" }}>

        {/* HEADER */}
        <header style={{ borderBottom: "1px solid var(--rule)", padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "var(--paper)", zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", border: "2px solid var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontFamily: "var(--serif)", fontWeight: 800, color: "var(--ink)", flexShrink: 0 }}>FG</div>
            <div>
              <div style={{ fontFamily: "var(--serif)", fontWeight: 700, fontSize: 17, letterSpacing: "-.01em", color: "var(--ink)" }}>FraudGuard</div>
              <div style={{ fontSize: 9, color: "var(--ink-soft)", letterSpacing: ".1em" }}>CASE INTAKE &amp; RISK ASSESSMENT DESK</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ fontSize: 10, color: "var(--ink-soft)", letterSpacing: ".05em", borderRight: "1px solid var(--rule)", paddingRight: 18 }}>
              FILE {caseNo}
            </div>
            <div style={{ fontSize: 10, color: "var(--ink-soft)" }}>{email}</div>
            <button onClick={handleLogout}
              style={{ background: "transparent", border: "1px solid var(--ink)", padding: "6px 13px", color: "var(--ink)", fontSize: 10, fontFamily: "var(--mono)", cursor: "pointer", letterSpacing: ".05em", transition: "all .15s" }}
              onMouseEnter={(e) => { e.target.style.background = "var(--ink)"; e.target.style.color = "var(--paper2)"; }}
              onMouseLeave={(e) => { e.target.style.background = "transparent"; e.target.style.color = "var(--ink)"; }}>
              Sign out
            </button>
          </div>
        </header>

        <main style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 22px" }}>

          {/* TAB NAV — folder tabs */}
          <div style={{ display: "flex", gap: 0, marginBottom: 0, width: "fit-content" }}>
            {[
              { key: "analyze", label: "Transaction Intake" },
              { key: "history", label: "Ledger" },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                style={{
                  padding: "10px 22px", border: "1px solid var(--rule)", borderBottom: tab === key ? "1px solid var(--paper2)" : "1px solid var(--rule)",
                  background: tab === key ? "var(--paper2)" : "var(--paper3)", color: tab === key ? "var(--ink)" : "var(--ink-soft)",
                  fontSize: 11, fontFamily: "var(--serif)", fontWeight: 600, cursor: "pointer", letterSpacing: ".02em",
                  marginBottom: -1, position: "relative", zIndex: tab === key ? 2 : 1, transition: "all .15s",
                }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ border: "1px solid var(--rule)", background: "var(--paper2)", padding: 22, marginBottom: 0 }}>

          {/* HISTORY TAB */}
          {tab === "history" && <HistoryPage token={token} />}

          {/* ANALYZE TAB */}
          {tab === "analyze" && (
            <>
              {/* SAMPLE ROW */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
                <span style={{ fontSize: 9, color: "var(--ink-soft)", letterSpacing: ".1em" }}>QUICK TEST CASE</span>
                {[
                  { key: "normal",     label: "Ordinary spend", color: "var(--green)" },
                  { key: "suspicious", label: "Suspicious spend", color: "var(--red)" },
                ].map(({ key, label, color }) => (
                  <button key={key} onClick={() => loadSample(key)}
                    style={{ background: "transparent", border: `1px solid ${color}`, padding: "5px 13px", color, fontSize: 10, fontFamily: "var(--mono)", cursor: "pointer", letterSpacing: ".02em", transition: "background .15s" }}
                    onMouseEnter={(e) => { e.target.style.background = `${color}1a`; }}
                    onMouseLeave={(e) => { e.target.style.background = "transparent"; }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* TWO-COLUMN GRID */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, border: "1px solid var(--rule)" }}>

                {/* INPUT */}
                <div style={{ background: "var(--paper2)", borderRight: "1px solid var(--rule)", padding: "26px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
                    <span style={{ fontSize: 9, color: "var(--ink-soft)", letterSpacing: ".12em", textTransform: "uppercase" }}>Transaction Details</span>
                    <div style={{ flex: 1, height: 1, background: "var(--rule)" }} />
                  </div>
                  <Field label="Transaction Amount (₹)" hint="Amounts above ₹5,000 activate higher-risk checks" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  <Field label="Hour of Day  (0–23)" hint="0 = midnight · 14 = 2 PM · late night raises suspicion" type="number" placeholder="14" min="0" max="23" value={time} onChange={(e) => setTime(e.target.value)} />
                  <Field label="Transactions in Last Hour" hint="Frequency above 10/hr signals card testing behaviour" type="number" placeholder="5" value={txns} onChange={(e) => setTxns(e.target.value)} />

                  <div onClick={() => setIntl(!intl)}
                    style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--rule)", padding: "11px 13px", cursor: "pointer", marginBottom: 20, transition: "border-color .15s" }}>
                    <div style={{ width: 15, height: 15, border: `1.5px solid var(--ink)`, background: intl ? "var(--ink)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s", fontSize: 10, color: "var(--paper2)" }}>
                      {intl && "✓"}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--ink)" }}>International Transaction</div>
                      <div style={{ fontSize: 10, color: "var(--ink-faint)", marginTop: 2 }}>Cross-border payments carry additional risk weighting</div>
                    </div>
                  </div>

                  <button onClick={analyze} disabled={loading}
                    style={{
                      width: "100%", padding: "13px", border: "none",
                      background: loading ? "var(--paper3)" : "var(--ink)", color: loading ? "var(--ink-faint)" : "var(--paper2)",
                      fontSize: 12, fontWeight: 700, fontFamily: "var(--serif)", letterSpacing: ".03em", textTransform: "uppercase",
                      cursor: loading ? "not-allowed" : "pointer", transition: "all .15s",
                      boxShadow: loading ? "none" : "4px 4px 0 var(--rule)",
                    }}
                    onMouseDown={(e) => { if (!loading) e.target.style.boxShadow = "1px 1px 0 var(--rule)"; }}
                    onMouseUp={(e) => { if (!loading) e.target.style.boxShadow = "4px 4px 0 var(--rule)"; }}>
                    {loading ? "Reviewing case ···" : "Assess Transaction"}
                  </button>
                </div>

                {/* RESULT */}
                <div style={{ background: rc ? rc.bg : "var(--paper2)", padding: "26px 24px", transition: "all .4s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
                    <span style={{ fontSize: 9, color: "var(--ink-soft)", letterSpacing: ".12em", textTransform: "uppercase" }}>Risk Assessment</span>
                    <div style={{ flex: 1, height: 1, background: "var(--rule)" }} />
                  </div>

                  {result ? (
                    <div style={{ animation: "fadeUp .35s ease" }}>
                      <StampVerdict tier={tier} />
                      <div style={{ fontSize: 9, color: "var(--ink-soft)", letterSpacing: ".1em", marginTop: 16 }}>FRAUD PROBABILITY SCORE</div>
                      <Gauge probability={result.probability} />
                      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                        <Pill label="Final Score" value={<AnimatedPct value={result.probability * 100} />} accent={rc.ink} />
                        <Pill label="ML Score"    value={`${(result.ml_score * 100).toFixed(1)}%`}    accent="var(--ink-soft)" />
                        <Pill label="Rule Boost"  value={`+${(result.rule_boost * 100).toFixed(1)}%`} accent="var(--ink-soft)" />
                      </div>
                      {ruleExpls.length > 0 && (
                        <div style={{ marginTop: 20 }}>
                          <div style={{ fontSize: 9, color: "var(--ink-soft)", letterSpacing: ".1em", marginBottom: 8 }}>RISK TRIGGERS DETECTED</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {ruleExpls.map((r, i) => <Trigger key={i} text={r.feature} />)}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 220, textAlign: "center" }}>
                      <div style={{ fontSize: 34, opacity: .25, marginBottom: 12, fontFamily: "var(--serif)", color: "var(--ink-faint)" }}>—</div>
                      <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>Fill in the form and assess the transaction</div>
                      <div style={{ fontSize: 10, color: "var(--ink-faint)", marginTop: 3 }}>or pick a quick test case above</div>
                    </div>
                  )}
                </div>
              </div>

              {/* SHAP CHART */}
              {expls.length > 0 && (
                <div style={{ background: "var(--paper2)", border: "1px solid var(--rule)", padding: "26px 24px", marginTop: 18, animation: "fadeUp .4s .1s both" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                    <div>
                      <div style={{ fontSize: 9, color: "var(--ink-soft)", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 4 }}>Feature Impact · SHAP + Business Rules</div>
                      <div style={{ fontSize: 10, color: "var(--ink-faint)" }}>Sorted by absolute contribution magnitude</div>
                    </div>
                    <div style={{ display: "flex", gap: 14, fontSize: 10, color: "var(--ink-soft)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 7, height: 7, background: "var(--red)", display: "inline-block" }} /> RISK</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 7, height: 7, background: "var(--green)", display: "inline-block" }} /> SAFE</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chart} layout="vertical" margin={{ left: 145, right: 20, top: 2, bottom: 2 }}>
                      <XAxis type="number" stroke="var(--rule)" tick={{ fontSize: 9, fill: "var(--ink-faint)", fontFamily: "var(--mono)" }} axisLine={{ stroke: "var(--rule)" }} tickLine={false} />
                      <YAxis type="category" dataKey="feature" width={138} tick={{ fontSize: 10, fill: "var(--ink-soft)", fontFamily: "var(--mono)" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<TT />} cursor={{ fill: "rgba(35,32,26,0.04)" }} />
                      <ReferenceLine x={0} stroke="var(--rule)" strokeWidth={1} />
                      <Bar dataKey="impact" radius={[0, 0, 0, 0]} maxBarSize={18}>
                        {chart.map((e, i) => <Cell key={i} fill={e.impact > 0 ? "#8A2424" : "#33522F"} fillOpacity={0.85} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* AI EXPLANATION */}
              {expls.length > 0 && (
                <div style={{ background: "var(--paper2)", border: "1px solid var(--rule)", padding: "26px 24px", marginTop: 18, animation: "fadeUp .4s .2s both" }}>
                  <div style={{ fontSize: 9, color: "var(--ink-soft)", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 16 }}>Assessor's Notes</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                    {expls.filter((e) => Math.abs(e.impact) > 0.01).slice(0, 8).map((e, i) => <ExCard key={i} {...e} />)}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 28, textAlign: "center", fontSize: 9, color: "var(--ink-faint)", letterSpacing: ".06em" }}>
                FRAUDGUARD · ENSEMBLE ML + BUSINESS RULES · DEMONSTRATION BUILD
              </div>
            </>
          )}
          </div>
        </main>
      </div>
    </>
  );
}