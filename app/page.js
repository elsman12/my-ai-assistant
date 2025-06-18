"use client";
import React, { useState } from "react";
import Header from "./components/Header";  // Импорт хедера с входом
import ChatPage from "./components/ChatPage";
import "./globals.css";

export default function Page() {
  const [chats, setChats] = useState([]);

  const createChat = () => {
    const name = prompt("Название нового чата:");
    if (name) {
      setChats(prev => [...prev, name]);
    }
  };

  return (
    <div className="layout">
      <Header />
      <ChatPage />
    </div>
  );
}
