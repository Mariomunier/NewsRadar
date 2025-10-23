// app/settings/page.tsx
"use client";

import { useEffect, useState } from "react";

function useTheme() {
  const [mode, setMode] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const saved = localStorage.getItem("theme") as "dark" | "light" | null;
    if (saved) setMode(saved);
    document.documentElement.classList.toggle("dark", (saved ?? "dark") === "dark");
    document.documentElement.classList.toggle("light", (saved ?? "dark") === "light");
  }, []);
  const toggle = (m: "dark" | "light") => {
    setMode(m);
    localStorage.setItem("theme", m);
    document.documentElement.classList.toggle("dark", m === "dark");
    document.documentElement.classList.toggle("light", m === "light");
  };
  return { mode, toggle };
}

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<string | null>(null);
  const { mode, toggle } = useTheme();

  useEffect(() => {
    const u = localStorage.getItem("user_email");
    if (u) setUser(u);
  }, []);

  const login = () => {
    if (!email.trim()) return;
    localStorage.setItem("user_email", email.trim());
    setUser(email.trim());
    setEmail("");
  };
  const logout = () => {
    localStorage.removeItem("user_email");
    setUser(null);
  };

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h1 className="text-xl font-semibold">Indstillinger</h1>
        <p className="text-sm text-slate-400">Log ind/ud og vælg farvetema.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-4">
          <div className="font-medium mb-2">Login</div>
          {user ? (
            <div className="space-y-2">
              <div className="text-sm">Logget ind som <b>{user}</b></div>
              <button className="btn" onClick={logout}>Log ud</button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                className="input"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="btn" onClick={login}>Log ind</button>
              <div className="text-xs text-slate-400">
                (Demo-login – kan senere erstattes med Supabase Auth)
              </div>
            </div>
          )}
        </div>

        <div className="card p-4">
          <div className="font-medium mb-2">Tema</div>
          <div className="flex items-center gap-2">
            <button
              className={`btn ${mode === "dark" ? "ring-2 ring-blue-500" : ""}`}
              onClick={() => toggle("dark")}
            >
              Mørkt
            </button>
            <button
              className={`btn ${mode === "light" ? "ring-2 ring-blue-500" : ""}`}
              onClick={() => toggle("light")}
            >
              Lyst
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
