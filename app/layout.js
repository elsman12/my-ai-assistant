// app/layout.js
import "./globals.css";
import RootLayoutClient from "./RootLayout.client";

export const metadata = {
  title: "My AI Assistant",
  description: "ChatGPT clone with Google login",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body style={{
        height: "100vh",
        minHeight: 0,
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
        overflow: "hidden", // (чтобы не появлялся двойной скролл)
      }}>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
