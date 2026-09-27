export class TorchController {
  private overlay: HTMLElement;
  private size = 100;
  private enabled = true;

  constructor(overlay: HTMLElement) {
    this.overlay = overlay;

    window.addEventListener("pointermove", this.handlePointerMove);
  }

  private handlePointerMove = (event: PointerEvent): void => {
    if (!this.enabled) return;

    const mask = this.createMask(event.clientX, event.clientY);

    this.overlay.style.mask = mask;
    this.overlay.style.webkitMask = mask;
  };

  private createMask(x: number, y: number): string {
    return `radial-gradient(
      circle ${this.size}px at ${x}px ${y}px,
      transparent 0%,
      black 65%
    )`;
  }

  setSize(size: number): void {
    this.size = size;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    this.overlay.style.display = enabled ? "block" : "none";
  }

  get isEnabled(): boolean {
    return this.enabled;
  }
}