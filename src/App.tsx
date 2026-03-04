import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, Moon, Star, Trophy, Settings, 
  Gamepad2, Calendar, Heart, ArrowRight,
  ChevronLeft, Play, CheckCircle2,
  Clock, BarChart3, Users, Gift,
  ShoppingBag, LayoutDashboard, Sparkles, Utensils
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utilities ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const playSound = (url: string, loop = false) => {
  const audio = new Audio(url);
  audio.loop = loop;
  audio.volume = 0.8;
  audio.crossOrigin = 'anonymous';
  
  // Intentar reproducir
  const playPromise = audio.play();
  
  if (playPromise !== undefined) {
    playPromise.then(() => {
      console.log('✅ Sonido reproducido:', url);
    }).catch(e => {
      console.error('❌ Error al reproducir sonido:', e);
      // Fallback: crear un beep sintético
      if (url.includes('alarm')) {
        createBeepSound(800, 0.5, 'square');
        setTimeout(() => createBeepSound(800, 0.5, 'square'), 600);
      } else {
        createBeepSound(600, 0.2, 'sine');
      }
    });
  }
  
  return audio;
};

// Usar Web Audio API para crear sonidos sintetizados que siempre funcionen
const createBeepSound = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
};

const SOUNDS = {
  // URLs alternativas más confiables
  alarm: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
  success: 'https://www.soundjay.com/misc/sounds/magic-chime-02.mp3',
  click: 'https://www.soundjay.com/button/sounds/button-09.mp3',
  buy: 'https://www.soundjay.com/misc/sounds/cash-register-01.mp3'
};

// --- Types ---
interface ChildData {
  id: number;
  name: string;
  stars: number;
  coins: number;
  level: number;
  xp: number;
  avatar_id: string;
  avatar_stage: number;
  current_streak: number;
  max_streak: number;
  last_wake_up: string | null;
  vacation_mode: boolean;
  settings: {
    wake_up_time: string;
    difficulty: string;
  };
  collectibles: Array<{ name: string; type: string; stage: number }>;
  world: Array<{ type: string; name: string; x: number; y: number }>;
  achievements: Array<{ title: string; icon: string }>;
  notifications: Array<{ id: number; message: string; type: string; created_at: string }>;
  history: Array<{ date: string; success: number; score: number }>;
  custom_rewards: Array<{ id: number; label: string; cost: number }>;
}

// --- Mock Data / Assets ---
const CHARACTERS = [
  { 
    id: 'dragon', 
    stages: [
      { name: 'Draguito Bebé', img: 'https://picsum.photos/seed/dragon1/400/400' },
      { name: 'Dragón Mágico', img: 'https://picsum.photos/seed/dragon2/400/400' },
      { name: 'Rey Dragón', img: 'https://picsum.photos/seed/dragon3/400/400' },
    ]
  },
  { 
    id: 'penguin', 
    stages: [
      { name: 'Pingu Pequeño', img: 'https://picsum.photos/seed/pingu1/400/400' },
      { name: 'Pingu Explorador', img: 'https://picsum.photos/seed/pingu2/400/400' },
      { name: 'Capitán Ártico', img: 'https://picsum.photos/seed/pingu3/400/400' },
    ]
  },
  { 
    id: 'robot', 
    stages: [
      { name: 'Bip-Bop Simple', img: 'https://picsum.photos/seed/robot1/400/400' },
      { name: 'Robot Volador', img: 'https://picsum.photos/seed/robot2/400/400' },
      { name: 'Mega-Bot 3000', img: 'https://picsum.photos/seed/robot3/400/400' },
    ]
  },
];

const WORLD_ASSETS: Record<string, string> = {
  tree: '🌳',
  house: '🏠',
  decoration: '✨',
  flower: '🌸',
  cloud: '☁️'
};

// --- Components ---

const LandingPage = ({ 
  children, 
  onSelectChild, 
  onParentMode 
}: { 
  children: Array<{ id: number, name: string, level: number }>,
  onSelectChild: (id: number) => void,
  onParentMode: () => void
}) => {
  const [showProfiles, setShowProfiles] = useState(false);

  return (
    <div className="min-h-screen bg-[#FFF9F0]">
      {/* Nav */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-brand-primary p-2 rounded-xl shadow-lg">
            <Sun className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-black text-slate-800 tracking-tight">DespiertaKids <span className="text-brand-secondary">Pro</span></span>
        </div>
        <button 
          onClick={onParentMode}
          className="bg-white text-slate-600 px-6 py-2 rounded-full text-sm font-black border-2 border-slate-100 hover:border-brand-secondary transition-all shadow-sm"
        >
          Modo Padres
        </button>
      </nav>

      <AnimatePresence mode="wait">
        {!showProfiles ? (
          <motion.section 
            key="hero"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="px-6 py-12 md:py-24 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center"
          >
            <div className="space-y-8">
              <h1 className="text-5xl md:text-7xl font-black leading-tight text-slate-900">
                Mañanas <span className="text-brand-primary">Felices</span> y Sin Lloros
              </h1>
              <p className="text-xl text-slate-600 max-w-lg">
                Convierte el despertar en una aventura épica. Ayuda a tus hijos a crear hábitos positivos con juegos, mascotas y recompensas mágicas.
              </p>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => setShowProfiles(true)} 
                  className="pixar-button-primary flex items-center gap-2 text-lg px-10 py-5"
                >
                  ¡Comienza la Aventura! <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-brand-primary/20 blur-3xl rounded-full" />
              <img 
                src="https://picsum.photos/seed/kids-happy/800/800" 
                alt="Niño feliz" 
                className="relative rounded-[3rem] shadow-2xl border-8 border-white"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.section>
        ) : (
          <motion.section 
            key="profiles"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-6 py-24 max-w-4xl mx-auto text-center space-y-12"
          >
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-slate-900">¿Quién va a jugar hoy?</h2>
              <p className="text-slate-500 font-bold">Selecciona tu perfil para entrar a tu mundo mágico</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {children.map((child, i) => (
                <motion.button
                  key={child.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => onSelectChild(child.id)}
                  className="group relative bg-white p-8 rounded-[3rem] shadow-xl border-4 border-transparent hover:border-brand-primary transition-all hover:-translate-y-2"
                >
                  <div className="w-32 h-32 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center overflow-hidden border-4 border-slate-50 group-hover:border-brand-primary/20 transition-all">
                    <img 
                      src={`https://picsum.photos/seed/child-${child.id}/200/200`} 
                      alt={child.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-1">{child.name}</h3>
                  <div className="flex items-center justify-center gap-2">
                    <Star className="w-4 h-4 text-amber-400 fill-current" />
                    <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Nivel {child.level}</span>
                  </div>
                  
                  {/* Hover effect decoration */}
                  <div className="absolute -top-2 -right-2 bg-brand-primary text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all scale-0 group-hover:scale-100">
                    <Play className="w-4 h-4 fill-current rotate-90" />
                  </div>
                </motion.button>
              ))}
              
              {/* Parent Quick Access */}
              <button 
                onClick={onParentMode}
                className="bg-slate-100/50 p-8 rounded-[3rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 hover:bg-slate-100 hover:border-slate-300 transition-all group"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-all">
                  <Settings className="w-8 h-8 text-slate-400" />
                </div>
                <span className="font-black text-slate-400 uppercase tracking-widest text-xs">Configuración</span>
              </button>
            </div>

            <button 
              onClick={() => setShowProfiles(false)}
              className="text-slate-400 font-bold hover:text-slate-600 transition-all"
            >
              Volver atrás
            </button>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

const VirtualWorld = ({ objects, pets, currentAvatarId }: { objects: ChildData['world'], pets: ChildData['collectibles'], currentAvatarId: string }) => (
  <div className="relative w-full h-72 bg-gradient-to-b from-sky-200 to-emerald-100 rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl mb-8 group">
    {/* Background elements */}
    <div className="absolute bottom-0 w-full h-1/3 bg-emerald-400/30" />
    <div className="absolute top-10 left-10 w-20 h-20 bg-white/40 rounded-full blur-xl animate-pulse" />
    
    {/* World Objects */}
    {objects.map((obj, i) => (
      <motion.div
        key={`obj-${i}`}
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.2, rotate: 10 }}
        className="absolute text-5xl cursor-pointer select-none z-10"
        style={{ left: `${obj.x}%`, top: `${obj.y}%` }}
      >
        <motion.span
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 2 + Math.random() * 2 }}
        >
          {WORLD_ASSETS[obj.type] || '❓'}
        </motion.span>
      </motion.div>
    ))}

    {/* Pets in the World */}
    {pets.map((pet, i) => {
      const char = CHARACTERS.find(c => c.id === (pet.type === 'pet' ? pet.name.toLowerCase().split(' ')[0] : 'dragon'));
      const stageImg = char?.stages[(pet.stage || 1) - 1]?.img || 'https://picsum.photos/seed/pet/100/100';
      
      return (
        <motion.div
          key={`pet-${i}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -10, scale: 1.1 }}
          className={cn(
            "absolute w-16 h-16 rounded-3xl border-4 border-white shadow-xl overflow-hidden bg-white z-20 cursor-pointer",
            pet.name.toLowerCase().includes(currentAvatarId) ? "ring-4 ring-brand-primary ring-offset-2" : ""
          )}
          style={{ left: `${15 + (i * 20)}%`, bottom: '15%' }}
        >
          <img src={stageImg} alt={pet.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </motion.div>
      );
    })}

    {objects.length === 0 && pets.length === 0 && (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 font-bold italic gap-4">
        <Sparkles className="w-12 h-12 animate-bounce" />
        <p>Tu mundo está creciendo... ¡despierta pronto mañana!</p>
      </div>
    )}
  </div>
);

const Shop = ({ coins, onBuy }: { coins: number, onBuy: (item: any) => void }) => {
  const items = [
    { type: 'tree', name: 'Árbol Frutal', cost: 50, icon: '🌳' },
    { type: 'house', name: 'Casita de Juegos', cost: 150, icon: '🏠' },
    { type: 'flower', name: 'Flores Mágicas', cost: 20, icon: '🌸' },
    { type: 'decoration', name: 'Estrella Fugaz', cost: 100, icon: '✨' },
    { type: 'cloud', name: 'Nube Algodón', cost: 40, icon: '☁️' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-800">Tienda Mágica</h2>
        <div className="bg-amber-100 px-4 py-2 rounded-2xl flex items-center gap-2 border-2 border-amber-200">
          <Star className="w-5 h-5 text-amber-500 fill-current" />
          <span className="font-black text-amber-700">{coins}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {items.map((item, i) => (
          <button
            key={i}
            disabled={coins < item.cost}
            onClick={() => onBuy(item)}
            className={cn(
              "pixar-card p-6 text-center space-y-4 group relative overflow-hidden",
              coins < item.cost ? "opacity-50 grayscale" : "hover:-translate-y-2"
            )}
          >
            <div className="text-5xl mb-2 group-hover:scale-125 transition-transform">{item.icon}</div>
            <h3 className="font-bold text-slate-800">{item.name}</h3>
            <div className="flex items-center justify-center gap-1 bg-slate-50 py-2 rounded-xl">
              <Star className="w-4 h-4 text-amber-500 fill-current" />
              <span className="font-black text-slate-700">{item.cost}</span>
            </div>
            {coins < item.cost && (
              <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center">
                <Clock className="text-white w-8 h-8" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

const Missions = ({ data }: { data: ChildData }) => {
  const missions = [
    { id: 1, title: '¡Despierta Temprano!', desc: 'Despierta antes de las 7:30 AM', reward: 10, progress: data.last_wake_up && new Date(data.last_wake_up).getHours() < 8 ? 100 : 0, icon: Sun },
    { id: 2, title: 'Racha de 3 Días', desc: 'Mantén tu racha por 3 días seguidos', reward: 25, progress: (data.current_streak / 3) * 100, icon: Heart },
    { id: 3, title: 'Coleccionista', desc: 'Consigue 3 objetos para tu mundo', reward: 50, progress: (data.world.length / 3) * 100, icon: ShoppingBag },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-slate-800">Misiones Diarias</h2>
      <div className="grid gap-4">
        {missions.map((m) => (
          <div key={m.id} className="pixar-card p-6 bg-white border-slate-100 flex gap-6 items-center">
            <div className="bg-brand-primary/10 p-4 rounded-3xl">
              <m.icon className="w-8 h-8 text-brand-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-black text-slate-800">{m.title}</h4>
                  <p className="text-xs text-slate-400 font-bold">{m.desc}</p>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                  <Star className="w-3 h-3 text-amber-500 fill-current" />
                  <span className="text-xs font-black text-amber-700">{m.reward}</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(m.progress, 100)}%` }}
                  className={cn(
                    "h-full transition-all",
                    m.progress >= 100 ? "bg-emerald-500" : "bg-brand-primary"
                  )}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MiniGame = ({ onComplete }: { onComplete: (score: number) => void }) => {
  const [gameType, setGameType] = useState<'math' | 'spelling' | 'quiz' | 'memory' | 'pattern'>(    
    ['math', 'spelling', 'quiz', 'memory', 'pattern'][Math.floor(Math.random() * 5)] as any
  );
  const [target, setTarget] = useState<any>(null);
  const [question, setQuestion] = useState<string>('');
  const [options, setOptions] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(30); // Más tiempo
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [memoryCards, setMemoryCards] = useState<Array<{ id: number, value: string, revealed: boolean, matched: boolean }>>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);

  useEffect(() => {
    if (gameType === 'math') {
      // Reto Matemático - Dificultad adaptativa
      const difficulty = Math.random();
      let a, b, operation, result;
      
      if (difficulty < 0.4) {
        // Fácil: sumas simples
        a = Math.floor(Math.random() * 15) + 1;
        b = Math.floor(Math.random() * 15) + 1;
        operation = '+';
        result = a + b;
      } else if (difficulty < 0.7) {
        // Medio: multiplicación o resta
        const ops = ['+', '-', '×'];
        operation = ops[Math.floor(Math.random() * ops.length)];
        if (operation === '×') {
          a = Math.floor(Math.random() * 10) + 1;
          b = Math.floor(Math.random() * 10) + 1;
          result = a * b;
        } else if (operation === '-') {
          a = Math.floor(Math.random() * 20) + 10;
          b = Math.floor(Math.random() * 10) + 1;
          result = a - b;
        } else {
          a = Math.floor(Math.random() * 20) + 1;
          b = Math.floor(Math.random() * 20) + 1;
          result = a + b;
        }
      } else {
        // Difícil: operaciones combinadas
        a = Math.floor(Math.random() * 12) + 1;
        b = Math.floor(Math.random() * 12) + 1;
        operation = '×';
        result = a * b;
      }
      
      setQuestion(`¿Cuánto es ${a} ${operation} ${b}?`);
      setTarget(result);
      
      const opts = [result];
      while (opts.length < 4) {
        const offset = Math.floor(Math.random() * 10) - 5;
        const r = result + offset;
        if (!opts.includes(r) && r > 0) opts.push(r);
      }
      setOptions(opts.sort(() => Math.random() - 0.5));
      
    } else if (gameType === 'spelling') {
      // Reto de Ortografía/Vocabulario
      const words = [
        { word: 'MATEMÁTICAS', hint: 'Asignatura de números' },
        { word: 'CIENCIA', hint: 'Experimentos y descubrimientos' },
        { word: 'LECTURA', hint: 'Leer libros' },
        { word: 'MÚSICA', hint: 'Sonidos y melodías' },
        { word: 'FAMILIA', hint: 'Mamá, papá y hermanos' },
        { word: 'AMISTAD', hint: 'Relación con amigos' },
        { word: 'PLANETA', hint: 'La Tierra es uno' },
        { word: 'BOSQUE', hint: 'Lleno de árboles' }
      ];
      const wordData = words[Math.floor(Math.random() * words.length)];
      const word = wordData.word;
      const missingIndex = Math.floor(Math.random() * word.length);
      const missingChar = word[missingIndex];
      const displayWord = word.split('').map((c, i) => i === missingIndex ? '_' : c).join('');
      
      setQuestion(`${wordData.hint}: ${displayWord}`);
      setTarget(missingChar);
      
      const alphabet = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZÁÉÍÓÚ';
      const opts = [missingChar];
      while (opts.length < 4) {
        const r = alphabet[Math.floor(Math.random() * alphabet.length)];
        if (!opts.includes(r)) opts.push(r);
      }
      setOptions(opts.sort(() => Math.random() - 0.5));
      
    } else if (gameType === 'quiz') {
      // Quiz de Cultura General
      const quizzes = [
        { q: '¿El sol es una estrella?', a: 'SÍ' },
        { q: '¿Los perros pueden volar?', a: 'NO' },
        { q: '¿El agua hierve a 100°C?', a: 'SÍ' },
        { q: '¿La luna da luz propia?', a: 'NO' },
        { q: '¿Las plantas necesitan agua?', a: 'SÍ' },
        { q: '¿Los peces viven en la tierra?', a: 'NO' },
        { q: '¿El cielo es azul?', a: 'SÍ' },
        { q: '¿Leer es bueno para el cerebro?', a: 'SÍ' },
        { q: '¿Los elefantes son pequeños?', a: 'NO' },
        { q: '¿La Tierra es redonda?', a: 'SÍ' }
      ];
      const quiz = quizzes[Math.floor(Math.random() * quizzes.length)];
      setQuestion(quiz.q);
      setTarget(quiz.a);
      setOptions(['SÍ', 'NO']);
      
    } else if (gameType === 'memory') {
      // Juego de Memoria
      const emojis = ['🌟', '🚀', '🌈', '🎉', '⭐', '💚'];
      const pairs = emojis.slice(0, 4);
      const cards = [...pairs, ...pairs]
        .sort(() => Math.random() - 0.5)
        .map((value, index) => ({ id: index, value, revealed: false, matched: false }));
      
      setMemoryCards(cards);
      setQuestion('¡Encuentra las parejas!');
      setTarget('memory');
      
    } else if (gameType === 'pattern') {
      // Secuencia de Patrones
      const patterns = [
        { sequence: [2, 4, 6, 8, '?'], answer: 10, hint: 'Números pares' },
        { sequence: [1, 3, 5, 7, '?'], answer: 9, hint: 'Números impares' },
        { sequence: [5, 10, 15, 20, '?'], answer: 25, hint: 'De 5 en 5' },
        { sequence: [10, 20, 30, 40, '?'], answer: 50, hint: 'De 10 en 10' },
        { sequence: [1, 2, 4, 8, '?'], answer: 16, hint: 'Se duplica' },
      ];
      const pattern = patterns[Math.floor(Math.random() * patterns.length)];
      setQuestion(`${pattern.hint}: ${pattern.sequence.join(', ')}`);
      setTarget(pattern.answer);
      
      const opts = [pattern.answer];
      while (opts.length < 4) {
        const r = Math.floor(Math.random() * 50) + 1;
        if (!opts.includes(r)) opts.push(r);
      }
      setOptions(opts.sort(() => Math.random() - 0.5));
    }
  }, [gameType]);

  useEffect(() => {
    if (gameType === 'memory' && matchedPairs === 4) {
      // Todas las parejas encontradas
      playSound(SOUNDS.success);
      confetti({ particleCount: 150, spread: 100 });
      setTimeout(() => onComplete(20), 1000); // Bonus por memoria
      return;
    }
    
    if (timeLeft <= 0 && gameType !== 'memory') {
      onComplete(Math.max(0, 10 - attempts * 2)); // Penalización por intentos
    }
    
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, attempts, onComplete, gameType, matchedPairs]);

  const handleAnswer = (val: any) => {
    if (val === target) {
      setIsCorrect(true);
      playSound(SOUNDS.success);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      const bonusScore = Math.max(10, 20 - attempts * 2); // Más puntos con menos intentos
      setTimeout(() => onComplete(bonusScore), 1000);
    } else {
      setIsCorrect(false);
      setAttempts(a => a + 1);
      playSound(SOUNDS.click);
      setTimeout(() => setIsCorrect(null), 500);
    }
  };

  const handleMemoryCardClick = (cardId: number) => {
    if (selectedCards.length === 2 || memoryCards.find(c => c.id === cardId)?.matched) return;
    
    const newSelectedCards = [...selectedCards, cardId];
    setSelectedCards(newSelectedCards);
    
    // Revelar carta
    setMemoryCards(cards => cards.map(c => 
      c.id === cardId ? { ...c, revealed: true } : c
    ));
    
    if (newSelectedCards.length === 2) {
      const [first, second] = newSelectedCards;
      const firstCard = memoryCards.find(c => c.id === first);
      const secondCard = memoryCards.find(c => c.id === second);
      
      setTimeout(() => {
        if (firstCard?.value === secondCard?.value) {
          // Match!
          playSound(SOUNDS.success);
          setMemoryCards(cards => cards.map(c => 
            (c.id === first || c.id === second) ? { ...c, matched: true } : c
          ));
          setMatchedPairs(p => p + 1);
        } else {
          // No match
          playSound(SOUNDS.click);
          setMemoryCards(cards => cards.map(c => 
            (c.id === first || c.id === second) ? { ...c, revealed: false } : c
          ));
        }
        setSelectedCards([]);
      }, 800);
    }
  };

  const gameIcons: Record<string, { title: string, emoji: string, color: string }> = {
    math: { title: 'Desafío Matemático', emoji: '🧠', color: 'indigo' },
    spelling: { title: 'Maestro de Palabras', emoji: '📚', color: 'purple' },
    quiz: { title: 'Quiz Inteligente', emoji: '🤓', color: 'emerald' },
    memory: { title: 'Memoria de Campeón', emoji: '🧩', color: 'rose' },
    pattern: { title: 'Patrón Secreto', emoji: '🔢', color: 'amber' },
  };
  
  const currentGame = gameIcons[gameType] || gameIcons.math;

  return (
    <div className="text-center space-y-8 p-8 bg-white rounded-[3rem] shadow-2xl border-4 border-slate-100 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '20px 20px' }} />

      <div className="space-y-3 relative z-10">
        <div className="flex justify-center gap-2 mb-2">
          <div className={cn(
            "text-white px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg",
            `bg-${currentGame.color}-600`
          )}>
            {currentGame.emoji} {currentGame.title}
          </div>
          <div className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> BRAIN XP +{20 - attempts * 2}
          </div>
        </div>
        
        <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 shadow-inner">
          <p className="text-2xl font-black text-brand-primary uppercase tracking-tight">
            {question}
          </p>
        </div>
      </div>
      
      {gameType === 'memory' ? (
        <div className="grid grid-cols-4 gap-4 relative z-10">
          {memoryCards.map((card) => (
            <motion.button
              key={card.id}
              whileHover={{ scale: card.matched ? 1 : 1.05 }}
              whileTap={{ scale: card.matched ? 1 : 0.95 }}
              onClick={() => handleMemoryCardClick(card.id)}
              disabled={card.matched || card.revealed}
              className={cn(
                "aspect-square text-4xl font-black rounded-2xl border-4 transition-all flex items-center justify-center",
                card.matched ? "bg-emerald-500 text-white border-emerald-700 scale-95" :
                card.revealed ? "bg-white text-slate-800 border-brand-primary" :
                "bg-brand-primary text-white border-brand-secondary hover:border-brand-accent"
              )}
            >
              {card.revealed || card.matched ? card.value : '❓'}
            </motion.button>
          ))}
        </div>
      ) : (
        <div className={cn(
          "grid gap-6 relative z-10",
          gameType === 'quiz' ? "grid-cols-2" : "grid-cols-2"
        )}>
          {options.map((opt, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAnswer(opt)}
              className={cn(
                "p-10 text-5xl font-black rounded-[2rem] border-b-8 transition-all active:border-b-0 active:translate-y-2 flex items-center justify-center",
                isCorrect === true && opt === target ? "bg-emerald-500 text-white border-emerald-700" :
                isCorrect === false && opt !== target ? "bg-slate-100 text-slate-300 border-slate-200" :
                "bg-white text-slate-800 border-slate-200 hover:border-brand-primary hover:bg-brand-primary hover:text-white"
              )}
            >
              {opt}
            </motion.button>
          ))}
        </div>
      )}

      <div className="space-y-2 relative z-10">
        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <span>Tiempo para Pensar</span>
          <span className={cn(timeLeft < 10 ? "text-rose-500 animate-pulse" : "")}>{timeLeft}s</span>
        </div>
        <div className="w-full bg-slate-100 h-5 rounded-full overflow-hidden border-2 border-slate-50 shadow-inner">
          <motion.div 
            className={cn(
              "h-full transition-colors",
              timeLeft < 10 ? "bg-rose-500" : "bg-gradient-to-r from-indigo-500 to-brand-primary"
            )}
            initial={{ width: '100%' }}
            animate={{ width: `${(timeLeft / 30) * 100}%` }}
          />
        </div>
      </div>

      {attempts > 0 && (
        <p className="text-xs font-bold text-amber-600 italic animate-pulse">
          ¡Intenta de nuevo! {attempts} {attempts === 1 ? 'intento' : 'intentos'}
        </p>
      )}

      <p className="text-[10px] font-bold text-slate-400 italic">
        "¡Estudiar te da más estrellas y mejores premios!"
      </p>
    </div>
  );
};

const Rewards = ({ stars, rewards, onClaim }: { stars: number, rewards: Array<{ id: number, label: string, cost: number }>, onClaim: (id: number) => void }) => {
  const [claimingId, setClaimingId] = useState<number | null>(null);

  const getRewardStyle = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('pantalla') || l.includes('tablet') || l.includes('juego')) return { icon: <Gamepad2 className="w-8 h-8" />, color: 'bg-indigo-500', text: 'text-indigo-500' };
    if (l.includes('cena') || l.includes('comida') || l.includes('helado') || l.includes('dulce')) return { icon: <Utensils className="w-8 h-8" />, color: 'bg-rose-500', text: 'text-rose-500' };
    if (l.includes('juguete') || l.includes('regalo')) return { icon: <Gift className="w-8 h-8" />, color: 'bg-amber-500', text: 'text-amber-500' };
    if (l.includes('parque') || l.includes('salida') || l.includes('cine')) return { icon: <Sun className="w-8 h-8" />, color: 'bg-emerald-500', text: 'text-emerald-500' };
    return { icon: <Star className="w-8 h-8" />, color: 'bg-brand-secondary', text: 'text-brand-secondary' };
  };

  const handleClaim = (id: number) => {
    setClaimingId(id);
    setTimeout(() => {
      onClaim(id);
      setClaimingId(null);
    }, 1000);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Cofre de Premios</h2>
          <p className="text-slate-400 font-bold text-sm">¡Canjea tus estrellas por magia!</p>
        </div>
        <div className="bg-amber-50 px-6 py-3 rounded-3xl flex items-center gap-3 border-2 border-amber-100 shadow-inner">
          <Star className="w-8 h-8 text-amber-500 fill-current" />
          <span className="font-black text-amber-700 text-3xl">{stars}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {rewards.length === 0 ? (
          <div className="col-span-full p-16 bg-white rounded-[3rem] border-4 border-dashed border-slate-100 text-center space-y-6">
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto"
            >
              <Gift className="w-12 h-12 text-slate-200" />
            </motion.div>
            <div className="space-y-2">
              <p className="text-slate-400 font-black text-xl">¡El cofre está vacío!</p>
              <p className="text-slate-300 font-bold text-sm max-w-xs mx-auto">Tus papás están preparando sorpresas mágicas para ti. ¡Vuelve pronto!</p>
            </div>
          </div>
        ) : (
          rewards.map((r) => {
            const style = getRewardStyle(r.label);
            const canAfford = stars >= r.cost;
            const isClaiming = claimingId === r.id;

            return (
              <motion.div 
                key={r.id}
                whileHover={canAfford ? { y: -8, scale: 1.02 } : {}}
                className={cn(
                  "relative overflow-hidden rounded-[2.5rem] bg-white border-2 transition-all group",
                  canAfford ? "border-slate-100 shadow-xl hover:shadow-2xl" : "border-slate-50 opacity-60 grayscale"
                )}
              >
                {/* Card Header Color Strip */}
                <div className={cn("h-3 w-full", style.color)} />
                
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className={cn("p-5 rounded-3xl shadow-inner", style.color + " bg-opacity-10")}>
                      <div className={style.text}>{style.icon}</div>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-100">
                      <Star className="w-4 h-4 text-amber-500 fill-current" />
                      <span className="font-black text-amber-700">{r.cost}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-800 leading-tight">{r.label}</h3>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Premio Especial</p>
                  </div>

                  <button 
                    disabled={!canAfford || isClaiming}
                    onClick={() => handleClaim(r.id)}
                    className={cn(
                      "w-full py-5 rounded-3xl font-black text-lg transition-all relative overflow-hidden",
                      canAfford 
                        ? cn("text-white shadow-lg border-b-8 active:border-b-0 active:translate-y-1", style.color, "border-black/20") 
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    <AnimatePresence mode="wait">
                      {isClaiming ? (
                        <motion.div 
                          key="claiming"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className="flex items-center justify-center gap-2"
                        >
                          <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin" />
                          <span>¡CANJEANDO!</span>
                        </motion.div>
                      ) : (
                        <motion.span 
                          key="idle"
                          initial={{ y: -20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                        >
                          {canAfford ? '¡LO QUIERO!' : 'FALTAN ESTRELLAS'}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </div>

                {/* Decorative Background Element */}
                <div className={cn("absolute -right-8 -bottom-8 w-32 h-32 rounded-full opacity-5", style.color)} />
              </motion.div>
            );
          })
        )}
      </div>

      {/* Encouragement Banner */}
      <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white flex items-center gap-6 shadow-2xl overflow-hidden relative">
        <div className="relative z-10">
          <h4 className="text-2xl font-black mb-1">¡Sigue así, Campeón!</h4>
          <p className="text-indigo-100 font-bold text-sm">Cada despertar a tiempo te acerca a tu próximo gran premio.</p>
        </div>
        <Trophy className="w-20 h-20 text-indigo-400/50 absolute -right-4 -bottom-4 rotate-12" />
      </div>
    </div>
  );
};

const ChildDashboard = ({ data, onAction, alarmActive }: { data: ChildData, onAction: (type: string, val: any) => void, alarmActive: boolean }) => {
  const [view, setView] = useState<'main' | 'game' | 'world' | 'report' | 'shop' | 'missions' | 'rewards'>(alarmActive ? 'game' : 'main');
  const [lastScore, setLastScore] = useState<number | null>(null);

  useEffect(() => {
    if (alarmActive) setView('game');
  }, [alarmActive]);

  const character = CHARACTERS.find(c => c.id === data.avatar_id) || CHARACTERS[0];
  const stage = character.stages[data.avatar_stage - 1] || character.stages[0];

  if (view === 'game') {
    return (
      <div className="max-w-md mx-auto p-6 pt-20">
        <MiniGame onComplete={(score) => {
          if (score > 0) {
            setLastScore(score);
            onAction('wake-up', { success: true, score });
            setView('report');
          } else {
            setView('main');
          }
        }} />
      </div>
    );
  }

  if (view === 'report') {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center text-center space-y-8">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="pixar-card p-8 bg-white max-w-sm w-full space-y-6"
        >
          <div className="bg-amber-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Sun className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-800">¡Reporte de la Mañana!</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
              <span className="font-bold text-slate-500">Puntaje</span>
              <span className="font-black text-2xl text-brand-primary">{lastScore}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
              <span className="font-bold text-slate-500">Racha</span>
              <span className="font-black text-2xl text-brand-secondary">{data.current_streak} días</span>
            </div>
            {new Date().getHours() < 7 && (
              <div className="p-4 bg-amber-400 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg">
                <ArrowRight className="w-5 h-5" /> ¡BONO MADRUGADOR! +10 ⭐
              </div>
            )}
          </div>
          <p className="text-slate-500 font-medium italic">"¡Hoy va a ser un gran día, {data.name}!"</p>
          <button 
            onClick={() => setView('main')}
            className="w-full pixar-button-primary py-4"
          >
            ¡Entendido!
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 bg-[#FFF9F0]">
      {/* Header Stats */}
      <div className="bg-white/80 backdrop-blur-md p-6 shadow-sm flex justify-between items-center sticky top-0 z-10 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-brand-primary rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            <div className="relative bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
              <img 
                src={`https://picsum.photos/seed/child-${data.id}/200/200`} 
                alt={data.name} 
                className="w-12 h-12 rounded-xl object-cover"
              />
            </div>
          </div>
          <div>
            <p className="font-black text-slate-800 text-lg">¡Hola, {data.name}!</p>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-brand-primary h-full" style={{ width: `${(data.xp / (data.level * 100)) * 100}%` }} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Nivel {data.level}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <div className="bg-amber-50 px-3 py-1.5 rounded-2xl flex items-center gap-1 border border-amber-100 shadow-sm">
              <Star className="w-4 h-4 text-amber-500 fill-current" />
              <span className="font-black text-amber-700">{data.stars}</span>
            </div>
            <div className="bg-rose-50 px-3 py-1.5 rounded-2xl flex items-center gap-1 border border-rose-100 shadow-sm">
              <Heart className="w-4 h-4 text-rose-500 fill-current" />
              <span className="font-black text-rose-700">{data.current_streak}</span>
            </div>
          </div>
          <button 
            onClick={() => onAction('logout', null)}
            className="p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-100 text-slate-400 hover:text-rose-500 transition-colors"
            title="Cambiar Perfil"
          >
            <Users className="w-6 h-6" />
          </button>
        </div>
      </div>

      <main className="p-6 max-w-2xl mx-auto space-y-8">
        <AnimatePresence mode="wait">
          {view === 'main' && (
            <motion.div 
              key="main"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Virtual World Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Sun className="text-brand-primary" /> Mi Mundo Mágico
                  </h3>
                  <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-lg shadow-sm">
                    {data.world.length} Objetos • {data.collectibles.length} Mascotas
                  </span>
                </div>
                <VirtualWorld objects={data.world} pets={data.collectibles} currentAvatarId={data.avatar_id} />
              </div>

              {/* Character View */}
              <div className="relative aspect-square max-w-xs mx-auto">
                <motion.div 
                  animate={{ y: [0, -15, 0], rotate: [0, 2, -2, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                  className="w-full h-full rounded-full bg-gradient-to-br from-brand-primary/20 to-brand-accent/20 flex items-center justify-center p-8"
                >
                  <img 
                    src={stage.img} 
                    alt={stage.name} 
                    className="w-full h-full object-contain rounded-full border-8 border-white shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-2xl shadow-xl border-b-4 border-brand-primary font-black text-slate-800">
                  {stage.name}
                </div>
                <div className="absolute -top-4 -right-4 bg-brand-accent text-white px-3 py-1 rounded-full text-xs font-black shadow-lg">
                  ETAPA {data.avatar_stage}
                </div>
              </div>

              {/* Streak Progress */}
              <div className="pixar-card p-6 bg-white border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-slate-800">Racha de Despertares</h3>
                  <span className="text-brand-secondary font-black">{data.current_streak} / 5 para evolucionar</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div 
                      key={i} 
                      className={cn(
                        "flex-1 h-3 rounded-full transition-colors",
                        i <= data.current_streak ? "bg-brand-secondary" : "bg-slate-100"
                      )} 
                    />
                  ))}
                </div>
              </div>

              {/* Achievements Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Trophy className="text-amber-500" /> Mis Logros
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {data.achievements.length === 0 ? (
                    <div className="col-span-3 p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                      <p className="text-slate-400 font-bold text-sm">¡Aún no has desbloqueado logros! Sigue despertando temprano.</p>
                    </div>
                  ) : (
                    data.achievements.map((a, i) => (
                      <motion.div 
                        key={i}
                        whileHover={{ scale: 1.05 }}
                        className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center gap-2"
                      >
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                          <Star className="w-6 h-6 text-amber-500 fill-current" />
                        </div>
                        <p className="text-[10px] font-black text-slate-800 leading-tight uppercase">{a.title}</p>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button 
                onClick={() => setView('game')}
                className="w-full pixar-button-primary py-6 text-2xl flex items-center justify-center gap-4"
              >
                <Play className="fill-current" /> ¡DESPERTAR AHORA!
              </button>
            </motion.div>
          )}

          {view === 'shop' && (
            <motion.div 
              key="shop"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <Shop coins={data.coins} onBuy={(item) => onAction('buy', item)} />
            </motion.div>
          )}

          {view === 'missions' && (
            <motion.div 
              key="missions"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <Missions data={data} />
            </motion.div>
          )}

          {view === 'rewards' && (
            <motion.div 
              key="rewards"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <Rewards 
                stars={data.stars} 
                rewards={data.custom_rewards} 
                onClaim={(id) => onAction('claim-reward', { rewardId: id })} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/20 p-4 flex justify-around items-center max-w-md mx-auto z-50">
        <button 
          onClick={() => setView('main')}
          className={cn("p-3 transition-colors", view === 'main' ? "text-brand-primary" : "text-slate-400")}
        >
          <Sun className="w-8 h-8" />
        </button>
        <button 
          onClick={() => setView('missions')}
          className={cn("p-3 transition-colors", view === 'missions' ? "text-brand-primary" : "text-slate-400")}
        >
          <LayoutDashboard className="w-8 h-8" />
        </button>
        <button 
          onClick={() => setView('rewards')}
          className={cn("p-3 transition-colors", view === 'rewards' ? "text-brand-primary" : "text-slate-400")}
        >
          <Gift className="w-8 h-8" />
        </button>
        <button 
          onClick={() => setView('shop')}
          className={cn("p-3 transition-colors", view === 'shop' ? "text-brand-primary" : "text-slate-400")}
        >
          <ShoppingBag className="w-8 h-8" />
        </button>
      </nav>
    </div>
  );
};

const ParentDashboard = ({ 
  data, 
  children,
  activeChildId,
  onSwitchChild,
  onAddChild,
  onUpdate, 
  onAddReward, 
  onDeleteReward 
}: { 
  data: ChildData, 
  children: Array<{ id: number, name: string, stars: number, level: number }>,
  activeChildId: number,
  onSwitchChild: (id: number) => void,
  onAddChild: (name: string) => void,
  onUpdate: (settings: any) => void,
  onAddReward: (reward: { label: string, cost: number }) => void,
  onDeleteReward: (id: number) => void
}) => {
  const [time, setTime] = useState(data.settings.wake_up_time);
  const [vacation, setVacation] = useState(data.vacation_mode);
  const [newRewardLabel, setNewRewardLabel] = useState('');
  const [newRewardCost, setNewRewardCost] = useState(50);
  const [newChildName, setNewChildName] = useState('');
  const [showAddChild, setShowAddChild] = useState(false);

  const days = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const historyEntry = data.history.find(h => h.date === dateStr);
    return {
      label: days[d.getDay()],
      val: historyEntry ? (historyEntry.score / 10) * 100 : 0,
      success: !!historyEntry
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 max-w-4xl mx-auto gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Panel de Padres</h1>
          <p className="text-slate-400 font-bold text-sm">Gestiona el progreso de tus hijos</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-200">
          <Users className="w-5 h-5 text-slate-400" />
          <span className="font-bold text-slate-600">Familia Pérez</span>
        </div>
      </header>

      {/* Child Selector */}
      <div className="max-w-4xl mx-auto mb-8 flex flex-wrap items-center gap-3">
        {children.map(child => (
          <button
            key={child.id}
            onClick={() => onSwitchChild(child.id)}
            className={cn(
              "px-6 py-3 rounded-2xl font-black transition-all flex items-center gap-3 shadow-sm border-2",
              activeChildId === child.id 
                ? "bg-brand-primary text-white border-brand-primary scale-105" 
                : "bg-white text-slate-600 border-slate-100 hover:border-brand-primary/30"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center text-xs",
              activeChildId === child.id ? "bg-white/20" : "bg-slate-100"
            )}>
              {child.level}
            </div>
            {child.name}
          </button>
        ))}
        <button 
          onClick={() => setShowAddChild(true)}
          className="w-12 h-12 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-brand-primary hover:text-brand-primary transition-all"
        >
          <Play className="w-4 h-4 rotate-90 fill-current" />
        </button>
      </div>

      {showAddChild && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto mb-8 bg-white p-6 rounded-[2.5rem] shadow-xl border-2 border-brand-primary/20 flex flex-col md:flex-row items-center gap-4"
        >
          <div className="flex-1 w-full">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nombre del nuevo hijo/a</label>
            <input 
              type="text" 
              placeholder="Ej: Sofía"
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-3 font-bold focus:border-brand-primary outline-none transition-all"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => {
                if (newChildName) {
                  onAddChild(newChildName);
                  setNewChildName('');
                  setShowAddChild(false);
                }
              }}
              className="flex-1 md:flex-none pixar-button-primary px-8 py-3"
            >
              Añadir
            </button>
            <button 
              onClick={() => setShowAddChild(false)}
              className="flex-1 md:flex-none px-8 py-3 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid gap-6 max-w-4xl mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Racha Actual', val: data.current_streak, icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
            { label: 'Racha Máxima', val: data.max_streak, icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50' },
            { label: 'Objetos Mundo', val: data.world.length, icon: Sun, color: 'text-brand-primary', bg: 'bg-amber-50' },
            { label: 'Nivel', val: data.level, icon: Star, color: 'text-teal-500', bg: 'bg-teal-50' },
          ].map((s, i) => (
            <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", s.bg)}>
                <s.icon className={cn("w-6 h-6", s.color)} />
              </div>
              <p className="text-3xl font-black text-slate-900">{s.val}</p>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
            <h3 className="text-xl font-black flex items-center gap-2">
              <Sun className="text-brand-primary" /> Actividad Reciente
            </h3>
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
              {data.notifications.length === 0 ? (
                <p className="text-slate-400 italic text-sm">No hay actividad reciente.</p>
              ) : (
                data.notifications.map((n) => (
                  <div key={n.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3 items-start">
                    <div className="bg-white p-2 rounded-xl shadow-sm">
                      <Sun className="w-4 h-4 text-brand-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-700">{n.message}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
            <h3 className="text-xl font-black flex items-center gap-2">
              <Clock className="text-brand-primary" /> Horarios
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-800">Alarma Matutina</p>
                  <p className="text-xs text-slate-400">Lunes a Viernes</p>
                </div>
                <input 
                  type="time" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2 font-black text-lg focus:border-brand-primary outline-none transition-colors"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-800">Modo Vacaciones</p>
                  <p className="text-xs text-slate-400">Pausa las rachas</p>
                </div>
                <button 
                  onClick={() => {
                    setVacation(!vacation);
                    onUpdate({ vacation_mode: !vacation });
                  }}
                  className={cn(
                    "w-14 h-8 rounded-full p-1 transition-colors relative",
                    vacation ? "bg-brand-accent" : "bg-slate-300"
                  )}
                >
                  <motion.div 
                    animate={{ x: vacation ? 24 : 0 }}
                    className="w-6 h-6 bg-white rounded-full shadow-md"
                  />
                </button>
              </div>
            </div>

            <button 
              onClick={() => onUpdate({ wake_up_time: time })}
              className="w-full pixar-button-primary py-4"
            >
              Guardar Configuración
            </button>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
            <h3 className="text-xl font-black flex items-center gap-2">
              <Gift className="text-brand-secondary" /> Recompensas Reales
            </h3>
            
            <div className="space-y-3">
              {data.custom_rewards.map((r) => (
                <div key={r.id} className="flex justify-between items-center p-4 border-2 border-slate-50 rounded-2xl hover:border-brand-secondary/20 transition-colors group">
                  <span className="font-bold text-slate-700">{r.label}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                      <Star className="w-3 h-3 text-amber-500 fill-current" />
                      <span className="text-xs font-black text-amber-700">{r.cost}</span>
                    </div>
                    <button 
                      onClick={() => onDeleteReward(r.id)}
                      className="text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Añadir Nueva Recompensa</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ej: Helado"
                  value={newRewardLabel}
                  onChange={(e) => setNewRewardLabel(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-brand-primary"
                />
                <input 
                  type="number" 
                  value={newRewardCost}
                  onChange={(e) => setNewRewardCost(Number(e.target.value))}
                  className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-brand-primary"
                />
                <button 
                  onClick={() => {
                    if (newRewardLabel) {
                      onAddReward({ label: newRewardLabel, cost: newRewardCost });
                      setNewRewardLabel('');
                    }
                  }}
                  className="bg-brand-primary text-white p-2 rounded-xl shadow-md"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Weekly Progress */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black flex items-center gap-2">
                <BarChart3 className="text-brand-accent" /> Actividad Semanal
              </h3>
            </div>
            <div className="h-40 flex items-end justify-around gap-4 px-4">
              {last7Days.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3">
                  <div className="w-full bg-slate-50 rounded-2xl h-full relative overflow-hidden">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${d.val}%` }}
                      className={cn(
                        "absolute bottom-0 w-full rounded-t-xl transition-all",
                        d.success ? "bg-brand-primary shadow-[0_0_20px_rgba(255,184,0,0.3)]" : "bg-slate-200"
                      )}
                    />
                  </div>
                  <span className="text-[10px] font-black text-slate-400">
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'landing' | 'child' | 'parent'>('landing');
  const [childData, setChildData] = useState<ChildData | null>(null);
  const [childrenList, setChildrenList] = useState<Array<{ id: number, name: string, stars: number, level: number }>>([]);
  const [activeChildId, setActiveChildId] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [alarmActive, setAlarmActive] = useState(false);
  const [showAlarmOverlay, setShowAlarmOverlay] = useState(false);
  const [alarmAudio, setAlarmAudio] = useState<HTMLAudioElement | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'info' | 'success' } | null>(null);

  useEffect(() => {
    fetchChildrenList();
  }, []);

  useEffect(() => {
    if (view !== 'landing') {
      fetchChildData();
    }
  }, [view, activeChildId]);

  // WebSocket for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'WAKE_UP') {
        setToast({ message: `¡${data.name} se ha despertado! Puntaje: ${data.score}`, type: 'success' });
        if (Number(data.childId) === activeChildId) fetchChildData();
        fetchChildrenList();
      }
      if (data.type === 'PURCHASE') {
        setToast({ message: `¡${data.name} ha comprado un ${data.item}!`, type: 'info' });
        if (Number(data.childId) === activeChildId) fetchChildData();
        fetchChildrenList();
      }
      if (data.type === 'REWARD_CLAIMED') {
        setToast({ message: `¡${data.name} ha canjeado: ${data.reward}! 🎁`, type: 'success' });
        if (Number(data.childId) === activeChildId) fetchChildData();
        fetchChildrenList();
      }
    };

    return () => ws.close();
  }, [activeChildId]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Alarm Check Logic
  useEffect(() => {
    if (childData?.settings?.wake_up_time && view === 'child' && !alarmActive) {
      const checkAlarm = () => {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        if (currentTime === childData.settings.wake_up_time) {
          triggerAlarm();
        }
      };

      const interval = setInterval(checkAlarm, 10000); // Check every 10 seconds
      return () => clearInterval(interval);
    }
  }, [childData, view, alarmActive]);

  const triggerAlarm = () => {
    setAlarmActive(true);
    setShowAlarmOverlay(true);
    
    console.log('🔔 Activando alarma...');
    
    // Sistema de alarma con múltiples respaldos
    let alarmSound: HTMLAudioElement | null = null;
    
    // Intento 1: Usar URL externa
    alarmSound = new Audio(SOUNDS.alarm);
    alarmSound.loop = true;
    alarmSound.volume = 0.5;
    alarmSound.crossOrigin = 'anonymous';
    
    const playPromise = alarmSound.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log('✅ Alarma sonando correctamente');
        
        // Incrementar volumen gradualmente
        if (alarmSound) {
          let volumeLevel = 0.5;
          const volumeInterval = setInterval(() => {
            if (volumeLevel < 1.0 && alarmSound) {
              volumeLevel += 0.1;
              alarmSound.volume = Math.min(volumeLevel, 1.0);
            } else {
              clearInterval(volumeInterval);
            }
          }, 1500);
          
          (alarmSound as any).volumeInterval = volumeInterval;
        }
      }).catch(e => {
        console.error('❌ Error con audio externo:', e);
        
        // Intento 2: Crear beeps sintéticos en loop
        console.log('🔄 Usando sistema de beeps sintéticos...');
        const beepInterval = setInterval(() => {
          // Doble beep urgente
          createBeepSound(880, 0.3, 'square');
          setTimeout(() => createBeepSound(880, 0.3, 'square'), 350);
        }, 1000);
        
        (alarmSound as any).beepInterval = beepInterval;
        
        // Mostrar mensaje al usuario
        setToast({ 
          message: '⏰ ¡ALARMA ACTIVA! Completa el reto para apagarla', 
          type: 'info' 
        });
      });
    }
    
    setAlarmAudio(alarmSound);
  };

  const stopAlarm = () => {
    console.log('🛑 Apagando alarma...');
    
    if (alarmAudio) {
      // Limpiar intervals
      if ((alarmAudio as any).volumeInterval) {
        clearInterval((alarmAudio as any).volumeInterval);
      }
      if ((alarmAudio as any).beepInterval) {
        clearInterval((alarmAudio as any).beepInterval);
      }
      
      // Fade out suave
      let currentVolume = alarmAudio.volume;
      const fadeOutInterval = setInterval(() => {
        if (alarmAudio && currentVolume > 0.05) {
          currentVolume = Math.max(0, currentVolume - 0.1);
          alarmAudio.volume = currentVolume;
        } else {
          clearInterval(fadeOutInterval);
          if (alarmAudio) {
            alarmAudio.pause();
            alarmAudio.currentTime = 0;
          }
        }
      }, 50);
      
      setAlarmAudio(null);
    }
    
    setAlarmActive(false);
    setShowAlarmOverlay(false);
    console.log('✅ Alarma apagada');
  };

  const fetchChildrenList = async () => {
    try {
      const res = await fetch('/api/children');
      const data = await res.json();
      setChildrenList(data);
      if (data.length > 0 && !activeChildId) {
        setActiveChildId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChildData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/child/${activeChildId}`);
      const data = await res.json();
      setChildData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (type: string, payload: any) => {
    if (type === 'wake-up') {
      stopAlarm();
      try {
        const res = await fetch(`/api/child/${activeChildId}/wake-up`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (res.ok) {
          const data = await res.json();
          // Mostrar feedback mejorado
          if (data.isEarlyBird) {
            setToast({ message: '🚀 ¡BONO MADRUGADOR ACTIVADO! +10 ⭐', type: 'success' });
          }
          if (data.streak >= 5) {
            setToast({ message: `🔥 ¡Racha de ${data.streak} días! ¡Increíble!`, type: 'success' });
          }
        } else {
          const error = await res.json();
          setToast({ message: error.error, type: 'info' });
        }
        
        fetchChildData();
        fetchChildrenList();
      } catch (error) {
        console.error('Wake-up error:', error);
        setToast({ message: 'Error al registrar despertar', type: 'info' });
      }
    }
    if (type === 'reward') {
      await fetch(`/api/child/${activeChildId}/reward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      fetchChildData();
    }
    if (type === 'settings') {
      await fetch(`/api/settings/${activeChildId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      fetchChildData();
    }
    if (type === 'buy') {
      try {
        const res = await fetch(`/api/child/${activeChildId}/buy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (res.ok) {
          playSound(SOUNDS.buy);
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
          const data = await res.json();
          setToast({ 
            message: `✨ ¡Compraste ${payload.name}! Te quedan ${data.remainingCoins} monedas`, 
            type: 'success' 
          });
          fetchChildData();
        } else {
          const error = await res.json();
          setToast({ message: error.error, type: 'info' });
        }
      } catch (error) {
        console.error('Buy error:', error);
        setToast({ message: 'Error al comprar objeto', type: 'info' });
      }
    }
    if (type === 'add-reward') {
      await fetch(`/api/child/${activeChildId}/rewards/custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      fetchChildData();
    }
    if (type === 'delete-reward') {
      await fetch(`/api/child/${activeChildId}/rewards/custom/${payload}`, {
        method: 'DELETE'
      });
      fetchChildData();
    }
    if (type === 'claim-reward') {
      const res = await fetch(`/api/child/${activeChildId}/rewards/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        playSound(SOUNDS.success);
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 }
        });
        fetchChildData();
        fetchChildrenList();
      } else {
        const err = await res.json();
        setToast({ message: err.error, type: 'info' });
      }
    }
    if (type === 'add-child') {
      const res = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: payload })
      });
      if (res.ok) {
        const newChild = await res.json();
        setActiveChildId(newChild.id);
        fetchChildrenList();
      }
    }
    if (type === 'logout') {
      setView('landing');
    }
  };

  if (view === 'landing') return (
    <LandingPage 
      children={childrenList} 
      onSelectChild={(id) => {
        setActiveChildId(id);
        setView('child');
      }}
      onParentMode={() => setView('parent')}
    />
  );

  return (
    <div className="min-h-screen bg-[#FFF9F0]">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={cn(
              "fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl font-black text-white flex items-center gap-3",
              toast.type === 'success' ? "bg-emerald-500" : "bg-brand-primary"
            )}
          >
            {toast.type === 'success' ? <Trophy className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Switcher for Demo */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        <div className="flex gap-2">
          <button 
            onClick={() => setView('child')}
            className={cn("px-4 py-2 rounded-full text-xs font-black shadow-lg transition-all border-2", view === 'child' ? "bg-brand-primary text-white border-brand-primary" : "bg-white text-slate-600 border-slate-100")}
          >
            Modo Niño
          </button>
          <button 
            onClick={() => setView('parent')}
            className={cn("px-4 py-2 rounded-full text-xs font-black shadow-lg transition-all border-2", view === 'parent' ? "bg-brand-secondary text-white border-brand-secondary" : "bg-white text-slate-600 border-slate-100")}
          >
            Modo Padres
          </button>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              console.log('🔊 Probando sonido de éxito...');
              playSound(SOUNDS.success);
              createBeepSound(800, 0.2, 'sine');
            }}
            className="px-4 py-2 rounded-full text-xs font-black shadow-lg bg-emerald-500 text-white border-2 border-emerald-600 hover:bg-emerald-600"
          >
            🔊 Test Sonido
          </button>
          <button 
            onClick={() => {
              console.log('🔔 Activando alarma de prueba...');
              triggerAlarm();
            }}
            className="px-4 py-2 rounded-full text-xs font-black shadow-lg bg-rose-500 text-white border-2 border-rose-600 hover:bg-rose-600"
          >
            🔔 Probar Alarma
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showAlarmOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-gradient-to-br from-rose-500 via-brand-primary to-amber-500 flex flex-col items-center justify-center p-6 text-center"
          >
            {/* Efecto de pulsación de fondo */}
            <motion.div
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="absolute inset-0 bg-white"
            />
            
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1], 
                rotate: [0, 10, -10, 0] 
              }}
              transition={{ repeat: Infinity, duration: 0.6 }}
              className="bg-white p-12 rounded-full shadow-2xl mb-8 relative z-10"
            >
              <Sun className="w-32 h-32 text-brand-primary fill-current" />
            </motion.div>
            
            <motion.h1 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="text-6xl font-black text-white mb-4 drop-shadow-2xl relative z-10"
            >
              ⏰ ¡HORA DE DESPERTAR! ⏰
            </motion.h1>
            
            <motion.p 
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="text-white text-2xl font-black mb-12 drop-shadow-lg relative z-10"
            >
              🎮 Supera el reto para apagar la alarma 🎮
            </motion.p>
            
            <motion.button 
              onClick={() => {
                setShowAlarmOverlay(false);
                setView('child');
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              animate={{ 
                boxShadow: [
                  '0 0 20px rgba(255,255,255,0.5)',
                  '0 0 40px rgba(255,255,255,0.8)',
                  '0 0 20px rgba(255,255,255,0.5)'
                ]
              }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="relative z-10 bg-white text-rose-600 text-3xl font-black px-16 py-8 rounded-[3rem] border-b-8 border-slate-300 shadow-2xl hover:border-b-0 hover:translate-y-2 transition-all"
            >
              ✨ ¡ACEPTAR RETO! ✨
            </motion.button>
            
            <p className="text-white/70 text-sm font-bold mt-8 relative z-10">
              La alarma se apagará cuando completes el juego
            </p>
          </motion.div>
        )}

        {loading ? (
          <motion.div 
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-screen gap-6"
          >
            <div className="relative">
              <div className="w-20 h-20 border-8 border-brand-primary/20 rounded-full" />
              <div className="absolute top-0 w-20 h-20 border-8 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="font-black text-xl text-brand-primary animate-pulse tracking-tight">PREPARANDO TU MUNDO MÁGICO...</p>
          </motion.div>
        ) : childData && (
          <motion.div
            key={view + activeChildId}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {view === 'child' ? (
              <ChildDashboard data={childData} onAction={handleAction} alarmActive={alarmActive} />
            ) : (
              <ParentDashboard 
                data={childData} 
                children={childrenList}
                activeChildId={activeChildId}
                onSwitchChild={(id) => setActiveChildId(id)}
                onAddChild={(name) => handleAction('add-child', name)}
                onUpdate={(s) => handleAction('settings', s)} 
                onAddReward={(r) => handleAction('add-reward', r)}
                onDeleteReward={(id) => handleAction('delete-reward', id)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

