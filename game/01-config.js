// ============================================
// 01-CONFIG.JS — Константы и конфигурация
// ============================================
// За что отвечает:
// - SHARE_LINK, botUrl, ASSETS
// - SKIN_DATA, TRANSLATIONS (ru/en)
// - gameConfig для Phaser.Game
// ============================================

const SHARE_LINK = "https://t.me/GlitchedArenaBot";
const botUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : 'https://glitched-arena.onrender.com';

const ASSETS = {
    BGM: 'assets/Cyberpunk 2.mp3',
    SFX_ULTRA: 'assets/futuristic-cyberpunk-digi-ivvyqv4k.wav',
    SFX_COMBO: 'assets/Cyberpunk_Alert.mp3',
    SFX_NUKE: 'assets/Star_Wars-Siren.mp3'
};

const SKIN_DATA = {
    classic: { body: 0x00ffff, eyes: 0xffffff, trail: 0x00ffff, bullet: 0x00ffff, alpha: 1 },
    phantom: { body: 0x9900ff, eyes: 0x00ffff, trail: 0x9900ff, bullet: 0x9900ff, alpha: 1 },
    gold:    { body: 0xffff00, eyes: 0x000000, trail: 0xffaa00, bullet: 0xffff00, alpha: 1 },
    neon:    { body: 0xff0055, eyes: 0xffffff, trail: 0xff0055, bullet: 0xff0055, alpha: 1 },
    ghost:   { body: 0x00ffff, eyes: 0xff00ff, trail: 0xffffff, bullet: 0xffffff, alpha: 0.5 }
};

const SKINDATA = SKIN_DATA;

const TRANSLATIONS = {
    en: {
        menu_title: "GLITCHED\nARENA", start: ">> START SYSTEM", shop: ">> DATA SHOP",
        hangar: ">> SHIP HANGAR", settings: ">> PILOT SETTINGS", rules: ">> SYSTEM MANUAL",
        top: ">> GLOBAL RANKINGS", audio: "AUDIO", back: "<< BACK TO MENU",
        offset_label: "OFFSET", higher: "HIGHER", lower: "LOWER", apply: "<< APPLY & EXIT",
        share_duel: "⚔️ CHALLENGE FRIEND", profile: "[ PROFILE ]",
        credits: "CREDITS", sector: "SEC", best: "BEST", max_dist: "MAX DIST",
        hp_label: "HP", core_label: "CORE", tap_ultra: "!! TAP TO BLAST !!",
        combo_text: "COMBO", hyper_glitch: "!!! HYPER_GLITCH: 3x GOLD !!!",
        pause_text: "PAUSE", v_on: "ON", v_off: "OFF",
        p1: ["SCANNING...", "TARGET_LOCKED", "DATA_TRESPASSER"],
        p2: ["SYSTEM_OVERLOAD", "CRITICAL_RAGE", "DELETING_YOU"],
        core_destroyed: "CORE DESTROYED!", boss_detected: "MEGA_BOSS_DETECTED",
        defense_engaged: "ELITE_DEFENSE_ENGAGED", critical_race: "CRITICAL_RAGE",
        system_halt: "!! SYSTEM_HALT: CORE_OVERLOAD !!", warning_boss: "!! WARNING !!\nBOSS APPROACHING",
        quantum_alert: "QUANTUM_PHANTOM_DETECTED", integrity_restored: "INTEGRITY RESTORED",
        audio_glitch: "SYSTEM_AUDIO_FAILURE", sys_failure: "!! SYSTEM_FAILURE !!",
        heroic_survival: "HEROIC_SURVIVAL", lost: "CONNECTION_LOST",
        revive_label: "REVIVE", watch_ad_label: "WATCH AD (FREE REBOOT)",
        hard_reboot_label: "HARD REBOOT (SEC 1)",
        share_invite: "I'm on Sector %lvl%! Beat my record of %dist%m in Glitched Arena!",
        share_win_text: "I cleared Sector %lvl% in Glitched Arena! Can you beat it?",
        share_loss_text: "System failure in Sector %lvl%... Can you survive longer?",
        db_connecting: "CONNECTING_TO_DATABASE...", db_empty: "NO RECORDS YET", db_error: "CONNECTION_ERROR: OFFLINE",
        shop_title: "DATA SHOP", maxed: "MAXED", deploy_btn: ">> DEPLOY SECTOR",
        hangar_title: "SHIP HANGAR", hull_type: "--- HULL_TYPE ---", visual_skin: "--- VISUAL_SKIN ---",
        target: "TARGET", suggest: "SUGGEST", classic_box: "CLASSIC BOX", cyan_neon: "CYAN NEON",
        boss_scanning: "SCANNING_SECTOR_", rules_header: "SYSTEM_MANUAL v1.2",
        callsign_label: "--- CALLSIGN ---", tap_edit: "[ TAP TO EDIT ]",
        to_mega_boss: "TO MEGA_BOSS", elite_phase: "ELITE PHASE", distance_to: "DISTANCE TO BOSS",
        purified: "SYSTEM_PURIFIED", magnet_on: "MAGNET_LINK_ACTIVE", time_warp: "TIME_WARP_ACTIVE",
        underst: "[ I UNDERSTAND ]",
        gary_intro: "Look what we have here... a new 'pilot'. Try not to break my system, okay? Use the Credits to upgrade, or you won't last a second. Good luck, meatbag.",
        gary_intro_ship: "Oh, so you named this junk heap «%ship%»? Cute. I hope it burns as beautifully as it's named. Listen up...",
        up_antenna: "ULTRA ANTENNA", desc_antenna: "Ult charges 75% faster",
        up_cannons: "DUAL CANNONS", desc_cannons: "Extreme 3-way firepower",
        up_speed: "SPEED BOOST", desc_speed: "+10% running speed",
        up_hull: "REINFORCED HULL", desc_hull: "+25 Max HP & Full Heal",
        up_shield: "EMERGENCY SHIELD", desc_shield: "Protects from one hit",
        skin_striker: "VOID STRIKER", desc_striker: "Dangerous Triangle (+20% ATK)",
        skin_gold: "GOLD SKIN", desc_gold: "Pure gold style (+10% ATK)",
        skin_ghost: "NEON GHOST", desc_ghost: "Cyberpunk ghost (+15% SPD)",
        up_omega: "OMEGA CORE", desc_omega: "Requires Level 40. Ultra recharges on every minion kill!",
        up_coins: "DATA PACK", desc_coins: "+1000 Credits instantly",
        fx_blue_exp: "CYAN EXPLOSION", desc_blue_exp: "Your ship explodes with neon cyan",
        fx_pink_exp: "PINK EXPLOSION", desc_pink_exp: "Your ship explodes with glitch pink",
        rule_wall: "RED_WALL: Lethal. Avoid it!", rule_coin: "CREDITS: For upgrades.",
        rule_heart: "HEART: +25% Hull Integrity.", rule_nuke: "SYSTEM_NUKE: Purge all threats.",
        rule_magnet: "MAGNET: Pull credits.", rule_slowmo: "SLOW_MO: Stabilize time.",
        rules_alerts: "--- SECTOR_ALERTS ---", slide: "SLIDE TO MOVE",
        rules_sec_15: "SEC 15: MEGA_BOSS (Side Turrets)", rules_sec_20: "SEC 20: ELITE_SHIELDS (Orbital Defense)",
        rules_sec_30: "SEC 30: CORE_OVERLOAD (Bullet Hell)", rules_sec_35: "SEC 35: QUANTUM PHANTOM (Teleport)",
        strategy_tip: "STRATEGY: Visit the DATA_SHOP! Upgrade Firepower, Speed, and install SHIELDS to survive.",
        invite: "👥 INVITE FRIEND +500", invite_done: "INVITATION SENT ✓", claimed: "BONUS CLAIMED ✓",
        active_label: "EQUIPPED", stars_label: "STARS",
        achievementss: "--- ACHIEVEMENTS ---", fx_title: "--- VISUAL FX ---", up_title: "--- SHIP UPGRADES ---",
        fx_rainbow: "RAINBOW TRAIL", desc_rainbow: "Leave a colorful trail behind",
        flawlesst: "FLAWLESS", boss_damage: "Boss: 0 damage",
        tycoon: "TYCOON", rich_credit: "5000 credits",
        marathons: "MARATHON", run_m: "5000m run",
        change_name: "[ CHANGE NAME ]", ship_name: "Enter ship name:"
    },
    ru: {
        menu_title: "ГЛИТЧ\nАРЕНА", start: ">> ЗАПУСК СИСТЕМЫ", shop: ">> МАГАЗИН ДАННЫХ",
        hangar: ">> АНГАР КОРАБЛЯ", settings: ">> КАЛИБРОВКА", rules: ">> ИНСТРУКЦИЯ",
        top: ">> РЕЙТИНГ ПИЛОТОВ", audio: "ЗВУК", back: "<< В ГЛАВНОЕ МЕНЮ",
        offset_label: "ОТСТУП", higher: "ВЫШЕ", lower: "НИЖЕ", apply: "<< ПРИМЕНИТЬ",
        share_duel: "⚔️ ВЫЗВАТЬ НА ДУЭЛЬ", profile: "[ ПРОФИЛЬ ]",
        credits: "КРЕДИТЫ", sector: "СЕКТОР", best: "РЕКОРД", max_dist: "ДИСТАНЦИЯ",
        hp_label: "ОЗ", core_label: "ЯДРО", tap_ultra: "!! ЖМИ ДЛЯ УЛЬТЫ !!",
        combo_text: "КОМБО", hyper_glitch: "!!! ГИПЕР-ГЛИТЧ: 3x ЗОЛОТО !!!",
        pause_text: "ПАУЗА", v_on: "ВКЛ", v_off: "ВЫКЛ",
        p1: ["СКАНИРОВАНИЕ...", "ЦЕЛЬ_ЗАХВАЧЕНА", "НАРУШИТЕЛЬ_ДАННЫХ"],
        p2: ["ПЕРЕГРУЗКА_СИСТЕМЫ", "КРИТИЧЕСКАЯ_ЯРОСТЬ", "УДАЛЕНИЕ_ОБЪЕКТА"],
        core_destroyed: "ЯДРО УНИЧТОЖЕНО!", boss_detected: "ОБНАРУЖЕН_МЕГА_БОСС",
        defense_engaged: "ЭЛИТНАЯ_ЗАЩИТА_АКТИВНА", critical_race: "КРИТИЧЕСКАЯ ЯРОСТЬ",
        system_halt: "!! СИСТЕМНАЯ ОСТАНОВКА: ПЕРЕГРУЗКА ЯДРА !!", warning_boss: "!! ВНИМАНИЕ !!\nБОСС ПРИБЛИЖАЕТСЯ",
        quantum_alert: "ОБНАРУЖЕН_КВАНТОВЫЙ_ФАНТОМ", integrity_restored: "КОРПУС ВОССТАНОВЛЕН",
        audio_glitch: "ОШИБКА_АУДИО_СИСТЕМЫ", sys_failure: "!! СИСТЕМНЫЙ_СБОЙ !!",
        heroic_survival: "ГЕРОИЧЕСКОЕ_ВЫЖИВАНИЕ", lost: "СВЯЗЬ ПОТЕРЯНА",
        revive_label: "ВОСКРЕСНУТЬ", watch_ad_label: "РЕКЛАМА (БЕСПЛАТНЫЙ РЕБУТ)",
        hard_reboot_label: "ХАРД-РЕБУТ (СЕКТОР 1)",
        share_invite: "Я в Секторе %lvl%! Побей мой рекорд в %dist%м в Glitched Arena!",
        share_win_text: "Я зачистил Сектор %lvl% в Глитч Арене! Попробуй повторить!",
        share_loss_text: "Моя система дала сбой в Секторе %lvl%... Кто отомстит за меня?",
        db_connecting: "ПОДКЛЮЧЕНИЕ_К_БАЗЕ_ДАННЫХ...", db_empty: "ЗАПИСЕЙ ПОКА НЕТ", db_error: "ОШИБКА_СВЯЗИ: ОФФЛАЙН",
        shop_title: "МАГАЗИН ДАННЫХ", maxed: "МАКСИМУМ", deploy_btn: ">> В СЛЕД. СЕКТОР",
        hangar_title: "АНГАР КОРАБЛЯ", hull_type: "--- ТИП КОРПУСА ---", visual_skin: "--- ОБЛИК ---",
        target: "ЦЕЛЬ", suggest: "СОВЕТ", classic_box: "КЛАССИКА", cyan_neon: "ГОЛУБОЙ НЕОН",
        boss_scanning: "СЕКТОР_СКАН_", rules_header: "ИНСТРУКЦИЯ v1.2",
        callsign_label: "--- ПОЗЫВНОЙ ---", tap_edit: "[ ТЫКНИ ДЛЯ СМЕНЫ ]",
        to_mega_boss: "ДО МЕГА_БОССА", elite_phase: "ЭЛИТНАЯ ФАЗА", distance_to: "РАССТОЯНИЕ ДО БОССА",
        purified: "СИСТЕМА ОЧИЩЕНА", magnet_on: "МАГНИТНЫЙ ЗАХВАТ", time_warp: "ВРЕМЯ ЗАМЕДЛЕНО",
        underst: "[ Я ПРИНЯЛ ]",
        gary_intro: "Смотрите-ка... новый «пилот». Постарайся не сломать мою систему, ладно? Трать Кредиты на пушки, иначе не продержишься и секунды. Удачи, белковый.",
        gary_intro_ship: "О, ты назвал эту жестянку «%ship%»? Мило. Надеюсь, она горит так же красиво, как и называется. Слушай сюда...",
        up_antenna: "УЛЬТРА-АНТЕННА", desc_antenna: "Зарядка ульты на 75% быстрее",
        up_cannons: "ДВОЙНЫЕ ПУШКИ", desc_cannons: "Тройная огневая мощь",
        up_speed: "УСКОРЕНИЕ", desc_speed: "+10% к скорости полета",
        up_hull: "УСИЛЕННЫЙ КОРПУС", desc_hull: "+25 макс. ОЗ и лечение",
        up_shield: "АВАРИЙНЫЙ ЩИТ", desc_shield: "Защита от одного удара",
        skin_striker: "РАССЕКАТЕЛЬ БЕЗДНЫ", desc_striker: "Форма треугольника (+20% АТК)",
        skin_gold: "ЗОЛОТОЙ ОБЛИК", desc_gold: "Стиль из чистого золота (+10% АТК)",
        skin_ghost: "НЕОНОВЫЙ ПРИЗРАК", desc_ghost: "Призрачный стиль (+15% СКОР)",
        up_omega: "ОМЕГА-ЯДРО", desc_omega: "Доступно с 40 уровня. Ульта восстанавливается при каждом уничтожении миньона!",
        up_coins: "ПАКЕТ ДАННЫХ", desc_coins: "+1000 Кредитов мгновенно",
        fx_blue_exp: "ГОЛУБОЙ ВЗРЫВ", desc_blue_exp: "Корабль взрывается неоновым синим",
        fx_pink_exp: "РОЗОВЫЙ ВЗРЫВ", desc_pink_exp: "Корабль взрывается розовым глитчем",
        rule_wall: "СТЕНА: Смертельно. Избегай!", rule_coin: "КРЕДИТЫ: Для улучшений.",
        rule_heart: "СЕРДЦЕ: +25% прочности.", rule_nuke: "ЯДЕРКА: Очистка экрана.",
        rule_magnet: "МАГНИТ: Притягивает золото.", rule_slowmo: "ЗАМЕДЛЕНИЕ: Контроль времени.",
        rules_alerts: "--- ТРЕВОГИ СЕКТОРОВ ---", slide: "ВЕДИ, ЧТОБЫ ДВИГАТЬСЯ",
        rules_sec_15: "СЕКТОР 15: МЕГА_БОСС (Боковые турели)", rules_sec_20: "СЕКТОР 20: ЭЛИТНЫЕ ЩИТЫ (Орбитальная защита)",
        rules_sec_30: "СЕКТОР 30: ПЕРЕГРУЗКА ЯДРА (Безумный огонь)", rules_sec_35: "СЕКТОР 35: КВАНТОВЫЙ ФАНТОМ (Телепортация)",
        strategy_tip: "СТРАТЕГИЯ: Зайди в МАГАЗИН! Качай пушки, скорость и ставь ЩИТЫ, чтобы выжить.",
        invite: "👥 ПРИГЛАСИТЬ ДРУГА +500", invite_done: "ПРИГЛАШЕНИЕ ОТПРАВЛЕНО ✓", claimed: "БОНУС ПОЛУЧЕН ✓",
        active_label: "ВЫБРАНО", stars_label: "ЗВЕЗДЫ",
        achievementss: "--- ДОСТИЖЕНИЯ ---", fx_title: "--- СПЕЦЭФФЕКТЫ ---", up_title: "--- ПРОКАЧКА КОРАБЛЯ ---",
        fx_rainbow: "РАДУЖНЫЙ ШЛЕЙФ", desc_rainbow: "Радуга тянется за вашим кораблем",
        flawlesst: "БЕЗУПРЕЧНЫЙ", boss_damage: "Босс без урона",
        tycoon: "МАГНАТ", rich_credit: "Накопил 5000$",
        marathons: "МАРАФОНЕЦ", run_m: "5000м за вылет",
        change_name: "[ ИЗМЕНИТЬ ИМЯ ]", ship_name: "Введите имя корабля:"
    }
};