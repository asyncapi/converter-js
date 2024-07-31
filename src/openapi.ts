import { sortObjectKeys, isRefObject, isPlainObject, removeEmptyObjects, createRefObject, isRemoteRef } from "./utils";
import { AsyncAPIDocument, ConvertOpenAPIFunction, OpenAPIToAsyncAPIOptions, OpenAPIDocument } from "./interfaces";

export const converters: Record<string, ConvertOpenAPIFunction > = {
  '3.0.0': from_openapi_to_asyncapi,
}

/**
 * Converts an OpenAPI document to an AsyncAPI document.
 * @param {OpenAPIDocument} openapi - The OpenAPI document to convert.
 * @param {ConvertOptions} options - Conversion options.
 * @returns {AsyncAPIDocument} The converted AsyncAPI document.
 */
function from_openapi_to_asyncapi(openapi: OpenAPIDocument, options: OpenAPIToAsyncAPIOptions = {}): AsyncAPIDocument {
  const perspective = options.perspective || 'server';
  const asyncapi: Partial<AsyncAPIDocument> = {
      asyncapi: '3.0.0',
      info: convertInfoObject(openapi.info, openapi),
      servers: openapi.servers ? convertServerObjects(openapi.servers, openapi) : undefined,
      channels: {},
      operations: {},
      components: convertComponents(openapi)
  };

  const { channels, operations } = convertPaths(openapi.paths, perspective);
  asyncapi.channels = channels;
  asyncapi.operations = operations;

  removeEmptyObjects(asyncapi);

  return sortObjectKeys(
      asyncapi as AsyncAPIDocument,
      ['asyncapi', 'info', 'defaultContentType', 'servers', 'channels', 'operations', 'components']
  );
}

interface InfoObject {
  title: string;
  version: string;
  description?: string;
  termsOfService?: string;
  contact?: ContactObject;
  license?: LicenseObject;
}

interface ContactObject {
  name?: string;
  url?: string;
  email?: string;
}

interface LicenseObject {
  name: string;
  url?: string;
}

/**
 * Converts openAPI info objects to asyncAPI info objects.
 * @param info - The openAPI info object to convert.
 * @param openapi - The complete openAPI document.
 * @returns openAPI info object
 */
function convertInfoObject(info: InfoObject, openapi: OpenAPIDocument): AsyncAPIDocument['info'] {
  return sortObjectKeys({
      ...info,
      tags: [openapi.tags],
      externalDocs: openapi.externalDocs,
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

interface ServerObject {
  url: string;
  description?: string;
  variables?: Record<string, ServerVariableObject>;
}

interface ServerVariableObject {
  enum?: string[];
  default: string;
  description?: string;
}

/**
 * Converts OpenAPI server objects to AsyncAPI server objects.
 * @param {ServerObject[]} servers - The OpenAPI server objects to convert.
 * @param {OpenAPIDocument} openapi - The complete OpenAPI document.
 * @returns {AsyncAPIDocument['servers']} The converted AsyncAPI server objects.
 */
function convertServerObjects(servers: ServerVariableObject[], openapi: OpenAPIDocument): AsyncAPIDocument['servers'] {
  const newServers: Record<string, any> = {};
  const security: Record<string, any> = openapi.security;
  servers.forEach((server: any) => {
    
    const serverName = generateServerName(server.url);
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
      server.security = security.map((securityRequirement: Record<string, any>) => {
        // pass through the security requirement, conversion will happen in components
        return securityRequirement;
      });
      delete openapi.security;
    }

      newServers[serverName] = sortObjectKeys(
        server,
        ['host', 'pathname', 'protocol', 'protocolVersion', 'title', 'summary', 'description', 'variables', 'security', 'tags', 'externalDocs', 'bindings'],
      );
    });

    return newServers;
}

/**
 * Generates a server name based on the server URL.
 * @param {string} url - The server URL.
 * @returns {string} The generated server name.
 */
function generateServerName(url: string): string {
  const { host, pathname } = resolveServerUrl(url);
  const baseName = host.split('.').slice(-2).join('.');
  const pathSegment = pathname ? pathname.split('/')[1] : ''; 
  return `${baseName}${pathSegment ? `_${pathSegment}` : ''}`.replace(/[^a-zA-Z0-9_]/g, '_'); 
}

function resolveServerUrl(url: string): {
  host: string;
  pathname?: string;
  protocol: string;
} {
  let [maybeProtocol, maybeHost] = url.split("://");
  if (!maybeHost) {
      maybeHost = maybeProtocol;
  }
  const [host, ...pathnames] = maybeHost.split("/");

  if (pathnames.length) {
      return {
          host,
          pathname: `/${pathnames.join("/")}`,
          protocol: maybeProtocol,
      };
  }
  return { host, pathname: undefined , protocol: maybeProtocol };
}

/**
 * Converts OpenAPI paths to AsyncAPI channels and operations.
 * @param {Record<string, any>} paths - The OpenAPI paths object.
 * @param {'client' | 'server'} perspective - The perspective of the conversion (client or server).
 * @returns {{ channels: AsyncAPIDocument['channels'], operations: AsyncAPIDocument['operations'] }}
 */
function convertPaths(paths: OpenAPIDocument['paths'], perspective: 'client' | 'server'): { 
  channels: AsyncAPIDocument['channels'], 
  operations: AsyncAPIDocument['operations'] 
} {
  const channels: AsyncAPIDocument['channels'] = {};
  const operations: AsyncAPIDocument['operations'] = {};

  if(paths) {
    for (const [path, pathItemOrRef] of Object.entries(paths)) {
      if (!isPlainObject(pathItemOrRef)) continue;
  
      const pathItem = isRefObject(pathItemOrRef) ? pathItemOrRef : pathItemOrRef as any;
      const channelName = path.replace(/^\//, '').replace(/\//g, '_') || 'root';
      channels[channelName] = {
        address: path,
        messages: {},
        parameters: convertPathParameters(path, pathItem.parameters)
      };
  
      for (const [method, operation] of Object.entries(pathItem)) {
        if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'].includes(method) && isPlainObject(operation)) {
          const operationObject = operation as any;
          const operationId = operationObject.operationId || `${method}${channelName}`;

          // Create operation
          operations[operationId] = {
            action: perspective === 'client' ? 'send' : 'receive',
            channel: createRefObject('channels', channelName),
            summary: operationObject.summary,
            description: operationObject.description,
            tags: operationObject.tags?.map((tag: string) => ({ name: tag })),
            bindings: {
              http: {
                method: method.toUpperCase(),
              }
            },
            messages: []
          };
  
          // Convert request body to message
          if (operationObject.requestBody) {
            const requestMessages = convertRequestBodyToMessages(operationObject.requestBody, operationId, method);
            Object.assign(channels[channelName].messages, requestMessages);
            operations[operationId].messages.push(...Object.keys(requestMessages).map(msgName => 
              createRefObject('channels', channelName, 'messages', msgName)
            ));
          }
  
          // Convert responses to messages
          if (operationObject.responses) {
            const responseMessages = convertResponsesToMessages(operationObject.responses, operationId, method);
            Object.assign(channels[channelName].messages, responseMessages);
            operations[operationId].reply = {
              channel: createRefObject('channels', channelName),
              messages: Object.keys(responseMessages).map(msgName => 
                createRefObject('channels', channelName, 'messages', msgName)
              )
            };
          }

          // Add reply section if there are responses
        if (operationObject.responses && Object.keys(operationObject.responses).length > 0) {
          operations[operationId].reply = {
            channel: createRefObject('channels', channelName),
            messages: Object.entries(operationObject.responses).map(([statusCode, response]) => 
              createRefObject('channels', channelName, 'messages', `${operationId}Response${statusCode}`)
            )
          };
        }
  
          // Convert parameters
          if (operationObject.parameters) {
            const params = convertOperationParameters(operationObject.parameters);
            if (Object.keys(params).length > 0) {
              channels[channelName].parameters = {
                ...channels[channelName].parameters,
                ...params
              };
            }
          }
        }
      }
  
      removeEmptyObjects(channels[channelName]);
    }
  }

  return { channels, operations };
}

/**
 * Converts OpenAPI path parameters to AsyncAPI channel parameters.
 * @param {any[]} parameters - The OpenAPI path parameters.
 * @returns {Record<string, any>} The converted AsyncAPI channel parameters.
 */
function convertPathParameters( path:string, parameters: any[] = []): Record<string, any> {
  const convertedParams: Record<string, any> = {};

  const paramNames = path.match(/\{([^}]+)\}/g)?.map(param => param.slice(1, -1)) || [];
  
  paramNames.forEach(paramName => {
    const param = parameters.find(p => p.name === paramName && p.in === 'path');
    if (param) {
      convertedParams[paramName] = convertParameter(param);
    } else {
      // If the parameter is not defined in the OpenAPI spec, create a default one
      convertedParams[paramName] = {
        description: `Path parameter ${paramName}`,
      };
    }
  });

  return convertedParams;
}

/**
 * Converts OpenAPI operatiion parameters to AsyncAPI operation parameters.
 * @param {any[]} parameters - The OpenAPI operation parameters.
 * @returns {Record<string, any>} The converted AsyncAPI operation parameters.
 */
function convertOperationParameters(parameters: any[]): Record<string, any> {
  const convertedParams: Record<string, any> = {};
  
  parameters.forEach(param => {
    if (!isRefObject(param) && param.in === 'query') {
      convertedParams[param.name] = convertParameter(param);
    }
  });

  return convertedParams;
}

/**
 * Converts an OpenAPI Parameter Object to an AsyncAPI Parameter Object.
 * @param {ParameterObject} param - The OpenAPI Parameter Object.
 * @returns {any} The converted AsyncAPI Parameter Object.
 */
function convertParameter(param: any): any {
  const convertedParam: any = {
    description: param.description,
  };

  if (param.required) {
    convertedParam.required = param.required;
  }

  if (param.schema && !isRefObject(param.schema)) {
    if (param.schema.enum) {
      convertedParam.enum = param.schema.enum;
    }
    if (param.schema.default !== undefined) {
      convertedParam.default = param.schema.default;
    }
  }

  if (param.examples) {
    convertedParam.examples = Object.values(param.examples).map((example:any) => 
      isRefObject(example) ? example : example.value
    );
  }

  // the location based on the parameter's 'in' property
  switch (param.in) {
    case 'query':
    case 'header':
    case 'cookie':
      convertedParam.location = `$message.header#/${param.name}`;
      break;
    case 'path':
      // Path parameters are part of the channel address
      break;
    default:
      // If 'in' is not recognized, default to payload
      convertedParam.location = `$message.payload#/${param.name}`;
  }

  return convertedParam;
}

function convertRequestBodyToMessages(requestBody: any, operationId: string, method: string): Record<string, any> {
  const messages: Record<string, any> = {};

  if (isPlainObject(requestBody.content)) {
    Object.entries(requestBody.content).forEach(([contentType, mediaType]: [string, any]) => {
      const messageName = `${operationId}Request`;
      messages[messageName] = {
        name: messageName,
        title: `${method.toUpperCase()} request`,
        contentType: contentType,
        payload: mediaType.schema,
        summary: requestBody.description,
      };
    });
  }

  return messages;
}

/**
 * Converts OpenAPI Response Objects to AsyncAPI Message Objects.
 * @param {ResponsesObject} responses - The OpenAPI Response Objects to convert.
 * @param {string} operationId - The ID of the operation these responses belong to.
 * @param {string} method - The HTTP method of the operation.
 * @returns {Record<string, any>} A record of converted AsyncAPI Message Objects.
 */
function convertResponsesToMessages(responses: Record<string, any>, operationId: string, method: string): Record<string, any> {
  const messages: Record<string, any> = {};

  Object.entries(responses).forEach(([statusCode, response]) => {
    if (isPlainObject(response.content)) {
      Object.entries(response.content).forEach(([contentType, mediaType]: [string, any]) => {
        const messageName = `${operationId}Response${statusCode}`;
        messages[messageName] = {
          name: messageName,
          title: `${method.toUpperCase()} response ${statusCode}`,
          contentType: contentType,
          payload: mediaType.schema,
          summary: response.description,
          headers: response.headers ? convertHeadersToSchema(response.headers) : undefined,
        };
      });
    } else {
      const messageName = `${operationId}Response${statusCode}`;
      messages[messageName] = {
        name: messageName,
        title: `${method.toUpperCase()} response ${statusCode}`,
        summary: response.description,
      };
    }
  });

  return messages;
}

/**
 * Converts OpenAPI Components Object to AsyncAPI Components Object.
 * @param {OpenAPIDocument} openapi - The complete OpenAPI document.
 * @returns {AsyncAPIDocument['components']} The converted AsyncAPI Components Object.
 */
function convertComponents(openapi: OpenAPIDocument): AsyncAPIDocument['components'] {
  const asyncComponents: AsyncAPIDocument['components'] = {};

  if (openapi.components) {
    if (openapi.components.schemas) {
      asyncComponents.schemas = convertSchemas(openapi.components.schemas);
    }

    if (openapi.components.securitySchemes) {
      asyncComponents.securitySchemes = convertSecuritySchemes(openapi.components.securitySchemes);
    }

    if (openapi.components.parameters) {
      asyncComponents.parameters = {};
      for (const [name, param] of Object.entries(openapi.components.parameters)) {
        if (!isRefObject(param)) {
          asyncComponents.parameters[name] = convertParameter(param);
        } else {
          asyncComponents.parameters[name] = param; 
        }
      }
    }

    if (openapi.components.responses) {
      asyncComponents.messages = convertComponentResponsesToMessages(openapi.components.responses);
    }

    if (openapi.components.requestBodies) {
      asyncComponents.messageTraits = convertRequestBodiesToMessageTraits(openapi.components.requestBodies);
    }

    if (openapi.components.headers) {
      asyncComponents.messageTraits = {
        ...(asyncComponents.messageTraits || {}),
        ...convertHeadersToMessageTraits(openapi.components.headers)
      };
    }

    if (openapi.components.examples) {
      asyncComponents.examples = openapi.components.examples;  
    }
  }

  return removeEmptyObjects(asyncComponents);
}

/**
 * converts openAPI schema object to multiformat/schema object
 * @param schema openAPI schema object
 * @returns multiformat/schema object
 */
function convertSchema(schema: any): any {
  if (isRefObject(schema)) {
    // Check if it's an external reference
    if (schema.$ref.startsWith('./') || schema.$ref.startsWith('http')) {
      return schema; 
    }
    return schema;
  }

  return {
    schemaFormat: 'application/vnd.oai.openapi;version=3.0.0',
    schema: schema
  };
}

/**
 * Converts OpenAPI Schema Objects to AsyncAPI Schema Objects.
 * @param {Record<string, any>} schemas - The OpenAPI Schema Objects to convert.
 * @returns {Record<string, any>} The converted AsyncAPI Schema Objects.
 */
function convertSchemas(schemas: Record<string, any>): Record<string, any> {
  const convertedSchemas: Record<string, any> = {};

  for (const [name, schema] of Object.entries(schemas)) {
    convertedSchemas[name] = convertSchema(schema);
  }

  return convertedSchemas;
}

/**
 * Converts a single OpenAPI Security Scheme Object to an AsyncAPI Security Scheme Object.
 * @param {Record<string, any>} scheme - The OpenAPI Security Scheme Object to convert.
 * @returns {Record<string, any>} The converted AsyncAPI Security Scheme Object.
 */
function convertSecuritySchemes(securitySchemes: Record<string, any>): Record<string, any> {
  const convertedSchemes: Record<string, any> = {};

  for (const [name, scheme] of Object.entries(securitySchemes)) {
    convertedSchemes[name] = convertSecurityScheme(scheme);
  }

  return convertedSchemes;
}

/**
 * Converts a single OpenAPI Security Scheme Object to an AsyncAPI Security Scheme Object.
 * @param {any} scheme - The OpenAPI Security Scheme Object to convert.
 * @returns {Record<string, any>} The converted AsyncAPI Security Scheme Object.
 */
function convertSecurityScheme(scheme: any): Record<string, any> {
  const convertedScheme: any = {
    type: scheme.type,
    description: scheme.description
  };

  if (scheme.type === 'oauth2' && scheme.flows) {
    const newFlows = JSON.parse(JSON.stringify(scheme.flows));
    function convertScopesToAvailableScopes(obj: any) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (key === 'scopes') {
            obj['availableScopes'] = obj[key];
            delete obj[key];
          } else if (typeof obj[key] === 'object') {
            convertScopesToAvailableScopes(obj[key]);
          }
        }
      }
    }
    convertScopesToAvailableScopes(newFlows);
    convertedScheme.flows = newFlows;
    if (scheme.scopes) {
      convertedScheme.scopes = Object.keys(scheme.scopes);
    }
  } else if (scheme.type === 'http') {
    convertedScheme.scheme = scheme.scheme;
    if (scheme.scheme === 'bearer') {
      convertedScheme.bearerFormat = scheme.bearerFormat;
    }
  } else if (scheme.type === 'apiKey') {
    convertedScheme.in = scheme.in;
    convertedScheme.name = scheme.name;
  }

  return convertedScheme;
}

/**
 * Converts OpenAPI Response Objects from the components section to AsyncAPI Message Objects.
 * @param {Record<string, any>} responses - The OpenAPI Response Objects to convert.
 * @returns {Record<string, any>} A record of converted AsyncAPI Message Objects.
 */
function convertComponentResponsesToMessages(responses: Record<string, any>): Record<string, any> {
  const messages: Record<string, any> = {};

  for (const [name, response] of Object.entries(responses)) {
    if (isPlainObject(response.content)) {
      Object.entries(response.content).forEach(([contentType, mediaType]: [string, any]) => {
        messages[name] = {
          name: name,
          contentType: contentType,
          payload: mediaType.schema,
          summary: response.description,
          headers: response.headers ? convertHeadersToSchema(response.headers) : undefined,
        };
      });
    } else {
      messages[name] = {
        name: name,
        summary: response.description,
      };
    }
  }

  return messages;
}

/**
 * Converts OpenAPI Request Body Objects from the components section to AsyncAPI Message Trait Objects.
 * @param {Record<string, any>} requestBodies - The OpenAPI Request Body Objects to convert.
 * @returns {Record<string, any>} A record of converted AsyncAPI Message Trait Objects.
 */
function convertRequestBodiesToMessageTraits(requestBodies: Record<string,any>): Record<string, any> {
  const messageTraits: Record<string, any> = {};

  for (const [name, requestBodyOrRef] of Object.entries(requestBodies)) {
    if (!isRefObject(requestBodyOrRef) && requestBodyOrRef.content) {
      const contentType = Object.keys(requestBodyOrRef.content)[0];
      messageTraits[name] = {
        name: name,
        contentType: contentType,
        description: requestBodyOrRef.description,
      };

      if (requestBodyOrRef.content[contentType].schema && 
          requestBodyOrRef.content[contentType].schema.properties && 
          requestBodyOrRef.content[contentType].schema.properties.headers) {
        messageTraits[name].headers = requestBodyOrRef.content[contentType].schema.properties.headers;
      }
    }
  }

  return messageTraits;
}

/**
 * Converts OpenAPI Header Objects from the components section to AsyncAPI Message Trait Objects.
 * @param {Record<string, any>} headers - The OpenAPI Header Objects to convert.
 * @returns {Record<string, any>} A record of converted AsyncAPI Message Trait Objects.
 */
function convertHeadersToMessageTraits(headers: Record<string, any>): Record<string, any> {
  const messageTraits: Record<string, any> = {};

  for (const [name, header] of Object.entries(headers)) {
    messageTraits[`Header${name}`] = {
      headers: {
        type: 'object',
        properties: {
          [name]: header.schema,
        },
        required: [name],
      },
    };
  }

  return messageTraits;
}

/**
 * Converts OpenAPI Header Objects to an AsyncAPI Schema Object representing the headers.
 * @param {Record<string, any>} headers - The OpenAPI Header Objects to convert.
 * @returns {SchemaObject} An AsyncAPI Schema Object representing the headers.
 */
function convertHeadersToSchema(headers: Record<string, any>): any {
  const properties: Record<string, any> = {};

  for (const [name, headerOrRef] of Object.entries(headers)) {
    if (!isRefObject(headerOrRef)) {
      properties[name] = headerOrRef.schema || {};
    }
  }

  return {
    type: 'object',
    properties,
  };
}