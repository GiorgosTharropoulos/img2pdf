import { promises as fs } from "fs";
import path from "path";

import type { Route } from "./+types.upload";

export async function loader({ params }: Route.LoaderArgs) {
  const directoryPath = path.join(process.cwd(), "uploads", params.directory);

  try {
    const files = await fs.readdir(directoryPath, { withFileTypes: true });

    const imageFiles = files
      .filter((file) => file.isFile() && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name))
      .map((file) => ({
        name: file.name,
        path: `/uploads/${params.directory}/${file.name}`,
      }));

    return { images: imageFiles };
  } catch (error) {
    console.error("Error reading directory:", error);
    throw new Response("Directory not found", { status: 404 });
  }
}

export async function action({ request, params }: Route.ActionArgs) {}

export default function Upload({ loaderData }: Route.ComponentProps) {
  const { images } = loaderData;

  return (
    <div className="">
      <h1 className="mb-6 text-2xl font-bold">Images</h1>

      {images.length === 0 ? (
        <p className="text-gray-500">No images found in this directory</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => (
            <div key={image.path} className="aspect-square overflow-hidden rounded-lg border">
              <img src={image.path} alt={image.name} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
