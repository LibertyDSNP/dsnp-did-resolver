# Overview

This package implements a generic resolver for the `dsnp` DID method (that is, DIDs of the form `did:dsnp:123456`, where `123456` is a [DSNP User Id](https://spec.dsnp.org/DSNP/Identifiers.html#dsnp-user-id) in decimal format).
This resolver should be used with one or more plugins for specific DSNP systems (see below).

# Usage

This package follows the conventions described in the [`did-resolver`](https://github.com/decentralized-identity/did-resolver) package and exposes a `getResolver()` function which returns a mapping from the `dsnp` DID method to a resolver function.

## Usage for DSNP DID method only

```
import { Resolver } from "did-resolver"
import dsnp from "@dsnp/did-resolver"; 
import "dsnp-did-resolver-plugin-foo"; // See below for known plugins
// ... additional dsnp-did-resolver plugins if needed

const resolver = new Resolver(dsnpResolver.getResolver());
const myDid = "did:dsnp:123456";
const result = await resolver.resolve(myDid);
console.log(JSON.stringify(result, null, 2));
```

## Usage with other DID method resolvers

The Resolver constructor can combine resolvers for multiple DID methods as described in the `did-resolver` [documentation](https://github.com/decentralized-identity/did-resolver#readme).
For example, if you also want to be able to resolve `did:ethr:*` DIDs, you would import and include the `ethr` resolver and pass its destructured resolver alongside the DSNP one to the constructor as follows:

```
import ethr from "ethr-did-resolver";
// ... additional did-resolver packages; 

const resolver = new Resolver({
  ...dsnp.getResolver(),
  ...ethr.getResolver()
});
// usage is same as in previous example
```

# Plugins

To resolve a DSNP User Id to a specific DSNP system, one or more system-specific plugins must be imported.
Plugin import order defines the order in which this resolver will attempt to resolve a DSNP DID.
It will return the result from the first plugin that returns a DID document.

## Plugin development

Plugins should implement a function with the `DSNPResolver` type (see `index.ts`):

```
export type DSNPResolver = (dsnpUserId: BigInt) => Promise<DIDDocument | null>;
```

The `DIDDocument` type is defined in the `did-resolver` package.

The DSNP resolver function should return `null` if the DSNP User Id cannot be resolved to a DID document for any reason.
Plugins should avoid throwing errors except in dire circumstances, as errors from one plugin will cause any further plugins that have been registered to *not* be called.

Register the function by calling `registerDSNPResolver(myResolver)`.

# Development

- `npm install` - install dependencies
- `npm run build` - compile
- `npm run test` - run unit tests
- `npm run lint` - run linter
- `npm run format` - reformat source files

[Pull requests](https://github.com/LibertyDSNP/dsnp-did-resolver/pulls) are welcomed with an accompanying [github issue](https://github.com/LibertyDSNP/dsnp-did-resolver/issues).
