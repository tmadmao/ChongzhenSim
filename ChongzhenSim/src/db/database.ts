import type { Province, TreasuryTransaction, GameSnapshot, MinisterLog } from '../core/types';

type SqlJsDatabase = {
  run: (sql: string, params?: unknown[]) => void;
  exec: (sql: string, params?: unknown[]) => { columns: string[]; values: unknown[][] }[];
  export: () => Uint8Array;
  close: () => void;
};

type SqlJsModule = {
  Database: new (data?: Uint8Array) => SqlJsDatabase;
};

let db: SqlJsDatabase | null = null;
let sqlJsLoaded = false;
let initPromise: Promise<void> | null = null;

const DB_STORAGE_KEY = 'chongzhensim_v2_db';

declare global {
  interface Window {
    initSqlJs: (config?: { locateFile?: (file: string) => string }) => Promise<SqlJsModule>;
  }
}

export async function initDatabase(): Promise<void> {
  if (db) {
    return;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    if (!sqlJsLoaded && !window.initSqlJs) {
      const script = document.createElement('script');
      script.src = '/sql-wasm.js';
      
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load sql.js'));
        document.head.appendChild(script);
      });
      sqlJsLoaded = true;
    }

    if (!window.initSqlJs) {
      throw new Error('sql.js not loaded properly');
    }

    const SQL: SqlJsModule = await window.initSqlJs({
      locateFile: (file: string) => `/${file}`
    });

    const savedData = localStorage.getItem(DB_STORAGE_KEY);
    if (savedData) {
      try {
        const binaryArray = new Uint8Array(JSON.parse(savedData));
        db = new SQL.Database(binaryArray);
        createTables(db);
        console.log('[Database] Loaded from localStorage, provinces count:', 
          db.exec('SELECT COUNT(*) FROM provinces')[0]?.values[0]?.[0]);
        return;
      } catch (error) {
        console.warn('[Database] Failed to load saved data, starting fresh:', error);
      }
    }

    db = new SQL.Database();
    createTables(db);
    console.log('[Database] Created new database');
  })();

  return initPromise;
}

function createTables(database: SqlJsDatabase): void {
  database.run(`
    CREATE TABLE IF NOT EXISTS provinces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      population INTEGER NOT NULL,
      tax_rate REAL NOT NULL,
      tax_revenue REAL NOT NULL DEFAULT 0,
      granary_stock INTEGER NOT NULL DEFAULT 0,
      civil_unrest INTEGER NOT NULL DEFAULT 0,
      military_force INTEGER NOT NULL DEFAULT 0,
      disaster_level INTEGER NOT NULL DEFAULT 0,
      corruption_level INTEGER NOT NULL DEFAULT 0,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      region TEXT NOT NULL
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS treasury_transactions (
      id TEXT PRIMARY KEY,
      turn INTEGER NOT NULL,
      game_date TEXT NOT NULL,
      type TEXT NOT NULL,
      asset_type TEXT NOT NULL DEFAULT 'gold',
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      province_id TEXT,
      description TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  // 兼容旧数据库：如果表已存在但缺少 asset_type 列，则添加默认列
  try {
    database.run(`ALTER TABLE treasury_transactions ADD COLUMN asset_type TEXT NOT NULL DEFAULT 'gold'`);
  } catch {
    // 如果列已存在或者 ALTER TABLE 不适用，则忽略错误
  }

  database.run(`
    CREATE TABLE IF NOT EXISTS game_snapshots (
      id TEXT PRIMARY KEY,
      turn INTEGER NOT NULL,
      snapshot_json TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS minister_logs (
      id TEXT PRIMARY KEY,
      turn INTEGER NOT NULL,
      minister_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      description TEXT NOT NULL,
      effects_json TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  database.run(`CREATE INDEX IF NOT EXISTS idx_transactions_turn ON treasury_transactions(turn)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_snapshots_turn ON game_snapshots(turn)`);
}

function getDB(): SqlJsDatabase {
  if (!db) {
    throw new Error('[Database] Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function saveToLocalStorage(): void {
  if (!db) return;
  const data = db.export();
  const array = Array.from(data);
  localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(array));
}

export function clearDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
  localStorage.removeItem(DB_STORAGE_KEY);
  initPromise = null;
}

export function insertProvince(province: Province): void {
  getDB().run(
    `INSERT OR REPLACE INTO provinces 
     (id, name, population, tax_rate, tax_revenue, granary_stock, 
      civil_unrest, military_force, disaster_level, corruption_level, lat, lng, region)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [province.id, province.name, province.population, province.taxRate, province.taxRevenue,
     province.granaryStock, province.civilUnrest, province.militaryForce,
     province.disasterLevel, province.corruptionLevel, province.coordinates.lat, province.coordinates.lng, province.region]
  );
}

export function insertProvinces(provinces: Province[]): void {
  const database = getDB();
  console.log('[Database] insertProvinces called with', provinces.length, 'provinces');
  database.run('BEGIN TRANSACTION');
  try {
    provinces.forEach(province => insertProvince(province));
    database.run('COMMIT');
    console.log('[Database] insertProvinces committed successfully');
    const count = database.exec('SELECT COUNT(*) FROM provinces')[0]?.values[0]?.[0];
    console.log('[Database] Total provinces in DB:', count);
    saveToLocalStorage();
  } catch (error) {
    database.run('ROLLBACK');
    console.error('[Database] insertProvinces failed:', error);
    throw error;
  }
}

export function getAllProvinces(): Province[] {
  try {
    const results = getDB().exec('SELECT * FROM provinces ORDER BY name');
    console.log('[Database] getAllProvinces query result:', results.length > 0 ? results[0].values.length : 0, 'rows');
    if (results.length === 0) return [];
    return results[0].values.map(row => ({
      id: row[0] as string,
      name: row[1] as string,
      population: row[2] as number,
      taxRate: row[3] as number,
      taxRevenue: row[4] as number,
      granaryStock: row[5] as number,
      civilUnrest: row[6] as number,
      militaryForce: row[7] as number,
      disasterLevel: row[8] as number,
      corruptionLevel: row[9] as number,
      coordinates: { lat: row[10] as number, lng: row[11] as number },
      region: row[12] as 'north' | 'south' | 'east' | 'west' | 'central' | 'border'
    }));
  } catch (error) {
    console.error('[Database] getAllProvinces failed:', error);
    return [];
  }
}

export function getProvinceById(id: string): Province | null {
  try {
    const results = getDB().exec('SELECT * FROM provinces WHERE id = ?', [id]);
    if (results.length === 0 || results[0].values.length === 0) return null;
    const row = results[0].values[0];
    return {
      id: row[0] as string,
      name: row[1] as string,
      population: row[2] as number,
      taxRate: row[3] as number,
      taxRevenue: row[4] as number,
      granaryStock: row[5] as number,
      civilUnrest: row[6] as number,
      militaryForce: row[7] as number,
      disasterLevel: row[8] as number,
      corruptionLevel: row[9] as number,
      coordinates: { lat: row[10] as number, lng: row[11] as number },
      region: row[12] as 'north' | 'south' | 'east' | 'west' | 'central' | 'border'
    };
  } catch (error) {
    console.error('[Database] getProvinceById failed:', error);
    return null;
  }
}

export function updateProvince(id: string, fields: Partial<Province>): boolean {
  try {
    const updates: string[] = [];
    const values: unknown[] = [];
    
    const fieldMapping: Record<string, string> = {
      population: 'population',
      taxRate: 'tax_rate',
      taxRevenue: 'tax_revenue',
      granaryStock: 'granary_stock',
      civilUnrest: 'civil_unrest',
      militaryForce: 'military_force',
      disasterLevel: 'disaster_level',
      corruptionLevel: 'corruption_level'
    };
    
    Object.entries(fields).forEach(([key, value]) => {
      const dbField = fieldMapping[key];
      if (dbField && typeof value === 'number') {
        updates.push(`${dbField} = ?`);
        values.push(value);
      }
    });
    
    if (updates.length === 0) return false;
    values.push(id);
    getDB().run(`UPDATE provinces SET ${updates.join(', ')} WHERE id = ?`, values);
    return true;
  } catch (error) {
    console.error('[Database] updateProvince failed:', error);
    return false;
  }
}

export function getTopTaxProvinces(limit: number): Province[] {
  try {
    const results = getDB().exec('SELECT * FROM provinces ORDER BY tax_revenue DESC LIMIT ?', [limit]);
    if (results.length === 0) return [];
    return results[0].values.map(row => ({
      id: row[0] as string,
      name: row[1] as string,
      population: row[2] as number,
      taxRate: row[3] as number,
      taxRevenue: row[4] as number,
      granaryStock: row[5] as number,
      civilUnrest: row[6] as number,
      militaryForce: row[7] as number,
      disasterLevel: row[8] as number,
      corruptionLevel: row[9] as number,
      coordinates: { lat: row[10] as number, lng: row[11] as number },
      region: row[12] as 'north' | 'south' | 'east' | 'west' | 'central' | 'border'
    }));
  } catch (error) {
    console.error('[Database] getTopTaxProvinces failed:', error);
    return [];
  }
}

export function getAlertProvinces(): Province[] {
  try {
    const results = getDB().exec(
      'SELECT * FROM provinces WHERE civil_unrest > 70 OR disaster_level >= 3 ORDER BY civil_unrest DESC, disaster_level DESC'
    );
    if (results.length === 0) return [];
    return results[0].values.map(row => ({
      id: row[0] as string,
      name: row[1] as string,
      population: row[2] as number,
      taxRate: row[3] as number,
      taxRevenue: row[4] as number,
      granaryStock: row[5] as number,
      civilUnrest: row[6] as number,
      militaryForce: row[7] as number,
      disasterLevel: row[8] as number,
      corruptionLevel: row[9] as number,
      coordinates: { lat: row[10] as number, lng: row[11] as number },
      region: row[12] as 'north' | 'south' | 'east' | 'west' | 'central' | 'border'
    }));
  } catch (error) {
    console.error('[Database] getAlertProvinces failed:', error);
    return [];
  }
}

export function insertTransaction(transaction: TreasuryTransaction): void {
  getDB().run(
    `INSERT INTO treasury_transactions 
     (id, turn, game_date, type, asset_type, category, amount, province_id, description, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [transaction.id, transaction.turn, transaction.date, transaction.type,
     transaction.assetType || 'gold', transaction.category, transaction.amount,
     transaction.provinceId || null, transaction.description, transaction.createdAt]
  );
}

export function getTransactionsByTurn(turn: number): TreasuryTransaction[] {
  try {
    const results = getDB().exec(
      'SELECT * FROM treasury_transactions WHERE turn = ? ORDER BY created_at',
      [turn]
    );
    if (results.length === 0) return [];
    return results[0].values.map(row => ({
      id: row[0] as string,
      turn: row[1] as number,
      date: row[2] as string,
      type: row[3] as 'income' | 'expense',
      assetType: row[4] as 'gold' | 'grain',
      category: row[5] as string,
      amount: row[6] as number,
      provinceId: row[7] as string | undefined,
      description: row[8] as string,
      createdAt: row[9] as number
    }));
  } catch (error) {
    console.error('[Database] getTransactionsByTurn failed:', error);
    return [];
  }
}

export function getRecentTransactions(limit: number): TreasuryTransaction[] {
  try {
    const results = getDB().exec(
      'SELECT * FROM treasury_transactions ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    if (results.length === 0) return [];
    return results[0].values.map(row => ({
      id: row[0] as string,
      turn: row[1] as number,
      date: row[2] as string,
      type: row[3] as 'income' | 'expense',
      assetType: row[4] as 'gold' | 'grain',
      category: row[5] as string,
      amount: row[6] as number,
      provinceId: row[7] as string | undefined,
      description: row[8] as string,
      createdAt: row[9] as number
    }));
  } catch (error) {
    console.error('[Database] getRecentTransactions failed:', error);
    return [];
  }
}

export function getTotalGold(): number {
  try {
    const incomeResult = getDB().exec("SELECT SUM(amount) FROM treasury_transactions WHERE type = 'income' AND asset_type = 'gold'");
    const expenseResult = getDB().exec("SELECT SUM(amount) FROM treasury_transactions WHERE type = 'expense' AND asset_type = 'gold'");
    const income = (incomeResult[0]?.values[0]?.[0] as number) || 0;
    const expense = (expenseResult[0]?.values[0]?.[0] as number) || 0;
    return income - expense;
  } catch (error) {
    console.error('[Database] getTotalGold failed:', error);
    return 0;
  }
}

export function getTotalGrain(): number {
  try {
    const incomeResult = getDB().exec("SELECT SUM(amount) FROM treasury_transactions WHERE type = 'income' AND asset_type = 'grain'");
    const expenseResult = getDB().exec("SELECT SUM(amount) FROM treasury_transactions WHERE type = 'expense' AND asset_type = 'grain'");
    const income = (incomeResult[0]?.values[0]?.[0] as number) || 0;
    const expense = (expenseResult[0]?.values[0]?.[0] as number) || 0;
    return income - expense;
  } catch (error) {
    console.error('[Database] getTotalGrain failed:', error);
    return 0;
  }
}

export function getTreasuryHistory(turns: number): { turn: number; date: string; income: number; expense: number; balance: number }[] {
  try {
    const results = getDB().exec(
      `SELECT turn, game_date, 
              SUM(CASE WHEN type = 'income' AND asset_type = 'gold' THEN amount ELSE 0 END) as income,
              SUM(CASE WHEN type = 'expense' AND asset_type = 'gold' THEN amount ELSE 0 END) as expense
       FROM treasury_transactions 
       GROUP BY turn 
       ORDER BY turn DESC 
       LIMIT ?`,
      [turns]
    );
    
    if (results.length === 0) return [];
    
    const data = results[0].values.map(row => ({
      turn: row[0] as number,
      date: row[1] as string,
      income: row[2] as number,
      expense: row[3] as number,
      balance: 0
    }));
    
    data.reverse();
    
    let runningBalance = 0;
    return data.map(d => {
      runningBalance += d.income - d.expense;
      return { ...d, balance: runningBalance };
    });
  } catch (error) {
    console.error('[Database] getTreasuryHistory failed:', error);
    return [];
  }
}

export function getIncomeExpenseSummary(turn: number): { totalIncome: number; totalExpense: number; balance: number; byCategory: Record<string, number> } {
  const transactions = getTransactionsByTurn(turn);
  const summary = {
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    byCategory: {} as Record<string, number>
  };
  
  transactions.forEach(t => {
    if (t.assetType && t.assetType !== 'gold') {
      return;
    }

    if (t.type === 'income') {
      summary.totalIncome += t.amount;
    } else {
      summary.totalExpense += t.amount;
    }
    
    if (!summary.byCategory[t.category]) {
      summary.byCategory[t.category] = 0;
    }
    summary.byCategory[t.category] += t.amount;
  });
  
  summary.balance = summary.totalIncome - summary.totalExpense;
  return summary;
}

export function insertGameSnapshot(snapshot: GameSnapshot): void {
  getDB().run(
    `INSERT INTO game_snapshots (id, turn, snapshot_json, created_at) VALUES (?, ?, ?, ?)`,
    [snapshot.id, snapshot.turn, snapshot.snapshotJson, snapshot.createdAt]
  );
}

export function insertMinisterLog(log: MinisterLog): void {
  getDB().run(
    `INSERT INTO minister_logs (id, turn, minister_id, action_type, description, effects_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [log.id, log.turn, log.ministerId, log.actionType, log.description, log.effectsJson, log.createdAt]
  );
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// 統一架構：獲取最新狀態接口
// ============================================

export interface LatestState {
  provinces: Province[];
  treasury: {
    gold: number;
    grain: number;
  };
  transactions: TreasuryTransaction[];
}

/**
 * 獲取數據庫中的最新狀態
 * 這是統一架構的核心方法，用於從數據庫同步到 Zustand Store
 */
export function getLatestState(): LatestState {
  try {
    const provinces = getAllProvinces();
    const gold = getTotalGold();
    const grain = getTotalGrain();
    const transactions = getRecentTransactions(50);
    
    return {
      provinces,
      treasury: {
        gold,
        grain
      },
      transactions
    };
  } catch (error) {
    console.error('[Database] getLatestState failed:', error);
    return {
      provinces: [],
      treasury: {
        gold: 0,
        grain: 0
      },
      transactions: []
    };
  }
}
