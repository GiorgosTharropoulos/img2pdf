import { Link } from "react-router";

import { Logo } from "./ui/logo";

export function MainNav() {
  return (
    <div className="mr-4 hidden md:flex">
      <Link to="/" className="mr-4 flex items-center gap-2 lg:mr-6">
        <Logo className="h-6 w-6" />
        <span className="hidden font-bold lg:inline-block">img2pdf</span>
      </Link>
    </div>
  );
}
