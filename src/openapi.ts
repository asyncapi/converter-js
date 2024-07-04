import { sortObjectKeys, isRefObject, isPlainObject } from "./utils";
import { AsyncAPIDocument, ConvertOpenAPIFunction, ConvertOptions, OpenAPIDocument } from "./interfaces";

export const converters: Record<string, ConvertOpenAPIFunction > = {
  'openapi': from_openapi_to_asyncapi,
}

function from_openapi_to_asyncapi(openapi: OpenAPIDocument, options?: ConvertOptions): AsyncAPIDocument {
  const asyncapi: Partial<AsyncAPIDocument> = {
      asyncapi: openapi.openapi,
      info: convertInfoObject(openapi.info, openapi),
      servers: isPlainObject(openapi.servers) ? convertServerObjects(openapi.servers, openapi) : undefined,
      channels: convertPathsToChannels(openapi.paths),
      operations: convertPathsToOperations(openapi.paths, 'server'),
  };

  return sortObjectKeys(
      asyncapi as AsyncAPIDocument,
      ['asyncapi', 'info', 'defaultContentType', 'servers', 'channels', 'operations', 'components']
  );
}

function convertInfoObject(info: OpenAPIDocument['info'], openapi: OpenAPIDocument): AsyncAPIDocument['info'] {
  return sortObjectKeys({
      ...info,
      tags: openapi.tags || undefined,
      externalDocs: openapi.externalDocs || undefined,
  }, [
      "title",
      "version",
      "description",
      "termsOfService",
      "contact",
      "license",
      "tags",
      "externalDocs",
  ]);
}

function convertServerObjects(servers: Record<string, any>, openapi: OpenAPIDocument): AsyncAPIDocument['servers'] {
  const newServers: Record<string, any> = {};
  const security: Record<string, any> = openapi.security;
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

    if (protocol !== undefined && server.protocol === undefined) {
      server.protocol = protocol;
    }
    delete server.url;

    if (security) {
      server.security = convertSecurity(security);
      delete openapi.security;
    }

      newServers[serverName] = sortObjectKeys(
        server,
        ['host', 'pathname', 'protocol', 'protocolVersion', 'title', 'summary', 'description', 'variables', 'security', 'tags', 'externalDocs', 'bindings'],
      );
    });

    return newServers;
}

function resolveServerUrl(url: string): {
  host: string;
  pathname?: string;
  protocol: string;
} {
  let [maybeProtocol, maybeHost] = url.split("://");
  console.log("maybeProtocol", maybeProtocol, "maybeshost:", maybeHost)
  if (!maybeHost) {
      maybeHost = maybeProtocol;
  }
  const [host, ...pathnames] = maybeHost.split("/");
  console.log("host", host, "pathnames", pathnames)
  console.log(`/${pathnames.join("/")}`)
  if (pathnames.length) {
      return {
          host,
          pathname: `/${pathnames.join("/")}`,
          protocol: maybeProtocol,
      };
  }
  return { host, pathname: undefined , protocol: maybeProtocol };
}

function convertSecurity(security: Record<string, any>): Record<string, any> {
  return security.map((securityRequirement: Record<string, any>) => {
      const newSecurityRequirement: Record<string, any> = {};
      Object.entries(securityRequirement).forEach(([key, value]) => {
          if (value.type === 'oauth2' && value.flows.authorizationCode?.scopes) {
              newSecurityRequirement[key] = {
                  ...value,
                  flows: {
                      ...value.flows,
                      authorizationCode: {
                          ...value.flows.authorizationCode,
                          availableScopes: value.flows.authorizationCode.scopes,
                      },
                  },
              };
              delete newSecurityRequirement[key].flows.authorizationCode.scopes;
          } else {
              newSecurityRequirement[key] = value;
          }
      });
      return newSecurityRequirement;
  });
}

function convertPathsToChannels(paths: OpenAPIDocument['paths']): AsyncAPIDocument['channels'] {
  const channels: AsyncAPIDocument['channels'] = {};

  Object.entries(paths).forEach(([path, pathItem]:[any,any]) => {
    const channelName = path.replace(/^\//, '').replace(/\//g, '_');
    channels[channelName] = {
      address: path,
      messages: {},
      parameters: {}
    };

    Object.entries(pathItem).forEach(([method, operation]:[any,any]) => {
      if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
        const parameters = convertParameters(pathItem[method].parameters)
        channels[channelName].parameters = { ...channels[channelName].parameters, ...parameters };

        if (operation.responses) {
          Object.entries(operation.responses).forEach(([statusCode, response]:[any,any]) => {
            const messageName = `${operation.operationId || method}Response${statusCode}`;
            channels[channelName].messages[messageName] = {
              name: messageName,
              payload: response.content?.['application/json']?.schema || {},
              bindings: getMessageBindings(statusCode, parameters.headers)
            };
          }
        );
        }
      }
    });
  });

  return channels;
}
function convertPathsToOperations(paths: OpenAPIDocument['paths'], pointOfView: 'server' | 'client'): AsyncAPIDocument['operations'] {
  const operations: AsyncAPIDocument['operations'] = {};

  Object.entries(paths).forEach(([path, pathItem]:[any,any]) => {
    const channelName = path.replace(/^\//, '').replace(/\//g, '_');

    Object.entries(pathItem).forEach(([method, operation]:[any,any]) => {
      if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
        const operationId = operation.operationId || `${method}${channelName}`;
        const parameters = convertParameters(pathItem[method].parameters);
        operations[operationId] = {
          action: pointOfView === 'server' ? 'receive' : 'send',
          channel: {
            $ref: `#/channels/${channelName}`
          },
          summary: operation.summary,
          description: operation.description,
          tags: operation.tags,
          bindings: getOperationBindings(method, parameters?.query)
        };
      }
    });
  });

  return operations;
}

function getOperationBindings(method: string, queryParameters?: Record<string, any>): Record<string, any> {
  const bindings: Record<string, any> = {
    http: {
      bindingVersion: "0.3.0",
    },
  };

  if (method) {
    bindings.http.method = method.toUpperCase();
  }

  if (queryParameters && Object.keys(queryParameters).length > 0) {
    bindings.http.query = {...queryParameters};
  }

  return bindings;
}

function getMessageBindings(statusCode?: string, headers?: Record<string, any>): Record<string, any> {
  const bindings: Record<string, any> = {
    http: {
      bindingVersion: "0.3.0",
    },
  };

  if (statusCode) {
    bindings.http.statusCode = parseInt(statusCode);
  }

  if (headers && Object.keys(headers).length > 0) {
    bindings.http.headers = {...headers};
  }

  return bindings;
}

function getChannelBindings(method: string, header?: Record<string, any>, query?: Record<string,any>): Record<string, any> {
  const bindings: Record<string, any> = {
    ws: {
      bindingVersion: "0.1.0",
    },
  };

  if (method) {
    bindings.http.method = method.toUpperCase();
  }

  if (query && Object.keys(query).length > 0) {
    bindings.ws.query = {...query};
  }

  if (header && Object.keys(header).length > 0) {
    bindings.ws.header = {...header};
  }

  return bindings;
}

function convertParameters(parameters: any[]): Record<string, any> {
  const convertedParams: Record<string, any> = {};
  
  if (Array.isArray(parameters)) {
    parameters.forEach((param) => {
      const paramObj: Record<string, any> = {
        ...(param.description !== undefined && { description: param.description }),
      };
      
      switch (param.in) {
        case 'query':
          paramObj.query = param.schema;
          break;
        case 'header':
          paramObj.headers = param.schema;
          break;
        case 'cookie':
          throw new Error('Cookie parameters are not supported in asyncapi');
      }

      Object.assign(convertedParams, paramObj);
    });
  }
  return convertedParams;
}
