import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata = {
  title: "cal-clone — scheduling",
  description: "Book meetings like Cal.com",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
