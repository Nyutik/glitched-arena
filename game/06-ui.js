// ============================================
// 06-UI.JS — Интерфейсы меню
// ============================================
// За что отвечает:
// - showMenu, showSettings, showRules
// - showGaryIntro, updateHudTexts, shareDuel
// ============================================

function updateHudTexts() {
    if (scoreText) scoreText.setText(`${TRANSLATIONS[lang].credits}: ${coins + coinsThisRun}`);
    if (levelText) levelText.setText(`${TRANSLATIONS[lang].sector}: ${level}`);
    if (bestText) bestText.setText(`${TRANSLATIONS[lang].best}: ${bestLevel}`);
    if (bestDistText) bestDistText.setText(`${TRANSLATIONS[lang].max_dist}: ${bestDistance}m`);
    if (rankXPText) {
        const current = getCurrentRank();
        const progress = getRankProgress();
        if (progress.next) {
            rankXPText.setText(`${current.name[lang]}: ${rankXP}/${progress.next.xp}`);
        } else {
            rankXPText.setText(`${current.name[lang]}: MAX`);
        }
    }
}

function shareDuel(status = 'win') {
    let displayLvl = (status === 'win') ? (level - 1) : level;
    let baseText = (status === 'win') ? TRANSLATIONS[lang].share_win_text : TRANSLATIONS[lang].share_loss_text;
    const text = encodeURIComponent(baseText.replace("%lvl%", displayLvl));
    const url = `https://t.me/share/url?url=${encodeURIComponent(SHARE_LINK)}&text=${text}`;
    if (window.Telegram?.WebApp) window.Telegram.WebApp.openTelegramLink(url);
    else window.open(url, '_blank');
}

function showMenu(scene) {
    initDailyQuests();
    clearBattleTexts(scene); cleanupScreenFx(scene);
    ensureBgm(scene); isStarted = false; isVictory = false; isDead = false; isBossFight = false; isPaused = false; isShopOpen = false;
    scene.physics.resume(); scene.time.paused = false;
    if (scene.physics && scene.physics.world) scene.physics.world.timeScale = 1;
    const menu = scene.add.container(0, 0).setDepth(3000);
    const bg = scene.add.graphics().fillStyle(0x000000, 1).fillRect(0, 0, 375, 667);
    const fontUI = 'Arial, sans-serif';
    const title = scene.add.text(187, 80, TRANSLATIONS[lang].menu_title, { fontSize: '42px', fill: '#00ffff', align: 'center', fontWeight: 'bold', stroke: '#ff00ff', strokeThickness: 4, fontFamily: fontUI }).setOrigin(0.5);
    menu.titleRef = title;
    startTitleGlitch(scene, title);
    scene.glitchTimer = scene.time.addEvent({ delay: 2000, callback: () => applyGlitchEffect(scene, title), callbackScope: scene, loop: true });
    const closeMenu = () => { if (scene.glitchTimer) scene.glitchTimer.remove(); menu.setVisible(false); };
    const profileBtn = scene.add.text(187, 145, TRANSLATIONS[lang].profile, { fontSize: '16px', fontFamily: fontUI, fill: '#00ffff', fontWeight: 'bold' }).setOrigin(0.5).setInteractive();
    const miniShip = scene.add.sprite(110, 145, player.texture.key).setScale(0.8).setAlpha(0.8);
    scene.tweens.add({ targets: miniShip, x: 105, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    profileBtn.on('pointerdown', () => { closeMenu(); showProfile(scene, menu); });
    const questsBtn = scene.add.text(310, 75, "📋", { fontSize: '24px', fontFamily: fontUI }).setOrigin(0.5).setInteractive();
    questsBtn.on('pointerdown', () => { closeMenu(); showDailyQuests(scene, menu); });
    
    const langBtn = scene.add.text(320, 30, lang.toUpperCase(), { fontSize: '14px', fill: '#ffff00', backgroundColor: '#222', padding: 8, fontFamily: fontUI }).setOrigin(0.5).setInteractive();
    langBtn.on('pointerdown', () => { lang = (lang === 'ru') ? 'en' : 'ru'; saveProgress(); if (scene.glitchTimer) scene.glitchTimer.remove(); menu.destroy(); showMenu(scene); });
    const btnStyle = { fontSize: '18px', fill: '#fff', backgroundColor: '#222', padding: 10, fontFamily: fontUI, fontWeight: 'bold' };
    const startBtn = scene.add.text(187, 210, TRANSLATIONS[lang].start, btnStyle).setOrigin(0.5).setInteractive();
    const hangarBtn = scene.add.text(187, 275, TRANSLATIONS[lang].hangar, btnStyle).setOrigin(0.5).setInteractive();
    const shopBtn = scene.add.text(187, 340, TRANSLATIONS[lang].shop, btnStyle).setOrigin(0.5).setInteractive();
    const setBtn = scene.add.text(187, 405, TRANSLATIONS[lang].settings, btnStyle).setOrigin(0.5).setInteractive();
    let audioState = isSoundOn ? TRANSLATIONS[lang].v_on : TRANSLATIONS[lang].v_off;
    const soundBtn = scene.add.text(187, 470, `>> ${TRANSLATIONS[lang].audio}: ${audioState}`, btnStyle).setOrigin(0.5).setInteractive();
    const rulesBtn = scene.add.text(187, 535, TRANSLATIONS[lang].rules, btnStyle).setOrigin(0.5).setInteractive();
    const topBtn = scene.add.text(187, 600, TRANSLATIONS[lang].top, { fontSize: '16px', fill: '#ffff00', backgroundColor: '#333300', padding: 10, fontFamily: fontUI, fontWeight: 'bold' }).setOrigin(0.5).setInteractive();
    startBtn.on('pointerdown', () => { 
        // Сначала проверяем флаг просмотра рекламы
        if (adWatchedPendingRevive) {
            adWatchedPendingRevive = false;
            lastRunState = { isDead: false, pendingDeath: false };
            isDead = false;
            saveProgress();
            closeMenu(); startRun(scene); 
            return;
        }
        // Иначе стандартная логика
        if (lastRunState.pendingDeath) { closeMenu(); triggerDeath(scene); return; } 
        closeMenu(); startRun(scene); 
    });
    soundBtn.on('pointerdown', () => { isSoundOn = !isSoundOn; soundBtn.setText(`>> ${TRANSLATIONS[lang].audio}: ${isSoundOn ? TRANSLATIONS[lang].v_on : TRANSLATIONS[lang].v_off}`); if (!isSoundOn) scene.sound.stopAll(); });
    hangarBtn.on('pointerdown', () => { closeMenu(); showHangar(scene, menu); });
    shopBtn.on('pointerdown', () => { closeMenu(); showShop(scene, menu); });
    setBtn.on('pointerdown', () => { closeMenu(); showSettings(scene, menu); });
    rulesBtn.on('pointerdown', () => { closeMenu(); showRules(scene, menu); });
    topBtn.on('pointerdown', () => { closeMenu(); showLeaderboard(scene, menu); });
    menu.add([bg, miniShip, title, langBtn, startBtn, hangarBtn, shopBtn, profileBtn, setBtn, soundBtn, rulesBtn, topBtn, questsBtn]);
}

function showDailyQuests(scene, mainMenu) {
    const overlay = scene.add.container(0, 0).setDepth(4000);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.98).fillRect(0, 0, 375, 667);
    const fontUI = 'Arial, sans-serif';
    const title = scene.add.text(187, 50, TRANSLATIONS[lang].daily_quests, { fontSize: '22px', fill: '#ffaa00', fontWeight: 'bold', fontFamily: fontUI }).setOrigin(0.5);
    overlay.add([bg, title]);
    const quests = [
        { key: 'kill50', icon: '💀', color: '#ff6666' },
        { key: 'noshield', icon: '🛡️', color: '#66aaff' },
        { key: 'combo15', icon: '⚡', color: '#ffff66' },
        { key: 'clearboss', icon: '👑', color: '#ff66ff' }
    ];
    let yPos = 120;
    quests.forEach(q => {
        const quest = dailyQuests[q.key];
        if (!quest) return;
        const bgColor = quest.completed ? 0x224422 : 0x222222;
        const borderColor = quest.completed ? 0x00ff00 : q.color;
        const qBg = scene.add.rectangle(187, yPos, 355, 85, bgColor).setStrokeStyle(2, borderColor);
        const qIcon = scene.add.text(35, yPos, q.icon, { fontSize: '28px', fontFamily: fontUI }).setOrigin(0.5);
        const qName = scene.add.text(100, yPos - 12, TRANSLATIONS[lang]['quest_' + q.key] || q.key, { fontSize: '13px', fill: '#ffffff', fontFamily: fontUI, wordWrap: { width: 200 } });
        const qReward = scene.add.text(100, yPos + 12, TRANSLATIONS[lang]['quest_' + q.key + '_desc'] || '', { fontSize: '11px', fill: '#aaaaaa', fontFamily: fontUI, wordWrap: { width: 200 } });
        let qStatus = '';
        if (quest.completed) {
            qStatus = TRANSLATIONS[lang].daily_complete || (lang === 'ru' ? 'ГОТОВО' : 'DONE');
        } else if (q.key === 'kill50') {
            qStatus = `${quest.current}/${quest.target}`;
        }
        const qStatusTxt = scene.add.text(320, yPos, qStatus, { fontSize: '12px', fill: quest.completed ? '#00ff00' : '#ffff00', fontFamily: fontUI, fontWeight: 'bold' }).setOrigin(0.5, 0.5);
        overlay.add([qBg, qIcon, qName, qReward, qStatusTxt]);
        yPos += 90;
    });
    const backBtn = scene.add.rectangle(187, 520, 200, 45, 0x330033).setInteractive().setStrokeStyle(1, 0xff00ff, 0.5);
    const backLabel = scene.add.text(187, 520, TRANSLATIONS[lang].back, { fontSize: '15px', fill: '#ff00ff', fontWeight: 'bold', fontFamily: fontUI }).setOrigin(0.5);
    backBtn.on('pointerdown', () => { overlay.destroy(); mainMenu.setVisible(true); startTitleGlitch(scene, mainMenu.titleRef); });
    overlay.add([backBtn, backLabel]);
}

function showSettings(scene, mainMenu) {
    const overlay = scene.add.container(0, 0).setDepth(4000);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.98).fillRect(0, 0, 375, 667);
    const fontUI = 'Arial, sans-serif';
    const title = scene.add.text(187, 60, TRANSLATIONS[lang].settings, { fontSize: '24px', fill: '#00ffff', fontWeight: 'bold' }).setOrigin(0.5);
    overlay.add([bg, title]);
    const finger = scene.add.circle(187, 350, 15, 0xffffff, 0.3).setStrokeStyle(2, 0xffffff);
    const shipPreview = scene.add.sprite(187, 350 + yOffset, player.texture.key).setScale(2);
    overlay.add([finger, shipPreview]);
    const info = scene.add.text(187, 450, `${TRANSLATIONS[lang].offset_label}: ${Math.abs(yOffset)}px`, { fontSize: '18px', fill: '#00ffff', fontFamily: fontUI }).setOrigin(0.5);
    overlay.add(info);
    const adjust = (v) => { yOffset = Phaser.Math.Clamp(yOffset + v, -150, 0); shipPreview.setY(350 + yOffset); info.setText(`${TRANSLATIONS[lang].offset_label}: ${Math.abs(yOffset)}px`); saveProgress(); scene.tweens.add({ targets: shipPreview, y: shipPreview.y - 15, duration: 100, yoyo: true, ease: 'Back.easeOut' }); };
    const up = scene.add.text(120, 520, ` [ ${TRANSLATIONS[lang].higher} ] `, { backgroundColor: '#004400', padding: 10, fontWeight: 'bold' }).setOrigin(0.5).setInteractive().on('pointerdown', () => adjust(-10));
    const down = scene.add.text(254, 520, ` [ ${TRANSLATIONS[lang].lower} ] `, { backgroundColor: '#440000', padding: 10, fontWeight: 'bold' }).setOrigin(0.5).setInteractive().on('pointerdown', () => adjust(10));
    overlay.add([up, down]);
    const backBtn = scene.add.rectangle(187, 610, 200, 45, 0x330033).setInteractive().setStrokeStyle(1, 0xff00ff, 0.5);
    const backLabel = scene.add.text(187, 610, TRANSLATIONS[lang].apply, { fontSize: '15px', fill: '#ff00ff', fontWeight: 'bold' }).setOrigin(0.5);
    backBtn.on('pointerdown', () => { scene.input.off('wheel'); overlay.destroy(); mainMenu.setVisible(true); startTitleGlitch(scene, mainMenu.titleRef); });
    overlay.add([backBtn, backLabel]);
}

function showRules(scene, mainMenu) {
    const rulesOverlay = scene.add.container(0, 0).setDepth(4000);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.98).fillRect(0, 0, 375, 667);
    rulesOverlay.add(bg);
    const fontUI = 'Arial, sans-serif';
    const scrollAreaTop = 70; const scrollAreaBottom = 570; const scrollHeight = scrollAreaBottom - scrollAreaTop;
    const scrollWindow = scene.add.container(0, 0).setDepth(4001); rulesOverlay.add(scrollWindow);
    const contentContainer = scene.add.container(0, 0); scrollWindow.add(contentContainer);
    const mask = scene.make.graphics().fillRect(0, scrollAreaTop, 375, scrollHeight).createGeometryMask(); scrollWindow.setMask(mask);
    const header = scene.add.text(187, 30, TRANSLATIONS[lang].rules_header, { fontSize: '22px', fill: '#00ffff', fontWeight: 'bold', fontFamily: fontUI }).setOrigin(0.5); rulesOverlay.add(header);
    let currentY = 0;
    const itemsList = [
        { key: 'wall', c: 0xff0000, t: TRANSLATIONS[lang].rule_wall },
        { key: 'pixel', c: 0xffff00, t: TRANSLATIONS[lang].rule_coin },
        { key: 'heart', c: 0xff0088, t: TRANSLATIONS[lang].rule_heart },
        { key: 'pixel', c: 0xff00ff, t: TRANSLATIONS[lang].rule_nuke, angle: 45, scale: 2.2 },
        { key: 'pixel', c: 0xff00ff, t: TRANSLATIONS[lang].rule_magnet, angle: 180, scale: 1.6 },
        { key: 'pixel', c: 0x00ff00, t: TRANSLATIONS[lang].rule_slowmo, scale: 1.6 }
    ];
    itemsList.forEach((item, i) => { let y = scrollAreaTop + currentY + 20; let icon = scene.add.sprite(75, y, item.key).setTint(item.c); icon.setScale(item.scale || (item.key === 'pixel' ? 1.8 : 0.6)); if (item.angle) icon.setAngle(item.angle); let txt = scene.add.text(105, y, item.t, { fontSize: '11px', fill: '#fff', fontFamily: fontUI, wordWrap: { width: 240 } }).setOrigin(0, 0.5); contentContainer.add([icon, txt]); currentY += 35; });
    currentY += 5;
    const comboTip = scene.add.text(187, scrollAreaTop + currentY, TRANSLATIONS[lang].combo_tip || "⚡ COMBO: Evade obstacles to build, resets on hit!", { fontSize: '10px', fill: '#ffff00', fontFamily: fontUI, align: 'center', wordWrap: { width: 320 } }).setOrigin(0.5); contentContainer.add(comboTip); currentY += 25;
    currentY += 15;
    const stagesTitle = scene.add.text(187, scrollAreaTop + currentY, TRANSLATIONS[lang].rules_alerts, { fontSize: '14px', fill: '#ff00ff', fontWeight: 'bold' }).setOrigin(0.5); contentContainer.add(stagesTitle); currentY += 28;
    const stagesBg = scene.add.rectangle(187, scrollAreaTop + currentY + 75, 340, 150, 0x110011, 0.8).setStrokeStyle(1, 0xff00ff, 0.5); contentContainer.add(stagesBg);
    const stagesDesc = scene.add.text(187, scrollAreaTop + currentY + 75, `${TRANSLATIONS[lang].rules_sec_15}\n${TRANSLATIONS[lang].rules_sec_20}\n${TRANSLATIONS[lang].rules_sec_30}\n${TRANSLATIONS[lang].rules_sec_35}\n${TRANSLATIONS[lang].rules_sec_40}\n${TRANSLATIONS[lang].rules_sec_50}\n${TRANSLATIONS[lang].rules_sec_60}\n${TRANSLATIONS[lang].rules_sec_70}`, { fontSize: '9px', fill: '#ffaa00', fontFamily: fontUI, align: 'center', lineSpacing: 4, wordWrap: { width: 310 } }).setOrigin(0.5, 0.5); contentContainer.add(stagesDesc); currentY += 165;
    currentY += 15;
    const strategyText = TRANSLATIONS[lang].strategy_tip;
    const strategyBoxH = 55;
    const shopBox = scene.add.rectangle(187, scrollAreaTop + currentY + strategyBoxH/2, 310, strategyBoxH, 0x00ffff, 0.05).setStrokeStyle(1, 0x00ffff); const shopTxt = scene.add.text(187, scrollAreaTop + currentY + strategyBoxH/2, strategyText, { fontSize: '11px', fill: '#00ffff', align: 'center', fontFamily: fontUI, wordWrap: { width: 280 } }).setOrigin(0.5); contentContainer.add([shopBox, shopTxt]); currentY += strategyBoxH + 15;
    
    // --- ОБУЧЕНИЕ (РУКА) — внизу контента ---
    const handGlow = scene.add.circle(187, scrollAreaTop + currentY + 80, 16, 0x00ffff, 0.15);
    const hand = scene.add.circle(187, scrollAreaTop + currentY + 80, 10, 0x00ffff, 0.8);
    scene.tweens.add({ 
        targets: [hand, handGlow], 
        x: { from: 130, to: 244 }, 
        duration: 1200, 
        yoyo: true, 
        repeat: -1, 
        ease: 'Sine.easeInOut' 
    });

    const handTxt = scene.add.text(187, scrollAreaTop + currentY + 97, TRANSLATIONS[lang].slide, { 
        fontSize: '12px', 
        fill: '#00ffff', 
        fontFamily: fontUI, 
        fontWeight: 'bold' 
    }).setOrigin(0.5);

    contentContainer.add([handGlow, hand, handTxt]); currentY += 110;
    
    const contentHeight = scrollAreaTop + currentY + 50;
    let maxScroll = Math.max(0, contentHeight - scrollAreaBottom + 30); let scrollY = 0;
    const applyScroll = () => { scrollY = Phaser.Math.Clamp(scrollY, -maxScroll, 0); contentContainer.y = scrollY; };
    scene.input.on('wheel', (p, o, dx, dy) => { scrollY -= dy * 0.8; applyScroll(); });
    scene.input.on('pointermove', (p) => { if (p.isDown && p.y > scrollAreaTop && p.y < scrollAreaBottom) { scrollY += (p.y - p.prevPosition.y); applyScroll(); } });
    const backBtn = scene.add.rectangle(187, 615, 200, 40, 0x330033).setInteractive().setStrokeStyle(1, 0xff00ff, 0.5);
    const backLabel = scene.add.text(187, 615, TRANSLATIONS[lang].back, { fontSize: '15px', fill: '#ff00ff', fontWeight: 'bold' }).setOrigin(0.5);
    backBtn.on('pointerdown', () => { scene.input.off('wheel'); rulesOverlay.destroy(); mainMenu.setVisible(true); startTitleGlitch(scene, mainMenu.titleRef); });
    rulesOverlay.add([backBtn, backLabel]);
}

function showGaryIntro(scene) {
    const intro = scene.add.container(0, 0).setDepth(7000);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.9).fillRect(0, 0, 375, 667);
    bg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 375, 667), Phaser.Geom.Rectangle.Contains);
    const fontUI = 'Arial, sans-serif';
    const frame = scene.add.rectangle(187, 333, 320, 250, 0x111111).setStrokeStyle(2, 0xff00ff);
    const garyIcon = scene.add.sprite(187, 260, 'gary_avatar').setTint(0x00ff00).setScale(0.8);
    const introText = (shipName === "RAZOR-01") ? TRANSLATIONS[lang].gary_intro : TRANSLATIONS[lang].gary_intro_ship.replace("%ship%", shipName);
    const text = scene.add.text(187, 350, introText, { fontSize: '14px', fill: '#fff', align: 'center', wordWrap: { width: 280 }, fontFamily: fontUI }).setOrigin(0.5);
    const closeBtn = scene.add.text(187, 430, TRANSLATIONS[lang].underst, { fontSize: '18px', fill: '#00ffff', fontWeight: 'bold' }).setOrigin(0.5).setInteractive().on('pointerdown', () => { intro.destroy(); localStorage.setItem('GLITCHED_ARENA_INTRO_DONE', 'true'); });
    intro.add([bg, frame, garyIcon, text, closeBtn]);
    scene.tweens.add({ targets: intro, alpha: { from: 0, to: 1 }, duration: 200 });
}