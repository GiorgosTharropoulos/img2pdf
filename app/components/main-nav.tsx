import { Upload } from "lucide-react";
import { Link } from "react-router";

import { Logo } from "./ui/logo";

export function MainNav() {
  return (
    <div className="mr-4 hidden md:flex">
      <Link to="/" className="mr-4 flex items-center gap-2 lg:mr-6">
        <Logo className="h-6 w-6" />
        <span className="hidden font-bold lg:inline-block">img2pdf</span>
      </Link>

      <Link to="/uploads" className="flex items-center gap-2 rounded-md px-4 py-2 hover:bg-accent">
        <Upload className="h-4 w-4" />
        <span>Uploads</span>
      </Link>
    </div>
  );
}
