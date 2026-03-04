import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("despiertakids.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS children (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    stars INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    avatar_id TEXT DEFAULT 'dragon',
    avatar_stage INTEGER DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    last_wake_up TEXT,
    vacation_mode INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id INTEGER,
    wake_up_time TEXT DEFAULT '07:30',
    difficulty TEXT DEFAULT 'normal',
    FOREIGN KEY(child_id) REFERENCES children(id)
  );

  CREATE TABLE IF NOT EXISTS world_objects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id INTEGER,
    type TEXT, -- 'house', 'tree', 'decoration'
    name TEXT,
    x INTEGER,
    y INTEGER,
    FOREIGN KEY(child_id) REFERENCES children(id)
  );

  CREATE TABLE IF NOT EXISTS collectibles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id INTEGER,
    type TEXT,
    name TEXT,
    stage INTEGER DEFAULT 1,
    unlocked_at TEXT,
    FOREIGN KEY(child_id) REFERENCES children(id)
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id INTEGER,
    title TEXT,
    icon TEXT,
    unlocked_at TEXT,
    FOREIGN KEY(child_id) REFERENCES children(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id INTEGER,
    message TEXT,
    type TEXT, -- 'wake_up', 'achievement', 'streak'
    created_at TEXT,
    is_read INTEGER DEFAULT 0,
    FOREIGN KEY(child_id) REFERENCES children(id)
  );

  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id INTEGER,
    date TEXT,
    success INTEGER,
    score INTEGER,
    FOREIGN KEY(child_id) REFERENCES children(id)
  );

  CREATE TABLE IF NOT EXISTS custom_rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id INTEGER,
    label TEXT,
    cost INTEGER,
    FOREIGN KEY(child_id) REFERENCES children(id)
  );
`);

// Seed initial data if empty
const childCount = db.prepare("SELECT count(*) as count FROM children").get() as { count: number };
if (childCount.count === 0) {
  const insertChild = db.prepare("INSERT INTO children (name, stars, coins, level, xp) VALUES (?, ?, ?, ?, ?)");
  const result = insertChild.run("Leo", 10, 50, 1, 0);
  const childId = result.lastInsertRowid;
  
  db.prepare("INSERT INTO settings (child_id, wake_up_time) VALUES (?, ?)").run(childId, "07:30");
  
  db.prepare("INSERT INTO world_objects (child_id, type, name, x, y) VALUES (?, ?, ?, ?, ?)").run(childId, 'tree', 'Árbol Mágico', 20, 30);
  
  db.prepare("INSERT INTO collectibles (child_id, type, name, stage) VALUES (?, ?, ?, ?)").run(childId, 'pet', 'Dragoncito', 1);

  // Initial rewards
  const rewards = [
    { label: '30 min extra de pantalla', cost: 50 },
    { label: 'Elegir la cena hoy', cost: 100 },
    { label: 'Juguete pequeño', cost: 500 },
  ];
  rewards.forEach(r => {
    db.prepare("INSERT INTO custom_rewards (child_id, label, cost) VALUES (?, ?, ?)").run(childId, r.label, r.cost);
  });
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
  });

  const broadcast = (data: any) => {
    const message = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // API Routes
  app.get("/api/children", (req, res) => {
    const children = db.prepare("SELECT id, name, stars, level, avatar_id FROM children").all();
    res.json(children);
  });

  app.post("/api/children", (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const result = db.prepare("INSERT INTO children (name, stars, coins, level, xp) VALUES (?, ?, ?, ?, ?)")
      .run(name, 0, 0, 1, 0);
    const childId = result.lastInsertRowid;

    db.prepare("INSERT INTO settings (child_id, wake_up_time) VALUES (?, ?)").run(childId, "07:30");
    
    // Initial rewards for the new child
    const rewards = [
      { label: '30 min extra de pantalla', cost: 50 },
      { label: 'Elegir la cena hoy', cost: 100 },
    ];
    rewards.forEach(r => {
      db.prepare("INSERT INTO custom_rewards (child_id, label, cost) VALUES (?, ?, ?)").run(childId, r.label, r.cost);
    });

    res.json({ id: childId, name });
  });

  app.get("/api/child/:id", (req, res) => {
    const child = db.prepare("SELECT * FROM children WHERE id = ?").get(req.params.id);
    const settings = db.prepare("SELECT * FROM settings WHERE child_id = ?").get(req.params.id);
    const collectibles = db.prepare("SELECT * FROM collectibles WHERE child_id = ?").all(req.params.id);
    const world = db.prepare("SELECT * FROM world_objects WHERE child_id = ?").all(req.params.id);
    const achievements = db.prepare("SELECT * FROM achievements WHERE child_id = ?").all(req.params.id);
    const notifications = db.prepare("SELECT * FROM notifications WHERE child_id = ? ORDER BY created_at DESC LIMIT 10").all(req.params.id);
    const history = db.prepare("SELECT * FROM history WHERE child_id = ? ORDER BY date DESC LIMIT 7").all(req.params.id);
    const custom_rewards = db.prepare("SELECT * FROM custom_rewards WHERE child_id = ?").all(req.params.id);
    
    if (child) {
      res.json({ ...child, settings, collectibles, world, achievements, notifications, history, custom_rewards });
    } else {
      res.status(404).json({ error: "Child not found" });
    }
  });

  app.post("/api/child/:id/wake-up", (req, res) => {
    const { success, score } = req.body;
    const childId = req.params.id;
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const hour = now.getHours();
    
    const child = db.prepare("SELECT name, last_wake_up, current_streak, max_streak, avatar_stage FROM children WHERE id = ?").get(childId) as any;
    
    let newStreak = child.current_streak;
    let bonusStars = 0;
    let isEarlyBird = false;

    if (success) {
      // Record history
      db.prepare("INSERT INTO history (child_id, date, success, score) VALUES (?, ?, ?, ?)")
        .run(childId, today, 1, score || 10);

      // Early Bird Bonus (before 7:00 AM)
      if (hour < 7) {
        bonusStars = 10;
        isEarlyBird = true;
      }

      // Simple streak logic
      const lastDate = child.last_wake_up ? child.last_wake_up.split('T')[0] : null;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastDate === yesterdayStr) {
        newStreak += 1;
      } else if (lastDate !== today) {
        newStreak = 1;
      }
      
      const newMaxStreak = Math.max(newStreak, child.max_streak);
      
      // Evolution logic
      let newStage = child.avatar_stage;
      if (newStreak >= 5 && child.avatar_stage === 1) newStage = 2;
      if (newStreak >= 15 && child.avatar_stage === 2) newStage = 3;

      db.prepare(`
        UPDATE children 
        SET current_streak = ?, max_streak = ?, last_wake_up = ?, avatar_stage = ?, 
            stars = stars + ?, coins = coins + 10, xp = xp + 50 
        WHERE id = ?
      `).run(newStreak, newMaxStreak, now.toISOString(), newStage, 1 + bonusStars, childId);

      // Create notification for parent
      const message = `${child.name} se ha despertado con un puntaje de ${score || 10}! ${isEarlyBird ? '🚀 ¡BONO MADRUGADOR ACTIVADO!' : ''}`;
      db.prepare("INSERT INTO notifications (child_id, message, type, created_at) VALUES (?, ?, ?, ?)")
        .run(childId, message, 'wake_up', now.toISOString());

      // Add world object if streak is multiple of 3
      if (newStreak % 3 === 0) {
        const types = ['tree', 'house', 'decoration'];
        const type = types[Math.floor(Math.random() * types.length)];
        db.prepare("INSERT INTO world_objects (child_id, type, name, x, y) VALUES (?, ?, ?, ?, ?)")
          .run(childId, type, `Objeto de Racha ${newStreak}`, Math.random() * 80, Math.random() * 80);
      }

      // Discover new pet every 7 days
      if (newStreak > 0 && newStreak % 7 === 0) {
        const petNames = ['Pingu', 'Robotín', 'Tigrito', 'Dino'];
        const name = petNames[Math.floor(Math.random() * petNames.length)];
        // Check if already has it
        const exists = db.prepare("SELECT id FROM collectibles WHERE child_id = ? AND name = ?").get(childId, name);
        if (!exists) {
          db.prepare("INSERT INTO collectibles (child_id, type, name, stage) VALUES (?, ?, ?, ?)")
            .run(childId, 'pet', name, 1);
          
          db.prepare("INSERT INTO notifications (child_id, message, type, created_at) VALUES (?, ?, ?, ?)")
            .run(childId, `¡NUEVA MASCOTA! ${child.name} ha descubierto a ${name}!`, 'achievement', now.toISOString());
        }
      }

      broadcast({ type: 'WAKE_UP', childId, name: child.name, score, streak: newStreak });
    }
    
    res.json({ success: true, streak: newStreak, isEarlyBird });
  });

  app.post("/api/child/:id/reward", (req, res) => {
    const { stars, coins, xp } = req.body;
    db.prepare("UPDATE children SET stars = stars + ?, coins = coins + ?, xp = xp + ? WHERE id = ?")
      .run(stars || 0, coins || 0, xp || 0, req.params.id);
    
    const child = db.prepare("SELECT xp, level FROM children WHERE id = ?").get(req.params.id) as { xp: number, level: number };
    const nextLevelXp = child.level * 100;
    if (child.xp >= nextLevelXp) {
      db.prepare("UPDATE children SET level = level + 1, xp = xp - ? WHERE id = ?").run(nextLevelXp, req.params.id);
    }
    
    res.json({ success: true });
  });

  app.post("/api/settings/:childId", (req, res) => {
    const { wake_up_time, difficulty, vacation_mode } = req.body;
    if (wake_up_time !== undefined) {
      db.prepare("UPDATE settings SET wake_up_time = ? WHERE child_id = ?").run(wake_up_time, req.params.childId);
    }
    if (difficulty !== undefined) {
      db.prepare("UPDATE settings SET difficulty = ? WHERE child_id = ?").run(difficulty, req.params.childId);
    }
    if (vacation_mode !== undefined) {
      db.prepare("UPDATE children SET vacation_mode = ? WHERE id = ?").run(vacation_mode ? 1 : 0, req.params.childId);
    }
    res.json({ success: true });
  });

  app.post("/api/child/:id/buy", (req, res) => {
    const { type, name, cost } = req.body;
    const childId = req.params.id;
    
    const child = db.prepare("SELECT coins, name FROM children WHERE id = ?").get(childId) as { coins: number, name: string };
    
    if (child.coins >= cost) {
      db.prepare("UPDATE children SET coins = coins - ? WHERE id = ?").run(cost, childId);
      db.prepare("INSERT INTO world_objects (child_id, type, name, x, y) VALUES (?, ?, ?, ?, ?)")
        .run(childId, type, name, 10 + Math.random() * 80, 10 + Math.random() * 80);
      
      broadcast({ type: 'PURCHASE', childId, name: child.name, item: name });
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Not enough coins" });
    }
  });

  app.post("/api/child/:id/rewards/claim", (req, res) => {
    const { rewardId } = req.body;
    const childId = req.params.id;
    
    const reward = db.prepare("SELECT * FROM custom_rewards WHERE id = ? AND child_id = ?").get(rewardId, childId) as { label: string, cost: number };
    const child = db.prepare("SELECT stars, name FROM children WHERE id = ?").get(childId) as { stars: number, name: string };
    
    if (!reward) return res.status(404).json({ error: "Reward not found" });
    
    if (child.stars >= reward.cost) {
      db.prepare("UPDATE children SET stars = stars - ? WHERE id = ?").run(reward.cost, childId);
      
      const message = `¡${child.name} ha canjeado sus estrellas por: ${reward.label}! 🎁`;
      db.prepare("INSERT INTO notifications (child_id, message, type, created_at) VALUES (?, ?, ?, ?)")
        .run(childId, message, 'achievement', new Date().toISOString());
      
      broadcast({ type: 'REWARD_CLAIMED', childId, name: child.name, reward: reward.label });
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "No tienes suficientes estrellas" });
    }
  });

  app.post("/api/child/:id/rewards/custom", (req, res) => {
    const { label, cost } = req.body;
    db.prepare("INSERT INTO custom_rewards (child_id, label, cost) VALUES (?, ?, ?)")
      .run(req.params.id, label, cost);
    res.json({ success: true });
  });

  app.delete("/api/child/:id/rewards/custom/:rewardId", (req, res) => {
    db.prepare("DELETE FROM custom_rewards WHERE id = ? AND child_id = ?")
      .run(req.params.rewardId, req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
