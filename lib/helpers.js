const yaml = require('js-yaml');
const helpers = module.exports;

helpers.serialize = (text) => {
    try {
        return {
            isYAML: true,
            parsed: yaml.safeLoad(text)
        };
    } catch (e) {
        try {
            return {
                isYAML: false,
                parsed: JSON.parse(text)
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

helpers.objectToSchema = obj => {
    const schema = { type: 'object', properties: {} };
    _.each(obj, (prop, propName) => {
        schema.properties[propName] = prop;
    });
    return obj;
};