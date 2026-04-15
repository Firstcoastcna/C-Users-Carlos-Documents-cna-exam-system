import "./globals.css";

export const metadata = {
  title: "CNA Exam Practice Platform",
  description: "Practice exams, analytics, and remediation for CNA exam preparation.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
