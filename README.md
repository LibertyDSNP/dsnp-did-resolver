# Overview

This package implements a generic resolver for the `dsnp` DID method (that is, DIDs of the form `did:dsnp:123456`, where `123456` is a [DSNP User Id](https://spec.dsnp.org/DSNP/Identifiers.html#dsnp-user-id) in decimal format).
This resolver must be used with one or more plugins for specific DSNP systems (see below).

# Usage

This package follows the conventions described in the [`@digitalbazaar/did-io`](https://github.com/digitalbazaar/did-io) package and exposes a `driver()` function which returns an object with a `get(options)` method.
Pass an array of DSNPResolver objects to the `driver()` method.

## Usage for DSNP DID method only

```
import { CachedResolver } from "@digitalbazaar/did-io";
import didDsnp from "@dsnp/did-resolver";
import { FooResolver} from "dsnp-did-resolver-plugin-foo"; // See below for known plugins
// ... additional dsnp-did-resolver plugins if needed

const resolver = new CachedResolver();
resolver.use(didDsnp.driver([ new FooResolver() ]));

const myDid = "did:dsnp:123456";
const result = await resolver.get({ did: myDid });
console.log(JSON.stringify(result, null, 2));
```

## Usage with other DID method resolvers

The CachedResolver can combine drivers for multiple DID methods as described in the `did-io` [documentation](https://github.com/digitalbazaar/did-io#readme).
For example, if you also want to be able to resolve `did:web:*` DIDs, you can use the `did-method-web` driver alongside the DSNP driver.

```
import { CachedResolver } from "@digitalbazaar/did-io";
import didWeb from "@digitalbazaar/did-method-web";
import didDsnp from "@dsnp/did-resolver";

const resolver = new CachedResolver();
resolver.use(didWeb.driver());
resolver.use(didDsnp.driver([ new FooResolver() ]));

// usage is same as in previous example
```

# Plugins

To resolve a DSNP User Id to a specific DSNP system, one or more instances of system-specific plugins are required.
Array ordering defines the order in which this resolver will attempt to resolve a DSNP DID.
It will return the result from the first plugin that returns a DID document.

## Plugin development

Plugins should implement the `DSNPResolver` interface, which includes a `resolve(bigint)` function (see `index.ts`):

```
export interface DSNPResolver {
  resolve(dsnpUserId: bigint): Promise<object | null>;
}
```

The `resolve()` function should return `null` if the DSNP User Id cannot be resolved to a DID document for any reason.
Plugins should avoid throwing errors except in dire circumstances, as errors from one plugin will cause any further plugins that have been registered to *not* be called.

`DSNPResolver` instances can be passed to the `CachedResolver` `use()` function.

## Known plugins

| System | Plugin package
|---|---|
| Frequency | [`@dsnp/did-resolver-plugin-frequency`](https://github.com/ProjectLibertyLabs/dsnp-did-resolver-plugin-frequency) | 

Please submit a pull request with any additional plugins.

# Development

- `npm install` - install dependencies
- `npm run build` - compile
- `npm run test` - run unit tests
- `npm run lint` - run linter
- `npm run format` - reformat source files

[Pull requests](https://github.com/LibertyDSNP/dsnp-did-resolver/pulls) are welcomed with an accompanying [github issue](https://github.com/LibertyDSNP/dsnp-did-resolver/issues).
