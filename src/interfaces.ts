export type AsyncAPIDocument = { asyncapi: string } & Record<string, any>;
export type ConvertVersion = '1.1.0' | '1.2.0' | '2.0.0-rc1' | '2.0.0-rc2' | '2.0.0' | '2.1.0' | '2.2.0' | '2.3.0' | '2.4.0';
export interface ConvertOptions {
  id?: string;
}
