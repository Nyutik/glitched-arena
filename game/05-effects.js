// ============================================
// 05-EFFECTS.JS — Эффекты и визуал
// ============================================
// За что отвечает:
// - showDamageText, showComboEffect
// - triggerVictory, showRewardUI, showAdSafe
// - applyGlitchEffect, startTitleGlitch
// ============================================

function showDamageText(scene, x, y, damage, color = '#00ff00', size = '16px') {
    let txt = scene.add.text(x, y, `-${Math.floor(damage)}`, { fontFamily: '"Orbitron", sans-serif', fontSize: size, fill: color, fontWeight: 'bold', stroke: '#000', strokeThickness: 3, padding: 5 }).setDepth(100);
    scene.tweens.add({ targets: txt, y: y - 100, x: x + Phaser.Math.Between(-40, 40), alpha: 0, scale: size === '26px' ? 1.5 : 1.2, duration: 900, onComplete: () => txt.destroy() });
}

function showComboEffect(scene, distX = 100, distY = 100) {
    if (!scene || !scene.cameras || !scene.cameras.main || !comboPopText || !player) return;
    
    // Near-miss / Hit-stop mechanics
    if (distX < 45 && distY < 30 && scene.physics && scene.physics.world) {
        // Замедляем время (hit-stop)
        const originalTimeScale = scene.physics.world.timeScale;
        scene.physics.world.timeScale = 4; // 4x slower physics
        scene.time.delayedCall(120, () => {
            if (scene && scene.physics && scene.physics.world.timeScale === 4) {
                scene.physics.world.timeScale = 1;
            }
        });

        let dodgeMsg = lang === 'ru' ? "ЧЁТКО!" : "GOOD!";
        let dodgeCol = "#00ff88";
        if (distX <= 22) { dodgeMsg = lang === 'ru' ? "ПУСТОТА!" : "VOID!"; dodgeCol = "#ff00ff"; safeHaptic('impact', 'heavy'); }
        else if (distX <= 32) { dodgeMsg = lang === 'ru' ? "БЕЗУМНО!" : "SICK!"; dodgeCol = "#00ffff"; safeHaptic('impact', 'medium'); }
        else { safeHaptic('impact', 'light'); }

        let pop = scene.add.text(player.x, player.y + 30, dodgeMsg, { fontFamily: '"Orbitron", sans-serif', fontSize: '15px', fill: dodgeCol, fontWeight: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(150);
        scene.tweens.add({ targets: pop, y: player.y + 60, alpha: 0, scale: 1.5, duration: 600, ease: 'Quad.easeOut', onComplete: () => pop.destroy() });
        scene.cameras.main.flash(120, 255, 255, 255, 0.2);
    }

    combo++;
    checkDailyQuest(scene, 'combo15');
    playSound(scene, 'sfx_combo', { volume: 0.3 });
    comboPopText.setPosition(player.x, player.y - 60).setText(`+${TRANSLATIONS[lang].combo_text} x${combo}`).setAlpha(1).setScale(1.2).setFill('#00ff00');
    
    scene.tweens.killTweensOf(comboPopText);
    scene.tweens.add({ targets: comboPopText, y: player.y - 120, alpha: 0, scale: 1.6, duration: 600, ease: 'Quad.easeOut' });
    if (combo % 5 === 0) { const reward = 15; coinsThisRun += reward; updateHudTexts(); scene.cameras.main.flash(100, 255, 255, 255, 0.3); }
}

async function triggerVictory(scene) {
    if (!scene || isDead || isVictory) return;
    isVictory = true; isBossFight = false; isPhase2 = false; isPhase3 = false;
    try { clearBattleTexts(scene); cleanupScreenFx(scene); if (roadBar) roadBar.clear().setVisible(false); if (overdriveBar) overdriveBar.clear().setVisible(false); if (scene.overheadGfx) scene.overheadGfx.clear(); if (bHealthLabel) bHealthLabel.setVisible(false); if (pHealthLabel) pHealthLabel.setVisible(false); if (distanceText) distanceText.setVisible(false); } catch (e) { console.warn("Cleanup error:", e); }
    if (player) player.setVisible(false); if (trailEmitter) trailEmitter.stop();
    if (bossTrail) { bossTrail.stop(); bossTrail.setVisible(false); }
    scene.shootEvent = safeRemoveTimer(scene.shootEvent); scene.bossShootEvent = safeRemoveTimer(scene.bossShootEvent); scene.turretShootEvent = safeRemoveTimer(scene.turretShootEvent); scene.minionTimer = safeRemoveTimer(scene.minionTimer); scene.phraseTimer = safeRemoveTimer(scene.phraseTimer); scene.teleportEvent = safeRemoveTimer(scene.teleportEvent); scene.itemTimer = safeRemoveTimer(scene.itemTimer); itemsTimer = safeRemoveTimer(itemsTimer); victoryTextJitter = safeRemoveTimer(victoryTextJitter);
    scene.droneTimer = safeRemoveTimer(scene.droneTimer); scene.missileTimer = safeRemoveTimer(scene.missileTimer); scene.mercenaryTimer = safeRemoveTimer(scene.mercenaryTimer); scene.healTimer = safeRemoveTimer(scene.healTimer);
    try { bullets?.clear(true, true); playerBullets?.clear(true, true); playerMissiles?.clear(true, true); minionBullets?.clear(true, true); minions?.clear(true, true); obstacles?.clear(true, true); bossShields?.clear(true, true); } catch (e) { console.warn("Group clear error:", e); }
    if (bossTurretL) { bossTurretL.destroy(); bossTurretL = null; } if (bossTurretR) { bossTurretR.destroy(); bossTurretR = null; }
    if (secondCore) { secondCore.destroy(); secondCore = null; } if (scene.dualCoreShootTimer) { scene.dualCoreShootTimer.remove(); scene.dualCoreShootTimer = null; }
    const completedLevel = level; level++; runGoal = 700 + (level - 1) * 100; 
    bestLevel = Math.max(bestLevel, completedLevel); bossesKilled += 1; bossesSurvived += 1;
    if (typeof logMetric === 'function') logMetric('boss_killed', `sector:${completedLevel}`);
    awardRankXP(scene, 100, 'boss'); 
    if (bossDamageTaken === 0 && !achievements.flawless) { achievements.flawless = true; showAchievement(scene, 'flawless', TRANSLATIONS[lang].flawlesst, TRANSLATIONS[lang].boss_damage); }
    checkAchievements(scene);
    checkDailyQuest(scene, 'clearboss');
    if (!isShieldActive && upgradeLevels.shield > 0) checkDailyQuest(scene, 'noshield');
    let rewardInfo = null;
    if (completedLevel === 1 && !achievements.firstBossReward) {
        achievements.firstBossReward = true;
        upgradeLevels.helper_drone = Math.max(upgradeLevels.helper_drone || 0, 1);
        upgradeLevels.skin_gold = Math.max(upgradeLevels.skin_gold || 0, 1);
        currentSkin = 'gold';
        if (typeof refreshPlayerAppearance === 'function') refreshPlayerAppearance(scene);
        coinsThisRun += 300;
            rewardInfo = {
                title: lang === 'ru' ? 'СТАРТОВЫЙ НАБОР РАЗБЛОКИРОВАН' : 'STARTER DROP UNLOCKED',
                body: lang === 'ru'
                    ? 'ЗОЛОТОЙ ОБЛИК + БОЕВОЙ ДРОН + 300 КРЕДИТОВ'
                    : 'GOLD SKIN + COMBAT DRONE + 300 credits'
            };
    }
    saveProgress();
    if (hasTelegramUser()) submitScore({ level: level, best_level: bestLevel });
    let explodeCol = currentExplosionColor || 0xff0000;
    if (currentExplosionColor === -1) explodeCol = rainbowColors[Phaser.Math.Between(0, rainbowColors.length - 1)];
    const hexColor = `#${explodeCol.toString(16).padStart(6, '0')}`;
    if (boss && boss.active) {
        scene.tweens.add({ targets: boss, scale: 0.1, alpha: 0.5, duration: 600, ease: 'Back.easeIn', onComplete: () => {
            scene.cameras.main.flash(800, 255, 255, 255, 0.5); scene.cameras.main.shake(1000, 0.04);
            if (boss) boss.setVisible(false);
            for (let i = 0; i < 12; i++) {
                let rayCol = currentExplosionColor === -1 ? rainbowColors[i % rainbowColors.length] : explodeCol;
                let ray = scene.add.rectangle(boss.x, boss.y, 2, 1000, rayCol).setOrigin(0.5, 0.5).setAlpha(0.8).setDepth(6000); 
                ray.angle = i * 30; 
                scene.tweens.add({ targets: ray, width: 50, alpha: 0, duration: 1500, ease: 'Cubic.easeOut', onComplete: () => ray.destroy() }); 
            }
            for (let i = 0; i < 4; i++) { let wave = scene.add.circle(boss.x, boss.y, 10, explodeCol, 0.4).setDepth(5500).setStrokeStyle(4, 0xffffff); scene.tweens.add({ targets: wave, radius: 800, alpha: 0, duration: 1000 + (i * 200), onComplete: () => wave.destroy() }); }
            for (let i = 0; i < 40; i++) { let chunk = scene.add.rectangle(boss.x, boss.y, 8, 8, i % 2 === 0 ? explodeCol : 0xffffff).setDepth(5000); scene.physics.add.existing(chunk); let angle = Math.random() * Math.PI * 2; let speed = Phaser.Math.Between(400, 1000); chunk.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed); scene.tweens.add({ targets: chunk, alpha: 0, scale: 0, duration: 2000, onComplete: () => chunk.destroy() }); }
            let vText = scene.add.text(187, 333, TRANSLATIONS[lang].core_destroyed, { fontFamily: 'Courier New', fontSize: '32px', fill: '#ffffff', fontWeight: 'bold', stroke: hexColor, strokeThickness: 12, align: 'center', wordWrap: { width: 340 } }).setOrigin(0.5).setDepth(10000);
            scene.tweens.add({ targets: vText, scale: {from: 0.8, to: 1.1}, duration: 200, yoyo: true, repeat: -1 });
            scene.time.delayedCall(2500, () => { if (vText) vText.destroy(); showRewardUI(scene, rewardInfo); });
        }});
    } else { showRewardUI(scene, rewardInfo); }
}

function showRewardUI(scene, rewardInfo = null) {
    clearBattleTexts(scene); cleanupScreenFx(scene);
    const container = scene.add.container(0, 0).setDepth(5001);
    const bg = scene.add.graphics().fillStyle(0x000000, 0.9).fillRect(0, 0, 375, 667);
    container.add(bg);
    const earnedAmount = coinsThisRun;
    let rewardPanel = null;
    let rewardTitle = null;
    let rewardBody = null;
    if (rewardInfo) {
        rewardPanel = scene.add.rectangle(187, 252, 345, 132, 0x002233, 0.45).setStrokeStyle(2, 0x00ffff, 0.7);
        rewardTitle = scene.add.text(187, 210, rewardInfo.title, { fontSize: '22px', fill: '#00ffff', fontWeight: 'bold', fontFamily: '"Orbitron", sans-serif', align: 'center', wordWrap: { width: 320 } }).setOrigin(0.5);
        rewardBody = scene.add.text(187, 258, rewardInfo.body, { fontSize: '16px', fill: '#ffffff', fontWeight: 'bold', fontFamily: '"Orbitron", sans-serif', align: 'center', wordWrap: { width: 320 } }).setOrigin(0.5);
    }
    const info = scene.add.text(187, 330, `${lang === 'ru' ? 'ДОБЫТО' : 'COLLECTED'}: ${earnedAmount} ${TRANSLATIONS[lang].credits}`, { fontSize: '24px', fill: '#ffff00', fontWeight: 'bold', fontFamily: '"Orbitron", sans-serif' }).setOrigin(0.5);
    const doubleBtn = scene.add.text(187, 420, lang === 'ru' ? 'x2 ЗА РЕКЛАМУ' : 'x2 WITH AD', { fontSize: '20px', fill: '#ffffff', backgroundColor: '#004400', padding: { left: 15, right: 15, top: 10, bottom: 10 }, fontWeight: 'bold', fontFamily: '"Orbitron", sans-serif' }).setOrigin(0.5).setInteractive();
    const collectBtn = scene.add.text(187, 500, lang === 'ru' ? 'ПРОСТО ЗАБРАТЬ' : 'JUST COLLECT', { fontSize: '16px', fill: '#aaaaaa', padding: { left: 10, right: 10, top: 8, bottom: 8 }, fontFamily: '"Orbitron", sans-serif' }).setOrigin(0.5).setInteractive();
    const duelBtn = scene.add.text(187, 560, TRANSLATIONS[lang].share_duel, { fontSize: '14px', fill: '#00ffff', padding: 10, fontFamily: '"Orbitron", sans-serif' }).setOrigin(0.5).setInteractive();
    container.add([rewardPanel, rewardTitle, rewardBody, info, doubleBtn, collectBtn, duelBtn].filter(Boolean));
    if (rewardInfo) {
        info.setY(335);
        doubleBtn.setY(430);
        collectBtn.setY(505);
        duelBtn.setY(565).setText(TRANSLATIONS[lang].share_duel);
    }
    duelBtn.on('pointerdown', () => shareDuel('win'));
    doubleBtn.on('pointerdown', () => { 
        doubleBtn.disableInteractive(); collectBtn.disableInteractive(); 
        showAdSafe(() => finalizeCollection(earnedAmount * 2)); 
    });
    collectBtn.on('pointerdown', () => { 
        doubleBtn.disableInteractive(); collectBtn.disableInteractive(); 
        finalizeCollection(earnedAmount); 
    });

    async function finalizeCollection(finalSum) {
        const oldCoins = coins;
        coins += finalSum;
        coinsThisRun = 0;
        if (coins >= 5000 && !achievements.rich) achievements.rich = true;
        isVictory = true; isShopOpen = false; isDead = false; isBossFight = false; isPhase2 = false; isPhase3 = false; isStarted = false;
        console.log(`[Reward] Finalizing: ${oldCoins} + ${finalSum} = ${coins}`);
        clearBattleTexts(scene); cleanupScreenFx(scene);
        if (boss && boss.active) { safeKillTweens(scene, boss); boss.setVisible(false); boss.setActive(true); boss.setAlpha(1); boss.setPosition(187, -200); boss.setAngle(0); boss.clearTint(); }
        saveProgress(); 
        if (hasTelegramUser()) {
            try {
                await submitScore();
                console.log('[Reward] Cloud sync successful');
            } catch (e) {
                console.error('[Reward] Cloud sync failed', e);
            }
        }
        container.destroy(); 
        showShop(scene, null, true);
    }
}

async function showAdSafe(onDone) {
    try {
        const tgUser = getTelegramUser();
        if (!window.Telegram?.WebApp || !tgUser?.id) { console.log('Adsgram unavailable outside Telegram, skip ad'); onDone?.(); return; }
        if (!window.adController || typeof window.adController.show !== 'function') { console.log('Adsgram controller missing, skip ad'); onDone?.(); return; }
        const result = await window.adController.show();
        if (result?.done) onDone?.(); else alert(lang === 'ru' ? 'Досмотрите рекламу до конца!' : 'Watch till the end!');
    } catch (e) { console.log('Adsgram failure - silent bypass:', e); onDone?.(); }
}

function applyGlitchEffect(scene, textObject) {
    if (!textObject || !textObject.active) return;
    const originalX = textObject.x; const originalColor = textObject.style.color;
    scene.time.delayedCall(1, () => { textObject.setX(originalX + Phaser.Math.Between(-8, 8)); textObject.setFill('#ff00ff'); textObject.setAlpha(0.7); });
    scene.time.delayedCall(60, () => { textObject.setX(originalX); textObject.setFill(originalColor); textObject.setAlpha(1); });
}

function startTitleGlitch(scene, title) {
    if (scene.glitchTimer) scene.glitchTimer.remove();
    scene.glitchTimer = scene.time.addEvent({ delay: 2000, callback: () => applyGlitchEffect(scene, title), callbackScope: scene, loop: true });
}
