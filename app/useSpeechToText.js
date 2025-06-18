// app/useSpeechToText.js
import { useRef } from "react";

export function useSpeechToText() {
  const recRef = useRef(null);
  const start = (onResult) => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Браузер не поддерживает распознавание речи");
      return;
    }
    const rec = new SR();
    rec.lang = "ru-RU";
    rec.interimResults = false;
    rec.onresult = (e) => onResult(e.results[0][0].transcript);
    rec.onerror = console.error;
    rec.start();
    recRef.current = rec;
  };
  const stop = () => {
    recRef.current?.stop();
    recRef.current = null;
  };
  return { start, stop };
}
