declare module 'textract' {
  interface TextractOptions {
    preserveOnlyFontSize?: boolean;
    preserveLineBreaks?: boolean;
    preserveOnlyFontSize?: boolean;
    preserveOnlyFontSize?: boolean;
    [key: string]: any;
  }

  function textract(
    buffer: Buffer,
    options?: TextractOptions,
    callback?: (error: Error, text: string) => void,
  ): void;
  function textract(
    filePath: string,
    options?: TextractOptions,
    callback?: (error: Error, text: string) => void,
  ): void;

  export = textract;
}
