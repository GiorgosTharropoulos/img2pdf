import { promises as fs } from "fs";
import path from "path";
import { useState } from "react";
import { X } from "lucide-react";
import { NavLink, Outlet, useFetcher, useNavigate, useParams } from "react-router";
import invariant from "tiny-invariant";

import type { Route } from "./+types.uploads";
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

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "deleteDirectory") {
    const dirPath = formData.get("dirPath");
    invariant(dirPath, "Directory path is required");

    const fullPath = path.join(process.cwd(), (dirPath as string).replace(/^\/uploads/, "uploads"));

    try {
      await fs.rm(fullPath, { recursive: true });
      return { success: true };
    } catch (error) {
      console.error("Error deleting directory:", error);
      throw new Error("Failed to delete directory");
    }
  }

  return null;
}

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
                  <div key={dir.path} className="group relative">
                    <NavLink
                      className="block rounded-lg border p-4 hover:bg-gray-50 [&.active]:bg-accent [&.active]:underline"
                      to={dir.path}
                    >
                      {dir.name}
                    </NavLink>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setShowDeleteDialog(true);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 opacity-0 hover:bg-gray-100 group-hover:opacity-100"
                    >
                      <X className="h-4 w-4 text-gray-500 hover:text-red-600" />
                    </button>

                    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Directory?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the directory "{dir.name}" and all its
                            contents. This action cannot be undone.
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
                              const navigate = useNavigate();
                              const params = useParams();

                              fetcher.submit(form, { method: "post" });
                              setShowDeleteDialog(false);

                              // If we're deleting the currently open directory, navigate to /uploads
                              if (params.directory === dir.name) {
                                navigate("/uploads");
                              }
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
