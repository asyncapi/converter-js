import { load } from 'js-yaml';

import type { AsyncAPIDocument, OpenAPIDocument } from "./interfaces";

export function serializeInput(document: string | AsyncAPIDocument | OpenAPIDocument): { format: 'json' | 'yaml', document: AsyncAPIDocument | OpenAPIDocument } | never {
  let triedConvertToYaml = false;
  try {
    if (typeof document === 'object') {
      return {
        format: 'json',
        document: JSON.parse(JSON.stringify(document)), // copy object
      };
    }

    const maybeJSON = JSON.parse(document);
    if (typeof maybeJSON === 'object') {
      if ('openapi' in maybeJSON) {
        return {
          format: 'json',
          document: maybeJSON,
        };
      } else {
        return {
          format: 'json',
          document: maybeJSON,
        };
      }
    }

    triedConvertToYaml = true; // NOSONAR
    // if `maybeJSON` is object, then we have 100% sure that we operate on JSON, 
    // but if it's `string` then we have option that it can be YAML but it doesn't have to be
    return {
      format: 'yaml',
      document: load(document) as AsyncAPIDocument | OpenAPIDocument,
    };
  } catch (e) {
    try {
      if (triedConvertToYaml) {
        throw e;
      }

      // try to parse (again) YAML, because the text itself may not have a JSON representation and cannot be represented as a JSON object/string
      return {
        format: 'yaml',
        document: load(document as string) as AsyncAPIDocument | OpenAPIDocument,
      };
    } catch (err) {
      throw new Error('AsyncAPI document must be a valid JSON or YAML document.');
    }
  }
}

export function objectToSchema(obj: Record<string, unknown>) {
  return { type: 'object', properties: { ...obj } };
}

export function dotsToSlashes(topic: string) {
  return topic.replace(/\./g, '/');
}

export function isPlainObject(value: unknown): boolean {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export function createRefObject(...paths: Array<string | number>) {
  return {
    $ref: createRefPath(...paths),
  }
}

export function createRefPath(...paths: Array<string | number>) {
  return `#/${paths.map(String).map(tilde).join('/')}`;
}

export function isRefObject(value: unknown): boolean {
  return Boolean(value && '$ref' in (value as { $ref: any }));
}

export function isRemoteRef(value: any): boolean {
  return isRefObject(value) && !value.$ref.startsWith('#')
}

export function getValueByRef(root: any, ref: string) {
  if (!ref.startsWith('#')) {
    return;
  }

  // remove `#/` at start, split string by `/` and untilde (change ~1 to / etc)
  const path = ref.substring(2).split('/').map(untilde);
  return getValueByPath(root, path);
}

export function getValueByPath(value: any, path: string[]) {
  let index = 0;
  const length = path.length;

  while (value != null && index < length) {
    value = value[path[index++]];
  }
  return index == length ? value : undefined;
}

export function sortObjectKeys(obj: any, keys: string[]) {
  const newObject: any = {}

  // add sorted keys
  keys.forEach(key => {
    if (key in obj) {
      newObject[key] = obj[key];
    }
  });

  // add rest of keys
  Object.keys(obj).forEach(key => {
    if (!keys.includes(key)) {
      newObject[key] = obj[key];
    }
  });

  return newObject;
}

function tilde(str: string) {
  return str.replace(/[~/]{1}/g, (sub) => {
    switch (sub) {
    case '/': return '~1';
    case '~': return '~0';
    }
    return sub;
  });
}

function untilde(str: string) {
  if (!str.includes('~')) return str;
  return str.replace(/~[01]/g, (sub) => {
    switch (sub) {
    case '~1': return '/';
    case '~0': return '~';
    }
    return sub;
  });
}

export function removeEmptyObjects(obj: Record<string, any>): Record<string, any> {
  Object.keys(obj).forEach(key => {
    if (obj[key] && typeof obj[key] === 'object') {
      removeEmptyObjects(obj[key]);
      if (Object.keys(obj[key]).length === 0) {
        delete obj[key];
      }
    } else if (obj[key] === undefined) {
      delete obj[key];
    }
  });
  return obj;
}