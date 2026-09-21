const SVG_DOCTYPE = '<?xml version="1.0" encoding="UTF-8"?>\n';

/**
 * Serialize the live preview node. Reading back what React already rendered
 * keeps the download byte-for-byte identical to what the visitor is looking at,
 * including any uploaded logo (embedded as a data URL, so the file stays
 * self-contained).
 */
export function serializeSvg(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;

  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

  // The preview's layout classes mean nothing outside the page, and without an
  // intrinsic size the file opens at whatever its container happens to be. Swap
  // them for the viewBox's own dimensions.
  clone.removeAttribute("class");
  const [, , width, height] = (clone.getAttribute("viewBox") ?? "").split(" ");
  if (width && height) {
    clone.setAttribute("width", width);
    clone.setAttribute("height", height);
  }

  return SVG_DOCTYPE + new XMLSerializer().serializeToString(clone);
}

/**
 * Rasterize markup at `width` pixels, preserving the SVG's aspect ratio.
 *
 * Everything the markup references is inline or a data URL, so the canvas never
 * gets tainted and `toBlob` is allowed to read it back.
 */
export async function svgToPngBlob(markup: string, width: number): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml;charset=utf-8" }));

  try {
    const image = await loadImage(url);
    const ratio = image.naturalHeight / image.naturalWidth || 1;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width);
    canvas.height = Math.round(width * ratio);

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas 2D context is unavailable");
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Could not encode the PNG"));
        }
      }, "image/png");
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not render the QR code to an image"));
    image.src = src;
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Turn a caption or payload into a safe, readable file name stem. */
export function toFilename(source: string, fallback = "qr-code"): string {
  const slug = source
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");

  return slug || fallback;
}
