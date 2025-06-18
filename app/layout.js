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
      <body>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
