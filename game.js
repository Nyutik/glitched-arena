const SHARE_LINK = "https://t.me/GlitchedArenaBot";
const botUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : 'https://glitched-arena.onrender.com';
const ASSETS = {
    BGM: 'assets/Cyberpunk 2.mp3',
    SFX_ULTRA: 'assets/futuristic-cyberpunk-digi-ivvyqv4k.wav',
    SFX_COMBO: 'assets/Cyberpunk_Alert.mp3',
    SFX_NUKE: 'assets/Star_Wars-Siren.mp3'
};

// Глобальные переменные
let isPhase3 = false;
let isSoundOn = true;
let shouldAutoStart = false;
let maxPlayerHealth = 100;
let coinsThisRun = 0;
let level = 1, coins = 0, distance = 0, runGoal = 700, bestLevel = 1, bestDistance = 0;
let combo = 0;
let lastRunState = { isDead: false, pendingDeath: false };
let isGlitchMode = false;
let comboPopText;
let isMagnetActive = false;
let bossTurretL, bossTurretR;
let bossTurretLTrail, bossTurretRTrail;
let upgradeLevels = { fire: 0, ultra: 0, speed: 0, health: 0, shield: 0, skin_striker: 0, skin_gold: 0, omega: 0 };
let playerHealth = 100, bossHealth = 400, isShieldActive = false;
let overdrive = 0, isVictory = false, isShopOpen = false, isDead = false, isBossFight = false, isStarted = false, isPhase2 = false, isPaused = false;

let player, boss, obstacles, bullets, playerBullets, scoreText, levelText, bestText, bestDistText, distanceText, pHealthLabel, bHealthLabel, glitchText, bossShields;
let overdriveBar, roadBar, shieldAura, trailEmitter, bossTrail;
let items, itemsTimer;
let minions, minionBullets;
let yOffset = -50;
let currentStats = { atk: 1, spd: 1, label: "STANDARD" };
let currentShape = 'classic';
let currentSkin = 'classic';
const SKIN_DATA = {
    classic: { body: 0x00ffff, eyes: 0xffffff, trail: 0x00ffff, bullet: 0x00ffff, alpha: 1 },
    phantom: { body: 0x9900ff, eyes: 0x00ffff, trail: 0x9900ff, bullet: 0x9900ff, alpha: 1 },
    gold:    { body: 0xffff00, eyes: 0x000000, trail: 0xffaa00, bullet: 0xffff00, alpha: 1 }, // Золотые пули!
    neon:    { body: 0xff0055, eyes: 0xffffff, trail: 0xff0055, bullet: 0xff0055, alpha: 1 },
    ghost:   { body: 0x00ffff, eyes: 0xff00ff, trail: 0xffffff, bullet: 0xffffff, alpha: 0.5 } // Белые пули
};
let lang = 'ru';
const TRANSLATIONS = {
    en: {
        // Меню
        menu_title: "GLITCHED\nARENA",
        start: ">> START SYSTEM",
        shop: ">> DATA SHOP",
        hangar: ">> SHIP HANGAR",
        settings: ">> PILOT SETTINGS",
        rules: ">> SYSTEM MANUAL",
        top: ">> GLOBAL RANKINGS",
        audio: "AUDIO",
        back: "<< BACK TO MENU",
        offset_label: "OFFSET",
        higher: "HIGHER",
        lower: "LOWER",
        apply: "<< APPLY & EXIT",

        // HUD
        credits: "CREDITS",
        sector: "SEC",
        best: "BEST",
        max_dist: "MAX DIST",
        hp_label: "HP",
        core_label: "CORE",
        tap_ultra: "!! TAP TO BLAST !!",
        combo_text: "COMBO",
        hyper_glitch: "!!! HYPER_GLITCH: 3x GOLD !!!",
        pause_text: "PAUSE",

        p1: ["SCANNING...", "TARGET_LOCKED", "DATA_TRESPASSER"],
        p2: ["SYSTEM_OVERLOAD", "CRITICAL_RAGE", "DELETING_YOU"],
        audio_glitch: "SYSTEM_AUDIO_FAILURE",
        boss_detected: "MEGA_BOSS_DETECTED",
        defense_engaged: "ELITE_DEFENSE_ENGAGED",
        core_destroyed: "CORE DESTROYED!",
        v_on: "ON", v_off: "OFF",
        share_taunt_1: "SCANNING_NEW_VICTIM... This human is weak. Can you do better?",
        share_taunt_2: "SYSTEM_WARNING: Sector %lvl% breached! I need a real challenge. Are you the one?",
        share_taunt_3: "!! CORE_OVERLOAD !! I've deleted thousands. You're next. Try to survive if you dare!",
        share_invite: "I'm on Sector %lvl%! Beat my record of %dist%m in Glitched Arena!",
        db_connecting: "CONNECTING_TO_DATABASE...",
        db_empty: "NO RECORDS YET",
        db_error: "CONNECTION_ERROR: OFFLINE",
        sys_failure: "!! SYSTEM_FAILURE !!",
        heroic_survival: "HEROIC_SURVIVAL",
        revive_label: "REVIVE",
        watch_ad_label: "WATCH AD (FREE REBOOT)",
        hard_reboot_label: "HARD REBOOT (SEC 1)",
        loading_ad: "LOADING_AD...",
        to_mega_boss: "TO MEGA_BOSS",
		distance_to: "DISTANCE TO BOSS",
		elite_phase: "ELITE PHASE",
        critical_race: "CRITICAL_RAGE",
		system_halt: "!! SYSTEM_HALT: CORE_OVERLOAD !!",
        warning_boss: "!! WARNING !!\nBOSS APPROACHING",
        quantum_alert: "QUANTUM_PHANTOM_DETECTED",

        // Магазин
        shop_title: "DATA SHOP",
        install: "INSTALLED",
        maxed: "MAXED",
        up_antenna: "ULTRA ANTENNA", desc_antenna: "Ult charges 75% faster",
        up_cannons: "DUAL CANNONS", desc_cannons: "Extreme 3-way firepower",
        up_speed: "SPEED BOOST", desc_speed: "+10% running speed",
        up_hull: "REINFORCED HULL", desc_hull: "+25 Max HP & Full Heal",
        up_shield: "EMERGENCY SHIELD", desc_shield: "Protects from one hit",
        skin_striker: "VOID STRIKER", desc_striker: "Dangerous Triangle (+20% ATK)",
        skin_gold: "GOLD SKIN", desc_gold: "Pure gold style (+10% ATK)",
        skin_ghost: "NEON GHOST", desc_ghost: "Cyberpunk ghost (+15% SPD)",
        invite: "👥 INVITE FRIEND +500",
        invite_done: "INVITATION SENT ✓",
        claimed: "BONUS CLAIMED ✓",
        deploy_btn: ">> DEPLOY SECTOR",
        active_label: "EQUIPPED",
        up_omega: "OMEGA CORE", desc_omega: "Requires Level 40. Ultra recharges on every minion kill!",
        stars_label: "STARS",
        up_coins: "DATA PACK", desc_coins: "+1000 Credits instantly",

        // Ангар и Интел
        hangar_title: "SHIP HANGAR",
        hull_type: "--- HULL_TYPE ---",
        visual_skin: "--- VISUAL_SKIN ---",
        target: "TARGET",
        suggest: "SUGGEST",
        classic_box: "CLASSIC BOX",
        cyan_neon: "CYAN NEON",
        boss_scanning: "SCANNING_SECTOR_",

        // Правила (Инструкция)
        rules_header: "SYSTEM_MANUAL v1.2",
        rule_wall: "RED_WALL: Lethal. Avoid it!",
        rule_coin: "CREDITS: For upgrades.",
        rule_heart: "HEART: +25% Hull Integrity.",
        rule_nuke: "SYSTEM_NUKE: Purge all threats.",
        rule_magnet: "MAGNET: Pull credits.",
        rule_slowmo: "SLOW_MO: Stabilize time.",
        rules_alerts: "--- SECTOR_ALERTS ---",
        slide: "SLIDE TO MOVE",
        rules_sec_15: "SEC 15: MEGA_BOSS (Side Turrets)",
        rules_sec_20: "SEC 20: ELITE_SHIELDS (Orbital Defense)",
        rules_sec_30: "SEC 30: CORE_OVERLOAD (Bullet Hell)",
        rules_sec_35: "SEC 35: QUANTUM PHANTOM (Teleport)",
        strategy_tip: "STRATEGY: Visit the DATA_SHOP! Upgrade Firepower, Speed, and install SHIELDS to survive.",

        // Состояния
        lost: "CONNECTION_LOST",
        revive: "REVIVE",
        watch_ad: "FREE REBOOT (AD)",
        hard_reboot: "HARD REBOOT (SEC 1)",
        purified: "SYSTEM_PURIFIED",
        magnet_on: "MAGNET_LINK_ACTIVE",
        time_warp: "TIME_WARP_ACTIVE"
    },
    ru: {
        // Меню
        menu_title: "ГЛИТЧ\nАРЕНА",
        start: ">> ЗАПУСК СИСТЕМЫ",
        shop: ">> МАГАЗИН ДАННЫХ",
        hangar: ">> АНГАР КОРАБЛЯ",
        settings: ">> КАЛИБРОВКА",
        rules: ">> ИНСТРУКЦИЯ",
        top: ">> РЕЙТИНГ ПИЛОТОВ",
        audio: "ЗВУК",
        back: "<< В ГЛАВНОЕ МЕНЮ",
        offset_label: "ОТСТУП",
        higher: "ВЫШЕ",
        lower: "НИЖЕ",
        apply: "<< ПРИМЕНИТЬ",

        // HUD
        credits: "КРЕДИТЫ",
        sector: "СЕКТОР",
        best: "РЕКОРД",
        max_dist: "ДИСТАНЦИЯ",
        hp_label: "ОЗ",
        core_label: "ЯДРО",
        tap_ultra: "!! ЖМИ ДЛЯ УЛЬТЫ !!",
        combo_text: "КОМБО",
        hyper_glitch: "!!! ГИПЕР-ГЛИТЧ: 3x ЗОЛОТО !!!",
        pause_text: "ПАУЗА",

        p1: ["СКАНИРОВАНИЕ...", "ЦЕЛЬ_ЗАХВАЧЕНА", "НАРУШИТЕЛЬ_ДАННЫХ"],
        p2: ["ПЕРЕГРУЗКА_СИСТЕМЫ", "КРИТИЧЕСКАЯ_ЯРОСТЬ", "УДАЛЕНИЕ_ОБЪЕКТА"],
        audio_glitch: "ОШИБКА_АУДИО_СИСТЕМЫ",
        boss_detected: "ОБНАРУЖЕН_МЕГА_БОСС",
        defense_engaged: "ЭЛИТНАЯ_ЗАЩИТА_АКТИВНА",
        core_destroyed: "ЯДРО УНИЧТОЖЕНО!",
        v_on: "ВКЛ", v_off: "ВЫКЛ",
        share_taunt_1: "СКАНИРОВАНИЕ_ЖЕРТВЫ... Этот человек слаб. Ты справишься лучше?",
        share_taunt_2: "ВНИМАНИЕ: Сектор %lvl% взломан! Мне нужен достойный противник. Это ты?",
        share_taunt_3: "!! ПЕРЕГРУЗКА_ЯДРА !! Я удалил тысячи. Ты следующий. Попробуй выжить, если рискнешь!",
        share_invite: "Я в Секторе %lvl%! Побей мой рекорд в %dist%м в Glitched Arena!",
        db_connecting: "ПОДКЛЮЧЕНИЕ_К_БАЗЕ_ДАННЫХ...",
        db_empty: "ЗАПИСЕЙ ПОКА НЕТ",
        db_error: "ОШИБКА_СВЯЗИ: ОФФЛАЙН",
        sys_failure: "!! СИСТЕМНЫЙ_СБОЙ !!",
        heroic_survival: "ГЕРОИЧЕСКОЕ_ВЫЖИВАНИЕ",
        revive_label: "ВОСКРЕСНУТЬ",
        watch_ad_label: "РЕКЛАМА (БЕСПЛАТНЫЙ РЕБУТ)",
        hard_reboot_label: "ХАРД-РЕБУТ (СЕКТОР 1)",
        loading_ad: "ЗАГРУЗКА_РЕКЛАМЫ...",
        to_mega_boss: "ДО МЕГА_БОССА",
        distance_to: "РАССТОЯНИЕ ДО БОССА",
        elite_phase: "ЭЛИТНАЯ ФАЗА",
        critical_race: "КРИТИЧЕСКАЯ ЯРОСТЬ",
		system_halt:"!! СИСТЕМНАЯ ОСТАНОВКА: ПЕРЕГРУЗКА ЯДРА !!",
        warning_boss: "!! ВНИМАНИЕ !!\nБОСС ПРИБЛИЖАЕТСЯ",
        quantum_alert: "ОБНАРУЖЕН_КВАНТОВЫЙ_ФАНТОМ",

        // Магазин
        shop_title: "МАГАЗИН ДАННЫХ",
        install: "УСТАНОВЛЕНО",
        maxed: "МАКСИМУМ",
        up_antenna: "УЛЬТРА-АНТЕННА", desc_antenna: "Зарядка ульты на 75% быстрее",
        up_cannons: "ДВОЙНЫЕ ПУШКИ", desc_cannons: "Тройная огневая мощь",
        up_speed: "УСКОРЕНИЕ", desc_speed: "+10% к скорости полета",
        up_hull: "УСИЛЕННЫЙ КОРПУС", desc_hull: "+25 макс. ОЗ и лечение",
        up_shield: "АВАРИЙНЫЙ ЩИТ", desc_shield: "Защита от одного удара",
        skin_striker: "РАССЕКАТЕЛЬ БЕЗДНЫ", desc_striker: "Форма треугольника (+20% АТК)",
        skin_gold: "ЗОЛОТОЙ ОБЛИК", desc_gold: "Стиль из чистого золота (+10% АТК)",
        skin_ghost: "НЕОНОВЫЙ ПРИЗРАК", desc_ghost: "Призрачный стиль (+15% СКОР)",
        invite: "👥 ПРИГЛАСИТЬ ДРУГА +500",
        invite_done: "ПРИГЛАШЕНИЕ ОТПРАВЛЕНО ✓",
        claimed: "БОНУС ПОЛУЧЕН ✓",
        deploy_btn: ">> В СЛЕД. СЕКТОР",
        active_label: "ВЫБРАНО",
        up_omega: "ОМЕГА-ЯДРО", desc_omega: "Доступно с 40 уровня. Ульта восстанавливается при каждом уничтожении миньона!",
        stars_label: "ЗВЕЗДЫ",
        up_coins: "ПАКЕТ ДАННЫХ", desc_coins: "+1000 Кредитов мгновенно",

        // Ангар и Интел
        hangar_title: "АНГАР КОРАБЛЯ",
        hull_type: "--- ТИП КОРПУСА ---",
        visual_skin: "--- ОБЛИК ---",
        target: "ЦЕЛЬ",
        suggest: "СОВЕТ",
        classic_box: "КЛАССИКА",
        cyan_neon: "ГОЛУБОЙ НЕОН",
        boss_scanning: "СЕКТОР_СКАН_",

        // Правила
        rules_header: "ИНСТРУКЦИЯ v1.2",
        rule_wall: "СТЕНА: Смертельно. Избегай!",
        rule_coin: "КРЕДИТЫ: Для улучшений.",
        rule_heart: "СЕРДЦЕ: +25% прочности.",
        rule_nuke: "ЯДЕРКА: Очистка экрана.",
        rule_magnet: "МАГНИТ: Притягивает золото.",
        rule_slowmo: "ЗАМЕДЛЕНИЕ: Контроль времени.",
        rules_alerts: "--- ТРЕВОГИ СЕКТОРОВ ---",
        slide: "ВЕДИ, ЧТОБЫ ДВИГАТЬСЯ",
        rules_sec_15: "СЕКТОР 15: МЕГА_БОСС (Боковые турели)",
        rules_sec_20: "СЕКТОР 20: ЭЛИТНЫЕ ЩИТЫ (Орбитальная защита)",
        rules_sec_30: "СЕКТОР 30: ПЕРЕГРУЗКА ЯДРА (Безумный огонь)",
        rules_sec_35: "СЕКТОР 35: КВАНТОВЫЙ ФАНТОМ (Телепортация)",
        strategy_tip: "СТРАТЕГИЯ: Зайди в МАГАЗИН! Качай пушки, скорость и ставь ЩИТЫ, чтобы выжить.",

        // Состояния
        lost: "СВЯЗЬ ПОТЕРЯНА",
        revive: "ВОССТАНОВИТЬ",
        watch_ad: "РЕБУТ (ЗА РЕКЛАМУ)",
        hard_reboot: "ХАРД-РЕБУТ (СЕК 1)",
        purified: "СИСТЕМА ОЧИЩЕНА",
        magnet_on: "МАГНИТНЫЙ ЗАХВАТ",
        time_warp: "ВРЕМЯ ЗАМЕДЛЕНО"
    }
};

let adController = null;

window.addEventListener('load', () => {
    if (window.Adsgram) {
        adController = window.Adsgram.init({ blockId: "25945" });
    }
});

// --- СИСТЕМА СОХРАНЕНИЯ (ЕДИНЫЙ КЛЮЧ) ---
const saveProgress = () => {
    if (isVictory && (level - 1) > bestLevel) bestLevel = level - 1;
    let currentDist = Math.floor(distance);
    if (currentDist > bestDistance) bestDistance = currentDist;

    localStorage.setItem('GLITCHED_ARENA_MASTER_SAVE_V2', JSON.stringify({
        level,
        lang,
        upgradeLevels,
        bestLevel,
        coins,
        bestDistance,
        maxPlayerHealth,
        isShieldActive,
        yOffset: yOffset,
        currentShape: currentShape,
        currentSkin: currentSkin,
        isDeadInSave: isDead,
        lastRunState
    }));
};

const loadProgress = () => {
    // 1. Сначала определяем язык по умолчанию из системы
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code) {
        let tgLang = window.Telegram.WebApp.initDataUnsafe.user.language_code;
        lang = (tgLang === 'ru') ? 'ru' : 'en';
    }

    const saved = localStorage.getItem('GLITCHED_ARENA_MASTER_SAVE_V2');
    if (saved) {
        const p = JSON.parse(saved);
        if (p.lang) lang = p.lang;

        level = p.level || 1;
        bestLevel = p.bestLevel || 1;
        bestDistance = p.bestDistance || 0;
        coins = p.coins || 0;
        maxPlayerHealth = p.maxPlayerHealth || 100;
        isShieldActive = p.isShieldActive || false;
        currentShape = p.currentShape || 'classic';
        currentSkin = p.currentSkin || 'classic';
        yOffset = p.yOffset !== undefined ? p.yOffset : -50;
        isDead = p.isDeadInSave || false;
        lastRunState = p.lastRunState || { isDead: false, pendingDeath: false };

        // ВАЖНО: Объединяем старое сохранение с новыми ключами апгрейдов
        upgradeLevels = { ...upgradeLevels, ...p.upgradeLevels };

        runGoal = 700 + (level - 1) * 100;
    }
};
loadProgress();

const config = {
    type: Phaser.AUTO,
    width: 375,
    height: 667,
    backgroundColor: '#000000',
    parent: 'game-container',
    render: {
        pixelArt: false, // Для четких шрифтов
        antialias: true,
        roundPixels: true // Чтобы объекты не "дрожали" между пикселями
    },
    physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
    scene: { preload, create, update }
};
const game = new Phaser.Game(config);

function preload() {
    this.load.audio('sfx_ultra', ASSETS.SFX_ULTRA);
    this.load.audio('bgm', ASSETS.BGM);
    this.load.audio('sfx_combo', ASSETS.SFX_COMBO);
    this.load.audio('sfx_nuke', ASSETS.SFX_NUKE);

    let g = this.make.graphics({ x: 0, y: 0, add: false });
    // БОСС
    g.clear().lineStyle(4, 0xff00ff).strokeCircle(30, 30, 26).lineStyle(2, 0x00ffff).strokeRect(15, 15, 30, 30).fillStyle(0xff00ff, 1).fillTriangle(30, 20, 20, 40, 40, 40);
    g.generateTexture('boss', 60, 60);
    // ОБЪЕКТЫ
    g.clear().fillStyle(0xffffff).fillRect(0, 0, 8, 8).generateTexture('pixel', 8, 8);
    g.clear().fillStyle(0xffff00).fillRect(0, 0, 25, 600).generateTexture('laser', 25, 600);
    g.clear().fillStyle(0xff0000, 0.9).fillRect(0, 0, 80, 25).generateTexture('wall', 80, 25);
    g.clear().lineStyle(2, 0x00ffff, 0.5).strokeCircle(25, 25, 22).generateTexture('shield_aura', 50, 50);
    g.clear().fillStyle(0xff0088).fillTriangle(15, 10, 5, 20, 25, 20).fillCircle(10, 10, 6).fillCircle(20, 10, 6);
    g.generateTexture('heart', 30, 30);
}

function create() {
    if (window.adController) adController = window.adController;
    currentStats = getShipStats();
    // ВЫЗЫВАЕМ СИНХРОНИЗАЦИЮ
    syncUserData.call(this);
    isPhase3 = false;
    isVictory = false;
    isShopOpen = false;
    isDead = false;
    isBossFight = false;
    distance = 0; overdrive = 0; isPhase2 = false; isStarted = false; isPaused = false;
    playerHealth = maxPlayerHealth; bossHealth = 400 * (1 + level * 0.45);
    isMagnetActive = false;
    isGlitchMode = false;
    this.physics.world.timeScale = 1;

    // Создаем простую звездную пыль на фоне
    this.stars = this.add.particles(0, 0, 'pixel', {
        x: { min: 0, max: 375 },
        y: -10,
        speedY: { min: 100, max: 300 },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 3000,
        frequency: 40,
        tint: 0xffffff
    }).setDepth(0);

    if (shouldAutoStart) {
        shouldAutoStart = false;
        isStarted = true;
        // Запускаем системы сразу
        if (isSoundOn) this.sound.play('bgm', {loop:true, volume:0.15});
        this.obstacleTimer = this.time.addEvent({ delay: Math.max(300, 1150 - level * 50), callback: spawnObstacle, callbackScope: this, loop: true });
        this.shootEvent = this.time.addEvent({ delay: 150 - (upgradeLevels.fire * 20), callback: playerShoot, callbackScope: this, loop: true });
        itemsTimer = this.time.addEvent({ delay: 1000, callback: spawnItem, callbackScope: this, loop: true });
    } else {
        showMenu(this);
    }

    this.add.grid(187, 333, 800, 1200, 40, 40, 0x00ffff, 0.03);
    obstacles = this.physics.add.group();
    bullets = this.physics.add.group();
    playerBullets = this.physics.add.group();
    bossShields = this.physics.add.group();

    // Группа для предметов, которые можно подобрать
    items = this.physics.add.group();

    minions = this.physics.add.group();
    minionBullets = this.physics.add.group();

    // Таймер появления предметов (монетки и бонусы летят чаще стен)
    this.itemTimer = this.time.addEvent({
        delay: 800,
        callback: spawnItem,
        callbackScope: this,
        loop: true
    });

    // ГЕНЕРАЦИЯ ИГРОКА
    const pTex = generatePlayerTexture(this);
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
        const userId = Telegram.WebApp.initDataUnsafe.user.id;
    }
    // Игрок всегда внизу (600px)
    player = this.physics.add.sprite(187, 600, pTex).setDepth(10).setCollideWorldBounds(true);
    shieldAura = this.add.sprite(player.x, player.y, 'shield_aura').setDepth(11).setVisible(false);
    this.isFirstMove = false;

    this.input.on('pointermove', (p) => {
        if (isStarted && !isShopOpen && !isDead && !isPaused) {
            // Двигаем корабль только если игрок уже начал вести пальцем/мышью
            if (!this.isFirstMove) {
                // Если курсор слишком далеко от низа при старте, игнорируем резкий скачок
                if (Math.abs(p.y - 600) < 100) this.isFirstMove = true;
                else return;
            }
            player.x = p.x;
            player.y = p.y + yOffset;
            shieldAura.setPosition(player.x, player.y);
        }
    });

    // НАСТОЯЩИЙ ШЛЕЙФ
    const skin = SKIN_DATA[currentSkin] || SKIN_DATA.classic;

    trailEmitter = this.add.particles(0, 0, 'pixel', {
        speed: 60,
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.4, end: 0 },
        lifespan: 600,
        blendMode: 'ADD',
        follow: player,
        tint: skin.trail
    });

    boss = this.physics.add.sprite(187, -200, 'boss')
    .setDepth(5)
    .setImmovable(true)
    .setVisible(false)
    .clearTint();

    // ШЛЕЙФ ДЛЯ БОССА
    bossTrail = this.add.particles(0, 0, 'pixel', {
        speed: 40,
        scale: { start: 0.9, end: 0 },
        alpha: { start: 0.5, end: 0 },
        lifespan: 700,
        blendMode: 'ADD',
        tint: 0xff00ff,
        follow: boss
    });
    bossTrail.setParticleTint(0xff00ff);

    // --- HUD v5.5: АВТО-ДИЗАЙН ---
    // Строка 1: Основная инфа
    scoreText = this.add.text(10, 15, `${TRANSLATIONS[lang].credits}: ${coins}`, { fontFamily: 'Courier New', fontSize: '14px', fill: '#ffff00' }).setDepth(100);
    levelText = this.add.text(365, 15, `${TRANSLATIONS[lang].sector}: ${level}`, { fontFamily: 'Courier New', fontSize: '14px', fill: '#ff00ff' }).setOrigin(1, 0).setDepth(100);
    // Строка 2: Рекорды и Пауза
    bestText = this.add.text(10, 35, `${TRANSLATIONS[lang].best}: ${bestLevel}`, { fontFamily: 'Courier New', fontSize: '10px', fill: '#00ff00' }).setDepth(100);
    bestDistText = this.add.text(187, 35, `${TRANSLATIONS[lang].max_dist}: ${bestDistance}m`, { fontFamily: 'Courier New', fontSize: '12px', fill: '#ffff00', fontWeight: 'bold' }).setOrigin(0.5, 0).setDepth(100);

    // Кнопка паузы с неоновой подложкой
    let pauseBg = this.add.rectangle(335, 42, 60, 20, 0xff00ff, 0.2).setDepth(99).setInteractive();
    pauseBtn = this.add.text(335, 42, TRANSLATIONS[lang].pause_text, { fontSize: '11px', fontFamily: 'Courier New', fill: '#fff' }).setOrigin(0.5).setDepth(100).setInteractive();

    const doPause = () => togglePause.call(this);
    pauseBtn.on('pointerdown', doPause);
    pauseBg.on('pointerdown', doPause);

    // Строка 3: Здоровье
    pHealthLabel = this.add.text(10, 65, 'YOU: 100/100', { fontFamily: 'Arial', fontSize: '12px', fill: '#00ffff' }).setDepth(100);
    bHealthLabel = this.add.text(365, 65, '', { fontFamily: 'Arial', fontSize: '12px', fill: '#ff00ff' }).setOrigin(1, 0).setDepth(100);

    // Строка 4: Прогресс уровня и Элиты
    distanceText = this.add.text(187, 105, '', { fontFamily: 'Arial', fontSize: '14px', fill: '#00ffff', align: 'center' }).setOrigin(0.5, 0).setDepth(100);
    glitchText = this.add.text(187, 300, '', {
        fontFamily: 'Arial',
        fontSize: '22px',
        stroke: '#000',
        strokeThickness: 6,
        align: 'center',
        wordWrap: { width: 340 }
    }).setOrigin(0.5).setDepth(100);
    // Графика полосок
    overdriveBar = this.add.graphics().setDepth(100);
    roadBar = this.add.graphics().setDepth(100);
    this.overheadGfx = this.add.graphics().setDepth(11);


    this.physics.add.overlap(player, obstacles, (p, o) => { o.destroy(); handleDamage(this, 35); });
    this.physics.add.overlap(player, bullets, (p, b) => { b.destroy(); handleDamage(this, 15); });
    this.physics.add.overlap(boss, playerBullets, hitBoss, null, this);
    this.physics.add.overlap(player, items, collectItem, null, this);
    this.physics.add.overlap(minions, playerBullets, (minion, bullet) => {
        let mx = minion.x;
        let my = minion.y;

        minion.destroy();
        bullet.destroy();

        coinsThisRun += 5;
        scoreText.setText(`${TRANSLATIONS[lang].credits}: ${coins + coinsThisRun}`);

        minionExplode(this, mx, my);
    });

    // Урон от миньонов и их пуль
    this.physics.add.overlap(player, minionBullets, (p, b) => { b.destroy(); handleDamage(this, 10); });
    this.physics.add.overlap(player, minions, (p, m) => { m.destroy(); handleDamage(this, 20); });

    this.physics.add.overlap(bossShields, playerBullets, (s, b) => { b.destroy(); s.setAlpha(1); this.time.delayedCall(100, () => s.setAlpha(0.4)); });

    this.input.on('pointerdown', () => {
        if (isStarted && overdrive >= 100 && !isPaused && !isDead && !isVictory) {
            useOverdrive.call(this);
        }
    });

    this.comboSound = this.sound.add('sfx_combo', { volume: 0.3 });

    comboPopText = this.add.text(0, 0, '', {
        fontFamily: 'Arial', fontSize: '18px', fill: '#00ff00', fontWeight: 'bold', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(100).setAlpha(0);

}

function update(time, delta) {
    if (!isStarted || isShopOpen || isVictory || isDead || isPaused) return;

    // 1. Очистка и Магнит (Исправлен вложенный цикл)
    bullets.children.each(b => { if (b && (b.y > 750 || b.y < -100)) b.destroy(); });
    playerBullets.children.each(b => { if (b && b.y < -100) b.destroy(); });
    items.children.each(i => {
        if (i && i.active) {
            if (isMagnetActive && i.getData('type') === 'coin') {
                let angle = Phaser.Math.Angle.Between(i.x, i.y, player.x, player.y);
                i.body.setVelocity(Math.cos(angle) * 600, Math.sin(angle) * 600);
            }
            if (i.y > 750) i.destroy();
        }
    });

    // 2. Враги и Комбо
    obstacles.children.each(o => {
        if (o && o.active) {
            if (o.getData('isDrone')) {
                let speedX = (player.x - o.x) * 2.5;
                o.body.setVelocityX(speedX);
                o.setAlpha(0.7 + Math.sin(time * 0.01) * 0.3);
            }
            if (!o.getData('missed') && Math.abs(o.x - player.x) < 75 && Math.abs(o.y - player.y) < 30) {
                o.setData('missed', true);
                showComboEffect(this);
            }
            if (o.y > 750) o.destroy();
        }
    }, this);

    minions.children.each(m => {
        if (m && m.active) {
            m.getData('state') === 'hunting' ? m.body.setVelocity((player.x - m.x) * 3, 100) : m.body.setVelocity(0, 50);
            if (m.y > 750) m.destroy();
        }
    });
    minionBullets.children.each(b => { if (b && b.y > 750) b.destroy(); });

    // 3. Дистанция и Босс
    if (!isBossFight) {
        // Скорость растет от уровня и прокачки
        distance += delta * (0.08 + level * 0.01 + upgradeLevels.speed * 0.03) * currentStats.spd;
        let currentDist = Math.floor(distance);

        if (currentDist > bestDistance) {
            bestDistance = currentDist;
            bestDistText.setText(`${TRANSLATIONS[lang].max_dist}: ${bestDistance}m`).setFill('#ffff00');
        }

        // Полоска прогресса (под рекордом)
        let prog = Math.min(distance / runGoal, 1);
        roadBar.clear().fillStyle(0xffffff, 0.2).fillRect(100, 50, 175, 2).fillStyle(0x00ffff, 1).fillRect(100, 50, prog * 175, 2);

        // ТЕКСТ ДИСТАНЦИИ
        let toBoss = Math.max(0, Math.floor(runGoal - distance));
        let label = level < 15 ? `${TRANSLATIONS[lang].to_mega_boss}: ${15 - level} ${TRANSLATIONS[lang].sector}` : `${TRANSLATIONS[lang].elite_phase}: ${level}`;
        distanceText.setY(105).setText(`${currentDist}m\n${label}\n${TRANSLATIONS[lang].distance_to}: ${toBoss}m`);

        if (distance >= runGoal) startBossFight(this);
    } else {
        // Логика Босса (движение и вращение щитов)
        let t = time * 0.001;
        if (isPhase3) {
            // Босс встает в центр и вибрирует
            boss.x = 187 + Math.sin(time * 0.05) * 5;
            boss.y = 150 + Math.cos(time * 0.05) * 5;
            boss.angle += 20; // Бешеное вращение
        } else {
            // Обычное движение
            boss.x = 187 + Math.sin(t * 1.8) * 140;
            boss.y = 160 + Math.cos(t * 1.2) * 50;
            boss.angle += isPhase2 ? 15 : 2;
        }

        if (bossTurretL && bossTurretL.active) {
            bossTurretL.setPosition(boss.x - 50, boss.y + 10);
            bossTurretR.setPosition(boss.x + 50, boss.y + 10);
        }

        if (level >= 20 && bossShields.getLength() > 0) {
            Phaser.Actions.RotateAroundDistance(bossShields.getChildren(), boss, 0.03, 110);
            bossShields.children.each(s => { s.setTint(isPhase2 ? 0xff0000 : 0xff00ff); });
        }

        if (boss && boss.active) {
            boss.x += (Math.random() - 0.5) * 2;
            boss.y += (Math.random() - 0.5) * 2;
        }
        distanceText.setText(""); // Скрываем во время боя
    }

    // 4. ЕДИНСТВЕННАЯ ЖЕЛТАЯ ПОЛОСКА
    overdriveBar.clear().fillStyle(0x333333).fillRect(87, 645, 200, 8).fillStyle(0xffff00).fillRect(87, 645, (overdrive/100) * 200, 8);
        // Создаем или обновляем мигающую надпись
        if (overdrive >= 100) {
        overdriveBar.setX(Math.sin(time * 0.1) * 3);
        if (!this.ovrText) {
            this.ovrText = this.add.text(player.x, player.y - 65, TRANSLATIONS[lang].tap_ultra, {
                fontFamily: 'Courier New', fontSize: '20px', fill: '#ffff00', fontWeight: 'bold', stroke: '#000', strokeThickness: 5
            }).setOrigin(0.5).setDepth(100);
            this.tweens.add({ targets: this.ovrText, alpha: 0.3, duration: 300, yoyo: true, repeat: -1 });
        }
        this.ovrText.setPosition(player.x, player.y - 65);
        player.setTint(0xffff00);
    } else {
        if (this.ovrText) { this.ovrText.destroy(); this.ovrText = null; }
        player.clearTint();
    }

    // 1. Эффект "огня" для пуль
    [bullets, playerBullets, minionBullets].forEach(group => {
        group.children.each(b => {
            if (b && b.active) {
                let trail = this.add.rectangle(b.x, b.y, b.displayWidth * 0.4, b.displayHeight * 0.4, b.tintTopLeft).setAlpha(0.4).setDepth(b.depth - 1);
                this.tweens.add({ targets: trail, scale: 0, alpha: 0, duration: 70, onComplete: () => trail.destroy() });
            }
        });
    });

    // 2. ОТРИСОВКА ИНФО НАД ГОЛОВОЙ (Вне цикла пуль!)
    if (this.overheadGfx && this.overheadGfx.active && !isVictory) {
        this.overheadGfx.clear();

        if (player && player.active) {
            let pPct = playerHealth / maxPlayerHealth;
            let hudY = player.y - (player.displayHeight / 2) - 20;
            let barW = 40;
            let barColor = 0x00ffff;

            // ЭФФЕКТ ПАНИКИ (HP < 20)
            if (playerHealth < 20) {
                let pulse = Math.abs(Math.sin(time * 0.015));
                barColor = pulse > 0.5 ? 0xff0000 : 0x660000;
                // Трясем текст для эффекта страха
                pHealthLabel.setX(player.x + Math.random() * 4 - 2);
                pHealthLabel.setFill('#ff0000');
            } else {
                pHealthLabel.setX(player.x).setFill('#00ffff');
            }

            // Рисуем полоску
            this.overheadGfx.fillStyle(0x000000, 0.5).fillRect(player.x - barW/2, hudY, barW, 4);
            this.overheadGfx.fillStyle(barColor).fillRect(player.x - barW/2, hudY, barW * pPct, 4);

            // Текст НАД полоской
            pHealthLabel.setPosition(player.x, hudY - 12).setOrigin(0.5)
            .setText(`${Math.ceil(playerHealth)} ${TRANSLATIONS[lang].hp_label}`);
        }

        // --- HUD БОССА ---
        if (isBossFight && boss && boss.visible) {
            let maxB = 400 * (1 + level * 0.45);
            let bPct = Math.max(0, bossHealth / maxB);
            let hudY = boss.y - (boss.displayHeight * boss.scale / 2) - 25;
            let barW = 100;

            // Цвет полоски босса (красный в ярости)
            let bColor = level >= 35 ? 0x00ff00 : (isPhase2 ? 0xff0000 : 0xff00ff);

            this.overheadGfx.fillStyle(0x000000, 0.5).fillRect(boss.x - barW/2, hudY, barW, 6);
            this.overheadGfx.fillStyle(bColor).fillRect(boss.x - barW/2, hudY, barW * bPct, 6);

            // Текст CORE над полоской
            bHealthLabel.setPosition(boss.x, hudY - 15).setOrigin(0.5)
                .setText(`${TRANSLATIONS[lang].core_label}: ${Math.ceil(bPct * 100)}%`).setFontSize('12px').setFill(isPhase2 ? '#ff0000' : '#ff00ff').setDepth(101);
        }

        shieldAura.setVisible(isShieldActive);
    }
}


function handleDamage(scene, dmg) {
    if (isDead || isVictory) return;

    combo = 0; // СБРОС КОМБО ПРИ УДАРЕ

    // ОПРЕДЕЛЯЕМ СТИЛЬ: если HP < 20, цифры будут ГИГАНТСКИМИ и ярко-малиновыми
    let isCrit = playerHealth < 20;
    let dColor = isCrit ? '#ff0055' : '#ff0000';
    let dSize = isCrit ? '26px' : '18px';

    // ВЫЗЫВАЕМ КРАСНЫЕ ЦИФРЫ УРОНА ПО ИГРОКУ
    showDamageText(scene, player.x, player.y, dmg, dColor, dSize);

    if (isShieldActive) {
        isShieldActive = false;
        saveProgress();
        scene.cameras.main.flash(200, 0, 255, 255);
        return;
    }

    // --- ГЕРОИЧЕСКИЙ БОНУС ---
    // Если урон смертельный, но босс почти мертв или уже взорвался
    if (playerHealth - dmg <= 0 && (bossHealth <= 0 || isVictory)) {
        playerHealth = 1;
        glitchText.setText(TRANSLATIONS[lang].heroic_survival).setFill("#ffff00");

        // ЭФФЕКТ АДРЕНАЛИНА: Вспышка желтым и замедление времени на секунду
        this.cameras.main.flash(500, 255, 255, 0, 0.8);
        this.physics.world.timeScale = 2;
        this.time.delayedCall(1000, () => {
            this.physics.world.timeScale = 1;
            glitchText.setText("");
        });

        if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
        return;
    }

    playerHealth -= dmg;
    // ВИЗУАЛ УРОНА: Вспышка и Тряска
    scene.cameras.main.flash(200, 255, 0, 0, 0.5);
    scene.cameras.main.shake(200, 0.02);

    // Красная виньетка (рамка) при низком HP
    if (playerHealth < maxPlayerHealth * 0.4) {
        glitchText.setText(TRANSLATIONS[lang].sys_failure).setFill("#ff0000");
        scene.time.delayedCall(1000, () => glitchText.setText(""));
    }

    if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    if (playerHealth <= 0) triggerDeath(scene);
}

function triggerDeath(scene) {
    if (isDead || isVictory) return;
    isMagnetActive = false;
    isGlitchMode = false;
    coinsThisRun = 0;
    scoreText.setText(`${TRANSLATIONS[lang].credits}: ${coins}`);

    if (Math.floor(distance) > bestDistance) {
        submitScore(Math.floor(distance), level);
    }

    lastRunState = { isDead: true, pendingDeath: true };
    if (this.ovrText) { this.ovrText.destroy(); this.ovrText = null; }
    player.setVisible(false);
    player.setTint(0x333333);
    trailEmitter.stop();
    saveProgress();
    if (glitchText) glitchText.setText("").setBackgroundColor(null);
    scene.physics.pause();
    if (scene.obstacleTimer) scene.obstacleTimer.remove();
    if (scene.shootEvent) scene.shootEvent.remove();

    const overlay = scene.add.container(0, 0).setDepth(5000);
    const deathBg = scene.add.graphics().fillStyle(0x000000, 0.9).fillRect(0, 0, 375, 667);
    // Делаем фон интерактивным, чтобы клики не пролетали сквозь него в игру
    deathBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 375, 667), Phaser.Geom.Rectangle.Contains);

    overlay.add(deathBg);

    overlay.add(scene.add.graphics().fillStyle(0x000000, 0.9).fillRect(0, 0, 375, 667));
    overlay.add(scene.add.text(187, 150, TRANSLATIONS[lang].lost, { fontSize: '32px', fill: '#ff0000', fontWeight: 'bold' }).setOrigin(0.5));

    const btn = (y, txt, color, act) => {
        let b = scene.add.text(187, y, txt, { fontSize: '18px', fill: '#fff', backgroundColor: color, padding: 15 }).setOrigin(0.5).setInteractive().on('pointerdown', act);
        overlay.add(b);
    };

    // 1. Возврат за деньги (текущий уровень)
    btn(280, `${TRANSLATIONS[lang].revive_label} [300]`, coins >= 300 ? '#004444' : '#222', () => {
        if (coins >= 300) { coins -= 300; playerHealth = maxPlayerHealth; isDead = false;
            lastRunState = { isDead: false, pendingDeath: false }; shouldAutoStart = true; scene.scene.restart(); }
    });

    // 2. Кнопка Рекламы с "Золотым парашютом"
    btn(360, level <= 3 ? TRANSLATIONS[lang].revive_label : TRANSLATIONS[lang].watch_ad_label, '#444400', () => {
        // 1. ЛЬГОТНЫЙ ПЕРИОД: Если уровень 1, 2 или 3 — воскрешаем мгновенно
        if (level <= 3) {
            processRevive(scene);
            return;
        }

        // 2. ДЛЯ СТАРШИХ УРОВНЕЙ: Пробуем показать рекламу
        const currentAds = window.adController;

        // Если модуля вообще нет (заблокирован совсем) — просто пускаем в игру
        if (!currentAds) {
            console.log("Adsgram missing - silent bypass");
            processRevive(scene);
            return;
        }

        currentAds.show().then((result) => {
            // Успешный просмотр
            if (result && result.done) {
                processRevive(scene);
            } else {
                alert(lang === 'ru' ? "Нужно досмотреть до конца!" : "Watch till the end!");
            }
        }).catch((err) => {
            // ЛЮБАЯ ОШИБКА (нет интернета, нет рекламы, AdBlock)
            console.log("Adsgram failure - silent bypass:", err);
            // Никаких алертов! Просто даем играть.
            processRevive(scene);
        });
    });

    // 3. Хард-ребут (Сектор 1, потеря всего)
    btn(440, TRANSLATIONS[lang].hard_reboot_label, '#440000', () => {
        level = 1;
        coins = 0;
        upgradeLevels = { fire: 0, ultra: 0, speed: 0, health: 0, shield: 0 };
        isDead = false;
        isPhase2 = false;
        isPhase3 = false;
        shouldAutoStart = true;
        lastRunState = { isDead: false, pendingDeath: false };
        saveProgress();
        scene.scene.restart();
    });
}

function processRevive(scene) {
    lastRunState.pendingDeath = false;
    isDead = false;
    playerHealth = maxPlayerHealth;
    saveProgress();
    shouldAutoStart = true;

    // Если есть босс — останавливаем его музыку перед рестартом
    scene.sound.stopAll();

    scene.scene.restart();
}

function startBossFight(scene) {
    obstacles.clear(true, true);
    bullets.clear(true, true);
    isBossFight = true;

    // ЭФФЕКТ ПРИШЕСТВИЯ БОССА
    scene.cameras.main.shake(1000, 0.02);
    scene.cameras.main.flash(500, 255, 0, 255, 0.3);

    let alertText = scene.add.text(187, 333, TRANSLATIONS[lang].warning_boss, {
        fontSize: '32px', fontFamily: 'Arial', fontWeight: 'bold', fill: '#ff0000', align: 'center'
    }).setOrigin(0.5).setDepth(1000);

    scene.tweens.add({ targets: alertText, alpha: 0, duration: 200, yoyo: true, repeat: 5, onComplete: () => alertText.destroy() });

    boss.setVisible(true).setY(-100);
    // Босс плавно "вплывает" сверху
    scene.tweens.add({ targets: boss, y: 100, duration: 2000, ease: 'Back.easeOut' });

    bossTrail.setVisible(true);

    distanceText.setText("");
    if (scene.obstacleTimer) scene.obstacleTimer.remove();

    // 1. ПОМОЩНИКИ (С 15 уровня) - СТРЕЛЯЮТ ПУЛЯМИ
    if (level >= 15) {
        glitchText.setText(TRANSLATIONS[lang].boss_detected).setFill("#ff00ff");
        bossTurretL = scene.add.rectangle(boss.x - 40, boss.y, 20, 20, 0x00ffff).setDepth(4);
        bossTurretR = scene.add.rectangle(boss.x + 40, boss.y, 20, 20, 0x00ffff).setDepth(4);

        // Таймер стрельбы (ОДИН, БЕЗ ЛАЗЕРОВ)
        scene.turretShootEvent = scene.time.addEvent({
            delay: 1500,
            callback: () => {
                if (!isVictory && !isDead) {
                    [bossTurretL, bossTurretR].forEach(t => {
                        if (t && t.active) {
                            let b = bullets.create(t.x, t.y, 'pixel').setTint(0x00ffff);
                            scene.physics.moveToObject(b, player, 300);
                        }
                    });
                }
            },
            loop: true
        });
    }

    // 2. ЗАЩИТНИКИ (С 20 уровня - ОРБИТАЛЬНЫЕ ЩИТЫ)
    if (level >= 20) {
        bossShields.clear(true, true);
        for(let i = 0; i < 4; i++) {
            let s = bossShields.create(boss.x, boss.y, 'pixel').setTint(0xff00ff).setScale(2.5).setAlpha(0.5);
            s.body.setImmovable(true);
        }
        glitchText.setText(TRANSLATIONS[lang].defense_engaged).setFill("#ff00ff");
    }

    scene.bossShootEvent = scene.time.addEvent({
        delay: isPhase2 ? Math.max(800, 1300 - level * 30) : 1200,
        callback: bossShoot,
        callbackScope: scene, loop: true
    });

    scene.phraseTimer = scene.time.addEvent({
        delay: 3500,
        callback: () => {
            if(isBossFight && !isVictory && !isDead) {
                let pool = isPhase2 ? TRANSLATIONS[lang].p2 : TRANSLATIONS[lang].p1;
                let msg = Phaser.Utils.Array.GetRandom(pool);

                let color = isPhase3 ? "#ffffff" : (isPhase2 ? "#ff0000" : "#ff00ff");

                glitchText.setText(msg).setFill(color);
                scene.time.delayedCall(1500, () => {
                    if (isPhase3 && !isVictory) {
                        glitchText.setText(TRANSLATIONS[lang].system_halt).setFill("#ffffff").setBackgroundColor("#ff0000");
                    } else {
                        glitchText.setText('');
                    }
                });
            }
        },
        loop: true
    });

    // Запуск спавна миньонов (раз в 4 секунды)
    scene.minionTimer = scene.time.addEvent({
        delay: 4000,
        callback: spawnMinion,
        callbackScope: scene,
        loop: true
    });

    if (level >= 10) {
        // Увеличиваем базу босса и заставляем пульсировать
        scene.tweens.add({
            targets: boss,
            scale: { from: 1.2, to: 1.5 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Quad.easeInOut'
        });
    } else {
        boss.setScale(1);
    }
    if (level >= 35) {
        boss.setTint(0x00ff00).setScale(1.4);
        if (bossTrail) bossTrail.setParticleTint(0x00ff00);
        glitchText.setText(TRANSLATIONS[lang].quantum_alert).setFill("#00ff00").setBackgroundColor("#002200");
        // Постоянная легкая тряска босса (эффект нестабильности)
        scene.tweens.add({ targets: boss, x: '+=3', duration: 50, yoyo: true, repeat: -1 });

        scene.teleportEvent = scene.time.addEvent({
            delay: 1500,
            callback: () => {
                if (isBossFight && !isVictory && !isDead) {
                    // Создаем ловушку на старом месте
                    let trap = obstacles.create(boss.x, boss.y, 'pixel').setTint(0xff0000).setScale(4);
                    trap.setData('isTrap', true);
                    scene.tweens.add({ targets: trap, alpha: {from: 1, to: 0.2}, duration: 2000, onComplete: () => trap.destroy() });
                    // Эффект перед прыжком
                    let ghost = scene.add.sprite(boss.x, boss.y, 'boss').setTint(0x00ff00).setAlpha(0.6);
                    scene.tweens.add({ targets: ghost, scale: 2, alpha: 0, duration: 400, onComplete: () => ghost.destroy() });

                    boss.x = Phaser.Math.Between(60, 315);
                    boss.y = Phaser.Math.Between(80, 200);
                    scene.cameras.main.flash(100, 0, 255, 0, 0.2);
                }
            },
            loop: true
        });
    } else if (level >= 30) {
        boss.setTint(0xffffff);
        if (bossTrail) bossTrail.setParticleTint(0xff00ff);
        glitchText.setText(TRANSLATIONS[lang].boss_detected).setFill("#ff00ff");
    }
}

function hitBoss(b, bullet) {
    if (isVictory) return;
    if (bullet) bullet.destroy();

    let dmg = 10 * currentStats.atk;
    bossHealth -= dmg;

    // ВЫЗЫВАЕМ КРАСОТУ
    showDamageText(this, bullet.x, bullet.y, dmg, '#00ff00', '16px');

    coinsThisRun += 2;
    scoreText.setText(`${TRANSLATIONS[lang].credits}: ${coins + coinsThisRun}`);

    let chargeBonus = 2 + (upgradeLevels.ultra * 1.5);
    overdrive = Math.min(100, overdrive + chargeBonus);

    // Вспышка урона
    boss.setTint(0x00ff00);
    this.time.delayedCall(80, () => {
        if (boss && !isDead) {
            if (level >= 35) {
                boss.setTint(0x00ff00);
            } else {
                isPhase2 ? boss.setTint(0xff0000) : boss.clearTint();
            }
        }
    });

    // ОПРЕДЕЛЯЕМ МАКСИМАЛЬНОЕ HP БОССА
    let maxB = 400 * (1 + level * 0.45);

    // ФАЗА 2: ПЕРЕХОД (на 50% HP)
    if (bossHealth <= maxB / 2 && !isPhase2) {
        isPhase2 = true;
        boss.setTint(0xff0000);
        bHealthLabel.setFill('#ff0000');
        glitchText.setText(TRANSLATIONS[lang].critical_race).setFill("#ff0000");

        // ПРАВИЛЬНАЯ ПОКРАСКА ШЛЕЙФА
        if (bossTrail) {
            bossTrail.setParticleTint(0xff0000);
        }
    }

    // ФАЗА 3: УЛЬТРА-ЯРОСТЬ (на 25% HP)
    if (level >= 30 && bossHealth <= maxB * 0.25 && !isPhase3) {
        isPhase3 = true;
        glitchText.setText(TRANSLATIONS[lang].system_halt)
            .setFill("#ffffff").setBackgroundColor("#440000").setAlpha(1);
        this.cameras.main.shake(500, 0.05);
        if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.notificationOccurred('error');
    }

    if (bossHealth <= 0) {
        bossHealth = 0;
        triggerVictory(this);
    }
}

function useOverdrive() {
    // ЗАПРЕТ стрельбы без босса или если уже победили
    if (overdrive < 100 || isVictory || !isBossFight) return;

    overdrive = 0;
    this.sound.play('sfx_ultra', { volume: 0.8 });
    this.cameras.main.shake(1000, 0.02);

    const skin = SKIN_DATA[currentSkin] || SKIN_DATA.classic;
    let laser = this.add.sprite(player.x, player.y - 300, 'laser')
        .setTint(skin.bullet)
        .setBlendMode('ADD')
        .setDepth(6);

    this.tweens.add({
        targets: laser,
        scaleX: 60,
        alpha: 0,
        duration: 1200,
        onUpdate: () => {
            if (isBossFight && !isVictory && Math.abs(laser.x - boss.x) < 100) {
                let maxB = 400 * (1 + level * 0.45);
                // С 30 уровня урон лазера снижается в 2 раза
                let damageMultiplier = level >= 35 ? 0.0005 : (level >= 30 ? 0.0015 : 0.003);
                bossHealth -= (maxB * damageMultiplier) * currentStats.atk;
                if (bossHealth <= 0) { bossHealth = 0; triggerVictory(this); }
            }
        },
        onComplete: () => { if(laser) laser.destroy(); }
    });
}

function triggerVictory(scene) {
    if (isDead || isVictory) return;
    isVictory = true;

    // 1. ОСТАНОВКА ВСЕХ СИСТЕМ (Используем scene!)
    if (scene.shootEvent) scene.shootEvent.remove();
    if (scene.bossShootEvent) scene.bossShootEvent.remove();
    if (scene.turretShootEvent) scene.turretShootEvent.remove();
    if (scene.minionTimer) scene.minionTimer.remove();
    if (scene.phraseTimer) scene.phraseTimer.remove();
    if (scene.teleportEvent) scene.teleportEvent.remove();
    if (scene.itemTimer) scene.itemTimer.remove();
    if (itemsTimer) itemsTimer.remove();

    // 2. МГНОВЕННОЕ УДАЛЕНИЕ ВСЕХ ПУЛЬ И ВРАГОВ
    [bullets, playerBullets, minionBullets, minions, obstacles, bossShields].forEach(g => {
        if (g) g.clear(true, true);
    });

    // 3. ПОЛНАЯ ЗАЧИСТКА ГРАФИКИ (Тот самый фикс)
    if (scene.overheadGfx) {
        scene.overheadGfx.clear();
        scene.overheadGfx.destroy(); // Удаляем объект жизни совсем
    }
    if (overdriveBar) { overdriveBar.clear(); overdriveBar.setVisible(false); }
    if (roadBar) { roadBar.clear(); roadBar.setVisible(false); }

    // Прячем текстовые метки (HP, Дистанция)
    [pHealthLabel, bHealthLabel, distanceText, glitchText].forEach(t => {
        if (t) { t.setVisible(false); t.setAlpha(0); }
    });

    if (scene.ovrText) { scene.ovrText.destroy(); scene.ovrText = null; }

    // 4. ЛОГИКА СОХРАНЕНИЯ
    coins += coinsThisRun;
    coinsThisRun = 0;
    player.setVisible(false);
    if (trailEmitter) trailEmitter.stop();

    submitScore(Math.floor(distance), level);
    level++;
    saveProgress();

    // 5. КРАСИВЫЙ ФИНАЛ
    let vText = scene.add.text(187, 333, TRANSLATIONS[lang].core_destroyed, {
        fontFamily: 'Arial', fontSize: '28px', fill: '#00ff00', fontWeight: 'bold',
        stroke: '#000', strokeThickness: 6, align: 'center'
    }).setOrigin(0.5).setDepth(5000);

    scene.cameras.main.flash(1000, 255, 255, 255);
    scene.cameras.main.shake(1500, 0.05);

    // Фейерверк из босса
    for(let i = 0; i < 80; i++) {
        let p = scene.add.rectangle(boss.x, boss.y, 6, 6, isPhase2 ? 0xff0000 : 0xff00ff);
        scene.physics.add.existing(p);
        p.body.setVelocity(Phaser.Math.Between(-500, 500), Phaser.Math.Between(-500, 500));
        scene.time.delayedCall(2000, () => p.destroy());
    }

    boss.setVisible(false);
    if (bossTrail) bossTrail.setVisible(false);

    scene.time.delayedCall(3000, () => {
        vText.destroy();
        showShop(scene);
    });
}

function showShop(scene, mainMenu) {
    saveProgress();
    isShopOpen = true;
    const overlay = scene.add.container(0, 0).setDepth(4000);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.98).fillRect(0, 0, 375, 667);
    overlay.add(bg);

    const fontUI = 'Arial, sans-serif';
    const creds = scene.add.text(187, 25, `${TRANSLATIONS[lang].credits}: ${coins}`, {
        fill: '#ffff00', fontSize: '22px', fontWeight: 'bold', fontFamily: fontUI
    }).setOrigin(0.5);
    const stats = scene.add.text(187, 45, `${TRANSLATIONS[lang].best}: S${bestLevel} | ${bestDistance}m`, {
        fill: '#00ff00', fontSize: '12px', fontWeight: 'bold', fontFamily: fontUI
    }).setOrigin(0.5);
    overlay.add([creds, stats]);

    // === ПРОКРУТКА ===
    const scrollAreaTop = 65;
    const scrollAreaBottom = 550;
    const scrollHeight = scrollAreaBottom - scrollAreaTop;

    const scrollContainer = scene.add.container(0, scrollAreaTop).setDepth(4001);
    overlay.add(scrollContainer);

    const maskShape = scene.add.graphics().fillStyle(0xffffff).fillRect(10, scrollAreaTop, 355, scrollHeight);
    const mask = maskShape.createGeometryMask();
    scrollContainer.setMask(mask);

    let scrollY = 0;
    let isDragging = false;
    let dragStartY = 0;
    let maxScroll = 0;

    const clampScroll = () => {
        scrollY = Phaser.Math.Clamp(scrollY, -maxScroll, 0);
        scrollContainer.y = scrollAreaTop + scrollY;
    };

    scene.input.on('pointerdown', (pointer) => {
        if (pointer.y >= scrollAreaTop && pointer.y <= scrollAreaBottom) {
            isDragging = true;
            dragStartY = pointer.y - scrollY;
        }
    });
    scene.input.on('pointermove', (pointer) => {
        if (!isDragging) return;
        scrollY = pointer.y - dragStartY;
        clampScroll();
    });
    scene.input.on('pointerup', () => { isDragging = false; });
    scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
        if (pointer.y < scrollAreaTop || pointer.y > scrollAreaBottom) return;
        scrollY -= deltaY * 0.5;
        clampScroll();
    });

    // === ФУНКЦИЯ КНОПКИ ===
    const createBtn = (y, nameKey, descKey, cost, type, action) => {
        const maxLvl = (type === 'health') ? 10 : 1;
        let curLvl = (type === 'shield') ? (isShieldActive ? 1 : 0) : (upgradeLevels[type] || 0);
        let isMaxed = curLvl >= maxLvl;

        const isStarItem = ['skin_gold', 'skin_ghost', 'omega', 'buy_coins'].includes(type);
        const isLocked = (type === 'omega' && level < 40 && !upgradeLevels.omega);

        let isCurrentEquipped = (type === 'skin_striker' && currentShape === 'striker') ||
                                (type === 'skin_gold' && currentSkin === 'gold') ||
                                (type === 'skin_ghost' && currentSkin === 'ghost');

        let btnColor = isCurrentEquipped ? 0x006666
            : (isLocked ? 0x1a1a1a
            : (isStarItem ? 0x443300
            : (isMaxed ? 0x004400 : 0x222222)));

        const btnBg = scene.add.rectangle(187, y, 330, 48, btnColor).setInteractive();

        if (isLocked) btnBg.setStrokeStyle(2, 0xff0000, 0.8);
        else if (isStarItem && !isMaxed) btnBg.setStrokeStyle(2, 0xffaa00, 1);
        else if (isCurrentEquipped) btnBg.setStrokeStyle(2, 0x00ffff, 1);

        const namet = TRANSLATIONS[lang][nameKey];
        let priceTag = isMaxed ? `[${TRANSLATIONS[lang].install}]` : `- ${cost} ${isStarItem ? '⭐' : '💰'}`;
        if (isLocked) priceTag = `[${TRANSLATIONS[lang].sector} 40+]`;

        const btnText = scene.add.text(187, y - 9, `${namet} ${priceTag}`, {
            fontSize: '13px', fill: isLocked ? '#777' : '#fff', fontWeight: 'bold', fontFamily: fontUI
        }).setOrigin(0.5);

        const descText = scene.add.text(187, y + 10, TRANSLATIONS[lang][descKey], {
            fontSize: '10px', fill: isLocked ? '#444' : '#aaa', fontFamily: fontUI,
            wordWrap: { width: 310 }, align: 'center'
        }).setOrigin(0.5);

        btnBg.on('pointerdown', () => {
            if (isLocked) { scene.cameras.main.shake(100, 0.01); return; }

            if (isMaxed && (type.includes('skin') || type.includes('striker'))) {
                if (action) action();
                saveProgress();
                overlay.destroy();
                showShop(scene, mainMenu);
                return;
            }

            if (isMaxed) return;

            if (isStarItem) {
                const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
                fetch(`${botUrl}/get_invoice?item_type=${type}&user_id=${user?.id}&username=${user?.first_name}`)
                .then(r => r.json())
                .then(data => {
                    if (data.url) {
                        window.Telegram.WebApp.openInvoice(data.url, (status) => {
                            if (status === 'paid') {
                                if (type === 'buy_coins') coins += 5000;
                                else upgradeLevels[type] = 1;
                                saveProgress();
                                overlay.destroy();
                                showShop(scene, mainMenu);
                            }
                        });
                    }
                })
                .catch(() => alert("Бот временно недоступен!"));
                return;
            }

            if (coins >= cost) {
                coins -= cost;
                if (type === 'shield') { isShieldActive = true; upgradeLevels.shield = 1; }
                else { upgradeLevels[type] = (upgradeLevels[type] || 0) + 1; }
                if (action) action();
                saveProgress();
                overlay.destroy();
                showShop(scene, mainMenu);
            } else {
                btnBg.setFillStyle(0xff0000);
                scene.cameras.main.shake(200, 0.01);
                scene.time.delayedCall(200, () => { btnBg.setFillStyle(btnColor); });
            }
        });

        // ВАЖНО: добавляем в scrollContainer, не в overlay!
        scrollContainer.add([btnBg, btnText, descText]);
    };

    // === СПИСОК КНОПОК ===
    let sY = 20, step = 52;
    createBtn(sY,          "up_antenna",   "desc_antenna",  400,  'ultra');
    createBtn(sY+step,     "up_cannons",   "desc_cannons",  800,  'fire');
    createBtn(sY+step*2,   "up_speed",     "desc_speed",    300,  'speed');
    createBtn(sY+step*3,   "up_hull",      "desc_hull",     500,  'health', () => { maxPlayerHealth += 25; playerHealth = maxPlayerHealth; });
    createBtn(sY+step*4,   "up_shield",    "desc_shield",   150,  'shield');
    createBtn(sY+step*5,   "skin_striker", "desc_striker",  1500, 'skin_striker', () => { currentShape = 'striker'; refreshPlayerAppearance(scene); });
    createBtn(sY+step*6,   "skin_gold",    "desc_gold",     300,  'skin_gold',    () => { currentSkin = 'gold';    refreshPlayerAppearance(scene); });
    createBtn(sY+step*7,   "skin_ghost",   "desc_ghost",    300,  'skin_ghost',   () => { currentSkin = 'ghost';   refreshPlayerAppearance(scene); });
    createBtn(sY+step*8,   "up_omega",     "desc_omega",    100,  'omega',        () => { upgradeLevels.omega = 1; });
    createBtn(sY+step*9,   "up_coins",     "desc_coins",    50,   'buy_coins');

    // Считаем максимальный скролл
    const contentHeight = sY + step * 10 + 40;
    maxScroll = Math.max(0, contentHeight - scrollHeight);

    // === ФИКСИРОВАННЫЕ КНОПКИ СНИЗУ ===
    const share = scene.add.text(187, 575, upgradeLevels.shareClaimed
        ? TRANSLATIONS[lang].invite_done
        : TRANSLATIONS[lang].invite, {
        fontSize: '13px', fill: '#00ff88', backgroundColor: '#003300', padding: 8, fontFamily: fontUI
    }).setOrigin(0.5).setInteractive();

    share.on('pointerdown', () => {
        const shareText = encodeURIComponent(
            TRANSLATIONS[lang].share_invite.replace("%lvl%", level).replace("%dist%", bestDistance)
        );
        const fullLink = `https://t.me/share/url?url=${encodeURIComponent(SHARE_LINK)}&text=${shareText}`;
        if (window.Telegram?.WebApp) {
            Telegram.WebApp.openTelegramLink(fullLink);
            if (!upgradeLevels.shareClaimed) {
                coins += 500;
                upgradeLevels.shareClaimed = true;
                saveProgress();
                creds.setText(`${TRANSLATIONS[lang].credits}: ${coins}`);
                share.setText(TRANSLATIONS[lang].invite_done).setFill("#aaa").disableInteractive();
            }
        } else window.open(fullLink, '_blank');
    });

    const cleanupAndClose = (restart, autoStart) => {
        scene.input.off('pointerdown');
        scene.input.off('pointermove');
        scene.input.off('pointerup');
        scene.input.off('wheel');
        overlay.destroy();
        isShopOpen = false;
        isVictory = false;
        shouldAutoStart = autoStart || false;
        if (restart) scene.scene.restart();
    };

    const back = scene.add.text(187, 605, TRANSLATIONS[lang].back, {
        fontSize: '15px', fill: '#ff00ff', fontFamily: fontUI, fontWeight: 'bold'
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
        saveProgress();
        cleanupAndClose(true, false);
    });

    overlay.add([share, back]);

    if (isVictory) {
        const nextBtn = scene.add.text(187, 635, `${TRANSLATIONS[lang].deploy_btn} ${level}`, {
            fontSize: '17px', fill: '#00ffff', backgroundColor: '#003333',
            padding: { left: 20, right: 20, top: 10, bottom: 10 }, fontFamily: fontUI, fontWeight: 'bold'
        }).setOrigin(0.5).setInteractive();
        nextBtn.on('pointerdown', () => { cleanupAndClose(true, true); });
        overlay.add(nextBtn);
    }
}

function bossShoot() {
    if (isShopOpen || isDead || !isBossFight || isPaused || bullets.getLength() > 200) return;

    // Быстрый рост сложности: +1 пуля каждые 2 уровня
    let baseBullets = 10 + Math.floor(level / 2);
    let count = isPhase3 ? 32 : (isPhase2 ? Math.min(26, baseBullets + 6) : Math.min(22, baseBullets));
    let speed = isPhase3 ? 400 : (280 + level * 7);
    let patternType = Math.floor(this.time.now / 5000) % 2;

    // Снайперский режим (каждый 5-й уровень)
    let isSniperLevel = (level % 5 === 0);
    if (isSniperLevel && !isPhase3) {
        speed += 120;
        patternType = 1;
    }

    // --- ФИШКА: ТИШИНА ПЕРЕД БУРЕЙ (Level 20+) ---
    if (level >= 20 && Math.random() > 0.92 && !this.isSilenceEvent) {
        this.isSilenceEvent = true;
        let bgm = this.sound.get('bgm');

        // 1. Выключаем музыку и пугаем игрока
        if (bgm && isSoundOn) bgm.pause();
        glitchText.setText(TRANSLATIONS[lang].audio_glitch).setFill("#ff0000").setAlpha(1);
        this.cameras.main.flash(500, 255, 0, 0, 0.2);

        // 2. Через 2 секунды возвращаем музыку и пускаем супер-атаку
        this.time.delayedCall(2000, () => {
            if (bgm && isSoundOn) bgm.resume();
            glitchText.setText("");

            // Запускаем ГИПЕР-ВЕЕР
            let angleToPlayer = Phaser.Math.Angle.Between(boss.x, boss.y, player.x, player.y);
            for (let i = -5; i <= 5; i++) { // Очень широкий и плотный веер
                let angle = angleToPlayer + (i * 0.1);
                bullets.create(boss.x, boss.y, 'pixel')
                    .setVelocity(Math.cos(angle) * 550, Math.sin(angle) * 550)
                    .setScale(2).setTint(0xff0000);
            }
            this.isSilenceEvent = false;
        });
        return;
    }

    // Определяем цвет снарядов: Зеленый для Фантома (35+), Красный для ярости, Фиолетовый для базы
    let bulletColor = level >= 35 ? 0x00ff00 : (isPhase2 ? 0xff0000 : 0xff00ff);

    if (isPhase3) {
        for (let i = 0; i < count; i++) {
            let angle = i * (Math.PI * 2 / count) + Math.sin(this.time.now * 0.001) * 2;
            bullets.create(boss.x, boss.y, 'pixel').setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
            .setScale(2).setTint(bulletColor);
        }
    }
    else if (patternType === 0) {
        // --- КРУГОВАЯ ВОЛНА ---
        for (let i = 0; i < count; i++) {
            let angle = i * (Math.PI * 2 / count);
            bullets.create(boss.x, boss.y, 'pixel')
                .setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
                .setScale(1.5).setTint(bulletColor);
        }
    }
    else {
        // --- ПРИЦЕЛЬНЫЙ ВЕЕР ---
        let angleToPlayer = Phaser.Math.Angle.Between(boss.x, boss.y, player.x, player.y);
        // Делаем веер шире на первых уровнях (разлет пуль больше)
        let spread = Math.max(0.2, 0.5 - level * 0.02);
        let bColor = isPhase2 ? 0xff0000 : 0xbb00ff;

        for (let i = -2; i <= 2; i++) {
            let angle = angleToPlayer + (i * spread);
            bullets.create(boss.x, boss.y, 'pixel').setVelocity(Math.cos(angle) * (speed + 40), Math.sin(angle) * (speed + 40))
                .setScale(1.5).setTint(bulletColor);
        }
    }
}


function playerShoot() {
    if (isShopOpen || isDead || !isStarted || isPaused) return;

    // Определяем цвет пули на основе скина
    const skin = SKIN_DATA[currentSkin] || SKIN_DATA.classic;
    const bColor = skin.bullet;

    // Боковые пушки (если куплены)
    if(upgradeLevels.fire > 0) {
        playerBullets.create(player.x-18, player.y, 'pixel').setVelocityY(-750).setTint(bColor);
        playerBullets.create(player.x+18, player.y, 'pixel').setVelocityY(-750).setTint(bColor);
    }

    // Центральная пушка
    playerBullets.create(player.x, player.y-20, 'pixel').setVelocityY(-750).setTint(bColor);
}


function spawnObstacle() {
    if (!isStarted || isBossFight || isShopOpen || isPaused) return;

    let x = Phaser.Math.Between(50, 320);
    let obstacle = obstacles.create(x, -50, 'wall');

    // Сделаем дронов-охотников РЕАЛЬНО заметными
    if (level >= 3 && Math.random() > 0.65) {
        obstacle.setData('isDrone', true);
        obstacle.setTint(0xffaa00); // ЯРКО-ЗОЛОТИСТЫЙ ОРАНЖЕВЫЙ
        obstacle.setScale(1.1);      // Сделали крупнее обычных стен
        obstacle.setVelocityY(320 + (level * 8));
    } else {
        obstacle.setTint(0xff0000);
        obstacle.setVelocityY(300 + (level * 12));
    }
}

function togglePause() { isPaused = !isPaused; if (isPaused) this.physics.pause(); else this.physics.resume(); }

function generatePlayerTexture(scene) {
    let g = scene.make.graphics({ x: 0, y: 0, add: false });
    const skin = SKIN_DATA[currentSkin] || SKIN_DATA.classic;

    // Используем прозрачность скина (для призрака - 0.5)
    g.fillStyle(skin.body, skin.alpha || 1);

    if (currentShape === 'striker') {
        // РИСУЕМ ТРЕУГОЛЬНИК
        g.fillTriangle(16, 2, 0, 38, 32, 38);
        g.fillRect(0, 30, 4, 10);
        g.fillRect(28, 30, 4, 10);

        // Глаза пониже, чтобы влезли в треугольник
        g.fillStyle(skin.eyes, 1);
        g.fillRect(12, 25, 2, 4);
        g.fillRect(18, 25, 2, 4);
    } else {
        // КЛАССИКА
        g.fillRoundedRect(4, 10, 24, 18, 6);
        g.fillStyle(skin.eyes, 1);
        g.fillRect(12, 16, 2, 2);
        g.fillRect(18, 16, 2, 2);
    }

    // ДОПЫ (Пушки и Антенна)
    if (upgradeLevels.fire > 0) {
        g.fillStyle(0xff0000, 1);
        g.fillRect(0, 12, 6, 14);
        g.fillRect(26, 12, 6, 14);
    }

    g.lineStyle(3, 0x00ffff, 1);
    g.lineBetween(16, 10, 16, -5);
    if (upgradeLevels.ultra > 0) {
        g.fillStyle(0xffff00, 1);
        g.fillCircle(16, -8, 8);
        g.lineStyle(2, 0xffff00, 0.5);
        g.strokeCircle(16, -8, 12);
    }

    const name = `p_v_${currentShape}_${currentSkin}_${Date.now()}`;
    g.generateTexture(name, 32, 40);
    g.destroy();
    return name;
}

function spawnItem() {
    if (!isStarted || isBossFight || isShopOpen || isPaused) return;

    let x = Phaser.Math.Between(50, 320);
    let rand = Math.random();
    let type = 'coin';

    // Сначала проверяем самые РЕДКИЕ бонусы
    if (rand > 0.98) {
        type = 'nuke';    // 2% шанс (станет в 2 раза реже, чем сейчас)
    } else if (rand > 0.95) {
        type = 'magnet';  // 3% шанс
    } else if (rand > 0.90) {
        type = 'slowmo';  // 5% шанс
    } else {
        // выбираем между Монетой и Сердцем
        // На 1 уровне шанс сердца 1%, на 30 уровне — 40%
        let baseHeartChance = level >= 30 ? 0.40 : (level >= 25 ? 0.25 : 0.01);

        // Если здоровья мало, система "помогает" выжить
        let actualHeartChance = (playerHealth < 20) ? 0.45 : baseHeartChance;

        if (Math.random() < actualHeartChance) {
            type = 'heart';
        } else {
            type = 'coin';
        }
    }

    let item = items.create(x, -20, type === 'heart' ? 'heart' : 'pixel');

    if (type === 'heart') {
        // Делаем сердечко ярким и пульсирующим, чтобы не пропустить
        item.setTint(0xff0088).setScale(1.2);
        this.tweens.add({ targets: item, scale: 1.6, duration: 400, yoyo: true, repeat: -1 });
    } else if (type === 'coin') {
        item.setTint(0xffff00).setData('type', 'coin').setScale(1.5);
        // Эффект «блеска»
        this.tweens.add({
            targets: item,
            alpha: 0.5,
            duration: 200,
            yoyo: true,
            repeat: -1
        });
    } else if (type === 'slowmo') {
        item.setTint(0x00ff00).setData('type', 'slowmo').setScale(2.5);
    } else if (type === 'nuke') {
        item.setTint(0xff00ff).setData('type', 'nuke').setScale(3).setAngle(45);
    } else if (type === 'magnet') {
        item.setTint(0xff00ff).setData('type', 'magnet').setScale(2).setAngle(180);
    }

    item.setData('type', type);
    item.setVelocityY(250 + (level * 15));
}

function collectItem(p, item) {
    let type = item.getData('type');
    item.destroy();

    if (type === 'magnet') {
        isMagnetActive = true;
        // Перевод: МАГНИТНЫЙ ЗАХВАТ
        glitchText.setText(TRANSLATIONS[lang].magnet_on).setFill("#ff00ff");
        this.time.delayedCall(8000, () => { isMagnetActive = false; glitchText.setText(""); });
    }

    if (type === 'heart') {
        playerHealth = Math.min(maxPlayerHealth, playerHealth + 25);

        // Всплывающий текст теперь использует локализацию ОЗ/HP
        let txt = this.add.text(player.x, player.y, `+25 ${TRANSLATIONS[lang].hp_label}`, {
            fontFamily: 'Courier New', fontSize: '18px', fill: '#00ff00', fontWeight: 'bold', stroke: '#000', strokeThickness: 3
        }).setDepth(100);

        this.tweens.add({
            targets: txt,
            y: player.y - 100,
            alpha: 0,
            duration: 800,
            onComplete: () => txt.destroy()
        });

        // Используем новую строку из словаря (добавь её в TRANSLATIONS, если нет)
        glitchText.setText(lang === 'ru' ? "КОРПУС ВОССТАНОВЛЕН" : "INTEGRITY_RESTORED").setFill("#ff0088");
        this.time.delayedCall(1000, () => glitchText.setText(""));
        this.cameras.main.flash(300, 255, 0, 136, 0.4);
        if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }

    if (type === 'nuke') {
        this.sound.play('sfx_nuke', { volume: 0.5, stopOnTerminate: true });
        this.time.delayedCall(2000, () => { this.sound.stopByKey('sfx_nuke'); });

        if (window.Telegram?.WebApp?.HapticFeedback) {
            Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        let wave = this.add.circle(player.x, player.y, 20, 0xff00ff, 0.7).setDepth(2000);
        this.tweens.add({ targets: wave, radius: 800, alpha: 0, duration: 600, ease: 'Expo.out', onComplete: () => wave.destroy() });

        this.cameras.main.flash(400, 255, 0, 255, 0.4);
        this.cameras.main.shake(500, 0.03);

        obstacles.children.each(obs => {
            if (obs.active) {
                for (let i = 0; i < 6; i++) {
                    let frag = this.add.rectangle(obs.x, obs.y, 6, 6, 0xff0000).setDepth(5);
                    this.physics.add.existing(frag);
                    frag.body.setVelocity(Phaser.Math.Between(-500, 500), Phaser.Math.Between(-500, 500));
                    this.time.delayedCall(400, () => frag.destroy());
                }
            }
        });

        obstacles.clear(true, true);

        // Перевод: СИСТЕМА ОЧИЩЕНА
        glitchText.setText(TRANSLATIONS[lang].purified).setFill("#ff00ff").setAlpha(1);
        this.time.delayedCall(1500, () => glitchText.setAlpha(0));

    } else if (type === 'coin') {
        coinsThisRun += (isGlitchMode ? 30 : 10);
        scoreText.setText(`${TRANSLATIONS[lang].credits}: ${coins + coinsThisRun}`);
    } else if (type === 'slowmo') {
        // Перевод: ВРЕМЯ ЗАМЕДЛЕНО
        glitchText.setText(TRANSLATIONS[lang].time_warp).setFill("#00ff00");
        this.physics.world.timeScale = 2;
        this.time.delayedCall(3000, () => {
            this.physics.world.timeScale = 1;
            glitchText.setText("");
        });
    }
}

function showComboEffect(scene) {
    combo++;
    if (scene.comboSound) scene.comboSound.play();

    comboPopText.setPosition(player.x, player.y - 60);
    // Используем перевод слова COMBO
    comboPopText.setText(`+${TRANSLATIONS[lang].combo_text} x${combo}`);
    comboPopText.setAlpha(1).setScale(1.2).setFill(combo >= 10 ? '#ff0000' : '#00ff00');

    if (combo === 10) {
        isGlitchMode = true;
        this.cameras.main.setBackgroundColor('#ffffff');
        scene.cameras.main.shake(5000, 0.007);

        // Перевод надписи ГИПЕР-ГЛИТЧ
        glitchText.setText(TRANSLATIONS[lang].hyper_glitch).setFill("#000000").setBackgroundColor("#ff0000");

        scene.time.delayedCall(5000, () => {
            isGlitchMode = false;
            this.cameras.main.setBackgroundColor('#000000');
            glitchText.setText("").setBackgroundColor(null);
        });
    }

    scene.tweens.add({
        targets: comboPopText,
        y: player.y - 120,
        alpha: 0,
        scale: 2,
        duration: 600
    });

    if (combo % 5 === 0) {
        let reward = isGlitchMode ? 45 : 15;
        coinsThisRun += reward;
        scoreText.setText(`${TRANSLATIONS[lang].credits}: ${coins + coinsThisRun}`);
        scene.cameras.main.flash(100, 255, 255, 255, 0.3);
    }
}

function spawnMinion() {
    if (isVictory || isDead || isPaused || !isBossFight) return;

    // Появляется из босса
    let minion = minions.create(boss.x, boss.y, 'pixel');
    minion.setTint(0x00ff00).setScale(2).setDepth(4);
    minion.setData('state', 'hunting'); // Состояние преследования

    // Через 1.5 секунды он переходит в режим атаки
    this.time.delayedCall(1500, () => {
        if (minion.active) minion.setData('state', 'attacking');
    });

    // Авто-стрельба миньона, если он жив
    this.time.addEvent({
        delay: 800,
        callback: () => {
            if (minion.active && minion.y < player.y) {
                let mb = minionBullets.create(minion.x, minion.y, 'pixel');
                mb.setTint(0x00ff00).setVelocityY(450).setScale(1.2);
            }
        },
        repeat: 4
    });

    minion.setVelocity(Phaser.Math.Between(-100, 100), 200);
}

function minionExplode(scene, x, y) {
    // 1. ВИЗУАЛ: Расширяющееся зеленое кольцо глитча
    let blast = scene.add.circle(x, y, 10, 0x00ff00, 0.4).setDepth(4);

    scene.tweens.add({
        targets: blast,
        radius: 100, // Радиус поражения
        alpha: 0,
        duration: 400,
        onUpdate: () => {
            // 2. ЛОГИКА: Уничтожаем пули босса, попавшие в радиус взрыва
            bullets.children.each(b => {
                if (b && b.active) {
                    let dist = Phaser.Math.Distance.Between(x, y, b.x, b.y);
                    if (dist < blast.radius) {
                        // Эффект распада пули
                        b.destroy();
                        // Небольшой бонус за "защитный взрыв"
                        coinsThisRun += 1;
                    }
                }
            });
        },
        onComplete: () => blast.destroy()
    });

    // Логика Омега-Ядра
    if (upgradeLevels.omega > 0) {
        overdrive = Math.min(100, overdrive + 20); // +20% за каждого миньона
        let chargeFlash = scene.add.circle(player.x, player.y, 40, 0xffff00, 0.5);
        scene.tweens.add({ targets: chargeFlash, scale: 2, alpha: 0, duration: 300, onComplete: () => chargeFlash.destroy() });
    }

    // 3. ЧАСТИЦЫ: Зеленые искры
    for(let i = 0; i < 15; i++) {
        let p = scene.add.rectangle(x, y, 4, 4, 0x00ff00);
        scene.physics.add.existing(p);
        p.body.setVelocity(Phaser.Math.Between(-300, 300), Phaser.Math.Between(-300, 300));
        scene.time.delayedCall(400, () => p.destroy());
    }
}

function showMenu(scene) {
    isStarted = false;
    const menu = scene.add.container(0, 0).setDepth(3000);
    const bg = scene.add.graphics().fillStyle(0x000000, 1).fillRect(0, 0, 375, 667);

    const fontUI = 'Arial, sans-serif'; // Наш новый стандарт

    const title = scene.add.text(187, 80, TRANSLATIONS[lang].menu_title, {
        fontSize: '42px', fill: '#00ffff', align: 'center', fontWeight: 'bold',
        stroke: '#ff00ff', strokeThickness: 4, fontFamily: fontUI
    }).setOrigin(0.5);

    // Кнопка смены языка: теперь без перезапуска сцены
    const langBtn = scene.add.text(320, 30, lang.toUpperCase(), {
        fontSize: '14px', fill: '#ffff00', backgroundColor: '#222', padding: 8, fontFamily: fontUI
    }).setOrigin(0.5).setInteractive();

    langBtn.on('pointerdown', () => {
        lang = (lang === 'ru') ? 'en' : 'ru';
        saveProgress();
        menu.destroy(); // Удаляем старое меню
        showMenu(scene); // Рисуем новое на том же месте
    });

    const btnStyle = { fontSize: '18px', fill: '#fff', backgroundColor: '#222', padding: 10, fontFamily: fontUI, fontWeight: 'bold' };

    const startBtn = scene.add.text(187, 210, TRANSLATIONS[lang].start, btnStyle).setOrigin(0.5).setInteractive();
    const hangarBtn = scene.add.text(187, 275, TRANSLATIONS[lang].hangar, btnStyle).setOrigin(0.5).setInteractive();
    const shopBtn = scene.add.text(187, 340, TRANSLATIONS[lang].shop, btnStyle).setOrigin(0.5).setInteractive();
    const setBtn = scene.add.text(187, 405, TRANSLATIONS[lang].settings, btnStyle).setOrigin(0.5).setInteractive();

    // Исправленный текст звука
    let audioState = isSoundOn ? TRANSLATIONS[lang].v_on : TRANSLATIONS[lang].v_off;
    const soundBtn = scene.add.text(187, 470, `>> ${TRANSLATIONS[lang].audio}: ${audioState}`, btnStyle).setOrigin(0.5).setInteractive();

    const rulesBtn = scene.add.text(187, 535, TRANSLATIONS[lang].rules, btnStyle).setOrigin(0.5).setInteractive();
    const topBtn = scene.add.text(187, 600, TRANSLATIONS[lang].top, {
        fontSize: '16px', fill: '#ffff00', backgroundColor: '#333300', padding: 10, fontFamily: fontUI, fontWeight: 'bold'
    }).setOrigin(0.5).setInteractive();

    topBtn.on('pointerdown', () => { menu.setVisible(false); showLeaderboard(scene, menu); });

    startBtn.on('pointerdown', () => {
        if (lastRunState.pendingDeath) {
            menu.destroy();
            triggerDeath(scene);
            return;
        }

        menu.destroy(); isStarted = true;
        let currentBgm = scene.sound.get('bgm');
        if (isSoundOn && (!currentBgm || !currentBgm.isPlaying)) scene.sound.play('bgm', {loop:true, volume:0.15});
        scene.obstacleTimer = scene.time.addEvent({ delay: Math.max(300, 1150 - level * 50), callback: spawnObstacle, callbackScope: scene, loop: true });
        scene.shootEvent = scene.time.addEvent({ delay: 150 - (upgradeLevels.fire * 20), callback: playerShoot, callbackScope: scene, loop: true });
        itemsTimer = scene.time.addEvent({ delay: 1000, callback: spawnItem, callbackScope: scene, loop: true });
    });

    soundBtn.on('pointerdown', () => {
        isSoundOn = !isSoundOn;
        let newState = isSoundOn ? TRANSLATIONS[lang].v_on : TRANSLATIONS[lang].v_off;
        soundBtn.setText(`>> ${TRANSLATIONS[lang].audio}: ${newState}`);
        if (!isSoundOn) scene.sound.stopAll();
    });

    hangarBtn.on('pointerdown', () => { menu.setVisible(false); showHangar(scene, menu); });
    shopBtn.on('pointerdown', () => { menu.setVisible(false); showShop(scene, menu); });
    setBtn.on('pointerdown', () => { menu.setVisible(false); showSettings(scene, menu); });
    rulesBtn.on('pointerdown', () => { menu.setVisible(false); showRules(scene, menu); });

    menu.add([bg, title, langBtn, startBtn, hangarBtn, shopBtn, setBtn, soundBtn, rulesBtn, topBtn]);
}

function showRules(scene, mainMenu) {
    const rulesOverlay = scene.add.container(0, 0).setDepth(4000);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.98).fillRect(0, 0, 375, 667);
    rulesOverlay.add(bg);

    const fontUI = 'Arial, sans-serif';

    // Заголовок
    const header = scene.add.text(187, 40, TRANSLATIONS[lang].rules_header, {
        fontSize: '22px', fill: '#00ffff', fontWeight: 'bold', fontFamily: fontUI
    }).setOrigin(0.5);
    rulesOverlay.add(header);

    // --- СЕКЦИЯ 1: ПРЕДМЕТЫ (Теперь по центру) ---
    const itemsList = [
        { key: 'wall', c: 0xff0000, t: TRANSLATIONS[lang].rule_wall },
        { key: 'pixel', c: 0xffff00, t: TRANSLATIONS[lang].rule_coin },
        { key: 'heart', c: 0xff0088, t: TRANSLATIONS[lang].rule_heart },
        { key: 'pixel', c: 0xff00ff, t: TRANSLATIONS[lang].rule_nuke, angle: 45, scale: 2.2 },
        { key: 'pixel', c: 0xff00ff, t: TRANSLATIONS[lang].rule_magnet, angle: 180, scale: 1.6 },
        { key: 'pixel', c: 0x00ff00, t: TRANSLATIONS[lang].rule_slowmo, scale: 1.6 }
    ];

    // Центрируем блок: иконки на 75, текст на 105
    itemsList.forEach((item, i) => {
        let y = 95 + (i * 42);
        let icon = scene.add.sprite(75, y, item.key).setTint(item.c);
        icon.setScale(item.scale || (item.key === 'pixel' ? 1.8 : 0.6));
        if (item.angle) icon.setAngle(item.angle);

        // wordWrap чуть уже (240), чтобы текст не упирался в правый край
        let txt = scene.add.text(105, y, item.t, {
            fontSize: '11px',
            fill: '#fff',
            fontFamily: fontUI,
            wordWrap: { width: 240 }
        }).setOrigin(0, 0.5);

        rulesOverlay.add([icon, txt]);
    });

    // --- СЕКЦИЯ 2: ТРЕВОГИ ---
    const stagesTitle = scene.add.text(187, 355, TRANSLATIONS[lang].rules_alerts, {
        fontSize: '15px', fill: '#ff00ff', fontWeight: 'bold'
    }).setOrigin(0.5);

    const stagesDesc = scene.add.text(187, 405,
        `${TRANSLATIONS[lang].rules_sec_15}\n${TRANSLATIONS[lang].rules_sec_20}\n${TRANSLATIONS[lang].rules_sec_30}\n${TRANSLATIONS[lang].rules_sec_35}`, // Добавили 35
        {
            fontSize: '11px', fill: '#ffaa00', fontFamily: fontUI,
            align: 'center', lineSpacing: 8, wordWrap: { width: 320 }
        }
    ).setOrigin(0.5);
    rulesOverlay.add([stagesTitle, stagesDesc]);

    // --- СЕКЦИЯ 3: СТРАТЕГИЯ ---
    const shopBox = scene.add.rectangle(187, 490, 330, 75, 0x00ffff, 0.05).setStrokeStyle(1, 0x00ffff);
    const shopTxt = scene.add.text(187, 490, TRANSLATIONS[lang].strategy_tip, {
        fontSize: '11px', fill: '#00ffff', align: 'center', fontFamily: fontUI,
        wordWrap: { width: 300 }
    }).setOrigin(0.5);
    rulesOverlay.add([shopBox, shopTxt]);

    // --- ОБУЧЕНИЕ (РУКА) ---
    const hand = scene.add.circle(187, 625, 8, 0x00ffff, 0.5);
    scene.tweens.add({ targets: hand, x: { from: 140, to: 235 }, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const handTxt = scene.add.text(187, 645, TRANSLATIONS[lang].slide, { fontSize: '10px', fill: '#00ffff' }).setOrigin(0.5);
    rulesOverlay.add([hand, handTxt]);

    // КНОПКА НАЗАД
    const back = scene.add.text(187, 575, TRANSLATIONS[lang].back, {
        fontSize: '16px', fill: '#fff', backgroundColor: '#330033', padding: 12, fontWeight: 'bold'
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
        rulesOverlay.destroy();
        mainMenu.setVisible(true);
    });
    rulesOverlay.add(back);
}

function refreshPlayerAppearance(scene) {
    scene.cameras.main.flash(200, 255, 255, 255, 0.3);
    if (!player) return; // Если игрока ещё нет на экране, ничего не делаем

    // Генерируем новую текстуру с текущими скином и формой
    const newTexName = generatePlayerTexture(scene);

    // Применяем её к спрайту игрока
    player.setTexture(newTexName);

    // ОБНОВЛЯЕМ ЦВЕТ ШЛЕЙФА
    const skin = SKIN_DATA[currentSkin] || SKIN_DATA.classic;
    if (trailEmitter) {
        trailEmitter.setParticleTint(skin.trail);
    }

    currentStats = getShipStats();
}

function showSettings(scene, mainMenu) {
    const overlay = scene.add.container(0, 0).setDepth(4000);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.98).fillRect(0, 0, 375, 667);

    const fontUI = 'Arial, sans-serif';
    // Заголовок из словаря (используем settings_title или settings)
    const title = scene.add.text(187, 60, TRANSLATIONS[lang].settings, {
        fontSize: '24px', fill: '#00ffff', fontWeight: 'bold'
    }).setOrigin(0.5);
    overlay.add([bg, title]);

    // Визуальное превью касания
    const finger = scene.add.circle(187, 350, 15, 0xffffff, 0.3).setStrokeStyle(2, 0xffffff);
    const shipPreview = scene.add.sprite(187, 350 + yOffset, player.texture.key).setScale(2);
    overlay.add([finger, shipPreview]);

    // Текст значения отступа
    const info = scene.add.text(187, 450, `${TRANSLATIONS[lang].offset_label}: ${Math.abs(yOffset)}px`, {
        fontSize: '18px', fill: '#00ffff', fontFamily: fontUI
    }).setOrigin(0.5);
    overlay.add(info);

    const adjust = (v) => {
        yOffset = Phaser.Math.Clamp(yOffset + v, -150, 0);
        shipPreview.setY(350 + yOffset);
        info.setText(`${TRANSLATIONS[lang].offset_label}: ${Math.abs(yOffset)}px`);
        saveProgress();

        // ЭФФЕКТ ПРЫЖКА
        scene.tweens.add({
            targets: shipPreview,
            y: shipPreview.y - 15, // Подпрыгивает на 15 пикселей вверх
            duration: 100,        // За 0.1 секунды
            yoyo: true,           // И сразу обратно
            ease: 'Back.easeOut'  // Плавный эффект отскока
        });
    };

    // Кнопки регулировки
    const up = scene.add.text(120, 520, ` [ ${TRANSLATIONS[lang].higher} ] `, {
        backgroundColor: '#004400', padding: 10, fontWeight: 'bold'
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => adjust(-10));

    const down = scene.add.text(254, 520, ` [ ${TRANSLATIONS[lang].lower} ] `, {
        backgroundColor: '#440000', padding: 10, fontWeight: 'bold'
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => adjust(10));

    overlay.add([up, down]);

    // Кнопка выхода (Применить)
    const back = scene.add.text(187, 610, TRANSLATIONS[lang].apply, {
        fontSize: '18px', fill: '#ff00ff', backgroundColor: '#220022', padding: 12, fontWeight: 'bold'
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
        overlay.destroy();
        mainMenu.setVisible(true);
    });
    overlay.add(back);
}

function showHangar(scene, mainMenu) {
    const overlay = scene.add.container(0, 0).setDepth(4000);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.98).fillRect(0, 0, 375, 667);
    overlay.add(bg);

    const fontUI = 'Arial, sans-serif';

    const title = scene.add.text(187, 40, TRANSLATIONS[lang].hangar_title, {
        fontSize: '24px', fill: '#00ffff', fontWeight: 'bold', fontFamily: fontUI
    }).setOrigin(0.5);
    overlay.add(title);

    // Характеристики (плашка сверху)
    const stats = getShipStats();
    const statsBox = scene.add.rectangle(187, 80, 330, 25, 0x222222).setStrokeStyle(1, 0xffff00);
    const statsText = scene.add.text(187, 80, stats.label, {
        fontSize: '11px', fill: '#ffff00', fontWeight: 'bold', fontFamily: fontUI
    }).setOrigin(0.5);
    overlay.add([statsBox, statsText]);

    // Колонки выбора
    const colX = 25;
    overlay.add(scene.add.text(colX, 120, TRANSLATIONS[lang].hull_type, {
        fontSize: '13px', fill: '#ff00ff', fontWeight: 'bold', fontFamily: fontUI
    }));

    const shapes = [
        { id: 'classic', name: TRANSLATIONS[lang].classic_box, unlocked: true },
        { id: 'striker', name: TRANSLATIONS[lang].skin_striker, unlocked: upgradeLevels.skin_striker > 0 }
    ];

    shapes.forEach((s, i) => {
        if (!s.unlocked) return;
        const isSelected = currentShape === s.id;
        const btn = scene.add.text(colX + 5, 145 + (i * 35), `> ${s.name}`, {
            fontSize: '15px', fill: isSelected ? '#00ffff' : '#666',
            backgroundColor: isSelected ? '#003333' : null,
            padding: 5, fontFamily: fontUI
        }).setInteractive().on('pointerdown', () => {
            currentShape = s.id; saveProgress(); refreshPlayerAppearance(scene);
            overlay.destroy(); showHangar(scene, mainMenu);
        });
        overlay.add(btn);
    });

    overlay.add(scene.add.text(colX, 240, TRANSLATIONS[lang].visual_skin, {
        fontSize: '13px', fill: '#ff00ff', fontWeight: 'bold', fontFamily: fontUI
    }));

    const skins = [
        { id: 'classic', name: TRANSLATIONS[lang].cyan_neon, unlocked: true },
        { id: 'gold', name: TRANSLATIONS[lang].skin_gold, unlocked: upgradeLevels.skin_gold > 0 },
        { id: 'ghost', name: TRANSLATIONS[lang].skin_ghost, unlocked: upgradeLevels.skin_ghost > 0 }
    ];

    skins.forEach((sk, i) => {
        if (!sk.unlocked) return;
        const isSelected = currentSkin === sk.id;
        const btn = scene.add.text(colX + 5, 265 + (i * 35), `> ${sk.name}`, {
            fontSize: '15px', fill: isSelected ? '#00ffff' : '#666',
            backgroundColor: isSelected ? '#003333' : null,
            padding: 5, fontFamily: fontUI
        }).setInteractive().on('pointerdown', () => {
            currentSkin = sk.id; saveProgress(); refreshPlayerAppearance(scene);
            overlay.destroy(); showHangar(scene, mainMenu);
        });
        overlay.add(btn);
    });

    // ПРЕВЬЮ
    const previewSprite = scene.add.sprite(290, 210, player.texture.key).setScale(3);
    const glow = scene.add.circle(290, 210, 35, 0x00ffff, 0.1).setDepth(previewSprite.depth - 1);
    overlay.add([glow, previewSprite]);

    // --- БЛОК BOSS INTEL (Исправленный для телефонов) ---
    const intel = getBossIntel();
    const intelBox = scene.add.rectangle(187, 500, 340, 105, 0x000000, 0.7).setStrokeStyle(1, 0xff00ff);

    // Добавляем padding: { top: 5 }, чтобы буквы не прижимались к верхнему краю
    const intelTitle = scene.add.text(colX + 5, 450, `${TRANSLATIONS[lang].boss_scanning}${level}`, {
        fontSize: '11px', fill: '#ff00ff', fontFamily: fontUI, padding: { top: 5, bottom: 5 }
    });

    const bossName = scene.add.text(187, 480, `${TRANSLATIONS[lang].target}: ${intel.name}`, {
        fontSize: '16px', fill: '#fff', fontWeight: 'bold', fontFamily: fontUI, padding: { top: 5, bottom: 5 }
    }).setOrigin(0.5);

    const bossDesc = scene.add.text(187, 508, intel.desc, {
        fontSize: '11px', fill: '#aaa', align: 'center', wordWrap: { width: 300 },
        fontFamily: fontUI, padding: { top: 5, bottom: 5 }
    }).setOrigin(0.5);

    const bossTip = scene.add.text(187, 538, `${TRANSLATIONS[lang].suggest}: ${intel.tip}`, {
        fontSize: '12px', fill: '#00ff00', fontWeight: 'bold', fontFamily: fontUI,
        padding: { top: 5, bottom: 5 }
    }).setOrigin(0.5);

    overlay.add([intelBox, intelTitle, bossName, bossDesc, bossTip]);

    // Кнопка BACK
    const back = scene.add.text(187, 615, TRANSLATIONS[lang].back, {
        fontSize: '16px', fill: '#fff', backgroundColor: '#330033', padding: 12,
        fontFamily: fontUI, fontWeight: 'bold'
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
        overlay.destroy(); mainMenu.setVisible(true);
    });
    overlay.add(back);
}

function getShipStats() {
    let stats = { atk: 1, spd: 1, label: "" };
    const isRu = (lang === 'ru');

    if (currentShape === 'striker') {
        stats.atk += 0.2;
        stats.label = isRu ? "УДАРНИК: +20% АТК" : "STRIKER: +20% ATK";
    } else {
        stats.label = isRu ? "БАЗОВЫЙ КОРПУС" : "STANDARD HULL";
    }

    if (currentSkin === 'gold') {
        stats.atk += 0.1;
        stats.label += isRu ? " | ЗОЛОТО: +10% АТК" : " | GOLD: +10% ATK";
    } else if (currentSkin === 'ghost') {
        stats.spd += 0.15;
        stats.label += isRu ? " | ПРИЗРАК: +15% СКОР" : " | GHOST: +15% SPD";
    }

    return stats;
}

function getBossIntel() {
    const isRu = (lang === 'ru');
    if (level < 15) {
        return {
            name: isRu ? "ДРОН-РАЗВЕДЧИК" : "SCOUT_DRONE",
            desc: isRu ? "Легкая броня. Стандартные паттерны стрельбы." : "Light armor. Standard patterns.",
            tip: isRu ? "ЗОЛОТО (для фарма)" : "GOLD (for farming)"
        };
    } else if (level < 20) {
        return {
            name: isRu ? "МЕГА-ТУРЕЛЬ" : "MEGA_TURRET",
            desc: isRu ? "Боковые пушки. Высокая скорострельность." : "Dual side cannons. High fire rate.",
            tip: isRu ? "УДАРНИК (+20% АТК)" : "STRIKER (+20% ATK)"
        };
    } else if (level < 30) {
        return {
            name: isRu ? "МАСТЕР ЩИТА" : "SHIELD_MASTER",
            desc: isRu ? "Орбитальная защита. Сложно попасть." : "Orbital protection. Hard to hit.",
            tip: isRu ? "УДАРНИК (Пробивай щиты)" : "STRIKER (Break shields)"
        };
    } else if (level >= 30) {
        return {
            name: isRu ? "ПЕРЕГРУЗКА ЯДРА" : "CORE_OVERLOAD",
            desc: isRu ? "Режим ярости. Пулевой ад." : "Rage mode. Bullet hell chaos.",
            tip: isRu ? "МАНЕВРИРУЙ (Выживи любой ценой)" : "MANEUVER (Survive at all costs)"
        };
    } else {
        return {
            name: isRu ? "КВАНТОВЫЙ ФАНТОМ" : "QUANTUM_PHANTOM",
            desc: isRu ? "Мгновенное перемещение. Нестабильная материя." : "Instant teleportation. Unstable matter.",
            tip: isRu ? "УЛЬТРА-АНТЕННА (Бей быстро)" : "ULTRA ANTENNA (Strike fast)"
        };
    }
}

async function submitScore(dist, lvl) {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (!user) return;

    try {
        await fetch(`${botUrl}/submit_score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: user.first_name,
                score: Math.floor(dist),
                level: lvl,
                skin: currentSkin
            })
        });
        console.log("Рекорд отправлен на сервер!");
    } catch (e) {
        console.error("Ошибка связи с сервером Render:", e);
    }
}

async function showLeaderboard(scene, mainMenu) {
    const overlay = scene.add.container(0, 0).setDepth(4000);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.98).fillRect(0, 0, 375, 667);
    overlay.add(bg);

    const fontUI = 'Arial, sans-serif';
    const title = scene.add.text(187, 45, TRANSLATIONS[lang].top, {
        fontSize: '24px', fill: '#ffff00', fontWeight: 'bold', fontFamily: fontUI
    }).setOrigin(0.5);
    overlay.add(title);

    const loadingText = scene.add.text(187, 300, TRANSLATIONS[lang].db_connecting, {
        fontSize: '14px', fill: '#00ffff', fontFamily: fontUI
    }).setOrigin(0.5);
    overlay.add(loadingText);

    // Контейнер для списка (который будем скроллить)
    const listContainer = scene.add.container(0, 0);
    overlay.add(listContainer);

    // Маска (окно), через которое видно список (от 100px до 550px по высоте)
    const maskShape = scene.make.graphics().fillRect(0, 100, 375, 450);
    const mask = maskShape.createGeometryMask();
    listContainer.setMask(mask);

    try {
        // Берем ТОП-50
        const response = await fetch(`${botUrl}/get_leaderboard`);
        const data = await response.json();

        loadingText.destroy();

        if (!data || data.length === 0) {
            overlay.add(scene.add.text(187, 300, TRANSLATIONS[lang].db_empty, { fontSize: '16px', fill: '#aaa' }).setOrigin(0.5));
            return;
        }

        // Определяем ник текущего игрока для подсветки
        const myName = window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name || "YOU";
        let userInTop = false;

        data.forEach((entry, i) => {
            const y = 120 + (i * 45);
            let color = '#ffffff';
            let medal = (i === 0) ? '🥇 ' : (i === 1) ? '🥈 ' : (i === 2) ? '🥉 ' : `#${i+1} `;

            // Цвета для топ-3
            if (i === 0) color = '#FFD700';
            else if (i === 1) color = '#C0C0C0';
            else if (i === 2) color = '#CD7F32';

            const isMe = (entry.username === myName);
            if (isMe) {
                userInTop = true;
                // Рисуем подложку для игрока всегда
                const highlight = scene.add.rectangle(187, y + 10, 340, 35, 0x00ffff, 0.2).setOrigin(0.5, 0.3);
                listContainer.add(highlight);

                // Перекрашиваем текст в голубой ТОЛЬКО если игрок НЕ в топ-3
                if (i >= 3) color = '#00ffff';
            }

            const rankTxt = scene.add.text(20, y, medal, { fontSize: '13px', fill: color, fontWeight: 'bold', fontFamily: fontUI });
            const displayName = [...entry.username].slice(0, 9).join('').toUpperCase();
            const nameTxt = scene.add.text(65, y, displayName, { fontSize: '13px', fill: color, fontFamily: fontUI });

            // --- НОВЫЙ БЛОК: ФОРМАТИРОВАНИЕ И ОТРИСОВКА ДАТЫ ---
            let dateStr = '--.--.--';
            if (entry.score_date) {
                const d = new Date(entry.score_date);
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = String(d.getFullYear()).slice(-2);
                dateStr = `${day}.${month}.${year}`;
            }

            // Сдвигаем координаты для идеального баланса
            const dateTxt = scene.add.text(185, y + 3, dateStr, {
                fontSize: '10px', fill: color, fontFamily: fontUI, alpha: 0.6
            }).setOrigin(0, 0);
            listContainer.add(dateTxt);

            // Сдвигаем Сектор и Счет немного правее, чтобы освободить место
            const sectorTxt = scene.add.text(265, y, `S:${entry.level}`, { fontSize: '12px', fill: color, fontFamily: fontUI }).setOrigin(1, 0);
            const scoreTxt = scene.add.text(355, y, `${entry.score}m`, { fontSize: '13px', fill: color, fontWeight: 'bold', fontFamily: fontUI }).setOrigin(1, 0);

            listContainer.add([rankTxt, nameTxt, sectorTxt, scoreTxt]);
        });

        // Подсказка "Листай вниз"
        if (data.length > 10) {
            const scrollHint = scene.add.text(187, 535, lang === 'ru' ? "▼ ЛИСТАЙ ВНИЗ ▼" : "▼ SCROLL DOWN ▼", {
                fontSize: '12px', fontFamily: fontUI, fill: '#ffff00', fontWeight: 'bold'
            }).setOrigin(0.5).setDepth(4001);

            // Анимация мигания
            scene.tweens.add({ targets: scrollHint, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 });

            // Скрываем подсказку, как только игрок начал скроллить
            scene.input.on('pointermove', () => {
                if (scene.input.activePointer.isDown && scrollHint.active) {
                    scene.tweens.add({ targets: scrollHint, alpha: 0, duration: 300, onComplete: () => scrollHint.destroy() });
                }
            });
        }

        // ЛОГИКА СКРОЛЛА
        const listHeight = data.length * 45;
        const minY = 0;
        const maxY = Math.max(0, listHeight - 400);

        scene.input.on('pointermove', (pointer) => {
            if (pointer.isDown && !isShopOpen) {
                let dragY = pointer.y - pointer.prevPosition.y;
                listContainer.y = Phaser.Math.Clamp(listContainer.y + dragY, -maxY, minY);
            }
        });

    } catch (e) {
        console.error(e);
        loadingText.setText(TRANSLATIONS[lang].db_error);
    }

    // Кнопка BACK (Фиксирована внизу, вне контейнера списка)
    const back = scene.add.text(187, 615, TRANSLATIONS[lang].back, {
        fontSize: '17px', fill: '#fff', backgroundColor: '#330033', padding: { x: 20, y: 12 },
        fontFamily: fontUI, fontWeight: 'bold'
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
        scene.input.off('pointermove'); // Чистим слушатель скролла
        overlay.destroy();
        mainMenu.setVisible(true);
    });
    overlay.add(back);
}

function showDamageText(scene, x, y, damage, color = '#00ff00', size = '16px') {
    let txt = scene.add.text(x, y, `-${Math.floor(damage)}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: size,
        fill: color,
        fontWeight: 'bold',
        stroke: '#000',
        strokeThickness: 3,
        padding: 5
    }).setDepth(100);

    scene.tweens.add({
        targets: txt,
        y: y - 100,
        x: x + Phaser.Math.Between(-40, 40),
        alpha: 0,
        scale: size === '26px' ? 1.5 : 1.2, // Критический урон еще и растет в полете
        duration: 900,
        onComplete: () => txt.destroy()
    });
}

async function syncUserData() {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (!user) return;

    try {
        const response = await fetch(`${botUrl}/get_leaderboard`);
        const data = await response.json();

        // Ищем данные текущего игрока в топе
        const myData = data.find(d => d.username === user.first_name);

        if (myData) {
            console.log("Данные игрока найдены в базе, синхронизирую...");

            // Восстанавливаем покупки
            if (myData.omega) upgradeLevels.omega = 1;

            if (myData.skin && myData.skin !== 'classic') {
                currentSkin = myData.skin;
                upgradeLevels[`skin_${myData.skin}`] = 1;
                // Обновляем визуально корабль, если мы уже в игре
                if (player) { refreshPlayerAppearance(this); }
            }

            // Если в базе уровень или монеты больше, чем в локальном сейве
            if (myData.level > level) level = myData.level;

            saveProgress();
        }
    } catch (e) {
        console.error("Sync error:", e);
    }
}