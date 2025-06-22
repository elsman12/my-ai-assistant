"use client";

import React from "react";
import { supabase } from "../supabaseClient";

export default function SignIn() {
  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
    if (error) alert(error.message);
  };

  return (
    <div style={{ padding: 20 }}>
      <button
        onClick={handleSignIn}
        style={{
          padding: '10px 20px',
          backgroundColor: '#3a8bfd',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontWeight: '600',
        }}
      >
        Войти через Google
      </button>
    </div>
  );
}
