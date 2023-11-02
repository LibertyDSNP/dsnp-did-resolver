import {
  DIDDocument,
  DIDResolutionResult,
  ParsedDID,
  Resolvable,
  DIDResolutionOptions,
} from "did-resolver";
import { expect, jest, test } from "@jest/globals";
import { DSNPResolver, getResolver, registerDSNPResolver } from "./index.js";

const someDocument: DIDDocument = {
  id: "",
};

const plugin1: DSNPResolver = async (dsnpUserId: bigint) => {
  if (dsnpUserId === 123456n) {
    return someDocument;
  } else {
    return null;
  }
};

const plugin2: DSNPResolver = async (dsnpUserId: bigint) => {
  if (dsnpUserId === 234567n) {
    return someDocument;
  } else {
    return null;
  }
};

registerDSNPResolver(plugin1);
registerDSNPResolver(plugin2);

function errorResult(error: string): DIDResolutionResult {
  return {
    didDocument: null,
    didDocumentMetadata: {},
    didResolutionMetadata: { error },
  };
}

type GetResolverOutput = {
  [method: string]: (
    did: string,
    parsed: ParsedDID,
    resolver: Resolvable,
    options: DIDResolutionOptions,
  ) => Promise<DIDResolutionResult>;
};

const dummyResolvable: Resolvable = {
  resolve: async (
    didUrl: string,
    options?: DIDResolutionOptions,
  ): Promise<DIDResolutionResult> => {
    return errorResult("dummy resolvable");
  },
};

describe("dsnp-did-resolver", () => {
  let resolver: GetResolverOutput;

  beforeAll(() => {
    resolver = getResolver();
  });

  async function doResolve(id: string) {
    const did = `did:dsnp:${id}`;
    return await resolver.dsnp(
      did,
      {
        did,
        didUrl: did,
        method: "dsnp",
        id,
      },
      dummyResolvable,
      {},
    );
  }

  it("claims to resolve 'dsnp' DID method", () => {
    expect(resolver.dsnp).not.toBeNull();
  });

  it("rejects non-DSNP DIDs", async () => {
    const did = "did:xyz:123";
    const output = await resolver.dsnp(
      did,
      { did, didUrl: did, method: "xyz", id: "123" },
      dummyResolvable,
      {},
    );
    expect(output).toEqual(errorResult("unsupportedDidMethod"));
  });

  it("rejects invalid DSNP User Ids", async () => {
    let output;
    output = await doResolve("");
    expect(output).toEqual(errorResult("invalidDid"));
    output = await doResolve("abc");
    expect(output).toEqual(errorResult("notFound"));
    output = await doResolve("123.456");
    expect(output).toEqual(errorResult("notFound"));
    output = await doResolve("-123456");
    expect(output).toEqual(errorResult("notFound"));
    output = await doResolve(BigInt(2n ** 64n).toString());
    expect(output).toEqual(errorResult("notFound"));
  });

  it("returns expected output for a resolved DID from first plugin", async () => {
    const output = await doResolve("123456");
    expect(output).toEqual({
      didResolutionMetadata: { contentType: "application/did+ld+json" },
      didDocument: someDocument,
      didDocumentMetadata: {},
    });
  });

  it("returns expected output for a resolved DID from second plugin", async () => {
    const output = await doResolve("234567");
    expect(output).toEqual({
      didResolutionMetadata: { contentType: "application/did+ld+json" },
      didDocument: someDocument,
      didDocumentMetadata: {},
    });
  });

  it("returns 'notFound' output for a valid but unresolved DID", async () => {
    const output = await doResolve("654321");
    expect(output).toEqual(errorResult("notFound"));
  });
});
