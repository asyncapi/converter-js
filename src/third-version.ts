import { isPlainObject, createRefObject, isRefObject, sortObjectKeys, getValueByRef, getValueByPath, createRefPath } from './utils';
import type { AsyncAPIDocument, ConvertOptions, ConvertV2ToV3Options, ConvertFunction } from './interfaces';

export const converters: Record<string, ConvertFunction> = {
  '3.0.0': from__2_6_0__to__3_0_0,
}

type RequiredConvertV2ToV3Options =  Required<ConvertV2ToV3Options>;
type ConvertContext =  {
  refs: Map<string, string>;
};

function from__2_6_0__to__3_0_0(asyncapi: AsyncAPIDocument, options: ConvertOptions): AsyncAPIDocument {
  asyncapi.asyncapi = '3.0.0';

  const v2tov3Options: RequiredConvertV2ToV3Options = {
    pointOfView: 'application',
    useChannelIdExtension: true,
    convertServerComponents: true,
    convertChannelComponents: true,
    ...(options.v2tov3 ?? {}),
  } as RequiredConvertV2ToV3Options;
  v2tov3Options.idGenerator = v2tov3Options.idGenerator || idGeneratorFactory(v2tov3Options);
  const context: ConvertContext = {
    refs: new Map(),
  } 

  convertInfoObject(asyncapi, context);
  if (isPlainObject(asyncapi.servers)) {
    asyncapi.servers = convertServerObjects(asyncapi.servers, asyncapi);
  }
  if (isPlainObject(asyncapi.channels)) {
    asyncapi.channels = convertChannelObjects(asyncapi.channels, asyncapi, v2tov3Options, context);
  }
  convertComponents(asyncapi, v2tov3Options, context);
  replaceDeepRefs(asyncapi, context.refs, '', asyncapi);

  return sortObjectKeys(
    asyncapi, 
    ['asyncapi', 'id', 'info', 'defaultContentType', 'servers', 'channels', 'operations', 'components']
  );
}

/**
 * Moving Tags and ExternalDocs to the Info Object.
 */
function convertInfoObject(asyncapi: AsyncAPIDocument, context: ConvertContext) {
  if (asyncapi.tags) {
    asyncapi.info.tags = asyncapi.tags;
    context.refs.set(createRefPath('tags'), createRefPath('info', 'tags'));
    delete asyncapi.tags;
  }

  if (asyncapi.externalDocs) {
    asyncapi.info.externalDocs = asyncapi.externalDocs;
    context.refs.set(createRefPath('externalDocs'), createRefPath('info', 'externalDocs'));
    delete asyncapi.externalDocs;
  }

  asyncapi.info = sortObjectKeys(
    asyncapi.info,
    ['title', 'version', 'description', 'termsOfService', 'contact', 'license', 'tags', 'externalDocs'],
  );
}

/**
 * Split `url` field to the `host` and `pathname` (optional) fields.
 * Unify referencing mechanism in security field.
 */
function convertServerObjects(servers: Record<string, any>, asyncapi: AsyncAPIDocument) {
  const newServers: Record<string, any> = {};
  Object.entries(servers).forEach(([serverName, server]: [string, any]) => {
    if (isRefObject(server)) {
      newServers[serverName] = server;
      return;
    }

    const { host, pathname, protocol } = resolveServerUrl(server.url);
    server.host = host;
    if (pathname !== undefined) {
      server.pathname = pathname;
    }
    // Dont overwrite anything
    if(protocol !== undefined && server.protocol === undefined) {
      server.protocol = protocol;
    }
    delete server.url;

    if (server.security) {
      server.security = convertSecurityObject(server.security, asyncapi);
    }

    newServers[serverName] = sortObjectKeys(
      server,
      ['host', 'pathname', 'protocol', 'protocolVersion', 'title', 'summary', 'description', 'variables', 'security', 'tags', 'externalDocs', 'bindings'],
    );
  });
  return newServers;
}

type ToStandaloneOperationData = {
  kind: 'subscribe' | 'publish', 
  channel: any, 
  asyncapi: any, 
  operations: any, 
  context:any, 
  inComponents: boolean, 
  channelId: string, 
  channelAddress: string, 
  options: any, 
  oldPath: string[]
}
/**
 * Convert operation part of channels into standalone operations
 */
function toStandaloneOperation(data: ToStandaloneOperationData): Record<string, any> {
  const {kind, channel, asyncapi, operations, context, inComponents, channelId, channelAddress, options, oldPath} = data;
  let operation = channel[kind];
  const operationPath = inComponents ? ['components', 'operations'] : ['operations'];
  if (isPlainObject(operation)) {
    const { operationId, operation: newOperation, messages } = convertOperationObject({ asyncapi, kind, channel, channelId, oldChannelId: channelAddress, operation, inComponents }, options, context);
    if (operation.security) {
      newOperation.security = convertSecurityObject(operation.security, asyncapi);
    }
    operationPath.push(operationId);
    
    context.refs.set(createRefPath(...oldPath, kind), createRefPath(...operationPath));
    operations[operationId] = newOperation;
    delete channel[kind];
    return messages ?? {};
  }
  return {};
}

/**
 * Split Channel Objects to the Channel Objects and Operation Objects.
 */
function convertChannelObjects(channels: Record<string, any>, asyncapi: AsyncAPIDocument, options: RequiredConvertV2ToV3Options, context: ConvertContext, inComponents: boolean = false) {
  const newChannels: Record<string, any> = {};
  Object.entries(channels).forEach(([channelAddress, channel]) => {
    const oldPath = inComponents ? ['components', 'channels', channelAddress] : ['channels', channelAddress];
    const channelId = options.idGenerator({ asyncapi, kind: 'channel', key: channelAddress, path: oldPath, object: channel });
    const newPath = inComponents ? ['components', 'channels', channelId] : ['channels', channelId];
    context.refs.set(createRefPath(...oldPath), createRefPath(...newPath));

    if (isRefObject(channel)) {
      newChannels[channelId] = channel;
      return;
    }

    // assign address
    channel.address = channelAddress;
    // change the Server names to the Refs
    const servers = channel.servers;
    if (Array.isArray(servers)) {
      channel.servers = servers.map((serverName: string) => createRefObject('servers', serverName));
    }

    //Change parameter formats
    if (isPlainObject(channel.parameters)) {
      channel.parameters = convertParameters(channel.parameters);
    }

    const operations: Record<string, any> = {};
    // serialize publish and subscribe Operation Objects to standalone object
    const publishMessages = toStandaloneOperation({kind: 'publish', channel, asyncapi, operations, context, inComponents, channelId, channelAddress, options, oldPath});
    const subscribeMessages = toStandaloneOperation({kind: 'subscribe', channel, asyncapi, operations, context, inComponents, channelId, channelAddress, options, oldPath});

    if (publishMessages || subscribeMessages) {
      const allOperationMessages = {
        ...publishMessages,
        ...subscribeMessages,
      }
      channel.messages = convertMessages({
        messages: allOperationMessages
      });
    }

    setOperationsOnRoot({operations, inComponents, asyncapi, oldPath});
    newChannels[channelId] = sortObjectKeys(
      channel, 
      ['address', 'messages', 'title', 'summary', 'description', 'servers', 'parameters', 'tags', 'externalDocs', 'bindings'],
    );
  });
  return newChannels;
}

type SetOperationsOnRootData = {
  operations: any,
  inComponents: boolean,
  asyncapi: AsyncAPIDocument,
  oldPath: string[]
}
/**
 * Assign the operations to the root AsyncAPI object.
 */
function setOperationsOnRoot(data: SetOperationsOnRootData){
  const {operations, inComponents, asyncapi, oldPath} = data; 
  if (Object.keys(operations)) {
    if (inComponents) {
      const components = asyncapi.components = asyncapi.components ?? {};
      components.operations = { ...components.operations ?? {}, ...operations };

      // if given component is used in the `channels` object then create references for operations in the `operations` object
      if (channelIsUsed(asyncapi.channels ?? {}, oldPath)) {
        const referencedOperations = Object.keys(operations).reduce((acc, current) => {
          acc[current] = createRefObject('components', 'operations', current);
          return acc;
        }, {} as Record<string, any>);
        asyncapi.operations = { ...asyncapi.operations ?? {}, ...referencedOperations };
      }
    } else {
      asyncapi.operations = { ...asyncapi.operations ?? {}, ...operations };
    }
  }
}

type ConvertOperationObjectData = {
  asyncapi: AsyncAPIDocument;
  operation: any;
  channel: any;
  channelId: string;
  oldChannelId: string;
  kind: 'publish' | 'subscribe';
  inComponents: boolean;
}
/**
 * Points to the connected channel and split messages for channel
 */
function convertOperationObject(data: ConvertOperationObjectData, options: RequiredConvertV2ToV3Options, context: ConvertContext): { operationId: string, operation: any, messages?: Record<string, any> } {
  const { asyncapi, channelId, oldChannelId, kind, inComponents } = data;
  const operation = { ...data.operation };

  const oldChannelPath = ['channels', oldChannelId];
  if (inComponents) {
    oldChannelPath.unshift('components');
  }
  const newChannelPath = ['channels', channelId];
  if (inComponents) {
    newChannelPath.unshift('components');
  }

  const operationId = options.idGenerator({ asyncapi, kind: 'operation', key: kind, path: oldChannelPath, object: data.operation, parentId: channelId });
  operation.channel = createRefObject(...newChannelPath);
  try {
    delete operation.operationId;
  } catch(err) {}


  const isPublish = kind === 'publish';
  if (options.pointOfView === 'application') {
    operation.action = isPublish ? 'receive' : 'send';
  } else {
    operation.action = isPublish ? 'send' : 'receive';
  }

  const message = operation.message;
  let serializedMessages: Record<string, any> = {};
  if (message) {
    delete operation.message;

    const oldMessagePath = ['channels', oldChannelId, kind, 'message'];
    const newMessagePath = ['channels', channelId, 'messages'];
    if (inComponents) {
      oldMessagePath.unshift('components');
      newMessagePath.unshift('components');
    }
    serializedMessages = moveMessagesFromOperation(message, newMessagePath, oldMessagePath, asyncapi, options, context, operationId);
    applyMessageRefsToOperation(serializedMessages, newMessagePath, operation);
  }

  const sortedOperation = sortObjectKeys(
    operation, 
    ['action', 'channel', 'title', 'summary', 'description', 'security', 'tags', 'externalDocs', 'bindings', 'traits'],
  );

  return { operationId, operation: sortedOperation, messages: serializedMessages };
}
/**
 * Remove all messages under operations and return an object of them.
 */
function moveMessagesFromOperation(message: any, newMessagePath: string[], oldMessagePath: string[], asyncapi: any, options: any, context: any, operationId: string): Record<string, any> {
  if (Array.isArray(message.oneOf)) {
    //Message oneOf no longer exists, it's implicit by having multiple entires in the message object.
    return message.oneOf.reduce((acc: Record<string, any>, current: any, index: number) => {
      const messagePath = [...oldMessagePath, 'oneOf', index];
      const messageId = options.idGenerator({ asyncapi, kind: 'message', key: index, path: messagePath, object: current, parentId: operationId });
      context.refs.set(createRefPath(...messagePath), createRefPath(...newMessagePath, messageId));
      acc[messageId] = current;
      return acc;
    }, {});
  } else {
    const messageId = options.idGenerator({ asyncapi, kind: 'message', key: 'message', path: oldMessagePath, object: message, parentId: operationId });
    context.refs.set(createRefPath(...oldMessagePath), createRefPath(...newMessagePath, messageId));
    return { [messageId]: message };
  }
}

/**
 * Add references of messages to operations.
 */
function applyMessageRefsToOperation(serializedMessages: Record<string, any>, newMessagePath: string[], operation: any) {
  if (Object.keys(serializedMessages ?? {}).length > 0 ) {
    const newOperationMessages: Array<any> = [];
    Object.entries(serializedMessages).forEach(([messageId, messageValue]) => {
      if (isRefObject(messageValue)) {
        // shallow copy of JS reference
        newOperationMessages.push({ ...messageValue });
      } else {
        const messagePath = [...newMessagePath, messageId];
        newOperationMessages.push(createRefObject(...messagePath));
      }
    });
    operation.messages = newOperationMessages;
  }
}

type ConvertMessagesObjectData = {
  messages: Record<string, any>
}
/**
 * Convert messages that use custom schema format into schema union.
 */
function convertMessages(data: ConvertMessagesObjectData): Record<string, any>{
  const messages = {...data.messages};
  // Convert schema formats to union schemas
  Object.entries(messages).forEach(([_, message]) => {
    if(message.schemaFormat !== undefined) {
      const payloadSchema = message.payload;
      message.payload = {
        schemaFormat: message.schemaFormat,
        schema: payloadSchema
      }
      delete message.schemaFormat;
    }
  });
  return messages;
}

/**
 * Convert `channels`, `servers` and `securitySchemes` in components.
 */
function convertComponents(asyncapi: AsyncAPIDocument, options: RequiredConvertV2ToV3Options, context: ConvertContext) {
  const components = asyncapi.components;
  if (!isPlainObject(components)) {
    return;
  }

  if (options.convertServerComponents && isPlainObject(components.servers)) {
    components.servers = convertServerObjects(components.servers, asyncapi);
  }
  if (options.convertChannelComponents && isPlainObject(components.channels)) {
    components.channels = convertChannelObjects(components.channels, asyncapi, options, context, true);
  }
  if (isPlainObject(components.securitySchemes)) {
    components.securitySchemes = convertSecuritySchemes(components.securitySchemes);
  }

  if (isPlainObject(components.messages)) {
    components.messages = convertMessages({
      messages: components.messages
    });
  }

  if (isPlainObject(components.parameters)) {
    components.parameters = convertParameters(components.parameters);
  }
}
/**
 * Convert all parameters to the new v3 format
 */
function convertParameters(parameters: Record<string, any>): Record<string, any> {
  const newParameters: Record<string, any> = {};
  Object.entries(parameters).forEach(([name, parameter]) => {
    newParameters[name] = convertParameter(parameter);
  });
  return newParameters;
}
/**
 * Convert the old v2 parameter object to v3.
 * 
 * Ensure that extensions and references are all kept as is.
 * 
 * Does not include extensions from schema.
 */
function convertParameter(parameter: any): any {
  const ref = parameter['$ref'] ?? null;
  if(ref !== null) {
    return {
      $ref: ref
    }
  }

  if(parameter.schema?.$ref) {
    console.error('Could not convert parameter object because the `.schema` property was a reference. This have to be changed manually if you want any of the properties included. The reference was ' + parameter.schema?.$ref);
  }

  const enumValues = parameter.schema?.enum ?? null;
  const defaultValues = parameter.schema?.default ?? null;
  const description = parameter.description ?? parameter.schema?.description ?? null;
  const examples = parameter.schema?.examples ?? null;
  const location = parameter.location ?? null;

  //Make sure we keep parameter extensions
  const v2ParameterObjectProperties = ["location", "schema", "description"];
  const v2ParameterObjectExtensions = Object.entries(parameter).filter(([key,]) => {
    return !v2ParameterObjectProperties.includes(key);
  });

  //Return the new v3 parameter object
  return Object.assign({...v2ParameterObjectExtensions},
    enumValues === null ? null : {enum: enumValues},
    defaultValues === null ? null : {default: defaultValues},
    description === null ? null : {description},
    examples === null ? null : {examples},
    location === null ? null : {location}
  );
}
/**
 * Convert `channels`, `servers` and `securitySchemes` in components.
 */
function convertSecuritySchemes(securitySchemes: Record<string, any>): Record<string, any> {
  const newSecuritySchemes: Record<string, any> = {};
  Object.entries(securitySchemes).forEach(([name, scheme]) => {
    newSecuritySchemes[name] = convertSecuritySchemeObject(scheme);
  });
  return newSecuritySchemes;
}

/**
 * Unify referencing mechanism in security field
 */
function convertSecurityObject(security: Array<Record<string, Array<string>>>, asyncapi: AsyncAPIDocument) {
  const newSecurity: Array<any> = [];
  security.forEach(securityItem => {
    Object.entries(securityItem).forEach(([securityName, scopes]) => {
      // without scopes - use ref
      if (!scopes.length) {
        newSecurity.push(createRefObject('components', 'securitySchemes', securityName))
        return;
      }

      // create new security scheme in the components/securitySchemes with appropriate scopes
      const securityScheme = getValueByPath(asyncapi, ['components', 'securitySchemes', securityName]);
      // handle logic only on `oauth2` and `openIdConnect` security mechanism
      if (securityScheme.type === 'oauth2' || securityScheme.type === 'openIdConnect') {
        const newSecurityScheme = convertSecuritySchemeObject(securityScheme);
        newSecurity.push({
          ...newSecurityScheme,
          scopes: [...scopes],
        });
      }
    });
  });
  return newSecurity;
}

const flowKinds = ['implicit', 'password', 'clientCredentials', 'authorizationCode'];
/**
 * Convert security scheme object to new from v3 version (flow.[x].scopes -> flow.[x].availableScopes).
 */
function convertSecuritySchemeObject(original: any) {
  const securityScheme = JSON.parse(JSON.stringify(original));
  if (securityScheme.flows) {
    flowKinds.forEach(flow => {
      const flowScheme = securityScheme.flows[flow];
      if (flowScheme?.scopes) {
        flowScheme.availableScopes = flowScheme.scopes;
        delete flowScheme.scopes;
      }
    });
  }
  return securityScheme;
}

/**
 * Split `url` to the `host` and `pathname` (optional) fields.
 * 
 * This function takes care of https://github.com/asyncapi/spec/pull/888
 */
function resolveServerUrl(url: string): { host: string, pathname: string | undefined, protocol: string | undefined } {
  let [maybeProtocol, maybeHost] = url.split('://');
  if (!maybeHost) {
    maybeHost = maybeProtocol;
  }

  const [host, ...pathnames] = maybeHost.split('/');
  if (pathnames.length) {
    return { host, pathname: `/${pathnames.join('/')}`, protocol: maybeProtocol };
  }
  return { host, pathname: undefined, protocol: maybeProtocol };
}

/**
 * Check if given channel (based on path) is used in the `channels` object.
 */
function channelIsUsed(channels: Record<string, any>, path: Array<string | number>): boolean {
  for (const channel of Object.values(channels)) {
    if (isRefObject(channel) && createRefPath(...path) === channel.$ref) {
      return true;
    }
  }
  return false;
}

/**
 * Replace all deep local references with the new beginning of ref (when object is moved to another place).
 */
function replaceDeepRefs(value: any, refs: ConvertContext['refs'], key: string | number, parent: any): void {
  if (key === '$ref' && typeof value === 'string') {
    const newRef = replaceRef(value, refs);
    if (typeof newRef === 'string') {
      parent[key] = newRef;
    }
    return;
  }

  if (Array.isArray(value)) {
    return value.forEach((item, idx) => replaceDeepRefs(item, refs, idx, value));
  }

  if (value && typeof value === 'object') {
    for (const objKey in value) {
      replaceDeepRefs(value[objKey], refs, objKey, value);
    }
  }
}

function replaceRef(ref: string, refs: ConvertContext['refs']): string | undefined {
  const allowed: string[] = [];
  refs.forEach((_, key) => {
    // few refs can be allowed
    if (ref.startsWith(key)) {
      allowed.push(key);
    }
  });

  // find the longest one
  allowed.sort((a, b) => a.length - b.length);
  const from = allowed.pop();
  if (!from) {
    return;
  }

  const toReplace = refs.get(from);
  if (toReplace) {
    return ref.replace(from, toReplace);
  }
}

/**
 * Default function to generate ids for objects.
 */
function idGeneratorFactory(options: ConvertV2ToV3Options): ConvertV2ToV3Options['idGenerator'] {
  const useChannelIdExtension = options.useChannelIdExtension;
  return (data: Parameters<Exclude<ConvertV2ToV3Options['idGenerator'], undefined>>[0]): string => {
    const { asyncapi, kind, object, key, parentId } = data;

    switch (kind) {
      case 'channel': 
        return generateIdForChannel(object, key, useChannelIdExtension);
      case 'operation': {
        const oldOperationId = object.operationId;
        const operationId = oldOperationId || (parentId ? `${parentId}.${key}` : kind);
        return operationId;
      };
      case 'message':
        return generateIdForMessage(object, asyncapi, parentId, key);
      default: return '';
    }
  };
}
function generateIdForChannel(object: any, key: any, useChannelIdExtension: boolean | undefined) {
  if (isRefObject(object)) {
    const id = key as string;
    return id;
  }

  const channel = object;
  let channelId: string;
  if (useChannelIdExtension) {
    channelId = channel['x-channelId'] || key as string;
  } else {
    channelId = key as string;
  }
  return channelId;
}

function generateIdForMessage(object: any, asyncapi: any, parentId: string | undefined, key: any) {
  if (isRefObject(object)) {
    const possibleMessage = getValueByRef(asyncapi, object.$ref);
    if (possibleMessage?.messageId) {
      const messageId = possibleMessage.messageId;
      return messageId;
    }
  }

  const messageId = object.messageId;
  if (messageId) {
    return messageId;
  }

  let operationKind: string;
  const splitParentId = parentId!.split('.');
  if (splitParentId.length === 1) {
    operationKind = parentId as string;
  } else {
    operationKind = splitParentId.pop() as string;
  }

  if (typeof key === 'number') {
    return `${operationKind}.message.${key}`;
  }
  return `${operationKind}.message`;
}