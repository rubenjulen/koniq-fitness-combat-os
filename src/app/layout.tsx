import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KoniQ Fitness & Combat Sports OS",
  description: "Eén platform voor je hele sportschool — van eerste lead tot zwarte band. Voor kickboks-, Muay Thai- en fitnessscholen in Suriname.",
};

const themeInit = `(function(){try{var t=localStorage.getItem('koniq-fit-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeInit }} /></head>
      <body>{children}</body>
    </html>
  );
}
