// ============================================
// 07-SCENES.JS — Окна магазина, ангара и ранги
// ============================================

function showShop(scene, mainMenu, isPostVictory = false) {
    if (isShopOpen) return; isShopOpen = true; if (mainMenu) mainMenu.setVisible(false);
    const shopOverlay = scene.add.container(0, 0).setDepth(4000);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.98).fillRect(0, 0, 375, 667); shopOverlay.add(bg);
    const fontUI = 'Arial, sans-serif';
    const header = scene.add.text(187, 35, TRANSLATIONS[lang].shop_title, { fontSize: '24px', fill: '#00ffff', fontWeight: 'bold', fontFamily: fontUI }).setOrigin(0.5); shopOverlay.add(header);
    const shopScore = scene.add.text(187, 65, `${TRANSLATIONS[lang].credits}: ${coins}`, { fontSize: '16px', fill: '#ffff00', fontFamily: fontUI }).setOrigin(0.5); shopOverlay.add(shopScore);

    const tabs = ['upgrades', 'skins', 'bundles'];
    let currentShopTab = 'upgrades';
    const upBtn = scene.add.rectangle(75, 100, 110, 35, 0xff00ff, 0.2).setInteractive().setStrokeStyle(1, 0xff00ff, 0.5);
    const upText = scene.add.text(75, 100, lang === 'ru' ? "УЛУЧШЕНИЯ" : "UPGRADES", { fontSize: '13px', fill: '#fff', fontWeight: 'bold' }).setOrigin(0.5);
    const skinBtn = scene.add.rectangle(187, 100, 110, 35, 0x222222).setInteractive().setStrokeStyle(1, 0x00ffff, 0.5);
    const skinText = scene.add.text(187, 100, lang === 'ru' ? "ОБЛИКИ" : "SKINS", { fontSize: '13px', fill: '#fff', fontWeight: 'bold' }).setOrigin(0.5);
    const bundleBtn = scene.add.rectangle(300, 100, 110, 35, 0x222222).setInteractive().setStrokeStyle(1, 0xffaa00, 0.5);
    const bundleText = scene.add.text(300, 100, lang === 'ru' ? "ПАКЕТЫ" : "PACKS", { fontSize: '13px', fill: '#fff', fontWeight: 'bold' }).setOrigin(0.5);
    shopOverlay.add([upBtn, upText, skinBtn, skinText, bundleBtn, bundleText]);

    const scrollAreaTop = 130; const scrollAreaBottom = 600; const scrollHeight = scrollAreaBottom - scrollAreaTop;
    const scrollWindow = scene.add.container(0, 0).setDepth(4001); shopOverlay.add(scrollWindow);
    const contentContainer = scene.add.container(0, 0); scrollWindow.add(contentContainer);
    const mask = scene.make.graphics().fillRect(0, scrollAreaTop, 375, scrollHeight).createGeometryMask(); scrollWindow.setMask(mask);
    
    let scrollY = 0;
    const applyScroll = () => { contentContainer.y = scrollY; };
    scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => { scrollY -= deltaY * 0.8; applyScroll(); });

    const showConfirm = (title, cost, isStars, onConfirm) => {
        const confirmOverlay = scene.add.container(0, 0).setDepth(5000);
        const cBg = scene.add.graphics().fillStyle(0x000000, 0.9).fillRect(0, 0, 375, 667).setInteractive(new Phaser.Geom.Rectangle(0,0,375,667), Phaser.Geom.Rectangle.Contains);
        const panel = scene.add.rectangle(187, 333, 300, 200, 0x111111).setStrokeStyle(2, isStars ? 0xffaa00 : 0xffff00);
        const t = scene.add.text(187, 280, title, { fontSize: '18px', fontFamily: fontUI, fill: '#fff', align: 'center', wordWrap: { width: 260 } }).setOrigin(0.5);
        const price = scene.add.text(187, 325, `${cost} ${isStars ? '⭐' : '💰'}`, { fontSize: '22px', fontFamily: fontUI, fill: isStars ? '#ffaa00' : '#ffff00', fontWeight: 'bold' }).setOrigin(0.5);
        const yesBtn = scene.add.text(120, 385, `[ ${lang === 'ru' ? 'ДА' : 'YES'} ]`, { fontSize: '20px', fontFamily: fontUI, fill: '#00ff00', backgroundColor: '#003300', padding: 10 }).setOrigin(0.5).setInteractive().on('pointerdown', () => { confirmOverlay.destroy(); onConfirm(); });
        const noBtn = scene.add.text(254, 385, `[ ${lang === 'ru' ? 'НЕТ' : 'NO'} ]`, { fontSize: '20px', fontFamily: fontUI, fill: '#ff0000', backgroundColor: '#330000', padding: 10 }).setOrigin(0.5).setInteractive().on('pointerdown', () => confirmOverlay.destroy());
        confirmOverlay.add([cBg, panel, t, price, yesBtn, noBtn]);
    };

    const createBtn = (y, key, descKey, cost, type, onBought = null) => {
        const isStars = ['skin_striker', 'skin_gold', 'skin_ghost', 'fx_blue', 'fx_pink', 'fx_rainbow', 'fx_gold', 'fx_green', 'fx_red', 'ship_tank', 'ship_dart', 'ship_viper', 'ship_phase', 'skin_crimson', 'skin_void', 'skin_plasma', 'skin_solar', 'skin_frost', 'skin_rainbow', 'skin_void_premium', 'skin_crystal', 'helper_drone', 'helper_autoshield', 'helper_autobomb', 'helper_autoheal', 'helper_mercenary', 'up_extralife', 'up_doubleDMG', 'up_enhanced'].includes(type);
        const isBought = upgradeLevels[type] > 0;
        const canAfford = isStars ? true : coins >= cost;
        const isLocked = (type === 'omega' && level < 40 && !upgradeLevels.omega) || (['up_extralife', 'up_doubleDMG', 'up_enhanced', 'helper_mercenary'].includes(type) && level < 50);

        const btnBg = scene.add.rectangle(187, y, 340, 75, isBought ? 0x004400 : (canAfford ? 0x111111 : 0x221111), 0.6).setStrokeStyle(1, isStars ? 0xffaa00 : 0x444444).setInteractive();
        const t = scene.add.text(35, y - 22, TRANSLATIONS[lang][key], { fontSize: '15px', fill: isStars ? '#ffaa00' : '#00ffff', fontWeight: 'bold' });
        const d = scene.add.text(35, y + 2, TRANSLATIONS[lang][descKey], { fontSize: '11px', fill: '#aaa', wordWrap: { width: 220 } });
        const p = scene.add.text(340, y, isBought ? "✓" : (isLocked ? "🔒" : `${cost}${isStars ? '⭐' : '💰'}`), { fontSize: '14px', fill: isBought ? '#0f0' : (isStars ? '#ffaa00' : '#ff0'), fontWeight: 'bold' }).setOrigin(1, 0.5);
        contentContainer.add([btnBg, t, d, p]);

        if (!isBought && !isLocked) {
            btnBg.on('pointerdown', () => {
                if (isStars) {
                    const tgUser = getTelegramUser();
                    fetch(`${botUrl}/get_invoice?item_type=${type}&user_id=${tgUser.id}&username=${tgUser.username || 'PILOT'}`)
                        .then(r => r.json()).then(data => { if (data.url) window.Telegram.WebApp.openInvoice(data.url); });
                } else if (coins >= cost) {
                    showConfirm(TRANSLATIONS[lang][key], cost, false, () => {
                        coins -= cost; if (type === 'buy_coins') coins += 5000; else upgradeLevels[type] = (upgradeLevels[type] || 0) + 1;
                        if (onBought) onBought();
                        saveProgress(); submitScore();
                        shopScore.setText(`${TRANSLATIONS[lang].credits}: ${coins}`);
                        p.setText("✓").setFill("#0f0"); btnBg.setFillStyle(0x004400);
                        if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                    });
                } else scene.cameras.main.shake(200, 0.01);
            });
        }
    };

    const drawTab = (tab) => {
        contentContainer.removeAll(true); scrollY = 0; applyScroll();
        let sY = 50; const step = 85;
        if (tab === 'upgrades') {
            createBtn(sY, "up_antenna", "desc_antenna", 500, 'antenna');
            createBtn(sY+step, "up_cannons", "desc_cannons", 1000, 'fire');
            createBtn(sY+step*2, "meta_overdrive", "desc_meta_overdrive", 300, 'meta_overdrive');
            createBtn(sY+step*3, "up_speed", "desc_speed", 300, 'speed');
            createBtn(sY+step*4, "up_hull", "desc_hull", 500, 'health');
            createBtn(sY+step*5, "helper_autoshield", "desc_helper_autoshield", 99, 'helper_autoshield');
            createBtn(sY+step*6, "helper_autobomb", "desc_helper_autobomb", 199, 'helper_autobomb');
            createBtn(sY+step*7, "helper_autoheal", "desc_helper_autoheal", 125, 'helper_autoheal');
            createBtn(sY+step*8, "up_extralife", "desc_up_extralife", 299, 'up_extralife');
            createBtn(sY+step*9, "up_doubleDMG", "desc_up_doubleDMG", 249, 'up_doubleDMG');
            createBtn(sY+step*10, "up_enhanced", "desc_up_enhanced", 499, 'up_enhanced');
        } else if (tab === 'skins') {
            createBtn(sY, "skin_gold", "desc_gold", 49, 'skin_gold');
            createBtn(sY+step, "skin_ghost", "desc_ghost", 49, 'skin_ghost');
            createBtn(sY+step*2, "skin_crimson", "desc_crimson", 75, 'skin_crimson');
            createBtn(sY+step*3, "skin_void", "desc_void", 75, 'skin_void');
            createBtn(sY+step*4, "skin_plasma", "desc_plasma", 75, 'skin_plasma');
            createBtn(sY+step*5, "skin_solar", "desc_solar", 75, 'skin_solar');
            createBtn(sY+step*6, "skin_frost", "desc_frost", 75, 'skin_frost');
            createBtn(sY+step*7, "skin_rainbow", "desc_rainbow", 99, 'skin_rainbow');
            createBtn(sY+step*8, "void_premium", "desc_void_premium", 149, 'skin_void_premium');
            createBtn(sY+step*9, "crystal", "desc_crystal", 125, 'skin_crystal');
            createBtn(sY+step*10, "skin_striker", "desc_striker", 299, 'skin_striker');
            createBtn(sY+step*11, "ship_tank", "desc_tank", 199, 'ship_tank');
            createBtn(sY+step*12, "ship_dart", "desc_dart", 149, 'ship_dart');
            createBtn(sY+step*13, "ship_viper", "desc_viper", 299, 'ship_viper');
            createBtn(sY+step*14, "ship_phase", "desc_phase", 349, 'ship_phase');
        } else if (tab === 'bundles') {
            createBtn(sY, "bundle_starter", "bundle_starter_desc", 49, 'bundle_starter');
            createBtn(sY+step, "bundle_warrior", "bundle_warrior_desc", 99, 'bundle_warrior');
            createBtn(sY+step*2, "bundle_legend", "bundle_legend_desc", 199, 'bundle_legend');
            createBtn(sY+step*3, "helper_drone", "desc_helper_drone", 149, 'helper_drone');
            createBtn(sY+step*4, "helper_mercenary", "desc_helper_mercenary", 149, 'helper_mercenary');
            createBtn(sY+step*5, "up_coins", "desc_coins", 25, 'buy_coins');
        }
    };

    drawTab('upgrades');
    upBtn.on('pointerdown', () => { currentShopTab = 'upgrades'; upBtn.setFillStyle(0xff00ff, 0.2); skinBtn.setFillStyle(0x222222); bundleBtn.setFillStyle(0x222222); drawTab('upgrades'); });
    skinBtn.on('pointerdown', () => { currentShopTab = 'skins'; skinBtn.setFillStyle(0x00ffff, 0.2); upBtn.setFillStyle(0x222222); bundleBtn.setFillStyle(0x222222); drawTab('skins'); });
    bundleBtn.on('pointerdown', () => { currentShopTab = 'bundles'; bundleBtn.setFillStyle(0xffaa00, 0.2); upBtn.setFillStyle(0x222222); skinBtn.setFillStyle(0x222222); drawTab('bundles'); });

    const footerY = 635; const btnWidth = 110;
    const backBg = scene.add.rectangle(65, footerY, btnWidth, 45, 0x330033).setInteractive().setStrokeStyle(1, 0xff00ff, 0.5);
    const backTxt = scene.add.text(65, footerY, TRANSLATIONS[lang].back, { fontSize: '13px', fill: '#ff00ff', fontWeight: 'bold' }).setOrigin(0.5);
    const adBg = scene.add.rectangle(187, footerY, btnWidth, 45, 0x333300).setInteractive().setStrokeStyle(1, 0xffff00, 0.5);
    const adTxt = scene.add.text(187, footerY, "📺 +250 💰", { fontSize: '13px', fill: '#ffff00', fontWeight: 'bold' }).setOrigin(0.5);
    const invBg = scene.add.rectangle(310, footerY, btnWidth, 45, 0x003322).setInteractive().setStrokeStyle(1, 0x00ff88, 0.5);
    const invTxt = scene.add.text(310, footerY, upgradeLevels.shareClaimed ? "✓" : `👥 +500`, { fontSize: '13px', fill: '#00ff88', fontWeight: 'bold' }).setOrigin(0.5);
    shopOverlay.add([backBg, backTxt, adBg, adTxt, invBg, invTxt]);

    backBg.on('pointerdown', () => { 
        scene.input.off('wheel'); shopOverlay.destroy(); isShopOpen = false;
        if (isPostVictory) scene.scene.restart();
        else { if (mainMenu) mainMenu.setVisible(true); startTitleGlitch(scene, mainMenu.titleRef); }
    });
    adBg.on('pointerdown', () => { if (window.adController) window.adController.show().then(res => { if (res.done) { coins += 250; shopScore.setText(`${TRANSLATIONS[lang].credits}: ${coins}`); saveProgress(); submitScore(); scene.cameras.main.flash(200, 255, 255, 0, 0.5); } }); });
    invBg.on('pointerdown', () => { if (!upgradeLevels.shareClaimed) { window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${SHARE_LINK}&text=${encodeURIComponent(TRANSLATIONS[lang].share_invite.replace('%lvl%', level).replace('%dist%', bestDistance))}`); coins += 500; upgradeLevels.shareClaimed = true; saveProgress(); submitScore(); invTxt.setText("✓").setFill("#777"); } });
}

function showHangar(scene, mainMenu) {
    const hangarOverlay = scene.add.container(0, 0).setDepth(4000);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.98).fillRect(0, 0, 375, 667); hangarOverlay.add(bg);
    const fontUI = 'Arial, sans-serif';
    const header = scene.add.text(187, 35, TRANSLATIONS[lang].hangar_title, { fontSize: '24px', fill: '#00ffff', fontWeight: 'bold', fontFamily: fontUI }).setOrigin(0.5); hangarOverlay.add(header);

    const scrollAreaTop = 70; const scrollAreaBottom = 600; const scrollHeight = scrollAreaBottom - scrollAreaTop;
    const scrollWindow = scene.add.container(0, 0).setDepth(4001); hangarOverlay.add(scrollWindow);
    const contentContainer = scene.add.container(0, 0); scrollWindow.add(contentContainer);
    const mask = scene.make.graphics().fillRect(0, scrollAreaTop, 375, scrollHeight).createGeometryMask(); scrollWindow.setMask(mask);
    
    let scrollY = 0;
    const applyScroll = () => { contentContainer.y = scrollY; };
    scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => { scrollY -= deltaY * 0.8; applyScroll(); });

    let currentY = 20;
    const leftX = 40; const rightX = 335;

    // --- HULL TYPE ---
    contentContainer.add(scene.add.text(187, currentY, TRANSLATIONS[lang].hull_type, { fontSize: '16px', fill: '#ff00ff', fontWeight: 'bold' }).setOrigin(0.5));
    currentY += 40;
    const hulls = [
        { id: 'classic', key: 'classic_box', up: null },
        { id: 'tank', key: 'ship_tank', up: 'ship_tank' },
        { id: 'dart', key: 'ship_dart', up: 'ship_dart' },
        { id: 'viper', key: 'ship_viper', up: 'ship_viper' },
        { id: 'phase', key: 'ship_phase', up: 'ship_phase' }
    ];
    hulls.forEach(h => {
        const isBought = !h.up || upgradeLevels[h.up] > 0;
        const isActive = currentShape === h.id;
        const box = scene.add.rectangle(187, currentY, 300, 45, isActive ? 0x00ffff : 0x111111, 0.3).setStrokeStyle(1, isActive ? 0x00ffff : 0x444444).setInteractive();
        const txt = scene.add.text(187, currentY, TRANSLATIONS[lang][h.id], { fontSize: '15px', fill: isBought ? '#fff' : '#555' }).setOrigin(0.5);
        if (isBought && !isActive) {
            box.on('pointerdown', () => { currentShape = h.id; refreshPlayerAppearance(scene); saveProgress(); submitScore(); showHangar(scene, mainMenu); });
        }
        contentContainer.add([box, txt]); currentY += 55;
    });

    // --- VISUAL SKIN ---
    currentY += 20;
    contentContainer.add(scene.add.text(187, currentY, TRANSLATIONS[lang].visual_skin, { fontSize: '16px', fill: '#ff00ff', fontWeight: 'bold' }).setOrigin(0.5));
    currentY += 40;
    const skins = Object.keys(SKIN_DATA).map(k => ({ id: k, up: k === 'classic' ? null : (k === 'void_skin' ? 'skin_void' : (k === 'void_premium' ? 'skin_void_premium' : (k === 'crystal' ? 'skin_crystal' : `skin_${k}`))) }));
    skins.forEach(s => {
        const isBought = !s.up || upgradeLevels[s.up] > 0;
        const isActive = currentSkin === s.id;
        const box = scene.add.rectangle(187, currentY, 300, 45, isActive ? 0x00ffff : 0x111111, 0.3).setStrokeStyle(1, isActive ? 0x00ffff : 0x444444).setInteractive();
        const txt = scene.add.text(187, currentY, TRANSLATIONS[lang][s.id] || s.id.toUpperCase(), { fontSize: '15px', fill: isBought ? '#fff' : '#555' }).setOrigin(0.5);
        if (isBought && !isActive) {
            box.on('pointerdown', () => { currentSkin = s.id; refreshPlayerAppearance(scene); saveProgress(); submitScore(); showHangar(scene, mainMenu); });
        }
        contentContainer.add([box, txt]); currentY += 55;
    });

    const backBtn = scene.add.rectangle(187, 630, 200, 45, 0x330033).setInteractive().setStrokeStyle(1, 0xff00ff, 0.5);
    const backLabel = scene.add.text(187, 630, TRANSLATIONS[lang].back, { fontSize: '15px', fill: '#ff00ff', fontWeight: 'bold' }).setOrigin(0.5);
    hangarOverlay.add([backBtn, backLabel]);
    backBtn.on('pointerdown', () => { scene.input.off('wheel'); hangarOverlay.destroy(); mainMenu.setVisible(true); startTitleGlitch(scene, mainMenu.titleRef); });
}

function refreshPlayerAppearance(scene) {
    if (!player) return;
    const pTex = generatePlayerTexture(scene);
    player.setTexture(pTex);
    const skin = SKINDATA[currentSkin] || SKINDATA.classic;
    if (trailEmitter) trailEmitter.setParticleTint(skin.trail);
    player.setAlpha(skin.alpha || 1);
}

const RANKS = [
    { id: 'rookie', xp: 0, color: '#aaaaaa', name: { en: 'ROOKIE', ru: 'НОВИЧОК' } },
    { id: 'pilot', xp: 500, color: '#00ffff', name: { en: 'PILOT', ru: 'ПИЛОТ' } },
    { id: 'elite', xp: 5000, color: '#0088ff', name: { en: 'ELITE', ru: 'ЭЛИТА' } },
    { id: 'master', xp: 15000, color: '#ff00ff', name: { en: 'MASTER', ru: 'МАСТЕР' } },
    { id: 'legend', xp: 50000, color: '#ffaa00', name: { en: 'LEGEND', ru: 'ЛЕГЕНДА' } }
];

function getCurrentRank() {
    let rank = RANKS[0];
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (rankXP >= RANKS[i].xp) { rank = RANKS[i]; break; }
    }
    return rank;
}

function addRankXP(amount) {
    const oldRank = getCurrentRank();
    rankXP += amount;
    const newRank = getCurrentRank();
    if (newRank.id !== oldRank.id) {
        // Р СџР С•Р Р†РЎвЂ№РЎв„–Р ВµР Р…Р С‘Р Вµ РЎР‚Р В°Р Р…Р С–Р В°!
    }
}

function getShipStats() {
    let stats = { atk: 1, spd: 1, hpBonus: 0, label: "STANDARD" };
    const isRu = lang === 'ru';
    
    if (currentShape === 'tank') { stats.atk = 1.1; stats.spd = 0.92; stats.hpBonus = 35; stats.label = isRu ? "БРОНЯ: +35 ОЗ, +10% АТК, -8% СКОР" : "ARMOR: +35HP, +10% ATK, -8% SPD"; }
    else if (currentShape === 'dart') { stats.atk = 0.9; stats.spd = 1.2; stats.label = isRu ? "СТРЕЛА: +20% СКОР, -10% АТК" : "DART: +20% SPD, -10% ATK"; }
    else if (currentShape === 'viper') { stats.atk = 1.15; stats.label = isRu ? "ГАДЮКА: БОКОВОЙ ОГОНЬ, +15% АТК" : "VIPER: SIDE SHOTS, +15% ATK"; }
    else if (currentShape === 'phase') { stats.label = isRu ? "ФАЗОВИК: 10% УКЛОНЕНИЕ ОТ СТЕН" : "PHASE: 10% DODGE WALLS"; }

    if (currentSkin === 'crimson') { stats.label += isRu ? " | КРИТ: +5% ПО БОССУ" : " | CRIT: +5% TO BOSS"; }
    else if (currentSkin === 'void_skin') { stats.label += isRu ? " | ПУСТОТА: 3% УКЛОН. ОТ ПУЛЬ" : " | VOID: 3% BULLET DODGE"; }
    else if (currentSkin === 'plasma') { stats.label += isRu ? " | ПЛАЗМА: +5% ЗАРЯД УЛЬТЫ" : " | PLASMA: +5% ULTRA CHARGE"; }
    else if (currentSkin === 'solar') { stats.label += isRu ? " | СОЛНЦЕ: +10% КРЕДИТОВ" : " | SOLAR: +10% CREDITS"; }
    else if (currentSkin === 'frost') { stats.label += isRu ? " | МОРОЗ: +1С ЗАМЕД." : " | FROST: +1S SLOWMO"; }
    else if (currentSkin === 'gold') { stats.atk *= 1.1; stats.label += isRu ? " | ЗОЛОТО: +10% АТК" : " | GOLD: +10% ATK"; }
    else if (currentSkin === 'striker') { stats.atk *= 1.2; stats.label += isRu ? " | РАССЕКАТЕЛЬ: +20% АТК" : " | STRIKER: +20% ATK"; }
    
    return stats;
}
