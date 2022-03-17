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
  * [As a package](#as-a-package)
- [Known missing features](#known-missing-features)
- [Contributors ✨](#contributors-%E2%9C%A8)

<!-- tocstop -->

## Installation

```sh
npm i -g @asyncapi/converter
```

## Usage

### From CLI

Minimal example:

```sh
asyncapi-converter streetlights.yml

# Result:
asyncapi: '2.0.0'
channels:
...
```

Specify the application id:

```sh
asyncapi-converter --id=urn:com.asynapi.streetlights streetlights.yml

# Result:
asyncapi: '2.0.0'
id: 'urn:com.asynapi.streetlights'
...
```

Save the result in a file by stream:

```sh
asyncapi-converter streetlights.yml > streetlights2.yml
```

Save the result in a file by `-o, --output` flag:

```sh
asyncapi-converter streetlights.yml -o streetlights2.yml
```

### In JS

```js
const fs = require('fs');
const { convert } = require('@asyncapi/converter')

try {
  const asyncapi = fs.readFileSync('streetlights.yml', 'utf-8')
  console.log(convert(asyncapi, '2.0.0', {
    id: 'urn:com.asyncapi.streetlights'
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
  const toVersion: ConvertVersion = '2.0.0';
  const options: ConvertOptions = {
    id: 'urn:com.asyncapi.streetlights'
  };

  const asyncapi = fs.readFileSync('streetlights.yml', 'utf-8')
  console.log(convert(asyncapi, toVersion, options));
} catch (e) {
  console.error(e)
}
```

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