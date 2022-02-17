const yaml = require('js-yaml');
const _ = require('lodash');
const {
  serialize,
  dotsToSlashes,
  eventToChannel,
  streamToChannel,
  convertMessage,
} = require('./helpers');

const lib = module.exports;

/**
 * Value for key (version) represents the function which converts specification from previous version to the given as key.
 */
const conversions = {
  '1.0.0': undefined,
  '1.1.0': from__1_0_0__to__1_1_0,
  '1.2.0': from__1_1_0__to__1_2_0,
  '2.0.0-rc1': from__1_2_0__to__2_0_0_rc1,
  '2.0.0-rc2': from__2_0_0_rc1__to__2_0_0_rc2,
  '2.0.0': from__2_0_0_rc2__to__2_0_0,
  '2.1.0': from__2_0_0__to__2_1_0,
  '2.2.0': from__2_1_0__to__2_2_0,
  '2.3.0': from__2_2_0__to__2_3_0,
}
const conversionVersions = Object.keys(conversions);

lib.convert = (asyncapi, version, options = {}) => {
  const { isYAML, parsed } = serialize(asyncapi);
  if (parsed === undefined) return '';

  let fromVersion = conversionVersions.indexOf(parsed.asyncapi);
  const toVersion = conversionVersions.indexOf(version);

  if (fromVersion === -1 || toVersion === -1) {
    throw new Error(`Cannot convert from ${parsed.asyncapi} to ${version}.`);
  }
  if (fromVersion > toVersion) {
    throw new Error(`Cannot downgrade from ${parsed.asyncapi} to ${version}.`);
  }
  if (fromVersion === toVersion) {
    throw new Error(`Cannot convert to the same version.`);
  }

  // add 1 to `fromVersion` because we convert from previous to next
  fromVersion++;
  let converted = parsed;
  for (let i = fromVersion; i <= toVersion; i++) {
    const fn = conversions[conversionVersions[i]];
    converted = fn(converted, options);
  }

  if (isYAML) {
    converted = yaml.safeDump(converted, { skipInvalid: true });
  }
  return converted;
};

function from__1_0_0__to__1_1_0(asyncapi) {
  return asyncapi;
}

function from__1_1_0__to__1_2_0(asyncapi) {
  return asyncapi;
}

function from__1_2_0__to__2_0_0_rc1(asyncapi1, options) { // NOSONAR
  const result = asyncapi1;

  result.asyncapi = '2.0.0-rc1';
  result.id = options.id || `urn:${asyncapi1.info.title.toLowerCase().split(' ').join('.')}`;

  if (asyncapi1.servers) {
    const security = asyncapi1.security;
    result.servers = asyncapi1.servers.map(server => {
      const { scheme, schemeVersion, ...rest } = server;

      const out = {
        ...rest,
        ...{
          protocol: scheme,
        }
      };

      if (schemeVersion) out.protocolVersion = schemeVersion;

      if (security) {
        out.security = security;
      }

      return out;
    });
  }

  if (asyncapi1.topics) {
    const baseTopic = asyncapi1.baseTopic ? `${asyncapi1.baseTopic}.` : "";
    result.channels = _.mapKeys(result.topics, (__, topicName) => dotsToSlashes(`${baseTopic}${topicName}`));
    _.map(result.channels, ch => {
      if (ch.publish) {
        ch.publish = { message: ch.publish };
      }
      if (ch.subscribe) {
        ch.subscribe = { message: ch.subscribe };
      }
    });
  } else if (asyncapi1.stream) {
    result.channels = {
      '/': streamToChannel(asyncapi1.stream),
    };
  } else if (asyncapi1.events) {
    result.channels = {
      '/': eventToChannel(asyncapi1.events),
    };
  }

  delete result.topics;
  delete result.stream;
  delete result.events;
  delete result.baseTopic;
  delete result.security;

  return result;
}

function from__2_0_0_rc1__to__2_0_0_rc2(asyncapi2rc1, options) { // NOSONAR
  const result = asyncapi2rc1;

  result.asyncapi = '2.0.0-rc2';
  result.id = result.id || options.id;

  if (asyncapi2rc1.servers) {
    const serverMap = {};
    asyncapi2rc1.servers.forEach((server, index) => {
      if (server.baseChannel) delete server.baseChannel;
      const name = index === 0 ? 'default' : `server${index}`;
      serverMap[name] = server;
    });
    result.servers = serverMap;
  }

  if (result.channels) {
    _.each(result.channels, (channel, channelName) => {
      if (channel.parameters) {
        const parametersMap = {};
        const paramNames = channelName.match(/\{([^\}]{1,100})\}/g).map(p => p.substr(1, p.length - 2));
        channel.parameters.forEach((parameter, index) => {
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

  if (!options.id) delete result.id;
  return result;
}

function from__2_0_0_rc2__to__2_0_0(asyncapi2rc2, options) {
  const result = asyncapi2rc2;
  if (!options.id) delete result.id;
  result.asyncapi = '2.0.0';
  return result;
}

function from__2_0_0__to__2_1_0(asyncapi) {
  asyncapi.asyncapi = '2.1.0';
  return asyncapi;
}

function from__2_1_0__to__2_2_0(asyncapi) {
  asyncapi.asyncapi = '2.2.0';
  return asyncapi;
}

function from__2_2_0__to__2_3_0(asyncapi) {
  asyncapi.asyncapi = '2.3.0';
  return asyncapi;
}