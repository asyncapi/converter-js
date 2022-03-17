# AsyncAPI Converter

Convert [AsyncAPI](https://asyncapi.com) documents older to newer versions.

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
