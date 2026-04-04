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
let shipName = "RAZOR-01";
let currentExplosionColor = 0xff0000;
let currentShopTab = 'upgrades';
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
let totalDistance = 0, bossesKilled = 0;
let achievements = {
    flawless: false,
    rich: false,
    marathon: false
};
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
        share_duel: "⚔️ CHALLENGE FRIEND",
        share_duel_text: "I reached Sector %lvl% in Glitched Arena! Can you survive longer?",
        profile: "[ PROFILE ]",

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
        fx_blue_exp: "CYAN EXPLOSION",
        desc_blue_exp: "Your ship explodes with neon cyan",
        fx_pink_exp: "PINK EXPLOSION",
        desc_pink_exp: "Your ship explodes with glitch pink",

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
        gary_intro: "Look what we have here... a new 'pilot'. Try not to break my system, okay? Use the Credits to upgrade, or you won't last a second. Good luck, meatbag.",
        gary_intro_ship: "Oh, so you named this junk heap «%ship%»? Cute. I hope it burns as beautifully as it's named. Listen up...",

        // Состояния
        lost: "CONNECTION_LOST",
        revive: "REVIVE",
        watch_ad: "FREE REBOOT (AD)",
        hard_reboot: "HARD REBOOT (SEC 1)",
        purified: "SYSTEM_PURIFIED",
        magnet_on: "MAGNET_LINK_ACTIVE",
        time_warp: "TIME_WARP_ACTIVE",

        achievementss: "--- ACHIEVEMENTS ---",
        fx_title: "--- VISUAL FX ---",
        up_title: "--- SHIP UPGRADES ---",
        fx_blue_exp: "CYAN EXPLOSION", desc_blue_exp: "Your ship explodes with neon cyan",
        fx_pink_exp: "PINK EXPLOSION", desc_pink_exp: "Your ship explodes with glitch pink",
        fx_rainbow: "RAINBOW TRAIL", desc_rainbow: "Leave a colorful trail behind",
        flawlesst: "FLAWLESS",
        boss_damage: "Boss: 0 damage",
        tycoon: "TYCOON",
        rich_credit: "5000 credits",
        marathons: "MARATHON",
        run_m: "5000m run",
        change_name: "[ CHANGE NAME ]",
        underst: "[ I UNDERSTAND ]",
        ship_name:"Enter ship name:",
        callsign_label: "--- CALLSIGN ---",
        tap_edit: "[ TAP TO EDIT ]"
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
        share_duel: "⚔️ ВЫЗВАТЬ НА ДУЭЛЬ",
        share_duel_text: "Я дошел до Сектора %lvl% в Glitched Arena! Выживешь дольше?",
        profile: "[ ПРОФИЛЬ ]",

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
        fx_blue_exp: "ГОЛУБОЙ ВЗРЫВ",
        desc_blue_exp: "Корабль взрывается неоновым синим",
        fx_pink_exp: "РОЗОВЫЙ ВЗРЫВ",
        desc_pink_exp: "Корабль взрывается розовым глитчем",

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
        gary_intro: "Смотрите-ка... новый «пилот». Постарайся не сломать мою систему, ладно? Трать Кредиты на пушки, иначе не продержишься и секунды. Удачи, белковый.",
        gary_intro_ship: "О, ты назвал эту жестянку «%ship%»? Мило. Надеюсь, она горит так же красиво, как и называется. Слушай сюда...",

        // Состояния
        lost: "СВЯЗЬ ПОТЕРЯНА",
        revive: "ВОССТАНОВИТЬ",
        watch_ad: "РЕБУТ (ЗА РЕКЛАМУ)",
        hard_reboot: "ХАРД-РЕБУТ (СЕК 1)",
        purified: "СИСТЕМА ОЧИЩЕНА",
        magnet_on: "МАГНИТНЫЙ ЗАХВАТ",
        time_warp: "ВРЕМЯ ЗАМЕДЛЕНО",

        achievementss: "--- ДОСТИЖЕНИЯ ---",
        fx_title: "--- СПЕЦЭФФЕКТЫ ---",
        up_title: "--- ПРОКАЧКА КОРАБЛЯ ---",
        fx_blue_exp: "ГОЛУБОЙ ВЗРЫВ", desc_blue_exp: "Корабль взрывается неоновым синим",
        fx_pink_exp: "РОЗОВЫЙ ВЗРЫВ", desc_pink_exp: "Корабль взрывается розовым глитчем",
        fx_rainbow: "РАДУЖНЫЙ ШЛЕЙФ", desc_rainbow: "Радуга тянется за вашим кораблем",
        flawlesst: "БЕЗУПРЕЧНЫЙ",
        boss_damage: "Босс без урона",
        tycoon: "МАГНАТ",
        rich_credit: "Накопил 5000$",
        marathons: "МАРАФОНЕЦ",
        run_m: "5000м за вылет",
        change_name: "[ ИЗМЕНИТЬ ИМЯ ]",
        underst: "[ Я ПРИНЯЛ ]",
        ship_name:"Введите имя корабля:",
        callsign_label: "--- ПОЗЫВНОЙ ---",
        tap_edit: "[ ТЫКНИ ДЛЯ СМЕНЫ ]"
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
        totalDistance,
        bossesKilled,
        achievements,
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
        totalDistance = p.totalDistance || 0;
        bossesKilled = p.bossesKilled || 0;
        achievements = p.achievements || { flawless: false, rich: false, marathon: false };
        maxPlayerHealth = p.maxPlayerHealth || 100;
        isShieldActive = p.isShieldActive || false;
        currentShape = p.currentShape || 'classic';
        currentSkin = p.currentSkin || 'classic';
        yOffset = p.yOffset !== undefined ? p.yOffset : -50;
        isDead = p.isDeadInSave || false;
        lastRunState = p.lastRunState || { isDead: false, pendingDeath: false };

        upgradeLevels = { ...upgradeLevels, ...p.upgradeLevels };

        runGoal = 700 + (level - 1) * 100;
    }
};
loadProgress();

const config = {
    type: Phaser.AUTO,
    //width: 375,
    //height: 667,
    parent: 'game-container',
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT, // Игра будет растягиваться под размер окна
        autoCenter: Phaser.Scale.CENTER_BOTH, // Центрируем игру
        width: 375,
        height: 667
    },
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

    // НОВЫЙ "РАЗМЫТЫЙ" ПИКСЕЛЬ (Streak для скорости)
    g.clear();
    // Рисуем длинную полоску
    g.fillStyle(0xffffff, 1).fillRect(0, 0, 2, 32);
    // Добавляем легкое свечение по бокам (прозрачность 0.3)
    g.fillStyle(0xffffff, 0.3).fillRect(-1, 2, 4, 28);

    // РИСУЕМ ГАРИ (Экран-монитор с глазами)
    g.clear();
    g.fillStyle(0x333333).fillRect(0, 5, 40, 30); // Корпус монитора
    g.fillStyle(0x000000).fillRect(4, 9, 32, 22); // Экран
    g.fillStyle(0x00ff00).fillRect(10, 15, 4, 4); // Левый глаз
    g.fillStyle(0x00ff00).fillRect(26, 15, 4, 4); // Правый глаз
    g.lineStyle(2, 0x00ff00).lineBetween(12, 25, 28, 25); // Рот-полоска
    g.generateTexture('gary_avatar', 40, 40);

    g.generateTexture('fast_streak', 4, 32);
    g.destroy();
}

function create() {
    // Сообщаем Телеграму, что мы хотим расшириться
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.expand();
        window.Telegram.WebApp.ready();
    }
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
    playerHealth = maxPlayerHealth;
    let healthMult = level > 30 ? (30 * 0.45 + (level - 30) * 0.22) : (level * 0.45);
    bossHealth = 400 * (1 + healthMult);
    isMagnetActive = false;
    isGlitchMode = false;
    this.physics.world.timeScale = 1;

    // ГЕНЕРАЦИЯ ИГРОКА
    const pTex = generatePlayerTexture(this);
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
        const userId = Telegram.WebApp.initDataUnsafe.user.id;
    }
    // Игрок всегда внизу (600px)
    player = this.physics.add.sprite(187, 600, pTex).setDepth(10).setCollideWorldBounds(true);
    shieldAura = this.add.sprite(player.x, player.y, 'shield_aura').setDepth(11).setVisible(false);

    // 1. Создаем 3 слоя параллакса
    this.starsSlow = this.add.particles(0, 0, 'pixel', {
        x: { min: 0, max: 375 }, y: -10,
        speedY: { min: 20, max: 50 }, // Очень медленные
        scale: 0.2, alpha: 0.3, lifespan: 10000, frequency: 100, tint: 0x5555ff
    });

    this.starsMed = this.add.particles(0, 0, 'pixel', {
        x: { min: 0, max: 375 }, y: -10,
        speedY: { min: 80, max: 150 }, // Средние
        scale: 0.4, alpha: 0.6, lifespan: 5000, frequency: 200, tint: 0x00ffff
    });

    this.starsFast = this.add.particles(0, 0, 'fast_streak', {
        x: { min: -50, max: 425 },
        y: -50,
        speedY: { min: 600, max: 1200 },

        // ЭФФЕКТ СКОРОСТИ: Растягиваем частицу по вертикали в зависимости от скорости
        scaleY: { start: 1, end: 1.5, ease: 'Quad.easeIn' },
        // Делаем её очень узкой по горизонтали
        scaleX: { min: 0.1, max: 0.3 },

        alpha: { start: 0.6, end: 0 },
        lifespan: 1500,
        frequency: 30,
        tint: 0xccffff,
        blendMode: 'ADD'
    });

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

    if (!localStorage.getItem('GLITCHED_ARENA_INTRO_DONE')) {
        showGaryIntro(this);
    }

}

function update(time, delta) {
    if (!isStarted || isShopOpen || isVictory || isDead || isPaused) return;

    if (player && player.active && !isPaused) {
        // Рассчитываем разницу в движении для наклона
        let targetAngle = (player.x - this.input.activePointer.x) * 0.5;
        // Ограничиваем наклон (не более 15 градусов)
        targetAngle = Phaser.Math.Clamp(targetAngle, -15, 15);

        // Плавно меняем угол (интерполяция для мягкости)
        player.angle = Phaser.Math.Linear(player.angle, -targetAngle, 0.1);

        // Эффект перспективы: чуть-чуть сужаем корабль при наклоне
        player.scaleX = 1 - (Math.abs(player.angle) * 0.01);
    }

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
        let deltaDist = delta * (0.08 + level * 0.01 + upgradeLevels.speed * 0.03) * currentStats.spd;
        distance += deltaDist;
        totalDistance += deltaDist;

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
        if (currentDist >= 5000 && !achievements.marathon) {
            achievements.marathon = true;
            saveProgress();
        }
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
            let hM = level > 30 ? (13.5 + (level - 30) * 0.22) : (level * 0.45);
            let maxB = 400 * (1 + hM);
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
    if (isDead || isVictory || !isStarted) return;

    combo = 0;

    let isCrit = playerHealth < 20;
    let dColor = isCrit ? '#ff0055' : '#ff0000';
    let dSize = isCrit ? '26px' : '18px';

    showDamageText(scene, player.x, player.y, dmg, dColor, dSize);

    if (isShieldActive) {
        isShieldActive = false;
        saveProgress();
        scene.cameras.main.flash(200, 0, 255, 255);
        return;
    }

    if (playerHealth - dmg <= 0 && (bossHealth <= 0 || isVictory)) {
        playerHealth = 1;
        glitchText.setText(TRANSLATIONS[lang].heroic_survival).setFill("#ffff00");

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

    // --- ВИЗУАЛ СМЕРТИ (ВЗРЫВ) ---
    for(let i = 0; i < 25; i++) {
        let frag = scene.add.rectangle(player.x, player.y, 5, 5, currentExplosionColor).setDepth(20);
        scene.physics.add.existing(frag);
        frag.body.setVelocity(Phaser.Math.Between(-400, 400), Phaser.Math.Between(-400, 400));
        // Плавное исчезновение осколков
        scene.tweens.add({ targets: frag, alpha: 0, scale: 0, duration: 1000, onComplete: () => frag.destroy() });
    }
    scene.cameras.main.shake(300, 0.03); // Тряска при взрыве

    if (Math.floor(distance) > bestDistance) {
        bestDistance = Math.floor(distance);
    }
    submitScore();

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
    btn(280, `${TRANSLATIONS[lang].revive_label} [100]`, coins >= 100 ? '#004444' : '#222', () => {
        if (coins >= 100) { coins -= 100; playerHealth = maxPlayerHealth; isDead = false;
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

    // Кнопка дуэли
    btn(520, TRANSLATIONS[lang].share_duel, '#004488', () => {
        shareDuel();
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
                scene.time.delayedCall(3000, () => {
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
                if (isBossFight && !isVictory && !isDead && !isPaused) {
                    // Создаем ловушку на старом месте
                    let trap = obstacles.create(boss.x, boss.y, 'pixel').setTint(0xff0000).setScale(4);
                    trap.setData('isTrap', true);
                    scene.tweens.add({ targets: trap, alpha: {from: 1, to: 0.2}, duration: 2000, onComplete: () => trap.destroy() });
                    // Эффект перед прыжком
                    let ghost = scene.add.sprite(boss.x, boss.y, 'boss').setTint(0x00ff00).setAlpha(0.6);
                    scene.tweens.add({ targets: ghost, scale: 2, alpha: 0, duration: 400, onComplete: () => ghost.destroy() });

                    boss.x = Phaser.Math.Between(50, 325);
                    boss.y = Phaser.Math.Between(100, 250);
                    scene.cameras.main.flash(150, 0, 255, 0, 0.3);
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
    let hM = level > 30 ? (13.5 + (level - 30) * 0.22) : (level * 0.45);
    let maxB = 400 * (1 + hM);

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
                let hM = level > 30 ? (13.5 + (level - 30) * 0.22) : (level * 0.45);
                let maxB = 400 * (1 + hM);
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

    // 1. ОСТАНОВКА ВСЕХ СИСТЕМ
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

    // 3. ПОЛНАЯ ЗАЧИСТКА ГРАФИКИ
    if (scene.overheadGfx) {
        scene.overheadGfx.clear();
        scene.overheadGfx.destroy();
        scene.overheadGfx = null;
    }
    if (overdriveBar) { overdriveBar.clear(); overdriveBar.setVisible(false); }
    if (roadBar) { roadBar.clear(); roadBar.setVisible(false); }

    // Прячем текстовые метки (HP, Дистанция)
    [pHealthLabel, bHealthLabel, distanceText, glitchText].forEach(t => {
        if (t) { t.setVisible(false); t.setAlpha(0); }
    });

    // --- УДАЛЯЕМ ПОМОЩНИКОВ БОССА ---
    if (bossTurretL) { bossTurretL.destroy(); bossTurretL = null; }
    if (bossTurretR) { bossTurretR.destroy(); bossTurretR = null; }
    if (bossTurretLTrail) { bossTurretLTrail.destroy(); bossTurretLTrail = null; }
    if (bossTurretRTrail) { bossTurretRTrail.destroy(); bossTurretRTrail = null; }

    boss.setVisible(false);

    if (scene.ovrText) { scene.ovrText.destroy(); scene.ovrText = null; }

    // 4. ЛОГИКА СОХРАНЕНИЯ
    player.setVisible(false);
    if (trailEmitter) trailEmitter.stop();

    level++;
    bossesKilled++;
    if (Math.floor(distance) > bestDistance) bestDistance = Math.floor(distance);

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

    if (playerHealth >= maxPlayerHealth && !achievements.flawless) {
        achievements.flawless = true;
    }

    scene.time.delayedCall(3000, () => {
        showRewardUI(scene, vText);
    });
}

function showRewardUI(scene, titleText) {
    const container = scene.add.container(0, 0).setDepth(5001);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.9).fillRect(0, 0, 375, 667);
    container.add(bg);

    const earnedAmount = coinsThisRun;
    const info = scene.add.text(187, 330,
        `${lang === 'ru' ? 'ДОБЫТО' : 'COLLECTED'}: ${earnedAmount} 💰`,
        { fontSize: '24px', fill: '#ffff00', fontWeight: 'bold', fontFamily: 'Arial' }
    ).setOrigin(0.5);

    const doubleBtn = scene.add.text(187, 420,
        ` x2 ${lang === 'ru' ? 'ЗА РЕКЛАМУ' : 'WITH AD'} `,
        { fontSize: '20px', fill: '#fff', backgroundColor: '#004400', padding: 15, fontWeight: 'bold' }
    ).setOrigin(0.5).setInteractive();

    const collectBtn = scene.add.text(187, 500,
        ` ${lang === 'ru' ? 'ПРОСТО ЗАБРАТЬ' : 'JUST COLLECT'} `,
        { fontSize: '16px', fill: '#aaa', padding: 10 }
    ).setOrigin(0.5).setInteractive();

    const duelBtn = scene.add.text(187, 560,
        ` ⚔️ ${TRANSLATIONS[lang].share_duel} `,
        { fontSize: '14px', fill: '#00ffff', padding: 10 }
    ).setOrigin(0.5).setInteractive();

    container.add([info, doubleBtn, collectBtn, duelBtn]);

    duelBtn.on('pointerdown', () => shareDuel());

    doubleBtn.on('pointerdown', () => {
        const ads = window.adController;
        if (!ads) { finalizeCollection(earnedAmount * 2); return; }
        ads.show().then(result => {
            if (result && result.done) finalizeCollection(earnedAmount * 2);
            else alert(lang === 'ru' ? "Нужно досмотреть до конца!" : "Watch till the end!");
        }).catch(() => finalizeCollection(earnedAmount * 2));
    });

    collectBtn.on('pointerdown', () => finalizeCollection(earnedAmount));

    function finalizeCollection(finalSum) {
        coins += finalSum;
        coinsThisRun = 0;
        saveProgress();
        submitScore();
        if (coins >= 5000 && !achievements.rich) achievements.rich = true;

        isVictory = false;
        isShopOpen = false;
        isDead = false;
        isBossFight = false;

        container.destroy();
        if (titleText) titleText.destroy();
        showShop(scene, null);
    }
}

function showShop(scene, mainMenu) {
    saveProgress();
    isShopOpen = true;
    const overlay = scene.add.container(0, 0).setDepth(4000);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.98).fillRect(0, 0, 375, 667);
    overlay.add(bg);

    const fontUI = 'Arial, sans-serif';

    // --- ФИКСИРОВАННАЯ ШАПКА ---
    const creds = scene.add.text(187, 25, `${TRANSLATIONS[lang].credits}: ${coins}`, {
        fill: '#ffff00', fontSize: '20px', fontWeight: 'bold', fontFamily: fontUI
    }).setOrigin(0.5);
    const stats = scene.add.text(187, 45, `${TRANSLATIONS[lang].best}: S${bestLevel} | ${bestDistance}m`, {
        fill: '#00ff00', fontSize: '11px', fontWeight: 'bold', fontFamily: fontUI
    }).setOrigin(0.5);
    overlay.add([creds, stats]);

    // КНОПКИ ПЕРЕКЛЮЧЕНИЯ КАТЕГОРИЙ
    const upBtn = scene.add.rectangle(100, 85, 165, 35, currentShopTab === 'upgrades' ? 0x00ffff : 0x222222)
        .setInteractive().setStrokeStyle(1, 0x00ffff, 0.5).setDepth(4010);
    const upText = scene.add.text(100, 85, lang === 'ru' ? "ПРОКАЧКА" : "UPGRADES", {
        fontSize: '14px', fontFamily: fontUI, fill: currentShopTab === 'upgrades' ? '#000' : '#fff', fontWeight: 'bold'
    }).setOrigin(0.5).setDepth(4011);

    const fxBtn = scene.add.rectangle(275, 85, 165, 35, currentShopTab === 'fx' ? 0xff00ff : 0x222222)
        .setInteractive().setStrokeStyle(1, 0xff00ff, 0.5).setDepth(4010);
    const fxText = scene.add.text(275, 85, lang === 'ru' ? "КРАСОТА" : "FX / SKINS", {
        fontSize: '14px', fontFamily: fontUI, fill: currentShopTab === 'fx' ? '#000' : '#fff', fontWeight: 'bold'
    }).setOrigin(0.5).setDepth(4011);

    overlay.add([upBtn, upText, fxBtn, fxText]);

    upBtn.on('pointerdown', () => {
        currentShopTab = 'upgrades';
        overlay.destroy();
        showShop(scene, mainMenu);
    });
    fxBtn.on('pointerdown', () => {
        currentShopTab = 'fx';
        overlay.destroy();
        showShop(scene, mainMenu);
    });

    // --- ЗОНА ПРОКРУТКИ ---
    const scrollAreaTop = 110;
    const scrollAreaBottom = isVictory ? 510 : 560;
    const scrollHeight = scrollAreaBottom - scrollAreaTop;

    const scrollWindow = scene.add.container(0, scrollAreaTop).setDepth(4001);
    overlay.add(scrollWindow);

    const contentContainer = scene.add.container(0, 0);
    scrollWindow.add(contentContainer);

    const mask = scene.make.graphics().fillRect(10, scrollAreaTop, 355, scrollHeight).createGeometryMask();
    scrollWindow.setMask(mask);

    let scrollY = 0, maxScroll = 0;

    const showConfirm = (title, cost, isStars, onConfirm) => {
        const confirmOverlay = scene.add.container(0, 0).setDepth(6000);
        const cBg = scene.add.graphics().fillStyle(0x000000, 0.9).fillRect(0, 0, 375, 667);
        cBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 375, 667), Phaser.Geom.Rectangle.Contains);

        const panel = scene.add.rectangle(187, 333, 280, 180, 0x222222).setStrokeStyle(2, 0x00ffff);
        const txt = scene.add.text(187, 280, `${lang === 'ru' ? 'КУПИТЬ' : 'BUY'}\n${title}?`, {
            fontSize: '18px', fontFamily: fontUI, fill: '#fff', align: 'center', fontWeight: 'bold'
        }).setOrigin(0.5);

        const price = scene.add.text(187, 325, `${cost} ${isStars ? '⭐' : '💰'}`, {
            fontSize: '22px', fontFamily: fontUI, fill: isStars ? '#ffaa00' : '#ffff00', fontWeight: 'bold'
        }).setOrigin(0.5);

        const yesBtn = scene.add.text(120, 385, `[ ${lang === 'ru' ? 'ДА' : 'YES'} ]`, {
            fontSize: '20px', fontFamily: fontUI, fill: '#00ff00', backgroundColor: '#003300', padding: 10
        }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
            confirmOverlay.destroy();
            onConfirm();
        });

        const noBtn = scene.add.text(254, 385, `[ ${lang === 'ru' ? 'НЕТ' : 'NO'} ]`, {
            fontSize: '20px', fontFamily: fontUI, fill: '#ff0000', backgroundColor: '#330000', padding: 10
        }).setOrigin(0.5).setInteractive().on('pointerdown', () => confirmOverlay.destroy());

        confirmOverlay.add([cBg, panel, txt, price, yesBtn, noBtn]);
    };

    // === ФУНКЦИЯ КНОПКИ ===
    const createBtn = (y, nameKey, descKey, cost, type, action) => {
        const maxLvl = (type === 'health') ? 20 : 1;
        let curLvl = (type === 'shield') ? (isShieldActive ? 1 : 0) : (upgradeLevels[type] || 0);
        let isMaxed = curLvl >= maxLvl;

        const isStarItem = ['skin_gold', 'skin_ghost', 'omega', 'buy_coins', 'fx_blue', 'fx_pink'].includes(type);
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
        let levelInfo = (maxLvl > 1) ? ` [${curLvl}/${maxLvl}]` : "";
        let priceTag = isMaxed ? `[${TRANSLATIONS[lang].maxed || 'MAX'}]` : `- ${cost} ${isStarItem ? '⭐' : '💰'}`;
        if (isLocked) priceTag = `[${TRANSLATIONS[lang].sector} 40+]`;

        const btnText = scene.add.text(187, y - 10, `${namet}${levelInfo} ${priceTag}`, {
            fontSize: '13px', fill: isLocked ? '#777' : '#fff', fontWeight: 'bold', fontFamily: fontUI
        }).setOrigin(0.5);

        const descText = scene.add.text(187, y + 10, TRANSLATIONS[lang][descKey], {
            fontSize: '10px', fill: isLocked ? '#444' : '#aaa', fontFamily: fontUI,
            wordWrap: { width: 310 }, align: 'center'
        }).setOrigin(0.5);

        btnBg.on('pointerdown', () => {
            if (isLocked) { scene.cameras.main.shake(100, 0.01); return; }
            if (isMaxed) return;

            // Вызываем подтверждение вместо мгновенной покупки
            showConfirm(namet, cost, isStarItem, () => {
                if (isStarItem) {
                    if (cost === 0) {
                        upgradeLevels[type] = 1;
                        saveProgress();
                        overlay.destroy();
                        showShop(scene, mainMenu);
                        return;
                    }
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
                    });
                } else {
                    if (coins >= cost) {
                        coins -= cost;
                        if (type === 'shield') { isShieldActive = true; upgradeLevels.shield = 1; }
                        else { upgradeLevels[type] = (upgradeLevels[type] || 0) + 1; }
                        if (action) action();
                        saveProgress();
                        overlay.destroy();
                        showShop(scene, mainMenu);
                    } else {
                        scene.cameras.main.shake(200, 0.01);
                    }
                }
            });
        });

        contentContainer.add([btnBg, btnText, descText]);
    };

    // === СПИСОК КНОПОК ===
    let sY = 30, step = 58;
    if (currentShopTab === 'upgrades') {
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
        maxScroll = step * 7;
    } else {
        createBtn(sY, "skin_striker", "desc_striker", 1500, 'skin_striker', () => { currentShape = 'striker'; refreshPlayerAppearance(scene); });
        createBtn(sY+step, "skin_gold", "desc_gold", 300, 'skin_gold', () => { currentSkin = 'gold'; refreshPlayerAppearance(scene); });
        createBtn(sY+step*2, "skin_ghost", "desc_ghost", 300, 'skin_ghost', () => { currentSkin = 'ghost'; refreshPlayerAppearance(scene); });
        createBtn(sY+step*3, "fx_blue_exp", "desc_blue_exp", 200, 'fx_blue', () => { currentExplosionColor = 0x00ffff; });
        createBtn(sY+step*4, "fx_pink_exp", "desc_pink_exp", 200, 'fx_pink', () => { currentExplosionColor = 0xff00ff; });
        maxScroll = step * 5;
    }

    // Считаем высоту контента
    const itemCount = (currentShopTab === 'upgrades' ? 7 : 5);
    const contentHeight = sY + (step * itemCount);

    const paddingBottom = isVictory ? 200 : 150;
    maxScroll = Math.max(0, contentHeight - scrollHeight + paddingBottom);

    // Обновленный обработчик колесика
    scene.input.on('wheel', (p, obj, dx, dy) => {
        scrollY = Phaser.Math.Clamp(scrollY - dy * 0.8, -maxScroll, 0);
        contentContainer.y = scrollY;
    });

    // Обновленный обработчик свайпа
    scene.input.on('pointermove', (p) => {
        if (p.isDown && p.y > 110 && p.y < 560) {
            scrollY = Phaser.Math.Clamp(scrollY + (p.y - p.prevPosition.y), -maxScroll, 0);
            contentContainer.y = scrollY;
        }
    });

    // === НИЖНЯЯ ПАНЕЛЬ (КНОПКИ В РЯД) ===
    const footerY = 625;
    const btnWidth = 165;

    // 1. Кнопка В МЕНЮ (Слева)
    const backBg = scene.add.rectangle(100, footerY, btnWidth, 45, 0x330033).setInteractive().setStrokeStyle(1, 0xff00ff, 0.5);
    const backTxt = scene.add.text(100, footerY, TRANSLATIONS[lang].back, {
        fontSize: '13px', fill: '#ff00ff', fontWeight: 'bold', fontFamily: fontUI
    }).setOrigin(0.5);

    // 2. Кнопка ПРИГЛАСИТЬ (Справа)
    const invColor = upgradeLevels.shareClaimed ? 0x222222 : 0x004400;
    const invBg = scene.add.rectangle(275, footerY, btnWidth, 45, invColor).setInteractive().setStrokeStyle(1, 0x00ff88, 0.5);
    const invTxt = scene.add.text(275, footerY, upgradeLevels.shareClaimed ? "✓" : `👥 ${lang === 'ru' ? '+500' : '+500'}`, {
        fontSize: '14px', fontFamily: fontUI, fill: upgradeLevels.shareClaimed ? '#777' : '#00ff88', fontWeight: 'bold'
    }).setOrigin(0.5);

    overlay.add([backBg, backTxt, invBg, invTxt]);

    // Логика кнопок
    backBg.on('pointerdown', () => {
        saveProgress();

        // СБРОС СОСТОЯНИЙ
        isVictory = false;
        isStarted = false;
        isDead = false;
        isBossFight = false;

        scene.input.off('wheel');
        overlay.destroy();

        if (mainMenu) {
            mainMenu.setVisible(true);
            if (mainMenu.titleRef) startTitleGlitch(scene, mainMenu.titleRef);
        } else {
            showMenu(scene);
        }
    });
    invBg.on('pointerdown', () => {
        const shareText = encodeURIComponent(TRANSLATIONS[lang].share_invite.replace("%lvl%", level).replace("%dist%", bestDistance));
        const fullLink = `https://t.me/share/url?url=${encodeURIComponent(SHARE_LINK)}&text=${shareText}`;
        if (window.Telegram?.WebApp) {
            Telegram.WebApp.openTelegramLink(fullLink);
            if (!upgradeLevels.shareClaimed) {
                coins += 500; upgradeLevels.shareClaimed = true; saveProgress();
                creds.setText(`${TRANSLATIONS[lang].credits}: ${coins}`);
                invBg.setFillStyle(0x222222); invTxt.setText("✓").setFill("#777");
            }
        } else window.open(fullLink, '_blank');
    });

    // Функция очистки
    const cleanupAndClose = () => {
        scene.input.off('wheel');

        overlay.destroy();
        isShopOpen = false;
        isVictory = false;
        isBossFight = false;
        isDead = false;
        isStarted = false;

        if (mainMenu) {
            mainMenu.setVisible(true);
            if (mainMenu.titleRef) startTitleGlitch(scene, mainMenu.titleRef);
        }
    };


    if (isVictory) {
        const nextBg = scene.add.rectangle(187, 520, 330, 50, 0x003333).setInteractive().setStrokeStyle(2, 0x00ffff);
        const nextTxt = scene.add.text(187, 520, `${TRANSLATIONS[lang].deploy_btn} ${level}`, {
            fontSize: '18px', fill: '#00ffff', fontWeight: 'bold', fontFamily: fontUI
        }).setOrigin(0.5);

        // Эффект пульсации для привлечения внимания
        scene.tweens.add({ targets: nextBg, alpha: 0.7, duration: 600, yoyo: true, repeat: -1 });

        nextBg.on('pointerdown', () => {
            scene.input.off('wheel');
            overlay.destroy();
            isShopOpen = false;
            isVictory = false;
            shouldAutoStart = true;
            scene.scene.restart();
        });
        overlay.add([nextBg, nextTxt]);
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
    let obstacle = obstacles.create(x, -20, 'wall'); // Появляется чуть выше

    // ПСЕВДО-3D: Начинаем с маленького размера
    obstacle.setScale(0.2).setAlpha(0);

    // Анимация "вылета" на игрока
    this.tweens.add({
        targets: obstacle,
        scale: 1,
        alpha: 1,
        duration: 400, // Быстро увеличивается при появлении
        ease: 'Quad.easeOut'
    });

    if (level >= 3 && Math.random() > 0.65) {
        obstacle.setData('isDrone', true).setTint(0xffaa00);
        obstacle.setVelocityY(320 + (level * 8));
    } else {
        obstacle.setTint(0xff0000);
        obstacle.setVelocityY(300 + (level * 12));
    }
}

function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        this.physics.pause();
        this.time.paused = true;
    } else {
        this.physics.resume();
        this.time.paused = false;
    }
}
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
    isVictory = false;
    isDead = false;
    isBossFight = false;
    isPaused = false;
    isShopOpen = false;

    scene.physics.resume();
    scene.time.paused = false;
    if (scene.physics && scene.physics.world) scene.physics.world.timeScale = 1;
    const menu = scene.add.container(0, 0).setDepth(3000);
    const bg = scene.add.graphics().fillStyle(0x000000, 1).fillRect(0, 0, 375, 667);

    const fontUI = 'Arial, sans-serif';

    // 1. ЗАГОЛОВОК С ГЛИТЧЕМ
    const title = scene.add.text(187, 80, TRANSLATIONS[lang].menu_title, {
        fontSize: '42px', fill: '#00ffff', align: 'center', fontWeight: 'bold',
        stroke: '#ff00ff', strokeThickness: 4, fontFamily: fontUI
    }).setOrigin(0.5);

    menu.titleRef = title;

    startTitleGlitch(scene, title);

    // Запускаем таймер глитча
    scene.glitchTimer = scene.time.addEvent({
        delay: 2000,
        callback: () => applyGlitchEffect(scene, title),
        callbackScope: scene,
        loop: true
    });

    // Вспомогательная функция для закрытия меню (чтобы не дублировать код в каждой кнопке)
    const closeMenu = () => {
        if (scene.glitchTimer) scene.glitchTimer.remove();
        menu.setVisible(false);
    };

    // 2. КНОПКА ПРОФИЛЬ И КОРАБЛИК
    const profileBtn = scene.add.text(187, 145, TRANSLATIONS[lang].profile, {
        fontSize: '16px', fontFamily: fontUI, fill: '#00ffff', fontWeight: 'bold'
    }).setOrigin(0.5).setInteractive();

    const miniShip = scene.add.sprite(110, 145, player.texture.key).setScale(0.8).setAlpha(0.8);

    scene.tweens.add({
        targets: miniShip,
        x: 105, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    profileBtn.on('pointerdown', () => { closeMenu(); showProfile(scene, menu); });

    // 3. ОСТАЛЬНЫЕ КНОПКИ
    const langBtn = scene.add.text(320, 30, lang.toUpperCase(), {
        fontSize: '14px', fill: '#ffff00', backgroundColor: '#222', padding: 8, fontFamily: fontUI
    }).setOrigin(0.5).setInteractive();

    langBtn.on('pointerdown', () => {
        lang = (lang === 'ru') ? 'en' : 'ru';
        saveProgress();
        if (scene.glitchTimer) scene.glitchTimer.remove(); // Чистим перед рестартом меню
        menu.destroy();
        showMenu(scene);
    });

    const btnStyle = { fontSize: '18px', fill: '#fff', backgroundColor: '#222', padding: 10, fontFamily: fontUI, fontWeight: 'bold' };

    const startBtn = scene.add.text(187, 210, TRANSLATIONS[lang].start, btnStyle).setOrigin(0.5).setInteractive();
    const hangarBtn = scene.add.text(187, 275, TRANSLATIONS[lang].hangar, btnStyle).setOrigin(0.5).setInteractive();
    const shopBtn = scene.add.text(187, 340, TRANSLATIONS[lang].shop, btnStyle).setOrigin(0.5).setInteractive();
    const setBtn = scene.add.text(187, 405, TRANSLATIONS[lang].settings, btnStyle).setOrigin(0.5).setInteractive();

    let audioState = isSoundOn ? TRANSLATIONS[lang].v_on : TRANSLATIONS[lang].v_off;
    const soundBtn = scene.add.text(187, 470, `>> ${TRANSLATIONS[lang].audio}: ${audioState}`, btnStyle).setOrigin(0.5).setInteractive();

    const rulesBtn = scene.add.text(187, 535, TRANSLATIONS[lang].rules, btnStyle).setOrigin(0.5).setInteractive();
    const topBtn = scene.add.text(187, 600, TRANSLATIONS[lang].top, {
        fontSize: '16px', fill: '#ffff00', backgroundColor: '#333300', padding: 10, fontFamily: fontUI, fontWeight: 'bold'
    }).setOrigin(0.5).setInteractive();

    startBtn.on('pointerdown', () => {
        if (lastRunState.pendingDeath) { closeMenu(); triggerDeath(scene); return; }
        closeMenu();

        isStarted = true;
        isVictory = false;
        isBossFight = false;
        distance = 0;
        overdrive = 0;
        playerHealth = maxPlayerHealth;

        if (!scene.overheadGfx || !scene.overheadGfx.active) {
            scene.overheadGfx = scene.add.graphics().setDepth(11);
        }

        player.setVisible(true);
        player.setPosition(187, 600);

        if (isSoundOn) scene.sound.play('bgm', {loop:true, volume:0.15});
        scene.obstacleTimer = scene.time.addEvent({ delay: Math.max(300, 1150 - level * 50), callback: spawnObstacle, callbackScope: scene, loop: true });
        scene.shootEvent = scene.time.addEvent({ delay: 150 - (upgradeLevels.fire * 20), callback: playerShoot, callbackScope: scene, loop: true });
        itemsTimer = scene.time.addEvent({ delay: 1000, callback: spawnItem, callbackScope: scene, loop: true });
    });

    soundBtn.on('pointerdown', () => {
        isSoundOn = !isSoundOn;
        soundBtn.setText(`>> ${TRANSLATIONS[lang].audio}: ${isSoundOn ? TRANSLATIONS[lang].v_on : TRANSLATIONS[lang].v_off}`);
        if (!isSoundOn) scene.sound.stopAll();
    });

    hangarBtn.on('pointerdown', () => { closeMenu(); showHangar(scene, menu); });
    shopBtn.on('pointerdown', () => { closeMenu(); showShop(scene, menu); });
    setBtn.on('pointerdown', () => { closeMenu(); showSettings(scene, menu); });
    rulesBtn.on('pointerdown', () => { closeMenu(); showRules(scene, menu); });
    topBtn.on('pointerdown', () => { closeMenu(); showLeaderboard(scene, menu); });

    // Добавляем всё в контейнер (miniShip теперь тоже внутри)
    menu.add([bg, miniShip, title, langBtn, startBtn, hangarBtn, shopBtn, profileBtn, setBtn, soundBtn, rulesBtn, topBtn]);
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
    const stagesTitle = scene.add.text(187, 345, TRANSLATIONS[lang].rules_alerts, {
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

    const backBtn = scene.add.rectangle(187, 575, 200, 45, 0x330033).setInteractive().setStrokeStyle(1, 0xff00ff, 0.5);
    const backLabel = scene.add.text(187, 575, TRANSLATIONS[lang].back, {
        fontSize: '15px', fill: '#ff00ff', fontWeight: 'bold'
    }).setOrigin(0.5);

    backBtn.on('pointerdown', () => {
        scene.input.off('wheel');
        rulesOverlay.destroy();
        mainMenu.setVisible(true);
        startTitleGlitch(scene, mainMenu.titleRef);
    });
    rulesOverlay.add([backBtn, backLabel]);

}

function refreshPlayerAppearance(scene) {
    scene.cameras.main.flash(200, 255, 255, 255, 0.3);
    if (!player) return;

    const newTexName = generatePlayerTexture(scene);

    player.setTexture(newTexName);

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
    const title = scene.add.text(187, 60, TRANSLATIONS[lang].settings, {
        fontSize: '24px', fill: '#00ffff', fontWeight: 'bold'
    }).setOrigin(0.5);
    overlay.add([bg, title]);

    const finger = scene.add.circle(187, 350, 15, 0xffffff, 0.3).setStrokeStyle(2, 0xffffff);
    const shipPreview = scene.add.sprite(187, 350 + yOffset, player.texture.key).setScale(2);
    overlay.add([finger, shipPreview]);

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
            y: shipPreview.y - 15,
            duration: 100,
            yoyo: true,
            ease: 'Back.easeOut'
        });
    };

    const up = scene.add.text(120, 520, ` [ ${TRANSLATIONS[lang].higher} ] `, {
        backgroundColor: '#004400', padding: 10, fontWeight: 'bold'
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => adjust(-10));

    const down = scene.add.text(254, 520, ` [ ${TRANSLATIONS[lang].lower} ] `, {
        backgroundColor: '#440000', padding: 10, fontWeight: 'bold'
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => adjust(10));

    overlay.add([up, down]);

    const backBtn = scene.add.rectangle(187, 610, 200, 45, 0x330033).setInteractive().setStrokeStyle(1, 0xff00ff, 0.5);
    const backLabel = scene.add.text(187, 610, TRANSLATIONS[lang].apply, {
        fontSize: '15px', fill: '#ff00ff', fontWeight: 'bold'
    }).setOrigin(0.5);

    backBtn.on('pointerdown', () => {
        scene.input.off('wheel');
        overlay.destroy();
        mainMenu.setVisible(true);
        startTitleGlitch(scene, mainMenu.titleRef);
    });
    overlay.add([backBtn, backLabel]);
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
    const backBtn = scene.add.rectangle(187, 610, 200, 45, 0x330033).setInteractive().setStrokeStyle(1, 0xff00ff, 0.5);
    const backLabel = scene.add.text(187, 610, TRANSLATIONS[lang].back, {
        fontSize: '15px', fill: '#ff00ff', fontWeight: 'bold'
    }).setOrigin(0.5);

    backBtn.on('pointerdown', () => {
        scene.input.off('wheel');
        overlay.destroy();
        mainMenu.setVisible(true);
        startTitleGlitch(scene, mainMenu.titleRef);
    });
    overlay.add([backBtn, backLabel]);
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

async function submitScore() {
    const tg = window.Telegram?.WebApp;
    const tgUser = tg?.initDataUnsafe?.user;
    if (!tgUser) {
        console.warn("Синхронизация пропущена: данные пользователя Telegram не найдены.");
        return;
    }

    try {
        const response = await fetch(`${botUrl}/submit_score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegram_id: tgUser.id,
                username: tgUser.first_name,
                score: bestDistance,
                level: level,
                skin: currentSkin,
                shape: currentShape,
                coins: coins,
                upgrades: upgradeLevels
            })
        });
        const res = await response.json();
        console.log("Данные в Бд отправлены:", res);
        //console.log("✅ Облачный сейв обновлен: S" + level + " | " + bestDistance + "m");
    } catch (e) {
        console.error("Ошибка синхронизации:", e);
    }
}

async function showLeaderboard(scene, mainMenu) {
    const overlay = scene.add.container(0, 0).setDepth(4000);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.98).fillRect(0, 0, 375, 667);
    overlay.add(bg);

    const fontUI = 'Arial, sans-serif';

    // 1. ЗАГОЛОВОК И КНОПКА
    overlay.add(scene.add.text(187, 45, TRANSLATIONS[lang].top, {
        fontSize: '24px', fill: '#ffff00', fontWeight: 'bold', fontFamily: fontUI
    }).setOrigin(0.5));

    const backBtn = scene.add.rectangle(187, 615, 200, 45, 0x330033).setInteractive().setStrokeStyle(1, 0xff00ff, 0.5);
    const backLabel = scene.add.text(187, 615, TRANSLATIONS[lang].back, { fontSize: '15px', fontFamily: fontUI, fill: '#ff00ff', fontWeight: 'bold' }).setOrigin(0.5);

    backBtn.on('pointerdown', () => {
        scene.input.off('pointermove'); scene.input.off('wheel');
        overlay.destroy(); mainMenu.setVisible(true);
        if (typeof startTitleGlitch === 'function') startTitleGlitch(scene, mainMenu.titleRef);
    });
    overlay.add([backBtn, backLabel]);

    const listContainer = scene.add.container(0, 0);
    overlay.add(listContainer);

    const maskShape = scene.make.graphics().fillRect(0, 100, 375, 450);
    listContainer.setMask(maskShape.createGeometryMask());

    try {
        const response = await fetch(`${botUrl}/get_leaderboard`);
        const data = await response.json();
        data.sort((a, b) => b.level - a.level || b.score - a.score);

        const myId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || "YOU";
        const myFirstName = window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name || "YOU";

        // РИСУЕМ СТРОКИ
        data.forEach((entry, i) => {
            const y = 125 + (i * 45);
            const centerY = y + 8;

            let color = '#ffffff';
            let medal = (i === 0) ? '🥇' : (i === 1) ? '🥈' : (i === 2) ? '🥉' : `#${i+1}`;
            if (i === 0) color = '#FFD700'; else if (i === 1) color = '#C0C0C0'; else if (i === 2) color = '#CD7F32';

            const isMe = (entry.telegram_id === myId);
            if (isMe) {
                listContainer.add(scene.add.rectangle(187, centerY, 350, 38, 0x00ffff, 0.15).setOrigin(0.5));
                if (i >= 3) color = '#00ffff';
            }

            // --- 1. РАНГ ---
            const rankTxt = scene.add.text(15, y, medal, { fontSize: '13px', fontFamily: fontUI, fill: color, fontWeight: 'bold' });

            // --- 2. КОРАБЛЬ (Идеальное центрирование) ---
            const skinInfo = SKIN_DATA[entry.skin] || SKIN_DATA.classic;
            let shipIcon;
            if (entry.shape === 'striker') {
                shipIcon = scene.add.triangle(55, centerY, 0, 12, 6, 0, 12, 12, skinInfo.body).setOrigin(0.5);
            } else {
                shipIcon = scene.add.rectangle(55, centerY, 10, 10, skinInfo.body).setOrigin(0.5);
            }
            if (entry.skin === 'ghost') shipIcon.setAlpha(0.5);

            // --- 3. ИМЯ ---
            let isCustom = (entry.ship_name && entry.ship_name !== "RAZOR-01" && entry.ship_name !== "");
            let displayName = (isCustom ? `•${entry.ship_name}` : entry.username || "PILOT").toUpperCase().substring(0, 10);
            const nameTxt = scene.add.text(75, y, displayName, { fontSize: '13px', fontFamily: fontUI, fill: isCustom ? '#ffff00' : color, fontWeight: isCustom ? 'bold' : 'normal' });

            // --- 4. ДАТА (Сдвинута влево) ---
            let dateStr = entry.score_date ? new Date(entry.score_date).toLocaleDateString('ru-RU', {day:'2-digit', month:'2-digit', year:'2-digit'}) : '--.--.--';
            const dateTxt = scene.add.text(170, y + 2, dateStr, { fontSize: '9px', fontFamily: fontUI, fill: color, alpha: 0.5 });

            // --- 5. СЕКТОР И СЧЕТ ---
            const sectorTxt = scene.add.text(285, y, `S:${entry.level || 0}`, { fontSize: '11px', fontFamily: fontUI, fill: color }).setOrigin(1, 0);
            const scoreTxt = scene.add.text(360, y, `${entry.score || 0}m`, { fontSize: '12px', fontFamily: fontUI, fill: color, fontWeight: 'bold' }).setOrigin(1, 0);

            listContainer.add([rankTxt, shipIcon, nameTxt, dateTxt, sectorTxt, scoreTxt]);
        });

        // --- ЛОГИКА "Я ВНЕ ТОП-50" (Исправляем undefined) ---
        const amIInTop = data.some(e => e.telegram_id === myId);
        if (!amIInTop) {
            const myRes = await fetch(`${botUrl}/get_user_personal/${myId}`);
            const myP = await myRes.json();

            const yDots = 125 + (data.length * 45);
            listContainer.add(scene.add.text(187, yDots, ". . .", { fontSize: '20px', fontFamily: fontUI, fill: '#555' }).setOrigin(0.5));

            const yMe = yDots + 40;
            const centerY = yMe + 8;

            // Если сервер не прислал ранг или уровень, ставим дефолт, чтобы не было undefined
            const myRank = myP.rank || '?';
            const myLvl = myP.level || level;
            const myScore = myP.score || Math.floor(bestDistance);

            listContainer.add(scene.add.rectangle(187, centerY, 350, 38, 0x00ffff, 0.2).setOrigin(0.5));
            const rTxt = scene.add.text(15, yMe, `#${myRank}`, { fontSize: '13px', fontFamily: fontUI, fill: '#00ffff', fontWeight: 'bold' });
            const nTxt = scene.add.text(75, yMe, myFirstName.toUpperCase().substring(0,12), { fontSize: '13px', fontFamily: fontUI, fill: '#00ffff' });
            const sTxt = scene.add.text(285, yMe, `S:${myLvl}`, { fontSize: '11px', fontFamily: fontUI, fill: '#00ffff' }).setOrigin(1, 0);
            const scTxt = scene.add.text(360, yMe, `${myScore}m`, { fontSize: '12px', fontFamily: fontUI, fill: '#00ffff', fontWeight: 'bold' }).setOrigin(1, 0);

            listContainer.add([rTxt, nTxt, sTxt, scTxt]);
        }

        // СКРОЛЛ
        const listHeight = (data.length + 3) * 45;
        const maxY = Math.max(0, listHeight - 420);
        scene.input.on('wheel', (p, o, dx, dy) => { listContainer.y = Phaser.Math.Clamp(listContainer.y - dy, -maxY, 0); });
        scene.input.on('pointermove', (p) => { if (p.isDown) listContainer.y = Phaser.Math.Clamp(listContainer.y + (p.y - p.prevPosition.y), -maxY, 0); });

    } catch (e) {
        console.error(e);
    }
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
        scale: size === '26px' ? 1.5 : 1.2,
        duration: 900,
        onComplete: () => txt.destroy()
    });
}

async function syncUserData() {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (!tgUser || !tgUser.id) return;

    try {
        const response = await fetch(`${botUrl}/get_user_personal/${tgUser.id}`);
        const myData = await response.json();

        if (myData && !myData.error) {
            let needsPush = false;

            // СИНХРОНИЗАЦИЯ УРОВНЯ
            if (myData.level > level) {
                level = myData.level;
                if (level - 1 > bestLevel) bestLevel = level - 1;
                runGoal = 700 + (level - 1) * 100;
            } else if (level > myData.level) { needsPush = true; }

            // СИНХРОНИЗАЦИЯ РЕКОРДА (SCORE)
            if (myData.score > bestDistance) {
                bestDistance = myData.score;
            } else if (bestDistance > (myData.score || 0)) { needsPush = true; }

            // СИНХРОНИЗАЦИЯ МОНЕТ
            if (myData.coins > coins) {
                coins = myData.coins;
            } else if (coins > (myData.coins || 0)) { needsPush = true; }

            // СИНХРОНИЗАЦИЯ АПГРЕЙДОВ
            if (myData.upgrades) {
                for (let key in myData.upgrades) {
                    if ((myData.upgrades[key] || 0) > (upgradeLevels[key] || 0)) {
                        upgradeLevels[key] = myData.upgrades[key];
                    } else if ((upgradeLevels[key] || 0) > (myData.upgrades[key] || 0)) {
                        needsPush = true;
                    }
                }
            }

            saveProgress();
            if (scoreText) scoreText.setText(`${TRANSLATIONS[lang].credits}: ${coins}`);
            if (bestDistText) bestDistText.setText(`${TRANSLATIONS[lang].max_dist}: ${bestDistance}m`);

            // Если телефон новее базы — обновляем базу ПРАВИЛЬНЫМИ данными
            if (needsPush) {
                submitScore();
            }
            console.log("Облако подтянуто для ID: " + tgUser.id);
        }
    } catch (e) { console.error("Sync error:", e); }
}

function shareDuel() {
    const text = encodeURIComponent(TRANSLATIONS[lang].share_duel_text.replace("%lvl%", level));
    const url = `https://t.me/share/url?url=${encodeURIComponent(SHARE_LINK)}&text=${text}`;

    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.openTelegramLink(url);
    } else {
        window.open(url, '_blank');
    }
}

function showProfile(scene, mainMenu) {
    const overlay = scene.add.container(0, 0).setDepth(4000);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.98).fillRect(0, 0, 375, 667);
    overlay.add(bg);

    const fontUI = 'Arial, sans-serif';

    overlay.add(scene.add.text(187, 60, lang === 'ru' ? "ДОСЬЕ ПИЛОТА" : "PILOT DOSSIER", {
        fontSize: '24px', fontFamily: fontUI, fill: '#00ffff', fontWeight: 'bold'
    }).setOrigin(0.5));

    const scrollWindowHeight = 350;
    const scrollContainer = scene.add.container(0, 170);
    overlay.add(scrollContainer);

    const maskShape = scene.make.graphics();
    maskShape.fillStyle(0xffffff, 1).fillRect(0, 170, 375, scrollWindowHeight);
    scrollContainer.setMask(maskShape.createGeometryMask());

    let currentY = 20;

    const preview = scene.add.sprite(187, currentY + 40, player.texture.key).setScale(3);
    scrollContainer.add(preview);
    currentY += 120;

    let statusText = (level > 40) ? (lang === 'ru' ? "МАСТЕР ГЛИТЧА" : "GLITCH MASTER") :
                     (level > 20) ? (lang === 'ru' ? "ЭЛИТНЫЙ ПИЛОТ" : "ELITE PILOT") :
                     (lang === 'ru' ? "НОВИЧОК" : "ROOKIE");

    scrollContainer.add(scene.add.text(187, currentY, statusText, {
        fontSize: '18px', fill: level > 40 ? "#ff00ff" : "#00ffff", fontWeight: 'bold'
    }).setOrigin(0.5));
    currentY += 50;

    const statsBox = scene.add.rectangle(187, currentY + 60, 320, 140, 0x111111).setStrokeStyle(1, 0x00ffff, 0.2);
    scrollContainer.add(statsBox);

    const statsData = [
        `${lang === 'ru' ? 'ТЕКУЩИЙ СЕКТОР' : 'CURRENT SECTOR'}: ${level}`,
        `${lang === 'ru' ? 'РЕКОРД ДИСТАНЦИИ' : 'MAX DISTANCE'}: ${bestDistance}m`,
        `${lang === 'ru' ? 'ВСЕГО ПРОЙДЕНО' : 'TOTAL FLOWN'}: ${Math.floor(totalDistance)}m`,
        `${lang === 'ru' ? 'УНИЧТОЖЕНО ЯДЕР' : 'CORES DELETED'}: ${bossesKilled}`,
        `${lang === 'ru' ? 'КРЕДИТЫ' : 'CREDITS'}: ${coins}`
    ];

    statsData.forEach((t, i) => {
        scrollContainer.add(scene.add.text(50, currentY + 12 + (i * 24), t, {
            fontSize: '13px', fontFamily: fontUI, fill: '#aaa'
        }));
    });
    currentY += 165;

    const achHeader = scene.add.text(187, currentY, lang === 'ru' ? "--- ДОСТИЖЕНИЯ ---" : "--- ACHIEVEMENTS ---", {
        fontSize: '14px', fontFamily: fontUI, fill: '#ff00ff'
    }).setOrigin(0.5);
    scrollContainer.add(achHeader);
    currentY += 35;

    const achList = [
        { key: 'flawless', ru: "БЕЗУПРЕЧНЫЙ", en: "FLAWLESS", desc: lang === 'ru' ? "Босс без урона" : "Boss: 0 damage" },
        { key: 'rich', ru: "МАГНАТ", en: "TYCOON", desc: lang === 'ru' ? "Накопил 5000$" : "5000 credits" },
        { key: 'marathon', ru: "МАРАФОНЕЦ", en: "MARATHON", desc: lang === 'ru' ? "5000м за вылет" : "5000m run" }
    ];

    achList.forEach((ach, i) => {
        const isDone = achievements[ach.key];
        let box = scene.add.rectangle(60, currentY + 16, 32, 32, isDone ? 0xaa8800 : 0x222222)
            .setStrokeStyle(2, isDone ? 0xffff00 : 0x444444);
        let t1 = scene.add.text(100, currentY + 6, lang === 'ru' ? ach.ru : ach.en, {
            fontSize: '14px', fontFamily: fontUI, fill: isDone ? '#ffff00' : '#666', fontWeight: 'bold'
        });
        let t2 = scene.add.text(100, currentY + 24, ach.desc, {
            fontSize: '10px', fontFamily: fontUI, fill: isDone ? '#fff' : '#999'
        });
        scrollContainer.add([box, t1, t2]);
        currentY += 55;
    });

    const maxScroll = Math.max(0, currentY - scrollWindowHeight + 40);
    let scrollY = 0;
    const updateScroll = () => { scrollY = Phaser.Math.Clamp(scrollY, -maxScroll, 0); scrollContainer.y = 170 + scrollY; };

    scene.input.on('wheel', (p, obj, dx, dy) => { scrollY -= dy; updateScroll(); });
    scene.input.on('pointermove', (p) => { if (p.isDown) { scrollY += (p.y - p.prevPosition.y); updateScroll(); } });

    scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
        scrollY -= deltaY * 0.8;
        applyScroll();
    });

    // === ИМЯ / ПОЗЫВНОЙ ВНЕ СКРОЛЛА ===
    const nameBox = scene.add.rectangle(187, 130, 240, 65, 0x00ffff, 0.1)
        .setStrokeStyle(1, 0x00ffff, 0.5)
        .setInteractive({ useHandCursor: true });

    const callsignLabel = scene.add.text(187, 105, TRANSLATIONS[lang].callsign_label, {
        fontSize: '10px', fontFamily: fontUI, fill: '#00ffff', alpha: 0.7
    }).setOrigin(0.5);

    const callsignText = scene.add.text(187, 125, shipName, {
        fontSize: '20px', fontFamily: fontUI, fill: '#ffff00', fontWeight: 'bold'
    }).setOrigin(0.5);

    const editHint = scene.add.text(187, 145, TRANSLATIONS[lang].tap_edit, {
        fontSize: '9px', fontFamily: fontUI, fill: '#00ffff'
    }).setOrigin(0.5);

    nameBox.on('pointerdown', () => {
        const promptText = lang === 'ru' ? "Введите позывной корабля:" : "Enter ship callsign:";
        let newName = window.prompt(promptText, shipName);

        if (newName !== null) {
            newName = newName.trim().substring(0, 10).toUpperCase();
            if (newName.length > 0) {
                shipName = newName;
                callsignText.setText(shipName);
                saveProgress();
                submitScore();
            }
        }
    });

    overlay.add([nameBox, callsignLabel, callsignText, editHint]);

    const backBtn = scene.add.rectangle(187, 620, 170, 45, 0x330033).setInteractive().setStrokeStyle(1, 0xff00ff, 0.5);
    const backLabel = scene.add.text(187, 620, TRANSLATIONS[lang].back, {
        fontSize: '15px', fontFamily: fontUI, fill: '#ff00ff', fontWeight: 'bold'
    }).setOrigin(0.5);

    backBtn.on('pointerdown', () => {
        scene.input.off('wheel');
        overlay.destroy();
        mainMenu.setVisible(true);
        startTitleGlitch(scene, mainMenu.titleRef);
    });
    overlay.add([backBtn, backLabel]);
}

function showGaryIntro(scene) {
    const intro = scene.add.container(0, 0).setDepth(7000);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.9).fillRect(0, 0, 375, 667);
    bg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 375, 667), Phaser.Geom.Rectangle.Contains);

    const fontUI = 'Arial, sans-serif';

    // Рамка сообщения
    const frame = scene.add.rectangle(187, 333, 320, 250, 0x111111).setStrokeStyle(2, 0xff00ff);

    // Иконка Гари
    const garyIcon = scene.add.sprite(187, 260, 'gary_avatar').setTint(0x00ff00).setScale(0.8);

    const introText = (shipName === "RAZOR-01")
        ? TRANSLATIONS[lang].gary_intro
        : TRANSLATIONS[lang].gary_intro_ship.replace("%ship%", shipName);

    const text = scene.add.text(187, 350, introText, {
        fontSize: '14px', fill: '#fff', align: 'center', wordWrap: { width: 280 }, fontFamily: fontUI
    }).setOrigin(0.5);



    const closeBtn = scene.add.text(187, 430, TRANSLATIONS[lang].underst, {
        fontSize: '18px', fill: '#00ffff', fontWeight: 'bold'
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
        intro.destroy();
        localStorage.setItem('GLITCHED_ARENA_INTRO_DONE', 'true');
    });

    intro.add([bg, frame, garyIcon, text, closeBtn]);

    scene.tweens.add({ targets: intro, alpha: { from: 0, to: 1 }, duration: 200 });
}

function applyGlitchEffect(scene, textObject) {
    if (!textObject || !textObject.active) return;

    const originalX = textObject.x;
    const originalColor = textObject.style.color;

    scene.time.delayedCall(1, () => {
        textObject.setX(originalX + Phaser.Math.Between(-8, 8));
        textObject.setFill('#ff00ff');
        textObject.setAlpha(0.7);
    });

    scene.time.delayedCall(60, () => {
        textObject.setX(originalX);
        textObject.setFill(originalColor);
        textObject.setAlpha(1);
    });
}

function startTitleGlitch(scene, title) {
    if (scene.glitchTimer) scene.glitchTimer.remove();

    scene.glitchTimer = scene.time.addEvent({
        delay: 2000,
        callback: () => applyGlitchEffect(scene, title),
        callbackScope: scene,
        loop: true
    });
}

function resetRunState(scene) {
    isVictory = false;
    isDead = false;
    isShopOpen = false;
    isBossFight = false;
    isPaused = false;
    shouldAutoStart = false;

    if (scene.physics && scene.physics.world) {
        scene.physics.resume();
        scene.physics.world.timeScale = 1;
    }

    if (scene.time) {
        scene.time.paused = false;
    }
}