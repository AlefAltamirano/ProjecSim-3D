/**
 * EventBus.js
 * Lightweight publish/subscribe event bus.
 * Decouples modules — no direct references needed.
 *
 * Usage:
 *   EventBus.on('params:changed', handler)
 *   EventBus.emit('params:changed', payload)
 *   EventBus.off('params:changed', handler)
 */
export class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
  }

  /**
   * Subscribe to an event.
   * @param {string}   event
   * @param {Function} handler
   */
  on(event, handler) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);
  }

  /**
   * Unsubscribe from an event.
   * @param {string}   event
   * @param {Function} handler
   */
  off(event, handler) {
    this._listeners.get(event)?.delete(handler);
  }

  /**
   * Emit an event with a payload.
   * @param {string} event
   * @param {*}      payload
   */
  emit(event, payload) {
    this._listeners.get(event)?.forEach(h => h(payload));
  }

  /** Remove all listeners for an event. */
  clear(event) {
    this._listeners.delete(event);
  }
}

/** Singleton instance shared across the application. */
export const bus = new EventBus();
