const yaml = require('js-yaml');
const _ = require('lodash');
const {
  serialize,
  dotsToSlashes,
  eventToChannel,
  streamToChannel,
} = require('./helpers');

const lib = module.exports;

const conversions = {
  '1.0.0-to-2.0.0-rc1': from1to2rc1,
  '1.1.0-to-2.0.0-rc1': from1to2rc1,
  '1.2.0-to-2.0.0-rc1': from1to2rc1,
};

lib.convert = (asyncapi, version, options) => {
  const { isYAML, json } = serialize(asyncapi);
  if (json === undefined) return '';

  const conversion = `${json.asyncapi}-to-${version}`;

  if (conversions[conversion]) {
    const result = conversions[conversion](json, options);
    let converted = result;
    if (isYAML) converted = yaml.safeDump(result);
    return converted;
  } else {
    console.error(`Can't convert from ${asyncapi1.asyncapi} to ${version}.`);
  }
};

function from1to2rc1 (asyncapi1, options) {
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
  _.mapKeys(result.servers, (_, topicName) => dotsToSlashes(`${asyncapi1.baseTopic ? `${asyncapi1.baseTopic}.` : ''}${topicName}`));
  
  if (asyncapi1.topics) {
    result.channels = _.mapKeys(result.topics, (_, topicName) => dotsToSlashes(`${asyncapi1.baseTopic ? `${asyncapi1.baseTopic}.` : ''}${topicName}`));
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