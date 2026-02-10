import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";


export const metadata: Metadata = {
  title: "FlatMate",
  description: " ",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body className="bg-brand-bg min-h-screen">
        <NavBar />
        <main className="pt-20">
            {children}
        </main>
        </body>
        </html>
    );
}
