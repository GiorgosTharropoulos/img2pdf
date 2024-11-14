import { Links, Meta, Outlet, Scripts } from "react-router";

import "~/tailwind.css";

export default function App() {
  return (
    <html>
      <head>
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
