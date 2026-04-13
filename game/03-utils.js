// ============================================
// 03-UTILS.JS — Утилиты и сохранения
// ============================================
// За что отвечает:
// - playSound, safeHaptic, safeKillTweens, safeRemoveTimer
// - ensureBgm, cleanupScreenFx, clearBattleTexts, resetBossPhrase
// - hasTelegramUser, getTelegramUser
// - saveProgress, loadProgress
// ============================================

function playSound(scene, key, config = {}) {
    if (!scene || !scene.sound || !scene.cache.audio.exists(key)) return false;
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

// --- СИСТЕМА СОХРАНЕНИЙ ---

function saveProgress() {
    let currentDist = Math.floor(distance);
    if (currentDist > bestDistance) bestDistance = currentDist;
    localStorage.setItem('GLITCHED_ARENA_MASTER_SAVE_V2', JSON.stringify({
        level, lang, upgradeLevels, bestLevel, coins, bestDistance, maxPlayerHealth,
        isShieldActive, yOffset, currentShape, currentSkin, isDeadInSave: isDead,
        totalDistance, bossesKilled, achievements, currentExplosionColor, lastRunState,
        dailyQuests, lastDailyReset, adWatchedPendingRevive, isDarkMode
    }));
}

// --- ЕЖЕДНЕВНЫЕ ЗАДАНИЯ ---

function initDailyQuests() {
    const today = new Date().toDateString();
    if (lastDailyReset !== today) {
        dailyQuests = {
            kill50: { target: 50, current: 0, reward: 150, completed: false },
            noshield: { completed: false, started: false },
            combo15: { completed: false },
            clearboss: { completed: false }
        };
        lastDailyReset = today;
        saveProgress();
    } else {
        if (dailyQuests.noShield && !dailyQuests.noshield) {
            dailyQuests.noshield = { ...dailyQuests.noShield };
            delete dailyQuests.noShield;
        }
        if (dailyQuests.clearBoss && !dailyQuests.clearboss) {
            dailyQuests.clearboss = { ...dailyQuests.clearBoss };
            delete dailyQuests.clearBoss;
        }
    }
}

function checkDailyQuest(scene, questId) {
    const quest = dailyQuests[questId];
    if (!quest || quest.completed) return false;
    
    if (questId === 'kill50') {
        quest.current++;
        if (quest.current >= quest.target) {
            quest.completed = true;
            coins += quest.reward;
            saveProgress();
            showQuestComplete(scene, TRANSLATIONS[lang].quest_kill50, quest.reward);
            return true;
        }
    } else if (questId === 'noshield' && !isShieldActive && !quest.started) {
        quest.started = true;
        saveProgress();
    } else if (questId === 'noshield' && quest.started && !isShieldActive && isBossFight) {
        quest.completed = true;
        coins += quest.reward;
        saveProgress();
        showQuestComplete(scene, TRANSLATIONS[lang].quest_noshield, quest.reward);
        return true;
    } else if (questId === 'combo15' && combo >= 15) {
        quest.completed = true;
        coins += quest.reward;
        saveProgress();
        showQuestComplete(scene, TRANSLATIONS[lang].quest_combo15, quest.reward);
        return true;
    } else if (questId === 'clearboss') {
        quest.completed = true;
        coins += quest.reward;
        saveProgress();
        showQuestComplete(scene, TRANSLATIONS[lang].quest_clearboss, quest.reward);
        return true;
    }
    return false;
}

function showQuestComplete(scene, questName, reward) {
    const questBg = scene.add.text(187, 80, '', { fontSize: '14px', fill: '#00ff00', backgroundColor: '#000000aa', padding: { x: 10, y: 6 }, fontFamily: 'Arial' }).setOrigin(0.5).setDepth(500);
    const titleKey = lang === 'ru' ? 'quest_complete' : 'quest_complete';
    const titleText = TRANSLATIONS[lang][titleKey] || (lang === 'ru' ? 'ЗАДАНИЕ ВЫПОЛНЕНО!' : 'QUEST COMPLETE!');
    questBg.setText(`${titleText} +${reward} 💰`);
    scene.tweens.add({ targets: questBg, y: 60, alpha: 0, delay: 2500, duration: 500, onComplete: () => questBg.destroy() });
    if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.notificationOccurred('success');
}

function saveProgress() {
    let currentDist = Math.floor(distance);
    if (currentDist > bestDistance) bestDistance = currentDist;
    localStorage.setItem('GLITCHED_ARENA_MASTER_SAVE_V2', JSON.stringify({
        level, lang, upgradeLevels, bestLevel, coins, bestDistance, maxPlayerHealth,
        isShieldActive, yOffset, currentShape, currentSkin, isDeadInSave: isDead,
        totalDistance, bossesKilled, achievements, currentExplosionColor, lastRunState,
        dailyQuests, lastDailyReset, rankXP, adWatchedPendingRevive
    }));
}

function loadProgress() {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code) {
        lang = (window.Telegram.WebApp.initDataUnsafe.user.language_code === 'ru') ? 'ru' : 'en';
    }
    const saved = localStorage.getItem('GLITCHED_ARENA_MASTER_SAVE_V2');
    if (saved) {
        const p = JSON.parse(saved);
        if (p.lang) lang = p.lang;
        level = p.level || 1; bestLevel = p.bestLevel || 1; bestDistance = p.bestDistance || 0;
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
        lastDailyReset = p.lastDailyReset || null;
        rankXP = p.rankXP || 0;
        isDarkMode = p.isDarkMode || false;
        runGoal = 700 + (level - 1) * 100;
    }
    initDailyQuests();
}

// Adsgram init
window.addEventListener('load', () => {
    if (window.Adsgram) {
        adController = window.Adsgram.init({ blockId: "25945" });
    }
});