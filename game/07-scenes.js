// ============================================
// 07-SCENES.JS — Магазин, профиль, ангар, лидерборд
// ============================================
// За что отвечает:
// - showShop, showProfile, showLeaderboard
// - showHangar, getShipStats, getBossIntel, refreshPlayerAppearance
// ============================================

function showShop(scene, mainMenu, fromVictory = false) {
    saveProgress(); isShopOpen = true;
    clearBattleTexts(scene); cleanupScreenFx(scene);
    if (distanceText) distanceText.setVisible(false); if (pHealthLabel) pHealthLabel.setVisible(false); if (bHealthLabel) bHealthLabel.setVisible(false); if (overdriveBar) overdriveBar.setVisible(false); if (roadBar) roadBar.setVisible(false);
    const overlay = scene.add.container(0, 0).setDepth(4000);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.98).fillRect(0, 0, 375, 667); overlay.add(bg);
    const fontUI = 'Arial, sans-serif';
    const creds = scene.add.text(187, 25, `${TRANSLATIONS[lang].credits}: ${coins}`, { fill: '#ffff00', fontSize: '20px', fontWeight: 'bold', fontFamily: fontUI }).setOrigin(0.5);
    const stats = scene.add.text(187, 45, `${TRANSLATIONS[lang].best}: S${bestLevel} | ${bestDistance}m`, { fill: '#00ff00', fontSize: '11px', fontWeight: 'bold', fontFamily: fontUI }).setOrigin(0.5);
    overlay.add([creds, stats]);
    const upBtn = scene.add.rectangle(100, 85, 165, 35, currentShopTab === 'upgrades' ? 0x00ffff : 0x222222).setInteractive().setStrokeStyle(1, 0x00ffff, 0.5).setDepth(4010);
    const upText = scene.add.text(100, 85, lang === 'ru' ? "ПРОКАЧКА" : "UPGRADES", { fontSize: '14px', fontFamily: fontUI, fill: currentShopTab === 'upgrades' ? '#000' : '#fff', fontWeight: 'bold' }).setOrigin(0.5).setDepth(4011);
    const fxBtn = scene.add.rectangle(275, 85, 165, 35, currentShopTab === 'fx' ? 0xff00ff : 0x222222).setInteractive().setStrokeStyle(1, 0xff00ff, 0.5).setDepth(4010);
    const fxText = scene.add.text(275, 85, lang === 'ru' ? "КРАСОТА" : "FX / SKINS", { fontSize: '14px', fontFamily: fontUI, fill: currentShopTab === 'fx' ? '#000' : '#fff', fontWeight: 'bold' }).setOrigin(0.5).setDepth(4011);
    overlay.add([upBtn, upText, fxBtn, fxText]);
    upBtn.on('pointerdown', () => { currentShopTab = 'upgrades'; overlay.destroy(); showShop(scene, mainMenu, fromVictory); });
    fxBtn.on('pointerdown', () => { currentShopTab = 'fx'; overlay.destroy(); showShop(scene, mainMenu, fromVictory); });
    const scrollAreaTop = 110; const scrollAreaBottom = isVictory ? 510 : 560; const scrollHeight = scrollAreaBottom - scrollAreaTop;
    const scrollWindow = scene.add.container(0, scrollAreaTop).setDepth(4001); overlay.add(scrollWindow);
    const contentContainer = scene.add.container(0, 0); scrollWindow.add(contentContainer);
    const mask = scene.make.graphics().fillRect(10, scrollAreaTop, 355, scrollHeight).createGeometryMask(); scrollWindow.setMask(mask);
    let scrollY = 0, maxScroll = 0;
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
    const createBtn = (y, nameKey, descKey, cost, type, action) => {
        const isCustom = ['skin_striker', 'skin_gold', 'skin_ghost', 'fx_blue', 'fx_pink'].includes(type);
        const maxLvl = (type === 'health') ? 20 : 1;
        let curLvl = (type === 'shield') ? (isShieldActive ? 1 : 0) : (upgradeLevels[type] || 0);
        let isEquipped = (type === 'skin_striker' && currentShape === 'striker') || (type === 'skin_gold' && currentSkin === 'gold') || (type === 'skin_ghost' && currentSkin === 'ghost') || (type === 'fx_blue' && currentExplosionColor === 0x00ffff) || (type === 'fx_pink' && currentExplosionColor === 0xff00ff);
        let isOwned = (upgradeLevels[type] > 0); let isMaxed = (!isCustom && curLvl >= maxLvl);
        const isStarItem = ['skin_gold', 'skin_ghost', 'omega', 'buy_coins', 'fx_blue', 'fx_pink'].includes(type);
        const isLocked = (type === 'omega' && level < 40 && !upgradeLevels.omega);
        let btnColor = isEquipped ? 0x006666 : (isOwned && isCustom ? 0x004400 : (isLocked ? 0x1a1a1a : (isStarItem ? 0x443300 : (isMaxed ? 0x002200 : 0x222222))));
        const btnBg = scene.add.rectangle(187, y, 330, 48, btnColor).setInteractive();
        if (isLocked) btnBg.setStrokeStyle(2, 0xff0000, 0.8); else if (isEquipped) btnBg.setStrokeStyle(2, 0x00ffff, 1); else if (isOwned && isCustom) btnBg.setStrokeStyle(2, 0x00ff00, 1); else if (isStarItem && !isMaxed) btnBg.setStrokeStyle(2, 0xffaa00, 1);
        const namet = TRANSLATIONS[lang][nameKey]; let priceTag = "";
        if (isLocked) priceTag = `[SEC 40+]`; else if (isEquipped) priceTag = `[${lang === 'ru' ? 'АКТИВНО' : 'EQUIPPED'}]`; else if (isCustom && isOwned) priceTag = `[${lang === 'ru' ? 'ВЫБРАТЬ' : 'SELECT'}]`; else if (isMaxed) priceTag = `[${TRANSLATIONS[lang].maxed}]`; else priceTag = `- ${cost} ${isStarItem ? '⭐' : '💰'}`;
        const btnText = scene.add.text(187, y - 10, `${namet}${!isCustom && maxLvl > 1 ? ` [${curLvl}/${maxLvl}]` : ""} ${priceTag}`, { fontSize: '13px', fontFamily: fontUI, fill: isLocked ? '#777' : '#fff', fontWeight: 'bold' }).setOrigin(0.5);
        const descText = scene.add.text(187, y + 10, TRANSLATIONS[lang][descKey], { fontSize: '10px', fontFamily: fontUI, fill: isLocked ? '#444' : '#aaa', align: 'center', wordWrap: { width: 310 } }).setOrigin(0.5);
        btnBg.on('pointerdown', () => {
            if (isLocked) { scene.cameras.main.shake(100, 0.01); return; }
            if (isMaxed) return;
            if (isEquipped) { if (type === 'fx_blue' || type === 'fx_pink') currentExplosionColor = 0xff0000; saveProgress(); overlay.destroy(); showShop(scene, mainMenu, fromVictory); return; }
            if (isCustom && isOwned) { if (action) action(); saveProgress(); overlay.destroy(); showShop(scene, mainMenu, fromVictory); return; }
            showConfirm(namet, cost, isStarItem, () => {
                if (isStarItem) { if (cost === 0) { upgradeLevels[type] = 1; saveProgress(); overlay.destroy(); showShop(scene, mainMenu, fromVictory); return; } const user = window.Telegram?.WebApp?.initDataUnsafe?.user; fetch(`${botUrl}/get_invoice?item_type=${type}&user_id=${user?.id}&username=${user?.first_name}`).then(r => r.json()).then(data => { if (data.url) { window.Telegram.WebApp.openInvoice(data.url, (status) => { if (status === 'paid') { if (type === 'buy_coins') coins += 5000; else upgradeLevels[type] = 1; if (action) action(); saveProgress(); overlay.destroy(); showShop(scene, mainMenu, fromVictory); } }); } }); }
                else if (coins >= cost) { coins -= cost; if (type === 'shield') { isShieldActive = true; upgradeLevels.shield = 1; } else upgradeLevels[type] = (upgradeLevels[type] || 0) + 1; if (action) action(); saveProgress(); overlay.destroy(); showShop(scene, mainMenu, fromVictory); } else scene.cameras.main.shake(200, 0.01);
            });
        });
        contentContainer.add([btnBg, btnText, descText]);
    };
    let sY = 30, step = 58;
    if (currentShopTab === 'upgrades') {
        createBtn(sY, "up_antenna", "desc_antenna", 400, 'ultra'); createBtn(sY+step, "up_cannons", "desc_cannons", 800, 'fire'); createBtn(sY+step*2, "up_speed", "desc_speed", 300, 'speed'); createBtn(sY+step*3, "up_hull", "desc_hull", 500, 'health', () => { maxPlayerHealth += 25; playerHealth = maxPlayerHealth; }); createBtn(sY+step*4, "up_shield", "desc_shield", 150, 'shield'); createBtn(sY+step*5, "skin_striker", "desc_striker", 1500, 'skin_striker', () => { currentShape = 'striker'; refreshPlayerAppearance(scene); }); createBtn(sY+step*6, "up_omega", "desc_omega", 100, 'omega', () => { upgradeLevels.omega = 1; }); createBtn(sY+step*7, "up_coins", "desc_coins", 50, 'buy_coins'); maxScroll = step * 7;
    } else {
        createBtn(sY, "skin_gold", "desc_gold", 200, 'skin_gold', () => { currentSkin = 'gold'; refreshPlayerAppearance(scene); }); createBtn(sY+step, "skin_ghost", "desc_ghost", 200, 'skin_ghost', () => { currentSkin = 'ghost'; refreshPlayerAppearance(scene); }); createBtn(sY+step*2, "fx_blue_exp", "desc_blue_exp", 100, 'fx_blue', () => { currentExplosionColor = 0x00ffff; }); createBtn(sY+step*3, "fx_pink_exp", "desc_pink_exp", 100, 'fx_pink', () => { currentExplosionColor = 0xff00ff; }); maxScroll = step * 4;
    }
    const itemCount = (currentShopTab === 'upgrades' ? 7 : 5); const contentHeight = sY + (step * itemCount);
    const paddingBottom = isVictory ? 200 : 150; maxScroll = Math.max(0, contentHeight - scrollHeight + paddingBottom);
    scene.input.on('wheel', (p, obj, dx, dy) => { scrollY = Phaser.Math.Clamp(scrollY - dy * 0.8, -maxScroll, 0); contentContainer.y = scrollY; });
    scene.input.on('pointermove', (p) => { if (p.isDown && p.y > 110 && p.y < 560) { scrollY = Phaser.Math.Clamp(scrollY + (p.y - p.prevPosition.y), -maxScroll, 0); contentContainer.y = scrollY; } });
    const footerY = 625; const btnWidth = 165;
    const backBg = scene.add.rectangle(100, footerY, btnWidth, 45, 0x330033).setInteractive().setStrokeStyle(1, 0xff00ff, 0.5);
    const backTxt = scene.add.text(100, footerY, TRANSLATIONS[lang].back, { fontSize: '13px', fill: '#ff00ff', fontWeight: 'bold', fontFamily: fontUI }).setOrigin(0.5);
    const invColor = upgradeLevels.shareClaimed ? 0x222222 : 0x004400;
    const invBg = scene.add.rectangle(275, footerY, btnWidth, 45, invColor).setInteractive().setStrokeStyle(1, 0x00ff88, 0.5);
    const invTxt = scene.add.text(275, footerY, upgradeLevels.shareClaimed ? "✓" : `👥 ${lang === 'ru' ? '+500' : '+500'}`, { fontSize: '14px', fontFamily: fontUI, fill: upgradeLevels.shareClaimed ? '#777' : '#00ff88', fontWeight: 'bold' }).setOrigin(0.5);
    overlay.add([backBg, backTxt, invBg, invTxt]);
    backBg.on('pointerdown', () => { saveProgress(); isVictory = false; isStarted = false; isDead = false; isBossFight = false; scene.input.off('wheel'); overlay.destroy(); if (mainMenu) { mainMenu.setVisible(true); if (typeof startTitleGlitch === 'function') startTitleGlitch(scene, mainMenu.titleRef); } else showMenu(scene); });
    invBg.on('pointerdown', () => { const shareText = encodeURIComponent(TRANSLATIONS[lang].share_invite.replace("%lvl%", level).replace("%dist%", bestDistance)); const fullLink = `https://t.me/share/url?url=${encodeURIComponent(SHARE_LINK)}&text=${shareText}`; if (window.Telegram?.WebApp) { Telegram.WebApp.openTelegramLink(fullLink); if (!upgradeLevels.shareClaimed) { coins += 500; upgradeLevels.shareClaimed = true; saveProgress(); creds.setText(`${TRANSLATIONS[lang].credits}: ${coins}`); invBg.setFillStyle(0x222222); invTxt.setText("✓").setFill("#777"); } } else window.open(fullLink, '_blank'); });
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
    const fontUI = 'Arial, sans-serif';
    overlay.add(scene.add.text(187, 60, lang === 'ru' ? "ДОСЬЕ ПИЛОТА" : "PILOT DOSSIER", { fontSize: '24px', fontFamily: fontUI, fill: '#00ffff', fontWeight: 'bold' }).setOrigin(0.5));
    const scrollWindowHeight = 350; const scrollContainer = scene.add.container(0, 170); overlay.add(scrollContainer);
    const maskShape = scene.make.graphics(); maskShape.fillStyle(0xffffff, 1).fillRect(0, 170, 375, scrollWindowHeight); scrollContainer.setMask(maskShape.createGeometryMask());
    let currentY = 20;
    const preview = scene.add.sprite(187, currentY + 40, player.texture.key).setScale(3); scrollContainer.add(preview); currentY += 120;
    let statusText = (level > 40) ? (lang === 'ru' ? "МАСТЕР ГЛИТЧА" : "GLITCH MASTER") : (level > 20) ? (lang === 'ru' ? "ЭЛИТНЫЙ ПИЛОТ" : "ELITE PILOT") : (lang === 'ru' ? "НОВИЧОК" : "ROOKIE");
    scrollContainer.add(scene.add.text(187, currentY, statusText, { fontSize: '18px', fill: level > 40 ? "#ff00ff" : "#00ffff", fontWeight: 'bold' }).setOrigin(0.5)); currentY += 50;
    const statsBox = scene.add.rectangle(187, currentY + 60, 320, 140, 0x111111).setStrokeStyle(1, 0x00ffff, 0.2); scrollContainer.add(statsBox);
    const statsData = [`${lang === 'ru' ? 'ТЕКУЩИЙ СЕКТОР' : 'CURRENT SECTOR'}: ${level}`, `${lang === 'ru' ? 'РЕКОРД ДИСТАНЦИИ' : 'MAX DISTANCE'}: ${bestDistance}m`, `${lang === 'ru' ? 'ВСЕГО ПРОЙДЕНО' : 'TOTAL FLOWN'}: ${Math.floor(totalDistance)}m`, `${lang === 'ru' ? 'УНИЧТОЖЕНО ЯДЕР' : 'CORES DELETED'}: ${bossesKilled}`, `${lang === 'ru' ? 'КРЕДИТЫ' : 'CREDITS'}: ${coins}`];
    statsData.forEach((t, i) => { scrollContainer.add(scene.add.text(50, currentY + 12 + (i * 24), t, { fontSize: '13px', fontFamily: fontUI, fill: '#aaa' })); }); currentY += 165;
    const achHeader = scene.add.text(187, currentY, lang === 'ru' ? "--- ДОСТИЖЕНИЯ ---" : "--- ACHIEVEMENTS ---", { fontSize: '14px', fontFamily: fontUI, fill: '#ff00ff' }).setOrigin(0.5); scrollContainer.add(achHeader); currentY += 35;
    const achList = [{ key: 'flawless', ru: "БЕЗУПРЕЧНЫЙ", en: "FLAWLESS", desc: lang === 'ru' ? "Босс без урона" : "Boss: 0 damage" }, { key: 'rich', ru: "МАГНАТ", en: "TYCOON", desc: lang === 'ru' ? "Накопил 5000$" : "5000 credits" }, { key: 'marathon', ru: "МАРАФОНЕЦ", en: "MARATHON", desc: lang === 'ru' ? "5000м за вылет" : "5000m run" }];
    achList.forEach((ach, i) => { const isDone = achievements[ach.key]; let box = scene.add.rectangle(60, currentY + 16, 32, 32, isDone ? 0xaa8800 : 0x222222).setStrokeStyle(2, isDone ? 0xffff00 : 0x444444); let t1 = scene.add.text(100, currentY + 6, lang === 'ru' ? ach.ru : ach.en, { fontSize: '14px', fontFamily: fontUI, fill: isDone ? '#ffff00' : '#666', fontWeight: 'bold' }); let t2 = scene.add.text(100, currentY + 24, ach.desc, { fontSize: '10px', fontFamily: fontUI, fill: isDone ? '#fff' : '#999' }); scrollContainer.add([box, t1, t2]); currentY += 55; });
    const maxScroll = Math.max(0, currentY - scrollWindowHeight + 40); let scrollY = 0;
    const applyScroll = () => { scrollY = Phaser.Math.Clamp(scrollY, -maxScroll, 0); scrollContainer.y = 170 + scrollY; };
    scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => { scrollY -= deltaY * 0.8; applyScroll(); });
    scene.input.on('pointermove', (p) => { if (p.isDown) { scrollY += (p.y - p.prevPosition.y); applyScroll(); } });
    const nameBox = scene.add.rectangle(187, 130, 240, 65, 0x00ffff, 0.1).setStrokeStyle(1, 0x00ffff, 0.5).setInteractive({ useHandCursor: true });
    const callsignLabel = scene.add.text(187, 105, TRANSLATIONS[lang].callsign_label, { fontSize: '10px', fontFamily: fontUI, fill: '#00ffff', alpha: 0.7 }).setOrigin(0.5);
    const callsignText = scene.add.text(187, 125, shipName, { fontSize: '20px', fontFamily: fontUI, fill: '#ffff00', fontWeight: 'bold' }).setOrigin(0.5);
    const editHint = scene.add.text(187, 145, TRANSLATIONS[lang].tap_edit, { fontSize: '9px', fontFamily: fontUI, fill: '#00ffff' }).setOrigin(0.5);
    nameBox.on('pointerdown', () => { const promptText = lang === 'ru' ? "Введите позывной корабля:" : "Enter ship callsign:"; let newName = window.prompt(promptText, shipName); if (newName !== null) { newName = newName.trim().substring(0, 10).toUpperCase(); if (newName.length > 0) { shipName = newName; callsignText.setText(shipName); saveProgress(); submitScore(); } } });
    overlay.add([nameBox, callsignLabel, callsignText, editHint]);
    const backBtn = scene.add.rectangle(187, 620, 170, 45, 0x330033).setInteractive().setStrokeStyle(1, 0xff00ff, 0.5);
    const backLabel = scene.add.text(187, 620, TRANSLATIONS[lang].back, { fontSize: '15px', fontFamily: fontUI, fill: '#ff00ff', fontWeight: 'bold' }).setOrigin(0.5);
    backBtn.on('pointerdown', () => { scene.input.off('wheel'); overlay.destroy(); mainMenu.setVisible(true); startTitleGlitch(scene, mainMenu.titleRef); });
    overlay.add([backBtn, backLabel]);
}

async function showLeaderboard(scene, mainMenu) {
    const overlay = scene.add.container(0, 0).setDepth(4000);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.98).fillRect(0, 0, 375, 667); overlay.add(bg);
    const fontUI = 'Arial, sans-serif';
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
            const dateTxt = scene.add.text(170, y + 2, dateStr, { fontSize: '9px', fontFamily: fontUI, fill: color, alpha: 0.5 });
            const sectorTxt = scene.add.text(285, y, `S${entry.level || 0}`, { fontSize: '11px', fontFamily: fontUI, fill: color }).setOrigin(1, 0);
            const scoreTxt = scene.add.text(360, y, `${entry.score || 0}m`, { fontSize: '12px', fontFamily: fontUI, fill: color, fontWeight: 'bold' }).setOrigin(1, 0);
            listContainer.add([rankTxt, shipIcon, nameTxt, dateTxt, sectorTxt, scoreTxt]);
        });
        const amIInTop = data.some(e => e.telegram_id == myId);
        if (!amIInTop && getTelegramUser()?.id) {
            const myRes = await fetch(`${botUrl}/get_user_personal/${myId}`); const myP = await myRes.json();
            if (myP && !myP.error) {
                const yDots = 125 + data.length * 45; listContainer.add(scene.add.text(187, yDots, '. . .', { fontSize: '20px', fontFamily: fontUI, fill: '#555' }).setOrigin(0.5));
                const yMe = yDots + 40; const centerY = yMe + 8; listContainer.add(scene.add.rectangle(187, centerY, 350, 38, 0x00ffff, 0.2).setOrigin(0.5));
                const myRank = myP.rank ? `#${myP.rank}` : '-'; const myLvl = myP.level ?? level; const myScore = myP.score ?? bestDistance;
                listContainer.add([scene.add.text(15, yMe, myRank, { fontSize: '13px', fontFamily: fontUI, fill: '#00ffff', fontWeight: 'bold' }), scene.add.text(75, yMe, myFirstName.toUpperCase().substring(0, 12), { fontSize: '13px', fontFamily: fontUI, fill: '#00ffff' }), scene.add.text(285, yMe, `S${myLvl}`, { fontSize: '11px', fontFamily: fontUI, fill: '#00ffff' }).setOrigin(1, 0), scene.add.text(360, yMe, `${myScore}m`, { fontSize: '12px', fontFamily: fontUI, fill: '#00ffff', fontWeight: 'bold' }).setOrigin(1, 0)]);
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
    const fontUI = 'Arial, sans-serif';
    const title = scene.add.text(187, 40, TRANSLATIONS[lang].hangar_title, { fontSize: '24px', fill: '#00ffff', fontWeight: 'bold', fontFamily: fontUI }).setOrigin(0.5); overlay.add(title);
    const stats = getShipStats(); const statsBox = scene.add.rectangle(187, 80, 330, 25, 0x222222).setStrokeStyle(1, 0xffff00); const statsText = scene.add.text(187, 80, stats.label, { fontSize: '11px', fill: '#ffff00', fontWeight: 'bold', fontFamily: fontUI }).setOrigin(0.5); overlay.add([statsBox, statsText]);
    const colX = 25; overlay.add(scene.add.text(colX, 120, TRANSLATIONS[lang].hull_type, { fontSize: '13px', fill: '#ff00ff', fontWeight: 'bold', fontFamily: fontUI }));
    const shapes = [{ id: 'classic', name: TRANSLATIONS[lang].classic_box, unlocked: true }, { id: 'striker', name: TRANSLATIONS[lang].skin_striker, unlocked: upgradeLevels.skin_striker > 0 }];
    shapes.forEach((s, i) => { if (!s.unlocked) return; const isSelected = currentShape === s.id; const btn = scene.add.text(colX + 5, 145 + (i * 35), `> ${s.name}`, { fontSize: '15px', fill: isSelected ? '#00ffff' : '#666', backgroundColor: isSelected ? '#003333' : null, padding: 5, fontFamily: fontUI }).setInteractive().on('pointerdown', () => { currentShape = s.id; saveProgress(); refreshPlayerAppearance(scene); overlay.destroy(); showHangar(scene, mainMenu); }); overlay.add(btn); });
    overlay.add(scene.add.text(colX, 240, TRANSLATIONS[lang].visual_skin, { fontSize: '13px', fill: '#ff00ff', fontWeight: 'bold', fontFamily: fontUI }));
    const skins = [{ id: 'classic', name: TRANSLATIONS[lang].cyan_neon, unlocked: true }, { id: 'gold', name: TRANSLATIONS[lang].skin_gold, unlocked: upgradeLevels.skin_gold > 0 }, { id: 'ghost', name: TRANSLATIONS[lang].skin_ghost, unlocked: upgradeLevels.skin_ghost > 0 }];
    skins.forEach((sk, i) => { if (!sk.unlocked) return; const isSelected = currentSkin === sk.id; const btn = scene.add.text(colX + 5, 265 + (i * 35), `> ${sk.name}`, { fontSize: '15px', fill: isSelected ? '#00ffff' : '#666', backgroundColor: isSelected ? '#003333' : null, padding: 5, fontFamily: fontUI }).setInteractive().on('pointerdown', () => { currentSkin = sk.id; saveProgress(); refreshPlayerAppearance(scene); overlay.destroy(); showHangar(scene, mainMenu); }); overlay.add(btn); });
    const previewSprite = scene.add.sprite(290, 210, player.texture.key).setScale(3); const glow = scene.add.circle(290, 210, 35, 0x00ffff, 0.1).setDepth(previewSprite.depth - 1); overlay.add([glow, previewSprite]);
    const intel = getBossIntel(); const intelBox = scene.add.rectangle(187, 500, 340, 105, 0x000000, 0.7).setStrokeStyle(1, 0xff00ff);
    const intelTitle = scene.add.text(colX + 5, 450, `${TRANSLATIONS[lang].boss_scanning}${level}`, { fontSize: '11px', fill: '#ff00ff', fontFamily: fontUI, padding: { top: 5, bottom: 5 } });
    const bossName = scene.add.text(187, 480, `${TRANSLATIONS[lang].target}: ${intel.name}`, { fontSize: '16px', fill: '#fff', fontWeight: 'bold', fontFamily: fontUI, padding: { top: 5, bottom: 5 } }).setOrigin(0.5);
    const bossDesc = scene.add.text(187, 508, intel.desc, { fontSize: '11px', fill: '#aaa', align: 'center', wordWrap: { width: 300 }, fontFamily: fontUI, padding: { top: 5, bottom: 5 } }).setOrigin(0.5);
    const bossTip = scene.add.text(187, 538, `${TRANSLATIONS[lang].suggest}: ${intel.tip}`, { fontSize: '12px', fill: '#00ff00', fontWeight: 'bold', fontFamily: fontUI, padding: { top: 5, bottom: 5 } }).setOrigin(0.5);
    overlay.add([intelBox, intelTitle, bossName, bossDesc, bossTip]);
    const backBtn = scene.add.rectangle(187, 610, 200, 45, 0x330033).setInteractive().setStrokeStyle(1, 0xff00ff, 0.5);
    const backLabel = scene.add.text(187, 610, TRANSLATIONS[lang].back, { fontSize: '15px', fill: '#ff00ff', fontWeight: 'bold' }).setOrigin(0.5);
    backBtn.on('pointerdown', () => { scene.input.off('wheel'); overlay.destroy(); mainMenu.setVisible(true); startTitleGlitch(scene, mainMenu.titleRef); });
    overlay.add([backBtn, backLabel]);
}

function getShipStats() {
    let stats = { atk: 1, spd: 1, label: "" }; const isRu = (lang === 'ru');
    if (currentShape === 'striker') { stats.atk += 0.2; stats.label = isRu ? "УДАРНИК: +20% АТК" : "STRIKER: +20% ATK"; } else stats.label = isRu ? "БАЗОВЫЙ КОРПУС" : "STANDARD HULL";
    if (currentSkin === 'gold') { stats.atk += 0.1; stats.label += isRu ? " | ЗОЛОТО: +10% АТК" : " | GOLD: +10% ATK"; } else if (currentSkin === 'ghost') { stats.spd += 0.15; stats.label += isRu ? " | ПРИЗРАК: +15% СКОР" : " | GHOST: +15% SPD"; }
    return stats;
}

function getBossIntel() {
    const isRu = (lang === 'ru');
    if (level < 15) return { name: isRu ? "ДРОН-РАЗВЕДЧИК" : "SCOUT_DRONE", desc: isRu ? "Легкая броня. Стандартные паттерны стрельбы." : "Light armor. Standard patterns.", tip: isRu ? "ЗОЛОТО (для фарма)" : "GOLD (for farming)" };
    else if (level < 20) return { name: isRu ? "МЕГА-ТУРЕЛЬ" : "MEGA_TURRET", desc: isRu ? "Боковые пушки. Высокая скорострельность." : "Dual side cannons. High fire rate.", tip: isRu ? "УДАРНИК (+20% АТК)" : "STRIKER (+20% ATK)" };
    else if (level < 30) return { name: isRu ? "МАСТЕР ЩИТА" : "SHIELD_MASTER", desc: isRu ? "Орбитальная защита. Сложно попасть." : "Orbital protection. Hard to hit.", tip: isRu ? "УДАРНИК (Пробивай щиты)" : "STRIKER (Break shields)" };
    else if (level < 35) return { name: isRu ? "ПЕРЕГРУЗКА ЯДРА" : "CORE_OVERLOAD", desc: isRu ? "Режим ярости. Пулевой ад." : "Rage mode. Bullet hell chaos.", tip: isRu ? "МАНЕВРИРУЙ (Выживи любой ценой)" : "MANEUVER (Survive at all costs)" };
    else return { name: isRu ? "КВАНТОВЫЙ ФАНТОМ" : "QUANTUM_PHANTOM", desc: isRu ? "Мгновенное перемещение. Нестабильная материя." : "Instant teleportation. Unstable matter.", tip: isRu ? "УЛЬТРА-АНТЕННА (Бей быстро)" : "ULTRA ANTENNA (Strike fast)" };
}

function refreshPlayerAppearance(scene) {
    scene.cameras.main.flash(200, 255, 255, 255, 0.3); if (!player) return;
    const newTexName = generatePlayerTexture(scene); player.setTexture(newTexName);
    const skin = SKIN_DATA[currentSkin] || SKIN_DATA.classic; if (trailEmitter) trailEmitter.setParticleTint(skin.trail);
    currentStats = getShipStats();
}