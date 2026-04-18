import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { getCurrentAppUser } from "@/lib/current-user";

const manrope = localFont({
  src: "./fonts/bahnschrift.ttf",
  variable: "--font-manrope",
  display: "swap",
});

const fraunces = localFont({
  src: "./fonts/sitka-vf.ttf",
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NephroCare+",
  description: "Patient-first dialysis planning and profile management",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentAppUser();

  return (
    <html lang="en" className={`${manrope.variable} ${fraunces.variable}`}>
      <body>
        <AppShell user={currentUser}>{children}</AppShell>
      </body>
    </html>
  );
}
