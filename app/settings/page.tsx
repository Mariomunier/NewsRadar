// app/settings/page.tsx
"use client";
import { useEffect, useState } from "react";

export default function IndstillingerSide() {
  const [tema, setTema] = useState<"dark" | "light">("dark");
  const [email, setEmail] = useState("");
  const [bruger, setBruger] = useState<string | null>(null);

  useEffect(() => {
    const gemt = (localStorage.getItem("theme") as "dark" | "light") || "dark";
    setTema(gemt);
    document.documentElement.classList.toggle("dark", gemt === "dark");
    document.documentElement.classList.toggle("light", gemt === "light");
    const u = localStorage.getItem("user_email");
    if (u) setBruger(u);
  }, []);

  const vælg = (m: "dark" | "light") => {
    setTema(m);
    localStorage.setItem("theme", m);
    document.documentElement.classList.toggle("dark", m === "dark");
    document.documentElement.classList.toggle("light", m === "light");
  };

  const login = () => {
    if (!email.trim()) return;
    localStorage.setItem("user_email", email.trim());
    setBruger(email.trim());
    setEmail("");
  };
  const logout = () => {
    localStorage.removeItem("user_email");
    setBruger(null);
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
          {bruger ? (
            <div className="space-y-2">
              <div className="text-sm">Logget ind som <b>{bruger}</b></div>
              <button className="btn" onClick={logout}>Log ud</button>
            </div>
          ) : (
            <div className="space-y-2">
              <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button className="btn" onClick={login}>Log ind</button>
              <div className="text-xs text-slate-400">(Demo – kan senere skiftes til Supabase Auth)</div>
            </div>
          )}
        </div>

        <div className="card p-4">
          <div className="font-medium mb-2">Tema</div>
          <div className="flex items-center gap-2">
            <button className={`btn ${tema === "dark" ? "ring-2 ring-blue-500" : ""}`} onClick={() => vælg("dark")}>
              Mørkt
            </button>
            <button className={`btn ${tema === "light" ? "ring-2 ring-blue-500" : ""}`} onClick={() => vælg("light")}>
              Lyst
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

