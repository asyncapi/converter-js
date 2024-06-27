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
const asyncAPIconverters: Record<string, ConvertFunction> = {
  ...firstConverters,
  ...secondConverters,
  ...thirdConverters,
};

const conversionVersions = Object.keys(asyncAPIconverters);

export function convert(input: string, version: ConvertVersion, options?: ConvertOptions): string;
export function convert(input: AsyncAPIDocument, version: ConvertVersion, options?: ConvertOptions): AsyncAPIDocument;
export function convert(input: string | AsyncAPIDocument, version: ConvertVersion , options: ConvertOptions= {}): string | AsyncAPIDocument {
  const { format, document } = serializeInput(input);

  if ('openapi' in document) {
    throw new Error('Cannot convert OpenAPI document. Use convertOpenAPI function instead.');
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
    converted = asyncAPIconverters[v](converted, options);
  }

  if (format === 'yaml') {
    return dump(converted, { skipInvalid: true });
  }
  return converted;
}

export function convertOpenAPI(input: string ,options?: ConvertOptions): string;
export function convertOpenAPI(input: OpenAPIDocument ,options?: ConvertOptions): AsyncAPIDocument;
export function convertOpenAPI(input: string | OpenAPIDocument,options: ConvertOptions = {}): string | AsyncAPIDocument {

  const { format, document } = serializeInput(input);

  const openapiToAsyncapiConverter = openapiConverters["openapi"] as ConvertOpenAPIFunction;

  if (!openapiToAsyncapiConverter) {
    throw new Error("OpenAPI to AsyncAPI converter is not available.");
  }

  const convertedAsyncAPI = openapiToAsyncapiConverter(document as OpenAPIDocument, options);

  if (format === "yaml") {
    return dump(convertedAsyncAPI, { skipInvalid: true });
  }
  return convertedAsyncAPI;
}
