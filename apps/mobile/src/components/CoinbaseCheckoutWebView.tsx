import { useMemo, useRef, type ComponentType } from "react";
import { StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

type CheckoutWebViewProps = {
  source: { uri: string };
  onMessage: (event: WebViewMessageEvent) => void;
  injectedJavaScriptBeforeContentLoaded: string;
  javaScriptEnabled: boolean;
  domStorageEnabled: boolean;
  originWhitelist: string[];
  allowsInlineMediaPlayback: boolean;
  mediaPlaybackRequiresUserAction: boolean;
  setSupportMultipleWindows: boolean;
};

const CheckoutWebView = WebView as unknown as ComponentType<CheckoutWebViewProps>;

export const ONRAMP_API_EVENTS = [
  "onramp_api.load_pending",
  "onramp_api.load_success",
  "onramp_api.load_error",
  "onramp_api.commit_success",
  "onramp_api.commit_error",
  "onramp_api.cancel",
  "onramp_api.polling_start",
  "onramp_api.polling_success",
  "onramp_api.polling_error",
] as const;

export type OnrampApiEventName = (typeof ONRAMP_API_EVENTS)[number];

export type OnrampApiEvent = {
  eventName: OnrampApiEventName;
  data?: {
    errorCode?: string;
    errorMessage?: string;
  };
};

type CoinbaseCheckoutWebViewProps = {
  url: string;
  onEvent: (event: OnrampApiEvent) => void;
};

const EVENT_NAME_SET = new Set<string>(ONRAMP_API_EVENTS);

const INJECTED_BRIDGE = `
(function () {
  function forward(raw) {
    try {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(
          typeof raw === "string" ? raw : JSON.stringify(raw)
        );
      }
    } catch (error) {}
  }

  window.cbOnramp = {
    postMessage: forward
  };

  window.addEventListener("message", function (event) {
    if (!event || event.data == null) {
      return;
    }
    forward(event.data);
  });

  true;
})();
`;

function parseOnrampEvent(raw: string): OnrampApiEvent | null {
  let parsed: unknown = raw;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const eventName =
    typeof (parsed as { eventName?: unknown }).eventName === "string"
      ? (parsed as { eventName: string }).eventName
      : null;

  if (!eventName || !EVENT_NAME_SET.has(eventName)) {
    return null;
  }

  const data = (parsed as { data?: unknown }).data;
  const errorCode =
    data && typeof data === "object" && typeof (data as { errorCode?: unknown }).errorCode === "string"
      ? (data as { errorCode: string }).errorCode
      : undefined;
  const errorMessage =
    data &&
    typeof data === "object" &&
    typeof (data as { errorMessage?: unknown }).errorMessage === "string"
      ? (data as { errorMessage: string }).errorMessage
      : undefined;

  return {
    eventName: eventName as OnrampApiEventName,
    data: errorCode || errorMessage ? { errorCode, errorMessage } : undefined,
  };
}

export function CoinbaseCheckoutWebView({ url, onEvent }: CoinbaseCheckoutWebViewProps) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const source = useMemo(() => ({ uri: url }), [url]);

  const handleMessage = (event: WebViewMessageEvent) => {
    const parsed = parseOnrampEvent(event.nativeEvent.data);
    if (parsed) {
      onEventRef.current(parsed);
    }
  };

  return (
    <View style={styles.wrap}>
      <CheckoutWebView
        source={source}
        onMessage={handleMessage}
        injectedJavaScriptBeforeContentLoaded={INJECTED_BRIDGE}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        setSupportMultipleWindows={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 420,
    overflow: "hidden",
    borderRadius: 16,
  },
});
