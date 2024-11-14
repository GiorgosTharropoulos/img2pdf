export interface PDFGenerationOptions {
  pageSize: "A4" | "Letter";
  orientation: "portrait" | "landscape";
  quality: number;
  margin: number;
}

export interface ImageFile {
  path: string;
  name: string;
}

export const PAGE_SIZES = {
  A4: [595, 842] as const,
  Letter: [612, 792] as const,
} as const;

export const DEFAULT_PDF_OPTIONS: PDFGenerationOptions = {
  pageSize: "A4",
  orientation: "portrait",
  quality: 0.8,
  margin: 40,
};
