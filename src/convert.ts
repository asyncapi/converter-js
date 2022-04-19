import { dump } from 'js-yaml';

import { 
  serializeInput,
  dotsToSlashes,
  streamToChannel,
  eventToChannel,
  convertMessage,
} from "./utils";

import type { AsyncAPIDocument, ConvertVersion, ConvertOptions } from './interfaces';

/**
 * Value for key (version) represents the function which converts specification from previous version to the given as key.
 */
 const conversions: Record<string, (asyncapi: AsyncAPIDocument, options: ConvertOptions) => AsyncAPIDocument> = {
  '1.0.0': from__undefined__to__1_0_0,
  '1.1.0': from__1_0_0__to__1_1_0,
  '1.2.0': from__1_1_0__to__1_2_0,
  '2.0.0-rc1': from__1_2_0__to__2_0_0_rc1,
  '2.0.0-rc2': from__2_0_0_rc1__to__2_0_0_rc2,
  '2.0.0': from__2_0_0_rc2__to__2_0_0,
  '2.1.0': from__2_0_0__to__2_1_0,
  '2.2.0': from__2_1_0__to__2_2_0,
  '2.3.0': from__2_2_0__to__2_3_0,
  '2.4.0': from__2_3_0__to__2_4_0,
};
const conversionVersions = Object.keys(conversions);

export function convert(asyncapi: string, version: ConvertVersion, options?: ConvertOptions): string;
export function convert(asyncapi: AsyncAPIDocument, version: ConvertVersion, options?: ConvertOptions): AsyncAPIDocument;
export function convert(asyncapi: string | AsyncAPIDocument, version: ConvertVersion, options: ConvertOptions = {}): string | AsyncAPIDocument {
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
    converted = conversions[conversionVersions[i]](converted, options);
  }

  if (format === 'yaml') {
    return dump(converted, { skipInvalid: true });
  }
  return converted;
}

function from__undefined__to__1_0_0(asyncapi: AsyncAPIDocument, _: ConvertOptions) {
  asyncapi.asyncapi = '1.0.0';
  return asyncapi;
}

function from__1_0_0__to__1_1_0(asyncapi: AsyncAPIDocument, _: ConvertOptions) {
  asyncapi.asyncapi = '1.1.0';
  return asyncapi;
}

function from__1_1_0__to__1_2_0(asyncapi: AsyncAPIDocument, _: ConvertOptions) {
  asyncapi.asyncapi = '1.2.0';
  return asyncapi;
}

function from__1_2_0__to__2_0_0_rc1(asyncapi: AsyncAPIDocument, options: ConvertOptions) { // NOSONAR
  asyncapi.asyncapi = '2.0.0-rc1';
  asyncapi.id = options.id || `urn:${asyncapi.info.title.toLowerCase().split(' ').join('.')}`;

  if (asyncapi.servers) {
    const security = asyncapi.security;
    asyncapi.servers = asyncapi.servers.map((server: any) => {
      const { scheme, schemeVersion, ...rest } = server;

      const out = {
        ...rest,
        protocol: scheme
      };
      if (schemeVersion) {
        out.protocolVersion = schemeVersion;
      }
      if (security) {
        out.security = security;
      }

      return out;
    });
  }

  if (asyncapi.topics) {
    const baseTopic = asyncapi.baseTopic ? `${asyncapi.baseTopic}.` : "";
    asyncapi.channels = Object.entries(asyncapi.topics as Record<string, any>).reduce((newChannels, [channelName, channel]) => {
      if (channel.publish) {
        channel.publish = { message: channel.publish };
      }
      if (channel.subscribe) {
        channel.subscribe = { message: channel.subscribe };
      }
      channelName = dotsToSlashes(`${baseTopic}${channelName}`)
      newChannels[channelName] = channel;

      return newChannels;
    }, {} as Record<string, any>);
  } else if (asyncapi.stream) {
    asyncapi.channels = {
      '/': streamToChannel(asyncapi.stream),
    };
  } else if (asyncapi.events) {
    asyncapi.channels = {
      '/': eventToChannel(asyncapi.events),
    };
  }

  delete asyncapi.topics;
  delete asyncapi.stream;
  delete asyncapi.events;
  delete asyncapi.baseTopic;
  delete asyncapi.security;

  return asyncapi;
}

function from__2_0_0_rc1__to__2_0_0_rc2(asyncapi: AsyncAPIDocument, options: ConvertOptions) { // NOSONAR
  asyncapi.asyncapi = '2.0.0-rc2';
  asyncapi.id = asyncapi.id || options.id;

  if (asyncapi.servers) {
    const serverMap: Record<string, any> = {};
    asyncapi.servers.forEach((server: any, index: number) => {
      if (server.baseChannel) delete server.baseChannel;
      const name = index === 0 ? 'default' : `server${index}`;
      serverMap[name] = server;
    });
    asyncapi.servers = serverMap;
  }

  if (asyncapi.channels) {
    Object.entries(asyncapi.channels as Record<string, any>).forEach(([channelName, channel]) => {
      if (channel.parameters) {
        const parametersMap: Record<string, any> = {};
        const paramNames = (channelName.match(/\{([^\}]{1,100})\}/g) as string[]).map(p => p.substr(1, p.length - 2)); // NOSONAR
        channel.parameters.forEach((parameter: any, index: number) => {
          const name = parameter.name || paramNames[index];
          if (parameter.name) delete parameter.name;
          parametersMap[name] = parameter;
        });
        channel.parameters = parametersMap;
      }

      if (channel.publish && channel.publish.message) {
        const message = channel.publish.message;
        convertMessage(message);
      }

      if (channel.subscribe && channel.subscribe.message) {
        const message = channel.subscribe.message;
        convertMessage(message);
      }

      if (channel.protocolInfo) {
        channel.bindings = channel.protocolInfo;
        delete channel.protocolInfo;
      }

      if (channel.publish && channel.publish.protocolInfo) {
        channel.publish.bindings = channel.publish.protocolInfo;
        delete channel.publish.protocolInfo;
      }

      if (channel.subscribe && channel.subscribe.protocolInfo) {
        channel.subscribe.bindings = channel.subscribe.protocolInfo;
        delete channel.subscribe.protocolInfo;
      }
    });
  }

  if (asyncapi.components && asyncapi.components.parameters) {
    Object.values(asyncapi.components.parameters).forEach((parameter: any) => {
      if (parameter.name) delete parameter.name;
    });
  }

  if (!options.id) delete asyncapi.id;
  return asyncapi;
}

function from__2_0_0_rc2__to__2_0_0(asyncapi: AsyncAPIDocument, options: ConvertOptions) {
  asyncapi.asyncapi = '2.0.0';
  if (!options.id) delete asyncapi.id;
  return asyncapi;
}

function from__2_0_0__to__2_1_0(asyncapi: AsyncAPIDocument, _: ConvertOptions) {
  asyncapi.asyncapi = '2.1.0';
  return asyncapi;
}

function from__2_1_0__to__2_2_0(asyncapi: AsyncAPIDocument, _: ConvertOptions) {
  asyncapi.asyncapi = '2.2.0';
  return asyncapi;
}

function from__2_2_0__to__2_3_0(asyncapi: AsyncAPIDocument, _: ConvertOptions) {
  asyncapi.asyncapi = '2.3.0';
  return asyncapi;
}

function from__2_3_0__to__2_4_0(asyncapi: AsyncAPIDocument, _: ConvertOptions) {
  asyncapi.asyncapi = '2.4.0';
  return asyncapi;
}