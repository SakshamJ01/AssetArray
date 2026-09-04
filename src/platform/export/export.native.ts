import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { IDocumentExporter } from "./types";

class NativeDocumentExporter implements IDocumentExporter {
  async exportHtmlReport({
    html,
    filename,
    title,
  }: {
    html: string;
    filename: string;
    title: string;
  }): Promise<void> {
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, {
      UTI: ".pdf",
      mimeType: "application/pdf",
      dialogTitle: title || `Export ${filename}`,
    });
  }
}

export const documentExporter: IDocumentExporter = new NativeDocumentExporter();
