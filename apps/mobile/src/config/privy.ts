import { base } from "viem/chains";

function requireEnv(name: string, value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error(
      `Missing ${name}. Copy apps/mobile/.env.example to apps/mobile/.env.local and set your Privy credentials.`,
    );
  }

  return value.trim();
}

export const privyAppId = requireEnv(
  "EXPO_PUBLIC_PRIVY_APP_ID",
  process.env.EXPO_PUBLIC_PRIVY_APP_ID,
);

export const privyClientId = requireEnv(
  "EXPO_PUBLIC_PRIVY_CLIENT_ID",
  process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID,
);

export const privySupportedChains = [base] as const;

export const privyConfig = {
  embedded: {
    ethereum: {
      createOnLogin: "off" as const,
    },
  },
};
