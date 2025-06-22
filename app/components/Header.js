'use client';

import React from 'react';
import { supabase } from '../supabaseClient';

export default function Header({ user, setUser }) {
  // Вход через Google
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) alert('Ошибка входа: ' + error.message);
  };

  // Выход
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'flex-end',
      padding: '10px 20px',
      borderBottom: '1px solid #ddd',
      backgroundColor: '#f9f9f9',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      {user ? (
        <>
          <span style={{ marginRight: '12px' }}>Привет, {user.email}</span>
          <button
            onClick={signOut}
            style={{
              backgroundColor: '#e63946',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Выйти
          </button>
        </>
      ) : (
        <button
          onClick={signInWithGoogle}
          style={{
            backgroundColor: '#4285F4',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            padding: '6px 12px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Войти через Google
        </button>
      )}
    </header>
  );
}
