import { sortObjectKeys, isRefObject, isPlainObject } from "./utils";
import { AsyncAPIDocument, ConvertOpenAPIFunction, ConvertOptions, OpenAPIDocument } from "./interfaces";

export const converters: Record<string, ConvertOpenAPIFunction > = {
  'openapi': from_openapi_to_asyncapi,
}

function from_openapi_to_asyncapi(openapi: OpenAPIDocument, options: ConvertOptions): AsyncAPIDocument{
    convertName(openapi)

    convertInfoObject(openapi);
    if (isPlainObject(openapi.servers)) {
      openapi.servers = convertServerObjects(openapi.servers, openapi);
    }

    return sortObjectKeys(
        openapi,
        ['asyncapi', 'info', 'defaultContentType', 'servers', 'channels', 'operations', 'components']
    )
}

function convertName(openapi: OpenAPIDocument): AsyncAPIDocument {
    let { openapi: version } = openapi;
    openapi.asyncapi = version;
    delete (openapi as any).openapi;;

    return sortObjectKeys(
        openapi,
        ['asyncapi', 'info', 'defaultContentType', 'servers', 'channels', 'operations', 'components']
    )
}

function convertInfoObject(openapi: OpenAPIDocument) {
    if(openapi.tags) {
      openapi.info.tags = openapi.tags;
      delete openapi.tags;
    }
  
    if(openapi.externalDocs) {
      openapi.info.externalDocs = openapi.externalDocs;
      delete openapi.externalDocs;
    }
  
    return (openapi.info = sortObjectKeys(openapi.info, [
      "title",
      "version",
      "description",
      "termsOfService",
      "contact",
      "license",
      "tags",
      "externalDocs",
    ]));
  }

function convertServerObjects(servers: Record<string, any>, openapi: OpenAPIDocument) {
  console.log("security",openapi.security)
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
      server.security = security;
      delete openapi.security;
    }
  
      newServers[serverName] = sortObjectKeys(
        server,
        ['host', 'pathname', 'protocol', 'protocolVersion', 'title', 'summary', 'description', 'variables', 'security', 'tags', 'externalDocs', 'bindings'],
      );
    });
    
    return newServers
}

function resolveServerUrl(url: string): {
  host: string;
  pathname: string | undefined;
  protocol: string | undefined;
} {
  let [maybeProtocol, maybeHost] = url.split("://");
  console.log("maybeProtocol", maybeProtocol);
  if (!maybeHost) {
    maybeHost = maybeProtocol;
  }
  const [host, ...pathnames] = maybeHost.split("/");
  console.log("pathname1", pathnames);
  if (pathnames.length) {
    return {
      host,
      pathname: `/${pathnames.join("/")}`,
      protocol: maybeProtocol,
    };
  }
  return { host, pathname: undefined, protocol: maybeProtocol };
}

function convertSecurity(security: Record<string, any>) {
    if(security.type === 'oauth2' && security.flows.authorizationCode.scopes) {
      const availableScopes = security.flows.authorizationCode.scopes;
      security.flows.authorizationCode.availableScopes = availableScopes;
      delete security.flows.authorizationCode.scopes;
    }
    return security;
}