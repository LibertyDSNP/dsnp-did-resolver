import { expect, jest, test } from "@jest/globals";
import { driver } from "./index.js";
import { CachedResolver } from "@digitalbazaar/did-io";

import type { DSNPResolver } from "./index.js";

const someDocument: object = {
  id: "",
};

class Plugin1 implements DSNPResolver {
  async resolve(dsnpUserId: bigint) {
    if (dsnpUserId === 123456n) {
      return someDocument;
    } else {
      return null;
    }
  }
}

class Plugin2 implements DSNPResolver {
  async resolve(dsnpUserId: bigint) {
    if (dsnpUserId === 234567n) {
      return someDocument;
    } else {
      return null;
    }
  }
}

describe("dsnp-did-resolver", () => {
  let resolver: {
    method: string;
    get: (options: { did: string }) => Promise<object>;
  };

  beforeAll(() => {
    resolver = driver([new Plugin1(), new Plugin2()]);
  });

  async function doResolve(id: string) {
    const did = `did:dsnp:${id}`;
    return await resolver.get({ did });
  }

  it("claims to resolve 'dsnp' DID method", () => {
    expect(resolver.method).toEqual("dsnp");
  });

  it("rejects non-DSNP DIDs", async () => {
    const did = "did:xyz:123";
    const output = await expect(resolver.get({ did })).rejects.toThrow();
  });

  it("rejects invalid DSNP User Ids", async () => {
    await expect(doResolve("")).rejects.toThrow();
    await expect(doResolve("abc")).rejects.toThrow();
    await expect(doResolve("123.456")).rejects.toThrow();
    await expect(doResolve("-123456")).rejects.toThrow();
    await expect(doResolve(BigInt(2n ** 64n).toString())).rejects.toThrow();
  });

  it("returns expected output for a resolved DID from first plugin", async () => {
    const output = await doResolve("123456");
    expect(output).toEqual(someDocument);
  });

  it("returns expected output for a resolved DID from second plugin", async () => {
    const output = await doResolve("234567");
    expect(output).toEqual(someDocument);
  });

  it("throws for a valid but unresolved DID", async () => {
    await expect(doResolve("654321")).rejects.toThrow();
  });

  it("works with did-io framework", async () => {
    const didResolver = new CachedResolver();
    didResolver.use(resolver);
    const output = await didResolver.get({ did: "did:dsnp:123456" });
    expect(output).toEqual(someDocument);
  });
});
