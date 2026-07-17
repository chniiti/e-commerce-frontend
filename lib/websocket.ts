"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { toast } from "sonner";

import { useAuthStore } from "@/lib/stores/authStore";
import type {
  OrderNotification,
  OrderNotificationMessage,
  WebsocketConnectionStatus,
} from "@/lib/types";

const TOPIC_ORDERS = "/topic/orders";
const MAX_NOTIFICATIONS = 50;
const RECONNECT_DELAY_MS = 5_000;

interface NotificationsState {
  notifications: OrderNotification[];
  connectionStatus: WebsocketConnectionStatus;
}

type Listener = () => void;

let state: NotificationsState = {
  notifications: [],
  connectionStatus: "disconnected",
};

const listeners = new Set<Listener>();
let stompClient: Client | null = null;
let subscription: StompSubscription | null = null;
let connectSubscriberCount = 0;
let activeToken: string | null = null;

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function setState(partial: Partial<NotificationsState>) {
  state = { ...state, ...partial };
  emit();
}

function getSnapshot(): NotificationsState {
  return state;
}

function getServerSnapshot(): NotificationsState {
  return {
    notifications: [],
    connectionStatus: "disconnected",
  };
}

function subscribeStore(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function createNotificationId(message: OrderNotificationMessage): string {
  return `${message.orderId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseNotificationMessage(body: string): OrderNotificationMessage | null {
  try {
    const parsed = JSON.parse(body) as OrderNotificationMessage;
    if (
      typeof parsed.orderId !== "number" ||
      typeof parsed.productName !== "string" ||
      typeof parsed.deliveryLocation !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function handleIncomingMessage(frame: IMessage) {
  const payload = parseNotificationMessage(frame.body);
  if (!payload) {
    return;
  }

  const notification: OrderNotification = {
    ...payload,
    id: createNotificationId(payload),
    receivedAt: new Date().toISOString(),
    read: false,
  };

  setState({
    notifications: [notification, ...state.notifications].slice(
      0,
      MAX_NOTIFICATIONS,
    ),
  });

  const variantLabel = payload.variant ? ` · ${payload.variant}` : "";
  toast.message(`New order: ${payload.productName}${variantLabel}`, {
    description: `${payload.deliveryLocation} · ${payload.customerName}`,
  });
}

function getWsUrl(): string {
  return process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:8081/ws";
}

function disconnectClient() {
  if (subscription) {
    try {
      subscription.unsubscribe();
    } catch {
      // Ignore unsubscribe errors during teardown.
    }
    subscription = null;
  }

  if (stompClient) {
    const client = stompClient;
    stompClient = null;
    activeToken = null;
    try {
      void client.deactivate();
    } catch {
      // Ignore deactivate errors during teardown.
    }
  }

  setState({ connectionStatus: "disconnected" });
}

function connectClient(accessToken: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (stompClient?.active && activeToken === accessToken) {
    return;
  }

  disconnectClient();
  activeToken = accessToken;
  setState({ connectionStatus: "connecting" });

  const client = new Client({
    webSocketFactory: () => new SockJS(getWsUrl()),
    connectHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
    reconnectDelay: RECONNECT_DELAY_MS,
    heartbeatIncoming: 10_000,
    heartbeatOutgoing: 10_000,
    onConnect: () => {
      setState({ connectionStatus: "connected" });
      subscription = client.subscribe(TOPIC_ORDERS, handleIncomingMessage);
    },
    onDisconnect: () => {
      setState({ connectionStatus: "disconnected" });
    },
    onStompError: () => {
      setState({ connectionStatus: "error" });
    },
    onWebSocketError: () => {
      setState({ connectionStatus: "error" });
    },
    onWebSocketClose: () => {
      if (connectSubscriberCount > 0 && activeToken) {
        setState({ connectionStatus: "connecting" });
      } else {
        setState({ connectionStatus: "disconnected" });
      }
    },
  });

  stompClient = client;
  client.activate();
}

function ensureConnected(accessToken: string | null) {
  if (!accessToken) {
    disconnectClient();
    return;
  }

  if (connectSubscriberCount <= 0) {
    return;
  }

  connectClient(accessToken);
}

export function markNotificationAsRead(id: string) {
  setState({
    notifications: state.notifications.map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification,
    ),
  });
}

export function markAllNotificationsAsRead() {
  setState({
    notifications: state.notifications.map((notification) => ({
      ...notification,
      read: true,
    })),
  });
}

export function clearNotifications() {
  setState({ notifications: [] });
}

interface UseOrderNotificationsOptions {
  /** When true, opens/keeps the STOMP connection. Only set in admin/trends layouts. */
  connect?: boolean;
}

export function useOrderNotifications(
  options: UseOrderNotificationsOptions = {},
) {
  const connect = options.connect ?? false;
  const accessToken = useAuthStore((store) => store.accessToken);
  const snapshot = useSyncExternalStore(
    subscribeStore,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (!connect) {
      return;
    }

    connectSubscriberCount += 1;
    ensureConnected(accessToken);

    return () => {
      connectSubscriberCount = Math.max(0, connectSubscriberCount - 1);
      if (connectSubscriberCount === 0) {
        disconnectClient();
      }
    };
  }, [connect, accessToken]);

  const unreadCount = snapshot.notifications.reduce(
    (count, notification) => (notification.read ? count : count + 1),
    0,
  );

  return {
    notifications: snapshot.notifications,
    unreadCount,
    connectionStatus: snapshot.connectionStatus,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    clear: clearNotifications,
  };
}
