import "./styles/main.css";
import "./styles/reader.css";

import { PDFReader } from "./pdf/reader";
import { TorchController } from "./torch/controller";

document.body.hidden = false;

const landingScreen = document.getElementById("landing-screen") as HTMLElement;
const readerScreen = document.getElementById("reader-screen") as HTMLElement;

const bookFileInput = document.getElementById("book-file") as HTMLInputElement;
const backButton = document.getElementById("back-button") as HTMLButtonElement;

const documentName = document.getElementById("document-name") as HTMLElement;
const pageIndicator = document.getElementById("page-indicator") as HTMLElement;

const previousPageButton =
  document.getElementById("previous-page") as HTMLButtonElement;

const nextPageButton =
  document.getElementById("next-page") as HTMLButtonElement;

const zoomOutButton =
  document.getElementById("zoom-out") as HTMLButtonElement;

const zoomInButton =
  document.getElementById("zoom-in") as HTMLButtonElement;

const zoomLevel = document.getElementById("zoom-level") as HTMLElement;

const canvas = document.getElementById("pdf-canvas") as HTMLCanvasElement;

const readerArea = document.getElementById("reader-area") as HTMLElement;

const darkOverlay = document.getElementById("dark-overlay") as HTMLElement;

const torchSizeInput =
  document.getElementById("torch-size") as HTMLInputElement;

const torchToggleButton =
  document.getElementById("torch-toggle") as HTMLButtonElement;

const pdfReader = new PDFReader(canvas, readerArea);
const torch = new TorchController(darkOverlay);

torchToggleButton.textContent = "Torch: On";

function updatePageIndicator(): void {
  pageIndicator.textContent =
    `${pdfReader.currentPageNumber} / ${pdfReader.totalPages}`;
}

function updateZoomIndicator(): void {
  zoomLevel.textContent = `${Math.round(pdfReader.zoomLevel * 100)}%`;
}

bookFileInput.addEventListener("change", async () => {
  const file = bookFileInput.files?.[0];

  if (!file) return;

  try {
    landingScreen.hidden = true;
    readerScreen.hidden = false;
  
    await pdfReader.load(file);
  
    documentName.textContent = file.name;
  
    updatePageIndicator();
    updateZoomIndicator();
  } catch (error) {
    console.error("Failed to load PDF:", error);
    alert("Could not open this PDF.");
  }
});

previousPageButton.addEventListener("click", async () => {
  await pdfReader.previousPage();
  updatePageIndicator();
});

nextPageButton.addEventListener("click", async () => {
  await pdfReader.nextPage();
  updatePageIndicator();
});

zoomOutButton.addEventListener("click", async () => {
  await pdfReader.setZoom(pdfReader.zoomLevel - 0.1);
  updateZoomIndicator();
});

zoomInButton.addEventListener("click", async () => {
  await pdfReader.setZoom(pdfReader.zoomLevel + 0.1);
  updateZoomIndicator();
});

backButton.addEventListener("click", () => {
  readerScreen.hidden = true;
  landingScreen.hidden = false;

  bookFileInput.value = "";
});

torchSizeInput.addEventListener("input", () => {
  torch.setSize(Number(torchSizeInput.value));
});

torchToggleButton.addEventListener("click", () => {
  const enabled = !torch.isEnabled;

  torch.setEnabled(enabled);

  torchToggleButton.textContent = enabled ? "Torch: On" : "Torch: Off";
});

readerArea.addEventListener(
  "wheel",
  (event) => {
    if (readerArea.scrollHeight <= readerArea.clientHeight) {
      return;
    }

    event.preventDefault();

    readerArea.scrollBy({
      top: event.deltaY,
      left: event.deltaX,
      behavior: "auto",
    });
  },
  { passive: false },
);