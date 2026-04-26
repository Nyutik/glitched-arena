// ============================================
// 07-SCENES.JS — Магазин, профиль, ангар, лидерборд
// ============================================
// За что отвечает:
// - showShop, showProfile, showLeaderboard
// - showHangar, getShipStats, getBossIntel, refreshPlayerAppearance
// ============================================

function showShop(scene, mainMenu, fromVictory = false) {
    saveProgress(); isShopOpen = true;
    if (typeof logMetric === 'function') logMetric('shop_open');
    clearBattleTexts(scene); cleanupScreenFx(scene);
    if (distanceText) distanceText.setVisible(false); if (pHealthLabel) pHealthLabel.setVisible(false); if (bHealthLabel) bHealthLabel.setVisible(false); if (overdriveBar) overdriveBar.setVisible(false); if (roadBar) roadBar.setVisible(false);
    const overlay = scene.add.container(0, 0).setDepth(4000);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.98).fillRect(0, 0, 375, 667); overlay.add(bg);
    const fontUI = '"Orbitron", sans-serif';
    const creds = scene.add.text(187, 25, `${TRANSLATIONS[lang].credits}: ${coins}`, { fill: '#ffff00', fontSize: '20px', fontWeight: 'bold', fontFamily: fontUI }).setOrigin(0.5);
    const stats = scene.add.text(187, 45, `${TRANSLATIONS[lang].best}: S${bestLevel} | ${bestDistance}m`, { fill: '#00ff00', fontSize: '11px', fontWeight: 'bold', fontFamily: fontUI }).setOrigin(0.5);
    overlay.add([creds, stats]);
    const upBtn = scene.add.rectangle(75, 85, 110, 35, currentShopTab === 'upgrades' ? 0x00ffff : 0x222222).setInteractive().setStrokeStyle(1, 0x00ffff, 0.5).setDepth(4015);
    const upText = scene.add.text(75, 85, lang === 'ru' ? "ПРОКАЧКА" : "UPGRADE", { fontSize: '14px', fontFamily: fontUI, fill: currentShopTab === 'upgrades' ? '#000' : '#fff', fontWeight: 'bold' }).setOrigin(0.5).setDepth(4016);
    const fxBtn = scene.add.rectangle(187, 85, 110, 35, currentShopTab === 'fx' ? 0xff00ff : 0x222222).setInteractive().setStrokeStyle(1, 0xff00ff, 0.5).setDepth(4015);
    const fxText = scene.add.text(187, 85, lang === 'ru' ? "Скины" : "SKINS", { fontSize: '14px', fontFamily: fontUI, fill: currentShopTab === 'fx' ? '#000' : '#fff', fontWeight: 'bold' }).setOrigin(0.5).setDepth(4016);
    const bundleBtn = scene.add.rectangle(300, 85, 110, 35, currentShopTab === 'bundles' ? 0xffaa00 : 0x222222).setInteractive().setStrokeStyle(1, 0xffaa00, 0.5).setDepth(4015);
    const bundleText = scene.add.text(300, 85, lang === 'ru' ? "ПАКЕТЫ" : "PACKS", { fontSize: '14px', fontFamily: fontUI, fill: currentShopTab === 'bundles' ? '#000' : '#fff', fontWeight: 'bold' }).setOrigin(0.5).setDepth(4016);
    overlay.add([upBtn, upText, fxBtn, fxText, bundleBtn, bundleText]);
    upBtn.on('pointerdown', () => { currentShopTab = 'upgrades'; overlay.destroy(); showShop(scene, mainMenu, fromVictory); });
    fxBtn.on('pointerdown', () => { currentShopTab = 'fx'; overlay.destroy(); showShop(scene, mainMenu, fromVictory); });
    bundleBtn.on('pointerdown', () => { currentShopTab = 'bundles'; overlay.destroy(); showShop(scene, mainMenu, fromVictory); });
    const scrollAreaTop = 110; const scrollAreaBottom = isVictory ? 550 : 620; const scrollHeight = scrollAreaBottom - scrollAreaTop;
    const scrollWindow = scene.add.container(0, scrollAreaTop).setDepth(4001); overlay.add(scrollWindow);
    const contentContainer = scene.add.container(0, 0); scrollWindow.add(contentContainer);
    const mask = scene.make.graphics().fillRect(10, scrollAreaTop, 355, scrollHeight).createGeometryMask(); scrollWindow.setMask(mask);
    let scrollY = 0, maxScroll = 0;
    let dragStartX = 0, dragStartY = 0;

    const showConfirm = (title, cost, isStars, onConfirm) => {
        const confirmOverlay = scene.add.container(0, 0).setDepth(6000);
        const cBg = scene.add.graphics().fillStyle(0x000000, 0.9).fillRect(0, 0, 375, 667); cBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 375, 667), Phaser.Geom.Rectangle.Contains);
        const panel = scene.add.rectangle(187, 333, 280, 180, 0x222222).setStrokeStyle(2, 0x00ffff);
        const txt = scene.add.text(187, 280, `${lang === 'ru' ? 'КУПИТЬ' : 'BUY'}\n${title}?`, { fontSize: '18px', fontFamily: fontUI, fill: '#fff', align: 'center', fontWeight: 'bold' }).setOrigin(0.5);
        const price = scene.add.text(187, 325, `${cost} ${isStars ? '⭐' : '💰'}`, { fontSize: '22px', fontFamily: fontUI, fill: isStars ? '#ffaa00' : '#ffff00', fontWeight: 'bold' }).setOrigin(0.5);
        const yesBtn = scene.add.text(120, 385, `[ ${lang === 'ru' ? 'ДА' : 'YES'} ]`, { fontSize: '20px', fontFamily: fontUI, fill: '#00ff00', backgroundColor: '#003300', padding: 10 }).setOrigin(0.5).setInteractive().on('pointerdown', () => { confirmOverlay.destroy(); onConfirm(); });
        const noBtn = scene.add.text(254, 385, `[ ${lang === 'ru' ? 'НЕТ' : 'NO'} ]`, { fontSize: '20px', fontFamily: fontUI, fill: '#ff0000', backgroundColor: '#330000', padding: 10 }).setOrigin(0.5).setInteractive().on('pointerdown', () => confirmOverlay.destroy());
        confirmOverlay.add([cBg, panel, txt, price, yesBtn, noBtn]);
    };
    const isRecommendedShopItem = (type) => {
        if (starterContracts.firstBoss) return false;
        return ['speed', 'health', 'meta_plating', 'helper_drone'].includes(type);
    };
    const createBtn = (y, nameKey, descKey, cost, type, action) => {
        const shipTypes = ['skin_striker', 'ship_tank', 'ship_dart', 'ship_viper', 'ship_phase'];
        const skinTypes = ['skin_gold', 'skin_ghost', 'skin_crimson', 'skin_void', 'skin_plasma', 'skin_solar', 'skin_frost', 'skin_rainbow', 'skin_void_premium', 'skin_crystal'];
        const isCustom = ['skin_striker', 'skin_gold', 'skin_ghost', 'fx_blue', 'fx_pink', 'fx_rainbow', 'fx_gold', 'fx_green', 'fx_red', 'ship_tank', 'ship_dart', 'ship_viper', 'ship_phase', 'skin_crimson', 'skin_void', 'skin_plasma', 'skin_solar', 'skin_frost', 'skin_rainbow', 'skin_void_premium', 'skin_crystal', 'helper_drone', 'helper_autoshield', 'helper_autobomb', 'helper_autoheal', 'helper_mercenary', 'up_extralife', 'up_doubleDMG', 'up_enhanced'].includes(type);
        const maxLevels = { health: 20, meta_plating: 3, meta_overdrive: 3 };
        const maxLvl = maxLevels[type] || 1;
        let curLvl = (type === 'shield') ? (isShieldActive ? 1 : 0) : (upgradeLevels[type] || 0);
        let isEquipped = (type === 'skin_striker' && currentShape === 'striker') || (type === 'ship_tank' && currentShape === 'tank') || (type === 'ship_dart' && currentShape === 'dart') || (type === 'ship_viper' && currentShape === 'viper') || (type === 'ship_phase' && currentShape === 'phase') || (type === 'skin_gold' && currentSkin === 'gold') || (type === 'skin_ghost' && currentSkin === 'ghost') || (type === 'skin_crimson' && currentSkin === 'crimson') || (type === 'skin_void' && currentSkin === 'void_skin') || (type === 'skin_plasma' && currentSkin === 'plasma') || (type === 'skin_solar' && currentSkin === 'solar') || (type === 'skin_frost' && currentSkin === 'frost') || (type === 'skin_rainbow' && currentSkin === 'rainbow') || (type === 'skin_void_premium' && currentSkin === 'void_premium') || (type === 'skin_crystal' && currentSkin === 'crystal') || (type === 'fx_blue' && currentExplosionColor === 0x00ffff) || (type === 'fx_pink' && currentExplosionColor === 0xff00ff) || (type === 'fx_rainbow' && currentExplosionColor === -1) || (type === 'fx_gold' && currentExplosionColor === 0xffaa00) || (type === 'fx_green' && currentExplosionColor === 0x00ff00) || (type === 'fx_red' && currentExplosionColor === 0xff0000);
        let isOwned = (upgradeLevels[type] > 0); let isMaxed = (!isCustom && curLvl >= maxLvl);
        const isStarItem = ['skin_gold', 'skin_ghost', 'omega', 'buy_coins', 'fx_blue', 'fx_pink', 'fx_rainbow', 'fx_gold', 'fx_green', 'fx_red', 'skin_rainbow', 'skin_void_premium', 'skin_crystal', 'bundle_starter', 'bundle_warrior', 'bundle_legend'].includes(type);
        const isLocked = (type === 'omega' && level < 40 && !upgradeLevels.omega) || (['up_extralife', 'up_doubleDMG', 'up_enhanced', 'helper_mercenary'].includes(type) && level < 50);
        
        let btnColor = isEquipped ? 0x004444 : (isLocked ? 0x111111 : (isStarItem ? 0x221100 : (isMaxed ? 0x001100 : 0x111111)));
        const btnBg = scene.add.rectangle(187, y, 330, 52, btnColor).setInteractive();
        
        // Элитные рамки для Stars
        if (isLocked) btnBg.setStrokeStyle(1, 0x444444, 0.5); 
        else if (isEquipped) btnBg.setStrokeStyle(2, 0x00ffff, 1); 
        else if (isStarItem) {
            btnBg.setStrokeStyle(2, 0xffaa00, 1);
            scene.tweens.add({ targets: btnBg, alpha: 0.7, duration: 800, yoyo: true, repeat: -1 });
        }
        else btnBg.setStrokeStyle(1, 0x00ffff, 0.3);

        const namet = TRANSLATIONS[lang][nameKey]; let priceTag = "";
        if (isLocked) priceTag = `[${lang === 'ru' ? 'СЕКТОР' : 'SEC'} 40+]`; 
        else if (type.startsWith('helper_') && isOwned) priceTag = `[${lang === 'ru' ? 'АКТИВЕН' : 'ACTIVE'}]`; 
        else if (isEquipped) priceTag = `[${lang === 'ru' ? 'ВЫБРАНО' : 'EQUIPPED'}]`; 
        else if (isCustom && isOwned) priceTag = `[${lang === 'ru' ? 'ВЫБРАТЬ' : 'SELECT'}]`; 
        else if (isMaxed) priceTag = `[${TRANSLATIONS[lang].maxed}]`; 
        else priceTag = `- ${cost} ${isStarItem ? '⭐' : '💰'}`;

        const textFill = isLocked ? '#555' : (isEquipped ? '#00ffff' : (isStarItem ? '#ffaa00' : '#fff'));
        const btnText = scene.add.text(187, y - 10, `${namet}${!isCustom && maxLvl > 1 ? ` [${curLvl}/${maxLvl}]` : ""} ${priceTag}`, { fontSize: '13px', fontFamily: fontUI, fill: textFill, fontWeight: 'bold' }).setOrigin(0.5);
        const descText = scene.add.text(187, y + 12, TRANSLATIONS[lang][descKey], { fontSize: '10px', fontFamily: fontUI, fill: isLocked ? '#333' : '#999', align: 'center', wordWrap: { width: 310 } }).setOrigin(0.5);
        const recommendedTag = isRecommendedShopItem(type) && !isOwned && !isLocked && !isMaxed
            ? scene.add.text(48, y + 14, TRANSLATIONS[lang].recommended, { fontSize: '8px', fontFamily: fontUI, fill: '#00170f', backgroundColor: '#00ff88', padding: { x: 4, y: 2 }, fontWeight: 'bold' }).setOrigin(0, 0.5)
            : null;
        
        btnBg.on('pointerdown', p => { dragStartX = p.x; dragStartY = p.y; });
        btnBg.on('pointerup', p => {
            const dist = Phaser.Math.Distance.Between(dragStartX, dragStartY, p.x, p.y);
            if (dist > 15) return; // Это был скролл, а не тап

            if (isLocked) { scene.cameras.main.shake(100, 0.01); return; }
            if (isMaxed) return;
            if (type.startsWith('helper_') && isOwned && cost > 0) return;
            if (isEquipped || (isCustom && isOwned)) { if (action) action(); saveProgress(); overlay.destroy(); showShop(scene, mainMenu, fromVictory); return; }
            
            showConfirm(namet, cost, isStarItem, () => {
                if (isStarItem) {
                    if (cost === 0) { upgradeLevels[type] = 1; saveProgress(); overlay.destroy(); showShop(scene, mainMenu, fromVictory); return; }
                    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
                    fetch(`${botUrl}/get_invoice?item_type=${type}&user_id=${user?.id}&username=${user?.first_name}`).then(r => r.json()).then(data => {
                        if (data.url) window.Telegram.WebApp.openInvoice(data.url, status => {
                            if (status === 'paid') {
                                if (type === 'buy_coins') coins += 5000; else upgradeLevels[type] = 1;
                                if (action) action(); saveProgress(); submitScore().catch(e => {}); overlay.destroy(); showShop(scene, mainMenu, fromVictory);
                            }
                        });
                    });
                } else if (coins >= cost) {
                    coins -= cost; 
                    if (type === 'shield') { isShieldActive = true; upgradeLevels.shield = 1; } 
                    else upgradeLevels[type] = (upgradeLevels[type] || 0) + 1;
                    if (action) action(); saveProgress(); submitScore().catch(e => {}); overlay.destroy(); showShop(scene, mainMenu, fromVictory);
                } else scene.cameras.main.shake(200, 0.01);
            });
        });
        contentContainer.add([btnBg, btnText, descText, recommendedTag].filter(Boolean));
    };

    const addHeader = (y, text) => {
        const hText = scene.add.text(187, y, text, { fontSize: '11px', fontFamily: fontUI, fill: '#ff00ff', fontWeight: 'bold' }).setOrigin(0.5);
        const lineL = scene.add.rectangle(75, y, 100, 1, 0xff00ff, 0.3);
        const lineR = scene.add.rectangle(300, y, 100, 1, 0xff00ff, 0.3);
        contentContainer.add([hText, lineL, lineR]);
    };

    let sY = 20, step = 60;
    if (currentShopTab === 'upgrades') {
        addHeader(sY, lang === 'ru' ? "--- ПЕРМАНЕНТНОЕ ЯДРО ---" : "--- PERMANENT CORE ---"); sY += 40;
        createBtn(sY, "meta_plating", "desc_meta_plating", 250, 'meta_plating');
        createBtn(sY+step, "meta_overdrive", "desc_meta_overdrive", 300, 'meta_overdrive');
        
        sY += step*2 + 20;
        addHeader(sY, lang === 'ru' ? "--- СИСТЕМЫ КОРАБЛЯ ---" : "--- SHIP SYSTEMS ---"); sY += 40;
        createBtn(sY, "up_antenna", "desc_antenna", 400, 'ultra'); 
        createBtn(sY+step, "up_cannons", "desc_cannons", 800, 'fire'); 
        createBtn(sY+step*2, "up_speed", "desc_speed", 300, 'speed'); 
        createBtn(sY+step*3, "up_hull", "desc_hull", 500, 'health', () => { maxPlayerHealth += 25; playerHealth = maxPlayerHealth; }); 
        createBtn(sY+step*4, "up_shield", "desc_shield", 150, 'shield');
        
        sY += step*5 + 20;
        addHeader(sY, lang === 'ru' ? "--- ДРОНЫ И ПОМОЩНИКИ ---" : "--- DRONES & HELPERS ---"); sY += 40;
        createBtn(sY, "helper_drone", "desc_helper_drone", 500, 'helper_drone', () => { upgradeLevels.helper_drone = 1; });
        createBtn(sY+step, "helper_autoshield", "desc_helper_autoshield", 400, 'helper_autoshield', () => { upgradeLevels.helper_autoshield = 1; });
        createBtn(sY+step*2, "helper_autobomb", "desc_helper_autobomb", 600, 'helper_autobomb', () => { upgradeLevels.helper_autobomb = 1; });
        createBtn(sY+step*3, "helper_autoheal", "desc_helper_autoheal", 350, 'helper_autoheal', () => { upgradeLevels.helper_autoheal = 1; });
        createBtn(sY+step*4, "helper_mercenary", "desc_helper_mercenary", 500, 'helper_mercenary', () => { upgradeLevels.helper_mercenary = 1; });
        
        sY += step*5 + 20;
        addHeader(sY, lang === 'ru' ? "--- ЭЛИТНЫЕ КОРПУСА ---" : "--- ELITE HULLS ---"); sY += 40;
        createBtn(sY, "skin_striker", "desc_striker", 1500, 'skin_striker', () => { currentShape = 'striker'; refreshPlayerAppearance(scene); });
        createBtn(sY+step, "ship_tank", "desc_tank", 1200, 'ship_tank', () => { currentShape = 'tank'; refreshPlayerAppearance(scene); });
        createBtn(sY+step*2, "ship_dart", "desc_dart", 1000, 'ship_dart', () => { currentShape = 'dart'; refreshPlayerAppearance(scene); });
        createBtn(sY+step*3, "ship_viper", "desc_viper", 1500, 'ship_viper', () => { currentShape = 'viper'; refreshPlayerAppearance(scene); });
        createBtn(sY+step*4, "ship_phase", "desc_phase", 1800, 'ship_phase', () => { currentShape = 'phase'; refreshPlayerAppearance(scene); });
        
        sY += step*5 + 20;
        addHeader(sY, lang === 'ru' ? "--- ЯДРО И ВАЛЮТА ---" : "--- CORE & CURRENCY ---"); sY += 40;
        createBtn(sY, "up_omega", "desc_omega", 100, 'omega', () => { upgradeLevels.omega = 1; });
        createBtn(sY+step, "up_coins", "desc_coins", 50, 'buy_coins');
        maxScroll = sY + step * 2;
    } else if (currentShopTab === 'fx') {
        addHeader(sY, lang === 'ru' ? "--- СКИНЫ ПИЛОТА ---" : "--- PILOT SKINS ---"); sY += 40;
        createBtn(sY, "skin_gold", "desc_gold", 49, 'skin_gold', () => { currentSkin = 'gold'; refreshPlayerAppearance(scene); }); 
        createBtn(sY+step, "skin_ghost", "desc_ghost", 49, 'skin_ghost', () => { currentSkin = 'ghost'; refreshPlayerAppearance(scene); }); 
        createBtn(sY+step*2, "skin_crimson", "desc_crimson", 75, 'skin_crimson', () => { currentSkin = 'crimson'; refreshPlayerAppearance(scene); }); 
        createBtn(sY+step*3, "skin_void", "desc_void", 75, 'skin_void', () => { currentSkin = 'void_skin'; refreshPlayerAppearance(scene); }); 
        createBtn(sY+step*4, "skin_plasma", "desc_plasma", 75, 'skin_plasma', () => { currentSkin = 'plasma'; refreshPlayerAppearance(scene); }); 
        createBtn(sY+step*5, "skin_solar", "desc_solar", 75, 'skin_solar', () => { currentSkin = 'solar'; refreshPlayerAppearance(scene); }); 
        createBtn(sY+step*6, "skin_frost", "desc_frost", 75, 'skin_frost', () => { currentSkin = 'frost'; refreshPlayerAppearance(scene); }); 
        createBtn(sY+step*7, "skin_rainbow", "desc_rainbow", 99, 'skin_rainbow', () => { currentSkin = 'rainbow'; refreshPlayerAppearance(scene); }); 
        createBtn(sY+step*8, "void_premium", "desc_void_premium", 149, 'skin_void_premium', () => { currentSkin = 'void_premium'; refreshPlayerAppearance(scene); }); 
        createBtn(sY+step*9, "crystal", "desc_crystal", 125, 'skin_crystal', () => { currentSkin = 'crystal'; refreshPlayerAppearance(scene); }); 
        
        sY += step*10 + 20;
        addHeader(sY, lang === 'ru' ? "--- ЭФФЕКТЫ ВЗРЫВА ---" : "--- EXPLOSION FX ---"); sY += 40;
        createBtn(sY, "fx_blue_exp", "desc_blue_exp", 30, 'fx_blue', () => { currentExplosionColor = 0x00ffff; saveProgress(); submitScore(); });
        createBtn(sY+step, "fx_pink_exp", "desc_pink_exp", 30, 'fx_pink', () => { currentExplosionColor = 0xff00ff; saveProgress(); submitScore(); });
        createBtn(sY+step*2, "fx_rainbow_exp", "desc_rainbow_exp", 50, 'fx_rainbow', () => { currentExplosionColor = -1; saveProgress(); submitScore(); });
        createBtn(sY+step*3, "fx_gold_exp", "desc_gold_exp", 50, 'fx_gold', () => { currentExplosionColor = 0xffaa00; saveProgress(); submitScore(); });
        createBtn(sY+step*4, "fx_green_exp", "desc_green_exp", 50, 'fx_green', () => { currentExplosionColor = 0x00ff00; saveProgress(); submitScore(); });
        createBtn(sY+step*5, "fx_red_exp", "desc_red_exp", 50, 'fx_red', () => { currentExplosionColor = 0xff0000; saveProgress(); submitScore(); });
        maxScroll = sY + step * 6;    } else if (currentShopTab === 'bundles') {
        addHeader(sY, lang === 'ru' ? "--- ВЫГОДНЫЕ ПАКЕТЫ ---" : "--- BEST DEALS ---"); sY += 40;
        createBtn(sY, "bundle_starter", "bundle_starter_desc", 49, 'bundle_starter', () => { upgradeLevels.skin_gold = 1; upgradeLevels.up_antenna = 1; upgradeLevels.up_speed = 1; currentSkin = 'gold'; refreshPlayerAppearance(scene); saveProgress(); }); 
        createBtn(sY+step, "bundle_warrior", "bundle_warrior_desc", 99, 'bundle_warrior', () => { upgradeLevels.skin_crimson = 1; upgradeLevels.up_cannons = 1; upgradeLevels.up_hull = 1; currentSkin = 'crimson'; maxPlayerHealth += 25; playerHealth = maxPlayerHealth; refreshPlayerAppearance(scene); saveProgress(); }); 
        createBtn(sY+step*2, "bundle_legend", "bundle_legend_desc", 199, 'bundle_legend', () => { upgradeLevels.skin_rainbow = 1; upgradeLevels.skin_void_premium = 1; upgradeLevels.up_omega = 1; currentSkin = 'rainbow'; refreshPlayerAppearance(scene); saveProgress(); }); 
        maxScroll = sY + step * 3;
    }

    const paddingBottom = 150; 
    maxScroll = Math.max(0, maxScroll - scrollHeight + paddingBottom);
    
    scene.input.on('wheel', (p, obj, dx, dy) => { scrollY = Phaser.Math.Clamp(scrollY - dy * 0.8, -maxScroll, 0); contentContainer.y = scrollY; });
    scene.input.on('pointermove', (p) => { if (p.isDown && p.y > 110 && p.y < scrollAreaBottom) { scrollY = Phaser.Math.Clamp(scrollY + (p.y - p.prevPosition.y), -maxScroll, 0); contentContainer.y = scrollY; } });
    
    const footerY = 625; const btnWidth = 110;
    const backBg = scene.add.rectangle(65, footerY, btnWidth, 45, 0x330033).setInteractive().setStrokeStyle(1, 0xff00ff, 0.5);
    const backTxt = scene.add.text(65, footerY, TRANSLATIONS[lang].back, { fontSize: '11px', fill: '#ff00ff', fontWeight: 'bold', fontFamily: fontUI, align: 'center', wordWrap: { width: 100 } }).setOrigin(0.5);
    
    const adBg = scene.add.rectangle(187, footerY, btnWidth, 45, 0x333300).setInteractive().setStrokeStyle(1, 0xffff00, 0.5);
    const adTxt = scene.add.text(187, footerY, lang === 'ru' ? 'РЕКЛАМА\n+250 💰' : 'WATCH AD\n+250 💰', { fontSize: '11px', fontFamily: fontUI, fill: '#ffff00', fontWeight: 'bold', align: 'center' }).setOrigin(0.5);
    
    const invColor = upgradeLevels.shareClaimed ? 0x222222 : 0x004400;
    const invBg = scene.add.rectangle(310, footerY, btnWidth, 45, invColor).setInteractive().setStrokeStyle(1, 0x00ff88, 0.5);
    const invTxt = scene.add.text(310, footerY, upgradeLevels.shareClaimed ? "✓" : `👥 ${lang === 'ru' ? '+1500' : '+1500'}`, { fontSize: '12px', fontFamily: fontUI, fill: upgradeLevels.shareClaimed ? '#777' : '#00ff88', fontWeight: 'bold' }).setOrigin(0.5);
    
    overlay.add([backBg, backTxt, adBg, adTxt, invBg, invTxt]);
    
    backBg.on('pointerdown', () => { saveProgress(); isVictory = false; isStarted = false; isDead = false; isBossFight = false; scene.input.off('wheel'); overlay.destroy(); if (mainMenu) { mainMenu.setVisible(true); if (typeof startTitleGlitch === 'function') startTitleGlitch(scene, mainMenu.titleRef); } else showMenu(scene); });
    
    adBg.on('pointerdown', () => {
        const currentAds = window.adController;
        if (!currentAds) { console.log("Adsgram missing"); scene.cameras.main.shake(100, 0.01); return; }
        adBg.disableInteractive();
        currentAds.show().then((result) => {
            adBg.setInteractive();
            if (result && result.done) {
                coins += 250;
                saveProgress();
                creds.setText(`${TRANSLATIONS[lang].credits}: ${coins}`);
                scene.cameras.main.flash(200, 255, 255, 0, 0.5);
                safeHaptic('notification', '');
            }
        }).catch(e => {
            adBg.setInteractive();
            console.log("Adsgram error", e);
        });
    });

    invBg.on('pointerdown', () => {
        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        const refId = tgUser ? tgUser.id : 0;
        const refParam = refId ? `?start=ref_${refId}` : "";
        const shareText = encodeURIComponent(TRANSLATIONS[lang].share_invite.replace("%lvl%", level).replace("%dist%", bestDistance));
        const fullLink = `https://t.me/share/url?url=${encodeURIComponent(SHARE_LINK + refParam)}&text=${shareText}`;
        
        if (window.Telegram?.WebApp) {
            Telegram.WebApp.openTelegramLink(fullLink);
            if (!upgradeLevels.shareClaimed) {
                coins += 500; upgradeLevels.shareClaimed = true; saveProgress();
                creds.setText(`${TRANSLATIONS[lang].credits}: ${coins}`);
                invBg.setFillStyle(0x222222); invTxt.setText("✓").setFill("#777");
            }
        } else window.open(fullLink, '_blank');
    });
    if (fromVictory) {
        const nextSector = level; const nextLabel = `${TRANSLATIONS[lang].deploy_btn} ${nextSector}`;
        const nextBg = scene.add.rectangle(187, 545, 250, 50, 0x003333).setInteractive().setStrokeStyle(2, 0x00ffff, 0.95);
        const nextTxt = scene.add.text(187, 545, nextLabel, { fontSize: '18px', fontFamily: fontUI, fill: '#00ffff', fontWeight: 'bold', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5);
        overlay.add([nextBg, nextTxt]);
        scene.tweens.add({ targets: [nextBg, nextTxt], scaleX: 1.06, scaleY: 1.06, alpha: 0.82, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        nextBg.on('pointerdown', async () => { nextBg.disableInteractive(); nextTxt.setText(lang === 'ru' ? 'ЗАПУСК...' : 'LAUNCHING...'); console.log(`[Shop] Launching next sector: ${level}`); try { if (hasTelegramUser()) await submitScore(); scene.input.off('wheel'); overlay.destroy(); isShopOpen = false; isVictory = false; isDead = false; isBossFight = false; isPhase2 = false; isPhase3 = false; shouldAutoStart = true; saveProgress(); scene.scene.restart(); } catch (e) { console.error('❌ Error during next sector launch:', e); scene.scene.restart(); } });
    }
}

function showProfile(scene, mainMenu) {
    const overlay = scene.add.container(0, 0).setDepth(4000);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.98).fillRect(0, 0, 375, 667); overlay.add(bg);
    const fontUI = '"Orbitron", sans-serif';
    overlay.add(scene.add.text(187, 60, lang === 'ru' ? "ДОСЬЕ ПИЛОТА" : "PILOT DOSSIER", { fontSize: '24px', fontFamily: fontUI, fill: '#00ffff', fontWeight: 'bold' }).setOrigin(0.5));
    const scrollWindowHeight = 350; const scrollContainer = scene.add.container(0, 170); overlay.add(scrollContainer);
    const maskShape = scene.make.graphics(); maskShape.fillStyle(0xffffff, 1).fillRect(0, 170, 375, scrollWindowHeight); scrollContainer.setMask(maskShape.createGeometryMask());
    let currentY = 20;
    const previewGlow = scene.add.circle(187, currentY + 40, 34, 0x00ffff, 0.14);
    const preview = scene.add.sprite(187, currentY + 40, player.texture.key).setScale(3);
    scene.tweens.add({ targets: preview, y: currentY + 34, angle: 4, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scene.tweens.add({ targets: previewGlow, alpha: { from: 0.08, to: 0.22 }, scaleX: 1.08, scaleY: 1.08, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scrollContainer.add([previewGlow, preview]); currentY += 120;
    let statusText = (level > 40) ? (lang === 'ru' ? "МАСТЕР ГЛИТЧА" : "GLITCH MASTER") : (level > 20) ? (lang === 'ru' ? "ЭЛИТНЫЙ ПИЛОТ" : "ELITE PILOT") : (lang === 'ru' ? "НОВИЧОК" : "ROOKIE");
    scrollContainer.add(scene.add.text(187, currentY, statusText, { fontSize: '18px', fill: level > 40 ? "#ff00ff" : "#00ffff", fontWeight: 'bold' }).setOrigin(0.5)); currentY += 50;
    const statsBox = scene.add.rectangle(187, currentY + 60, 320, 140, 0x111111).setStrokeStyle(1, 0x00ffff, 0.2); scrollContainer.add(statsBox);
    const statsData = [`${lang === 'ru' ? 'ТЕКУЩИЙ СЕКТОР' : 'CURRENT SECTOR'}: ${level}`, `${lang === 'ru' ? 'РЕКОРД ДИСТАНЦИИ' : 'MAX DISTANCE'}: ${bestDistance}m`, `${lang === 'ru' ? 'ВСЕГО ПРОЙДЕНО' : 'TOTAL FLOWN'}: ${Math.floor(totalDistance)}m`, `${lang === 'ru' ? 'УНИЧТОЖЕНО ЯДЕР' : 'CORES DELETED'}: ${bossesKilled}`, `${lang === 'ru' ? 'КРЕДИТЫ' : 'CREDITS'}: ${coins}`];
    statsData.forEach((t, i) => { scrollContainer.add(scene.add.text(50, currentY + 12 + (i * 24), t, { fontSize: '13px', fontFamily: fontUI, fill: '#aaa' })); }); currentY += 170;
    const achHeader = scene.add.text(187, currentY, lang === 'ru' ? "--- ДОСТИЖЕНИЯ ---" : "--- ACHIEVEMENTS ---", { fontSize: '14px', fontFamily: fontUI, fill: '#ff00ff' }).setOrigin(0.5); scrollContainer.add(achHeader); currentY += 35;
    const achList = [
        { key: 'flawless', ru: "БЕЗУПРЕЧНЫЙ", en: "FLAWLESS", desc: TRANSLATIONS[lang].boss_damage },
        { key: 'rich', ru: "МАГНАТ", en: "TYCOON", desc: TRANSLATIONS[lang].rich_credit },
        { key: 'marathon', ru: "МАРАФОНЕЦ", en: "MARATHON", desc: TRANSLATIONS[lang].run_m },
        { key: 'speedster', ru: "СПРИНТЕР", en: "SPEEDSTER", desc: TRANSLATIONS[lang].speed_desc },
        { key: 'collector', ru: "КОЛЛЕКЦИОНЕР", en: "COLLECTOR", desc: TRANSLATIONS[lang].collect_desc },
        { key: 'survivor10', ru: "ВЫЖИВШИЙ", en: "SURVIVOR", desc: TRANSLATIONS[lang].surv10_desc },
        { key: 'bossSlayer', ru: "УБИЙЦА БОССОВ", en: "SLAYER", desc: TRANSLATIONS[lang].boss_desc }
    ];
    achList.forEach((ach, i) => { const isDone = achievements[ach.key]; let box = scene.add.rectangle(55, currentY + 18, 28, 28, isDone ? 0xaa8800 : 0x222222).setStrokeStyle(2, isDone ? 0xffff00 : 0x444444); let t1 = scene.add.text(90, currentY + 6, lang === 'ru' ? ach.ru : ach.en, { fontSize: '13px', fontFamily: fontUI, fill: isDone ? '#ffff00' : '#777', fontWeight: 'bold' }); let t2 = scene.add.text(90, currentY + 24, ach.desc, { fontSize: '11px', fontFamily: fontUI, fill: isDone ? '#bbb' : '#888' }); scrollContainer.add([box, t1, t2]); currentY += 42; });
    const maxScroll = Math.max(0, currentY - scrollWindowHeight + 40); let scrollY = 0;
    const applyScroll = () => { scrollY = Phaser.Math.Clamp(scrollY, -maxScroll, 0); scrollContainer.y = 170 + scrollY; };
    scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => { scrollY -= deltaY * 0.8; applyScroll(); });
    scene.input.on('pointermove', (p) => { if (p.isDown) { scrollY += (p.y - p.prevPosition.y); applyScroll(); } });
    const nameBox = scene.add.rectangle(187, 130, 240, 65, 0x00ffff, 0.1).setStrokeStyle(1, 0x00ffff, 0.5).setInteractive({ useHandCursor: true });
    const callsignLabel = scene.add.text(187, 105, TRANSLATIONS[lang].callsign_label, { fontSize: '10px', fontFamily: fontUI, fill: '#00ffff', alpha: 0.7 }).setOrigin(0.5);
    const callsignText = scene.add.text(187, 125, shipName, { fontSize: '20px', fontFamily: fontUI, fill: '#ffff00', fontWeight: 'bold' }).setOrigin(0.5);
    const editHint = scene.add.text(187, 145, TRANSLATIONS[lang].tap_edit, { fontSize: '9px', fontFamily: fontUI, fill: '#00ffff' }).setOrigin(0.5);
    nameBox.on('pointerdown', () => { const promptText = lang === 'ru' ? "Введите позывной корабля:" : "Enter ship callsign:"; let newName = window.prompt(promptText, shipName); if (newName !== null) { newName = newName.trim().substring(0, 10).toUpperCase(); if (newName.length > 0) { shipName = newName; callsignText.setText(shipName); saveProgress(); submitScore().catch(e => console.error('Sync error:', e)); } } });
    overlay.add([nameBox, callsignLabel, callsignText, editHint]);
    const backBtn = scene.add.rectangle(187, 620, 170, 45, 0x330033).setInteractive().setStrokeStyle(1, 0xff00ff, 0.5);
    const backLabel = scene.add.text(187, 620, TRANSLATIONS[lang].back, { fontSize: '15px', fontFamily: fontUI, fill: '#ff00ff', fontWeight: 'bold' }).setOrigin(0.5);
    backBtn.on('pointerdown', () => { scene.input.off('wheel'); overlay.destroy(); mainMenu.setVisible(true); startTitleGlitch(scene, mainMenu.titleRef); });
    overlay.add([backBtn, backLabel]);
}

async function showLeaderboard(scene, mainMenu) {
    const overlay = scene.add.container(0, 0).setDepth(4000);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.98).fillRect(0, 0, 375, 667); overlay.add(bg);
    const fontUI = '"Orbitron", sans-serif';
    const title = scene.add.text(187, 45, TRANSLATIONS[lang].top, { fontSize: '24px', fill: '#ffff00', fontWeight: 'bold', fontFamily: fontUI }).setOrigin(0.5); overlay.add(title);
    const backBtn = scene.add.rectangle(187, 615, 200, 45, 0x330033).setInteractive().setStrokeStyle(1, 0xff00ff, 0.5);
    const backLabel = scene.add.text(187, 615, TRANSLATIONS[lang].back, { fontSize: '15px', fontFamily: fontUI, fill: '#ff00ff', fontWeight: 'bold' }).setOrigin(0.5);
    overlay.add(backBtn); overlay.add(backLabel);
    backBtn.on('pointerdown', () => { overlay.destroy(); mainMenu.setVisible(true); if (typeof startTitleGlitch === 'function') startTitleGlitch(scene, mainMenu.titleRef); });
    const loadingText = scene.add.text(187, 320, TRANSLATIONS[lang].db_connecting, { fontSize: '16px', fill: '#00ffff', fontWeight: 'bold', fontFamily: fontUI, align: 'center' }).setOrigin(0.5); overlay.add(loadingText);
    const listContainer = scene.add.container(0, 0); overlay.add(listContainer);
    const maskShape = scene.make.graphics({ add: false }); maskShape.fillRect(0, 100, 375, 450); listContainer.setMask(maskShape.createGeometryMask());
    try {
        const response = await fetch(`${botUrl}/get_leaderboard`); const data = await response.json(); loadingText.destroy();
        if (!Array.isArray(data) || data.length === 0) { overlay.add(scene.add.text(187, 320, TRANSLATIONS[lang].db_empty, { fontSize: '16px', fill: '#888888', fontFamily: fontUI }).setOrigin(0.5)); return; }
        data.sort((a, b) => (b.level - a.level) || (b.score - a.score));
        const myId = getTelegramUser()?.id || 'GUEST'; const myFirstName = getTelegramUser()?.first_name || (lang === 'ru' ? 'ПИЛОТ' : 'PILOT');
        data.forEach((entry, i) => {
            const y = 125 + i * 45; const centerY = y + 8; let color = '#ffffff'; let medal = `${i + 1}`;
            if (i === 0) { color = '#FFD700'; medal = '🥇'; } else if (i === 1) { color = '#C0C0C0'; medal = '🥈'; } else if (i === 2) { color = '#CD7F32'; medal = '🥉'; }
            const isMe = entry.telegram_id == myId; if (isMe) { listContainer.add(scene.add.rectangle(187, centerY, 350, 38, 0x00ffff, 0.15).setOrigin(0.5)); if (i >= 3) color = '#00ffff'; }
            const rankTxt = scene.add.text(15, y, medal, { fontSize: '13px', fontFamily: fontUI, fill: color, fontWeight: 'bold' });
            const skinInfo = SKINDATA[entry.skin] || SKINDATA.classic; let shipIcon = entry.shape === 'striker' ? scene.add.triangle(55, centerY, 0, 12, 6, 0, 12, 12, skinInfo.body).setOrigin(0.5) : scene.add.rectangle(55, centerY, 10, 10, skinInfo.body).setOrigin(0.5);
            if (entry.skin === 'ghost' && shipIcon.setAlpha) shipIcon.setAlpha(0.5);
            const isCustom = entry.ship_name && entry.ship_name !== 'RAZOR-01'; const displayName = (isCustom ? entry.ship_name : (entry.username || 'PILOT')).toUpperCase().substring(0, 10);
            const nameTxt = scene.add.text(75, y, displayName, { fontSize: '13px', fontFamily: fontUI, fill: isCustom ? '#ffff00' : color, fontWeight: isCustom ? 'bold' : 'normal' });
            const dateStr = entry.score_date ? new Date(entry.score_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '--.--.--';
            const dateTxt = scene.add.text(195, y + 2, dateStr, { fontSize: '9px', fontFamily: fontUI, fill: color, alpha: 0.5 });
            const sectorTxt = scene.add.text(285, y, `S${entry.level || 0}`, { fontSize: '11px', fontFamily: fontUI, fill: color }).setOrigin(1, 0);
            const scoreTxt = scene.add.text(360, y, `${entry.score || 0}m`, { fontSize: '12px', fontFamily: fontUI, fill: color, fontWeight: 'bold' }).setOrigin(1, 0);
            listContainer.add([rankTxt, shipIcon, nameTxt, dateTxt, sectorTxt, scoreTxt]);
        });
        const amIInTop = data.some(e => e.telegram_id == myId);
        if (!amIInTop && getTelegramUser()?.id) {
            const initData = window.Telegram?.WebApp?.initData || '';
            const myRes = await fetch(`${botUrl}/get_user_personal/${myId}`, { headers: { 'X-Telegram-Init-Data': initData } }); const myP = await myRes.json();
            if (myP && !myP.error) {
                const yDots = 125 + data.length * 45; listContainer.add(scene.add.text(187, yDots, '. . .', { fontSize: '20px', fontFamily: fontUI, fill: '#555' }).setOrigin(0.5));
                const yMe = yDots + 40; const centerY = yMe + 8; listContainer.add(scene.add.rectangle(187, centerY, 350, 38, 0x00ffff, 0.2).setOrigin(0.5));
                const myRank = myP.rank ? `#${myP.rank}` : '-'; const myLvl = myP.level ?? level; const myScore = myP.score ?? bestDistance;
                let myDisp = myFirstName.toUpperCase(); if (myDisp.length > 9) myDisp = myDisp.substring(0, 8) + '…';
                listContainer.add([scene.add.text(15, yMe, myRank, { fontSize: '13px', fontFamily: fontUI, fill: '#00ffff', fontWeight: 'bold' }), scene.add.text(75, yMe, myDisp, { fontSize: '13px', fontFamily: fontUI, fill: '#00ffff' }), scene.add.text(285, yMe, `S${myLvl}`, { fontSize: '11px', fontFamily: fontUI, fill: '#00ffff' }).setOrigin(1, 0), scene.add.text(360, yMe, `${myScore}m`, { fontSize: '12px', fontFamily: fontUI, fill: '#00ffff', fontWeight: 'bold' }).setOrigin(1, 0)]);
            }
        }
        const listHeight = Math.max(0, (data.length + 3) * 45); const maxY = Math.max(0, listHeight - 420);
        const onLeaderboardWheel = (p, o, dx, dy) => { listContainer.y = Phaser.Math.Clamp(listContainer.y - dy, -maxY, 0); };
        const onLeaderboardMove = (p) => { if (p.isDown) listContainer.y = Phaser.Math.Clamp(listContainer.y + p.y - p.prevPosition.y, -maxY, 0); };
        scene.input.on('wheel', onLeaderboardWheel); scene.input.on('pointermove', onLeaderboardMove);
        backBtn.on('pointerdown', () => { scene.input.off('wheel', onLeaderboardWheel); scene.input.off('pointermove', onLeaderboardMove); overlay.destroy(); mainMenu.setVisible(true); if (typeof startTitleGlitch === 'function') startTitleGlitch(scene, mainMenu.titleRef); });
    } catch (e) { console.error(e); loadingText.setText(TRANSLATIONS[lang].db_error).setFill('#ff0000'); }
}

function showHangar(scene, mainMenu) {
    const overlay = scene.add.container(0, 0).setDepth(4000);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.98).fillRect(0, 0, 375, 667); overlay.add(bg);
    const fontUI = '"Orbitron", sans-serif';
    const scrollAreaTop = 90; const scrollAreaBottom = 590; const scrollHeight = scrollAreaBottom - scrollAreaTop;
    const scrollWindow = scene.add.container(0, 0).setDepth(4001); overlay.add(scrollWindow);
    const contentContainer = scene.add.container(0, 0); scrollWindow.add(contentContainer);
    const mask = scene.make.graphics().fillRect(0, scrollAreaTop, 375, scrollHeight).createGeometryMask(); scrollWindow.setMask(mask);
    const title = scene.add.text(187, 30, TRANSLATIONS[lang].hangar_title, { fontSize: '22px', fill: '#00ffff', fontWeight: 'bold', fontFamily: fontUI }).setOrigin(0.5); overlay.add(title);
    const stats = getShipStats(); const statsBox = createSciFiPanel(scene, 187, 58, 330, 24, PALETTE.panel, 0.8).setStrokeStyle(1, PALETTE.yellow); const statsText = scene.add.text(187, 58, stats.label, { fontSize: '10px', fill: STR_PALETTE.yellow, fontWeight: 'bold', fontFamily: fontUI }).setOrigin(0.5); overlay.add([statsBox, statsText]);
    
    // 3D Showcase
    const showcaseBg = createSciFiPanel(scene, 285, 190, 150, 150, 0x050a10, 0.95, 20).setStrokeStyle(2, PALETTE.cyan, 0.4);
    const platform = scene.add.ellipse(285, 245, 110, 30, PALETTE.cyan, 0.15).setStrokeStyle(1, PALETTE.cyan, 0.4);
    const gridLines = scene.add.graphics();
    gridLines.lineStyle(1, PALETTE.cyan, 0.3);
    for(let i=-40; i<=40; i+=20) { gridLines.lineBetween(285+i, 235, 285+i*1.5, 255); }
    gridLines.lineBetween(240, 245, 330, 245);
    const glow = scene.add.circle(285, 190, 50, PALETTE.cyan, 0.15);
    const previewSprite = scene.add.sprite(285, 180, player.texture.key).setScale(3.5).setDepth(4010);
    glow.setDepth(4009);
    scene.tweens.add({ targets: previewSprite, y: 170, angle: 5, duration: 1450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scene.tweens.add({ targets: glow, alpha: { from: 0.08, to: 0.25 }, scaleX: 1.15, scaleY: 1.15, duration: 1050, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    overlay.add([showcaseBg, platform, gridLines, glow, previewSprite]);
    let currentY = 0;
    const leftX = 15;
    contentContainer.add(scene.add.text(leftX, scrollAreaTop + currentY, TRANSLATIONS[lang].hull_type, { fontSize: '13px', fill: '#ff00ff', fontWeight: 'bold', fontFamily: fontUI })); currentY += 28;
    const shapes = [
        { id: 'classic', name: TRANSLATIONS[lang].classic_box, unlocked: true },
        { id: 'striker', name: TRANSLATIONS[lang].skin_striker, unlocked: upgradeLevels.skin_striker > 0 },
        { id: 'tank', name: TRANSLATIONS[lang].ship_tank, unlocked: upgradeLevels.ship_tank > 0 },
        { id: 'dart', name: TRANSLATIONS[lang].ship_dart, unlocked: upgradeLevels.ship_dart > 0 },
        { id: 'viper', name: TRANSLATIONS[lang].ship_viper, unlocked: upgradeLevels.ship_viper > 0 },
        { id: 'phase', name: TRANSLATIONS[lang].ship_phase, unlocked: upgradeLevels.ship_phase > 0 }
    ];
    shapes.forEach((s) => { if (!s.unlocked) return; const isSelected = currentShape === s.id; const btn = scene.add.text(leftX + 5, scrollAreaTop + currentY, `> ${s.name}`, { fontSize: '13px', fill: isSelected ? '#00ffff' : '#888', backgroundColor: isSelected ? '#003333' : null, padding: 3, fontFamily: fontUI }).setInteractive().on('pointerdown', () => { currentShape = s.id; saveProgress(); refreshPlayerAppearance(scene); overlay.destroy(); showHangar(scene, mainMenu); }); contentContainer.add(btn); currentY += 26; });
    currentY += 12;
    contentContainer.add(scene.add.text(leftX, scrollAreaTop + currentY, TRANSLATIONS[lang].visual_skin, { fontSize: '13px', fill: '#ff00ff', fontWeight: 'bold', fontFamily: fontUI })); currentY += 28;
    const skins = [
        { id: 'classic', name: TRANSLATIONS[lang].cyan_neon, unlocked: true },
        { id: 'gold', name: TRANSLATIONS[lang].skin_gold, unlocked: upgradeLevels.skin_gold > 0 },
        { id: 'ghost', name: TRANSLATIONS[lang].skin_ghost, unlocked: upgradeLevels.skin_ghost > 0 },
        { id: 'crimson', name: TRANSLATIONS[lang].skin_crimson, unlocked: upgradeLevels.skin_crimson > 0 },
        { id: 'void_skin', name: TRANSLATIONS[lang].skin_void, unlocked: upgradeLevels.skin_void > 0 },
        { id: 'plasma', name: TRANSLATIONS[lang].skin_plasma, unlocked: upgradeLevels.skin_plasma > 0 },
        { id: 'solar', name: TRANSLATIONS[lang].skin_solar, unlocked: upgradeLevels.skin_solar > 0 },
        { id: 'frost', name: TRANSLATIONS[lang].skin_frost, unlocked: upgradeLevels.skin_frost > 0 },
        { id: 'rainbow', name: TRANSLATIONS[lang].skin_rainbow, unlocked: upgradeLevels.skin_rainbow > 0 },
        { id: 'elite', name: TRANSLATIONS[lang].skin_elite, unlocked: upgradeLevels.skin_elite > 0 },
        { id: 'void_premium', name: TRANSLATIONS[lang].void_premium, unlocked: upgradeLevels.skin_void_premium > 0 },
        { id: 'crystal', name: TRANSLATIONS[lang].crystal, unlocked: upgradeLevels.skin_crystal > 0 }
    ];
    skins.forEach((sk) => { if (!sk.unlocked) return; const isSelected = currentSkin === sk.id; const btn = scene.add.text(leftX + 5, scrollAreaTop + currentY, `> ${sk.name}`, { fontSize: '12px', fill: isSelected ? '#00ffff' : '#888', backgroundColor: isSelected ? '#003333' : null, padding: 3, fontFamily: fontUI }).setInteractive().on('pointerdown', () => { currentSkin = sk.id; saveProgress(); refreshPlayerAppearance(scene); overlay.destroy(); showHangar(scene, mainMenu); }); contentContainer.add(btn); currentY += 26; });
    
    // ГАРАНТИРУЕМ, ЧТО БЛОК РАЗВЕДКИ НЕ ПОДНИМЕТСЯ ВЫШЕ ОПРЕДЕЛЕННОЙ ТОЧКИ (чтобы не налезть на корабль)
    currentY = Math.max(currentY, 280); 
    
    currentY += 15;
    const intel = getBossIntel();
    const intelBox = scene.add.rectangle(187, scrollAreaTop + currentY + 55, 340, 105, 0x000000, 0.7).setStrokeStyle(1, 0xff00ff);
    const intelTitle = scene.add.text(leftX, scrollAreaTop + currentY + 8, `${TRANSLATIONS[lang].boss_scanning}${level}`, { fontSize: '11px', fill: '#ff00ff', fontFamily: fontUI });
    const bossName = scene.add.text(187, scrollAreaTop + currentY + 32, `${TRANSLATIONS[lang].target}: ${intel.name}`, { fontSize: '14px', fill: '#fff', fontWeight: 'bold', fontFamily: fontUI }).setOrigin(0.5);
    const bossDesc = scene.add.text(187, scrollAreaTop + currentY + 52, intel.desc, { fontSize: '11px', fill: '#aaa', align: 'center', wordWrap: { width: 310 }, fontFamily: fontUI }).setOrigin(0.5);
    const bossTip = scene.add.text(187, scrollAreaTop + currentY + 75, `${TRANSLATIONS[lang].suggest}: ${intel.tip}`, { fontSize: '12px', fill: '#00ff00', fontWeight: 'bold', fontFamily: fontUI }).setOrigin(0.5);
    contentContainer.add([intelBox, intelTitle, bossName, bossDesc, bossTip]);
    const contentHeight = scrollAreaTop + currentY + 120;
    let maxScroll = Math.max(0, contentHeight - scrollAreaBottom + 50); let scrollY = 0;
    const applyScroll = () => { scrollY = Phaser.Math.Clamp(scrollY, -maxScroll, 0); contentContainer.y = scrollY; };
    scene.input.on('wheel', (p, o, dx, dy) => { scrollY -= dy * 0.8; applyScroll(); });
    scene.input.on('pointermove', (p) => { if (p.isDown && p.y > scrollAreaTop && p.y < scrollAreaBottom) { scrollY += (p.y - p.prevPosition.y); applyScroll(); } });
    const backBtn = scene.add.rectangle(187, 635, 200, 40, 0x330033).setInteractive().setStrokeStyle(1, 0xff00ff, 0.5);
    const backLabel = scene.add.text(187, 635, TRANSLATIONS[lang].back, { fontSize: '15px', fill: '#ff00ff', fontWeight: 'bold' }).setOrigin(0.5);
    backBtn.on('pointerdown', () => { scene.input.off('wheel'); overlay.destroy(); mainMenu.setVisible(true); startTitleGlitch(scene, mainMenu.titleRef); });
    overlay.add([backBtn, backLabel]);
}

function getShipStats() {
    let stats = { atk: 1, spd: 1, hpBonus: 0, label: "" };
    const isRu = (lang === 'ru');
    if (currentShape === 'striker') { stats.atk += 0.2; stats.label = `${TRANSLATIONS[lang].skin_striker}: +20% ${isRu ? 'АТК' : 'ATK'}`; }
    else if (currentShape === 'tank') { stats.hpBonus = 35; stats.spd -= 0.08; stats.label = isRu ? "БРОНЕНОСЕЦ: +35 ОЗ, -8% СКР" : "IRONCLAD: +35 HP, -8% SPD"; }
    else if (currentShape === 'dart') { stats.spd += 0.20; stats.atk -= 0.10; stats.label = isRu ? "СТРЕЛА: +20% СКР, -10% АТК" : "SWIFT: +20% SPD, -10% ATK"; }
    else if (currentShape === 'viper') { stats.label = isRu ? "ГАДЮКА: БОКОВЫЕ ВЫСТРЕЛЫ" : "SIDESTRIKE: SIDE SHOTS"; }
    else if (currentShape === 'phase') { stats.label = isRu ? "ФАЗОВИК: 10% УКЛОНЕНИЕ" : "PHASE: 10% DODGE"; }
    else stats.label = isRu ? "БАЗОВЫЙ КОРПУС" : "STANDARD HULL";
    if (currentSkin === 'gold') { stats.atk += 0.1; stats.label += isRu ? " | ЗОЛОТО: +10% АТК" : " | GOLD: +10% ATK"; } else if (currentSkin === 'ghost') { stats.spd += 0.15; stats.label += isRu ? " | ПРИЗРАК: +15% СКОР" : " | GHOST: +15% SPD"; }
    else if (currentSkin === 'crimson') { stats.label += isRu ? " | КРАСНЫЙ: +5% КРИТ" : " | CRIMSON: +5% CRIT"; }
    else if (currentSkin === 'void_skin') { stats.label += isRu ? " | ПУСТОТА: +3% УКЛ." : " | VOID: +3% DODGE"; }
    else if (currentSkin === 'plasma') { stats.label += isRu ? " | ПЛАЗМА: +5% ЗАР." : " | PLASMA: +5% CHARGE"; }
    else if (currentSkin === 'solar') { stats.label += isRu ? " | СОЛНЕЧНЫЙ: +10% МОН." : " | SOLAR: +10% COINS"; }
    else if (currentSkin === 'frost') { stats.label += isRu ? " | МОРОЗ: +1С ЗАМЕД." : " | FROST: +1S SLOW"; }
    return stats;
}

function getBossIntel() {
    const isRu = (lang === 'ru');
    if (level < 15) return { name: isRu ? "ДРОН-РАЗВЕДЧИК" : "SCOUT_DRONE", desc: isRu ? "Легкая броня. Стандартные паттерны стрельбы." : "Light armor. Standard patterns.", tip: isRu ? "ЗОЛОТО (для фарма)" : "GOLD (for farming)" };
    else if (level < 20) return { name: isRu ? "МЕГА-ТУРЕЛЬ" : "MEGA_TURRET", desc: isRu ? "Боковые пушки. Высокая скорострельность." : "Dual side cannons. High fire rate.", tip: `${TRANSLATIONS[lang].skin_striker} (+20% ${isRu ? 'АТК' : 'ATK'})` };
    else if (level < 30) return { name: isRu ? "МАСТЕР ЩИТА" : "SHIELD_MASTER", desc: isRu ? "Орбитальная защита. Сложно попасть." : "Orbital protection. Hard to hit.", tip: `${TRANSLATIONS[lang].skin_striker} (${isRu ? 'Пробивай щиты' : 'Break shields'})` };
    else if (level < 35) return { name: isRu ? "ПЕРЕГРУЗКА ЯДРА" : "CORE_OVERLOAD", desc: isRu ? "Режим ярости. Пулевой ад." : "Rage mode. Bullet hell chaos.", tip: isRu ? "МАНЕВРИРУЙ (Выживи любой ценой)" : "MANEUVER (Survive at all costs)" };
    else if (level < 40) return { name: isRu ? "КВАНТОВЫЙ ФАНТОМ" : "QUANTUM_PHANTOM", desc: isRu ? "Мгновенное перемещение. Нестабильная материя." : "Instant teleportation. Unstable matter.", tip: `${TRANSLATIONS[lang].up_antenna} (${isRu ? 'Бей быстро' : 'Strike fast'})` };
    else if (level < 50) return { name: isRu ? "СТЕНА" : "THE WALL", desc: isRu ? "Делит экран на 3 зоны. Одна безопасна." : "Divides screen into 3 zones. One is safe.", tip: `${TRANSLATIONS[lang].ship_dart} (+20% ${isRu ? 'СКР' : 'SPD'})` };
    else if (level < 60) return { name: isRu ? "ДВА ЯДРА" : "DUAL CORE", desc: isRu ? "Два ядра вращаются вокруг центра." : "Two cores rotate around center.", tip: `${TRANSLATIONS[lang].ship_phase} (${isRu ? 'уклонение' : 'dodge'})` };
    else if (level < 70) return { name: isRu ? "ШТОРМ" : "THE STORM", desc: isRu ? "Вращающиеся смертельные зоны." : "Rotating deadly zones.", tip: `${TRANSLATIONS[lang].ship_dart} (${isRu ? 'скорость' : 'speed'})` };
    else return { name: isRu ? "ПУСТОТА" : "THE VOID", desc: isRu ? "Поглощай пули - стань сильнее! Слишком много - умрёшь!" : "Absorb bullets - grow stronger! Too many - you die!", tip: `${TRANSLATIONS[lang].ship_tank} (HP)` };
}

const RANKS = [
    { id: 'rookie', xp: 0, color: '#888888', name: { en: 'ROOKIE', ru: 'НОВИЧОК' } },
    { id: 'pilot', xp: 1000, color: '#00ff00', name: { en: 'PILOT', ru: 'ПИЛОТ' } },
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
    return { rank: newRank, leveled: oldRank.id !== newRank.id };
}

function getRankProgress() {
    const current = getCurrentRank();
    const currentIndex = RANKS.findIndex(r => r.id === current.id);
    if (currentIndex >= RANKS.length - 1) return { progress: 1, next: null };
    const nextRank = RANKS[currentIndex + 1];
    const xpInRank = rankXP - current.xp;
    const xpNeeded = nextRank.xp - current.xp;
    return { progress: xpInRank / xpNeeded, next: nextRank };
}

function awardRankXP(scene, amount, source = 'kill') {
    const oldRank = getCurrentRank();
    rankXP += amount;
    const newRank = getCurrentRank();
    saveProgress();
    if (oldRank.id !== newRank.id) {
        showRankUp(scene, newRank);
    }
}

function showRankUp(scene, newRank) {
    const rankBg = scene.add.text(187, 100, '', { fontSize: '16px', fill: newRank.color, backgroundColor: '#000000aa', padding: { x: 12, y: 8 }, fontFamily: '"Orbitron", sans-serif' }).setOrigin(0.5).setDepth(500);
    rankBg.setText(`⭐ ${TRANSLATIONS[lang].rank_up || 'RANK UP!'} ${newRank.name[lang]} ⭐`);
    scene.tweens.add({ targets: rankBg, y: 70, alpha: 0, delay: 2500, duration: 500, onComplete: () => rankBg.destroy() });
    scene.cameras.main.shake(150, 0.008);
    safeHaptic('notification', '');
}

function refreshPlayerAppearance(scene) {
    scene.cameras.main.flash(200, 255, 255, 255, 0.3); if (!player) return;
    const newTexName = generatePlayerTexture(scene); player.setTexture(newTexName);
    const skin = SKIN_DATA[currentSkin] || SKIN_DATA.classic; if (trailEmitter) trailEmitter.setParticleTint(skin.trail);
    currentStats = getShipStats();
    const oldMaxHp = maxPlayerHealth;
    let healthBonus = upgradeLevels.health || 0;
    if (upgradeLevels.up_enhanced > 0 && level >= 50) healthBonus *= 2;
    maxPlayerHealth = 100 + healthBonus * 25 + currentStats.hpBonus;
    playerHealth = playerHealth + (maxPlayerHealth - oldMaxHp);
    if (playerHealth > maxPlayerHealth) playerHealth = maxPlayerHealth;
}

