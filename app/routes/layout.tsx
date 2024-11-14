import { Outlet } from "react-router";

import { SiteHeader } from "~/components/site-header";

export default function Layout() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 border-border/40 dark:border-border">
        <div className="mx-auto flex w-full flex-1 flex-col border-border/40 dark:border-border min-[1800px]:max-w-[1536px] min-[1800px]:border-x">
          <SiteHeader />
          <main className="flex-1">
            <Outlet />
          </main>
          <footer className="bg-gray-800 p-4 text-center text-white">
            <p>&copy; 2023 My Website</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
