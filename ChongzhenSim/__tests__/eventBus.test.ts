import { eventBus } from '../src/core/eventBus';

describe('EventBus', () => {
  beforeEach(() => {
    eventBus.clear();
  });

  test('should subscribe to an event and receive notifications', () => {
    const testEvent = 'test-event';
    const listener = jest.fn();

    eventBus.on(testEvent, listener);
    eventBus.emit(testEvent, 'test-data');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('test-data');
  });

  test('should subscribe multiple listeners to the same event', () => {
    const testEvent = 'test-event';
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    eventBus.on(testEvent, listener1);
    eventBus.on(testEvent, listener2);
    eventBus.emit(testEvent, 'test-data');

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener1).toHaveBeenCalledWith('test-data');
    expect(listener2).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledWith('test-data');
  });

  test('should unsubscribe from an event', () => {
    const testEvent = 'test-event';
    const listener = jest.fn();

    eventBus.on(testEvent, listener);
    eventBus.off(testEvent, listener);
    eventBus.emit(testEvent, 'test-data');

    expect(listener).not.toHaveBeenCalled();
  });

  test('should emit events with different data types', () => {
    const testEvent = 'test-event';
    const listener = jest.fn();

    eventBus.on(testEvent, listener);

    eventBus.emit(testEvent, 'string-data');
    eventBus.emit(testEvent, 42);
    eventBus.emit(testEvent, { key: 'value' });
    eventBus.emit(testEvent, [1, 2, 3]);

    expect(listener).toHaveBeenCalledTimes(4);
    expect(listener).toHaveBeenNthCalledWith(1, 'string-data');
    expect(listener).toHaveBeenNthCalledWith(2, 42);
    expect(listener).toHaveBeenNthCalledWith(3, { key: 'value' });
    expect(listener).toHaveBeenNthCalledWith(4, [1, 2, 3]);
  });

  test('should handle different event types', () => {
    const event1 = 'event-1';
    const event2 = 'event-2';
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    eventBus.on(event1, listener1);
    eventBus.on(event2, listener2);

    eventBus.emit(event1, 'data-for-event-1');
    eventBus.emit(event2, 'data-for-event-2');

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener1).toHaveBeenCalledWith('data-for-event-1');
    expect(listener2).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledWith('data-for-event-2');
  });

  test('should clear all listeners', () => {
    const event1 = 'event-1';
    const event2 = 'event-2';
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    eventBus.on(event1, listener1);
    eventBus.on(event2, listener2);
    eventBus.clear();

    eventBus.emit(event1, 'data-1');
    eventBus.emit(event2, 'data-2');

    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).not.toHaveBeenCalled();
  });

  test('should not throw error when emitting event with no listeners', () => {
    expect(() => {
      eventBus.emit('non-existent-event', 'test-data');
    }).not.toThrow();
  });

  test('should not throw error when unsubscribing non-existent listener', () => {
    const testEvent = 'test-event';
    const listener = jest.fn();

    expect(() => {
      eventBus.off(testEvent, listener);
    }).not.toThrow();
  });
});