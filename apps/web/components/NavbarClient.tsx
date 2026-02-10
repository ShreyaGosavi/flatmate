"use client";

import { useEffect, useState } from "react";

export function NavBarClient({ children }: { children: React.ReactNode }) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <nav
            className={`fixed top-0 w-full z-50 transition-all duration-300 ${
                scrolled
                    ? "bg-brand-bg border-b border-brand-border shadow-md"
                    : "bg-transparent"
            }`}
        >
            {children}
        </nav>
    );
}