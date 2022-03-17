"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertMessage = exports.dotsToSlashes = exports.objectToSchema = exports.streamToChannel = exports.eventToChannel = exports.serializeInput = void 0;
const js_yaml_1 = require("js-yaml");
function serializeInput(document) {
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
            document: (0, js_yaml_1.load)(document),
        };
    }
    catch (e) {
        try {
            if (tryingConvertToYaml) {
                throw e;
            }
            // try to parse (again) YAML, because the text itself may not have a JSON representation and cannot be represented as a JSON object/string
            return {
                format: 'yaml',
                document: (0, js_yaml_1.load)(document),
            };
        }
        catch (err) {
            throw new Error('AsyncAPI document must be a valid JSON or YAML document.');
        }
    }
}
exports.serializeInput = serializeInput;
;
function eventToChannel(event) {
    const out = {};
    if (event.receive) {
        out.publish = {
            message: {
                oneOf: event.receive
            }
        };
    }
    if (event.send) {
        out.subscribe = {
            message: {
                oneOf: event.send
            }
        };
    }
    return out;
}
exports.eventToChannel = eventToChannel;
;
function streamToChannel(stream) {
    const out = {};
    if (stream.read) {
        out.publish = {
            message: {
                oneOf: stream.read
            }
        };
    }
    if (stream.write) {
        out.subscribe = {
            message: {
                oneOf: stream.write
            }
        };
    }
    return out;
}
exports.streamToChannel = streamToChannel;
;
function objectToSchema(obj) {
    return { type: 'object', properties: Object.assign({}, obj) };
}
exports.objectToSchema = objectToSchema;
;
function dotsToSlashes(topic) {
    return topic.replace(/\./g, '/');
}
exports.dotsToSlashes = dotsToSlashes;
function convertMessage(message) {
    if (message.oneOf) {
        message.oneOf.forEach((m) => {
            if (m.protocolInfo) {
                m.bindings = m.protocolInfo;
                delete m.protocolInfo;
            }
            if (m.headers) {
                m.headers = objectToSchema(m.headers);
            }
        });
    }
    else {
        if (message.protocolInfo) {
            message.bindings = message.protocolInfo;
            delete message.protocolInfo;
        }
        if (message.headers) {
            message.headers = objectToSchema(message.headers);
        }
    }
}
exports.convertMessage = convertMessage;
