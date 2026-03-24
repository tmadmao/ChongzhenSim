type EventHandler = (data: unknown) => void;

class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  on(event: string, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  emit(event: string, data?: unknown): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[EventBus] Error in handler for event "${event}":`, error);
        }
      });
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();

export type GameEventType =
  | 'game:init'
  | 'game:save'
  | 'game:load'
  | 'turn:start'
  | 'turn:end'
  | 'tax:calculated'
  | 'finance:updated'
  | 'province:updated'
  | 'minister:updated'
  | 'nation:updated'
  | 'event:generated'
  | 'event:triggered'
  | 'event:completed'
  | 'event:failed'
  | 'decision:made'
  | 'scenario:updated'
  | 'faction:joined'
  | 'faction:destroyed'
  | 'character:joined'
  | 'character:exited'
  | 'policy:researching'
  | 'policy:completed'
  | 'effects:applied'
  | 'ledger:updated'
  | 'error';

export function emitGameEvent(event: GameEventType, data?: unknown): void {
  eventBus.emit(event, data);
}

export function onGameEvent(event: GameEventType, handler: EventHandler): void {
  eventBus.on(event, handler);
}

export function offGameEvent(event: GameEventType, handler: EventHandler): void {
  eventBus.off(event, handler);
}
