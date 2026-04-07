// ============================================
// 02-STATE.JS — Глобальные переменные
// ============================================
// За что отвечает:
// - Все let переменные игры
// - Игровые объекты (player, boss, и т.д.)
// - Флаги состояния
// ============================================

// Флаги состояния
let isPhase3 = false;
let isSoundOn = true;
let shouldAutoStart = false;
let isGlitchMode = false;
let isMagnetActive = false;

// Прогресс и статистика
let maxPlayerHealth = 100;
let coinsThisRun = 0;
let level = 1, coins = 0, distance = 0, runGoal = 700, bestLevel = 1, bestDistance = 0;
let combo = 0;
let shipName = "RAZOR-01";
let currentExplosionColor = 0xff0000;
let currentShopTab = 'upgrades';
let lastRunState = { isDead: false, pendingDeath: false };
let totalDistance = 0, bossesKilled = 0;
let achievements = { flawless: false, rich: false, marathon: false };
let upgradeLevels = { fire: 0, ultra: 0, speed: 0, health: 0, shield: 0, skin_striker: 0, skin_gold: 0, omega: 0 };

let playerHealth = 100, bossHealth = 400, isShieldActive = false;
let overdrive = 0, isVictory = false, isShopOpen = false, isDead = false;
let isBossFight = false, isStarted = false, isPhase2 = false, isPaused = false;

let yOffset = -50;
let currentStats = { atk: 1, spd: 1, label: "STANDARD" };
let currentShape = 'classic';
let currentSkin = 'classic';
let lang = 'ru';

// Игровые объекты (будут инициализированы в create)
let player, boss, obstacles, bullets, playerBullets;
let scoreText, levelText, bestText, bestDistText, distanceText;
let pHealthLabel, bHealthLabel, glitchText, bossShields;
let overdriveBar, roadBar, shieldAura, trailEmitter, bossTrail;
let ultraLaser = null;
let victoryFx = [];
let ultraLaserTickAt = 0;
let lastObstaclePattern = null;
let bossTurretL, bossTurretR;
let bossTurretLTrail, bossTurretRTrail;
let bossPhraseHideCall = null;
let bossPhraseText = null;
let victoryTextJitter = null;
let items, itemsTimer;
let minions, minionBullets;
let comboPopText;
let adController = null;