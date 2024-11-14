import fs from "fs/promises";
import path from "path";
import { useCallback, useEffect, useState, useRef } from "react";
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
import type { PDFGenerationOptions } from "~/lib/types";
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
import { generatePDFFromImages } from "~/lib/pdf";
import { DEFAULT_PDF_OPTIONS } from "~/lib/types";

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
  const [pdfOptions, setPdfOptions] = useState<PDFGenerationOptions>(DEFAULT_PDF_OPTIONS);
  const [isGenerating, setIsGenerating] = useState(false);
  const generationStartTime = useRef<number | null>(null);

  const updatePdfOption = <K extends keyof PDFGenerationOptions>(
    key: K,
    value: PDFGenerationOptions[K],
  ) => {
    setPdfOptions((prev) => ({ ...prev, [key]: value }));
  };

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
        <div className="flex items-center gap-4 [&>*:last-child]:ml-auto">
          <div className="flex flex-col gap-1">
            <label htmlFor="pageSize" className="text-sm font-medium">
              Page Size
            </label>
            <select
              id="pageSize"
              value={pdfOptions.pageSize}
              onChange={(e) => updatePdfOption("pageSize", e.target.value as "A4" | "Letter")}
              className="rounded-md border px-3 py-1"
            >
              <option value="A4">A4</option>
              <option value="Letter">Letter</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="orientation" className="text-sm font-medium">
              Orientation
            </label>
            <select
              id="orientation"
              value={pdfOptions.orientation}
              onChange={(e) =>
                updatePdfOption("orientation", e.target.value as "portrait" | "landscape")
              }
              className="rounded-md border px-3 py-1"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="quality" className="text-sm font-medium">
              Quality
            </label>
            <input
              id="quality"
              type="number"
              min="0.1"
              max="1"
              step="0.1"
              value={pdfOptions.quality}
              onChange={(e) => updatePdfOption("quality", Number(e.target.value))}
              className="w-20 rounded-md border px-3 py-1"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="margin" className="text-sm font-medium">
              Margin (pt)
            </label>
            <input
              id="margin"
              type="number"
              min="0"
              max="100"
              step="5"
              value={pdfOptions.margin}
              onChange={(e) => updatePdfOption("margin", Number(e.target.value))}
              className="w-20 rounded-md border px-3 py-1"
            />
          </div>
          <Button
            className="self-end"
            disabled={isGenerating}
            onClick={async () => {
              try {
                setIsGenerating(true);
                generationStartTime.current = Date.now();

                const imagesToConvert =
                  selectedImages.size > 0
                    ? orderedImages.filter((img) => selectedImages.has(img.path))
                    : orderedImages;

                const pdfBytes = await generatePDFFromImages(imagesToConvert, pdfOptions);
                const blob = new Blob([pdfBytes], { type: "application/pdf" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "images.pdf";
                link.click();
                URL.revokeObjectURL(url);
              } finally {
                setIsGenerating(false);
                generationStartTime.current = null;
              }
            }}
          >
            {isGenerating && Date.now() - (generationStartTime.current || 0) > 500 ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating...
              </span>
            ) : (
              "Generate PDF"
            )}
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
