import React, { useState } from "react";

const API_URL = "https://fraud-backend-wsgp.onrender.com";

export default function AuthPage({ onLogin }) {
  const [mode, setMode]       = useState("login");
  const [email, setEmail]     = useState("");
  const [password, setPass]   = useState("");
  const [name, setName]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const submit = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const body     = mode === "login"
        ? { email, password }
        : { email, password, full_name: name };

      const res  = await fetch(`${API_URL}${endpoint}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Something went wrong.");
      } else {
        localStorage.setItem("fg_token", data.access_token);
        localStorage.setItem("fg_email", email);
        onLogin(data.access_token, email);
      }
    } catch {
      setError("Cannot reach backend. Make sure the server is running.");
    }
    setLoading(false);
  };

  const onKey = (e) => { if (e.key === "Enter") submit(); };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", padding: 20, color: "var(--ink)" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* letterhead */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 54, height: 54, borderRadius: "50%", border: "2px solid var(--ink)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, fontFamily: "var(--serif)", fontWeight: 800, color: "var(--ink)",
            margin: "0 auto 16px",
          }}>FG</div>
          <div style={{ fontFamily: "var(--serif)", fontWeight: 700, fontSize: 22, color: "var(--ink)", letterSpacing: "-.01em" }}>FraudGuard</div>
          <div style={{ fontSize: 10, color: "var(--ink-soft)", letterSpacing: ".1em", marginTop: 4 }}>ANALYST ACCESS · CASE INTAKE DESK</div>
        </div>

        {/* folder tabs */}
        <div style={{ display: "flex", width: "fit-content", margin: "0 auto" }}>
          {[
            { key: "login",    label: "Sign In" },
            { key: "register", label: "Register" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => { setMode(key); setError(""); }}
              style={{
                padding: "9px 24px", border: "1px solid var(--rule)",
                borderBottom: mode === key ? "1px solid var(--paper2)" : "1px solid var(--rule)",
                background: mode === key ? "var(--paper2)" : "var(--paper3)",
                color: mode === key ? "var(--ink)" : "var(--ink-soft)",
                fontSize: 11, fontFamily: "var(--serif)", fontWeight: 600, cursor: "pointer",
                letterSpacing: ".02em", marginBottom: -1, position: "relative",
                zIndex: mode === key ? 2 : 1, transition: "all .15s",
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* the form card itself, attached under the tabs */}
        <div style={{ background: "var(--paper2)", border: "1px solid var(--rule)", padding: "30px 28px" }}>

          {mode === "register" && (
            <AuthField label="Full Name" type="text" placeholder="Sourav Yadav" value={name} onChange={setName} onKey={onKey} />
          )}
          <AuthField label="Email" type="email" placeholder="you@email.com" value={email} onChange={setEmail} onKey={onKey} />
          <AuthField label="Password" type="password" placeholder="••••••••" value={password} onChange={setPass} onKey={onKey} />

          {error && (
            <div style={{ background: "var(--red-bg)", borderLeft: "3px solid var(--red)", padding: "10px 13px", fontSize: 11, color: "var(--red)", marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button onClick={submit} disabled={loading}
            style={{
              width: "100%", padding: "13px", border: "none",
              background: loading ? "var(--paper3)" : "var(--ink)",
              color: loading ? "var(--ink-faint)" : "var(--paper2)",
              fontSize: 12, fontWeight: 700, fontFamily: "var(--serif)", letterSpacing: ".03em",
              textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer",
              transition: "all .15s", boxShadow: loading ? "none" : "4px 4px 0 var(--rule)",
              marginTop: 4,
            }}
            onMouseDown={(e) => { if (!loading) e.target.style.boxShadow = "1px 1px 0 var(--rule)"; }}
            onMouseUp={(e) => { if (!loading) e.target.style.boxShadow = "4px 4px 0 var(--rule)"; }}>
            {loading ? "Please wait ···" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </div>

        <div style={{ textAlign: "center", fontSize: 9, color: "var(--ink-faint)", letterSpacing: ".06em", marginTop: 24 }}>
          FRAUDGUARD · SECURE AUTHENTICATION
        </div>
      </div>
    </div>
  );
}

function AuthField({ label, type, placeholder, value, onChange, onKey }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 10, color: "var(--ink-soft)", letterSpacing: ".1em", textTransform: "uppercase", fontFamily: "var(--mono)", marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKey}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          width: "100%", background: "transparent", border: "none",
          borderBottom: `1.5px solid ${focus ? "var(--ink)" : "var(--rule)"}`,
          padding: "8px 2px", color: "var(--ink)", fontSize: 14, fontFamily: "var(--mono)",
          outline: "none", transition: "border-color .18s",
        }}
      />
    </div>
  );
}