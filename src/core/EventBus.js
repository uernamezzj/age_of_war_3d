/**
 * 全局解耦事件总线 (EventBus)
 */
export class EventBus {
  constructor() {
    this.events = new Map();
  }

  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.events.has(event)) return;
    const list = this.events.get(event).filter(cb => cb !== callback);
    this.events.set(event, list);
  }

  emit(event, data) {
    if (!this.events.has(event)) return;
    this.events.get(event).forEach(cb => {
      try {
        cb(data);
      } catch (e) {
        console.error(`[EventBus] Error in event '${event}':`, e);
      }
    });
  }
}

export const globalBus = new EventBus();
