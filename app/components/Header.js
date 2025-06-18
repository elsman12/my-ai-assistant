

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        {/* <Header />  // Удали или закомментируй */}
        {children}
      </body>
    </html>
  );
}
