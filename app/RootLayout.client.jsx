"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import ChatPage from "./components/ChatPage";
import EmailAuth from "./components/EmailAuth";

export default function RootLayoutClient() {
  const [chats, setChats] = useState({});
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // для мобилки

  // --- Авторизация: подписка на изменения пользователя
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setShowAuth(false);
    });
    return () => {
      if (listener && typeof listener.subscription?.unsubscribe === "function") {
        listener.subscription.unsubscribe();
      } else if (listener && typeof listener.unsubscribe === "function") {
        listener.unsubscribe();
      }
    };
  }, []);

  // --- Загрузка чатов из Supabase при входе пользователя
  useEffect(() => {
    async function loadChats() {
      if (!user) return;
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (!error) {
        const obj = {};
        data.forEach((c) => {
          obj[c.id] = { title: c.title || "Без названия" };
        });
        setChats(obj);
        if (!selectedChatId && data.length) setSelectedChatId(data[0].id);
      }
    }
    loadChats();
  }, [user]);

  // --- Создать новый чат
  const createNewChat = async () => {
    if (!user) return setShowAuth(true);
    const { data, error } = await supabase
      .from("chats")
      .insert([{ user_id: user.id, title: "Новый чат" }])
      .select();
    if (!error && data?.[0]) {
      setChats((prev) => ({
        ...prev,
        [data[0].id]: { title: data[0].title }
      }));
      setSelectedChatId(data[0].id);
      setSidebarOpen(false); // Закрыть меню на мобилке при создании чата
    }
  };

  // --- Удалить чат
  const deleteChat = async (chatId) => {
    if (!user || !chatId) return;
    await supabase.from("messages").delete().eq("chat_id", chatId).eq("user_id", user.id);
    await supabase.from("chats").delete().eq("id", chatId).eq("user_id", user.id);
    setChats((prev) => {
      const newChats = { ...prev };
      delete newChats[chatId];
      return newChats;
    });
    setSelectedChatId(null);
  };

  // --- Обновить название чата
  const updateChatTitle = async (chatId, newTitle) => {
    if (!chatId || !newTitle) return;
    await supabase.from("chats").update({ title: newTitle }).eq("id", chatId);
    setChats((prev) => ({
      ...prev,
      [chatId]: { ...(prev[chatId] || {}), title: newTitle }
    }));
  };

  // --- Выйти из аккаунта
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowAuth(false);
  };

  function renderSidebarAuthBlock() {
    return (
      <div style={{
        marginTop: "12px",
        borderTop: "1px solid #ececf1",
        paddingTop: "14px",
        paddingBottom: "10px",
      }}>
        {user ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
              {user.email}
            </div>
            <button
              onClick={handleSignOut}
              style={{
                background: "#fff",
                color: "#e63946",
                border: "1px solid #e63946",
                padding: "10px 0",
                cursor: "pointer",
                borderRadius: "7px",
                width: "100%",
                fontWeight: 600,
                fontSize: "15px",
                marginBottom: "4px",
              }}
            >
              Выйти
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAuth(true)}
            style={{
              background: "#3a8bfd",
              color: "white",
              border: "none",
              padding: "10px 0",
              cursor: "pointer",
              borderRadius: "7px",
              width: "100%",
              fontWeight: 600,
              fontSize: "15px",
              marginBottom: "4px",
            }}
          >
            Войти через Email
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="container" style={{ display: "flex", height: "100vh" }}>
      {/* Кнопка-гамбургер (открывает меню) — всегда вне сайдбара! */}
      <button
        className="mobile-sidebar-toggle"
        onClick={() => setSidebarOpen(true)}
        style={{
          display: "none", // включается на мобилке через CSS
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 10001,
          background: "#fff",
          border: "1px solid #ececf1",
          borderRadius: 8,
          width: 44,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          color: "#222",
          boxShadow: "0 2px 12px #ececf1a0",
          cursor: "pointer"
        }}
        aria-label="Открыть меню"
      >
        ☰
      </button>

      {/* Overlay для мобилки */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
            background: "#0005", zIndex: 10000, display: "block"
          }}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`sidebar${sidebarOpen ? " open" : ""}`}
        style={{
          width: "260px",
          background: "#F8F9FA",
          borderRight: "1px solid #ececf1",
          display: "flex",
          flexDirection: "column",
          padding: "18px 14px 0 14px",
          boxSizing: "border-box",
          minWidth: "200px",
          position: "relative",
        }}
      >
        {/* Кнопка-крестик для закрытия меню (только на мобилке) */}
        <button
          className="mobile-sidebar-close"
          onClick={() => setSidebarOpen(false)}
          style={{
            display: "none", // включается на мобилке через CSS
            position: "absolute",
            top: 14,
            right: 16,
            background: "#fff",
            border: "1px solid #ececf1",
            borderRadius: 8,
            width: 38,
            height: 38,
            fontSize: 25,
            alignItems: "center",
            justifyContent: "center",
            color: "#444",
            cursor: "pointer",
            zIndex: 10002
          }}
          aria-label="Закрыть меню"
        >
          ✕
        </button>
        <div
          className="logo"
          style={{
            fontWeight: 700,
            fontSize: 22,
            marginBottom: 32,
            color: "#202123",
            letterSpacing: 0.1,
          }}
        >
          ChatGPT
        </div>
        <button
          onClick={createNewChat}
          style={{
            background: "#343541",
            color: "#fff",
            border: "none",
            padding: "10px 0",
            marginBottom: "16px",
            cursor: "pointer",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: 16,
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#40414f")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#343541")}
        >
          + Новый чат
        </button>
        <div
          className="chats-list"
          style={{
            flexGrow: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {Object.keys(chats).length === 0 && (
            <div
              style={{
                color: "#666",
                fontSize: "14px",
                padding: "10px 5px",
              }}
            >
              Нет чатов. Создайте новый чат.
            </div>
          )}
          {Object.entries(chats).map(([chatId, chat]) => (
            <div
              key={chatId}
              className={`chat-item${chatId === selectedChatId ? " active" : ""}`}
              onClick={() => {
                setSelectedChatId(chatId);
                setSidebarOpen(false); // Закрыть меню на мобилке после выбора чата
              }}
              style={{
                padding: "10px 12px",
                cursor: "pointer",
                borderRadius: "7px",
                backgroundColor: chatId === selectedChatId ? "#ececf1" : "transparent",
                fontWeight: 500,
                color: chatId === selectedChatId ? "#111" : "#222",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "15px",
                gap: "8px",
                transition: "background-color 0.18s",
              }}
              onMouseEnter={(e) => {
                if (chatId !== selectedChatId)
                  e.currentTarget.style.backgroundColor = "#f3f3f5";
              }}
              onMouseLeave={(e) => {
                if (chatId !== selectedChatId)
                  e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 140,
                }}
                title={chat.title || "Чат"}
              >
                {chat.title || "Чат"}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chatId);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#c21f1f",
                  cursor: "pointer",
                  fontSize: 19,
                  lineHeight: "19px",
                  fontWeight: 700,
                  userSelect: "none",
                  marginLeft: "2px",
                }}
                aria-label="Удалить чат"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {/* Блок с кнопками Войти/Выйти */}
        {renderSidebarAuthBlock()}
      </aside>

      {/* ОСНОВНОЕ ОКНО */}
      <main className="main" style={{ flexGrow: 1, backgroundColor: "#fff" }}>
        {selectedChatId ? (
          <ChatPage
            user={user}
            chatId={selectedChatId}
            updateChatTitle={updateChatTitle}
          />
        ) : (
          <div style={{ padding: "20px", color: "#555" }}>
            Выберите чат или создайте новый.
          </div>
        )}

        {/* Модалка для EmailAuth */}
        {showAuth && (
          <div style={{
            position: "fixed",
            left: 0, top: 0, width: "100vw", height: "100vh",
            background: "#0006", zIndex: 10001,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <div style={{
              background: "#fff", borderRadius: 14, padding: 30, minWidth: 350, boxShadow: "0 8px 48px #0003",
              position: "relative"
            }}>
              <EmailAuth setUser={setUser} />
              <button onClick={() => setShowAuth(false)} style={{
                position: "absolute", top: 10, right: 10, background: "#eee", border: "none",
                padding: "6px 10px", borderRadius: 8, cursor: "pointer", color: "#333"
              }}>✕</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
