import { PDFDocument, degrees } from "pdf-lib";

interface PDFGenerationOptions {
  pageSize: "A4" | "Letter";
  orientation: "portrait" | "landscape";
  quality: number;
}

const PAGE_SIZES = {
  A4: [595, 842] as const,
  Letter: [612, 792] as const,
};

const MARGIN = 40; // 40 point margins

export async function generatePDFFromImages(
  images: Array<{ path: string; name: string }>,
  options: PDFGenerationOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const image of images) {
    const response = await fetch(image.path);
    const imageBytes = await response.arrayBuffer();

    const pdfImage = image.path.endsWith(".png")
      ? await pdfDoc.embedPng(imageBytes)
      : await pdfDoc.embedJpg(imageBytes);

    const page = pdfDoc.addPage(PAGE_SIZES[options.pageSize]);
    if (options.orientation === "landscape") {
      page.setRotation(degrees(90));
    }

    let { width, height } = page.getSize();
    
    if (options.orientation === "landscape") {
      [width, height] = [height, width];
    }
    
    const maxWidth = width - (MARGIN * 2);
    const maxHeight = height - (MARGIN * 2);
    
    const imageAspectRatio = pdfImage.width / pdfImage.height;
    const pageAspectRatio = maxWidth / maxHeight;
    
    let drawWidth: number;
    let drawHeight: number;
    
    if (imageAspectRatio > pageAspectRatio) {
      drawWidth = maxWidth;
      drawHeight = drawWidth / imageAspectRatio;
    } else {
      drawHeight = maxHeight;
      drawWidth = drawHeight * imageAspectRatio;
    }
    
    const x = (width - drawWidth) / 2;
    const y = (height - drawHeight) / 2;
    
    page.drawImage(pdfImage, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  }

  return pdfDoc.save();
}
