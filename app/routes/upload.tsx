import { promises as fs } from "fs";
import path from "path";
import { useCallback, useEffect, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useFetcher } from "react-router";

import type { Route } from "./+types.upload";
import { Button } from "~/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { Modal } from "~/components/ui/modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";

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

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const imagePath = formData.get("imagePath") as string;
    if (!imagePath) {
      throw new Error("Image path is required");
    }

    const fullPath = path.join(process.cwd(), imagePath.replace(/^\/uploads/, "uploads"));

    try {
      await fs.unlink(fullPath);
      return { success: true };
    } catch (error) {
      console.error("Error deleting file:", error);
      throw new Error("Failed to delete image");
    }
  }

  return null;
}

function SortableImage({
  image,
  isSelected,
  onClick,
}: {
  image: { path: string; name: string };
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  const fetcher = useFetcher();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: image.path,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          className={`aspect-square cursor-pointer select-none overflow-hidden rounded-lg border ${
            isSelected ? "ring-2 ring-blue-500" : ""
          }`}
        >
          <div className="h-full w-full">
            <img
              src={image.path}
              alt={image.name}
              className="pointer-events-none h-full w-full object-cover"
            />
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onClick({ ctrlKey: false } as React.MouseEvent)}>
          View Image
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onClick({ ctrlKey: true } as React.MouseEvent)}>
          {isSelected ? "Deselect" : "Select"}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <ContextMenuItem className="text-red-600 focus:text-red-600">
              Delete
            </ContextMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the image.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  const form = new FormData();
                  form.append("intent", "delete");
                  form.append("imagePath", image.path);
                  fetcher.submit(form, { method: "post" });
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default function Upload({ loaderData }: Route.ComponentProps) {
  const [orderedImages, setOrderedImages] = useState(loaderData.images);

  useEffect(() => {
    setOrderedImages(loaderData.images);
  }, [loaderData.images]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [modalImage, setModalImage] = useState<string | undefined>();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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
    const imageArray = orderedImages.map((img) => img.path);
    const currentIndex = imageArray.indexOf(modalImage!);
    const nextIndex = (currentIndex + 1) % imageArray.length;
    setModalImage(imageArray[nextIndex]);
  };

  const previousImage = () => {
    const imageArray = orderedImages.map((img) => img.path);
    const currentIndex = imageArray.indexOf(modalImage!);
    const prevIndex = (currentIndex - 1 + imageArray.length) % imageArray.length;
    setModalImage(imageArray[prevIndex]);
  };

  return (
    <div className="">
      <h1 className="mb-6 text-2xl font-bold">Images</h1>

      {orderedImages.length === 0 ? (
        <p className="text-gray-500">No images found in this directory</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={({ active, over }) => {
            if (over && active.id !== over.id) {
              setOrderedImages((items) => {
                const oldIndex = items.findIndex((item) => item.path === active.id);
                const newIndex = items.findIndex((item) => item.path === over.id);
                return arrayMove(items, oldIndex, newIndex);
              });
            }
          }}
        >
          <SortableContext items={orderedImages.map((img) => img.path)}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {orderedImages.map((image) => (
                <SortableImage
                  key={image.path}
                  image={image}
                  isSelected={selectedImages.has(image.path)}
                  onClick={(e) => handleImageClick(image.path, e)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      <Modal
        isOpen={!!modalImage}
        onClose={() => setModalImage(undefined)}
        onNext={nextImage}
        onPrevious={previousImage}
      >
        {modalImage && (
          <div className="flex flex-col items-center" style={{ height: "85vh" }}>
            <div className="flex w-full flex-1 items-center justify-center">
              <img
                src={modalImage}
                alt="Selected image"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="flex gap-4 py-4">
              <Button onClick={previousImage} variant="outline">
                Previous
              </Button>
              <Button onClick={nextImage} variant="outline">
                Next
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
