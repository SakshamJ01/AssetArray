export interface IDocumentExporter {
  exportHtmlReport(options: {
    html: string;
    filename: string;
    title: string;
  }): Promise<void>;
}
