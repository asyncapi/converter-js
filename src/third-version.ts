import { isPlainObject, createRefObject, isRefObject, sortObjectKeys, getValueByRef, getValueByPath } from './utils';

import type { AsyncAPIDocument, ConvertOptions, ConvertFunction } from './interfaces';

type ConvertV2To3Options = Required<Exclude<ConvertOptions['v2to3'], undefined>>;

export const converters: Record<string, ConvertFunction> = {
  '3.0.0': from__2_6_0__to__3_0_0,
}

function from__2_6_0__to__3_0_0(asyncapi: AsyncAPIDocument, options: ConvertOptions): AsyncAPIDocument {
  asyncapi.asyncapi = '3.0.0';

  const v2to3: ConvertV2To3Options = {
    ...(options.v2to3 || {}),
    idGenerator() { return '' },
    pointOfView: 'application',
  }

  convertInfoObject(asyncapi);
  convertServerObjects(asyncapi);
  convertChannelObjects(asyncapi, v2to3);

  return sortObjectKeys(
    asyncapi, 
    ['asyncapi', 'id', 'info', 'defaultContentType', 'servers', 'channels', 'operations', 'components']
  );
}

/**
 * Moving Tags and ExternalDocs to the Info Object
 */
function convertInfoObject(asyncapi: AsyncAPIDocument) {
  if (asyncapi.tags) {
    asyncapi.info.tags = asyncapi.tags;
    delete asyncapi.tags;
  }

  if (asyncapi.externalDocs) {
    asyncapi.info.externalDocs = asyncapi.externalDocs;
    delete asyncapi.externalDocs;
  }

  asyncapi.info = sortObjectKeys(
    asyncapi.info,
    ['title', 'version', 'description', 'termsOfService', 'contact', 'license', 'tags', 'externalDocs']
  )
}

/**
 * Unify referencing mechanism in security field
 */
function convertServerObjects(asyncapi: AsyncAPIDocument) {
  const servers = asyncapi.servers;
  if (!isPlainObject(servers)) {
    return;
  }

  Object.values(servers).forEach((server: any) => {
    if (server.security) {
      server.security = convertSecurityObject(server.security, asyncapi);
    }
  });
}

/**
 * Split Channel Objects to the Channel Objects and Operation Objects
 */
function convertChannelObjects(asyncapi: AsyncAPIDocument, options: ConvertV2To3Options) {
  const channels = asyncapi.channels;
  if (!isPlainObject(channels)) {
    return;
  }

  const newChannels: Record<string, any> = {};
  Object.entries(channels).forEach(([channelAddress, channel]: [string, any]) => {
    const channelId = channel['x-channelId'] || channelAddress;
    channel.address = channelAddress;

    // change the Server names to the Refs
    const servers = channel.servers;
    if (Array.isArray(servers)) {
      channel.servers = servers.map((serverName: string) => createRefObject('servers', serverName));
    }

    const operations: Record<string, any> = {};
    // serialize publish Operation Objects to standalone object
    const publish = channel.publish;
    let publishMessages: Record<string, any> | undefined;
    if (isPlainObject(publish)) {
      const { id, operation: newOperation, messages } = convertOperationObject(publish, 'publish', channelId, channel, asyncapi, options);
      if (publish.security) {
        newOperation.security = convertSecurityObject(publish.security, asyncapi);
      }

      operations[id] = newOperation;
      delete channel.publish;
      publishMessages = messages;
    }

    // serialize subscribe Operation Objects to standalone object
    const subscribe = channel.subscribe;
    let subscribeMessages: Record<string, any> | undefined;
    if (isPlainObject(subscribe)) {
      const { id, operation: newOperation, messages } = convertOperationObject(subscribe, 'subscribe', channelId, channel, asyncapi, options);
      if (subscribe.security) {
        newOperation.security = convertSecurityObject(subscribe.security, asyncapi);
      }

      operations[id] = newOperation;
      delete channel.subscribe;
      subscribeMessages = messages;
    }

    if (publishMessages || subscribeMessages) {
      channel.messages = {
        ...publishMessages || {},
        ...subscribeMessages || {},
      }
    }

    if (Object.keys(operations)) {
      asyncapi.operations = { ...asyncapi.operations || {}, ...operations };
    }

    newChannels[channelId] = sortObjectKeys(
      channel, 
      ['address', 'messages', 'title', 'summary', 'description', 'servers', 'parameters', 'tags', 'externalDocs', 'bindings'],
    );
  });

  asyncapi.channels = newChannels;
}

function convertOperationObject(oldOperation: any, kind: 'publish' | 'subscribe', channelId: string, channel: any, asyncapi: AsyncAPIDocument, options: ConvertV2To3Options): { id: string, operation: any, messages?: Record<string, any> } {
  const operation = { ...oldOperation };

  if (channel.address) {
    operation.channel = createRefObject('channels', channel.address);
  }

  const isPublish = kind === 'publish';
  if (options.pointOfView === 'application') {
    operation.action = isPublish ? 'receive' : 'send';
  } else {
    operation.action = isPublish ? 'send' : 'receive';
  }

  const oldOperationId = operation.operationId;
  const operationId = oldOperationId || (channelId ? `${channelId}.${kind}` : kind);
  try {
    delete operation.operationId;
  } catch(err) {}

  const message = operation.message;
  let serializedMessages: Record<string, any> | undefined;
  if (message) {
    delete operation.message;

    if (Array.isArray(message.oneOf)) {
      serializedMessages = message.oneOf.reduce((acc: Record<string, any>, current: any, index: number) => {
        let messageId: string | undefined = current.messageId;
        if (isRefObject(current)) {
          const possibleMessage = getValueByRef(asyncapi, current.$ref);
          if (possibleMessage) {
            messageId = possibleMessage.messageId || messageId;
          }
        }

        const id = messageId || `${oldOperationId || kind}.message.${index}`;
        acc[id] = current;
        return acc;
      }, {});
    } else {
      let messageId: string | undefined = message.messageId;
      if (isRefObject(message)) {
        const possibleMessage = getValueByRef(asyncapi, message.$ref);
        if (possibleMessage) {
          messageId = possibleMessage.messageId || messageId;
        }
      }

      const id = messageId || `${oldOperationId || kind}.message`;
      serializedMessages = { [id]: message };
    }

    if (Object.keys(serializedMessages || {})) {
      const newOperationMessages: Array<any> = [];
      Object.keys(serializedMessages || {}).forEach(messageId => {
        const messageValue = serializedMessages![messageId];
        if (isRefObject(messageValue)) {
          // shallow copy of JS reference
          newOperationMessages.push({ ...messageValue });
        } else {
          newOperationMessages.push(createRefObject('channels', channel.address, 'messages', messageId));
        }
      });
      operation.messages = newOperationMessages;
    }
  }

  const sortedOperation = sortObjectKeys(
    operation, 
    ['action', 'channel', 'title', 'summary', 'description', 'security', 'tags', 'externalDocs', 'bindings', 'traits'],
  );

  return { id: operationId, operation: sortedOperation, messages: serializedMessages };
}

/**
 * Unify referencing mechanism in security field
 */
function convertSecurityObject(security: Array<Record<string, Array<string>>>, asyncapi: AsyncAPIDocument) {
  const newSecurity: Array<any> = [];
  security.forEach((securityItem, index) => {
    Object.entries(securityItem).forEach(([securityName, scopes]) => {
      // without scopes - use normal ref
      if (!scopes.length) {
        newSecurity.push(createRefObject('components', 'securitySchemes', securityName))
        return;
      }

      // create new security scheme in the components/securitySchemes with appropriate scopes
      const securityScheme = getValueByPath(asyncapi, ['components', 'securitySchemes', securityName]);
      convertSecuritySchemeObject(securityScheme);

      newSecurity.push({
        ...JSON.parse(JSON.stringify(securityScheme)),
        scopes: [...scopes],
      });
    });
  });
  return newSecurity;
}

function convertSecuritySchemeObject(securityScheme: any) {
  if (securityScheme.flows) {
    ['implicit', 'password', 'clientCredentials', 'authorizationCode'].forEach(flow => {
      const flowScheme = securityScheme.flows[flow];
      if (flowScheme && flowScheme.scopes) {
        flowScheme.availableScopes = flowScheme.scopes;
        delete flowScheme.scopes;
      }
    });
  }
}
