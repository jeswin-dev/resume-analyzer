import pdfParse from "pdf-parse";
import type { ProcessedFile } from "@/types";

export class FileParserService {
  async parsePDF(
    buffer: Buffer,
    filename: string,
    type: "cv" | "job-description"
  ): Promise<ProcessedFile> {
    try {
      const data = await pdfParse(buffer);

      const content = data.text
        .replace(/\n\s*\n/g, "\n\n")
        .replace(/\s+/g, " ")
        .trim();

      if (!content || content.length < 50) {
        throw new Error(
          "PDF appears to be empty or contains very little text content"
        );
      }

      return {
        filename,
        content,
        type,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse PDF "${filename}": ${error.message}`);
      }
      throw new Error(`Failed to parse PDF "${filename}": Unknown error`);
    }
  }

  validatePDF(buffer: Buffer, filename: string): void {
    // Check file extension
    if (!filename.toLowerCase().endsWith(".pdf")) {
      throw new Error("File must be a PDF");
    }

    // Check PDF magic number
    if (
      buffer.length < 4 ||
      !buffer.subarray(0, 4).equals(Buffer.from("%PDF"))
    ) {
      throw new Error("File does not appear to be a valid PDF");
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (buffer.length > maxSize) {
      throw new Error("File size exceeds maximum limit of 10MB");
    }
  }

  async processFiles(
    cvFile: { buffer: Buffer; originalname: string },
    jobFile: { buffer: Buffer; originalname: string }
  ): Promise<{ cv: ProcessedFile; jobDescription: ProcessedFile }> {
    // Validate files
    this.validatePDF(cvFile.buffer, cvFile.originalname);
    this.validatePDF(jobFile.buffer, jobFile.originalname);

    // Parse both files concurrently
    const [cv, jobDescription] = await Promise.all([
      this.parsePDF(cvFile.buffer, cvFile.originalname, "cv"),
      this.parsePDF(jobFile.buffer, jobFile.originalname, "job-description"),
    ]);

    return { cv, jobDescription };
  }
}
