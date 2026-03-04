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

  // Helper function to check and award achievements
  const checkAchievements = (childId: number, streak: number, wakeUpHour: number) => {
    const existingAchievements = db.prepare("SELECT title FROM achievements WHERE child_id = ?").all(childId) as Array<{ title: string }>;
    const existingTitles = existingAchievements.map(a => a.title);
    const newAchievements: Array<{ title: string, icon: string }> = [];

    const achievements = [
      { title: 'Primera Victoria', icon: '🌟', condition: streak >= 1 },
      { title: 'Madrugador Experto', icon: '🌅', condition: wakeUpHour < 7 },
      { title: 'Racha de 3 Días', icon: '🔥', condition: streak >= 3 },
      { title: 'Semana Perfecta', icon: '💎', condition: streak >= 7 },
      { title: 'Dos Semanas Imparable', icon: '⚡', condition: streak >= 14 },
      { title: 'Maestro del Despertar', icon: '👑', condition: streak >= 21 },
      { title: 'Leyenda Matutina', icon: '🏆', condition: streak >= 30 },
    ];

    achievements.forEach(ach => {
      if (ach.condition && !existingTitles.includes(ach.title)) {
        db.prepare("INSERT INTO achievements (child_id, title, icon, unlocked_at) VALUES (?, ?, ?, ?)")
          .run(childId, ach.title, ach.icon, new Date().toISOString());
        newAchievements.push(ach);
      }
    });

    return newAchievements;
  };

  app.post("/api/child/:id/wake-up", (req, res) => {
    const { success, score } = req.body;
    const childId = req.params.id;
    
    // Validaciones
    if (!childId || isNaN(Number(childId))) {
      return res.status(400).json({ error: "Invalid child ID" });
    }
    if (typeof success !== 'boolean') {
      return res.status(400).json({ error: "Success must be a boolean" });
    }
    if (score && (typeof score !== 'number' || score < 0 || score > 100)) {
      return res.status(400).json({ error: "Score must be between 0 and 100" });
    }
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const hour = now.getHours();
    
    const child = db.prepare("SELECT name, last_wake_up, current_streak, max_streak, avatar_stage, coins, stars FROM children WHERE id = ?").get(childId) as any;
    
    if (!child) {
      return res.status(404).json({ error: "Child not found" });
    }
    
    let newStreak = child.current_streak;
    let bonusStars = 0;
    let isEarlyBird = false;
    let perfectScore = false;

    if (success) {
      // Verificar si ya despertó hoy
      const todayHistory = db.prepare("SELECT id FROM history WHERE child_id = ? AND date = ?").get(childId, today);
      if (todayHistory) {
        return res.status(400).json({ error: "Ya has registrado tu despertar de hoy" });
      }

      // Record history
      db.prepare("INSERT INTO history (child_id, date, success, score) VALUES (?, ?, ?, ?)")
        .run(childId, today, 1, score || 10);

      // Bonus calculations
      if (hour < 7) {
        bonusStars = 10;
        isEarlyBird = true;
      }
      if (score >= 15) {
        bonusStars += 5;
        perfectScore = true;
      }
      if (hour >= 6 && hour < 8) {
        bonusStars += 2; // Bonus por despertarse en hora óptima
      }

      // Streak logic mejorado
      const lastDate = child.last_wake_up ? child.last_wake_up.split('T')[0] : null;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastDate === yesterdayStr) {
        newStreak += 1;
      } else if (lastDate !== today) {
        newStreak = 1;
      }
      
      // Bonus por racha larga
      if (newStreak >= 7) bonusStars += 5;
      if (newStreak >= 14) bonusStars += 10;
      if (newStreak >= 21) bonusStars += 20;
      
      const newMaxStreak = Math.max(newStreak, child.max_streak);
      
      // Evolution logic mejorado
      let newStage = child.avatar_stage;
      let evolved = false;
      if (newStreak >= 5 && child.avatar_stage === 1) {
        newStage = 2;
        evolved = true;
      }
      if (newStreak >= 15 && child.avatar_stage === 2) {
        newStage = 3;
        evolved = true;
      }

      // Calcular rewards escalados con el score
      const baseCoins = 10;
      const baseXP = 50;
      const scoreMultiplier = (score || 10) / 10;
      const earnedCoins = Math.floor(baseCoins * scoreMultiplier);
      const earnedXP = Math.floor(baseXP * scoreMultiplier);
      const earnedStars = 1 + bonusStars;

      // Actualizar datos del niño
      db.prepare(`
        UPDATE children 
        SET current_streak = ?, max_streak = ?, last_wake_up = ?, avatar_stage = ?, 
            stars = stars + ?, coins = coins + ?, xp = xp + ? 
        WHERE id = ?
      `).run(newStreak, newMaxStreak, now.toISOString(), newStage, earnedStars, earnedCoins, earnedXP, childId);

      // Check for level up
      const updatedChild = db.prepare("SELECT xp, level FROM children WHERE id = ?").get(childId) as { xp: number, level: number };
      const nextLevelXp = updatedChild.level * 100;
      if (updatedChild.xp >= nextLevelXp) {
        db.prepare("UPDATE children SET level = level + 1, xp = 0 WHERE id = ?").run(childId);
        db.prepare("INSERT INTO notifications (child_id, message, type, created_at) VALUES (?, ?, ?, ?)")
          .run(childId, `¡NIVEL SUPERIOR! ${child.name} ahora es Nivel ${updatedChild.level + 1}! 🎉`, 'achievement', now.toISOString());
      }

      // Notificación de despertar
      let message = `${child.name} se ha despertado con un puntaje de ${score || 10}!`;
      if (isEarlyBird) message += ' 🚀 ¡BONO MADRUGADOR!';
      if (perfectScore) message += ' 💯 ¡PUNTAJE PERFECTO!';
      if (evolved) message += ` 🎊 ¡TU MASCOTA HA EVOLUCIONADO A ETAPA ${newStage}!`;
      
      db.prepare("INSERT INTO notifications (child_id, message, type, created_at) VALUES (?, ?, ?, ?)")
        .run(childId, message, 'wake_up', now.toISOString());

      // Add world object if streak is multiple of 3
      if (newStreak % 3 === 0) {
        const worldObjects = [
          { type: 'tree', names: ['Árbol Mágico', 'Sauce Dorado', 'Roble Antiguo', 'Cerezo en Flor'] },
          { type: 'house', names: ['Casita Acogedora', 'Torre Mágica', 'Cabaña del Bosque', 'Palacio Mini'] },
          { type: 'decoration', names: ['Fuente Cristalina', 'Estatua Brillante', 'Jardín Zen', 'Arcoíris'] },
          { type: 'flower', names: ['Girasoles', 'Tulipanes', 'Rosas Mágicas', 'Orquídeas'] }
        ];
        const objType = worldObjects[Math.floor(Math.random() * worldObjects.length)];
        const objName = objType.names[Math.floor(Math.random() * objType.names.length)];
        
        db.prepare("INSERT INTO world_objects (child_id, type, name, x, y) VALUES (?, ?, ?, ?, ?)")
          .run(childId, objType.type, objName, 10 + Math.random() * 70, 10 + Math.random() * 70);
        
        db.prepare("INSERT INTO notifications (child_id, message, type, created_at) VALUES (?, ?, ?, ?)")
          .run(childId, `¡NUEVO OBJETO! Has desbloqueado: ${objName} 🎁`, 'achievement', now.toISOString());
      }

      // Discover new pet every 7 days
      if (newStreak > 0 && newStreak % 7 === 0) {
        const availablePets = [
          { name: 'Pingu', emoji: '🐧' },
          { name: 'Robotín', emoji: '🤖' },
          { name: 'Tigrito', emoji: '🐯' },
          { name: 'Dino', emoji: '🦕' },
          { name: 'Unicornio', emoji: '🦄' },
          { name: 'Fénix', emoji: '🔥' }
        ];
        
        for (const pet of availablePets) {
          const exists = db.prepare("SELECT id FROM collectibles WHERE child_id = ? AND name = ?").get(childId, pet.name);
          if (!exists) {
            db.prepare("INSERT INTO collectibles (child_id, type, name, stage) VALUES (?, ?, ?, ?)")
              .run(childId, 'pet', pet.name, 1);
            
            db.prepare("INSERT INTO notifications (child_id, message, type, created_at) VALUES (?, ?, ?, ?)")
              .run(childId, `¡NUEVA MASCOTA! ${child.name} ha descubierto a ${pet.name} ${pet.emoji}!`, 'achievement', now.toISOString());
            break; // Solo una mascota por vez
          }
        }
      }

      // Check and award achievements
      const newAchievements = checkAchievements(childId, newStreak, hour);
      if (newAchievements.length > 0) {
        newAchievements.forEach(ach => {
          db.prepare("INSERT INTO notifications (child_id, message, type, created_at) VALUES (?, ?, ?, ?)")
            .run(childId, `¡LOGRO DESBLOQUEADO! ${ach.icon} ${ach.title}`, 'achievement', now.toISOString());
        });
      }

      broadcast({ 
        type: 'WAKE_UP', 
        childId, 
        name: child.name, 
        score, 
        streak: newStreak,
        rewards: { stars: earnedStars, coins: earnedCoins, xp: earnedXP },
        achievements: newAchievements
      });
    }
    
    res.json({ success: true, streak: newStreak, isEarlyBird });
  });

  app.post("/api/child/:id/reward", (req, res) => {
    const { stars, coins, xp } = req.body;
    const childId = req.params.id;
    
    // Validaciones
    if (!childId || isNaN(Number(childId))) {
      return res.status(400).json({ error: "Invalid child ID" });
    }
    
    const starsToAdd = Math.max(0, parseInt(stars) || 0);
    const coinsToAdd = Math.max(0, parseInt(coins) || 0);
    const xpToAdd = Math.max(0, parseInt(xp) || 0);
    
    if (starsToAdd === 0 && coinsToAdd === 0 && xpToAdd === 0) {
      return res.status(400).json({ error: "No rewards to add" });
    }
    
    const child = db.prepare("SELECT * FROM children WHERE id = ?").get(childId) as any;
    if (!child) {
      return res.status(404).json({ error: "Child not found" });
    }
    
    db.prepare("UPDATE children SET stars = stars + ?, coins = coins + ?, xp = xp + ? WHERE id = ?")
      .run(starsToAdd, coinsToAdd, xpToAdd, childId);
    
    const updatedChild = db.prepare("SELECT xp, level, name FROM children WHERE id = ?").get(childId) as { xp: number, level: number, name: string };
    const nextLevelXp = updatedChild.level * 100;
    let leveledUp = false;
    
    if (updatedChild.xp >= nextLevelXp) {
      db.prepare("UPDATE children SET level = level + 1, xp = 0 WHERE id = ?").run(childId);
      leveledUp = true;
      
      db.prepare("INSERT INTO notifications (child_id, message, type, created_at) VALUES (?, ?, ?, ?)")
        .run(childId, `¡${updatedChild.name} subió a Nivel ${updatedChild.level + 1}! 🎉`, 'achievement', new Date().toISOString());
    }
    
    res.json({ success: true, leveledUp, newLevel: leveledUp ? updatedChild.level + 1 : updatedChild.level });
  });

  app.post("/api/settings/:childId", (req, res) => {
    const { wake_up_time, difficulty, vacation_mode } = req.body;
    const childId = req.params.childId;
    
    // Validaciones
    if (!childId || isNaN(Number(childId))) {
      return res.status(400).json({ error: "Invalid child ID" });
    }
    
    const child = db.prepare("SELECT id FROM children WHERE id = ?").get(childId);
    if (!child) {
      return res.status(404).json({ error: "Child not found" });
    }
    
    if (wake_up_time !== undefined) {
      // Validar formato de hora HH:MM
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(wake_up_time)) {
        return res.status(400).json({ error: "Invalid time format. Use HH:MM" });
      }
      db.prepare("UPDATE settings SET wake_up_time = ? WHERE child_id = ?").run(wake_up_time, childId);
    }
    
    if (difficulty !== undefined) {
      const validDifficulties = ['easy', 'normal', 'hard'];
      if (!validDifficulties.includes(difficulty)) {
        return res.status(400).json({ error: "Invalid difficulty. Use: easy, normal, hard" });
      }
      db.prepare("UPDATE settings SET difficulty = ? WHERE child_id = ?").run(difficulty, childId);
    }
    
    if (vacation_mode !== undefined) {
      if (typeof vacation_mode !== 'boolean') {
        return res.status(400).json({ error: "vacation_mode must be a boolean" });
      }
      db.prepare("UPDATE children SET vacation_mode = ? WHERE id = ?").run(vacation_mode ? 1 : 0, childId);
      
      const childName = db.prepare("SELECT name FROM children WHERE id = ?").get(childId) as { name: string };
      const message = vacation_mode 
        ? `Modo vacaciones activado para ${childName.name}. Las rachas están pausadas. 🏖️`
        : `Modo vacaciones desactivado para ${childName.name}. ¡De vuelta a la aventura! 🚀`;
      
      db.prepare("INSERT INTO notifications (child_id, message, type, created_at) VALUES (?, ?, ?, ?)")
        .run(childId, message, 'achievement', new Date().toISOString());
    }
    
    res.json({ success: true, updated: { wake_up_time, difficulty, vacation_mode } });
  });

  app.post("/api/child/:id/buy", (req, res) => {
    const { type, name, cost } = req.body;
    const childId = req.params.id;
    
    // Validaciones
    if (!childId || isNaN(Number(childId))) {
      return res.status(400).json({ error: "Invalid child ID" });
    }
    if (!type || !name || !cost) {
      return res.status(400).json({ error: "Missing required fields: type, name, cost" });
    }
    if (typeof cost !== 'number' || cost < 0) {
      return res.status(400).json({ error: "Cost must be a positive number" });
    }
    
    const validTypes = ['tree', 'house', 'decoration', 'flower', 'cloud'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid object type" });
    }
    
    const child = db.prepare("SELECT coins, name FROM children WHERE id = ?").get(childId) as { coins: number, name: string };
    
    if (!child) {
      return res.status(404).json({ error: "Child not found" });
    }
    
    if (child.coins >= cost) {
      // Usar transacción para asegurar consistencia
      try {
        db.prepare("BEGIN TRANSACTION").run();
        
        db.prepare("UPDATE children SET coins = coins - ? WHERE id = ?").run(cost, childId);
        
        // Generar posición que no colisione con objetos existentes
        let x, y, attempts = 0;
        let collision = true;
        
        while (collision && attempts < 10) {
          x = 10 + Math.random() * 70;
          y = 10 + Math.random() * 70;
          
          const nearby = db.prepare(
            "SELECT COUNT(*) as count FROM world_objects WHERE child_id = ? AND ABS(x - ?) < 15 AND ABS(y - ?) < 15"
          ).get(childId, x, y) as { count: number };
          
          collision = nearby.count > 0;
          attempts++;
        }
        
        db.prepare("INSERT INTO world_objects (child_id, type, name, x, y) VALUES (?, ?, ?, ?, ?)")
          .run(childId, type, name, x || 50, y || 50);
        
        db.prepare("INSERT INTO notifications (child_id, message, type, created_at) VALUES (?, ?, ?, ?)")
          .run(childId, `¡${child.name} ha comprado ${name}! 🛒`, 'achievement', new Date().toISOString());
        
        db.prepare("COMMIT").run();
        
        broadcast({ type: 'PURCHASE', childId, name: child.name, item: name });
        res.json({ success: true, remainingCoins: child.coins - cost });
      } catch (error) {
        db.prepare("ROLLBACK").run();
        console.error("Purchase error:", error);
        res.status(500).json({ error: "Purchase failed" });
      }
    } else {
      res.status(400).json({ error: "No tienes suficientes monedas", required: cost, available: child.coins });
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
