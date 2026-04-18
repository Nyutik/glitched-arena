// ============================================
// 03-UTILS.JS — Утилиты и сохранения
// ============================================
// За что отвечает:
// - playSound, safeHaptic, safeKillTweens, safeRemoveTimer
// - ensureBgm, cleanupScreenFx, clearBattleTexts, resetBossPhrase
// - hasTelegramUser, getTelegramUser
// - saveProgress, loadProgress
// - initDailyLogin, showDailyLoginBonus
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
        dailyQuests, lastDailyReset, adWatchedPendingRevive, isDarkMode,
        dailyLoginStreak, lastLoginDate, rankXP
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
                lastDailyReset = p.lastDailyReset || 0;
                dailyLoginStreak = p.dailyLoginStreak || 0;
                lastLoginDate = p.lastLoginDate || null;
                rankXP = p.rankXP || 0;
                isDarkMode = p.isDarkMode || false;
                runGoal = 700 + (level - 1) * 100;
            } catch(e) { console.log('[Load] JSON parse error:', e); }
        }
        initDailyQuests();
    } catch(e) { console.log('[Load] Error:', e); }
}

// --- ЕЖЕДНЕВНЫЕ ЗАДАНИЯ И ЛОГИН ---

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
        return;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastLoginDate === yesterdayStr) {
        dailyLoginStreak = (dailyLoginStreak % 7) + 1;
    } else {
        dailyLoginStreak = 1;
    }

    lastLoginDate = todayStr;
    saveProgress();
    if (typeof submitScore === 'function') submitScore().catch(e => console.error('Sync error:', e));
    
    const rewards = [100, 250, 500, 750, 1000, 1500, 3000];
    const reward = rewards[dailyLoginStreak - 1] || 100;

    scene.time.delayedCall(1500, () => {
        showDailyLoginBonus(scene, dailyLoginStreak, reward);
    });
}

function showDailyLoginBonus(scene, day, reward) {
    const overlay = scene.add.container(0, 0).setDepth(10000);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.85).fillRect(0, 0, 375, 667);
    bg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 375, 667), Phaser.Geom.Rectangle.Contains);
    
    const panel = scene.add.rectangle(187, 333, 300, 350, 0x111111).setStrokeStyle(3, 0x00ffff);
    const title = scene.add.text(187, 210, TRANSLATIONS[lang].daily_reward_title || "DAILY REWARD", { fontSize: '24px', fontWeight: 'bold', fill: '#00ffff', fontFamily: 'Arial' }).setOrigin(0.5);
    const dayText = scene.add.text(187, 250, (lang === 'ru' ? `ДЕНЬ ${day}` : `DAY ${day}`), { fontSize: '32px', fontWeight: 'bold', fill: '#ffff00', fontFamily: 'Arial' }).setOrigin(0.5);
    const rewardText = scene.add.text(187, 320, `+${reward} 💰`, { fontSize: '40px', fontWeight: 'bold', fill: '#ffffff', fontFamily: 'Arial' }).setOrigin(0.5);
    
    const claimBtn = scene.add.rectangle(187, 420, 200, 50, 0x00ff00).setInteractive();
    const claimTxt = scene.add.text(187, 420, TRANSLATIONS[lang].claim_btn || (lang === 'ru' ? "ЗАБРАТЬ" : "CLAIM"), { fontSize: '20px', fontWeight: 'bold', fill: '#000', fontFamily: 'Arial' }).setOrigin(0.5);
    
    claimBtn.on('pointerdown', () => {
        coins += reward;
        saveProgress();
        if (typeof updateHudTexts === 'function') updateHudTexts();
        scene.cameras.main.flash(500, 0, 255, 0, 0.3);
        if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        overlay.destroy();
        if (typeof submitScore === 'function') submitScore().catch(e => console.error('Sync error:', e));
    });

    overlay.add([bg, panel, title, dayText, rewardText, claimBtn, claimTxt]);
    overlay.setAlpha(0);
    scene.tweens.add({ targets: overlay, alpha: 1, duration: 300 });
}

function initDailyQuests() {
    const now = Date.now();
    const todayMidnight = getTodayMidnight();
    const lastReset = lastDailyReset || 0;
    
    if (lastReset < todayMidnight && now >= todayMidnight) {
        dailyQuests = {
            kill50: { target: 50, current: 0, reward: 150, completed: false },
            noshield: { completed: false, started: false },
            combo15: { completed: false },
            clearboss: { completed: false }
        };
        lastDailyReset = now;
        saveProgress();
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
    const titleText = (lang === 'ru' ? 'ЗАДАНИЕ ВЫПОЛНЕНО!' : 'QUEST COMPLETE!');
    const rewardAmount = typeof reward === 'number' ? reward : 0;
    questBg.setText(`${titleText} +${rewardAmount} 💰`);
    scene.tweens.add({ targets: questBg, y: 60, alpha: 0, delay: 2500, duration: 500, onComplete: () => questBg.destroy() });
    if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.notificationOccurred('success');
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
