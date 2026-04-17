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
let isDarkMode = true;

// Прогресс и статистика
let maxPlayerHealth = 100;
let coinsThisRun = 0;
let level = 1, distance = 0, runGoal = 700, bestLevel = 1;

let _coins = 0;
let _coinsShadow = 13;
Object.defineProperty(window, 'coins', {
    get: function() {
        if (_coins * 7 + 13 !== _coinsShadow) {
            console.warn("CHEAT DETECTED: coins memory modified");
            _coins = 0;
            _coinsShadow = 13;
        }
        return _coins;
    },
    set: function(val) {
        _coins = val;
        _coinsShadow = val * 7 + 13;
    }
});

let _bestDistance = 0;
let _bestDistanceShadow = 5;
Object.defineProperty(window, 'bestDistance', {
    get: function() {
        if (_bestDistance * 3 + 5 !== _bestDistanceShadow) {
            console.warn("CHEAT DETECTED: bestDistance memory modified");
            _bestDistance = 0;
            _bestDistanceShadow = 5;
        }
        return _bestDistance;
    },
    set: function(val) {
        _bestDistance = val;
        _bestDistanceShadow = val * 3 + 5;
    }
});

let combo = 0;
let shipName = "RAZOR-01";
let currentExplosionColor = 0xff0000;
let currentShopTab = 'upgrades';
let lastRunState = { isDead: false, pendingDeath: false };
let adWatchedPendingRevive = false; // реклама просмотрена, но воскрешение не завершено
let totalDistance = 0, bossesKilled = 0;
let achievements = { 
    flawless: false, rich: false, marathon: false,
    sharpshooter: false, speedster: false, collector: false,
    survivor10: false, survivor50: false, bossSlayer: false
};
let bossesSurvived = 0;
let coinsCollectedThisRun = 0;
let usedOverdriveOnly = false;
let bossDamageTaken = 0;
let overdriveUsedToKill = false;
let dailyQuests = {};
let lastDailyReset = null;
let dailyLoginStreak = 0;
let lastLoginDate = null;
let upgradeLevels = { fire: 0, ultra: 0, speed: 0, health: 0, shield: 0, skin_striker: 0, skin_gold: 0, omega: 0, ship_tank: 0, ship_dart: 0, ship_viper: 0, ship_phase: 0, skin_crimson: 0, skin_void: 0, skin_plasma: 0, skin_solar: 0, skin_frost: 0, fx_blue: 0, fx_pink: 0, fx_rainbow: 0, fx_gold: 0, fx_green: 0, fx_red: 0, skin_rainbow: 0, skin_void_premium: 0, skin_crystal: 0, helper_drone: 0, helper_missile: 0, helper_autoshield: 0, helper_autobomb: 0, helper_autoheal: 0, helper_mercenary: 0, up_extralife: 0, up_doubleDMG: 0, up_enhanced: 0 };

let playerHealth = 100, bossHealth = 400, isShieldActive = false;
let overdrive = 0, isVictory = false, isShopOpen = false, isDead = false;
let isBossFight = false, isStarted = false, isPhase2 = false, isPaused = false;

let yOffset = -50;
let currentStats = { atk: 1, spd: 1, label: "STANDARD" };
let currentShape = 'classic';
let currentSkin = 'classic';
let lang = 'en';

// Игровые объекты (будут инициализированы в create)
let player, boss, obstacles, bullets, playerBullets, playerMissiles;
let scoreText, levelText, bestText, bestDistText, distanceText;
let pHealthLabel, bHealthLabel, glitchText, bossShields, rankXPText;
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
let viperShotCounter = 0;
let wallZoneGraphics = null;
let currentWallZone = -1;
let wallZoneTimer = null;
let baseSlowmoDuration = 3000;
let dualCores = [];
let dualCoreAngle = 0;
let secondCore = null;
let stormZoneGraphics = null;
let stormAngle = 0;
let stormZoneCount = 3;
let absorbedBullets = 0;
let voidAbsorbGraphics = null;
let voidAbsorbRadius = 80;
let voidChargeLevel = 0;
let currentRank = 'rookie';
let rankXP = 0;
let rankXPNext = 1000;
let rankXPDistanceAccum = 0;

let lastTapTime = 0;
let lastEmpTime = 0;
let isSlowMoActive = false;
let slowMoTimer = null;
let slowMoCooldown = 0;