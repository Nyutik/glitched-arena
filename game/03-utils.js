// ============================================
// 03-UTILS.JS — Вспомогательные функции
// ============================================
// Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ:
// - playSound, safeHaptic, safeKillTweens, safeRemoveTimer
// - ensureBgm, cleanupScreenFx, clearBattleTexts, resetBossPhrase
// - hasTelegramUser, getTelegramUser
// - saveProgress, loadProgress
// - initDailyLogin, showDailyLoginBonus
// ============================================

function playSound(scene, key, config = {}) {
    if (!isSoundOn || !scene || !scene.sound || !scene.cache.audio.exists(key)) return false;
    scene.sound.play(key, config);
    return true;
}

function hasTelegramUser() {
    return !!window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
}

function getTelegramUser() {
    return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
}

function safeHaptic(type = 'impact', style = 'medium') {
    try {
        const tg = window.Telegram?.WebApp;
        if (!tg || !tg.HapticFeedback) return;
        if (type === 'impact' && tg.HapticFeedback.impactOccurred) { tg.HapticFeedback.impactOccurred(style); return; }
        if (type === 'notification' && tg.HapticFeedback.notificationOccurred) { tg.HapticFeedback.notificationOccurred(style); return; }
    } catch (e) {}
}

function safeKillTweens(scene, target) {
    if (!scene || !scene.tweens || !target) return;
    try { scene.tweens.killTweensOf(target); } catch (e) {}
}

function safeRemoveTimer(timer) {
    if (!timer) return null;
    try { timer.remove(false); } catch (e) {}
    return null;
}

function createSciFiPanel(scene, x, y, width, height, fillColor = 0x0a1119, fillAlpha = 0.9, cornerCut = 12) {
    const points = [
        cornerCut, 0,
        width, 0,
        width, height - cornerCut,
        width - cornerCut, height,
        0, height,
        0, cornerCut
    ];
    const poly = scene.add.polygon(x, y, points, fillColor, fillAlpha);
    poly.setDisplayOrigin(width / 2, height / 2);
    poly.isSciFiPanel = true;
    return poly;
}

function createSciFiButton(scene, x, y, text, width, height, mainColor = 0x00ffff, onClick) {
    const bg = createSciFiPanel(scene, x, y, width, height, PALETTE.panel, 0.9).setStrokeStyle(1, mainColor, 0.7);
    const hexColor = '#' + mainColor.toString(16).padStart(6, '0');
    const txt = scene.add.text(x, y, text, { fontSize: '15px', fontFamily: '"Orbitron", sans-serif', fill: '#ffffff', fontWeight: 'bold' }).setOrigin(0.5);
    
    bg.setInteractive();
    
    bg.on('pointerdown', () => {
        scene.tweens.add({ targets: [bg, txt], scaleX: 0.95, scaleY: 0.95, duration: 60, yoyo: true });
        safeHaptic('impact', 'light');
        if (onClick) scene.time.delayedCall(80, onClick);
    });
    
    return [bg, txt];
}

function ensureBgm(scene) {
    if (!scene || !scene.sound) return;
    const bgm = scene.sound.get('bgm');
    if (!isSoundOn) { if (bgm) bgm.stop(); return; }
    if (!bgm) { scene.sound.play('bgm', { loop: true, volume: 0.15 }); return; }
    if (bgm.isPaused) { bgm.resume(); return; }
    if (!bgm.isPlaying) bgm.play({ loop: true, volume: 0.15 });
}

function cleanupScreenFx(scene) {
    const safeDestroy = (target) => {
        if (!target) return;
        try { safeKillTweens(scene, target); if (target.active || target.scene) target.destroy(); } catch (e) {}
    };
    safeDestroy(ultraLaser); ultraLaser = null;
    if (scene?.ovrText) { safeDestroy(scene.ovrText); scene.ovrText = null; }
    if (Array.isArray(victoryFx)) { victoryFx.forEach(obj => safeDestroy(obj)); victoryFx = []; }
    if (scene?.children?.list?.length) {
        scene.children.list.filter(obj => obj && obj.active && obj.texture && obj.texture.key === 'laser').forEach(obj => safeDestroy(obj));
    }
}

function clearBattleTexts(scene) {
    bossPhraseHideCall = safeRemoveTimer(bossPhraseHideCall);
    victoryTextJitter = safeRemoveTimer(victoryTextJitter);
    if (bossPhraseText) {
        safeKillTweens(scene, bossPhraseText);
        if (bossPhraseText.active) bossPhraseText.setText('').setAlpha(0).setVisible(false).setBackgroundColor(null);
    }
    if (glitchText) {
        safeKillTweens(scene, glitchText);
        if (glitchText.active) glitchText.setText('').setAlpha(1).setVisible(false).setBackgroundColor(null);
    }
}

function resetBossPhrase(scene) {
    bossPhraseHideCall = safeRemoveTimer(bossPhraseHideCall);
    if (!bossPhraseText || !bossPhraseText.active) return;
    safeKillTweens(scene, bossPhraseText);
    bossPhraseText.setText('').setAlpha(0).setVisible(false).setBackgroundColor(null).setScale(1).setY(250);
}

const OFFLINE_TS_KEY = 'GLITCHED_ARENA_LAST_SEEN_AT';

function recordSessionEnd() {
    try {
        localStorage.setItem(OFFLINE_TS_KEY, String(Date.now()));
    } catch (e) {}
}

function prepareOfflineEarnings() {
    pendingOfflineCredits = 0;
    pendingOfflineHours = 0;
    pendingWelcomeBackCredits = 0;
    pendingWelcomeBackHours = 0;
    try {
        const rawTs = localStorage.getItem(OFFLINE_TS_KEY);
        recordSessionEnd();
        if (!rawTs) return;
        const elapsedMs = Date.now() - Number(rawTs);
        if (!Number.isFinite(elapsedMs) || elapsedMs < 20 * 60 * 1000) return;

        const cappedMs = Math.min(elapsedMs, 8 * 60 * 60 * 1000);
        const hours = cappedMs / (60 * 60 * 1000);
        pendingOfflineCredits = Math.max(120, Math.floor(hours * 140));
        pendingOfflineHours = Math.max(0.5, Math.round(hours * 10) / 10);

        if (elapsedMs >= 24 * 60 * 60 * 1000) {
            const welcomeHours = Math.min(elapsedMs / (60 * 60 * 1000), 72);
            pendingWelcomeBackCredits = 350 + Math.floor(welcomeHours * 12);
            pendingWelcomeBackHours = Math.round(welcomeHours);
        }
    } catch (e) {}
}

function maybeShowOfflineEarnings(scene) {
    if (!scene || pendingOfflineCredits <= 0) return;
    showOfflineEarnings(scene, pendingOfflineCredits, pendingOfflineHours);
}

function maybeShowWelcomeBackGift(scene) {
    if (!scene || pendingWelcomeBackCredits <= 0) return;
    showWelcomeBackGift(scene, pendingWelcomeBackCredits, pendingWelcomeBackHours);
}

function showOfflineEarnings(scene, amount, hours) {
    if (!scene || amount <= 0) return;
    const safeHours = Math.max(0.5, Number(hours || 0.5));
    const overlay = scene.add.container(0, 0).setDepth(10020);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.86).fillRect(0, 0, 375, 667);
    bg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 375, 667), Phaser.Geom.Rectangle.Contains);
    const panel = scene.add.rectangle(187, 333, 308, 250, 0x10161f).setStrokeStyle(3, 0x00ff88, 0.9);
    const title = scene.add.text(187, 245, TRANSLATIONS[lang].offline_title || 'IDLE CREDITS', { fontSize: '22px', fontWeight: 'bold', fill: '#00ff88', fontFamily: '"Orbitron", sans-serif' }).setOrigin(0.5);
    const body = scene.add.text(187, 305, TRANSLATIONS[lang].offline_body || 'Your scripts kept mining while you were away.', { fontSize: '15px', fill: '#d8fff1', fontFamily: '"Orbitron", sans-serif', align: 'center', wordWrap: { width: 250 } }).setOrigin(0.5);
    const rewardText = scene.add.text(187, 365, `+${amount} ${TRANSLATIONS[lang].credits}`, { fontSize: '36px', fontWeight: 'bold', fill: '#ffffff', fontFamily: '"Orbitron", sans-serif' }).setOrigin(0.5);
    const hoursText = scene.add.text(187, 410, (TRANSLATIONS[lang].offline_hours || 'Offline: %hours%h').replace('%hours%', safeHours), { fontSize: '14px', fill: '#88ffcc', fontFamily: '"Orbitron", sans-serif' }).setOrigin(0.5);
    const claimBtn = scene.add.rectangle(187, 475, 210, 50, 0x00aa55).setInteractive();
    const claimTxt = scene.add.text(187, 475, TRANSLATIONS[lang].offline_claim || 'COLLECT', { fontSize: '20px', fontWeight: 'bold', fill: '#001a0c', fontFamily: '"Orbitron", sans-serif' }).setOrigin(0.5);

    claimBtn.on('pointerdown', () => {
        coins += amount;
        pendingOfflineCredits = 0;
        pendingOfflineHours = 0;
        recordSessionEnd();
        saveProgress();
        if (typeof updateHudTexts === 'function') updateHudTexts();
        scene.cameras.main.flash(350, 0, 255, 136, 0.28);
        safeHaptic('notification', 'success');
        overlay.destroy();
        if (pendingWelcomeBackCredits > 0) scene.time.delayedCall(220, () => maybeShowWelcomeBackGift(scene));
        if (typeof submitScore === 'function') submitScore().catch(e => console.error('Sync error:', e));
    });

    overlay.add([bg, panel, title, body, rewardText, hoursText, claimBtn, claimTxt]);
    overlay.setAlpha(0);
    scene.tweens.add({ targets: overlay, alpha: 1, duration: 250 });
}

function showWelcomeBackGift(scene, amount, hours) {
    if (!scene || amount <= 0) return;
    const safeHours = Math.max(24, Number(hours || 24));
    const overlay = scene.add.container(0, 0).setDepth(10030);
    const bg = scene.add.graphics().fillStyle(0x02040a, 0.9).fillRect(0, 0, 375, 667);
    bg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 375, 667), Phaser.Geom.Rectangle.Contains);
    const glow = scene.add.ellipse(187, 255, 260, 140, 0xffcc33, 0.12);
    const panel = scene.add.rectangle(187, 333, 310, 280, 0x16120b).setStrokeStyle(3, 0xffcc33, 0.95);
    const title = scene.add.text(187, 225, TRANSLATIONS[lang].welcome_back_title || 'WELCOME BACK', { fontSize: '24px', fontWeight: 'bold', fill: '#ffdd55', fontFamily: '"Orbitron", sans-serif' }).setOrigin(0.5);
    const body = scene.add.text(187, 292, TRANSLATIONS[lang].welcome_back_body || 'Your return triggered a bonus cache from the arena core.', { fontSize: '15px', fill: '#fff4c2', fontFamily: '"Orbitron", sans-serif', align: 'center', wordWrap: { width: 250 } }).setOrigin(0.5);
    const rewardText = scene.add.text(187, 362, `+${amount} ${TRANSLATIONS[lang].credits}`, { fontSize: '38px', fontWeight: 'bold', fill: '#ffffff', fontFamily: '"Orbitron", sans-serif' }).setOrigin(0.5);
    const hoursText = scene.add.text(187, 408, (TRANSLATIONS[lang].welcome_back_hours || 'Away for %hours%h').replace('%hours%', safeHours), { fontSize: '14px', fill: '#ffd56f', fontFamily: '"Orbitron", sans-serif' }).setOrigin(0.5);
    const cacheOuter = scene.add.circle(187, 165, 18, 0xffcc33, 0.18).setStrokeStyle(2, 0xffdd88, 0.8);
    const cacheInner = scene.add.circle(187, 165, 8, 0xffeeaa, 0.95);
    scene.tweens.add({ targets: [glow, cacheOuter], alpha: { from: 0.1, to: 0.24 }, scaleX: 1.08, scaleY: 1.08, duration: 950, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const claimBtn = scene.add.rectangle(187, 475, 220, 52, 0xffcc33).setInteractive();
    const claimTxt = scene.add.text(187, 475, TRANSLATIONS[lang].welcome_back_claim || 'OPEN CACHE', { fontSize: '20px', fontWeight: 'bold', fill: '#2a1e00', fontFamily: '"Orbitron", sans-serif' }).setOrigin(0.5);

    claimBtn.on('pointerdown', () => {
        coins += amount;
        pendingWelcomeBackCredits = 0;
        pendingWelcomeBackHours = 0;
        saveProgress();
        if (typeof updateHudTexts === 'function') updateHudTexts();
        scene.cameras.main.flash(380, 255, 220, 80, 0.3);
        safeHaptic('notification', 'success');
        overlay.destroy();
        if (typeof submitScore === 'function') submitScore().catch(e => console.error('Sync error:', e));
    });

    overlay.add([bg, glow, panel, cacheOuter, cacheInner, title, body, rewardText, hoursText, claimBtn, claimTxt]);
    overlay.setAlpha(0);
    scene.tweens.add({ targets: overlay, alpha: 1, duration: 260 });
}

function getPurchasedUpgradeCount() {
    let total = 0;
    Object.keys(upgradeLevels || {}).forEach(key => {
        total += upgradeLevels[key] || 0;
    });
    return total;
}

function getActiveStarterContract() {
    if (!starterContracts.survive500) return { id: 'survive500', label: TRANSLATIONS[lang].contract_survive500, reward: 120 };
    if (!starterContracts.firstUpgrade) return { id: 'firstUpgrade', label: TRANSLATIONS[lang].contract_firstUpgrade, reward: 150 };
    if (!starterContracts.firstBoss) return { id: 'firstBoss', label: TRANSLATIONS[lang].contract_firstBoss, reward: 250 };
    return null;
}

function processStarterContracts(scene) {
    const checks = [
        { id: 'survive500', done: bestDistance >= 500, reward: 120, label: TRANSLATIONS[lang].contract_survive500 },
        { id: 'firstUpgrade', done: getPurchasedUpgradeCount() > 0, reward: 150, label: TRANSLATIONS[lang].contract_firstUpgrade },
        { id: 'firstBoss', done: achievements.firstBossReward || bestLevel > 1, reward: 250, label: TRANSLATIONS[lang].contract_firstBoss }
    ];

    for (const contract of checks) {
        if (!starterContracts[contract.id] && contract.done) {
            starterContracts[contract.id] = true;
            coins += contract.reward;
            saveProgress();
            if (scene) {
                if (typeof updateHudTexts === 'function') updateHudTexts();
                showQuestComplete(scene, contract.label, contract.reward);
            }
            return true;
        }
    }
    return false;
}

// --- СИСТЕМА СОХРАНЕНИЙ ---

function saveProgress() {
    let currentDist = Math.floor(distance);
    if (currentDist > bestDistance) bestDistance = currentDist;
    localStorage.setItem('GLITCHED_ARENA_MASTER_SAVE_V2', JSON.stringify({
        level, lang, upgradeLevels, bestLevel, coins, bestDistance, maxPlayerHealth,
        isShieldActive, yOffset, currentShape, currentSkin, isDeadInSave: isDead,
        totalDistance, bossesKilled, achievements, currentExplosionColor, lastRunState,
        dailyQuests, starterContracts, lastDailyReset, adWatchedPendingRevive, isDarkMode,
        dailyLoginStreak, lastLoginDate, rankXP, isSoundOn
    }));
}

function loadProgress() {
    console.log('=== loadProgress START ===');
    try {
        if (window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code) {
            lang = (window.Telegram.WebApp.initDataUnsafe.user.language_code === 'ru') ? 'ru' : 'en';
        }
        const saved = localStorage.getItem('GLITCHED_ARENA_MASTER_SAVE_V2');
        if (saved) {
            try {
                const p = JSON.parse(saved);
                if (p.lang) lang = p.lang;
                level = Math.floor(p.level || 1); 
                bestLevel = Math.floor(p.bestLevel || 1); 
                bestDistance = p.bestDistance || 0;
                coins = p.coins || 0; totalDistance = p.totalDistance || 0; bossesKilled = p.bossesKilled || 0;
                achievements = { ...achievements, ...p.achievements };
                maxPlayerHealth = p.maxPlayerHealth || 100; isShieldActive = p.isShieldActive || false;
                currentShape = p.currentShape || 'classic'; currentSkin = p.currentSkin || 'classic';
                yOffset = p.yOffset !== undefined ? p.yOffset : -50; isDead = p.isDeadInSave || false;
                lastRunState = p.lastRunState || { isDead: false, pendingDeath: false };
                adWatchedPendingRevive = p.adWatchedPendingRevive !== undefined ? p.adWatchedPendingRevive : false;
                currentExplosionColor = p.currentExplosionColor || 0xff0000;
                upgradeLevels = { ...upgradeLevels, ...p.upgradeLevels };
                dailyQuests = p.dailyQuests || {};
                starterContracts = { ...starterContracts, ...(p.starterContracts || {}) };
                lastDailyReset = p.lastDailyReset || 0;
                dailyLoginStreak = p.dailyLoginStreak || 0;
                lastLoginDate = p.lastLoginDate || null;
                rankXP = p.rankXP || 0;
                isDarkMode = p.isDarkMode || false;
                if (p.isSoundOn !== undefined) isSoundOn = p.isSoundOn;
                runGoal = 700 + (level - 1) * 100;
            } catch(e) { console.log('[Load] JSON parse error:', e); }
        }
        initDailyQuests();
    } catch(e) { console.log('[Load] Error:', e); }
}

// --- Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В«Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂє Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР Р‹ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎв„ў ---

function getTodayMidnight() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return today.getTime();
}

function initDailyLogin(scene) {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    if (lastLoginDate === todayStr) {
        console.log('[DailyLogin] Already claimed today.');
        scene.time.delayedCall(500, () => {
            if (pendingOfflineCredits > 0) maybeShowOfflineEarnings(scene);
            else if (pendingWelcomeBackCredits > 0) maybeShowWelcomeBackGift(scene);
        });
        return;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastLoginDate === yesterdayStr) {
        dailyLoginStreak = (dailyLoginStreak % 7) + 1;
    } else {
        // Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦ Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’В - Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° 1
        dailyLoginStreak = 1;
    }

    lastLoginDate = todayStr;
    saveProgress();
    if (typeof submitScore === 'function') submitScore().catch(e => console.error('Sync error:', e));
    
    const rewards = [100, 250, 500, 750, 1000, 1500, 3000];
    // Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’В, Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° >= 1 Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°
    const rewardIdx = Math.max(0, dailyLoginStreak - 1);
    const reward = rewards[rewardIdx] || 100;

    scene.time.delayedCall(1500, () => {
        showDailyLoginBonus(scene, dailyLoginStreak, reward);
    });
}

function showDailyLoginBonus(scene, day, reward) {
    const displayDay = day || 1; // Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°: Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р Р†Р вЂљРЎв„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В» 0, Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р Р†Р вЂљРЎв„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’В 1
    const overlay = scene.add.container(0, 0).setDepth(10000);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.85).fillRect(0, 0, 375, 667);
    bg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 375, 667), Phaser.Geom.Rectangle.Contains);
    
    const panel = scene.add.rectangle(187, 333, 300, 350, 0x111111).setStrokeStyle(3, 0x00ffff);
    const title = scene.add.text(187, 210, TRANSLATIONS[lang].daily_reward_title || "DAILY REWARD", { fontSize: '24px', fontWeight: 'bold', fill: '#00ffff', fontFamily: '"Orbitron", sans-serif' }).setOrigin(0.5);
    const dayText = scene.add.text(187, 250, (lang === 'ru' ? `ДЕНЬ ${displayDay}` : `DAY ${displayDay}`), { fontSize: '32px', fontWeight: 'bold', fill: '#ffff00', fontFamily: '"Orbitron", sans-serif' }).setOrigin(0.5);
    const rewardText = scene.add.text(187, 320, '+' + reward + ' ' + TRANSLATIONS[lang].credits, { fontSize: '40px', fontWeight: 'bold', fill: '#ffffff', fontFamily: '"Orbitron", sans-serif' }).setOrigin(0.5);
    
    const claimBtn = scene.add.rectangle(187, 420, 200, 50, 0x00ff00).setInteractive();
    const claimTxt = scene.add.text(187, 420, TRANSLATIONS[lang].claim_btn || (lang === 'ru' ? 'ЗАБРАТЬ' : 'CLAIM'), { fontSize: '20px', fontWeight: 'bold', fill: '#000', fontFamily: '"Orbitron", sans-serif' }).setOrigin(0.5);
    
    claimBtn.on('pointerdown', () => {
        coins += reward;
        saveProgress();
        if (typeof updateHudTexts === 'function') updateHudTexts();
        scene.cameras.main.flash(500, 0, 255, 0, 0.3);
        safeHaptic('notification', '');
        overlay.destroy();
        if (pendingOfflineCredits > 0) scene.time.delayedCall(220, () => maybeShowOfflineEarnings(scene));
        else if (pendingWelcomeBackCredits > 0) scene.time.delayedCall(220, () => maybeShowWelcomeBackGift(scene));
        if (typeof submitScore === 'function') submitScore().catch(e => console.error('Sync error:', e));
    });

    overlay.add([bg, panel, title, dayText, rewardText, claimBtn, claimTxt]);
    overlay.setAlpha(0);
    scene.tweens.add({ targets: overlay, alpha: 1, duration: 300 });
}

window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') recordSessionEnd();
});
window.addEventListener('pagehide', recordSessionEnd);

function initDailyQuests() {
    const now = Date.now();
    const todayMidnight = getTodayMidnight();
    const lastReset = lastDailyReset || 0;
    
    if (lastReset < todayMidnight && now >= todayMidnight) {
        dailyQuests = {
            kill50: { target: 50, current: 0, reward: 150, completed: false },
            noshield: { target: 1, reward: 200, completed: false, started: false },
            combo15: { target: 1, reward: 250, completed: false },
            clearboss: { target: 1, reward: 500, completed: false }
        };
        lastDailyReset = now;
        saveProgress();
    }
}

function checkDailyQuest(scene, questId) {
    const quest = dailyQuests[questId];
    if (!quest || quest.completed) return false;
    
    // Fallback reward values
    const fallbackRewards = { kill50: 150, noshield: 200, combo15: 250, clearboss: 500 };
    const reward = quest.reward || fallbackRewards[questId] || 150;

    if (questId === 'kill50') {
        quest.current++;
        if (quest.current >= quest.target) {
            quest.completed = true;
            coins += reward;
            saveProgress();
            showQuestComplete(scene, TRANSLATIONS[lang].quest_kill50, reward);
            return true;
        }
    } else if (questId === 'noshield' && !isShieldActive && !quest.started) {
        quest.started = true;
        saveProgress();
    } else if (questId === 'noshield' && quest.started && !isShieldActive && isBossFight) {
        quest.completed = true;
        coins += reward;
        saveProgress();
        showQuestComplete(scene, TRANSLATIONS[lang].quest_noshield, reward);
        return true;
    } else if (questId === 'combo15' && combo >= 15) {
        quest.completed = true;
        coins += reward;
        saveProgress();
        showQuestComplete(scene, TRANSLATIONS[lang].quest_combo15, reward);
        return true;
    } else if (questId === 'clearboss') {
        quest.completed = true;
        coins += reward;
        saveProgress();
        showQuestComplete(scene, TRANSLATIONS[lang].quest_clearboss, reward);
        return true;
    }
    return false;
}

function showToast(scene, title, message) {
    if (!scene) return;
    const toast = scene.add.container(187, -100).setDepth(10000);
    const bg = scene.add.rectangle(0, 0, 320, 80, 0x00ff00, 0.9).setStrokeStyle(2, 0xffffff);
    const t1 = scene.add.text(0, -15, title, { fontSize: '18px', fontWeight: 'bold', fill: '#000' }).setOrigin(0.5);
    const t2 = scene.add.text(0, 15, message, { fontSize: '14px', fill: '#000' }).setOrigin(0.5);
    toast.add([bg, t1, t2]);
    scene.tweens.add({
        targets: toast, y: 100, duration: 500, ease: 'Back.easeOut',
        onComplete: () => {
            scene.time.delayedCall(3000, () => {
                scene.tweens.add({ targets: toast, y: -100, alpha: 0, duration: 500, onComplete: () => toast.destroy() });
            });
        }
    });
}

function showQuestComplete(scene, questName, reward) {
    const questBg = scene.add.text(187, 80, '', { fontSize: '14px', fill: '#00ff00', backgroundColor: '#000000aa', padding: { x: 10, y: 6 }, fontFamily: '"Orbitron", sans-serif' }).setOrigin(0.5).setDepth(500);
    const titleText = (lang === 'ru' ? 'ЗАДАНИЕ ВЫПОЛНЕНО!' : 'QUEST COMPLETE!');
    const rewardAmount = (typeof reward === 'number' && reward > 0) ? reward : 150;
    questBg.setText(titleText + ' +' + rewardAmount + ' ' + TRANSLATIONS[lang].credits);
    scene.tweens.add({ targets: questBg, y: 60, alpha: 0, delay: 2500, duration: 500, onComplete: () => questBg.destroy() });
    safeHaptic('notification', '');
}

// Adsgram init
window.addEventListener('load', () => {
    if (window.Adsgram && window.Telegram?.WebApp?.initData) {
        try {
            adController = window.Adsgram.init({ blockId: "27996" });
        } catch (e) {
            console.log("Adsgram init error (probably not in Telegram):", e);
        }
    }
});
