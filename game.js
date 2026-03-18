const SHARE_LINK = "https://t.me/GlitchedArenaBot";
const SUPABASE_URL = "https://dxqeegfjgakbmeimmigy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4cWVlZ2ZqZ2FrYm1laW1taWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MzYyMDIsImV4cCI6MjA4OTQxMjIwMn0.KnwSsRrfzl1tKY0nKvKVZnOT9XU_5_-2bmnCFRPeh8Y";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const ASSETS = {
    BGM: 'assets/Cyberpunk 2.mp3',
    SFX_ULTRA: 'assets/futuristic-cyberpunk-digi-ivvyqv4k.wav',
    SFX_COMBO: 'assets/Cyberpunk_Alert.mp3',
    SFX_NUKE: 'assets/Star_Wars-Siren.mp3'
};
const PHRASES_P1 = ["SCANNING...", "TARGET_LOCKED", "DATA_TRESPASSER"];
const PHRASES_P2 = ["SYSTEM_OVERLOAD", "CRITICAL_RAGE", "DELETING_YOU"];

// Глобальные переменные
let isPhase3 = false;
let isSoundOn = true;
let shouldAutoStart = false;
let maxPlayerHealth = 100; // Базовый предел
let coinsThisRun = 0; // Монеты, собранные за текущую попытку
let level = 1, coins = 0, distance = 0, runGoal = 700, bestLevel = 1, bestDistance = 0;
let combo = 0;
let isGlitchMode = false;
let comboPopText;
let isMagnetActive = false;
let bossTurretL, bossTurretR;
let bossTurretLTrail, bossTurretRTrail;
let milestoneBar;
let upgradeLevels = { fire: 0, ultra: 0, speed: 0, health: 0, shield: 0, skin_striker: 0, skin_gold: 0 };
let playerHealth = 100, bossHealth = 400, isShieldActive = false;
let overdrive = 0, isVictory = false, isShopOpen = false, isDead = false, isBossFight = false, isStarted = false, isPhase2 = false, isPaused = false;

let player, boss, obstacles, bullets, playerBullets, scoreText, levelText, bestText, bestDistText, distanceText, pHealthLabel, bHealthLabel, glitchText;
let playerBar, bossBar, overdriveBar, roadBar, shieldAura, trailEmitter, bossTrail;
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

// --- СИСТЕМА СОХРАНЕНИЯ (ЕДИНЫЙ КЛЮЧ) ---
const saveProgress = () => {
    // Если текущий уровень (который мы вот-вот начнем) больше лучшего + 1,
    // значит предыдущий был успешно пройден.
    // 1. Уровень: записываем реально пройденный
    if (isVictory && (level - 1) > bestLevel) bestLevel = level - 1;

    // 2. Дистанция: проверяем, побит ли глобальный рекорд
    let currentDist = Math.floor(distance);

    if (currentDist > bestDistance) {
        bestDistance = currentDist;
    }

    localStorage.setItem('GLITCHED_ARENA_MASTER_SAVE_V2', JSON.stringify({
        level,
        upgradeLevels,
        bestLevel,
        coins,
        bestDistance,
        maxPlayerHealth,
        isShieldActive,
        yOffset: yOffset,
        currentShape: currentShape,
        currentSkin: currentSkin,
        shareClaimed: upgradeLevels.shareClaimed
    }));
};

const loadProgress = () => {
    const saved = localStorage.getItem('GLITCHED_ARENA_MASTER_SAVE_V2');
    if (saved) {
        const p = JSON.parse(saved);
        level = p.level || 1;
        bestLevel = p.bestLevel || 1;
        bestDistance = p.bestDistance || 0;
        upgradeLevels = p.upgradeLevels || { fire: 0, ultra: 0, speed: 0, health: 0, shield: 0 };
        coins = p.coins || 0;
        maxPlayerHealth = p.maxPlayerHealth || 100;
        isShieldActive = p.isShieldActive || false;
        currentShape = p.currentShape || 'classic';
        currentSkin = p.currentSkin || 'classic';
        yOffset = p.yOffset !== undefined ? p.yOffset : -50;
        // КРИТИЧЕСКИЙ ФИКС: Пересчитываем цель для высоких уровней
        runGoal = 700 + (level - 1) * 100;
        upgradeLevels.shareClaimed = p.shareClaimed || false;
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
    currentStats = getShipStats();
    isPhase3 = false;
    isVictory = false;
    isShopOpen = false;
    isDead = false;
    isBossFight = false;
    distance = 0; overdrive = 0; isPhase2 = false; isStarted = false; isPaused = false;
    playerHealth = maxPlayerHealth; bossHealth = 400 * (1 + level * 0.45);
    isMagnetActive = false; // Отключаем магнит
    isGlitchMode = false;   // Сбрасываем режим безумия
    this.physics.world.timeScale = 1; // Возвращаем время в норму

    //const startText = this.add.text(187, 333, `SECTOR: ${level}\n[ CLICK TO START ]`, { fontFamily: 'Courier New', fontSize: '24px', fill: '#00ffff', align: 'center', backgroundColor: '#000', padding: 20 }).setOrigin(0.5).setDepth(1000);
    if (shouldAutoStart) {
        shouldAutoStart = false;
        isStarted = true;
        // Запускаем системы сразу
        if (isSoundOn) this.sound.play('bgm', {loop:true, volume:0.15});
        this.obstacleTimer = this.time.addEvent({ delay: Math.max(300, 1150 - level * 50), callback: spawnObstacle, callbackScope: this, loop: true });
        this.shootEvent = this.time.addEvent({ delay: 150 - (upgradeLevels.fire * 20), callback: playerShoot, callbackScope: this, loop: true });
        itemsTimer = this.time.addEvent({ delay: 1000, callback: spawnItem, callbackScope: this, loop: true });
    } else {
        showMenu(this); // Обычный запуск через меню
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
        // AJAX к твоему боту API: fetch(`/api/boosts/${userId}`)
        // Если shield_active → isShieldActive = true;
    }
    player = this.physics.add.sprite(187, 550, pTex).setDepth(10).setCollideWorldBounds(true);
    shieldAura = this.add.sprite(player.x, player.y, 'shield_aura').setDepth(11).setVisible(false);

    // НАСТОЯЩИЙ ШЛЕЙФ
    const skin = SKIN_DATA[currentSkin] || SKIN_DATA.classic;

    trailEmitter = this.add.particles(0, 0, 'pixel', {
        speed: 60,
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.4, end: 0 },
        lifespan: 600,
        blendMode: 'ADD',
        follow: player,
        tint: skin.trail // ТЕПЕРЬ ЦВЕТ ЗАВИСИТ ОТ СКИНА
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
        tint: 0xff00ff,      // стартовый фиолетовый
        follow: boss
    });
    bossTrail.setParticleTint(0xff00ff);

    // --- HUD v5.5: АВТО-ДИЗАЙН ---
    // Строка 1: Основная инфа
    scoreText = this.add.text(10, 15, `CREDITS: ${coins}`, { fontFamily: 'Courier New', fontSize: '14px', fill: '#ffff00' }).setDepth(100);
    levelText = this.add.text(365, 15, `SEC: ${level}`, { fontFamily: 'Courier New', fontSize: '14px', fill: '#ff00ff' }).setOrigin(1, 0).setDepth(100);
    // Строка 2: Рекорды и Пауза
    bestText = this.add.text(10, 35, `BEST: ${bestLevel}`, { fontFamily: 'Courier New', fontSize: '10px', fill: '#00ff00' }).setDepth(100);
    bestDistText = this.add.text(187, 35, `MAX DIST: ${bestDistance}m`, { fontFamily: 'Courier New', fontSize: '12px', fill: '#ffff00', fontWeight: 'bold' }).setOrigin(0.5, 0).setDepth(100);

    // Кнопка паузы с неоновой подложкой
    let pauseBg = this.add.rectangle(335, 42, 60, 20, 0xff00ff, 0.2).setDepth(99).setInteractive();
    pauseBtn = this.add.text(335, 42, 'PAUSE', { fontSize: '11px', fontFamily: 'Courier New', fill: '#fff' }).setOrigin(0.5).setDepth(100).setInteractive();

    const doPause = () => togglePause.call(this);
    pauseBtn.on('pointerdown', doPause);
    pauseBg.on('pointerdown', doPause);

    // Строка 3: Здоровье
    pHealthLabel = this.add.text(10, 65, 'YOU: 100/100', { fontFamily: 'Courier New', fontSize: '12px', fill: '#00ffff' }).setDepth(100);
    bHealthLabel = this.add.text(365, 65, '', { fontFamily: 'Courier New', fontSize: '12px', fill: '#ff00ff' }).setOrigin(1, 0).setDepth(100);

    // Строка 4: Прогресс уровня и Элиты
    distanceText = this.add.text(187, 105, '', { fontFamily: 'Courier New', fontSize: '14px', fill: '#00ffff', align: 'center' }).setOrigin(0.5, 0).setDepth(100);
    glitchText = this.add.text(187, 300, '', { fontFamily: 'Courier New', fontSize: '24px', stroke: '#000', strokeThickness: 6, align: 'center' }).setOrigin(0.5).setDepth(100);

    // Графика полосок
    playerBar = this.add.graphics().setDepth(100);
    bossBar = this.add.graphics().setDepth(100);
    overdriveBar = this.add.graphics().setDepth(100);
    roadBar = this.add.graphics().setDepth(100);
    milestoneBar = this.add.graphics().setDepth(100);



    this.physics.add.overlap(player, obstacles, (p, o) => { o.destroy(); handleDamage(this, 35); });
    this.physics.add.overlap(player, bullets, (p, b) => { b.destroy(); handleDamage(this, 15); });
    this.physics.add.overlap(boss, playerBullets, hitBoss, null, this);
    this.physics.add.overlap(player, items, collectItem, null, this);
    this.physics.add.overlap(minions, playerBullets, (minion, bullet) => {
        let mx = minion.x;
        let my = minion.y; // Сохраняем координаты для взрыва

        minion.destroy();
        bullet.destroy();

        coinsThisRun += 5;
        scoreText.setText(`CREDITS: ${coins + coinsThisRun}`);

        // ЗАПУСКАЕМ ВАУ-ЭФФЕКТ
        minionExplode(this, mx, my);
    });

    // Урон от миньонов и их пуль
    this.physics.add.overlap(player, minionBullets, (p, b) => { b.destroy(); handleDamage(this, 10); });
    this.physics.add.overlap(player, minions, (p, m) => { m.destroy(); handleDamage(this, 20); });

    this.physics.add.overlap(bossShields, playerBullets, (s, b) => { b.destroy(); s.setAlpha(1); this.time.delayedCall(100, () => s.setAlpha(0.4)); });

    this.input.on('pointermove', (p) => {
        if (isStarted && !isShopOpen && !isDead && !isPaused) {
            player.x = p.x;
            player.y = p.y + yOffset;
            shieldAura.setPosition(player.x, player.y);
        }
    });
    this.input.on('pointerdown', () => { if (isStarted && overdrive >= 100 && !isPaused) useOverdrive.call(this); });

    this.comboSound = this.sound.add('sfx_combo', { volume: 0.3 });

    comboPopText = this.add.text(0, 0, '', {
        fontFamily: 'Courier New', fontSize: '18px', fill: '#00ff00', fontWeight: 'bold', stroke: '#000', strokeThickness: 3
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
            bestDistText.setText(`MAX DIST: ${bestDistance}m`).setFill('#ffff00');
        }

        // Полоска прогресса (под рекордом)
        let prog = Math.min(distance / runGoal, 1);
        roadBar.clear().fillStyle(0xffffff, 0.2).fillRect(100, 50, 175, 2).fillStyle(0x00ffff, 1).fillRect(100, 50, prog * 175, 2);

        // ТЕКСТ ДИСТАНЦИИ (Один блок вместо двух!)
        let toBoss = Math.max(0, Math.floor(runGoal - distance));
        let label = level < 15 ? `TO MEGA_BOSS: ${15 - level} SEC` : `ELITE PHASE: ${level}`;
        distanceText.setY(105).setText(`${currentDist}m\n${label}\nDISTANCE TO BOSS: ${toBoss}m`);

        if (distance >= runGoal) startBossFight(this);
    } else {
        // Логика Босса (движение и вращение щитов)
        let t = time * 0.001;
        if (isPhase3) {
            // Босс встает в центр и вибрирует
            boss.x = 187 + Math.sin(time * 0.05) * 5;
            boss.y = 200 + Math.cos(time * 0.05) * 5;
            boss.angle += 20; // Бешеное вращение
        } else {
            // Обычное движение
            boss.x = 187 + Math.sin(t * 1.8) * 140;
            boss.y = 250 + Math.cos(t * 1.2) * 50;
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
        distanceText.setText(""); // Скрываем во время боя
    }

    // 4. ЕДИНСТВЕННАЯ ЖЕЛТАЯ ПОЛОСКА
    overdriveBar.clear().fillStyle(0x333333).fillRect(87, 645, 200, 8).fillStyle(0xffff00).fillRect(87, 645, (overdrive/100) * 200, 8);
    if (overdrive >= 100) overdriveBar.setX(Math.sin(time * 0.1) * 3); else overdriveBar.setX(0);

    milestoneBar.clear();
    updateBars(this);
    shieldAura.setVisible(isShieldActive);
}

function updateBars(scene) {
    // Ширина теперь зависит от maxPlayerHealth
    // Игрок: Фикс ширина 120
    let healthWidth = (playerHealth / maxPlayerHealth) * 120;
    playerBar.clear().fillStyle(0x222222).fillRect(10, 85, 120, 8).fillStyle(0x00ffff).fillRect(10, 85, healthWidth, 8);
    pHealthLabel.setText(`YOU: ${Math.ceil(playerHealth)}/${maxPlayerHealth}`);

    if (isBossFight) {
        let maxB = 400 * (1 + level * 0.45);
        let pct = Math.max(0, bossHealth / maxB);
        // Босс: Фикс ширина 120 (справа)
        bossBar.clear().fillStyle(0x222222).fillRect(245, 85, 120, 8).fillStyle(isPhase2 ? 0xff0000 : 0xff00ff).fillRect(245, 85, pct * 120, 8);
        bHealthLabel.setText(`CORE: ${Math.ceil(pct * 100)}%`).setFill(isPhase2 ? "#ff0000" : "#ff00ff");
    }
    overdriveBar.clear().fillStyle(0x333333).fillRect(87, 650, 200, 8).fillStyle(0xffff00).fillRect(87, 650, (overdrive/100) * 200, 8);
    if (overdrive >= 100 && !scene.ovrReady) {
        scene.cameras.main.shake(300, 0.01); // Лёгкая вибрация при готовности
        scene.ovrReady = true;
    } else if (overdrive < 100) {
        scene.ovrReady = false;
    }
}

function handleDamage(scene, dmg) {
    if (isDead || isVictory) return;

    combo = 0; // СБРОС КОМБО ПРИ УДАРЕ

    if (isShieldActive) {
        isShieldActive = false;
        saveProgress(); // Сохраняем потерю щита
        scene.cameras.main.flash(200, 0, 255, 255);
        return;
    }

    // --- ГЕРОИЧЕСКИЙ БОНУС ---
    // Если урон смертельный, но босс почти мертв или уже взорвался
    if (playerHealth - dmg <= 0 && (bossHealth <= 0 || isVictory)) {
        playerHealth = 1; // Оставляем 1 жизнь
        glitchText.setText("HEROIC_SURVIVAL").setFill("#ffff00");
        scene.time.delayedCall(1000, () => glitchText.setText(""));
        if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
        return;
    }

    playerHealth -= dmg;
    scene.cameras.main.flash(100, 255, 0, 0, 0.4);

    if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    if (playerHealth <= 0) triggerDeath(scene);
}

function triggerDeath(scene) {
    if (isVictory || isDead) return;
    isMagnetActive = false;
    isGlitchMode = false;
    coinsThisRun = 0; // Игрок погиб — всё собранное на уровне аннулируется
    scoreText.setText(`CREDITS: ${coins}`); // Возвращаем визуально к основному счету

    if (Math.floor(distance) > bestDistance) {
        submitScore(Math.floor(distance), level);
    }

    isDead = true; scene.physics.pause();
    if (scene.obstacleTimer) scene.obstacleTimer.remove();
    if (scene.shootEvent) scene.shootEvent.remove();

    const overlay = scene.add.container(0, 0).setDepth(5000);
    overlay.add(scene.add.graphics().fillStyle(0x000000, 0.9).fillRect(0, 0, 375, 667));
    overlay.add(scene.add.text(187, 150, 'CONNECTION_LOST', { fontSize: '32px', fill: '#ff0000', fontWeight: 'bold' }).setOrigin(0.5));

    const btn = (y, txt, color, act) => {
        let b = scene.add.text(187, y, txt, { fontSize: '18px', fill: '#fff', backgroundColor: color, padding: 15 }).setOrigin(0.5).setInteractive().on('pointerdown', act);
        overlay.add(b);
    };

    // 1. Возврат за деньги (текущий уровень)
    btn(280, `REVIVE [300 CREDITS]`, coins >= 300 ? '#004444' : '#222', () => {
        if (coins >= 300) { coins -= 300; playerHealth = maxPlayerHealth; isDead = false; shouldAutoStart = true; scene.scene.restart(); }
    });

    // 2. Бесплатная "реклама" (текущий уровень)
    btn(360, "WATCH AD (FREE REBOOT)", '#444400', () => {
        overlay.destroy(); glitchText.setText("LOADING_AD...").setAlpha(1);
        scene.time.delayedCall(2000, () => { playerHealth = maxPlayerHealth; isDead = false; glitchText.setAlpha(0); shouldAutoStart = true; scene.scene.restart(); });
    });

    // 3. Хард-ребут (Сектор 1, потеря всего)
    btn(440, "HARD REBOOT (SEC 1)", '#440000', () => {
        level = 1;
        coins = 0;
        upgradeLevels = { fire: 0, ultra: 0, speed: 0, health: 0, shield: 0 };
        isDead = false;
        isPhase2 = false; // СБРОС ФАЗЫ 2
        isPhase3 = false; // СБРОС ФАЗЫ 3
        shouldAutoStart = false;
        saveProgress();
        scene.scene.restart();
    });
}

function startBossFight(scene) {
    obstacles.clear(true, true); // КРИТИЧЕСКИЙ ФИКС: Убираем старые блоки!
    bullets.clear(true, true);   // И пули тоже
    isBossFight = true;
    boss.setVisible(true).setY(150);
    bossTrail.setVisible(true);
    distanceText.setText("");
    if (scene.obstacleTimer) scene.obstacleTimer.remove();

    // 1. ПОМОЩНИКИ (С 15 уровня) - СТРЕЛЯЮТ ПУЛЯМИ
    if (level >= 15) {
        glitchText.setText("MEGA_BOSS_DETECTED").setFill("#ff00ff");
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
        glitchText.setText("ELITE_DEFENSE_ENGAGED").setFill("#ff00ff");
    }

    scene.bossShootEvent = scene.time.addEvent({
        delay: isPhase2 ? 800 : 1200, callback: bossShoot,
        callbackScope: scene, loop: true
    });
    scene.phraseTimer = scene.time.addEvent({
        delay: 3500, callback: () => {
            if(isBossFight && !isVictory) {
                glitchText.setText(Phaser.Utils.Array.GetRandom(
                    isPhase2 ? PHRASES_P2 : PHRASES_P1)
                ).setFill(isPhase2 ? "#ff0000" : "#ff00ff");
                scene.time.delayedCall(1500, () => glitchText.setText('')); }
            }, loop: true });
    scene.minionTimer = scene.time.addEvent({
        delay: 4000, callback: spawnMinion, callbackScope: scene, loop: true
    });
}

function hitBoss(b, bullet) {
    if (isVictory) return;
    if (bullet) bullet.destroy();

    bossHealth -= (10 * currentStats.atk);
    coinsThisRun += 2;
    scoreText.setText(`CREDITS: ${coins + coinsThisRun}`);

    let chargeBonus = 2 + (upgradeLevels.ultra * 1.5);
    overdrive = Math.min(100, overdrive + chargeBonus);

    // Вспышка урона
    boss.setTint(0x00ff00); // Вспышка зеленым
    this.time.delayedCall(80, () => {
        if (boss && !isDead) {
            // Если фаза 2 — возвращаем красный, если нет — возвращаем белый (без тинта)
            isPhase2 ? boss.setTint(0xff0000) : boss.clearTint();
        }
    });

    // ОПРЕДЕЛЯЕМ МАКСИМАЛЬНОЕ HP БОССА
    let maxB = 400 * (1 + level * 0.45);

    // ФАЗА 2: ПЕРЕХОД (на 50% HP)
    if (bossHealth <= maxB / 2 && !isPhase2) {
        isPhase2 = true;
        boss.setTint(0xff0000); // Красим ядро в красный
        bHealthLabel.setFill('#ff0000');
        glitchText.setText("CRITICAL_RAGE").setFill("#ff0000");

        // ПРАВИЛЬНАЯ ПОКРАСКА ШЛЕЙФА
        if (bossTrail) {
            bossTrail.setParticleTint(0xff0000); // Форсируем красный цвет частиц
        }
    }

    // ФАЗА 3: УЛЬТРА-ЯРОСТЬ (на 25% HP)
    if (level >= 30 && bossHealth <= maxB * 0.25 && !isPhase3) {
        isPhase3 = true;
        glitchText.setText("!! SYSTEM_HALT: CORE_OVERLOAD !!").setFill("#ffffff").setBackgroundColor("#ff0000");
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
    this.cameras.main.shake(1000, 0.05);

    const skin = SKIN_DATA[currentSkin] || SKIN_DATA.classic;
    let laser = this.add.sprite(player.x, player.y - 300, 'laser')
        .setTint(skin.bullet) // Лазер в цвет пуль!
        .setBlendMode('ADD')
        .setDepth(6);

    this.tweens.add({
        targets: laser,
        scaleX: 60,
        alpha: 0,
        duration: 1200,
        onUpdate: () => {
            if (isBossFight && !isVictory && Math.abs(laser.x - boss.x) < 130) {
                bossHealth -= Math.max(3, (12 - level) * currentStats.atk);
                if (bossHealth <= 0) { bossHealth = 0; triggerVictory(this); }
            }
        },
        onComplete: () => { if(laser) laser.destroy(); }
    });
}

function triggerVictory(scene) {
    if (isDead || isVictory) return;
    coins += coinsThisRun; // Зачисляем собранное в основной кошелек
    coinsThisRun = 0;      // Сбрасываем временный счетчик
    isPhase3 = false;

    // 1. СРАЗУ СОХРАНЯЕМ ПРОГРЕСС УРОВНЯ
    level++;
    runGoal = 700 + (level - 1) * 100;
    saveProgress();
    submitScore(Math.floor(distance), level);

    isVictory = true;

    // Остановка систем
    if (scene.turretShootEvent) scene.turretShootEvent.remove();
    if (scene.bossShootEvent) scene.bossShootEvent.remove();
    if (bossTurretL) { bossTurretL.destroy(); bossTurretR.destroy(); }
    if (bossTurretLTrail) { bossTurretLTrail.destroy(); bossTurretRTrail.destroy(); }

    // ТВОЙ ВАУ-ЭФФЕКТ (Оставляем как был!)
    let vText = scene.add.text(187, 333, "CORE DESTROYED!", {
        fontFamily: 'Courier New', fontSize: '36px', fill: '#00ff00', fontWeight: 'bold', stroke: '#000', strokeThickness: 8
    }).setOrigin(0.5).setDepth(5000);

    scene.cameras.main.flash(1000, 255, 255, 255);
    scene.cameras.main.shake(1500, 0.08);

    for(let i = 0; i < 120; i++) {
        let p = scene.add.rectangle(boss.x, boss.y, 8, 8, isPhase2 ? 0xff0000 : 0xff00ff);
        scene.physics.add.existing(p);
        p.body.setVelocity(Phaser.Math.Between(-600, 600), Phaser.Math.Between(-600, 600));
        p.body.setDrag(100);
        scene.time.delayedCall(2500, () => p.destroy());
    }

    boss.setVisible(false);
    if (bossTrail) bossTrail.setVisible(false);

    levelText.setText(`SEC: ${level}`); // Обновляем текст уровня на главном экране
    bestText.setText(`BEST: ${bestLevel}`);

    scene.time.delayedCall(3000, () => {
        vText.destroy();
        showShop(scene);
    });
}

function showShop(scene, mainMenu) {
    saveProgress();
    isShopOpen = true;
    const overlay = scene.add.container(0, 0).setDepth(4000);
    overlay.add(scene.add.graphics().fillStyle(0x000000, 0.98).fillRect(0, 0, 375, 667));

    const creds = scene.add.text(187, 35, `CREDITS: ${coins}`, { fill: '#ffff00', fontSize: '24px', fontWeight: 'bold' }).setOrigin(0.5);
    const stats = scene.add.text(187, 65, `RECORD: SEC ${bestLevel} | MAX: ${bestDistance}m`, {
        fill: '#00ff00', fontSize: '11px', fontFamily: 'Courier New'
    }).setOrigin(0.5);

    const createBtn = (y, name, desc, cost, type, action) => {
        // ОПРЕДЕЛЯЕМ МАКСИМУМ: для здоровья 10, для остального пока 1
        const maxLvl = (type === 'health') ? 10 : 1;
        let curLvl = (type === 'shield') ? (isShieldActive ? 1 : 0) : (upgradeLevels[type] || 0);

        // Кнопка станет зеленой только на макс. уровне
        let isMaxed = curLvl >= maxLvl;

        const btnBg = scene.add.rectangle(187, y, 320, 50, isMaxed ? 0x004400 : 0x222222).setInteractive();

        // Добавляем счетчик в название
        const label = isMaxed ? `${name} [MAXED]` : `${name} (${curLvl}/${maxLvl})`;
        const btnText = scene.add.text(187, y - 10, `${label} [${cost}]`, { fontSize: '14px', fill: '#fff', fontWeight: 'bold' }).setOrigin(0.5);
        if (isMaxed) btnText.setText(`${name} [INSTALLED]`).setTint(0x00ff88);

        const descText = scene.add.text(187, y + 12, desc, { fontSize: '10px', fill: '#aaa' }).setOrigin(0.5);

        btnBg.on('pointerdown', () => {
            if (isMaxed) return;
            if (coins >= cost) {
                coins -= cost;

                if(type === 'shield') {
                    isShieldActive = true;
                    upgradeLevels.shield = 1;
                } else {
                    upgradeLevels[type] = (upgradeLevels[type] || 0) + 1;
                }

                if(action) action();
                saveProgress();

                // Мгновенное обновление текста при покупке
                let newLvl = (type === 'shield') ? 1 : upgradeLevels[type];
                if (newLvl >= maxLvl) {
                    btnBg.setFillStyle(0x004400);
                    btnText.setText(`${name} [INSTALLED]`).setTint(0x00ff88);
                } else {
                    btnText.setText(`${name} (${newLvl}/${maxLvl}) [${cost}]`);
                }

                creds.setText(`CREDITS: ${coins}`);
                if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.notificationOccurred('success');
            } else {
                scene.tweens.add({ targets: [btnBg, btnText, descText], x: 197, duration: 50, yoyo: true, repeat: 2, onComplete: () => btnBg.setX(187) });
            }
        });
        overlay.add([btnBg, btnText, descText]);
    };

    createBtn(115, "ULTRA ANTENNA", "Ult charges 75% faster", 400, 'ultra');
    createBtn(170, "DUAL CANNONS", "Extreme 3-way firepower", 800, 'fire');
    createBtn(225, "SPEED BOOST", "+10% running speed", 300, 'speed');
    createBtn(280, "REINFORCED HULL", "+25 Max HP & Full Heal", 500, 'health', () => {
        maxPlayerHealth += 25;
        playerHealth = maxPlayerHealth;
    });
    createBtn(335, "EMERGENCY SHIELD", "Protects from one fatal hit", 150, 'shield');

    // Скин STRIKER
    createBtn(380, "VOID_STRIKER", "Ship shape: Dangerous Triangle", 1500, 'skin_striker', () => {
        currentShape = 'striker';
        saveProgress();
        refreshPlayerAppearance(scene); // МГНОВЕННОЕ ОБНОВЛЕНИЕ
    });

    // Золотой скин
    createBtn(430, "GOLD SKIN", "Pure gold style. Respect!", 2000, 'skin_gold', () => {
        currentSkin = 'gold';
        saveProgress();
        refreshPlayerAppearance(scene); // МГНОВЕННОЕ ОБНОВЛЕНИЕ
    });

    // Neon Ghost
    createBtn(480, "NEON GHOST", "Translucent cyberpunk style", 3000, 'skin_ghost', () => {
        currentSkin = 'ghost';
        saveProgress();
        refreshPlayerAppearance(scene); // МГНОВЕННОЕ ОБНОВЛЕНИЕ
    });

    if (isVictory) {
        // Уровень уже увеличен в triggerVictory, просто летим дальше
        const nextBtn = scene.add.text(187, 580, `>> DEPLOY SECTOR ${level}`, {
            fontSize: '22px', fill: '#00ffff', backgroundColor: '#003333', padding: 15
        }).setOrigin(0.5).setInteractive();

        nextBtn.on('pointerdown', () => {
            overlay.destroy();
            isShopOpen = false;
            isVictory = false;
            shouldAutoStart = true;  // Автостарт следующего уровня
            scene.scene.restart();
        });
        overlay.add(nextBtn);
    }

    // КНОПКА SHARE
    const share = scene.add.text(187, 530, "👥 INVITE FRIEND +500 GOLD", {
        fontSize: '16px', fill: '#00ff88', backgroundColor: '#003300', padding: 10
    }).setOrigin(0.5).setInteractive();

    share.on('pointerdown', () => {
        // ДЕРЗКИЕ ФРАЗЫ БОССА
        let bossTaunt = "";
        if (level < 10) bossTaunt = "SCANNING_NEW_VICTIM... This human is weak. Can you do better?";
        else if (level < 25) bossTaunt = "SYSTEM_WARNING: Sector " + level + " breached! I need a real challenge. Are you the one?";
        else bossTaunt = "!! CORE_OVERLOAD !! I've deleted thousands. You're next. Try to survive if you dare!";

        const shareText = encodeURIComponent("I'm on Sector " + level + "! Beat my record of " + bestDistance + "m in Glitched Arena!");
        const shareUrl = encodeURIComponent(SHARE_LINK);
        const fullLink = `https://t.me/share/url?url=${shareUrl}&text=${shareText}`;

        // Проверяем, запущены ли мы внутри Telegram
        if (window.Telegram?.WebApp) {

            Telegram.WebApp.openTelegramLink(fullLink);

            // Начисляем бонус (один раз за сессию)
            if (!upgradeLevels.shareClaimed) {
                coins += 500;
                upgradeLevels.shareClaimed = true;
                saveProgress();
                creds.setText(`CREDITS: ${coins}`);
                share.setText("BONUS CLAIMED ✓").setFill("#aaa").disableInteractive();
                if (Telegram.WebApp.HapticFeedback) Telegram.WebApp.HapticFeedback.notificationOccurred('success');
            }
        } else {
            // Если в обычном браузере
            window.open(fullLink, '_blank');
        }
    });

    // Если бонус уже был получен ранее, сразу меняем вид кнопки при открытии магазина
    if (upgradeLevels.shareClaimed) {
        share.setText("INVITATION SENT ✓").setFill("#aaa").disableInteractive();
    }

    const back = scene.add.text(187, 630, "<< BACK TO MENU", { fontSize: '16px', fill: '#ff00ff' }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
        overlay.destroy(); isShopOpen = false; saveProgress(); scene.scene.restart();
    });
    overlay.add([creds, stats, share, back]);
}

function bossShoot() {
    if (isShopOpen || isDead || !isBossFight || isPaused || bullets.getLength() > 200) return;

    let count = isPhase3 ? 32 : (isPhase2 ? 24 : 12); // Увеличиваем плотность огня
    let speed = isPhase3 ? 400 : 350;

    for (let i = 0; i < count; i++) {
        let angle = i * (Math.PI * 2 / count);

        // В 3-й фазе пули закручиваются в спираль
        if (isPhase3) angle += Math.sin(this.time.now * 0.001) * 2;

        let b = bullets.create(boss.x, boss.y, 'pixel')
            .setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
            .setScale(isPhase3 ? 2 : 1.5);

        // Цвета: Phase 3 мерцает белым и красным
        if (isPhase3) {
            b.setTint(Math.random() > 0.5 ? 0xffffff : 0xff0000);
        } else {
            b.setTint(isPhase2 ? 0xff0000 : 0xff00ff);
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
        obstacle.setVelocityY(480 + (level * 15));
    } else {
        obstacle.setTint(0xff0000);
        obstacle.setVelocityY(450 + (level * 25));
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
    // УВЕЛИЧИЛИ ШАНС: теперь на элитных уровнях сердечки падают часто
    let heartChance = level >= 30 ? 0.60 : (level >= 25 ? 0.75 : 0.99);

    if (rand > heartChance) {
        type = 'heart';
    } else if (rand > 0.97) {
        type = 'magnet';
    } else if (rand > 0.93) {
        type = 'nuke';
    } else if (rand > 0.85) {
        type = 'slowmo';
    }

    let item = items.create(x, -20, type === 'heart' ? 'heart' : 'pixel');

    if (type === 'heart') {
        // Делаем сердечко ярким и пульсирующим, чтобы не пропустить
        item.setTint(0xff0088).setScale(1.2);
        this.tweens.add({ targets: item, scale: 1.6, duration: 400, yoyo: true, repeat: -1 });
    } else if (type === 'coin') {
        item.setTint(0xffff00).setData('type', 'coin').setScale(1.5);
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
        glitchText.setText("MAGNET_LINK_ESTABLISHED").setFill("#ff00ff");
        this.time.delayedCall(8000, () => { isMagnetActive = false; glitchText.setText(""); }); // Работает 8 секунд
    }

    if (type === 'heart') {
        // Восстанавливаем 25% здоровья
        playerHealth = Math.min(maxPlayerHealth, playerHealth + 25);
        glitchText.setText("INTEGRITY_RESTORED").setFill("#ff0088");
        this.time.delayedCall(1000, () => glitchText.setText(""));
        this.cameras.main.flash(300, 255, 0, 136, 0.4); // Розовая вспышка хила
        if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }

    if (type === 'nuke') {
        // Проигрываем сирену (обрезаем программно до 2 секунд)
        this.sound.play('sfx_nuke', { volume: 0.5, stopOnTerminate: true });
        this.time.delayedCall(2000, () => { this.sound.stopByKey('sfx_nuke'); });

        // ВИБРАЦИЯ: Телефон взорвется в руках!
        if (window.Telegram?.WebApp?.HapticFeedback) {
            Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        // ЭФФЕКТ: Экран заливается розовым глитчем
        this.cameras.main.flash(500, 255, 0, 255, 0.6);
        this.cameras.main.shake(600, 0.04);

        // Удаляем все препятствия
        obstacles.clear(true, true);
        glitchText.setText("SYSTEM_PURIFIED").setFill("#ff00ff").setAlpha(1);
        this.time.delayedCall(1500, () => glitchText.setAlpha(0));

    } else if (type === 'coin') {
        coinsThisRun += (isGlitchMode ? 30 : 10); // Бонус безумия
        scoreText.setText(`CREDITS: ${coins + coinsThisRun}`);
    } else if (type === 'slowmo') {
        glitchText.setText("TIME_WARP_ACTIVE").setFill("#00ff00");
        this.physics.world.timeScale = 2; // Мир в 2 раза медленнее
        this.time.delayedCall(3000, () => {
            this.physics.world.timeScale = 1;
            glitchText.setText("");
        });
    }
}

function showComboEffect(scene) {
    combo++;
    if (scene.comboSound) scene.comboSound.play();

    // Настройка текста: ярче и заметнее
    comboPopText.setPosition(player.x, player.y - 60);
    comboPopText.setText(`+COMBO x${combo}`);
    comboPopText.setAlpha(1).setScale(1.2).setFill(combo >= 10 ? '#ff0000' : '#00ff00');

    // ЭФФЕКТ БЕЗУМИЯ НА x10
    if (combo === 10) {
        isGlitchMode = true;
        // ЭФФЕКТ: Инверсия цветов (Негатив)
        this.cameras.main.setPostPipeline('ColorMatrix'); // Если твой Phaser поддерживает конвейеры
        // Или просто жесткая вспышка и смена фона:
        this.cameras.main.setBackgroundColor('#ffffff'); // Белый фон для эффекта "выгорания"

        scene.cameras.main.shake(5000, 0.007);
        glitchText.setText("!!! HYPER_GLITCH: 3x GOLD !!!").setFill("#000000").setBackgroundColor("#ff0000");

        scene.time.delayedCall(5000, () => {
            isGlitchMode = false;
            this.cameras.main.setBackgroundColor('#000000'); // Возвращаем тьму
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
        let reward = isGlitchMode ? 45 : 15; // Тройная награда в режиме безумия
        coinsThisRun += reward;
        scoreText.setText(`CREDITS: ${coins + coinsThisRun}`);
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

    const title = scene.add.text(187, 80, "GLITCHED\nARENA", {
        fontSize: '42px', fill: '#00ffff', align: 'center', fontWeight: 'bold', stroke: '#ff00ff', strokeThickness: 4
    }).setOrigin(0.5);

    const btnStyle = { fontSize: '18px', fill: '#fff', backgroundColor: '#222', padding: 10 };

    // Кнопки управления (сдвинуты для баланса)
    const startBtn = scene.add.text(187, 210, ">> START SYSTEM", btnStyle).setOrigin(0.5).setInteractive();
    const hangarBtn = scene.add.text(187, 275, ">> HANGAR [SKINS]", btnStyle).setOrigin(0.5).setInteractive();
    const shopBtn = scene.add.text(187, 340, ">> DATA SHOP", btnStyle).setOrigin(0.5).setInteractive();
    const setBtn = scene.add.text(187, 405, ">> PILOT SETTINGS", btnStyle).setOrigin(0.5).setInteractive();
    const soundBtn = scene.add.text(187, 470, `>> AUDIO: ${isSoundOn ? 'ON' : 'OFF'}`, btnStyle).setOrigin(0.5).setInteractive();
    const rulesBtn = scene.add.text(187, 535, ">> HOW_TO_SURVIVE", btnStyle).setOrigin(0.5).setInteractive();
    const topBtn = scene.add.text(187, 600, ">> TOP PILOTS [GLOBAL]", {
        fontSize: '16px', fill: '#ffff00', backgroundColor: '#333300', padding: 10
    }).setOrigin(0.5).setInteractive();

    topBtn.on('pointerdown', () => {
        menu.setVisible(false);
        showLeaderboard(scene, menu);
    });

    // Логика кнопок
    startBtn.on('pointerdown', () => {
        menu.destroy(); isStarted = true;
        if (isSoundOn && !scene.sound.get('bgm')) scene.sound.play('bgm', {loop:true, volume:0.15});
        scene.obstacleTimer = scene.time.addEvent({ delay: Math.max(300, 1150 - level * 50), callback: spawnObstacle, callbackScope: scene, loop: true });
        scene.shootEvent = scene.time.addEvent({ delay: 150 - (upgradeLevels.fire * 20), callback: playerShoot, callbackScope: scene, loop: true });
        itemsTimer = scene.time.addEvent({ delay: 1000, callback: spawnItem, callbackScope: scene, loop: true });
    });

    hangarBtn.on('pointerdown', () => { menu.setVisible(false); showHangar(scene, menu); });
    shopBtn.on('pointerdown', () => { menu.setVisible(false); showShop(scene, menu); });
    setBtn.on('pointerdown', () => { menu.setVisible(false); showSettings(scene, menu); });
    rulesBtn.on('pointerdown', () => { menu.setVisible(false); showRules(scene, menu); });
    soundBtn.on('pointerdown', () => {
        isSoundOn = !isSoundOn;
        soundBtn.setText(`>> AUDIO: ${isSoundOn ? 'ON' : 'OFF'}`);
        if (!isSoundOn) scene.sound.stopAll();
    });

    menu.add([bg, title, startBtn, hangarBtn, shopBtn, setBtn, soundBtn, rulesBtn, topBtn]);
    return menu;
}

function showRules(scene, mainMenu) {
    const rulesOverlay = scene.add.container(0, 0).setDepth(4000);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.98).fillRect(0, 0, 375, 667);
    rulesOverlay.add(bg);

    const header = scene.add.text(187, 40, "SYSTEM_MANUAL v1.1", {
        fontSize: '24px', fill: '#00ffff', fontWeight: 'bold', fontFamily: 'Courier New'
    }).setOrigin(0.5);
    rulesOverlay.add(header);

    // --- SECTION 1: ITEMS ---
    const items = [
        { key: 'wall', c: 0xff0000, t: "RED_WALL: Lethal. Avoid at all costs!" },
        { key: 'pixel', c: 0xffff00, t: "CREDITS: Pick up for upgrades." },
        { key: 'heart', c: 0xff0088, t: "HEART: Restores +25% Hull Integrity." },
        { key: 'pixel', c: 0xff00ff, t: "SYSTEM_NUKE: Purge all threats + Siren.", angle: 45, scale: 2.8 },
        { key: 'pixel', c: 0xff00ff, t: "MAGNET: Pull credits from distance.", angle: 180 },
        { key: 'pixel', c: 0x00ff00, t: "SLOW_MO: Stabilize time for 3 sec." }
    ];

    items.forEach((item, i) => {
        let y = 100 + (i * 45);
        let icon = scene.add.sprite(40, y, item.key).setTint(item.c);

        // 1. Устанавливаем масштаб: если в объекте есть свой scale — берем его, иначе стандарт
        let finalScale = item.scale ? item.scale : (item.key === 'pixel' ? 2 : 0.7);
        icon.setScale(finalScale);

        // 2. Устанавливаем угол: если есть angle — поворачиваем (так квадрат станет ромбом)
        if (item.angle) {
            icon.setAngle(item.angle);
        }

        let txt = scene.add.text(70, y, item.t, { fontSize: '12px', fill: '#fff', fontFamily: 'Courier New' }).setOrigin(0, 0.5);
        rulesOverlay.add([icon, txt]);
    });

    // --- SECTION 2: SECTOR ALERTS ---
    const stagesTitle = scene.add.text(187, 350, "--- SECTOR_ALERTS ---", {
        fontSize: '16px', fill: '#00ffff', fontFamily: 'Courier New'
    }).setOrigin(0.5);

    const stagesDesc = scene.add.text(187, 400,
        "SEC 15: MEGA_BOSS (Side Turrets Engaged)\n" +
        "SEC 20: ELITE_SHIELDS (Orbital Protection)\n" +
        "SEC 30: CORE_OVERLOAD (Final Rage Mode)",
        { fontSize: '11px', fill: '#ffaa00', fontFamily: 'Courier New', align: 'center', lineSpacing: 10 }
    ).setOrigin(0.5);
    rulesOverlay.add([stagesTitle, stagesDesc]);

    // --- SECTION 3: DATA SHOP ---
    const shopBox = scene.add.rectangle(187, 480, 330, 80, 0x00ffff, 0.1).setStrokeStyle(1, 0x00ffff);
    const shopTxt = scene.add.text(187, 480,
        "STRATEGY: Visit the DATA_SHOP!\n" +
        "Upgrade Firepower, Speed, and\n" +
        "install EMERGENCY_SHIELDS to survive.",
        { fontSize: '12px', fill: '#00ffff', align: 'center', fontFamily: 'Courier New' }
    ).setOrigin(0.5);
    rulesOverlay.add([shopBox, shopTxt]);

    // --- OPTIONAL: ANIMATED HAND (TUTORIAL) ---
    const hand = scene.add.circle(187, 630, 10, 0x00ffff, 0.5);
    scene.tweens.add({
        targets: hand,
        x: { from: 120, to: 255 },
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
    const handTxt = scene.add.text(187, 650, "SLIDE TO MOVE", { fontSize: '10px', fill: '#00ffff' }).setOrigin(0.5);
    rulesOverlay.add([hand, handTxt]);

    // BACK BUTTON
    const back = scene.add.text(187, 580, "<< RETURN_TO_MENU", {
        fontSize: '18px', fill: '#fff', backgroundColor: '#330033', padding: 12, fontFamily: 'Courier New'
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
    const title = scene.add.text(187, 60, "PILOT_CALIBRATION", { fontSize: '24px', fill: '#00ffff' }).setOrigin(0.5);
    overlay.add([bg, title]);

    // Превью
    const finger = scene.add.circle(187, 350, 15, 0xffffff, 0.3).setStrokeStyle(2, 0xffffff);
    const shipPreview = scene.add.sprite(187, 350 + yOffset, player.texture.key).setScale(2);
    overlay.add([finger, shipPreview]);

    const info = scene.add.text(187, 450, `OFFSET: ${Math.abs(yOffset)}px`, { fontSize: '18px', fill: '#00ffff' }).setOrigin(0.5);
    overlay.add(info);

    const adjust = (v) => {
        yOffset = Phaser.Math.Clamp(yOffset + v, -150, 0);
        shipPreview.setY(350 + yOffset);
        info.setText(`OFFSET: ${Math.abs(yOffset)}px`);
        saveProgress();
    };

    const up = scene.add.text(120, 520, " [ HIGHER ] ", { backgroundColor: '#004400', padding: 10 }).setOrigin(0.5).setInteractive().on('pointerdown', () => adjust(-10));
    const down = scene.add.text(254, 520, " [ LOWER ] ", { backgroundColor: '#440000', padding: 10 }).setOrigin(0.5).setInteractive().on('pointerdown', () => adjust(10));
    overlay.add([up, down]);

    const back = scene.add.text(187, 610, "<< APPLY & EXIT", {
        fontSize: '18px', fill: '#ff00ff', backgroundColor: '#220022', padding: 12
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
        overlay.destroy(); mainMenu.setVisible(true);
    });
    overlay.add(back);
}

function showHangar(scene, mainMenu) {
    const overlay = scene.add.container(0, 0).setDepth(4000);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.98).fillRect(0, 0, 375, 667);
    const title = scene.add.text(187, 40, "SHIP_HANGAR", { fontSize: '26px', fill: '#00ffff', fontWeight: 'bold' }).setOrigin(0.5);
    overlay.add([bg, title]);

    // Статистика корабля
    const stats = getShipStats();
    const statsText = scene.add.text(187, 80, stats.label, { fontSize: '12px', fill: '#ffff00', backgroundColor: '#222', padding: 5 }).setOrigin(0.5);
    overlay.add(statsText);

    // 1. ВЫБОР ФОРМЫ
    overlay.add(scene.add.text(40, 110, "--- HULL_TYPE ---", { fontSize: '14px', fill: '#ff00ff' }));
    const shapes = [
        { id: 'classic', name: 'CLASSIC BOX', unlocked: true },
        { id: 'striker', name: 'VOID STRIKER', unlocked: upgradeLevels.skin_striker > 0 }
    ];

    shapes.forEach((s, i) => {
        if (!s.unlocked) return;
        const btn = scene.add.text(60, 145 + (i * 40), `> ${s.name}`, {
            fontSize: '18px', fill: currentShape === s.id ? '#00ffff' : '#666'
        }).setInteractive().on('pointerdown', () => {
            currentShape = s.id; saveProgress(); refreshPlayerAppearance(scene);
            overlay.destroy(); showHangar(scene, mainMenu); // Перерисовать
        });
        overlay.add(btn);
    });

    // 2. ВЫБОР ЦВЕТА
    overlay.add(scene.add.text(40, 260, "--- VISUAL_SKIN ---", { fontSize: '14px', fill: '#ff00ff' }));
    const skins = [
        { id: 'classic', name: 'CYAN NEON', unlocked: true },
        { id: 'gold', name: 'PURE GOLD', unlocked: upgradeLevels.skin_gold > 0 },
        { id: 'ghost', name: 'NEON GHOST', unlocked: upgradeLevels.skin_ghost > 0 }
    ];

    skins.forEach((sk, i) => {
        if (!sk.unlocked) return;
        const btn = scene.add.text(60, 300 + (i * 40), `> ${sk.name}`, {
            fontSize: '18px', fill: currentSkin === sk.id ? '#00ffff' : '#666'
        }).setInteractive().on('pointerdown', () => {
            currentSkin = sk.id; saveProgress(); refreshPlayerAppearance(scene);
            overlay.destroy(); showHangar(scene, mainMenu);
        });
        overlay.add(btn);
    });

    // ПРЕВЬЮ
    const preview = scene.add.sprite(280, 180, player.texture.key).setScale(3.5);
    overlay.add(preview);

    // --- БЛОК BOSS INTEL ---
    const intel = getBossIntel();
    const intelBox = scene.add.rectangle(187, 480, 330, 90, 0xff00ff, 0.05).setStrokeStyle(1, 0xff00ff);
    const intelTitle = scene.add.text(187, 450, `SCANNING_SECTOR_${level}...`, { fontSize: '10px', fill: '#ff00ff' }).setOrigin(0.5);

    const bossName = scene.add.text(187, 470, `TARGET: ${intel.name}`, { fontSize: '16px', fill: '#fff', fontWeight: 'bold' }).setOrigin(0.5);
    const bossDesc = scene.add.text(187, 490, intel.desc, { fontSize: '11px', fill: '#aaa' }).setOrigin(0.5);
    const bossTip = scene.add.text(187, 515, intel.tip, { fontSize: '12px', fill: '#00ff00', fontWeight: 'bold' }).setOrigin(0.5);

    overlay.add([intelBox, intelTitle, bossName, bossDesc, bossTip]);

    // Кнопка BACK
    const back = scene.add.text(187, 610, "<< RETURN TO MENU", {
        fontSize: '18px', fill: '#fff', backgroundColor: '#330033', padding: 12
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
        overlay.destroy(); mainMenu.setVisible(true);
    });
    overlay.add(back);
}

function getShipStats() {
    let stats = { atk: 1, spd: 1, label: "STANDARD" };

    // Бонус за форму
    if (currentShape === 'striker') {
        stats.atk += 0.2; // +20% Урон
        stats.label = "STRIKER: +20% ATK";
    }

    // Бонус за цвет
    if (currentSkin === 'gold') {
        stats.atk += 0.1; // Золото чуть мощнее
        stats.label = (currentShape === 'striker') ? stats.label + " | GOLD: +10% ATK" : "GOLD: +10% ATK";
    } else if (currentSkin === 'ghost') {
        stats.spd += 0.15; // Призрак быстрее
        stats.label = (currentShape === 'striker') ? stats.label + " | GHOST: +15% SPD" : "GHOST: +15% SPD";
    }

    return stats;
}

function getBossIntel() {
    if (level < 15) {
        return {
            name: "SCOUT_DRONE",
            desc: "Light armor. Standard patterns.",
            tip: "SUGGEST: GOLD (for farming)"
        };
    } else if (level < 20) {
        return {
            name: "MEGA_TURRET",
            desc: "Dual side cannons. High fire rate.",
            tip: "SUGGEST: STRIKER (+20% ATK)"
        };
    } else if (level < 30) {
        return {
            name: "SHIELD_MASTER",
            desc: "Orbital protection. Hard to hit.",
            tip: "SUGGEST: STRIKER (Break shields fast)"
        };
    } else {
        return {
            name: "CORE_OVERLOAD",
            desc: "Rage mode. Bullet hell chaos.",
            tip: "SUGGEST: GHOST (+15% SPD)"
        };
    }
}

async function submitScore(dist, lvl) {
    if (!window.Telegram?.WebApp?.initDataUnsafe?.user) return;
    const user = window.Telegram.WebApp.initDataUnsafe.user;
    const userName = user.first_name;

    try {
        // 1. Проверяем, есть ли уже этот игрок в базе
        const { data: existingEntry, error: fetchError } = await db
            .from('leaderboard')
            .select('score')
            .eq('username', userName)
            .maybeSingle();

        if (fetchError) throw fetchError;

        if (existingEntry) {
            // 2. Если игрок есть, обновляем только если новый рекорд ВЫШЕ
            if (dist > existingEntry.score) {
                await db
                    .from('leaderboard')
                    .update({ score: dist, level: lvl, skin: currentSkin })
                    .eq('username', userName);
                console.log("Record UPDATED in Supabase!");
            } else {
                console.log("New score isn't higher. Skipping DB update.");
            }
        } else {
            // 3. Если игрока нет в базе — создаем новую запись
            await db
                .from('leaderboard')
                .insert([{ username: userName, score: dist, level: lvl, skin: currentSkin }]);
            console.log("New player SAVED to Supabase!");
        }
    } catch (e) {
        console.error("Supabase Sync Error:", e);
    }
}

async function showLeaderboard(scene, mainMenu) {
    const overlay = scene.add.container(0, 0).setDepth(4000);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.98).fillRect(0, 0, 375, 667);
    const title = scene.add.text(187, 50, "GLOBAL_RANKINGS", { fontSize: '26px', fill: '#ffff00', fontWeight: 'bold', fontFamily: 'Courier New' }).setOrigin(0.5);
    overlay.add([bg, title]);

    const loadingText = scene.add.text(187, 300, "CONNECTING_TO_DATABASE...", { fontSize: '14px', fill: '#00ffff', fontFamily: 'Courier New' }).setOrigin(0.5);
    overlay.add(loadingText);

    try {
        // Запрос ТОП-10 из Supabase
        const { data, error } = await db
            .from('leaderboard')
            .select('*')
            .order('score', { ascending: false })
            .limit(10);

        if (error) throw error;
        loadingText.destroy();

        if (data.length === 0) {
            overlay.add(scene.add.text(187, 300, "NO RECORDS YET", { fontSize: '16px', fill: '#aaa' }).setOrigin(0.5));
        }

        data.forEach((entry, i) => {
            const y = 130 + (i * 42);
            let color = '#ffffff';
            let medal = '';

            if (i === 0) { color = '#FFD700'; medal = '🥇 '; }
            else if (i === 1) { color = '#C0C0C0'; medal = '🥈 '; }
            else if (i === 2) { color = '#CD7F32'; medal = '🥉 '; }

            const rank = scene.add.text(30, y, `${medal}#${i+1}`, { fontSize: '15px', fill: color, fontWeight: 'bold' });
            const name = scene.add.text(95, y, entry.username.substring(0, 12).toUpperCase(), { fontSize: '14px', fill: color });
            const score = scene.add.text(345, y, `${entry.score}m`, { fontSize: '14px', fill: color, fontWeight: 'bold' }).setOrigin(1, 0);

            // Подсветка ТЕКУЩЕГО игрока
            if (window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name === entry.username) {
                const highlight = scene.add.rectangle(187, y + 10, 340, 30, 0x00ffff, 0.1).setOrigin(0.5, 0.3);
                overlay.add(highlight);
            }

            overlay.add([rank, name, score]);
        });
    } catch (e) {
        console.error(e);
        loadingText.setText("CONNECTION_ERROR: OFFLINE");
    }

    const back = scene.add.text(187, 610, "<< RETURN TO MENU", {
        fontSize: '18px', fill: '#fff', backgroundColor: '#330033', padding: 12
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
        overlay.destroy();
        mainMenu.setVisible(true);
    });
    overlay.add(back);
}