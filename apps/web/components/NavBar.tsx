import Link from "next/link";
import Logo from "./Logo";
import { Button } from "./ui/button";
import { NavBarClient } from "./NavbarClient";

export function NavBar() {
    return (
        <NavBarClient>
            <div className="max-w-8xl mx-auto px-4 py-2 flex items-center justify-between">
                <Link href="/"
                      className="flex items-center cursor-pointertransition-opacity duration-300 hover:opacity-80
  ">
                    <Logo width={160} height={60} />
                </Link>

                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="text-brand-text hover:text-brand-yellowAccent hover:underline underline-offset-2 transition-colors"
                    >
                        Home
                    </Link>

                    <Link
                        href="/"
                        className="text-brand-text hover:text-brand-yellowAccent hover:underline underline-offset-2 transition-colors"
                    >
                        About Us
                    </Link>

                    <Link
                        href="/"
                        className="text-brand-text hover:text-brand-yellowAccent hover:underline underline-offset-2 transition-colors"
                    >
                        Features
                    </Link>

                    <Button
                        asChild
                        variant="outline"
                        className="border-brand-yellowAccent text-brand-text hover:border-brand-text hover:bg-brand-yellow hover:text-brand-black transition-colors"
                    >
                        <Link href="/login">Login</Link>
                    </Button>

                    <Button
                        asChild
                        className="bg-brand-text text-brand-bg border border-brand-yellowAccent hover:bg-brand-yellow hover:text-brand-text hover:border-brand-black transition-colors"
                    >
                        <Link href="/signup">Register</Link>
                    </Button>
                </div>
            </div>
        </NavBarClient>
    );
}
