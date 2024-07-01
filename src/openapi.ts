import { sortObjectKeys, isRefObject, isPlainObject } from "./utils";
import { AsyncAPIDocument, ConvertOpenAPIFunction, ConvertOptions, OpenAPIDocument } from "./interfaces";

export const converters: Record<string, ConvertOpenAPIFunction > = {
  'openapi': from_openapi_to_asyncapi,
}

function from_openapi_to_asyncapi(openapi: OpenAPIDocument, options?: ConvertOptions): AsyncAPIDocument {
  const asyncapi: Partial<AsyncAPIDocument> = {
      asyncapi: openapi.openapi,
      info: convertInfoObject(openapi.info, openapi),
      servers: isPlainObject(openapi.servers[0]) ? convertServerObjects(openapi.servers, openapi) : undefined,
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
      server.security = security;
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