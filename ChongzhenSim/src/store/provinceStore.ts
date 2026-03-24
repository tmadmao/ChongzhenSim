import { create } from 'zustand';
import type { Province, Region } from '../core/types';
import { getAllProvinces, updateProvince, getTopTaxProvinces, getAlertProvinces } from '../db/database';

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

  updateProvinceTaxRate: (id, rate) => {
    const clampedRate = Math.max(0, Math.min(0.8, rate));
    const success = updateProvince(id, { taxRate: clampedRate });
    
    if (success) {
      const { provinces } = get();
      const updatedProvinces = provinces.map(p => 
        p.id === id ? { ...p, taxRate: clampedRate } : p
      );
      set({ provinces: updatedProvinces });
    }
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
