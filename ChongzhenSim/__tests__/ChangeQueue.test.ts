import { changeQueue, ChangeType } from '../src/engine/ChangeQueue';

describe('ChangeQueue', () => {
  beforeEach(() => {
    changeQueue.clear();
  });

  test('should enqueue a change', () => {
    const change = {
      type: ChangeType.PROVINCE,
      target: 'province-1',
      field: 'taxRate',
      newValue: 0.3,
      description: 'Test tax rate change',
      source: 'test'
    };

    changeQueue.enqueue(change);
    const queue = changeQueue.getAll();

    expect(queue).toHaveLength(1);
    expect(queue[0]).toEqual(expect.objectContaining({
      type: ChangeType.PROVINCE,
      target: 'province-1',
      field: 'taxRate',
      newValue: 0.3,
      description: 'Test tax rate change',
      source: 'test'
    }));
  });

  test('should enqueue multiple changes', () => {
    const change1 = {
      type: ChangeType.PROVINCE,
      target: 'province-1',
      field: 'taxRate',
      newValue: 0.3,
      description: 'Test tax rate change 1',
      source: 'test'
    };

    const change2 = {
      type: ChangeType.PROVINCE,
      target: 'province-2',
      field: 'civilUnrest',
      delta: 10,
      description: 'Test civil unrest change',
      source: 'test'
    };

    changeQueue.enqueue(change1);
    changeQueue.enqueue(change2);
    const queue = changeQueue.getAll();

    expect(queue).toHaveLength(2);
    expect(queue[0]).toEqual(expect.objectContaining({
      type: ChangeType.PROVINCE,
      target: 'province-1',
      field: 'taxRate',
      newValue: 0.3
    }));
    expect(queue[1]).toEqual(expect.objectContaining({
      type: ChangeType.PROVINCE,
      target: 'province-2',
      field: 'civilUnrest',
      delta: 10
    }));
  });

  test('should clear the queue', () => {
    const change = {
      type: ChangeType.PROVINCE,
      target: 'province-1',
      field: 'taxRate',
      newValue: 0.3,
      description: 'Test tax rate change',
      source: 'test'
    };

    changeQueue.enqueue(change);
    expect(changeQueue.getAll()).toHaveLength(1);

    changeQueue.clear();
    expect(changeQueue.getAll()).toHaveLength(0);
  });

  test('should get the queue length', () => {
    expect(changeQueue.length).toBe(0);

    const change = {
      type: ChangeType.PROVINCE,
      target: 'province-1',
      field: 'taxRate',
      newValue: 0.3,
      description: 'Test tax rate change',
      source: 'test'
    };

    changeQueue.enqueue(change);
    expect(changeQueue.length).toBe(1);
  });

  test('should handle both absolute and delta changes', () => {
    // Absolute change (newValue)
    const absoluteChange = {
      type: ChangeType.PROVINCE,
      target: 'province-1',
      field: 'taxRate',
      newValue: 0.3,
      description: 'Test absolute change',
      source: 'test'
    };

    // Delta change (delta)
    const deltaChange = {
      type: ChangeType.PROVINCE,
      target: 'province-1',
      field: 'civilUnrest',
      delta: 10,
      description: 'Test delta change',
      source: 'test'
    };

    changeQueue.enqueue(absoluteChange);
    changeQueue.enqueue(deltaChange);
    const queue = changeQueue.getAll();

    expect(queue).toHaveLength(2);
    expect(queue[0]).toEqual(expect.objectContaining({
      type: ChangeType.PROVINCE,
      target: 'province-1',
      field: 'taxRate',
      newValue: 0.3
    }));
    expect(queue[1]).toEqual(expect.objectContaining({
      type: ChangeType.PROVINCE,
      target: 'province-1',
      field: 'civilUnrest',
      delta: 10
    }));
  });

  test('should get changes by type', () => {
    const provinceChange = {
      type: ChangeType.PROVINCE,
      target: 'province-1',
      field: 'taxRate',
      newValue: 0.3,
      description: 'Test province change',
      source: 'test'
    };

    const treasuryChange = {
      type: ChangeType.TREASURY,
      target: 'gold',
      field: 'gold',
      delta: 100,
      description: 'Test treasury change',
      source: 'test'
    };

    changeQueue.enqueue(provinceChange);
    changeQueue.enqueue(treasuryChange);

    const provinceChanges = changeQueue.getByType(ChangeType.PROVINCE);
    const treasuryChanges = changeQueue.getByType(ChangeType.TREASURY);

    expect(provinceChanges).toHaveLength(1);
    expect(provinceChanges[0]).toEqual(expect.objectContaining({
      type: ChangeType.PROVINCE
    }));

    expect(treasuryChanges).toHaveLength(1);
    expect(treasuryChanges[0]).toEqual(expect.objectContaining({
      type: ChangeType.TREASURY
    }));
  });

  test('should get stats', () => {
    const provinceChange = {
      type: ChangeType.PROVINCE,
      target: 'province-1',
      field: 'taxRate',
      newValue: 0.3,
      description: 'Test province change',
      source: 'test'
    };

    const treasuryChange = {
      type: ChangeType.TREASURY,
      target: 'gold',
      field: 'gold',
      delta: 100,
      description: 'Test treasury change',
      source: 'test'
    };

    changeQueue.enqueue(provinceChange);
    changeQueue.enqueue(treasuryChange);

    const stats = changeQueue.getStats();

    expect(stats.total).toBe(2);
    expect(stats.byType[ChangeType.PROVINCE]).toBe(1);
    expect(stats.byType[ChangeType.TREASURY]).toBe(1);
    expect(stats.byType[ChangeType.FACTION]).toBe(0);
    expect(stats.byType[ChangeType.NATION]).toBe(0);
    expect(stats.byType[ChangeType.OFFICIAL]).toBe(0);
    expect(stats.byType[ChangeType.EVENT]).toBe(0);
  });
});