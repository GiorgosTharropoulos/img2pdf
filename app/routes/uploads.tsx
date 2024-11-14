import { promises as fs } from "fs";
import path from "path";
import { NavLink, Outlet } from "react-router";

import type { Route } from "./+types.uploads";

export async function loader() {
  try {
    const uploadsDir = path.join(process.cwd(), "uploads");
    const directories = await fs.readdir(uploadsDir, { withFileTypes: true });

    const dirs = directories
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => ({
        name: dirent.name,
        path: `/uploads/${dirent.name}`,
      }));

    return { directories: dirs };
  } catch (error) {
    console.error("Error reading uploads directory:", error);
    return { directories: [] };
  }
}

export default function Uploads({ loaderData }: Route.ComponentProps) {
  const { directories } = loaderData;

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Uploaded Directories</h1>
          {directories.length === 0 ? (
            <p className="text-gray-500">No uploads found</p>
          ) : (
            <div className="grid gap-4">
              {directories.map((dir) => (
                <NavLink
                  key={dir.path}
                  className="rounded-lg border p-4 hover:bg-gray-50 [&.active]:bg-accent [&.active]:underline"
                  to={`/uploads/${dir.name}`}
                >
                  {dir.name}
                </NavLink>
              ))}
            </div>
          )}
        </div>
        <div className="min-h-[200px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
