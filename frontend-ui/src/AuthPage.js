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
    <div style={{ minHeight: "100vh", background: "#030810", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: '"DM Mono", monospace', padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#1e40af,#6d28d9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 16px" }}>🛡</div>
          <div style={{ fontFamily: '"Syne", sans-serif', fontWeight: 800, fontSize: 22, color: "#f1f5f9", letterSpacing: "-.02em" }}>FraudGuard AI</div>
          <div style={{ fontSize: 10, color: "#1e3a5f", letterSpacing: ".1em", marginTop: 4 }}>REAL-TIME TRANSACTION RISK ENGINE</div>
        </div>

        <div style={{ background: "#060d1a", border: "1px solid #0a1628", borderRadius: 16, padding: "32px 28px" }}>

          <div style={{ display: "flex", background: "#030810", borderRadius: 10, padding: 4, marginBottom: 28 }}>
            {["login", "register"].map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                style={{ flex: 1, padding: "9px", borderRadius: 7, border: "none", background: mode === m ? "#0f1e30" : "transparent", color: mode === m ? "#e2e8f0" : "#334155", fontSize: 11, fontFamily: '"DM Mono", monospace', cursor: "pointer", letterSpacing: ".06em", textTransform: "uppercase", transition: "all .15s" }}>
                {m}
              </button>
            ))}
          </div>

          {mode === "register" && (
            <AuthField label="Full Name" type="text" placeholder="Sourav Yadav" value={name} onChange={setName} onKey={onKey} />
          )}
          <AuthField label="Email" type="email" placeholder="you@email.com" value={email} onChange={setEmail} onKey={onKey} />
          <AuthField label="Password" type="password" placeholder="••••••••" value={password} onChange={setPass} onKey={onKey} />

          {error && (
            <div style={{ background: "#1a0000", border: "1px solid #ef444430", borderRadius: 8, padding: "10px 13px", fontSize: 11, color: "#f87171", marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button onClick={submit} disabled={loading}
            style={{ width: "100%", padding: "13px", borderRadius: 11, border: "none", background: loading ? "#0a1628" : "linear-gradient(135deg,#1d4ed8,#6d28d9)", color: loading ? "#334155" : "#fff", fontSize: 12, fontWeight: 600, fontFamily: '"Syne", sans-serif', letterSpacing: ".04em", cursor: loading ? "not-allowed" : "pointer", transition: "all .2s", boxShadow: loading ? "none" : "0 4px 20px #1d4ed828", marginTop: 4 }}>
            {loading ? "PLEASE WAIT  ···" : mode === "login" ? "LOGIN" : "CREATE ACCOUNT"}
          </button>
        </div>

        <div style={{ textAlign: "center", fontSize: 9, color: "#070e1b", letterSpacing: ".06em", marginTop: 24 }}>
          FRAUDGUARD AI · SECURE AUTHENTICATION
        </div>
      </div>
    </div>
  );
}

function AuthField({ label, type, placeholder, value, onChange, onKey }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 10, color: "#334155", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKey}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{ width: "100%", background: "#030810", border: `1px solid ${focus ? "#2563eb" : "#111c2e"}`, borderRadius: 9, padding: "11px 13px", color: "#e2e8f0", fontSize: 14, fontFamily: '"DM Mono", monospace', outline: "none", transition: "border-color .18s, box-shadow .18s", boxShadow: focus ? "0 0 0 3px #2563eb14" : "none" }}
      />
    </div>
  );
}