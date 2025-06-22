'use client';

import { useEffect, useState } from "react";
import { supabase } from './supabaseClient';
import EmailAuth from './components/EmailAuth';
import ChatPage from './components/ChatPage';

export default function Page() {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener?.unsubscribe();
  }, []);

  // ---- ЕСЛИ НЕ АВТОРИЗОВАН, показать кнопку входа или форму ----
  if (!user) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#f7f7f8'
      }}>
        {!showAuth ? (
          <button
            onClick={() => setShowAuth(true)}
            style={{
              padding: '18px 40px',
              fontSize: '22px',
              borderRadius: '12px',
              background: '#3a8bfd',
              color: '#fff',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 32px #0053b00f'
            }}
          >
            Войти через Email
          </button>
        ) : (
          <EmailAuth setUser={setUser} />
        )}
      </div>
    );
  }

  // ---- ЕСЛИ ВОШЁЛ, чат ----
  return <ChatPage user={user} setUser={setUser} />;
}
