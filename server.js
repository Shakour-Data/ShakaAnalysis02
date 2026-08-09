import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const ANALYSIS_DIR = path.join(__dirname, 'analysis');
const REPORTS_DIR = path.join(__dirname, 'reports');

for (const dir of [DATA_DIR, ANALYSIS_DIR, REPORTS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const DB_PATH = path.join(DATA_DIR, 'market_data.db');

function getDb() {
  return new sqlite3.Database(DB_PATH);
}

function dbAll(query, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.all(query, params, (err, rows) => {
      db.close();
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function dbGet(query, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.get(query, params, (err, row) => {
      db.close();
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbRun(query, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.run(query, params, function (err) {
      db.close();
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

async function initDb() {
  const db = getDb();
  
  await new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("PRAGMA journal_mode=WAL");
      
      db.run(`CREATE TABLE IF NOT EXISTS symbols (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT UNIQUE NOT NULL,
        name TEXT,
        type TEXT CHECK(type IN ('Stock', 'Index', 'Currency', 'Commodity', 'OTC', 'ETF')),
        exchange TEXT,
        industry TEXT,
        sector TEXT,
        webid TEXT,
        country TEXT DEFAULT 'IR',
        currency TEXT DEFAULT 'IRR',
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS price_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol_id INTEGER NOT NULL,
        date TEXT,
        weekday TEXT,
        open REAL,
        high REAL,
        low REAL,
        close REAL,
        final_price REAL,
        volume INTEGER,
        value REAL,
        adj_close REAL,
        adj_final REAL,
        sma_20 REAL,
        sma_50 REAL,
        rsi REAL,
        macd REAL,
        macd_signal REAL,
        macd_histogram REAL,
        bb_upper REAL,
        bb_lower REAL,
        adx REAL,
        cci REAL,
        mfi REAL,
        ma_100 REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (symbol_id) REFERENCES symbols (id) ON DELETE CASCADE
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS indices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol_id INTEGER NOT NULL,
        date TEXT,
        open REAL,
        high REAL,
        low REAL,
        close REAL,
        volume INTEGER,
        value REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS industry_indices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        industry TEXT NOT NULL,
        index_name TEXT NOT NULL,
        symbol TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS analysis_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        analysis TEXT,
        analysis_type TEXT DEFAULT 'technical',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        db.close();
        if (err) reject(err);
        else resolve();
      });
    });
  });

  const existingSymbols = await dbAll('SELECT COUNT(*) as count FROM symbols');
  if (existingSymbols[0].count === 0) {
    console.log('Seeding initial market data...');
    await seedData();
  }
}

async function seedData() {
  const initialSymbols = [
    { symbol: 'خودرو', name: 'ایران خودرو', type: 'Stock', exchange: 'TSE', industry: 'خودرو و ساخت قطعات', sector: 'خودرو', basePrice: 18000 },
    { symbol: 'فولاد', name: 'فولاد مبارکه اصفهان', type: 'Stock', exchange: 'TSE', industry: 'فلزات اساسی', sector: 'فلزات', basePrice: 25000 },
    { symbol: 'آ toi', name: 'آ toi مالی', type: 'Stock', exchange: 'TSE', industry: 'سرمایه‌گذاری', sector: 'مالی', basePrice: 10000 },
    { symbol: 'وبملت', name: 'بانک ملت', type: 'Stock', exchange: 'TSE', industry: 'بانک‌ها و موسسات اعتباری', sector: 'بانک', basePrice: 3200 },
    { symbol: 'شپنا', name: 'پالایش نفت اصفهان', type: 'Stock', exchange: 'TSE', industry: 'فرآورده‌های نفتی', sector: 'نفت', basePrice: 4500 },
    { symbol: 'فملي', name: 'ملی صنایع مس ایران', type: 'Stock', exchange: 'TSE', industry: 'فلزات اساسی', sector: 'فلزات', basePrice: 3800 },
    { symbol: 'خساپا', name: 'سایپا', type: 'Stock', exchange: 'TSE', industry: 'خودرو و ساخت قطعات', sector: 'خودرو', basePrice: 2400 },
    { symbol: 'شستا', name: 'سرمایه گذاری تامین اجتماعی', type: 'Stock', exchange: 'TSE', industry: 'سرمایه‌گذاری‌ها', sector: 'مالی', basePrice: 1200 },
    { symbol: 'شاخص کل', name: 'شاخص کل بورس تهران', type: 'Index', exchange: 'TSE', industry: 'شاخص‌های بورس', sector: 'شاخص', basePrice: 2100000 }
  ];

  for (const sym of initialSymbols) {
    const res = await dbRun(
      `INSERT INTO symbols (symbol, name, type, exchange, industry, sector) VALUES (?, ?, ?, ?, ?, ?)`,
      [sym.symbol, sym.name, sym.type, sym.exchange, sym.industry, sym.sector]
    );
    const symId = res.lastID;

    let price = sym.basePrice;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 180);

    const pricesHistory = [];

    for (let i = 0; i < 180; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      const pct = (Math.random() - 0.48) * 0.05;
      const open = Math.round(price);
      const close = Math.round(price * (1 + pct));
      const high = Math.round(Math.max(open, close) * (1 + Math.random() * 0.015));
      const low = Math.round(Math.min(open, close) * (1 - Math.random() * 0.015));
      const volume = Math.floor(1000000 + Math.random() * 10000000);
      const value = volume * close;

      price = close;
      pricesHistory.push(close);

      const sma20 = pricesHistory.length >= 20 ? Math.round(pricesHistory.slice(-20).reduce((a, b) => a + b, 0) / 20) : close;
      const sma50 = pricesHistory.length >= 50 ? Math.round(pricesHistory.slice(-50).reduce((a, b) => a + b, 0) / 50) : close;
      const ma100 = pricesHistory.length >= 100 ? Math.round(pricesHistory.slice(-100).reduce((a, b) => a + b, 0) / 100) : close;

      const rsi = Math.round((30 + Math.random() * 40) * 100) / 100;
      const macd = Math.round(((Math.random() - 0.5) * 10) * 100) / 100;
      const signal = Math.round((macd * 0.8) * 100) / 100;
      const histogram = Math.round((macd - signal) * 100) / 100;

      const bbUpper = Math.round(sma20 * 1.05);
      const bbLower = Math.round(sma20 * 0.95);

      await dbRun(
        `INSERT INTO price_data 
        (symbol_id, date, weekday, open, high, low, close, final_price, volume, value, adj_close, adj_final, sma_20, sma_50, rsi, macd, macd_signal, macd_histogram, bb_upper, bb_lower, ma_100)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [symId, dateStr, 'شنبه', open, high, low, close, close, volume, value, close, close, sma20, sma50, rsi, macd, signal, histogram, bbUpper, bbLower, ma100]
      );
    }
  }

  await dbRun(`INSERT INTO industry_indices (industry, index_name, symbol) VALUES (?, ?, ?)`, ['خودرو و ساخت قطعات', 'شاخص خودرو', 'شاخص خودرو']);
  await dbRun(`INSERT INTO industry_indices (industry, index_name, symbol) VALUES (?, ?, ?)`, ['فلزات اساسی', 'شاخص فلزات اساسی', 'شاخص فلزات']);

  console.log('Database seeded successfully.');
}

app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.get('/api/symbols', async (req, res) => {
  try {
    const rows = await dbAll('SELECT symbol FROM symbols WHERE is_active = 1 ORDER BY symbol');
    const symbols = rows.map(r => r.symbol);
    res.json(symbols);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/symbols/info', async (req, res) => {
  try {
    const rows = await dbAll('SELECT symbol, name, type, exchange, industry, sector FROM symbols WHERE is_active = 1 ORDER BY symbol');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function mapPriceRow(row) {
  return {
    Date: row.date || '',
    Open: row.open || 0,
    High: row.high || 0,
    Low: row.low || 0,
    Close: row.close || 0,
    Volume: row.volume || 0,
    FinalPrice: row.final_price || row.close || 0,
    Value: row.value || 0,
    SMA_20: row.sma_20,
    SMA_50: row.sma_50,
    RSI: row.rsi,
    MACD: row.macd,
    Signal: row.macd_signal,
    Histogram: row.macd_histogram,
    BB_Upper: row.bb_upper,
    BB_Lower: row.bb_lower,
    ADX: row.adx,
    CCI: row.cci,
    MFI: row.mfi,
    MA_100: row.ma_100
  };
}

app.get('/api/data/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const symRow = await dbGet('SELECT id FROM symbols WHERE symbol = ? AND is_active = 1', [symbol]);
    if (!symRow) {
      return res.status(404).json({ error: `Symbol ${symbol} not found` });
    }

    const rows = await dbAll(
      `SELECT date, open, high, low, close, volume, final_price, value,
              sma_20, sma_50, rsi, macd, macd_signal, macd_histogram,
              bb_upper, bb_lower, adx, cci, mfi, ma_100
       FROM price_data WHERE symbol_id = ? ORDER BY date ASC`,
      [symRow.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: `No data found for symbol ${symbol}` });
    }

    res.json(rows.map(mapPriceRow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/price/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const symRow = await dbGet('SELECT id FROM symbols WHERE symbol = ? AND is_active = 1', [symbol]);
    if (!symRow) return res.status(404).json({ error: 'Symbol not found' });

    const rows = await dbAll(
      `SELECT p.date, p.open, p.high, p.low, p.close, p.final_price, p.volume, p.value
       FROM price_data p WHERE p.symbol_id = ? ORDER BY p.date DESC LIMIT 100`,
      [symRow.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/indicators/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const symRow = await dbGet('SELECT id FROM symbols WHERE symbol = ? AND is_active = 1', [symbol]);
    if (!symRow) return res.status(404).json({ error: `Symbol ${symbol} not found` });

    const rows = await dbAll(
      `SELECT date, open, high, low, close, volume, final_price, value,
              sma_20, sma_50, rsi, macd, macd_signal, macd_histogram,
              bb_upper, bb_lower, adx, cci, mfi, ma_100
       FROM price_data WHERE symbol_id = ? ORDER BY date DESC LIMIT 1000`,
      [symRow.id]
    );
    res.json(rows.map(mapPriceRow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/price-data/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const symRow = await dbGet('SELECT id FROM symbols WHERE symbol = ? AND is_active = 1', [symbol]);
    if (!symRow) return res.status(404).json({ error: `Symbol ${symbol} not found` });

    const rows = await dbAll(
      `SELECT p.date, p.open, p.high, p.low, p.close, p.final_price, p.volume, p.value,
              p.sma_20, p.sma_50, p.rsi, p.macd, p.bb_upper, p.bb_lower
       FROM price_data p WHERE p.symbol_id = ? ORDER BY p.date DESC LIMIT 365`,
      [symRow.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/indices', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM indices');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/industry-indices', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM industry_indices');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/fetch/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    let symRow = await dbGet('SELECT id FROM symbols WHERE symbol = ?', [symbol]);
    if (!symRow) {
      const ins = await dbRun(
        'INSERT INTO symbols (symbol, name, type, exchange, industry) VALUES (?, ?, ?, ?, ?)',
        [symbol, symbol, 'Stock', 'TSE', 'General']
      );
      symRow = { id: ins.lastID };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const lastRec = await dbGet(
      'SELECT close FROM price_data WHERE symbol_id = ? ORDER BY date DESC LIMIT 1',
      [symRow.id]
    );
    const lastPrice = lastRec ? lastRec.close : 10000;
    const newPrice = Math.round(lastPrice * (1 + (Math.random() - 0.48) * 0.04));

    await dbRun(
      `INSERT OR REPLACE INTO price_data
       (symbol_id, date, weekday, open, high, low, close, final_price, volume, value, sma_20, sma_50, rsi, macd, macd_signal, macd_histogram, bb_upper, bb_lower, ma_100)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        symRow.id, todayStr, 'امروز',
        lastPrice, Math.round(newPrice * 1.01), Math.round(newPrice * 0.99), newPrice, newPrice,
        5000000, newPrice * 5000000,
        Math.round(newPrice * 0.99), Math.round(newPrice * 0.98),
        55.2, 2.1, 1.8, 0.3,
        Math.round(newPrice * 1.04), Math.round(newPrice * 0.96), Math.round(newPrice * 0.97)
      ]
    );

    const countRow = await dbGet('SELECT COUNT(*) as cnt FROM price_data WHERE symbol_id = ?', [symRow.id]);

    res.json({
      success: true,
      symbol,
      records: countRow.cnt,
      message: `Data for ${symbol} updated successfully`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/analysis/save', async (req, res) => {
  try {
    const { symbol, analysis } = req.body || {};
    if (!analysis || !analysis.trim()) {
      return res.status(400).json({ error: 'Analysis text is empty' });
    }
    const sym = symbol || 'unknown';

    await dbRun(
      'INSERT INTO analysis_records (symbol, analysis) VALUES (?, ?)',
      [sym, analysis]
    );

    const filename = `${sym}_analysis_${Date.now()}.txt`;
    const filepath = path.join(ANALYSIS_DIR, filename);
    fs.writeFileSync(filepath, `Symbol: ${sym}\nTimestamp: ${new Date().toISOString()}\n===================================\n${analysis}`, 'utf-8');

    res.json({
      success: true,
      filename,
      message: 'Analysis saved successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analysis/list/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const rows = await dbAll(
      'SELECT id, symbol, analysis, created_at FROM analysis_records WHERE symbol = ? ORDER BY created_at DESC LIMIT 50',
      [symbol]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/download/:symbol/:filetype', async (req, res) => {
  try {
    const { symbol, filetype } = req.params;
    const symRow = await dbGet('SELECT id FROM symbols WHERE symbol = ?', [symbol]);
    if (!symRow) return res.status(404).json({ error: 'Symbol not found' });

    const rows = await dbAll(
      `SELECT date, open, high, low, close, volume, final_price, value,
              sma_20, sma_50, rsi, macd, macd_signal, macd_histogram,
              bb_upper, bb_lower, adx, cci, mfi, ma_100
       FROM price_data WHERE symbol_id = ? ORDER BY date ASC`,
      [symRow.id]
    );

    if (!rows || rows.length === 0) return res.status(404).json({ error: 'No data to download' });

    let headers = [];
    if (filetype === 'price') {
      headers = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume'];
    } else if (filetype === 'indicators') {
      headers = ['Date', 'SMA_20', 'SMA_50', 'RSI', 'MACD', 'BB_Upper', 'BB_Lower'];
    } else {
      headers = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume', 'FinalPrice', 'SMA_20', 'SMA_50', 'RSI', 'MACD', 'BB_Upper', 'BB_Lower'];
    }

    const csvLines = [headers.join(',')];
    for (const r of rows) {
      const mapped = mapPriceRow(r);
      const rowVals = headers.map(h => mapped[h] !== undefined ? mapped[h] : '');
      csvLines.push(rowVals.join(','));
    }

    const csvContent = csvLines.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(symbol)}_${filetype}_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/js', express.static(path.join(__dirname, 'frontend/static/js')));
app.use('/static', express.static(path.join(__dirname, 'frontend/static')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Shaka Analysis server running on http://0.0.0.0:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Shaka Analysis server running on http://0.0.0.0:${PORT} (without DB init)`);
  });
});
