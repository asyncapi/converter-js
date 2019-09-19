const yaml = require('js-yaml');
const _ = require('lodash');
const {
  serialize,
  dotsToSlashes,
  eventToChannel,
  streamToChannel,
  objectToSchema,
} = require('./helpers');

const lib = module.exports;

const conversions = {
  '1.0.0-to-2.0.0-rc1': from1to2rc1,
  '1.1.0-to-2.0.0-rc1': from1to2rc1,
  '1.2.0-to-2.0.0-rc1': from1to2rc1,
  '2.0.0-rc1-to-2.0.0-rc2': from2rc1to2rc2,
  '1.0.0-to-2.0.0-rc2': from1to2rc2,
  '1.1.0-to-2.0.0-rc2': from1to2rc2,
  '1.2.0-to-2.0.0-rc2': from1to2rc2,
  '1.0.0-to-2.0.0': from1to2,
  '1.1.0-to-2.0.0': from1to2,
  '1.2.0-to-2.0.0': from1to2,
  '2.0.0-rc1-to-2.0.0': from2rc1to2,
  '2.0.0-rc2-to-2.0.0': from2rc2to2,

};

lib.convert = (asyncapi, version, options = {}) => {
  const { isYAML, parsed } = serialize(asyncapi);
  if (parsed === undefined) return '';

  const conversion = `${parsed.asyncapi}-to-${version}`;

  if (conversions[conversion]) {
    const result = conversions[conversion](parsed, options);
    let converted = result;
    if (isYAML) converted = yaml.safeDump(result, { skipInvalid: true });
    return converted;
  } else {
    console.error(`Can't convert from ${parsed.asyncapi} to ${version}.`);
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

function from2rc1to2rc2 (asyncapi2rc1, options) {
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
        const paramNames = channelName.match(/\{([^\}]+)\}/g).map(p => p.substr(1, p.length - 2));
        channel.parameters.forEach((parameter, index) => {
          const name = parameter.name || paramNames[index];
          if (parameter.name) delete parameter.name;
          parametersMap[name] = parameter;
        });
        channel.parameters = parametersMap;
      }

      if (channel.publish && channel.publish.message) {
        const message = channel.publish.message;
        if (message.oneOf) {
          message.oneOf.forEach(m => {
            if (m.protocolInfo) {
              m.bindings = m.protocolInfo;
              delete m.protocolInfo;
            }

            if (m.headers) m.headers = objectToSchema(m.headers);
          });
        } else {
          if (message.protocolInfo) {
            message.bindings = message.protocolInfo;
            delete message.protocolInfo;
          }

          if (message.headers) message.headers = objectToSchema(message.headers);
        }
      }
      
      if (channel.subscribe && channel.subscribe.message) {
        const message = channel.subscribe.message;
        if (message.oneOf) {
          message.oneOf.forEach(m => {
            if (m.protocolInfo) {
              m.bindings = m.protocolInfo;
              delete m.protocolInfo;
            }

            if (m.headers) m.headers = objectToSchema(m.headers);
          });
        } else {
          if (message.protocolInfo) {
            message.bindings = message.protocolInfo;
            delete message.protocolInfo;
          }

          if (message.headers) message.headers = objectToSchema(message.headers);
        }
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

  return result;
}

function from1to2rc2 (asyncapi1, options) {
  let res = from1to2rc1(asyncapi1, options);
  if (!options.id) delete res.id;
  return from2rc1to2rc2(res, options);
}

// Release 2.0.0 mappings

function from1to2 (asyncapi1, options) {
  let res = from1to2rc2(asyncapi1, options);
  return from2rc2to2(res, options);
}

function from2rc1to2 (asyncapi2rc1, options) {
  const result =  from2rc1to2rc2(res, options);
  result.asyncapi = '2.0.0';

  return result;
}

// version 2.0.0-rc2 has the same schema as 2.0.0 release
function from2rc2to2 (asyncapi2rc2, options) {
  const result = asyncapi2rc2;
  result.asyncapi = '2.0.0';

  return result;
}
