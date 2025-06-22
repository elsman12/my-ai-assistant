'use client';

import React, { useState } from "react";
import { supabase } from "../supabaseClient";

// Укажи здесь разрешённый email для доступа!
const ALLOWED_EMAIL = "esmakova936@gmail.com";

export default function EmailAuth({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    let result;
    if (isRegister) {
      result = await supabase.auth.signUp({ email, password });
    } else {
      result = await supabase.auth.signInWithPassword({ email, password });
    }
    setLoading(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    // Только разрешённый email
    if (result.data?.user?.email !== ALLOWED_EMAIL) {
      setError("Нет доступа. Только для владельца!");
      await supabase.auth.signOut();
      return;
    }

    setUser(result.data.user);
  };

  return (
    <div style={{ maxWidth: 340, margin: "120px auto", background: "#fff", padding: 28, borderRadius: 12, boxShadow: "0 2px 12px #0001" }}>
      <h2 style={{ marginBottom: 20, textAlign: "center" }}>{isRegister ? "Регистрация" : "Вход"} по Email</h2>
      <form onSubmit={handleAuth}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ width: "100%", padding: 10, marginBottom: 10, borderRadius: 6, border: "1px solid #ddd" }}
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ width: "100%", padding: 10, marginBottom: 16, borderRadius: 6, border: "1px solid #ddd" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 6,
            border: "none",
            background: "#3a8bfd",
            color: "#fff",
            fontWeight: 600,
            marginBottom: 10,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "..." : isRegister ? "Зарегистрироваться" : "Войти"}
        </button>
      </form>
      <div style={{ textAlign: "center", marginBottom: 6 }}>
        <button
          onClick={() => { setIsRegister(r => !r); setError(""); }}
          style={{
            background: "none",
            border: "none",
            color: "#3a8bfd",
            textDecoration: "underline",
            cursor: "pointer",
            padding: 0,
            fontSize: 15
          }}
        >
          {isRegister ? "У меня уже есть аккаунт" : "Зарегистрироваться"}
        </button>
      </div>
      {error && <div style={{ color: "#d32f2f", textAlign: "center" }}>{error}</div>}
    </div>
  );
}
