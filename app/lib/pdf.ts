import { PDFDocument, degrees } from "pdf-lib";
import type { ImageFile, PDFGenerationOptions } from "./types";
import { PAGE_SIZES } from "./types";

export async function generatePDFFromImages(
  images: ImageFile[],
  options: PDFGenerationOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const image of images) {
    const response = await fetch(image.path);
    const imageBytes = await response.arrayBuffer();

    // Determine image type and embed
    const pdfImage = image.path.toLowerCase().endsWith(".png")
      ? await pdfDoc.embedPng(imageBytes)
      : await pdfDoc.embedJpg(imageBytes);

    // Create and configure page
    const page = pdfDoc.addPage(PAGE_SIZES[options.pageSize]);
    const isLandscape = options.orientation === "landscape";
    if (isLandscape) {
      page.setRotation(degrees(90));
    }

    // Calculate page dimensions
    let { width, height } = page.getSize();
    if (isLandscape) {
      [width, height] = [height, width];
    }
    
    // Calculate available space
    const maxWidth = width - (options.margin * 2);
    const maxHeight = height - (options.margin * 2);
    
    // Calculate scaling
    const imageAspectRatio = pdfImage.width / pdfImage.height;
    const pageAspectRatio = maxWidth / maxHeight;
    
    const { drawWidth, drawHeight } = imageAspectRatio > pageAspectRatio
      ? {
          drawWidth: maxWidth,
          drawHeight: maxWidth / imageAspectRatio,
        }
      : {
          drawHeight: maxHeight,
          drawWidth: maxHeight * imageAspectRatio,
        };

    // Center the image
    const x = options.margin + (maxWidth - drawWidth) / 2;
    const y = options.margin + (maxHeight - drawHeight) / 2;
    
    page.drawImage(pdfImage, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  }

  return pdfDoc.save();
}
