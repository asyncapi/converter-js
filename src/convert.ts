import { dump } from 'js-yaml';

import { converters as firstConverters } from "./first-version";
import { converters as secondConverters } from "./second-version";
import { converters as thirdConverters } from "./third-version";
import { converters as openapiConverters } from "./openapi";

import { serializeInput } from "./utils";

import type { AsyncAPIDocument, AsyncAPIConvertVersion, OpenAPIConvertVersion, ConvertOptions, ConvertFunction, ConvertOpenAPIFunction, OpenAPIDocument, OpenAPIToAsyncAPIOptions } from './interfaces';

/**
 * Value for key (version) represents the function which converts specification from previous version to the given as key.
 */
const asyncAPIconverters: Record<string, ConvertFunction> = {
  ...firstConverters,
  ...secondConverters,
  ...thirdConverters,
};

const conversionVersions = Object.keys(asyncAPIconverters);

export function convert(input: string, version: AsyncAPIConvertVersion, options?: ConvertOptions): string;
export function convert(input: AsyncAPIDocument, version: AsyncAPIConvertVersion, options?: ConvertOptions): AsyncAPIDocument;
export function convert(input: string | AsyncAPIDocument, version: AsyncAPIConvertVersion , options: ConvertOptions= {}): string | AsyncAPIDocument {
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
    const v = conversionVersions[i] as AsyncAPIConvertVersion;
    converted = asyncAPIconverters[v](converted, options);
  }

  if (format === 'yaml') {
    return dump(converted, { skipInvalid: true });
  }
  return converted;
}

export function convertOpenAPI(input: string ,version: OpenAPIConvertVersion,options?: OpenAPIToAsyncAPIOptions): string;
export function convertOpenAPI(input: OpenAPIDocument, version: OpenAPIConvertVersion ,options?: OpenAPIToAsyncAPIOptions): AsyncAPIDocument;
export function convertOpenAPI(input: string | OpenAPIDocument, version: OpenAPIConvertVersion, options: OpenAPIToAsyncAPIOptions = {}): string | AsyncAPIDocument {

  const { format, document } = serializeInput(input);
  const openApiVersion = document.openapi;
  const converterVersion = openApiVersion === '3.0.0' ? '3.0.0' : openApiVersion;

  const openapiToAsyncapiConverter = openapiConverters[converterVersion as OpenAPIConvertVersion] as ConvertOpenAPIFunction;

  if (!openapiToAsyncapiConverter) {
    throw new Error(`We are not able to convert OpenAPI ${converterVersion} to AsyncAPI, please raise a feature request.`);
  }

  const convertedAsyncAPI = openapiToAsyncapiConverter(document as OpenAPIDocument, options);

  if (format === "yaml") {
    return dump(convertedAsyncAPI, { skipInvalid: true });
  }
  return convertedAsyncAPI;
}
