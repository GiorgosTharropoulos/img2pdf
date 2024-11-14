import fs from "node:fs/promises";
import path from "node:path";
import type { DragEndEvent } from "@dnd-kit/core";
import * as React from "react";
import { useState } from "react";
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
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useFetcher } from "react-router";
import invariant from "tiny-invariant";

import type { Route } from "./+types.upload";
import { Button } from "~/components/ui/button";

export async function loader({ params }: Route.LoaderArgs) {
  const dir = path.resolve(".", "uploads", params.id);
  const images = await fs.readdir(dir);
  return { images };
}

export async function action({ request, params }: Route.ActionArgs) {
  const data = await request.formData();

  const intent = data.get("intent");

  invariant(intent, "intent is required");

  if (intent === "remove") {
    const image = data.get("image");
    invariant(image, "image is required");
    await fs.rm(path.resolve(".", "uploads", params.id, image as string));
  }
}

export default function Upload({ params, loaderData }: Route.ComponentProps) {
  const folder = params.id;
  const [images, setImages] = useState(loaderData.images);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || !active) {
      return;
    }

    if (active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.indexOf(active.id.toString());
        const newIndex = items.indexOf(over.id.toString());

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  function handleRemoveImage(image: string) {
    console.log(image);
    setImages((images) => images.filter((i) => i !== image));
  }

  React.useEffect(() => {
    setImages(loaderData.images);
  }, [loaderData.images]);

  return (
    <div className="container flex flex-wrap items-center justify-center flex-1 gap-4 mx-auto">
      {images.length ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images} strategy={rectSortingStrategy}>
            {images.map((image) => (
              <SortableItem
                key={image}
                image={image}
                folder={folder}
                onRemoveImage={() => {
                  console.log("hello");
                  handleRemoveImage(image);
                }}
              />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        <p className="text-center">No images found.</p>
      )}
    </div>
  );
}

interface SortableItemProps {
  image: string;
  folder: string;
  onRemoveImage: () => void;
}

export function SortableItem(props: SortableItemProps) {
  const fetcher = useFetcher();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: props.image,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="max-w-xs overflow-hidden transition-shadow bg-white rounded-lg shadow-lg hover:shadow-xl dark:bg-gray-950"
    >
      <img
        src={`/uploads/${props.folder}/${props.image}`}
        alt="Product Image"
        className="object-cover w-full h-64"
      />
      <div className="p-4 space-y-2">
        <h3 className="text-xl font-semibold">{props.image}</h3>
        {/* <p className="text-gray-500 dark:text-gray-400">This is a description of the product.</p> */}
        <div className="flex items-center justify-end">
          {/* <span className="text-lg font-bold">$49.99</span> */}
          <fetcher.Form method="POST">
            <input type="hidden" name="image" value={props.image} />
            <Button type="submit" name="intent" value="remove" variant="destructive">
              Remove
            </Button>
          </fetcher.Form>
        </div>
      </div>
    </div>
  );
}
