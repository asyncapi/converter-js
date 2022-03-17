import type { AsyncAPIDocument, ConvertVersion, ConvertOptions } from './interfaces';
export declare function convert(asyncapi: string, version: ConvertVersion, options?: ConvertOptions): string;
export declare function convert(asyncapi: AsyncAPIDocument, version: ConvertVersion, options?: ConvertOptions): AsyncAPIDocument;
