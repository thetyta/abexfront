import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Provider } from "../components/ui/provider";
import Toaster from "../components/ui/toaster";
import Sidebar from "../components/ui/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "TaskCare",
  description: "Projeto de Abex - Gerenciamento de Tarefas",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/AlanSans-VariableFont_wght.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
        <link rel="icon" type="image/x-icon" href="/2310700.ico" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Provider>
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <main className="app-main">
              <Toaster />
              {children}
            </main>
          </div>
        </Provider>
      </body>
    </html>
  );
}
