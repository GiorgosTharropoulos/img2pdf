import { promises as fs } from "fs";
import path from "path";
import type { Route } from "./+types.upload";

export async function loader({ params }: Route.LoaderArgs) {
  const directoryPath = path.join(process.cwd(), "uploads", params.directory);
  
  try {
    const files = await fs.readdir(directoryPath, { withFileTypes: true });
    
    const imageFiles = files
      .filter(file => file.isFile() && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name))
      .map(file => ({
        name: file.name,
        path: `/uploads/${params.directory}/${file.name}`
      }));

    return { images: imageFiles };
  } catch (error) {
    console.error("Error reading directory:", error);
    throw new Response("Directory not found", { status: 404 });
  }
}

export async function action({ request, params }: Route.ActionArgs) {}

export default function Upload({ params, loaderData }: Route.ComponentProps) {}
