import { load } from 'js-yaml';

import type { AsyncAPIDocument, OpenAPIDocument } from "./interfaces";

const EMPTY_OR_INVALID_INPUT = 'Input document is empty or invalid.';
const INVALID_JSON_YAML = 'AsyncAPI document must be a valid JSON or YAML document.';

function assertDocumentObject(document: unknown): asserts document is AsyncAPIDocument | OpenAPIDocument {
  // typeof null === 'object' in JS; YAML `null` / empty docs also yield null/undefined from js-yaml.
  if (document === null || document === undefined || typeof document !== 'object' || Array.isArray(document)) {
    throw new Error(EMPTY_OR_INVALID_INPUT);
  }
}

export function serializeInput(document: string | AsyncAPIDocument | OpenAPIDocument | Record<string,any>): { format: 'json' | 'yaml', document: AsyncAPIDocument | OpenAPIDocument } | never {
  let triedConvertToYaml = false;
  try {
    if (typeof document === 'object') {
      assertDocumentObject(document);
      return {
        format: 'json',
        document: JSON.parse(JSON.stringify(document)), // copy object
      };
    }

    if (typeof document === 'string' && document.trim() === '') {
      throw new Error(EMPTY_OR_INVALID_INPUT);
    }

    const maybeJSON = JSON.parse(document);
    if (typeof maybeJSON === 'object') {
      assertDocumentObject(maybeJSON);
      return {
        format: 'json',
        document: maybeJSON,
      };
    }

    triedConvertToYaml = true; // NOSONAR
    // if `maybeJSON` is object, then we have 100% sure that we operate on JSON, 
    // but if it's `string` then we have option that it can be YAML but it doesn't have to be
    const yamlDoc = load(document) as AsyncAPIDocument | OpenAPIDocument;
    assertDocumentObject(yamlDoc);
    return {
      format: 'yaml',
      document: yamlDoc,
    };
  } catch (e) {
    if (e instanceof Error && e.message === EMPTY_OR_INVALID_INPUT) {
      throw e;
    }
    try {
      if (triedConvertToYaml) {
        throw e;
      }

      // try to parse (again) YAML, because the text itself may not have a JSON representation and cannot be represented as a JSON object/string
      const yamlDoc = load(document as string) as AsyncAPIDocument | OpenAPIDocument;
      assertDocumentObject(yamlDoc);
      return {
        format: 'yaml',
        document: yamlDoc,
      };
    } catch (err) {
      if (err instanceof Error && err.message === EMPTY_OR_INVALID_INPUT) {
        throw err;
      }
      throw new Error(INVALID_JSON_YAML);
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