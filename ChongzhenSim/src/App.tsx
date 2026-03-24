import { useEffect, useState } from 'react';
import { useGameStore } from './store/gameStore';
import { useProvinceStore } from './store/provinceStore';
import { useFinanceStore } from './store/financeStore';
import { useThemeStore, initTheme } from './store/themeStore';
import { Layout, BottomBar, StatusBar } from './components/layout';
import { ProvincePanel } from './components/province';
import { FinancePanel } from './components/finance';
import { LogPanel } from './components/log';
import { EventPanel, ScenarioEventPanel } from './components/event';
import { GameMap } from './components/map';
import ProvinceInfoPanel from './components/map/ProvinceInfoPanel';
import { MinisterChatPanel } from './components/minister';
import { DecreePanel } from './components/decree';
import { PolicyTreePanel } from './components/panels';
import { initDatabase } from './db/database';
import provincesData from './data/provinces.json';
import charactersData from './data/characters.json';
import type { Province, Minister, MinisterDepartment, Region } from './core/types';

const STORAGE_VERSION = 'v2.0';

function App() {
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [showMinisterChat, setShowMinisterChat] = useState(false);
  const [showDecree, setShowDecree] = useState(false);
  const [showScenarioEvent, setShowScenarioEvent] = useState(true);
  const [dbReady, setDbReady] = useState(false);
  const [needsNewGame, setNeedsNewGame] = useState(false);
  
  const { 
    gameState, 
    isLoading, 
    loadingMessage, 
    error, 
    initGame, 
    endTurn,
    resetGame
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

  useEffect(() => {
    const initDb = async () => {
      try {
        await initDatabase();
        setDbReady(true);
      } catch (err) {
        console.error('[App] Database init failed:', err);
      }
    };
    initDb();
  }, []);

  useEffect(() => {
    if (gameState && dbReady && !isDataLoaded && !isLoading) {
      console.log('[App] Loading provinces and finance data, gameState:', !!gameState, 'dbReady:', dbReady);
      loadProvinces();
      loadFinanceData();
      setIsDataLoaded(true);
    }
  }, [gameState, dbReady, isDataLoaded, isLoading, loadProvinces, loadFinanceData]);

  useEffect(() => {
    if (gameState && !dbReady) {
      setNeedsNewGame(true);
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

  const handleEndTurn = async () => {
    await endTurn();
    loadProvinces();
    loadFinanceData();
  };

  const handleNewGame = () => {
    resetGame();
    setIsDataLoaded(false);
    setNeedsNewGame(true);
  };

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
        leftPanel={<ProvincePanel />}
        rightPanel={
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-hidden">
              <FinancePanel />
            </div>
            <div className="flex-1 overflow-hidden border-t border-palace-border">
              <LogPanel />
            </div>
          </div>
        }
        bottomBar={
          <BottomBar 
            onOpenMinisterChat={() => setShowMinisterChat(true)}
            onOpenDecree={() => setShowDecree(true)}
          />
        }
      >
        <div style={{ 
          display: 'flex', 
          height: 'calc(100vh - 144px)', 
          overflow: 'hidden', 
        }}>
          <ProvinceInfoPanel />
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <GameMap />
          </div>
        </div>
      </Layout>

      {showMinisterChat && (
        <MinisterChatPanel onClose={() => setShowMinisterChat(false)} />
      )}

      {showDecree && (
        <DecreePanel onClose={() => setShowDecree(false)} />
      )}

      <ScenarioEventPanel isVisible={showScenarioEvent} />


    </>
  );
}

export default App;
