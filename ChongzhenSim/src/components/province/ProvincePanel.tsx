import { useMemo } from 'react';
import { useProvinceStore } from '../../store/provinceStore';
import type { Region } from '../../core/types';

type SortBy = 'tax' | 'unrest' | 'population' | 'military';

export function ProvincePanel() {
  const { provinces, selectedProvinceId, selectProvince, setSortBy, setFilterRegion, sortBy, filterRegion } = useProvinceStore();

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

              <div className="border-t border-palace-border pt-2 mt-2 text-xs text-palace-text-muted">
                <p>当前税率由皇极殿朝政决策决定，调整请前往「皇极殿」处理。</p>
                {province.civilUnrest > 50 && (
                  <p className="text-warning mt-2">
                    ⚠️ 民乱较高，提高税率可能引发民变
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
