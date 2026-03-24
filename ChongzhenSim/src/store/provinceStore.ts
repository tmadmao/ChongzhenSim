import { create } from 'zustand';
import type { Province, Region } from '../core/types';
import { getAllProvinces, getTopTaxProvinces, getAlertProvinces } from '../db/database';

interface ProvinceStore {
  provinces: Province[];
  selectedProvinceId: string | null;
  filterRegion: Region | null;
  sortBy: 'tax' | 'unrest' | 'population' | 'military';
  
  loadProvinces: () => void;
  selectProvince: (id: string | null) => void;
  updateProvinceTaxRate: (id: string, rate: number) => void;
  getTopTaxProvincesList: (n: number) => Province[];
  getAlertProvincesList: () => Province[];
  setFilterRegion: (region: Region | null) => void;
  setSortBy: (field: 'tax' | 'unrest' | 'population' | 'military') => void;
  getFilteredProvinces: () => Province[];
}

export const useProvinceStore = create<ProvinceStore>((set, get) => ({
  provinces: [],
  selectedProvinceId: null,
  filterRegion: null,
  sortBy: 'tax',

  loadProvinces: () => {
    try {
      console.log('[ProvinceStore] loadProvinces called');
      const provinces = getAllProvinces();
      console.log('[ProvinceStore] loaded provinces:', provinces.length);
      set({ provinces });
    } catch (error) {
      console.error('[ProvinceStore] loadProvinces failed:', error);
    }
  },

  selectProvince: (id) => {
    set({ selectedProvinceId: id });
  },

  updateProvinceTaxRate: async (id, rate) => {
    const clampedRate = Math.max(0, Math.min(0.8, rate));
    const { provinces } = get();
    const province = provinces.find(p => p.id === id);
    
    if (!province) {
      console.warn('[ProvinceStore] Province not found:', id);
      return;
    }
    
    const oldRate = province.taxRate;
    
    // 将税率调整添加到 ChangeQueue，等待回合结算
    // 不直接修改数据库！
    const { changeQueue } = await import('../engine/ChangeQueue');
    
    changeQueue.enqueue({
      type: 'province',
      target: id,
      field: 'taxRate',
      newValue: clampedRate, // 使用新值（绝对值模式）
      description: `${province.name} 税率调整: ${(oldRate * 100).toFixed(0)}% → ${(clampedRate * 100).toFixed(0)}%`,
      source: '税率调整'
    });
    
    // 计算民乱变化
    const rateChange = clampedRate - oldRate;
    let civilUnrestDelta = 0;
    
    if (rateChange > 0.1) {
      civilUnrestDelta = Math.floor(rateChange * 30);
    } else if (rateChange < -0.1) {
      civilUnrestDelta = -Math.floor(Math.abs(rateChange) * 15);
    }
    
    if (civilUnrestDelta !== 0) {
      changeQueue.enqueue({
        type: 'province',
        target: id,
        field: 'civilUnrest',
        delta: civilUnrestDelta, // 使用变动值（累积模式）
        description: `${province.name} 民乱变化: ${civilUnrestDelta > 0 ? '+' : ''}${civilUnrestDelta}`,
        source: '税率调整'
      });
    }
    
    console.log(`[ProvinceStore] 税率调整已加入队列: ${province.name} ${(oldRate * 100).toFixed(0)}% → ${(clampedRate * 100).toFixed(0)}%`);
    
    // 注意：这里不修改 provinces 数组，只记录到队列
    // 状态将在回合结束时统一更新
  },

  getTopTaxProvincesList: (n) => {
    return getTopTaxProvinces(n);
  },

  getAlertProvincesList: () => {
    return getAlertProvinces();
  },

  setFilterRegion: (region) => {
    set({ filterRegion: region });
  },

  setSortBy: (field) => {
    set({ sortBy: field });
  },

  getFilteredProvinces: () => {
    const { provinces, filterRegion, sortBy } = get();
    
    let filtered = provinces;
    
    if (filterRegion) {
      filtered = provinces.filter(p => p.region === filterRegion);
    }
    
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'tax':
          return b.taxRevenue - a.taxRevenue;
        case 'unrest':
          return b.civilUnrest - a.civilUnrest;
        case 'population':
          return b.population - a.population;
        case 'military':
          return b.militaryForce - a.militaryForce;
        default:
          return 0;
      }
    });
    
    return sorted;
  }
}));
