/**
 * PUBLIC TYPES
 */
export type AsyncAPIDocument = { asyncapi: string } & Record<string, any>;
export type ConvertVersion = '1.1.0' | '1.2.0' | '2.0.0-rc1' | '2.0.0-rc2' | '2.0.0' | '2.1.0' | '2.2.0' | '2.3.0' | '2.4.0' | '2.5.0' | '2.6.0' | '3.0.0';
export type ConvertV2ToV3Options = {
  idGenerator?: (data: { asyncapi: AsyncAPIDocument, kind: 'channel' | 'operation' | 'message', key: string | number | undefined, path: Array<string | number>, object: any, parentId?: string }) => string,
  pointOfView?: 'application' | 'client',
  useChannelIdExtension?: boolean;
  convertServerComponents?: boolean;
  convertChannelComponents?: boolean;
}
export type ConvertOptions = {
  v2tov3?: ConvertV2ToV3Options;
}

/**
 * PRIVATE TYPES
 */
export type ConvertFunction = (asyncapi: AsyncAPIDocument, options: ConvertOptions) => AsyncAPIDocument;

