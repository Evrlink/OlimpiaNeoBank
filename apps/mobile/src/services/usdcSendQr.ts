const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const BASE_CHAIN_ID = "8453";
const BASE_USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";

function extractAddress(value: string): string | null {
  const match = value.match(/0x[0-9a-fA-F]{40}/);
  return match ? match[0] : null;
}

function chainIdFromPayload(value: string): string | null {
  const caip = value.match(/eip155:(\d+)/i);
  if (caip?.[1]) {
    return caip[1];
  }

  const atChain = value.match(/@(?:eip155:)?(\d+)/i);
  if (atChain?.[1]) {
    return atChain[1];
  }

  return null;
}

/**
 * Parse a pasted or scanned payload into a Base wallet address.
 * Does not send a transaction. Returns null when the payload is not a Base address.
 */
export function parseBaseWalletAddress(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const chainId = chainIdFromPayload(trimmed);
  if (chainId && chainId !== BASE_CHAIN_ID) {
    return null;
  }

  const lower = trimmed.toLowerCase();
  if (lower.includes("/transfer") || lower.includes("token=")) {
    const tokenMatch = trimmed.match(/0x[0-9a-fA-F]{40}/);
    if (tokenMatch && tokenMatch[0].toLowerCase() !== BASE_USDC) {
      const queryAddress = trimmed.match(/[?&]address=(0x[0-9a-fA-F]{40})/i);
      if (!queryAddress) {
        return null;
      }
    }
  }

  const queryDest = trimmed.match(/[?&]address=(0x[0-9a-fA-F]{40})/i);
  if (queryDest?.[1]) {
    return queryDest[1];
  }

  const caip = trimmed.match(/^eip155:(\d+):(0x[0-9a-fA-F]{40})$/i);
  if (caip?.[1] && caip[2]) {
    return caip[1] === BASE_CHAIN_ID ? caip[2] : null;
  }

  if (ADDRESS_PATTERN.test(trimmed)) {
    return trimmed;
  }

  if (lower.startsWith("ethereum:")) {
    return extractAddress(trimmed);
  }

  return extractAddress(trimmed);
}
