import { IDocumentExporter } from "./types";

class WebDocumentExporter implements IDocumentExporter {
  async exportHtmlReport({
    html,
    filename,
    title,
  }: {
    html: string;
    filename: string;
    title: string;
  }): Promise<void> {
    if (typeof window === "undefined" || typeof document === "undefined") {
      console.warn("[DocumentExporter Web] Window not defined.");
      return;
    }

    try {
      // Use an iframe to isolate styles and trigger native browser print / save-to-pdf dialog
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(html);
        frameDoc.close();

        // Wait for styles/fonts to render, then trigger print
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            console.warn("[DocumentExporter Web] iframe print failed, falling back to window:", e);
            this.fallbackNewWindow(html, title);
          } finally {
            // Clean up iframe after user interaction
            setTimeout(() => {
              document.body.removeChild(iframe);
            }, 2000);
          }
        }, 500);
      } else {
        this.fallbackNewWindow(html, title);
      }
    } catch (e) {
      console.warn("[DocumentExporter Web] Print error, falling back:", e);
      this.fallbackNewWindow(html, title);
    }
  }

  private fallbackNewWindow(html: string, title: string) {
    const printWin = window.open("", "_blank");
    if (printWin) {
      printWin.document.open();
      printWin.document.write(html);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 500);
    }
  }
}

export const documentExporter: IDocumentExporter = new WebDocumentExporter();
