import { dump } from 'js-yaml';

import { converters as firstConverters } from "./first-version";
import { converters as secondConverters } from "./second-version";
import { converters as thirdConverters } from "./third-version";

import { serializeInput } from "./utils";

import type { AsyncAPIDocument, ConvertVersion, ConvertOptions, ConvertFunction } from './interfaces';

/**
 * Value for key (version) represents the function which converts specification from previous version to the given as key.
 */
const converters: Record<string, ConvertFunction> = {
  ...firstConverters,
  ...secondConverters,
  ...thirdConverters,
};
const conversionVersions = Object.keys(converters);

export function convert(asyncapi: string, version?: ConvertVersion, options?: ConvertOptions): string;
export function convert(asyncapi: AsyncAPIDocument, version?: ConvertVersion, options?: ConvertOptions): AsyncAPIDocument;
export function convert(asyncapi: string | AsyncAPIDocument, version: ConvertVersion = '2.6.0', options: ConvertOptions = {}): string | AsyncAPIDocument {
  const { format, document } = serializeInput(asyncapi);

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
    converted = converters[v](converted, options);
  }

  if (format === 'yaml') {
    return dump(converted, { skipInvalid: true });
  }
  return converted;
}
