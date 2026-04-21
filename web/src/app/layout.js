import "./globals.css";

export const metadata = {
  title: "CNA Exam Practice Platform",
  description: "Practice exams, analytics, and remediation for CNA exam preparation.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" translate="no" className="notranslate">
      <head>
        <meta name="google" content="notranslate" />
        <meta httpEquiv="Content-Language" content="en,es,fr,ht" />
      </head>
      <body translate="no" className="notranslate">
        {children}
      </body>
    </html>
  );
}
