/**
 * PUBLIC TYPES
 */
export type AsyncAPIDocument = { asyncapi: string } & Record<string, any>;
export type OpenAPIDocument = { openapi: string } & Record<string, any>;
export type AsyncAPIConvertVersion = '1.1.0' | '1.2.0' | '2.0.0-rc1' | '2.0.0-rc2' | '2.0.0' | '2.1.0' | '2.2.0' | '2.3.0' | '2.4.0' | '2.5.0' | '2.6.0' | '3.0.0';

export type OpenAPIConvertVersion = '3.0.0';
export type ConvertV2ToV3Options = {
  idGenerator?: (data: { asyncapi: AsyncAPIDocument, kind: 'channel' | 'operation' | 'message', key: string | number | undefined, path: Array<string | number>, object: any, parentId?: string }) => string,
  pointOfView?: 'application' | 'client',
  useChannelIdExtension?: boolean;
  convertServerComponents?: boolean;
  convertChannelComponents?: boolean;
}

export type OpenAPIToAsyncAPIOptions = {
  perspective?: 'client' | 'server';
};
export type ConvertOptions = {
  v2tov3?: ConvertV2ToV3Options;
  openAPIToAsyncAPI?: OpenAPIToAsyncAPIOptions;
}

/**
 * PRIVATE TYPES
 */
export type ConvertFunction = (asyncapi: AsyncAPIDocument, options: ConvertOptions) => AsyncAPIDocument;
export type ConvertOpenAPIFunction = (openapi: OpenAPIDocument, options: OpenAPIToAsyncAPIOptions) => AsyncAPIDocument;

