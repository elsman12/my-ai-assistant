'use client';
import React, { useRef, useEffect, useState } from "react";
import "./chat.css";

export function VoiceButton({ onClick, listening }) {
  return (
    <button
      className={`voice-btn${listening ? " listening" : ""}`}
      title={listening ? "Остановить запись" : "Голосовой ввод"}
      type="button"
      onClick={onClick}
      aria-label="Голосовой ввод"
      style={{ borderColor: 'black', color: 'black' }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="3" width="6" height="10" rx="3" />
        <path d="M5 11v2a7 7 0 0 0 14 0v-2" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    </button>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const forceStop = useRef(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      setMessages([{ id: 1, role: "assistant", text: "Привет! Я твой AI-ассистент.", timestamp: new Date() }]);
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  const handleSend = async () => {
    const text = inputRef.current.value.trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { id: Date.now(), role: "user", text, timestamp: new Date() }]);
    inputRef.current.value = "";
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, role: "user" }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { id: Date.now() + 1, role: "assistant", text: data.text, timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 2, role: "assistant", text: "Ошибка связи с AI.", timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Ваш браузер не поддерживает голосовой ввод");
      return;
    }
    if (listening && recognitionRef.current) {
      forceStop.current = true;
      recognitionRef.current.stop();
      return;
    }
    forceStop.current = false;
    const recognition = new SpeechRecognition();
    recognition.lang = "ru-RU";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
      if (!forceStop.current) handleVoice();
    };
    recognition.onerror = e => {
      setListening(false);
      recognitionRef.current = null;
      if (e.error !== "aborted" && !forceStop.current) handleVoice();
    };
    recognition.onresult = e => {
      const result = e.results[0][0].transcript;
      if (inputRef.current) {
        inputRef.current.value = result;
        inputRef.current.focus();
      }
    };
    recognition.start();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setMessages(prev => [...prev, {
      id: Date.now(),
      role: "user",
      text: file.type.startsWith("image") ? "[Изображение]" : "[Файл]",
      fileName: file.name,
      fileUrl: url,
      fileType: file.type,
      timestamp: new Date()
    }]);
    e.target.value = null;
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <div />
        <h1>Твой любимый чат AI</h1>
      </header>
      <main className="chat-main">
        <div className="chat-col">
          {messages.map(m => (
            <div
              key={m.id}
              className={m.role === "assistant" ? "chat-message assistant" : "chat-message user"}
            >
              <div>
                {m.fileUrl ? (
                  m.fileType && m.fileType.startsWith("image") ? (
                    <img src={m.fileUrl} alt={m.fileName} style={{ maxWidth: '220px', borderRadius: '10px' }} />
                  ) : (
                    <a href={m.fileUrl} download={m.fileName}>{m.fileName}</a>
                  )
                ) : (
                  m.text
                )}
              </div>
              <div className="msg-meta">
                {m.timestamp && (
                  <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="typing-indicator">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
              Печатает...
            </div>
          )}
          <div ref={scrollRef}></div>
        </div>
      </main>
      <footer className="chat-input-wrap">
        <input
          className="chat-input"
          ref={inputRef}
          placeholder="Напишите сообщение..."
          onKeyDown={e => e.key === "Enter" && handleSend()}
          disabled={loading}
        />
        <button
          className="chat-send"
          onClick={handleSend}
          disabled={loading}
          style={{ backgroundColor: 'black', color: 'white' }}
          aria-label="Отправить сообщение"
        >
          ⮞
        </button>
        <VoiceButton onClick={handleVoice} listening={listening} />
        <input
          type="file"
          style={{ display: "none" }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <button
          className="file-btn"
          onClick={() => fileInputRef.current.click()}
          title="Прикрепить файл"
          style={{ color: 'black' }}
          aria-label="Прикрепить файл"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16.5 13.5L9.9 20.1a5 5 0 1 1-7.1-7.1l10.6-10.6a4 4 0 1 1 5.7 5.7l-10.5 10.5a2 2 0 1 1-2.8-2.8l9.5-9.5" />
          </svg>
        </button>
      </footer>
    </div>
  );
}
