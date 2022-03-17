"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convert = void 0;
const js_yaml_1 = require("js-yaml");
const utils_1 = require("./utils");
/**
 * Value for key (version) represents the function which converts specification from previous version to the given as key.
 */
const conversions = {
    '1.0.0': from__undefined__to__1_0_0,
    '1.1.0': from__1_0_0__to__1_1_0,
    '1.2.0': from__1_1_0__to__1_2_0,
    '2.0.0-rc1': from__1_2_0__to__2_0_0_rc1,
    '2.0.0-rc2': from__2_0_0_rc1__to__2_0_0_rc2,
    '2.0.0': from__2_0_0_rc2__to__2_0_0,
    '2.1.0': from__2_0_0__to__2_1_0,
    '2.2.0': from__2_1_0__to__2_2_0,
    '2.3.0': from__2_2_0__to__2_3_0,
};
const conversionVersions = Object.keys(conversions);
function convert(asyncapi, version, options = {}) {
    const { format, document } = (0, utils_1.serializeInput)(asyncapi);
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
        converted = conversions[conversionVersions[i]](converted);
    }
    if (format === 'yaml') {
        return (0, js_yaml_1.dump)(converted, { skipInvalid: true });
    }
    return converted;
}
exports.convert = convert;
function from__undefined__to__1_0_0(asyncapi) {
    asyncapi.asyncapi = '1.0.0';
    return asyncapi;
}
function from__1_0_0__to__1_1_0(asyncapi) {
    asyncapi.asyncapi = '1.1.0';
    return asyncapi;
}
function from__1_1_0__to__1_2_0(asyncapi) {
    asyncapi.asyncapi = '1.2.0';
    return asyncapi;
}
function from__1_2_0__to__2_0_0_rc1(asyncapi) {
    asyncapi.asyncapi = '2.0.0-rc1';
    asyncapi.id = `urn:${asyncapi.info.title.toLowerCase().split(' ').join('.')}`;
    if (asyncapi.servers) {
        const security = asyncapi.security;
        asyncapi.servers = asyncapi.servers.map((server) => {
            const { scheme, schemeVersion } = server, rest = __rest(server, ["scheme", "schemeVersion"]);
            const out = Object.assign(Object.assign({}, rest), { protocol: scheme });
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
        asyncapi.channels = Object.entries(asyncapi.topics).reduce((newChannels, [channelName, channel]) => {
            if (channel.publish) {
                channel.publish = { message: channel.publish };
            }
            if (channel.subscribe) {
                channel.subscribe = { message: channel.subscribe };
            }
            channelName = (0, utils_1.dotsToSlashes)(`${baseTopic}${channelName}`);
            newChannels[channelName] = channel;
            return newChannels;
        }, {});
    }
    else if (asyncapi.stream) {
        asyncapi.channels = {
            '/': (0, utils_1.streamToChannel)(asyncapi.stream),
        };
    }
    else if (asyncapi.events) {
        asyncapi.channels = {
            '/': (0, utils_1.eventToChannel)(asyncapi.events),
        };
    }
    delete asyncapi.topics;
    delete asyncapi.stream;
    delete asyncapi.events;
    delete asyncapi.baseTopic;
    delete asyncapi.security;
    return asyncapi;
}
function from__2_0_0_rc1__to__2_0_0_rc2(asyncapi) {
    asyncapi.asyncapi = '2.0.0-rc2';
    if (asyncapi.servers) {
        const serverMap = {};
        asyncapi.servers.forEach((server, index) => {
            if (server.baseChannel)
                delete server.baseChannel;
            const name = index === 0 ? 'default' : `server${index}`;
            serverMap[name] = server;
        });
        asyncapi.servers = serverMap;
    }
    if (asyncapi.channels) {
        Object.entries(asyncapi.channels).map(([channelName, channel]) => {
            if (channel.parameters) {
                const parametersMap = {};
                const paramNames = channelName.match(/\{([^\}]{1,100})\}/g).map(p => p.substr(1, p.length - 2));
                channel.parameters.forEach((parameter, index) => {
                    const name = parameter.name || paramNames[index];
                    if (parameter.name)
                        delete parameter.name;
                    parametersMap[name] = parameter;
                });
                channel.parameters = parametersMap;
            }
            if (channel.publish && channel.publish.message) {
                const message = channel.publish.message;
                (0, utils_1.convertMessage)(message);
            }
            if (channel.subscribe && channel.subscribe.message) {
                const message = channel.subscribe.message;
                (0, utils_1.convertMessage)(message);
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
        Object.values(asyncapi.components.parameters).map((parameter) => {
            if (parameter.name)
                delete parameter.name;
        });
    }
    delete asyncapi.id;
    return asyncapi;
}
function from__2_0_0_rc2__to__2_0_0(asyncapi) {
    asyncapi.asyncapi = '2.0.0';
    return asyncapi;
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
