import { Cache } from '../src/utils/cache';

describe('Cache Utility (Simple)', () => {
  test('should create a cache instance', () => {
    const cache = new Cache(1000);
    expect(cache).toBeDefined();
    expect(typeof cache.get).toBe('function');
    expect(typeof cache.set).toBe('function');
    expect(typeof cache.delete).toBe('function');
    expect(typeof cache.clear).toBe('function');
    expect(typeof cache.size).toBe('function');
  });

  test('should set and get a value', async () => {
    const cache = new Cache(1000);
    const key = 'test-key';
    const value = 'test-value';

    cache.set(key, value);
    const result = await cache.get(key, async () => value);

    expect(result).toBe(value);
  });

  test('should use the factory function when key does not exist', async () => {
    const cache = new Cache(1000);
    const key = 'factory-key';
    const factoryValue = 'factory-value';
    const factory = jest.fn().mockResolvedValue(factoryValue);

    const result = await cache.get(key, factory);

    expect(result).toBe(factoryValue);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  test('should not call factory when key exists', async () => {
    const cache = new Cache(1000);
    const key = 'existing-key';
    const initialValue = 'initial-value';
    const factoryValue = 'factory-value';
    const factory = jest.fn().mockResolvedValue(factoryValue);

    cache.set(key, initialValue);
    const result = await cache.get(key, factory);

    expect(result).toBe(initialValue);
    expect(factory).not.toHaveBeenCalled();
  });

  test('should delete a key', async () => {
    const cache = new Cache(1000);
    const key = 'delete-key';
    const value = 'delete-value';

    cache.set(key, value);
    cache.delete(key);
    const factory = jest.fn().mockResolvedValue('new-value');
    const result = await cache.get(key, factory);

    expect(result).toBe('new-value');
    expect(factory).toHaveBeenCalledTimes(1);
  });

  test('should clear all keys', async () => {
    const cache = new Cache(1000);
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    cache.clear();

    const factory1 = jest.fn().mockResolvedValue('new-value1');
    const factory2 = jest.fn().mockResolvedValue('new-value2');
    const result1 = await cache.get('key1', factory1);
    const result2 = await cache.get('key2', factory2);

    expect(result1).toBe('new-value1');
    expect(result2).toBe('new-value2');
    expect(factory1).toHaveBeenCalledTimes(1);
    expect(factory2).toHaveBeenCalledTimes(1);
  });

  test('should return the size of the cache', () => {
    const cache = new Cache(1000);
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    expect(cache.size()).toBe(2);
  });
});