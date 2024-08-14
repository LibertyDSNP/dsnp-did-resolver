import {
  Resolver,
  ParsedDID,
  Resolvable,
  DIDResolutionOptions,
  DIDResolutionResult,
  DIDDocument,
} from "did-resolver";

export interface DSNPResolver {
  resolve(dsnpUserId: bigint): Promise<DIDDocument | null>;
}

const notFoundResult: DIDResolutionResult = {
  didDocument: null,
  didDocumentMetadata: {},
  didResolutionMetadata: { error: "notFound" },
};

export function getResolver(dsnpResolvers: DSNPResolver[]) {
  async function resolve(
    did: string,
    parsed: ParsedDID,
    resolver: Resolvable,
    options: DIDResolutionOptions,
  ): Promise<DIDResolutionResult> {
    if (parsed.id === "") {
      return {
        didDocument: null,
        didDocumentMetadata: {},
        didResolutionMetadata: { error: "invalidDid" },
      };
    }
    if (parsed.method !== "dsnp") {
      return {
        didDocument: null,
        didDocumentMetadata: {},
        didResolutionMetadata: { error: "unsupportedDidMethod" },
      };
    }
    let dsnpUserId: bigint = 0n;
    try {
      dsnpUserId = BigInt(parsed.id);
    } catch (e) {
      return notFoundResult;
    }
    if (dsnpUserId < 0n || dsnpUserId >= 2n ** 64n) {
      return notFoundResult;
    }

    for (const dsnpResolver of dsnpResolvers) {
      try {
        const output = await dsnpResolver.resolve(dsnpUserId);
        if (output)
          return {
            didResolutionMetadata: { contentType: "application/did+ld+json" },
            didDocument: output,
            didDocumentMetadata: {},
          };
      } catch (cause) {
        throw new Error(`Error resolving DSNP User Id ${dsnpUserId}`, {
          cause,
        });
      }
    }

    return notFoundResult;
  }

  return { dsnp: resolve };
}
