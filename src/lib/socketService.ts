import { Socket, io } from 'socket.io-client';

// Type for event callback
export type SocketEventCallback = (...args: unknown[]) => void;

function filterApiFromUrl(url: string): string {
  return url.replace(/\/api$/, '');
}

// Map of namespace to Socket instance
class SocketService {
  private baseUrl = filterApiFromUrl('http://localhost:4000'); // use your default from env it would auto matically remove the /api
  private sockets: Map<string, Socket> = new Map();

  // Connect to a namespace with Bearer token
  connect(namespace: string, token: string, opts?: Record<string, unknown>): Socket {
    if (this.sockets.has(namespace)) {
      return this.sockets.get(namespace)!;
    }
    const socket = io(`${this.baseUrl}/${namespace}`, {
      ...opts,
      extraHeaders: {
        'x-client-type': 'Bank',
        'Authorization': `Bearer ${token}`,
        ...(opts?.extraHeaders as Record<string, string> | undefined),
      },
    });
    this.sockets.set(namespace, socket);
    return socket;
  }

  // Disconnect from a namespace
  disconnect(namespace: string) {
    const socket = this.sockets.get(namespace);
    if (socket) {
      socket.disconnect();
      this.sockets.delete(namespace);
    }
  }

  // Emit an event to a namespace
  emit(namespace: string, event: string, ...args: unknown[]) {
    const socket = this.sockets.get(namespace);
    if (socket) {
      socket.emit(event, ...args);
    }
  }

  // Listen to an event in a namespace
  on(namespace: string, event: string, callback: SocketEventCallback) {
    const socket = this.sockets.get(namespace);
    if (socket) {
      socket.on(event, callback);
    }
  }

  // Remove event listener
  off(namespace: string, event: string, callback?: SocketEventCallback) {
    const socket = this.sockets.get(namespace);
    if (socket) {
      socket.off(event, callback);
    }
  }
}

// Singleton instance
let socketService: SocketService | null = null;

export function getSocketService() {
  if (!socketService) {
    socketService = new SocketService();
  }
  return socketService;
} 