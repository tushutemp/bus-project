/**
 * wsAdapter.js
 * Mimics the socket.io-client API using native WebSocket.
 * Drop-in replacement so the existing frontend hooks work unchanged.
 */

const WS_URL = 'ws://localhost:3001';

class WSAdapter {
  constructor(url = WS_URL) {
    this.url = url;
    this.ws = null;
    this.id = null;
    this.connected = false;
    this._listeners = new Map(); // event -> Set<fn>
    this._reconnectAttempts = 0;
    this._maxReconnect = 10;
    this._reconnectDelay = 2000;
    this._reconnectTimer = null;
    this._intentionalClose = false;
    this._messageQueue = []; // queue while connecting
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return this;
    }

    this._intentionalClose = false;

    try {
      this.ws = new WebSocket(this.url);
    } catch (err) {
      console.error('[WSAdapter] WebSocket creation failed:', err);
      this._scheduleReconnect();
      return this;
    }

    this.ws.onopen = () => {
      this._reconnectAttempts = 0;
      // id will be set when server sends 'connected' event
    };

    this.ws.onmessage = (event) => {
      let parsed;
      try {
        parsed = JSON.parse(event.data);
      } catch (e) {
        return;
      }

      const { event: evtName, data } = parsed;

      // Handle 'connected' — set socket id
      if (evtName === 'connected') {
        this.id = data?.socketId;
        this.connected = true;
        this._fireListeners('connect');
        this._fireListeners('connected', data);
        // Flush queued messages
        while (this._messageQueue.length > 0) {
          const msg = this._messageQueue.shift();
          this.ws.send(msg);
        }
        return;
      }

      this._fireListeners(evtName, data);
      // Broadcast to window so components like BusDetails can listen without subscribing to socket
      try {
        window.dispatchEvent(new CustomEvent('ws:message', { detail: { event: evtName, data } }));
      } catch {}
    };

    this.ws.onclose = (ev) => {
      this.connected = false;
      this.id = null;
      this._fireListeners('disconnect', ev.reason || 'transport close');

      if (!this._intentionalClose) {
        this._scheduleReconnect();
      }
    };

    this.ws.onerror = (err) => {
      console.error('[WSAdapter] WebSocket error:', err);
      this._fireListeners('connect_error', err);
    };

    return this;
  }

  disconnect() {
    this._intentionalClose = true;
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  _scheduleReconnect() {
    if (this._reconnectAttempts >= this._maxReconnect) {
      console.error('[WSAdapter] Max reconnect attempts reached');
      this._fireListeners('reconnect_failed');
      return;
    }
    this._reconnectAttempts++;
    this._fireListeners('reconnect_attempt', this._reconnectAttempts);
    const delay = Math.min(this._reconnectDelay * this._reconnectAttempts, 10000);
    console.log(`[WSAdapter] Reconnecting in ${delay}ms (attempt ${this._reconnectAttempts})`);
    this._reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  emit(event, data, callback) {
    const message = JSON.stringify({ event, data });

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      // Queue the message
      this._messageQueue.push(message);
    }

    // Simulate ack callback (best-effort: listen for matching ack event once)
    if (typeof callback === 'function') {
      const ackEvent = `${event}:ack`;
      const once = (ackData) => {
        callback(ackData);
        this.off(ackEvent, once);
      };
      this.on(ackEvent, once);
    }
  }

  on(event, fn) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(fn);
    return this;
  }

  off(event, fn) {
    if (fn) {
      this._listeners.get(event)?.delete(fn);
    } else {
      this._listeners.delete(event);
    }
    return this;
  }

  once(event, fn) {
    const wrapper = (data) => {
      fn(data);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  removeAllListeners(event) {
    if (event) {
      this._listeners.delete(event);
    } else {
      this._listeners.clear();
    }
    return this;
  }

  _fireListeners(event, data) {
    this._listeners.get(event)?.forEach(fn => {
      try { fn(data); }
      catch (e) { console.error(`[WSAdapter] Listener error for ${event}:`, e); }
    });
  }
}

/**
 * Factory that mimics `io(url, opts)` from socket.io-client.
 * Usage: import io from './wsAdapter'; const socket = io('ws://localhost:3001');
 */
function io(url = WS_URL, opts = {}) {
  const adapter = new WSAdapter(url);
  if (opts.autoConnect !== false) {
    adapter.connect();
  }
  return adapter;
}

export default io;
export { io, WSAdapter };
