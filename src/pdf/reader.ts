import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export class PDFReader {
  private pdfDocument: pdfjsLib.PDFDocumentProxy | null = null;

  private currentPage = 1;
  private zoom = 1;

  private canvas: HTMLCanvasElement;
  private readerArea: HTMLElement;

  private fitScale = 1;
  private renderTask: pdfjsLib.RenderTask | null = null;

  constructor(canvas: HTMLCanvasElement, readerArea: HTMLElement) {
    this.canvas = canvas;
    this.readerArea = readerArea;
  }

  async load(file: File): Promise<void> {
    const arrayBuffer = await file.arrayBuffer();

    this.cancelCurrentRender();

    this.pdfDocument = await pdfjsLib.getDocument({
      data: arrayBuffer,
    }).promise;

    this.currentPage = 1;
    this.zoom = 1;

    await this.calculateFitScale();
    await this.renderCurrentPage();
  }

  private async calculateFitScale(): Promise<void> {
    if (!this.pdfDocument) return;

    const page = await this.pdfDocument.getPage(this.currentPage);

    const baseViewport = page.getViewport({
      scale: 1,
    });

    const availableWidth = Math.max(
      1,
      this.readerArea.clientWidth - 48,
    );

    const availableHeight = Math.max(
      1,
      this.readerArea.clientHeight - 48,
    );

    const widthScale = availableWidth / baseViewport.width;
    const heightScale = availableHeight / baseViewport.height;

    this.fitScale = Math.min(widthScale, heightScale);
  }

  async renderCurrentPage(): Promise<void> {
    if (!this.pdfDocument) return;

    this.cancelCurrentRender();

    const page = await this.pdfDocument.getPage(this.currentPage);

    const devicePixelRatio = window.devicePixelRatio || 1;

    const displayScale = this.fitScale * this.zoom;

    const viewport = page.getViewport({
      scale: displayScale,
    });

    const renderViewport = page.getViewport({
      scale: displayScale * devicePixelRatio,
    });

    const context = this.canvas.getContext("2d");

    if (!context) {
      throw new Error("Could not get canvas context.");
    }

    this.canvas.width = Math.ceil(renderViewport.width);
    this.canvas.height = Math.ceil(renderViewport.height);

    this.canvas.style.width = `${viewport.width}px`;
    this.canvas.style.height = `${viewport.height}px`;

    const renderTask = page.render({
      canvas: this.canvas,
      canvasContext: context,
      viewport: renderViewport,
    });

    this.renderTask = renderTask;

    try {
      await renderTask.promise;
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "RenderingCancelledException"
      ) {
        return;
      }

      throw error;
    } finally {
      if (this.renderTask === renderTask) {
        this.renderTask = null;
      }
    }
  }

  async nextPage(): Promise<void> {
    if (!this.pdfDocument) return;

    if (this.currentPage < this.pdfDocument.numPages) {
      this.currentPage++;

      await this.calculateFitScale();
      await this.renderCurrentPage();
    }
  }

  async previousPage(): Promise<void> {
    if (!this.pdfDocument) return;

    if (this.currentPage > 1) {
      this.currentPage--;

      await this.calculateFitScale();
      await this.renderCurrentPage();
    }
  }

  async setZoom(zoom: number): Promise<void> {
    this.zoom = Math.min(Math.max(zoom, 0.5), 3);

    await this.renderCurrentPage();
  }

  get currentPageNumber(): number {
    return this.currentPage;
  }

  get totalPages(): number {
    return this.pdfDocument?.numPages ?? 0;
  }

  get zoomLevel(): number {
    return this.zoom;
  }

  private cancelCurrentRender(): void {
    if (this.renderTask) {
      this.renderTask.cancel();
      this.renderTask = null;
    }
  }
}