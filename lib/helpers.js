const _ = require('lodash');
const yaml = require('js-yaml');
const helpers = module.exports;

helpers.serialize = (text) => {
    if (typeof text === 'object') {
        return {
            isYAML: false,
            parsed: text,
        };
    }

    try {
        const maybeJSON = JSON.parse(text);
        if (typeof maybeJSON === 'object') {
            return {
                isYAML: false,
                parsed: maybeJSON,
            };
        }

        // if `maybeJSON` is object, then we have 100% sure that we operate on JSON, 
        // but if it's `string` then we have option that it can be YAML but it doesn't have to be
        return {
            isYAML: true,
            parsed: yaml.safeLoad(text)
        };
    } catch (e) {
        try {
            // try to parse again YAML, because the text itself may not have a JSON representation and cannot be represented as a JSON object/string
            return {
                isYAML: true,
                parsed: yaml.safeLoad(text)
            };
        } catch (err) {
            throw new Error('AsyncAPI document must be a valid JSON or YAML document.');
        }
    }
};

helpers.dotsToSlashes = topic => topic.replace(/\./g, '/');

helpers.eventToChannel = event => {
    const out = {};
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

helpers.streamToChannel = event => {
    const out = {};
    if (event.read) {
        out.publish = {
            message: {
                oneOf: event.read
            }
        }
    }
    if (event.write) {
        out.subscribe = {
            message: {
                oneOf: event.write
            }
        }
    }

    return out;
};

const objectToSchema = obj => {
    const schema = { type: 'object', properties: {} };
    _.each(obj, (prop, propName) => {
        schema.properties[propName] = prop;
    });
    return obj;
};

helpers.convertMessage = message => {
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
