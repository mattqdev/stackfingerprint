"use client";
import { useState } from "react";
import { Lockup, Viewfinder } from "../../components/brand/Brand";

export default function AdminLogin({ configured }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) window.location.reload();
    else {
      setError("Wrong password");
      setBusy(false);
    }
  };

  return (
    <>
      <div className="sf-canvas" aria-hidden="true" />
      <main className="sf-shell sf-admin-login">
        <Lockup size={38} />
        <Viewfinder>
          <form className="sf-tile sf-admin-login-box" onSubmit={submit}>
            <span className="sf-label">Admin access</span>
            {configured ? (
              <>
                <input
                  className="sf-admin-input"
                  type="password"
                  autoFocus
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button className="sf-btn sf-btn-primary" disabled={busy}>
                  {busy ? "Checking…" : "Enter"}
                </button>
                {error && <p className="sf-admin-error">{error}</p>}
              </>
            ) : (
              <p className="sf-body">
                Set <code>ADMIN_PASSWORD</code> in the environment to enable the
                dashboard.
              </p>
            )}
          </form>
        </Viewfinder>
      </main>
    </>
  );
}
