import { dump } from 'js-yaml';

import { converters as firstConverters } from "./first-version";
import { converters as secondConverters } from "./second-version";
import { converters as thirdConverters } from "./third-version";
import { converters as openapiConverters } from "./openapi";

import { serializeInput } from "./utils";

import type { AsyncAPIDocument, ConvertVersion, ConvertOptions, ConvertFunction, ConvertOpenAPIFunction, OpenAPIDocument } from './interfaces';

/**
 * Value for key (version) represents the function which converts specification from previous version to the given as key.
 */
const converters: Record<string, ConvertFunction | ConvertOpenAPIFunction> = {
  ...firstConverters,
  ...secondConverters,
  ...thirdConverters,
  ...openapiConverters,
};

const conversionVersions = Object.keys(converters);

function convertOpenAPIToAsyncAPI(openapiDocument: OpenAPIDocument | AsyncAPIDocument, options: ConvertOptions): AsyncAPIDocument {
  const openapiToAsyncapiConverter = converters['openapi'];
  if (openapiToAsyncapiConverter) {
    return openapiToAsyncapiConverter(openapiDocument as any, options) as AsyncAPIDocument;
  } else {
    throw new Error(`Unsupported OpenAPI version. This converter only supports OpenAPI 3.0.`);
  }
}

// export function convert(input: string, version?: ConvertVersion, options?: ConvertOptions): string;
// export function convert(input: AsyncAPIDocument, version?: ConvertVersion, options?: ConvertOptions): AsyncAPIDocument;
export function convert(input: string | AsyncAPIDocument | OpenAPIDocument, version: ConvertVersion , options: ConvertOptions= {}): string | AsyncAPIDocument | OpenAPIDocument {
  const { format, document } = serializeInput(input);

  if ('openapi' in document) {
    let convertedAsyncAPI = convertOpenAPIToAsyncAPI(document, options);
    return format === 'yaml' ? dump(convertedAsyncAPI, { skipInvalid: true }) : convertedAsyncAPI;
  }

  const asyncapiVersion = document.asyncapi;
  let fromVersion = conversionVersions.indexOf(asyncapiVersion);
  const toVersion = conversionVersions.indexOf(version);

  if (fromVersion === -1 || toVersion === -1) {
    throw new Error(`Cannot convert from ${asyncapiVersion} to ${version}.`);
  }
  if (fromVersion > toVersion) {
    throw new Error(`Cannot downgrade from ${asyncapiVersion} to ${version}.`);
  }
  if (fromVersion === toVersion) {
    throw new Error(`Cannot convert to the same version.`);
  }

  // add 1 to `fromVersion` because we convert from previous to next
  fromVersion++;
  let converted = document;
  for (let i = fromVersion; i <= toVersion; i++) {
    const v = conversionVersions[i] as ConvertVersion;
    const convertFunction = converters[v];
    converted = ('asyncapi' in converted)
    ? (convertFunction as ConvertFunction)(converted as AsyncAPIDocument, options)
    : (convertFunction as ConvertOpenAPIFunction)(converted as OpenAPIDocument, options);
  }

  if (format === 'yaml') {
    return dump(converted, { skipInvalid: true });
  }
  return converted;
}
