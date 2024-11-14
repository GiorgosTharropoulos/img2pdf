import { promises as fs } from "fs";
import path from "path";
import { useCallback, useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";
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
import { degrees } from 'pdf-lib';
import { useFetcher } from "react-router";

import type { Route } from "./+types.upload";
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
import { Button } from "~/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
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

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "deleteDirectory") {
    const dirPath = formData.get("dirPath") as string;
    if (!dirPath) {
      throw new Error("Directory path is required");
    }

    const fullPath = path.join(process.cwd(), dirPath.replace(/^\/uploads/, "uploads"));

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

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
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
          <ContextMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={() => setShowDeleteDialog(true)}
          >
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
                setShowDeleteDialog(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function Upload({ loaderData }: Route.ComponentProps) {
  const [orderedImages, setOrderedImages] = useState(loaderData.images);

  useEffect(() => {
    setOrderedImages(loaderData.images);
  }, [loaderData.images]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [modalImage, setModalImage] = useState<string | undefined>();
  const [pageSize, setPageSize] = useState<"A4" | "Letter">("A4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [quality, setQuality] = useState<number>(0.8);

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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Images</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="pageSize" className="text-sm font-medium">
              Page Size:
            </label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value as "A4" | "Letter")}
              className="rounded-md border px-3 py-1"
            >
              <option value="A4">A4</option>
              <option value="Letter">Letter</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="orientation" className="text-sm font-medium">
              Orientation:
            </label>
            <select
              id="orientation"
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as "portrait" | "landscape")}
              className="rounded-md border px-3 py-1"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="quality" className="text-sm font-medium">
              Quality:
            </label>
            <input
              id="quality"
              type="number"
              min="0.1"
              max="1"
              step="0.1"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-20 rounded-md border px-3 py-1"
            />
          </div>
          <Button
            onClick={async () => {
              const imagesToConvert = selectedImages.size > 0
                ? orderedImages.filter(img => selectedImages.has(img.path))
                : orderedImages;

              const pdfDoc = await PDFDocument.create();
              
              for (const image of imagesToConvert) {
                const response = await fetch(image.path);
                const imageBytes = await response.arrayBuffer();
                
                let pdfImage;
                if (image.path.endsWith('.png')) {
                  pdfImage = await pdfDoc.embedPng(imageBytes);
                } else {
                  pdfImage = await pdfDoc.embedJpg(imageBytes);
                }

                const page = pdfDoc.addPage(pageSize === 'A4' ? [595, 842] : [612, 792]);
                if (orientation === 'landscape') {
                  page.setRotation(degrees(90));
                }

                const { width, height } = page.getSize();
                const aspectRatio = pdfImage.width / pdfImage.height;
                
                let drawWidth = width - 40;
                let drawHeight = drawWidth / aspectRatio;
                
                if (drawHeight > height - 40) {
                  drawHeight = height - 40;
                  drawWidth = drawHeight * aspectRatio;
                }

                page.drawImage(pdfImage, {
                  x: (width - drawWidth) / 2,
                  y: (height - drawHeight) / 2,
                  width: drawWidth,
                  height: drawHeight,
                });
              }

              const pdfBytes = await pdfDoc.save();
              const blob = new Blob([pdfBytes], { type: 'application/pdf' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'images.pdf';
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            Generate PDF
          </Button>
        </div>
      </div>

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
