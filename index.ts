export interface DSNPResolver {
  resolve(dsnpUserId: bigint): Promise<object | null>;
}

export function driver(dsnpResolvers: DSNPResolver[]) {
  async function get(options: { did: string }): Promise<object> {
    const did = options.did;
    if (!did || !did.startsWith("did:dsnp:")) {
      throw new Error("Not a valid DSNP DID");
    }
    const id = did.substring("did:dsnp:".length);
    if (id === "") {
      throw new Error("Missing DSNP User Id");
    }

    let dsnpUserId: bigint = 0n;
    try {
      dsnpUserId = BigInt(id);
    } catch (e) {
      throw new Error("Could not parse DSNP User Id");
    }
    if (dsnpUserId < 0n || dsnpUserId >= 2n ** 64n) {
      throw new Error("DSNP User Id not in valid range");
    }

    for (const dsnpResolver of dsnpResolvers) {
      try {
        const output = await dsnpResolver.resolve(dsnpUserId);
        if (output) return output;
      } catch (cause) {
        throw new Error(`Error resolving DSNP User Id ${dsnpUserId}`, {
          cause,
        });
      }
    }

    throw new Error("DSNP User Id not found");
  }

  if (!dsnpResolvers || dsnpResolvers.length === 0)
    throw new Error("Must provide at least one DSNPResolver");

  return {
    method: "dsnp",
    get,
    generate: () => {
      throw new Error("generate() is not implemented");
    },
  };
}

export default { driver };
