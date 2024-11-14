import { promises as fs } from "fs";
import path from "path";
import { useState } from "react";

import type { Route } from "./+types.upload";
import { Modal } from "~/components/ui/modal";

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <div className="">
      <h1 className="mb-6 text-2xl font-bold">Images</h1>

      {images.length === 0 ? (
        <p className="text-gray-500">No images found in this directory</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => (
            <div
              key={image.path}
              className="aspect-square cursor-pointer overflow-hidden rounded-lg border"
              onClick={() => setSelectedImage(image.path)}
            >
              <img src={image.path} alt={image.name} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={!!selectedImage} onClose={() => setSelectedImage(null)}>
        {selectedImage && (
          <img
            src={selectedImage}
            alt="Selected image"
            className="max-h-[85vh] max-w-[85vw] object-contain"
          />
        )}
      </Modal>
    </div>
  );
}
