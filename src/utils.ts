import { load } from 'js-yaml';

import type { AsyncAPIDocument } from "./interfaces";

export function serializeInput(document: string | AsyncAPIDocument): { format: 'json' | 'yaml', document: AsyncAPIDocument } | never {
  let tryingConvertToYaml = false;
  try {
    if (typeof document === 'object') {
      return {
        format: 'json',
        document: JSON.parse(JSON.stringify(document)), // copy object
      };
    }

    const maybeJSON = JSON.parse(document);
    if (typeof maybeJSON === 'object') {
      return {
        format: 'json',
        document: maybeJSON,
      };
    }

    tryingConvertToYaml = true;
    // if `maybeJSON` is object, then we have 100% sure that we operate on JSON, 
    // but if it's `string` then we have option that it can be YAML but it doesn't have to be
    return {
      format: 'yaml',
      document: load(document) as AsyncAPIDocument,
    };
  } catch (e) {
    try {
      if (tryingConvertToYaml) {
        throw e;
      }

      // try to parse (again) YAML, because the text itself may not have a JSON representation and cannot be represented as a JSON object/string
      return {
        format: 'yaml',
        document: load(document as string) as AsyncAPIDocument,
      };
    } catch (err) {
      throw new Error('AsyncAPI document must be a valid JSON or YAML document.');
    }
  }
};

export function eventToChannel(event: any) {
  const out: { publish: any, subscribe: any } = {} as any;
  if (event.receive) {
    out.publish = {
      message: {
        oneOf: event.receive
      }
    }
  }
  if (event.send) {
    out.subscribe = {
      message: {
        oneOf: event.send
      }
    }
  }
  return out;
};

export function streamToChannel(stream: any) {
  const out: { publish: any, subscribe: any } = {} as any;
  if (stream.read) {
    out.publish = {
      message: {
        oneOf: stream.read
      }
    }
  }
  if (stream.write) {
    out.subscribe = {
      message: {
        oneOf: stream.write
      }
    }
  }
  return out;
};

export function objectToSchema(obj: Record<string, unknown>) {
  return { type: 'object', properties: { ...obj } };
};

export function dotsToSlashes(topic: string) {
  return topic.replace(/\./g, '/');
}

export function convertMessage(message: any) {
  if (message.oneOf) {
    message.oneOf.forEach((m: any) => {
      if (m.protocolInfo) {
        m.bindings = m.protocolInfo;
        delete m.protocolInfo;
      }
          
      if (m.headers) {
        m.headers = objectToSchema(m.headers);
      }
    });
  } else {
    if (message.protocolInfo) {
      message.bindings = message.protocolInfo;
      delete message.protocolInfo;
    }

    if (message.headers) {
      message.headers = objectToSchema(message.headers);
    }
  }
}
