import { Source_Sans_3, Geist_Mono } from "next/font/google";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-app-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CNA Exam Practice Platform",
  description: "Practice exams, analytics, and remediation for CNA exam preparation.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${sourceSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
