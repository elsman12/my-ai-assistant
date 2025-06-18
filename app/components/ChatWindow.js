"use client";

import { useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Mic2 } from "lucide-react";

export default function ChatWindow({ messages, input, setInput, onSend }) {
  const endRef = useRef(null);

  // Прокрутка вниз при появлении новых сообщений
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Окно сообщений */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-gray-900">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[60%] px-4 py-2 rounded-lg ${
              m.role === "user"
                ? "ml-auto bg-blue-500 text-white"
                : "mr-auto bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            }`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="prose prose-sm dark:prose-invert break-words"
            >
              {m.text}
            </ReactMarkdown>
          </div>
        ))}
        <div ref={endRef} />
      </main>

      {/* Поле ввода */}
      <footer className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <Mic2 size={20} />
          </button>
          <input
            type="text"
            className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded focus:outline-none"
            placeholder="Напишите сообщение..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSend();
            }}
          />
          <button
            onClick={onSend}
            className="p-2 rounded bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Send size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
}
