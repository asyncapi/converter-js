import type { AsyncAPIDocument, ConvertOptions, ConvertFunction } from './interfaces';

export const converters: Record<string, ConvertFunction> = {
  '1.0.0': from__undefined__to__1_0_0,
  '1.1.0': from__1_0_0__to__1_1_0,
  '1.2.0': from__1_1_0__to__1_2_0,
}

function from__undefined__to__1_0_0(asyncapi: AsyncAPIDocument, _: ConvertOptions): AsyncAPIDocument {
  asyncapi.asyncapi = '1.0.0';
  return asyncapi;
}

function from__1_0_0__to__1_1_0(asyncapi: AsyncAPIDocument, _: ConvertOptions): AsyncAPIDocument {
  asyncapi.asyncapi = '1.1.0';
  return asyncapi;
}

function from__1_1_0__to__1_2_0(asyncapi: AsyncAPIDocument, _: ConvertOptions): AsyncAPIDocument {
  asyncapi.asyncapi = '1.2.0';
  return asyncapi;
}
