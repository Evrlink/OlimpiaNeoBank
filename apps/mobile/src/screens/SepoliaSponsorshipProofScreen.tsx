import { SmartWalletsProvider, useSmartWallets } from "@privy-io/expo/smart-wallets";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing } from "@/theme/colors";
import { baseSepolia } from "viem/chains";

type SepoliaSponsorshipProofScreenProps = {
  embeddedWalletAddress: string;
  onBack: () => void;
};

export function SepoliaSponsorshipProofScreen({
  embeddedWalletAddress,
  onBack,
}: SepoliaSponsorshipProofScreenProps) {
  return (
    <SmartWalletsProvider>
      <SepoliaSponsorshipProofBody
        embeddedWalletAddress={embeddedWalletAddress}
        onBack={onBack}
      />
    </SmartWalletsProvider>
  );
}

function SepoliaSponsorshipProofBody({
  embeddedWalletAddress,
  onBack,
}: SepoliaSponsorshipProofScreenProps) {
  const { getClientForChain } = useSmartWallets();
  const [smartWalletAddress, setSmartWalletAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isPreparing, setIsPreparing] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setIsPreparing(true);
    setError(null);

    getClientForChain({ chainId: baseSepolia.id })
      .then((client) => {
        if (cancelled) {
          return;
        }

        setSmartWalletAddress(client.account?.address ?? null);
        setChainId(client.chain?.id ?? null);
        setIsPreparing(false);
      })
      .catch((prepareError: unknown) => {
        if (cancelled) {
          return;
        }

        setSmartWalletAddress(null);
        setChainId(null);
        setIsPreparing(false);
        setError(
          prepareError instanceof Error
            ? prepareError.message
            : "Could not prepare the Base Sepolia smart wallet client.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [getClientForChain]);

  const handleSend = useCallback(async () => {
    if (isSending) {
      return;
    }

    setError(null);
    setTransactionHash(null);
    setIsSending(true);

    try {
      const client = await getClientForChain({ chainId: baseSepolia.id });
      const nextChainId = client.chain?.id;
      const nextSmartWalletAddress = client.account?.address;
      const embeddedAddress = embeddedWalletAddress.trim();

      if (nextChainId !== baseSepolia.id) {
        setError("Refusing to send: smart wallet client is not Base Sepolia.");
        return;
      }

      if (!nextSmartWalletAddress || !embeddedAddress) {
        setError("Refusing to send: a wallet address is missing.");
        return;
      }

      if (nextSmartWalletAddress.toLowerCase() === embeddedAddress.toLowerCase()) {
        setError("Refusing to send: smart wallet address matches the embedded EOA.");
        return;
      }

      const hash = await client.sendTransaction({
        to: nextSmartWalletAddress,
        value: 0n,
        data: "0x",
      });

      setSmartWalletAddress(nextSmartWalletAddress);
      setChainId(nextChainId);
      setTransactionHash(hash);
    } catch (sendError: unknown) {
      setError(
        sendError instanceof Error ? sendError.message : "Sponsored transaction failed.",
      );
    } finally {
      setIsSending(false);
    }
  }, [embeddedWalletAddress, getClientForChain, isSending]);

  const addressesDiffer =
    Boolean(smartWalletAddress) &&
    smartWalletAddress?.toLowerCase() !== embeddedWalletAddress.trim().toLowerCase();
  const canSend =
    !isPreparing && !isSending && chainId === baseSepolia.id && addressesDiffer;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back to Profile">
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <Text style={styles.kicker}>Dev only</Text>
        <Text style={styles.title}>Base Sepolia sponsorship proof</Text>
        <Text style={styles.body}>
          This screen is separate from Receive, balance, and activity. Nothing is sent until you
          press the button below.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Embedded EOA</Text>
          <Text selectable style={styles.value}>
            {embeddedWalletAddress.trim() || "Missing"}
          </Text>
          <Text style={styles.label}>Coinbase Smart Wallet</Text>
          <Text selectable style={styles.value}>
            {isPreparing ? "Preparing Base Sepolia client…" : smartWalletAddress || "Unavailable"}
          </Text>
          <Text style={styles.label}>Chain</Text>
          <Text style={styles.value}>{chainId ?? "Not loaded"}</Text>
        </View>

        <Pressable
          style={[styles.button, canSend ? null : styles.buttonDisabled]}
          onPress={() => void handleSend()}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send zero-value Base Sepolia proof"
        >
          <Text style={styles.buttonLabel}>
            {isSending ? "Sending…" : "Send zero-value Base Sepolia proof"}
          </Text>
        </Pressable>

        {transactionHash ? (
          <Text selectable style={styles.hash}>
            {transactionHash}
          </Text>
        ) : null}
        {error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 8,
    paddingBottom: spacing.block,
    gap: 12,
  },
  back: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 22,
    color: colors.berryDark,
  },
  kicker: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    lineHeight: 16,
    color: colors.inkMuted,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    lineHeight: 34,
    color: colors.ink,
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
  },
  card: {
    marginTop: 8,
    padding: spacing.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(232, 225, 218, 0.4)",
    backgroundColor: colors.card,
    gap: 6,
  },
  label: {
    marginTop: 8,
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    lineHeight: 16,
    color: colors.inkMuted,
  },
  value: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
  },
  button: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: spacing.card,
    borderRadius: radius.card,
    backgroundColor: colors.berryDark,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 22,
    color: colors.white,
  },
  hash: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: colors.ink,
  },
  error: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: colors.raspberry,
  },
});
