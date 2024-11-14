import { Button } from "~/components/ui/button";
import { GithubIcon } from "./github-icons";
import { MainNav } from "./main-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-border">
      <div className="flex h-14 items-center px-4">
        <MainNav />
        <div className="flex flex-1 items-center justify-between gap-2 md:justify-end">
          <nav className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8 px-0">
              <a
                href="https://github.com/GiorgosTharropoulos/img2pdf"
                target="_blank"
                rel="noreferrer"
              >
                <GithubIcon className="size-4" />
                <span className="sr-only">GitHub</span>
              </a>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
