'use client';

import React, { useRef, useEffect, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import "./chat.css";
import { supabase } from '../supabaseClient';

// Кнопка голосового ввода
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

// Рендер Markdown с очисткой
function renderMarkdown(md) {
  const dirty = marked.parse(md || "");
  return DOMPurify.sanitize(dirty);
}

export default function ChatPage({ user, chatId }) {
  const scrollRef = useRef(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const forceStop = useRef(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = React.useRef();

  // Сообщения из Supabase
  const [messages, setMessages] = useState([]);
  // Сообщения из Notion
  const [notionMessages, setNotionMessages] = useState([]);
  const [notionLoading, setNotionLoading] = useState(false);
  const [notionNextCursor, setNotionNextCursor] = useState(null);

  const [draftText, setDraftText] = useState("");
  const [draftFiles, setDraftFiles] = useState([]);

  // Загрузка сообщений из Supabase
  useEffect(() => {
    async function fetchMessages() {
      if (!user?.id || !chatId) return;

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Ошибка загрузки истории сообщений из Supabase:', error);
      } else {
        setMessages(data);
      }
    }
    fetchMessages();
  }, [user?.id, chatId]);

  // Загрузка сообщений из Notion с пагинацией
  async function loadNotionMessages(cursor = null) {
    setNotionLoading(true);
    try {
      let url = '/api/notionMessages';
      if (cursor) url += `?start_cursor=${cursor}`;

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки сообщений из Notion');

      setNotionMessages(prev => cursor ? [...prev, ...data.results] : data.results);
      setNotionNextCursor(data.next_cursor);
    } catch (e) {
      console.error('Ошибка загрузки сообщений из Notion:', e);
    } finally {
      setNotionLoading(false);
    }
  }

  // Загружаем первые сообщения из Notion при монтировании
  useEffect(() => {
    loadNotionMessages();
  }, []);

  // Автоскролл при новых сообщениях
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, notionMessages, loading]);

  // Обработчики файлов, голосового ввода и отправки (оставлены как есть, аналогично твоему коду)
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      type: file.type,
    }));
    setDraftFiles(prev => [...prev, ...newFiles]);
    e.target.value = null;
  };

  const removeFileFromDraft = (id) => {
    setDraftFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSend = async () => {
    if ((!draftText.trim() && draftFiles.length === 0) || loading) return;
    if (!user?.id || !chatId) {
      alert("Сначала войдите и выберите чат!");
      return;
    }

    setLoading(true);

    try {
      // Отправка текста
      if (draftText.trim()) {
        const { data: newMsg, error: insertError } = await supabase
          .from('messages')
          .insert([{ user_id: user.id, chat_id: chatId, role: 'user', text: draftText.trim() }])
          .select()
          .single();

        if (insertError) throw insertError;

        setMessages(prev => [...prev, newMsg]);
      }

      // Отправка файлов
      for (const fileObj of draftFiles) {
        const fileName = `${Date.now()}_${fileObj.name}`;
        const { data, error } = await supabase.storage
          .from('chat-files')
          .upload(fileName, fileObj.file, {
            contentType: fileObj.type,
          });

        if (error) {
          console.error("Ошибка загрузки файла в Storage:", error);
          continue;
        }

        const publicUrl = supabase.storage.from('chat-files').getPublicUrl(fileName).data.publicUrl;

        const { data: fileMsg, error: fileInsertError } = await supabase
          .from('messages')
          .insert([{
            user_id: user.id,
            chat_id: chatId,
            role: "user",
            text: `[Изображение]`,
            file_url: publicUrl,
            file_name: fileObj.name,
            file_type: fileObj.type
          }])
          .select()
          .single();

        if (fileInsertError) {
          console.error("Ошибка вставки сообщения с файлом:", fileInsertError);
          continue;
        }

        setMessages(prev => [...prev, fileMsg]);
      }

      setDraftText("");
      setDraftFiles([]);

      let prompt = draftText;
      if (draftFiles.length > 0) {
        const filesList = draftFiles.map(f => supabase.storage.from('chat-files').getPublicUrl(`${Date.now()}_${f.name}`).data.publicUrl).join('\n');
        prompt += `\n\nВот прикрепленные изображения:\n${filesList}`;
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, userId: user.id, chatId }),
      });
      const data = await res.json();

      const { data: assistantMsg, error: assistantInsertError } = await supabase
        .from('messages')
        .insert([{ user_id: user.id, chat_id: chatId, role: 'assistant', text: data.text }])
        .select()
        .single();

      if (assistantInsertError) {
        console.error("Ошибка вставки ответа AI:", assistantInsertError);
      }

      setMessages(prev => [...prev, assistantMsg]);

    } catch (error) {
      alert("Ошибка отправки сообщения");
      console.error(error);
    }

    setLoading(false);
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
      setDraftText(result);
    };
    recognition.start();
  };

  return (
    <div className="chat-container">
      <main className="chat-main" style={{ paddingTop: '60px' }}>
        <div className="chat-col">
          {/* Сообщения из Supabase */}
          {messages.map((m) =>
            m.role === "assistant" ? (
              <div
                key={m.id}
                className="chat-message assistant"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }}
              />
            ) : (
              <div key={m.id} className="chat-message user">
                {m.text}
                {m.file_url && (
                  <div>
                    <a href={m.file_url} target="_blank" rel="noopener noreferrer">
                      {m.file_name}
                    </a>
                    <br />
                    <img
                      src={m.file_url}
                      alt={m.file_name}
                      style={{ maxWidth: "200px", borderRadius: "10px", marginTop: "5px" }}
                    />
                  </div>
                )}
                <div className="msg-meta">
                  {m.created_at && (
                    <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                </div>
              </div>
            )
          )}

          {/* Сообщения из Notion */}
          <div style={{ marginTop: 30 }}>
            <h3></h3>
            {notionMessages.map(m => (
              <div key={m.id} className="chat-message notion-message">
                <b>{m.who}</b>: {m.text}
                <br />
                <small>{new Date(m.date).toLocaleString()}</small>
              </div>
            ))}
            {notionNextCursor && (
              <button
                onClick={() => loadNotionMessages(notionNextCursor)}
                disabled={notionLoading}
                style={{ marginTop: 10 }}
              >
                {notionLoading ? "Загрузка..." : "Показать ещё"}
              </button>
            )}
          </div>

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
        <textarea
          className="chat-input"
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          placeholder="Напишите сообщение..."
          disabled={loading}
          rows={2}
          style={{ resize: 'none' }}
        />

        {draftFiles.length > 0 && (
          <div className="draft-files">
            {draftFiles.map(fileObj => (
              <div key={fileObj.id} className="draft-file" title={fileObj.name}>
                <img src={fileObj.preview} alt={fileObj.name} />
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeFileFromDraft(fileObj.id)}
                  aria-label={`Удалить файл ${fileObj.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          className="chat-send"
          onClick={handleSend}
          disabled={loading}
          aria-label="Отправить сообщение"
        >
          ⮞
        </button>
        <VoiceButton onClick={handleVoice} listening={listening} />
        <button
          className="file-btn"
          onClick={() => fileInputRef.current.click()}
          title="Прикрепить файл"
          aria-label="Прикрепить файл"
          disabled={loading}
        >
          📎
        </button>
        <input
          type="file"
          multiple
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
          disabled={loading}
        />
      </footer>
    </div>
  );
}
