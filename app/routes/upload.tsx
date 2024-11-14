import { promises as fs } from "fs";
import path from "path";
import { useCallback, useState } from "react";

import type { Route } from "./+types.upload";
import { Modal } from "~/components/ui/modal";
import { Button } from "~/components/ui/button";

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
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [modalImage, setModalImage] = useState<string | null>(null);

  const toggleImage = useCallback((imagePath: string) => {
    setSelectedImages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(imagePath)) {
        newSet.delete(imagePath);
      } else {
        newSet.add(imagePath);
      }
      return newSet;
    });
  }, []);

  const handleImageClick = (imagePath: string, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      toggleImage(imagePath);
    } else {
      setModalImage(imagePath);
    }
  };

  const nextImage = () => {
    const imageArray = images.map(img => img.path);
    const currentIndex = imageArray.indexOf(modalImage!);
    const nextIndex = (currentIndex + 1) % imageArray.length;
    setModalImage(imageArray[nextIndex]);
  };

  const previousImage = () => {
    const imageArray = images.map(img => img.path);
    const currentIndex = imageArray.indexOf(modalImage!);
    const prevIndex = (currentIndex - 1 + imageArray.length) % imageArray.length;
    setModalImage(imageArray[prevIndex]);
  };

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
              onClick={(e) => handleImageClick(image.path, e)}
              className={`aspect-square cursor-pointer overflow-hidden rounded-lg border ${
                selectedImages.has(image.path) ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <img src={image.path} alt={image.name} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={!!modalImage} onClose={() => setModalImage(null)}>
        {modalImage && (
          <div className="flex flex-col items-center gap-4">
            <img
              src={modalImage}
              alt="Selected image"
              className="max-h-[85vh] max-w-[85vw] object-contain"
            />
            <div className="flex gap-4">
              <Button onClick={previousImage} variant="outline">Previous</Button>
              <Button onClick={nextImage} variant="outline">Next</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
