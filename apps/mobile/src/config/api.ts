function requireEnv(name: string, value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error(
      `Missing ${name}. Copy apps/mobile/.env.example to apps/mobile/.env.local and set your API base URL.`,
    );
  }

  return value.trim().replace(/\/+$/, "");
}

export const apiBaseUrl = requireEnv(
  "EXPO_PUBLIC_API_BASE_URL",
  process.env.EXPO_PUBLIC_API_BASE_URL,
);
