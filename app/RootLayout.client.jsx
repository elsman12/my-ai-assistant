"use client";

import React, { useState } from "react";
import Providers from "./providers";
import ChatPage from "./components/ChatPage";

export default function RootLayoutClient() {
  const [messagesByChat, setMessagesByChat] = useState({});
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [chatCounter, setChatCounter] = useState(1);

  const createNewChat = () => {
    const newChatId = `chat_${chatCounter}`;
    setChatCounter(chatCounter + 1);
    setMessagesByChat({
      ...messagesByChat,
      [newChatId]: [],
    });
    setSelectedChatId(newChatId);
  };

  const deleteChat = (chatId) => {
    const newChats = { ...messagesByChat };
    delete newChats[chatId];
    setMessagesByChat(newChats);

    if (chatId === selectedChatId) {
      const keys = Object.keys(newChats);
      setSelectedChatId(keys.length > 0 ? keys[0] : null);
    }
  };

  const setMessagesForChat = (chatId, newMessages) => {
    setMessagesByChat({
      ...messagesByChat,
      [chatId]: newMessages,
    });
  };

  return (
    <Providers>
      <div
        className="container"
        style={{
          display: "flex",
          height: "100vh",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          backgroundColor: "#f9f9f9",
        }}
      >
        <aside
          className="sidebar"
          style={{
            width: "260px",
            background: "#ffffff",
            borderRight: "1px solid #ddd",
            display: "flex",
            flexDirection: "column",
            padding: "12px 16px",
            boxSizing: "border-box",
            boxShadow: "2px 0 5px rgba(0,0,0,0.05)",
          }}
        >
          <div
            className="logo"
            style={{
              fontWeight: "700",
              fontSize: "20px",
              marginBottom: "12px",
              color: "#222",
              userSelect: "none",
            }}
          >
            ChatGPT
          </div>

          <button
            onClick={createNewChat}
            style={{
              background: "#444",
              color: "#fff",
              border: "none",
              padding: "10px 14px",
              marginBottom: "16px",
              cursor: "pointer",
              borderRadius: "6px",
              fontWeight: "600",
              transition: "background-color 0.3s ease",
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#666")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#444")}
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
              paddingRight: "4px",
            }}
          >
            {Object.keys(messagesByChat).length === 0 && (
              <div style={{ color: "#666", fontSize: "14px", padding: "10px 5px" }}>
                Нет чатов. Создайте новый чат.
              </div>
            )}

            {Object.entries(messagesByChat).map(([chatId]) => (
              <div
                key={chatId}
                className={`chat-item ${chatId === selectedChatId ? "active" : ""}`}
                onClick={() => setSelectedChatId(chatId)}
                style={{
                  padding: "10px 12px",
                  cursor: "pointer",
                  borderRadius: "6px",
                  backgroundColor: chatId === selectedChatId ? "#e6e6e6" : "transparent",
                  fontWeight: chatId === selectedChatId ? "700" : "500",
                  color: "#333",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  userSelect: "none",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={e => {
                  if (chatId !== selectedChatId) e.currentTarget.style.backgroundColor = "#f0f0f0";
                }}
                onMouseLeave={e => {
                  if (chatId !== selectedChatId) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <span>{chatId.replace("chat_", "Чат ")}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chatId);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#cc0000",
                    cursor: "pointer",
                    fontSize: "18px",
                    lineHeight: "18px",
                    padding: "0 6px",
                    fontWeight: "700",
                    userSelect: "none",
                  }}
                  aria-label="Удалить чат"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div
            className="upgrade"
            style={{
              marginTop: "12px",
              borderTop: "1px solid #ddd",
              paddingTop: "12px",
            }}
          >
            <button
              className="upgrade-btn"
              style={{
                background: "#28a745",
                color: "white",
                border: "none",
                padding: "10px 16px",
                cursor: "pointer",
                borderRadius: "6px",
                width: "100%",
                fontWeight: "600",
                letterSpacing: "0.03em",
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#3ec15a")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#28a745")}
            >
              Обновить план
            </button>
            <div
              className="upgrade-desc"
              style={{
                fontSize: "12px",
                color: "#666",
                marginTop: "6px",
                textAlign: "center",
                userSelect: "none",
              }}
            >
              Больше доступа к лучшим моделям
            </div>
          </div>
        </aside>

        <main
          className="main"
          style={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#fff",
          }}
        >
          {selectedChatId ? (
            <ChatPage
              chatId={selectedChatId}
              messages={Array.isArray(messagesByChat[selectedChatId]) ? messagesByChat[selectedChatId] : []}
              setMessages={(newMessages) => setMessagesForChat(selectedChatId, newMessages)}
            />
          ) : (
            <div style={{ padding: "20px", color: "#555" }}>Выберите чат или создайте новый.</div>
          )}
        </main>
      </div>
    </Providers>
  );
}
