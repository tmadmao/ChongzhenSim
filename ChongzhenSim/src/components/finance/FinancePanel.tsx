import { useState, useMemo } from 'react';
import { useFinanceStore } from '../../store/financeStore';
import { useGameStore } from '../../store/gameStore';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

type TabType = 'overview' | 'chart' | 'ranking';

export function FinancePanel() {
  const { treasury, recentTransactions, chartData, financialHealth } = useFinanceStore();
  const { gameState } = useGameStore();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const getHealthColor = () => {
    switch (financialHealth) {
      case 'surplus': return 'text-success';
      case 'balanced': return 'text-warning';
      case 'deficit': return 'text-orange-400';
      case 'bankrupt': return 'text-danger';
      default: return 'text-palace-text';
    }
  };

  const getHealthLabel = () => {
    switch (financialHealth) {
      case 'surplus': return '国库充盈';
      case 'balanced': return '收支平衡';
      case 'deficit': return '入不敷出';
      case 'bankrupt': return '国库告急';
      default: return '未知';
    }
  };

  const topProvinces = useMemo(() => {
    if (!gameState) return [];
    return [...gameState.provinces]
      .sort((a, b) => b.taxRevenue - a.taxRevenue)
      .slice(0, 5);
  }, [gameState]);

  const bottomProvinces = useMemo(() => {
    if (!gameState) return [];
    return [...gameState.provinces]
      .sort((a, b) => a.taxRevenue - b.taxRevenue)
      .slice(0, 5);
  }, [gameState]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="palace-panel p-3 text-sm">
          <p className="text-palace-text-muted mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()} 万两
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="palace-panel panel-decorated h-full p-4">
      <h2 className="palace-title text-lg mb-4 panel-title-decorated">财政总览</h2>

      <div className="flex gap-2 mb-4">
        {(['overview', 'chart', 'ranking'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 text-sm rounded transition-all ${
              activeTab === tab
                ? 'bg-palace-gold text-palace-bg font-semibold'
                : 'text-palace-text-muted hover:bg-palace-bg-light'
            }`}
          >
            {tab === 'overview' ? '总览' : tab === 'chart' ? '图表' : '排名'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="stat-card glow-pulse">
            <p className="stat-card-label">国库银两</p>
            <p className="stat-card-value text-palace-gold">
              {Math.floor(treasury.gold).toLocaleString()}
            </p>
            <p className="text-palace-text-muted text-xs">万两</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="stat-card">
              <p className="stat-card-label">粮仓</p>
              <p className="stat-card-value text-lg">{treasury.grain.toLocaleString()}</p>
              <p className="text-palace-text-muted text-xs">万石</p>
            </div>
            <div className="stat-card">
              <p className="stat-card-label">财政状况</p>
              <p className={`stat-card-value text-lg ${getHealthColor()}`}>
                {getHealthLabel()}
              </p>
            </div>
          </div>

          <div className="divider-decorated" />

          <div>
            <h3 className="text-sm text-palace-text-muted mb-2">最近流水</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto palace-scrollbar">
              {recentTransactions.slice(0, 10).map(tx => (
                <div key={tx.id} className="flex justify-between items-center text-sm p-2 bg-palace-bg-light/50 rounded">
                  <span className="text-palace-text-muted truncate flex-1">
                    {tx.description}
                  </span>
                  <span className={`font-medium ${tx.type === 'income' ? 'text-success' : 'text-danger'}`}>
                    {tx.type === 'income' ? '+' : '-'}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'chart' && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3D2A1E" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#9A9080', fontSize: 10 }}
                tickLine={{ stroke: '#3D2A1E' }}
              />
              <YAxis 
                tick={{ fill: '#9A9080', fontSize: 10 }}
                tickLine={{ stroke: '#3D2A1E' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="income" name="收入" fill="#6E9E6E" />
              <Bar dataKey="expense" name="支出" fill="#C0392B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'ranking' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm text-palace-text-muted mb-2">税收前五</h3>
            <div className="space-y-1">
              {topProvinces.map((p, i) => (
                <div key={p.id} className="flex justify-between items-center text-sm p-2 bg-palace-bg-light/50 rounded card-hover-glow">
                  <span>
                    <span className="text-palace-gold font-bold mr-2">{i + 1}</span>
                    {p.name}
                  </span>
                  <span className="text-success font-medium">{p.taxRevenue.toFixed(1)} 万两</span>
                </div>
              ))}
            </div>
          </div>

          <div className="divider-decorated" />

          <div>
            <h3 className="text-sm text-palace-text-muted mb-2">税收后五</h3>
            <div className="space-y-1">
              {bottomProvinces.map((p, i) => (
                <div key={p.id} className="flex justify-between items-center text-sm p-2 bg-palace-bg-light/50 rounded card-hover-glow">
                  <span>
                    <span className="text-danger font-bold mr-2">{i + 1}</span>
                    {p.name}
                  </span>
                  <span className="text-danger font-medium">{p.taxRevenue.toFixed(1)} 万两</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
