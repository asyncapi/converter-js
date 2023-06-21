# AsyncAPI Converter

Convert [AsyncAPI](https://asyncapi.com) documents older to newer versions.

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-8-orange.svg?style=flat-square)](#contributors-)
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
  console.log(convert(asyncapi, '3.0.0', {
    v2tov3: {
      convertServerComponents: false,
      convertChannelComponents: false,
    }
  }));
} catch (e) {
  console.error(e);
}
```

### In TS

```ts
import { convert } from '@asyncapi/converter';
import type { ConvertVersion, ConvertOptions } from '@asyncapi/converter';

try {
  const toVersion: ConvertVersion = '3.0.0';
  const options: ConvertOptions = {
    v2tov3: {
      convertServerComponents: false,
      convertChannelComponents: false,
    }
  };
  const asyncapi = fs.readFileSync('streetlights.yml', 'utf-8')
  console.log(convert(asyncapi, toVersion));
} catch (e) {
  console.error(e)
}
```

## Conversion 2.x.x to 3.x.x

Conversion to version `3.x.x` from `2.x.x` has several assumptions that should be know before converting:

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
- Channels and servers defined in components are also converted (unless configured - see [examples](#in-js)).

## Known missing features

* When converting from 1.x to 2.x, Streaming APIs (those using `stream` instead of `topics` or `events`) are converted correctly but information about framing type and delimiter is missing until a [protocolInfo](https://github.com/asyncapi/extensions-catalog/issues/1) for that purpose is created.

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
  <tr>
    <td align="center"><a href="https://github.com/magicmatatjahu"><img src="https://avatars.githubusercontent.com/u/20404945?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Maciej Urbańczyk</b></sub></a><br /><a href="#maintenance-magicmatatjahu" title="Maintenance">🚧</a> <a href="https://github.com/asyncapi/converter-js/commits?author=magicmatatjahu" title="Code">💻</a> <a href="https://github.com/asyncapi/converter-js/issues?q=author%3Amagicmatatjahu" title="Bug reports">🐛</a> <a href="https://github.com/asyncapi/converter-js/pulls?q=is%3Apr+reviewed-by%3Amagicmatatjahu" title="Reviewed Pull Requests">👀</a> <a href="https://github.com/asyncapi/converter-js/commits?author=magicmatatjahu" title="Tests">⚠️</a> <a href="https://github.com/asyncapi/converter-js/commits?author=magicmatatjahu" title="Documentation">📖</a></td>
    <td align="center"><a href="http://www.fmvilas.com/"><img src="https://avatars.githubusercontent.com/u/242119?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Fran Méndez</b></sub></a><br /><a href="#maintenance-fmvilas" title="Maintenance">🚧</a> <a href="https://github.com/asyncapi/converter-js/commits?author=fmvilas" title="Code">💻</a> <a href="https://github.com/asyncapi/converter-js/issues?q=author%3Afmvilas" title="Bug reports">🐛</a> <a href="https://github.com/asyncapi/converter-js/pulls?q=is%3Apr+reviewed-by%3Afmvilas" title="Reviewed Pull Requests">👀</a> <a href="https://github.com/asyncapi/converter-js/commits?author=fmvilas" title="Tests">⚠️</a> <a href="https://github.com/asyncapi/converter-js/commits?author=fmvilas" title="Documentation">📖</a></td>
    <td align="center"><a href="https://www.brainfart.dev/"><img src="https://avatars.githubusercontent.com/u/6995927?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Lukasz Gornicki</b></sub></a><br /><a href="#maintenance-derberg" title="Maintenance">🚧</a> <a href="https://github.com/asyncapi/converter-js/commits?author=derberg" title="Code">💻</a> <a href="https://github.com/asyncapi/converter-js/issues?q=author%3Aderberg" title="Bug reports">🐛</a> <a href="https://github.com/asyncapi/converter-js/pulls?q=is%3Apr+reviewed-by%3Aderberg" title="Reviewed Pull Requests">👀</a> <a href="https://github.com/asyncapi/converter-js/commits?author=derberg" title="Tests">⚠️</a> <a href="https://github.com/asyncapi/converter-js/commits?author=derberg" title="Documentation">📖</a> <a href="#infra-derberg" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
    <td align="center"><a href="https://github.com/germanschnyder"><img src="https://avatars.githubusercontent.com/u/1844525?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Germán Schnyder</b></sub></a><br /><a href="https://github.com/asyncapi/converter-js/commits?author=germanschnyder" title="Code">💻</a> <a href="https://github.com/asyncapi/converter-js/commits?author=germanschnyder" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/bszwarc"><img src="https://avatars.githubusercontent.com/u/17266942?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Barbara Czyż</b></sub></a><br /><a href="#infra-bszwarc" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
    <td align="center"><a href="https://github.com/depimomo"><img src="https://avatars.githubusercontent.com/u/12368942?v=4?s=100" width="100px;" alt=""/><br /><sub><b>depimomo</b></sub></a><br /><a href="https://github.com/asyncapi/converter-js/commits?author=depimomo" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/crypto-cmd"><img src="https://avatars.githubusercontent.com/u/54287503?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Orville Daley</b></sub></a><br /><a href="https://github.com/asyncapi/converter-js/commits?author=crypto-cmd" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://www.arctype.co/"><img src="https://avatars.githubusercontent.com/u/549273?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Ryan R Sundberg</b></sub></a><br /><a href="https://github.com/asyncapi/converter-js/commits?author=sundbry" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!