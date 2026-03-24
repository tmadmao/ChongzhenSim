import { useState, useMemo } from 'react';
import { useProvinceStore } from '../../store/provinceStore';
import { useGameStore } from '../../store/gameStore';
import type { Province, Region } from '../../core/types';

type SortBy = 'tax' | 'unrest' | 'population' | 'military';

export function ProvincePanel() {
  const { provinces, selectedProvinceId, selectProvince, setSortBy, setFilterRegion, sortBy, filterRegion } = useProvinceStore();
  const { adjustProvinceTaxRate } = useGameStore();
  const [editingProvince, setEditingProvince] = useState<string | null>(null);
  const [tempTaxRate, setTempTaxRate] = useState(0);

  const alertCount = provinces.filter(p => p.civilUnrest > 70 || p.disasterLevel >= 3).length;

  const sortedProvinces = useMemo(() => {
    let filtered = [...provinces];
    
    if (filterRegion) {
      filtered = filtered.filter(p => p.region === filterRegion);
    }

    filtered.sort((a, b) => {
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

    return filtered;
  }, [provinces, sortBy, filterRegion]);

  const handleTaxAdjust = (provinceId: string, rate: number) => {
    adjustProvinceTaxRate(provinceId, rate);
    setEditingProvince(null);
  };

  const openTaxEditor = (province: Province) => {
    setEditingProvince(province.id);
    setTempTaxRate(province.taxRate);
  };

  const getRegionLabel = (region: Region) => {
    const labels: Record<Region, string> = {
      north: '北方',
      south: '南方',
      east: '东方',
      west: '西方',
      central: '中原',
      border: '边疆'
    };
    return labels[region];
  };

  return (
    <div className="palace-panel panel-decorated h-full p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="palace-title text-lg panel-title-decorated">天下诸省</h2>
        {alertCount > 0 && (
          <span className="palace-badge palace-badge-red glow-pulse">
            ⚠️ {alertCount} 省需关注
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-4 flex-shrink-0">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="palace-input text-sm flex-1"
        >
          <option value="tax">按税收排序</option>
          <option value="unrest">按民乱排序</option>
          <option value="population">按人口排序</option>
          <option value="military">按军力排序</option>
        </select>

        <select
          value={filterRegion || ''}
          onChange={(e) => setFilterRegion(e.target.value as Region || null)}
          className="palace-input text-sm flex-1"
        >
          <option value="">全部地区</option>
          <option value="north">北方</option>
          <option value="south">南方</option>
          <option value="east">东方</option>
          <option value="west">西方</option>
          <option value="central">中原</option>
          <option value="border">边疆</option>
        </select>
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto palace-scrollbar min-h-0">
        {sortedProvinces.map(province => {
          const hasAlert = province.civilUnrest > 70 || province.disasterLevel >= 3;
          const isSelected = selectedProvinceId === province.id;

          return (
            <div
              key={province.id}
              onClick={() => selectProvince(province.id)}
              className={`palace-card card-hover-glow cursor-pointer ${
                isSelected ? 'palace-card-selected gold-border-highlight' : ''
              } ${hasAlert ? 'palace-card-alert' : ''}`}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{province.name}</span>
                  <span className="text-xs text-palace-text-muted">
                    {getRegionLabel(province.region)}
                  </span>
                </div>
                <span className="text-palace-gold text-sm font-display">
                  {province.taxRevenue.toFixed(1)} 万两
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1 text-xs text-palace-text-muted mb-2">
                <div className="text-center">
                  <span>💰</span>
                  <span>{(province.taxRate * 100).toFixed(0)}%</span>
                </div>
                <div className={`text-center ${province.civilUnrest > 70 ? 'text-danger' : ''}`}>
                  <span>😤</span>
                  <span>{province.civilUnrest}</span>
                </div>
                <div className={`text-center ${province.disasterLevel >= 3 ? 'text-warning' : ''}`}>
                  <span>🌊</span>
                  <span>{province.disasterLevel}</span>
                </div>
                <div className="text-center">
                  <span>⚔️</span>
                  <span>{province.militaryForce}</span>
                </div>
              </div>

              {editingProvince === province.id ? (
                <div className="border-t border-palace-border pt-2 mt-2">
                  <label className="text-palace-text-muted text-xs block mb-1">
                    税率: {(tempTaxRate * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={tempTaxRate * 100}
                    onChange={(e) => setTempTaxRate(parseInt(e.target.value) / 100)}
                    className="w-full h-2 bg-palace-bg-light rounded-lg appearance-none cursor-pointer accent-palace-gold"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTaxAdjust(province.id, tempTaxRate);
                      }}
                      className="palace-button-gold text-xs flex-1 py-1"
                    >
                      确认
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProvince(null);
                      }}
                      className="palace-button-outline text-xs flex-1 py-1"
                    >
                      取消
                    </button>
                  </div>
                  {province.civilUnrest > 50 && (
                    <p className="text-warning text-xs mt-2">
                      ⚠️ 民乱较高，提高税率可能引发民变
                    </p>
                  )}
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openTaxEditor(province);
                  }}
                  className="palace-button-outline text-xs w-full py-1"
                >
                  调整税率
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
