import { useEffect, useState, lazy, Suspense } from 'react';
import { useGameStore } from './store/gameStore';
import { useProvinceStore } from './store/provinceStore';
import { useFinanceStore } from './store/financeStore';
import { useThemeStore, initTheme } from './store/themeStore';
import { Layout, BottomBar, StatusBar } from './components/layout';

// 懒加载组件
const ProvincePanel = lazy(() => import('./components/province').then(module => ({ default: module.ProvincePanel })));
const FinancePanel = lazy(() => import('./components/finance').then(module => ({ default: module.FinancePanel })));
const LogPanel = lazy(() => import('./components/log').then(module => ({ default: module.LogPanel })));
const ScenarioEventPanel = lazy(() => import('./components/event').then(module => ({ default: module.ScenarioEventPanel })));
const GameMap = lazy(() => import('./components/map').then(module => ({ default: module.GameMap })));
const ProvinceInfoPanel = lazy(() => import('./components/map/ProvinceInfoPanel'));
const MinisterChatPanel = lazy(() => import('./components/minister').then(module => ({ default: module.MinisterChatPanel })));
const DecreePanel = lazy(() => import('./components/decree').then(module => ({ default: module.DecreePanel })));
const SettingsPanel = lazy(() => import('./components/settings/SettingsPanel'));

// Loading 组件
const Loading = () => (
  <div className="flex items-center justify-center h-full text-palace-text-muted">
    <div className="animate-spin w-8 h-8 border-2 border-palace-gold border-t-transparent rounded-full mr-2"></div>
    <span>加载中...</span>
  </div>
);

import { initDatabase, getLatestState } from './db/database';
import provincesData from './data/provinces.json';
import charactersData from './data/characters.json';
import type { Province, Minister, MinisterDepartment, Region } from './core/types';

const STORAGE_VERSION = 'v2.0';

// LoadingScreen 組件
const LoadingScreen = ({ message }: { message: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-palace-bg">
    <div className="palace-panel p-8 text-center">
      <div className="animate-spin w-12 h-12 border-4 border-palace-gold border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-palace-text-muted">{message}</p>
    </div>
  </div>
);

function App() {
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [showMinisterChat, setShowMinisterChat] = useState(false);
  const [showDecree, setShowDecree] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showScenarioEvent] = useState(true);
  const [dbReady, setDbReady] = useState(false);
  const [needsNewGame, setNeedsNewGame] = useState(false);
  const [financePanelCollapsed, setFinancePanelCollapsed] = useState(false);
  const [logPanelCollapsed, setLogPanelCollapsed] = useState(false);
  // 統一架構：初始化狀態
  const [isInitialized, setIsInitialized] = useState(false);
  const [initMessage, setInitMessage] = useState('正在初始化...');
  
  const { 
    gameState, 
    isLoading, 
    loadingMessage, 
    error, 
    initGame, 

  } = useGameStore();
  
  const { loadProvinces } = useProvinceStore();
  const { loadFinanceData } = useFinanceStore();
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
    
    const storedVersion = localStorage.getItem('chongzhen_version');
    if (storedVersion !== STORAGE_VERSION) {
      console.log('[App] Version mismatch, clearing old data');
      localStorage.removeItem('game-storage');
      localStorage.removeItem('province-storage');
      localStorage.removeItem('finance-storage');
      localStorage.setItem('chongzhen_version', STORAGE_VERSION);
    }
  }, []);

  // 統一架構：預加載順序 - Init SQL.js -> Load Initial Script -> Sync to Zustand -> Render UI
  useEffect(() => {
    const initApp = async () => {
      try {
        // Step 1: Init SQL.js
        setInitMessage('正在加載數據庫...');
        await initDatabase();
        setDbReady(true);
        console.log('[App] Database initialized');

        // Step 2: 檢查是否需要加載初始數據
        setInitMessage('正在檢查遊戲數據...');
        const latestState = getLatestState();
        console.log('[App] Latest state loaded:', {
          provincesCount: latestState.provinces.length,
          treasuryGold: latestState.treasury.gold
        });

        // Step 3: Sync to Zustand（如果已有數據）
        if (latestState.provinces.length > 0) {
          setInitMessage('正在同步遊戲數據...');
          loadProvinces();
          loadFinanceData();
          setIsDataLoaded(true);
          console.log('[App] Data synced to stores');
        }

        // Step 4: 標記初始化完成
        setIsInitialized(true);
        console.log('[App] Initialization complete');
      } catch (err) {
        console.error('[App] Initialization failed:', err);
        setInitMessage('初始化失敗，請刷新頁面重試');
      }
    };
    initApp();
  }, [loadProvinces, loadFinanceData]);

  useEffect(() => {
    if (gameState && dbReady && !isDataLoaded && !isLoading) {
      console.log('[App] Loading provinces and finance data, gameState:', !!gameState, 'dbReady:', dbReady);
      loadProvinces();
      loadFinanceData();
      // 延迟设置数据加载完成，避免级联渲染
      setTimeout(() => setIsDataLoaded(true), 0);
    }
  }, [gameState, dbReady, isDataLoaded, isLoading, loadProvinces, loadFinanceData]);

  useEffect(() => {
    if (gameState && !dbReady) {
      // 延迟设置，避免级联渲染
      setTimeout(() => setNeedsNewGame(true), 0);
    }
  }, [gameState, dbReady]);

  const handleStartGame = async () => {
    if (!dbReady) {
      await initDatabase();
      setDbReady(true);
    }
    
    const typedProvinces: Province[] = provincesData.provinces.map(p => ({
      ...p,
      region: p.region as Region,
      taxRevenue: p.population * p.taxRate * 0.1
    }));
    
    const typedMinisters: Minister[] = charactersData.ministers.map(m => ({
      ...m,
      department: m.department as MinisterDepartment,
      positions: m.positions.map(pos => ({
        ...pos,
        department: pos.department as MinisterDepartment
      }))
    }));
    
    await initGame(typedProvinces, typedMinisters, { gold: 800, grain: 500 });
    setNeedsNewGame(false);
    setIsDataLoaded(false);
  };



  // 統一架構：Loading 門戶 - 只有當 SQL.js 初始化完成後才渲染遊戲主體
  if (!isInitialized) {
    return <LoadingScreen message={initMessage} />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-palace-bg">
        <div className="palace-panel p-8 text-center max-w-md">
          <h1 className="palace-title text-2xl mb-4 text-danger">错误</h1>
          <p className="text-palace-text-muted mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="palace-button-gold">
            重新加载
          </button>
        </div>
      </div>
    );
  }

  if (isLoading && !gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-palace-bg">
        <div className="palace-panel p-8 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-palace-gold border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-palace-text-muted">{loadingMessage || '加载中...'}</p>
        </div>
      </div>
    );
  }

  if (!gameState || needsNewGame) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-palace-bg">
        <div className="palace-panel p-12 text-center max-w-lg">
          <h1 className="palace-title text-4xl mb-2">崇祯皇帝模拟器</h1>
          <p className="palace-subtitle mb-8">Chongzhen Emperor Simulator</p>
          
          <div className="palace-divider mb-6"></div>
          
          <p className="text-palace-text mb-8 leading-relaxed">
            大明崇祯元年，天下初定。然内有流寇四起，外有后金虎视眈眈。
            你能否力挽狂澜，拯救这摇摇欲坠的大明江山？
          </p>
          
          <button onClick={handleStartGame} className="palace-button-gold text-lg px-8 py-3">
            开始新游戏
          </button>
          
          <div className="mt-6 flex justify-center gap-4">
            <button 
              onClick={toggleTheme}
              className="palace-button-outline text-sm px-4 py-2"
            >
              {theme === 'dark' ? '☀️ 白色简约' : '🌙 华贵暗金'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Layout
        statusBar={<StatusBar />}
        leftPanel={
          <Suspense fallback={<Loading />}>
            <ProvincePanel />
          </Suspense>
        }
        rightPanel={
          <div className="h-full flex flex-col">
            <div className={`overflow-hidden transition-all duration-300 ${
              financePanelCollapsed ? 'h-8' : logPanelCollapsed ? 'flex-1' : 'flex-1'
            }`}>
              <Suspense fallback={<Loading />}>
                <FinancePanel 
                  isCollapsed={financePanelCollapsed}
                  onToggle={() => {
                    setFinancePanelCollapsed(!financePanelCollapsed);
                    if (!financePanelCollapsed && logPanelCollapsed) {
                      setLogPanelCollapsed(false);
                    }
                  }}
                />
              </Suspense>
            </div>
            {!financePanelCollapsed && !logPanelCollapsed && (
              <div className="border-t border-palace-border"></div>
            )}
            <div className={`overflow-hidden transition-all duration-300 ${
              logPanelCollapsed ? 'h-8' : financePanelCollapsed ? 'flex-1' : 'flex-1'
            }`}>
              <Suspense fallback={<Loading />}>
                <LogPanel 
                  isCollapsed={logPanelCollapsed}
                  onToggle={() => {
                    setLogPanelCollapsed(!logPanelCollapsed);
                    if (!logPanelCollapsed && financePanelCollapsed) {
                      setFinancePanelCollapsed(false);
                    }
                  }}
                />
              </Suspense>
            </div>
          </div>
        }
        bottomBar={
          <BottomBar 
            onOpenMinisterChat={() => setShowMinisterChat(true)}
            onOpenDecree={() => setShowDecree(true)}
            onOpenSettings={() => setShowSettings(true)}
          />
        }
      >
        <div style={{ 
          display: 'flex', 
          height: 'calc(100vh - 144px)', 
          overflow: 'hidden', 
        }}>
          <Suspense fallback={<Loading />}>
            <ProvinceInfoPanel />
          </Suspense>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <Suspense fallback={<Loading />}>
              <GameMap />
            </Suspense>
          </div>
        </div>
      </Layout>

      {showMinisterChat && (
        <Suspense fallback={<Loading />}>
          <MinisterChatPanel onClose={() => setShowMinisterChat(false)} />
        </Suspense>
      )}

      {showDecree && (
        <Suspense fallback={<Loading />}>
          <DecreePanel onClose={() => setShowDecree(false)} />
        </Suspense>
      )}

      <Suspense fallback={<Loading />}>
        <ScenarioEventPanel isVisible={showScenarioEvent} />
      </Suspense>

      {showSettings && (
        <Suspense fallback={<Loading />}>
          <SettingsPanel onClose={() => setShowSettings(false)} />
        </Suspense>
      )}

    </>
  );
}

export default App;
