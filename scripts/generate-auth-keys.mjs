import { exportJWK, exportPKCS8, generateKeyPair } from "jose";
import { writeFileSync } from "node:fs";

const keys = await generateKeyPair("RS256", { extractable: true });
const privateKey = await exportPKCS8(keys.privateKey);
const publicKey = await exportJWK(keys.publicKey);
const jwks = JSON.stringify({
  keys: [{ use: "sig", ...publicKey, alg: "RS256" }],
});

writeFileSync("scripts/.private-key.pem", privateKey.trimEnd() + "\n");
writeFileSync("scripts/.jwks.json", jwks + "\n");

console.log("Wrote scripts/.private-key.pem and scripts/.jwks.json");
