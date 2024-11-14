import { promises as fs } from "fs";
import path from "path";
import { useState } from "react";
import { NavLink, Outlet, useFetcher } from "react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";

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
              {directories.map((dir) => {
                const [showDeleteDialog, setShowDeleteDialog] = useState(false);
                const fetcher = useFetcher();

                return (
                  <div key={dir.path}>
                    <ContextMenu>
                      <ContextMenuTrigger>
                        <NavLink
                          className="block rounded-lg border p-4 hover:bg-gray-50 [&.active]:bg-accent [&.active]:underline"
                          to={dir.path}
                        >
                          {dir.name}
                        </NavLink>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => setShowDeleteDialog(true)}
                        >
                          Delete Directory
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>

                    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Directory?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the directory "{dir.name}" and all its contents.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => {
                              e.preventDefault();
                              const form = new FormData();
                              form.append("intent", "deleteDirectory");
                              form.append("dirPath", dir.path);
                              fetcher.submit(form, { method: "post" });
                              setShowDeleteDialog(false);
                            }}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                );
              })}
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
