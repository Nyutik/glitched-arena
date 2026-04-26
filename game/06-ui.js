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
    console.log('[Menu] showMenu called');
    currentStats = getShipStats();
    initDailyQuests();
    clearBattleTexts(scene); cleanupScreenFx(scene);
    ensureBgm(scene); isStarted = false; isVictory = false; isDead = false; isBossFight = false; isPaused = false; isShopOpen = false;
    scene.physics.resume(); scene.time.paused = false;
    if (scene.physics && scene.physics.world) scene.physics.world.timeScale = 1;
    const menu = scene.add.container(0, 0).setDepth(3000);
    const bg = scene.add.graphics().fillStyle(0x04070d, 1).fillRect(0, 0, 375, 667);
    const fontUI = '"Orbitron", sans-serif';
    const topGlow = scene.add.ellipse(187, 85, 300, 115, 0x00e5ff, 0.12);
    const heroGlow = scene.add.ellipse(187, 205, 230, 150, 0xff00aa, 0.11);
    const heroAura = scene.add.circle(187, 205, 58, 0x00ffff, 0.12).setStrokeStyle(2, 0x00ffff, 0.35);
    const heroFrame = scene.add.rectangle(187, 205, 168, 112, 0x07141d, 0.86).setStrokeStyle(2, 0x00ffff, 0.65);
    const decoLines = scene.add.graphics();
    decoLines.lineStyle(1, 0x00ffff, 0.13);
    for (let y = 0; y <= 667; y += 32) decoLines.lineBetween(20, y, 355, y);
    decoLines.lineStyle(1, 0xff00ff, 0.08);
    decoLines.lineBetween(42, 130, 112, 130);
    decoLines.lineBetween(263, 130, 333, 130);
    decoLines.lineBetween(42, 278, 112, 278);
    decoLines.lineBetween(263, 278, 333, 278);
    const title = scene.add.text(187, 74, TRANSLATIONS[lang].menu_title, { fontSize: '42px', fill: '#00ffff', align: 'center', fontWeight: 'bold', stroke: '#ff00ff', strokeThickness: 4, fontFamily: fontUI }).setOrigin(0.5);
    menu.titleRef = title;
    startTitleGlitch(scene, title);
    scene.glitchTimer = scene.time.addEvent({ delay: 2000, callback: () => applyGlitchEffect(scene, title), callbackScope: scene, loop: true });
    const closeMenu = () => { if (scene.glitchTimer) scene.glitchTimer.remove(); menu.setVisible(false); };
    const profileBtn = scene.add.text(187, 126, TRANSLATIONS[lang].profile, { fontSize: '16px', fontFamily: fontUI, fill: '#00ffff', fontWeight: 'bold' }).setOrigin(0.5).setInteractive();
    const showcaseTrail = scene.add.ellipse(187, 235, 105, 18, 0x00ffff, 0.12);
    const showcaseShip = scene.add.sprite(187, 205, player?.texture?.key || 'pixel').setScale(2.45).setAlpha(0.98).setAngle(-4);
    const loadoutLabel = scene.add.text(187, 270, lang === 'ru' ? 'АКТИВНАЯ СБОРКА' : 'ACTIVE LOADOUT', { fontSize: '10px', fontFamily: fontUI, fill: '#88ffee', fontWeight: 'bold', letterSpacing: 1 }).setOrigin(0.5);
    const loadoutStats = scene.add.text(187, 289, currentStats.label, { fontSize: '10px', fontFamily: fontUI, fill: '#ffe680', fontWeight: 'bold', align: 'center', wordWrap: { width: 270 } }).setOrigin(0.5);
    const flavorText = scene.add.text(187, 311, lang === 'ru' ? 'НЕОН. СКОРОСТЬ. ОХОТА ЗА ЯДРОМ.' : 'NEON. SPEED. CORE HUNT.', { fontSize: '10px', fontFamily: fontUI, fill: '#8aa4bf', fontStyle: 'italic' }).setOrigin(0.5);
    let droneOrbit = null;
    if (upgradeLevels.helper_drone > 0) {
        const droneHalo = scene.add.circle(244, 193, 11, 0x00ff88, 0.14);
        const showcaseDrone = scene.add.circle(244, 193, 8, 0x00ff88, 0.9).setStrokeStyle(2, 0xcaffea, 0.8);
        const droneCore = scene.add.circle(244, 193, 3, 0xffffff, 0.95);
        droneOrbit = scene.add.container(0, 0, [droneHalo, showcaseDrone, droneCore]);
        scene.tweens.add({ targets: droneOrbit, x: -6, y: -5, duration: 950, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    scene.time.delayedCall(400, () => {
        if (showcaseShip && showcaseShip.active) {
            scene.tweens.add({ targets: showcaseShip, y: showcaseShip.y - 6, angle: 4, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
    });
    scene.tweens.add({ targets: [heroGlow, heroAura], alpha: { from: 0.08, to: 0.2 }, scaleX: 1.04, scaleY: 1.06, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scene.tweens.add({ targets: showcaseTrail, alpha: { from: 0.08, to: 0.22 }, width: 125, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    profileBtn.on('pointerdown', () => { closeMenu(); showProfile(scene, menu); });
    const startY = 360;
    const hangarY = 430;
    const shopY = 500;
    const settingsY = 570;
    const questsBtn = scene.add.text(320, 135, '📋', { fontSize: '18px', fill: '#ffffff', backgroundColor: '#222', padding: 8, fontFamily: fontUI }).setOrigin(0.5).setInteractive();
    questsBtn.on('pointerdown', () => { closeMenu(); showDailyQuests(scene, menu); });
    
    const langBtn = scene.add.text(320, 35, lang.toUpperCase(), { fontSize: '14px', fill: '#ffff00', backgroundColor: '#222', padding: 8, fontFamily: fontUI }).setOrigin(0.5).setInteractive();
    langBtn.on('pointerdown', () => { lang = (lang === 'ru') ? 'en' : 'ru'; saveProgress(); if (scene.glitchTimer) scene.glitchTimer.remove(); menu.destroy(); showMenu(scene); });
    
    const communityBtn = scene.add.text(320, 85, '💎', { fontSize: '18px', fill: '#ffffff', backgroundColor: '#222', padding: 8, fontFamily: fontUI }).setOrigin(0.5).setInteractive();
    communityBtn.on('pointerdown', async () => { 
        const url = 'https://t.me/GlitchedArenaCommunity';
        if (window.Telegram?.WebApp) { Telegram.WebApp.openTelegramLink(url); } else { window.open(url, '_blank'); }
        
        // Даем небольшую паузу, чтобы юзер успел перейти, а потом проверяем
        scene.time.delayedCall(2000, async () => {
            const user = getTelegramUser();
            if (!user) return;
            try {
                const res = await fetch(`${botUrl}/check_community/${user.id}`);
                const data = await res.json();
                console.log('[Community] Response:', data);
                if (data.status === 'success') {
                    showToast(scene, "ELITE UNLOCKED!", data.message);
                    currentSkin = 'elite';
                    upgradeLevels.skin_elite = 1; // Явно ставим флаг локально
                    if (typeof refreshPlayerAppearance === 'function') refreshPlayerAppearance(scene);
                    saveProgress();
                    if (typeof submitScore === 'function') submitScore();
                    if (showcaseShip && player) showcaseShip.setTexture(player.texture.key);
                } else if (data.status === 'not_member') {
                    showToast(scene, "ACCESS DENIED", TRANSLATIONS[lang].rule_community);
                } else if (data.status === 'already_claimed') {
                    showToast(scene, "SYSTEM", data.message);
                }
            } catch (e) { console.error('Check community error:', e); }
        });
    });
    const btnStyle = { fontSize: '18px', fill: '#fff', backgroundColor: '#222', padding: 10, fontFamily: fontUI, fontWeight: 'bold' };
    const startPulse = scene.add.rectangle(187, startY, 276, 54, 0x00d7ff, 0.14).setStrokeStyle(2, 0x00ffff, 0.95);
    const startBtn = scene.add.text(187, startY, TRANSLATIONS[lang].start, { fontSize: '19px', fill: '#ffffff', backgroundColor: '#003746', padding: { left: 18, right: 18, top: 10, bottom: 10 }, fontFamily: fontUI, fontWeight: 'bold' }).setOrigin(0.5).setInteractive();
    const hangarBtn = scene.add.text(187, hangarY, TRANSLATIONS[lang].hangar, btnStyle).setOrigin(0.5).setInteractive();
    const shopBtn = scene.add.text(187, shopY, TRANSLATIONS[lang].shop, btnStyle).setOrigin(0.5).setInteractive();
    const setBtn = scene.add.text(187, settingsY, TRANSLATIONS[lang].settings, btnStyle).setOrigin(0.5).setInteractive();
    const soundBtn = scene.add.text(320, 185, isSoundOn ? '🔊' : '🔇', { fontSize: '18px', fill: '#ffffff', backgroundColor: '#222', padding: 8, fontFamily: fontUI }).setOrigin(0.5).setInteractive();
    const rulesBtn = scene.add.text(102, 633, TRANSLATIONS[lang].rules, { fontSize: '13px', fill: '#d3b4ff', backgroundColor: '#23142f', padding: 8, fontFamily: fontUI, fontWeight: 'bold' }).setOrigin(0.5).setInteractive();
    const topBtn = scene.add.text(274, 633, TRANSLATIONS[lang].top, { fontSize: '13px', fill: '#ffff00', backgroundColor: '#333300', padding: 8, fontFamily: fontUI, fontWeight: 'bold' }).setOrigin(0.5).setInteractive();
    scene.tweens.add({ targets: [startPulse, startBtn], scaleX: 1.03, scaleY: 1.03, alpha: { from: 0.92, to: 1 }, duration: 850, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
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
    soundBtn.on('pointerdown', () => { 
        isSoundOn = !isSoundOn; 
        soundBtn.setText(isSoundOn ? '🔊' : '🔇'); 
        if (!isSoundOn) scene.sound.stopAll(); 
        else ensureBgm(scene);
        saveProgress(); 
        if (typeof submitScore === 'function') submitScore().catch(e => {});
    });
    hangarBtn.on('pointerdown', () => { closeMenu(); showHangar(scene, menu); });
    shopBtn.on('pointerdown', () => { closeMenu(); showShop(scene, menu); });
    setBtn.on('pointerdown', () => { closeMenu(); showSettings(scene, menu); });
    rulesBtn.on('pointerdown', () => { closeMenu(); showRules(scene, menu); });
    topBtn.on('pointerdown', () => { closeMenu(); showLeaderboard(scene, menu); });
    menu.add([bg, decoLines, topGlow, heroGlow, heroAura, heroFrame, showcaseTrail, showcaseShip, title, langBtn, communityBtn, profileBtn, loadoutLabel, loadoutStats, flavorText, startPulse, startBtn, hangarBtn, shopBtn, setBtn, soundBtn, rulesBtn, topBtn, questsBtn]);
    if (droneOrbit) menu.add(droneOrbit);
    menu.setAlpha(0);
    menu.iterate(child => {
        if (!child || child === bg) return;
        child.y += 12;
        child.alpha = 0;
    });
    scene.tweens.add({ targets: menu, alpha: 1, duration: 260, ease: 'Quad.easeOut' });
    let revealIndex = 0;
    menu.iterate(child => {
        if (!child || child === bg) return;
        scene.tweens.add({
            targets: child,
            y: child.y - 12,
            alpha: 1,
            duration: 260,
            delay: 40 + revealIndex * 18,
            ease: 'Quad.easeOut'
        });
        revealIndex += 1;
    });
}

function showDailyQuests(scene, mainMenu) {
    const overlay = scene.add.container(0, 0).setDepth(4000);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.98).fillRect(0, 0, 375, 667);
    const fontUI = '"Orbitron", sans-serif';
    const title = scene.add.text(187, 50, TRANSLATIONS[lang].daily_quests, { fontSize: '22px', fill: '#ffaa00', fontWeight: 'bold', fontFamily: fontUI }).setOrigin(0.5);
    overlay.add([bg, title]);
    const quests = [
        { key: 'kill50', icon: '💀', color: '#ff6666' },
        { key: 'noshield', icon: '🛡️', color: '#66aaff' },
        { key: 'combo15', icon: '🔥', color: '#ffff66' },
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
    const fontUI = '"Orbitron", sans-serif';
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
    const fontUI = '"Orbitron", sans-serif';
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
        { key: 'pixel', c: 0x00ff00, t: TRANSLATIONS[lang].rule_slowmo, scale: 1.6 },
        { key: 'wall', c: 0x00ffff, t: lang === 'ru' ? 'ЭЛИТНЫЙ УЗЕЛ (3 удара): +25 💰' : 'ELITE NODE (3 hits): +25 💰', scale: 0.8 },
        { key: 'ui_crystal', c: 0xffffff, t: TRANSLATIONS[lang].rule_community, scale: 1.5 }
    ];
    itemsList.forEach((item, i) => { 
        let y = scrollAreaTop + currentY + 20; 
        if (item.key === 'ui_crystal') {
            // Р В Р С‘РЎРѓРЎС“Р ВµР С РЎРЊР СР С•Р Т‘Р В·Р С‘ Р Р†Р СР ВµРЎРѓРЎвЂљР С• РЎРѓР С—РЎР‚Р В°Р в„–РЎвЂљР В°
            let icon = scene.add.text(75, y, '💎', { fontSize: '18px' }).setOrigin(0.5);
            contentContainer.add(icon);
        } else {
            let icon = scene.add.sprite(75, y, item.key).setTint(item.c); 
            icon.setScale(item.scale || (item.key === 'pixel' ? 1.8 : 0.6)); 
            if (item.angle) icon.setAngle(item.angle); 
            
            // Р вЂўРЎРѓР В»Р С‘ РЎРЊРЎвЂљР С• РЎРЊР В»Р С‘РЎвЂљР Р…РЎвЂ№Р в„– РЎС“Р В·Р ВµР В», Р Т‘Р С•Р В±Р В°Р Р†Р В»РЎРЏР ВµР С РЎРѓР С‘РЎРЏР Р…Р С‘Р Вµ Р С‘ Р Р† Р С—РЎР‚Р В°Р Р†Р С‘Р В»Р В°РЎвЂ¦
            if (item.t.includes("ЭЛИТ") || item.t.includes("ELITE")) {
                const rulesGlow = scene.add.circle(75, y, 15, 0x00ffff, 0.3);
                scene.tweens.add({ targets: rulesGlow, alpha: 0.6, scale: 1.5, duration: 800, yoyo: true, repeat: -1 });
                contentContainer.add(rulesGlow);
            }
            
            contentContainer.add(icon);
        }
        let txt = scene.add.text(105, y, item.t, { fontSize: '11px', fill: '#fff', fontFamily: fontUI, wordWrap: { width: 240 } }).setOrigin(0, 0.5);
        contentContainer.add(txt); 
        currentY += 35; 
    });
    currentY += 5;
    const comboTip = scene.add.text(187, scrollAreaTop + currentY, TRANSLATIONS[lang].combo_tip || '🔥 COMBO: Evade obstacles to build, resets on hit!', { fontSize: '10px', fill: '#ffff00', fontFamily: fontUI, align: 'center', wordWrap: { width: 320 } }).setOrigin(0.5); contentContainer.add(comboTip); currentY += 25;
    currentY += 15;
    const stagesTitle = scene.add.text(187, scrollAreaTop + currentY, TRANSLATIONS[lang].rules_alerts, { fontSize: '14px', fill: '#ff00ff', fontWeight: 'bold' }).setOrigin(0.5); contentContainer.add(stagesTitle); currentY += 28;
    const stagesBg = scene.add.rectangle(187, scrollAreaTop + currentY + 75, 340, 150, 0x110011, 0.8).setStrokeStyle(1, 0xff00ff, 0.5); contentContainer.add(stagesBg);
    const stagesDesc = scene.add.text(187, scrollAreaTop + currentY + 75, `${TRANSLATIONS[lang].rules_sec_15}\n${TRANSLATIONS[lang].rules_sec_20}\n${TRANSLATIONS[lang].rules_sec_30}\n${TRANSLATIONS[lang].rules_sec_35}\n${TRANSLATIONS[lang].rules_sec_40}\n${TRANSLATIONS[lang].rules_sec_50}\n${TRANSLATIONS[lang].rules_sec_60}\n${TRANSLATIONS[lang].rules_sec_70}`, { fontSize: '9px', fill: '#ffaa00', fontFamily: fontUI, align: 'center', lineSpacing: 4, wordWrap: { width: 310 } }).setOrigin(0.5, 0.5); contentContainer.add(stagesDesc); currentY += 165;
    currentY += 15;
    const strategyText = TRANSLATIONS[lang].strategy_tip;
    const strategyBoxH = 55;
    const shopBox = scene.add.rectangle(187, scrollAreaTop + currentY + strategyBoxH/2, 310, strategyBoxH, 0x00ffff, 0.05).setStrokeStyle(1, 0x00ffff); const shopTxt = scene.add.text(187, scrollAreaTop + currentY + strategyBoxH/2, strategyText, { fontSize: '11px', fill: '#00ffff', align: 'center', fontFamily: fontUI, wordWrap: { width: 280 } }).setOrigin(0.5); contentContainer.add([shopBox, shopTxt]); currentY += strategyBoxH + 15;
    
    const hTitle = scene.add.text(187, scrollAreaTop + currentY, lang === 'ru' ? '--- ПИЛОТНЫЕ ПРИВИЛЕГИИ ---' : '--- PILOT PRIVILEGES ---', { fontSize: '14px', fill: '#ffff00', fontWeight: 'bold' }).setOrigin(0.5); contentContainer.add(hTitle); currentY += 30;
    const bonusText = (lang === 'ru' 
        ? '• СООБЩЕСТВО: скин ELITE + 1000 💰 за 💎\n• РЕФЕРАЛЫ: +1500 💰 за каждого друга!\n• ЛОГИН: заходи 7 дней подряд и получи 3000 💰'
        : '• COMMUNITY: ELITE skin + 1000 💰 for 💎\n• REFERRALS: +1500 💰 per invited friend!\n• LOGIN: Enter 7 days in a row for 3000 💰');
    const bonusTxt = scene.add.text(187, scrollAreaTop + currentY, bonusText, { fontSize: '11px', fill: '#ffffff', fontFamily: fontUI, align: 'left', lineSpacing: 5 }).setOrigin(0.5); contentContainer.add(bonusTxt); currentY += 60;

    // --- ОБУЧЕНИЕ (РУКА) — внизу контента ---
    const handGlow = scene.add.circle(187, scrollAreaTop + currentY + 30, 16, 0x00ffff, 0.15);
    const hand = scene.add.circle(187, scrollAreaTop + currentY + 30, 10, 0x00ffff, 0.8);
    scene.tweens.add({
        targets: [hand, handGlow],
        x: { from: 130, to: 244 },
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    const handTxt = scene.add.text(187, scrollAreaTop + currentY + 47, TRANSLATIONS[lang].slide, {
        fontSize: '12px',
        fill: '#00ffff',
        fontFamily: fontUI,
        fontWeight: 'bold'
    }).setOrigin(0.5);

    contentContainer.add([handGlow, hand, handTxt]); currentY += 80;    
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
    const bg = scene.add.graphics().fillStyle(0x03060b, 0.92).fillRect(0, 0, 375, 667);
    bg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 375, 667), Phaser.Geom.Rectangle.Contains);
    const fontUI = '"Orbitron", sans-serif';
    const glow = scene.add.ellipse(187, 150, 280, 130, 0x00e5ff, 0.12);
    const panel = scene.add.rectangle(187, 325, 320, 430, 0x0a1119, 0.92).setStrokeStyle(2, 0x00ffff, 0.8);
    const heroFrame = scene.add.rectangle(187, 170, 170, 95, 0x08141d, 0.9).setStrokeStyle(2, 0xff00ff, 0.55);
    const heroShip = scene.add.sprite(187, 170, player.texture.key).setScale(2.2).setAngle(-5);
    scene.tweens.add({ targets: heroShip, y: 164, angle: 5, duration: 1350, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const title = scene.add.text(187, 80, lang === 'ru' ? 'БЫСТРЫЙ СТАРТ' : 'QUICK START', { fontSize: '28px', fill: '#00ffff', fontWeight: 'bold', fontFamily: fontUI, stroke: '#00141e', strokeThickness: 4 }).setOrigin(0.5);
    const subtitle = scene.add.text(187, 115, lang === 'ru' ? '30 секунд, и ты уже на арене' : '30 seconds and you are in the arena', { fontSize: '14px', fill: '#b5efff', fontFamily: fontUI }).setOrigin(0.5);
    const hand = scene.add.text(120, 430, '👆', { fontSize: '62px' }).setOrigin(0.5);
    scene.tweens.add({ targets: hand, x: { from: 120, to: 250 }, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const tip1Box = scene.add.rectangle(187, 255, 260, 48, 0x10202a, 0.85).setStrokeStyle(1, 0x00ffff, 0.4);
    const tip1 = scene.add.text(187, 255, lang === 'ru' ? 'ВЕДИ КОРАБЛЬ ПАЛЬЦЕМ' : 'DRAG TO MOVE', { fontSize: '18px', fill: '#00ffff', fontWeight: 'bold', fontFamily: fontUI }).setOrigin(0.5);
    const tip2Box = scene.add.rectangle(187, 315, 260, 48, 0x201b10, 0.85).setStrokeStyle(1, 0xffcc33, 0.45);
    const tip2 = scene.add.text(187, 315, lang === 'ru' ? 'КОРАБЛЬ СТРЕЛЯЕТ САМ' : 'AUTO-FIRE IS ON', { fontSize: '17px', fill: '#ffdd66', fontWeight: 'bold', fontFamily: fontUI }).setOrigin(0.5);
    const tip3Box = scene.add.rectangle(187, 375, 260, 48, 0x112015, 0.85).setStrokeStyle(1, 0x00ff88, 0.45);
    const tip3 = scene.add.text(187, 375, lang === 'ru' ? 'ПОБЕДИ ПЕРВОГО БОССА И ПОЛУЧИ НАГРАДУ' : 'BEAT THE FIRST BOSS FOR A STARTER DROP', { fontSize: '14px', fill: '#88ffbf', fontWeight: 'bold', fontFamily: fontUI, align: 'center', wordWrap: { width: 230 } }).setOrigin(0.5);

    const closeBtn = scene.add.rectangle(187, 550, 228, 58, 0x00ff88).setInteractive().setStrokeStyle(3, 0xffffff, 0.9);
    const closeTxt = scene.add.text(187, 550, lang === 'ru' ? 'ВЛЕТЕТЬ В АРЕНУ' : 'ENTER THE ARENA', { fontSize: '20px', fill: '#001d12', fontWeight: 'bold', fontFamily: fontUI }).setOrigin(0.5);

    intro.add([bg, glow, panel, heroFrame, heroShip, title, subtitle, tip1Box, tip1, tip2Box, tip2, tip3Box, tip3, hand, closeBtn, closeTxt]);
    scene.tweens.add({ targets: [closeBtn, glow], scaleX: 1.03, scaleY: 1.03, alpha: { from: 0.92, to: 1 }, duration: 700, yoyo: true, repeat: -1 });

    closeBtn.on('pointerdown', () => { 
        intro.destroy(); 
        localStorage.setItem('GLITCHED_ARENA_INTRO_DONE', 'true'); 
        safeHaptic('notification', '');
    });
}
