# AsyncAPI Converter

Convert [AsyncAPI](https://asyncapi.com) documents older to newer versions and you can also convert OpenAPI documents to AsyncAPI documents.

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-9-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

<!-- toc is generated with GitHub Actions do not remove toc markers -->

<!-- toc -->

- [Installation](#installation)
- [Usage](#usage)
  * [From CLI](#from-cli)
  * [In JS](#in-js)
  * [In TS](#in-ts)
- [Conversion 2.x.x to 3.x.x](#conversion-2xx-to-3xx)
- [Known missing features](#known-missing-features)
  * [OpenAPI 3.0 to AsyncAPI 3.0 Conversion](#openapi-30-to-asyncapi-30-conversion)
    + [Limitations](#limitations)
- [Development](#development)
- [Contribution](#contribution)
- [Contributors ✨](#contributors-%E2%9C%A8)

<!-- tocstop -->

## Installation

```sh
npm i @asyncapi/converter
```

## Usage

### From CLI

To convert an AsyncAPI document in the console needs the official [AsyncAPI CLI](https://github.com/asyncapi/cli).

If you don't have CLI installed, run this command to install the CLI globally on your system:

```sh
npm install -g @asyncapi/cli
```

Minimal usage example with output given:

```sh
asyncapi convert streetlights.yml -o streetlights2.yml

# Result:
asyncapi: '2.0.0'
channels:
...
```

Convert to a specific version:

```sh
asyncapi convert streetlights.yml -o streetlights2.yml -t 2.3.0

# Result:
asyncapi: '2.3.0'
channels:
...
```

### In JS

```js
const fs = require('fs');
const { convert } = require('@asyncapi/converter')

try {
  const asyncapi = fs.readFileSync('streetlights.yml', 'utf-8')
  console.log(convert(asyncapi, '2.6.0'));
} catch (e) {
  console.error(e);
}
```

### In TS

```ts
import { convert } from '@asyncapi/converter';
import type { ConvertVersion, ConvertOptions } from '@asyncapi/converter';

try {
  const toVersion: ConvertVersion = '2.6.0';
  const asyncapi = fs.readFileSync('streetlights.yml', 'utf-8')
  console.log(convert(asyncapi, toVersion));
} catch (e) {
  console.error(e)
}
```

## Conversion 2.x.x to 3.x.x

> **NOTE**: This feature is still WIP, and is until the final release of `3.0.0`.

Conversion to version `3.x.x` from `2.x.x` has several assumptions that should be known before converting:

- The input must be valid AsyncAPI document.
- External references are not resolved and converted, they remain untouched, even if they are incorrect.
- In version `3.0.0`, the channel identifier is no longer its address, but due to the difficulty of defining a unique identifier, we still treat the address as an identifier. If there is a need to assign an identifier other than an address, an `x-channelId` extension should be defined at the level of the given channel.

  ```yaml
  # 2.x.x
  channels:
    users/signup:
      x-channelId: 'userSignUp'
      ...
    users/logout:
      ...

  # 3.0.0
  channels:
    userSignUp:
      ...
    users/logout:
      ...
  ```

- The `publish` operation is treated as a `receive` action, and `subscribe` is treated as a `send` action. Conversion by default is embraced from the application perspective. If you want to change this logic, you need to specify `v2tov3.pointOfView` configuration as `client`.
- If the operation does not have an `operationId` field defined, the unique identifier of the operation will be defined as a combination of the identifier of the channel on which the operation was defined + the type of operation, `publish` or `subscribe`. Identical situation is with messages. However, here the priority is the `messageId` field and then the concatenation `{publish|subscribe}.messages.{optional index of oneOf messages}`.

  ```yaml
  # 2.x.x
  channels:
    users/signup:
      publish:
        message:
          ...
      subscribe:
        operationId: 'userSignUpEvent'
        message:
          oneOf:
            - messageId: 'userSignUpEventMessage'
              ...
            - ...
        

  # 3.0.0
  channels:
    users/signup:
      messages:
        publish.message:
          ...
        userSignUpEventMessage:
          ...
        userSignUpEvent.message.1:
          ...
  operations:
    users/signup.publish:
      action: receive
      ...
    userSignUpEvent:
      action: send
      ...
  ```

- Security requirements that use scopes are defined in the appropriate places inline, the rest as a reference to the `components.securitySchemes` objects.
- If servers are defined at the channel level, they are converted as references to the corresponding objects defined in the `servers` field.
- Channels and servers defined in components are also converted (unless configured otherwise).

## Known missing features

* When converting from 1.x to 2.x, Streaming APIs (those using `stream` instead of `topics` or `events`) are converted correctly but information about framing type and delimiter is missing until a [protocolInfo](https://github.com/asyncapi/extensions-catalog/issues/1) for that purpose is created.
* When converting from 2.x to 3.x, and `parameter.schema` is defined with a reference, it will NOT look into the schema reference and include any relevant keywords for the v3 parameter. It will just create an empty parameter but leave the schema in the components section as is.
  ```yaml
  # 2.x.x
  channels:
    "{myParameter}":
      parameters: 
        myParameter: 
          schema: 
            $ref: "#/components/schemas/mySchema"
  components: 
    schemas:
      mySchema:
        enum: ["test"]
        default: "test"
        examples: ["test"]

  # 3.0.0
  channels:
    "{myParameter}":
      parameters: 
        myParameter: {}

  components: 
    schemas:
      mySchema:
        enum: ["test"]
        default: "test"
        examples: ["test"]
  ```

## OpenAPI 3.0 to AsyncAPI 3.0 Conversion

The converter now supports transformation from OpenAPI 3.0 to AsyncAPI 3.0. This feature enables easy transition of existing OpenAPI 3.0 documents to AsyncAPI 3.0.

To use this new conversion feature:

```js
const fs = require('fs');
const { convertOpenAPI } = require('@asyncapi/converter')

try {
  const openapi = fs.readFileSync('openapi.yml', 'utf-8')
  const asyncapi = convertOpenAPI(openapi, '3.0.0', { from: 'openapi' });
  console.log(asyncapi);
} catch (e) {
  console.error(e);
}
```

When converting from OpenAPI to AsyncAPI you can now specify the perspective of the conversion using the `perspective` option. This allows you to choose whether the conversion should be from an application or client point of view

```js
const { convertOpenAPI } = require('@asyncapi/converter')

try {
  const asyncapi2 = fs.readFileSync('asyncapi2.yml', 'utf-8')
  const asyncapi3 = convertOpenAPI(asyncapi2, '3.0.0', { openAPIToAsyncAPI: { perspective: 'client' } });
  console.log(asyncapi3);
} catch (e) {
  console.error(e);
}
```

The perspective option can be set to either 'server' (default) or 'client'. 

- With `server` perspective: `action` becomes `receive`

- With `client` perspective: `action` becomes `send`

#### Limitations

- External to internal references: The converter does not support scenarios where an external schema file references internal components of the OpenAPI document. In such cases, manual adjustment of the converted document may be necessary.

### Postman Collection to AsyncAPI conversion

The converter now also supports conversion from postman collection to AsyncAPI 3.0. This feature enables easy transition of existing postman collection to any AsyncAPI 3.0 documents.

To use this new conversion feature:

```js
const fs = require('fs');
const { convertPostman } = require('@asyncapi/converter')
try {
  const postman = fs.readFileSync('postman-collection.yml', 'utf-8')
  const asyncapi = convertPostman(postman, '3.0.0');
  console.log(asyncapi);
} catch (e) {
  console.error(e);
}
```

When converting from postman collection to AsyncAPI you can now specify the perspective of the conversion using the `perspective` option. This allows you to choose whether the conversion should be from an application or client point of view

```js
const { convertPostman } = require('@asyncapi/converter')
try {
  const postman = fs.readFileSync('postman-collection.yml', 'utf-8')
  const asyncapi = convertPostman(postman, '3.0.0', { perspective: 'client' });
  console.log(asyncapi);
} catch (e) {
  console.error(e);
}
```

The perspective option can be set to either 'server' (default) or 'client'. 

- With `server` perspective: `action` becomes `receive`

- With `client` perspective: `action` becomes `send`

#### Limitations

- External to internal references: The converter does not support scenarios where an external schema file references internal components of the OpenAPI document. In such cases, manual adjustment of the converted document may be necessary.


## Development

1. Setup project by installing dependencies `npm install`
2. Write code and tests.
3. Make sure all tests pass `npm test`

## Contribution

Read [CONTRIBUTING](https://github.com/asyncapi/.github/blob/master/CONTRIBUTING.md) guide.

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/magicmatatjahu"><img src="https://avatars.githubusercontent.com/u/20404945?v=4?s=100" width="100px;" alt="Maciej Urbańczyk"/><br /><sub><b>Maciej Urbańczyk</b></sub></a><br /><a href="#maintenance-magicmatatjahu" title="Maintenance">🚧</a> <a href="https://github.com/asyncapi/converter-js/commits?author=magicmatatjahu" title="Code">💻</a> <a href="https://github.com/asyncapi/converter-js/issues?q=author%3Amagicmatatjahu" title="Bug reports">🐛</a> <a href="https://github.com/asyncapi/converter-js/pulls?q=is%3Apr+reviewed-by%3Amagicmatatjahu" title="Reviewed Pull Requests">👀</a> <a href="https://github.com/asyncapi/converter-js/commits?author=magicmatatjahu" title="Tests">⚠️</a> <a href="https://github.com/asyncapi/converter-js/commits?author=magicmatatjahu" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.fmvilas.com/"><img src="https://avatars.githubusercontent.com/u/242119?v=4?s=100" width="100px;" alt="Fran Méndez"/><br /><sub><b>Fran Méndez</b></sub></a><br /><a href="#maintenance-fmvilas" title="Maintenance">🚧</a> <a href="https://github.com/asyncapi/converter-js/commits?author=fmvilas" title="Code">💻</a> <a href="https://github.com/asyncapi/converter-js/issues?q=author%3Afmvilas" title="Bug reports">🐛</a> <a href="https://github.com/asyncapi/converter-js/pulls?q=is%3Apr+reviewed-by%3Afmvilas" title="Reviewed Pull Requests">👀</a> <a href="https://github.com/asyncapi/converter-js/commits?author=fmvilas" title="Tests">⚠️</a> <a href="https://github.com/asyncapi/converter-js/commits?author=fmvilas" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.brainfart.dev/"><img src="https://avatars.githubusercontent.com/u/6995927?v=4?s=100" width="100px;" alt="Lukasz Gornicki"/><br /><sub><b>Lukasz Gornicki</b></sub></a><br /><a href="#maintenance-derberg" title="Maintenance">🚧</a> <a href="https://github.com/asyncapi/converter-js/commits?author=derberg" title="Code">💻</a> <a href="https://github.com/asyncapi/converter-js/issues?q=author%3Aderberg" title="Bug reports">🐛</a> <a href="https://github.com/asyncapi/converter-js/pulls?q=is%3Apr+reviewed-by%3Aderberg" title="Reviewed Pull Requests">👀</a> <a href="https://github.com/asyncapi/converter-js/commits?author=derberg" title="Tests">⚠️</a> <a href="https://github.com/asyncapi/converter-js/commits?author=derberg" title="Documentation">📖</a> <a href="#infra-derberg" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/germanschnyder"><img src="https://avatars.githubusercontent.com/u/1844525?v=4?s=100" width="100px;" alt="Germán Schnyder"/><br /><sub><b>Germán Schnyder</b></sub></a><br /><a href="https://github.com/asyncapi/converter-js/commits?author=germanschnyder" title="Code">💻</a> <a href="https://github.com/asyncapi/converter-js/commits?author=germanschnyder" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/bszwarc"><img src="https://avatars.githubusercontent.com/u/17266942?v=4?s=100" width="100px;" alt="Barbara Czyż"/><br /><sub><b>Barbara Czyż</b></sub></a><br /><a href="#infra-bszwarc" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/depimomo"><img src="https://avatars.githubusercontent.com/u/12368942?v=4?s=100" width="100px;" alt="depimomo"/><br /><sub><b>depimomo</b></sub></a><br /><a href="https://github.com/asyncapi/converter-js/commits?author=depimomo" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/crypto-cmd"><img src="https://avatars.githubusercontent.com/u/54287503?v=4?s=100" width="100px;" alt="Orville Daley"/><br /><sub><b>Orville Daley</b></sub></a><br /><a href="https://github.com/asyncapi/converter-js/commits?author=crypto-cmd" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://www.arctype.co/"><img src="https://avatars.githubusercontent.com/u/549273?v=4?s=100" width="100px;" alt="Ryan R Sundberg"/><br /><sub><b>Ryan R Sundberg</b></sub></a><br /><a href="https://github.com/asyncapi/converter-js/commits?author=sundbry" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ItshMoh"><img src="https://avatars.githubusercontent.com/u/121867882?v=4?s=100" width="100px;" alt="Mohan Kumar"/><br /><sub><b>Mohan Kumar</b></sub></a><br /><a href="https://github.com/asyncapi/converter-js/commits?author=ItshMoh" title="Code">💻</a> <a href="https://github.com/asyncapi/converter-js/commits?author=ItshMoh" title="Tests">⚠️</a> <a href="https://github.com/asyncapi/converter-js/commits?author=ItshMoh" title="Documentation">📖</a> <a href="#example-ItshMoh" title="Examples">💡</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
