import os
import asyncio
from datetime import datetime
from typing import List, Optional
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.types import LabeledPrice, PreCheckoutQuery, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
import uvicorn

# 1. Загрузка настроек
load_dotenv()
BOT_TOKEN = os.getenv("BOT_TOKEN")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScoreData(BaseModel):
    telegram_id: int
    username: str
    score: int
    level: int
    best_level: Optional[int] = 1
    explosion_color: Optional[int] = 0xff0000
    skin: str
    shape: str
    coins: Optional[int] = 0
    upgrades: Optional[dict] = {}
    total_dist: Optional[int] = 0
    bosses_killed: Optional[int] = 0
    ship_name: Optional[str] = "RAZOR-01"
    achievements: Optional[dict] = {}
    rank_xp: Optional[int] = 0
    daily_quests: Optional[dict] = {}
    last_daily_reset: Optional[int] = 0
    daily_login_streak: Optional[int] = 0
    last_login_date: Optional[str] = None
    lang: Optional[str] = 'en'

class MetricData(BaseModel):
    telegram_id: int
    event_type: str
    level: int
    score: int
    extra: Optional[str] = None

# --- API ЭНДПОИНТЫ ---

@app.post("/log_metric")
async def log_metric(data: MetricData):
    try:
        with open("game_metrics.log", "a", encoding="utf-8") as f:
            f.write(f"{datetime.now().isoformat()} | User: {data.telegram_id} | Event: {data.event_type} | Level: {data.level} | Score: {data.score} | Extra: {data.extra}\n")
        return {"status": "ok"}
    except Exception as e:
        print(f"Metrics log error: {e}")
        return {"status": "error"}

@app.get("/get_invoice")
async def get_invoice(item_type: str, user_id: int, username: str):
    # --- СНИЖЕННЫЕ ЦЕНЫ (STARS) ---
    prices_map = {
        "skin_gold": 49, "skin_ghost": 49, "skin_crimson": 75, "skin_void": 75,
        "skin_plasma": 75, "skin_solar": 75, "skin_frost": 75,
        "skin_rainbow": 99, "skin_void_premium": 149, "skin_crystal": 125,
        "skin_striker": 299, 
        "ship_tank": 199, "ship_dart": 149, "ship_viper": 299, "ship_phase": 349,
        "bundle_starter": 49, "bundle_warrior": 99, "bundle_legend": 199,
        "omega": 99, "buy_coins": 25, 
        "fx_blue": 30, "fx_pink": 30, "fx_gold": 50, "fx_green": 50, "fx_red": 50,
        "helper_drone": 149, "helper_autoshield": 99, "helper_autobomb": 199, "helper_autoheal": 125,
        "up_extralife": 299, "up_doubleDMG": 249, "up_enhanced": 499
    }
    amount = prices_map.get(item_type, 49)
    print(f"[Invoice] item={item_type}, amount={amount}")

    payload = f"{item_type}:{user_id}"

    invoice_link = await bot.create_invoice_link(
        title=f"Glitched Arena: {item_type}",
        description=f"Цифровой апгрейд для {username}",
        payload=payload,
        provider_token="",
        currency="XTR",
        prices=[LabeledPrice(label="Покупка", amount=amount)]
    )
    return {"url": invoice_link}


@app.get("/check_community/{user_id}")
async def check_community(user_id: int):
    try:
        try:
            member = await bot.get_chat_member(chat_id="@GlitchedArenaCommunity", user_id=user_id)
        except Exception:
            return {"status": "error", "message": "Could not verify subscription"}
        
        if member.status in ["member", "administrator", "creator"]:
            res = supabase.table("leaderboard").select("upgrades, coins").eq("telegram_id", user_id).execute()
            if not res.data: return {"status": "error", "message": "User not found"}
            
            user_data = res.data[0]
            upgrades = user_data.get("upgrades") or {}
            if upgrades.get("skin_elite"): return {"status": "already_claimed"}
            
            upgrades["skin_elite"] = 1
            supabase.table("leaderboard").update({"upgrades": upgrades, "coins": user_data.get("coins", 0) + 1000, "skin": "elite"}).eq("telegram_id", user_id).execute()
            return {"status": "success"}
        else:
            return {"status": "not_member"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/submit_score")
async def submit_score(data: ScoreData):
    try:
        current_date = datetime.now().isoformat()
        res = supabase.table("leaderboard").select("*").eq("telegram_id", data.telegram_id).execute()
        
        if not res.data:
            # Новый пилот
            supabase.table("leaderboard").insert({
                "telegram_id": data.telegram_id, "username": data.username,
                "score": data.score, "level": data.level, "best_level": data.best_level,
                "coins": data.coins, "upgrades": data.upgrades, "skin": data.skin,
                "shape": data.shape, "explosion_color": data.explosion_color,
                "achievements": data.achievements, "total_dist": data.total_dist,
                "bosses_killed": data.bosses_killed, "rank_xp": data.rank_xp,
                "score_date": current_date
            }).execute()
        else:
            old = res.data[0]
            
            # --- УМНОЕ ОБЪЕДИНЕНИЕ ДАННЫХ ---
            # 1. Улучшения (Upgrades) - никогда не затираем покупку!
            old_upgrades = old.get("upgrades") or {}
            new_upgrades = data.upgrades or {}
            merged_upgrades = old_upgrades.copy()
            for key, val in new_upgrades.items():
                if key == "is_sound_on":
                    merged_upgrades[key] = int(val or 0)
                else:
                    merged_upgrades[key] = max(int(val or 0), int(old_upgrades.get(key, 0)))

            # 2. Достижения (Achievements)
            old_ach = old.get("achievements") or {}
            new_ach = data.achievements or {}
            merged_ach = {**old_ach, **new_ach}

            # 3. Основные статы (берем MAX)
            merged_payload = {
                "username": data.username or old.get("username"),
                "score": max(data.score, old.get("score", 0)),
                "level": max(data.level, old.get("level", 1)),
                "best_level": max(data.best_level, old.get("best_level", 1)),
                "coins": max(data.coins, old.get("coins", 0)),
                "upgrades": merged_upgrades,
                "achievements": merged_ach,
                "total_dist": max(data.total_dist or 0, old.get("total_dist", 0)),
                "bosses_killed": max(data.bosses_killed or 0, old.get("bosses_killed", 0)),
                "rank_xp": max(data.rank_xp or 0, old.get("rank_xp", 0)),
                "skin": data.skin if data.skin != "classic" else (old.get("skin") or "classic"),
                "shape": data.shape if data.shape != "classic" else (old.get("shape") or "classic"),
                "explosion_color": data.explosion_color if data.explosion_color != 0xff0000 else (old.get("explosion_color") or 0xff0000),
                "score_date": current_date,
                "lang": data.lang or old.get("lang", "en")
            }
            
            supabase.table("leaderboard").update(merged_payload).eq("telegram_id", data.telegram_id).execute()
            
        return {"status": "ok"}
    except Exception as e:
        print(f"[Sync] Error: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/get_leaderboard")
async def get_leaderboard():
    try:
        res = supabase.table('leaderboard').select('*').order('level', desc=True).order('score', desc=True).limit(50).execute()
        return res.data
    except Exception as e: return {"error": str(e)}

# --- ТЕЛЕГРАМ ОБРАБОТЧИКИ ---

@dp.pre_checkout_query()
async def checkout(query: PreCheckoutQuery):
    await query.answer(ok=True)

def merge_user_upgrades(tg_id: int, patch: dict):
    res = supabase.table("leaderboard").select("*").eq("telegram_id", tg_id).execute()
    old = res.data[0] if res.data else {}
    upgrades = old.get("upgrades") or {}
    for key, val in patch.items():
        upgrades[key] = max(int(val), int(upgrades.get(key, 0)))

    payload = {
        "telegram_id": tg_id,
        "username": old.get("username", "PILOT"),
        "upgrades": upgrades,
        "score_date": datetime.now().isoformat()
    }
    supabase.table("leaderboard").upsert(payload, on_conflict="telegram_id").execute()
    return payload

@dp.message(F.successful_payment)
async def got_payment(message: types.Message):
    payload = message.successful_payment.invoice_payload
    item_type, tg_id = payload.split(":")
    tg_id = int(tg_id)

    try:
        user_res = supabase.table("leaderboard").select("*").eq("telegram_id", tg_id).execute()
        old = user_res.data[0] if user_res.data else {}

        skin_mapping = {
            "skin_gold": "gold", "skin_ghost": "ghost", "skin_crimson": "crimson",
            "skin_void": "void_skin", "skin_plasma": "plasma", "skin_solar": "solar",
            "skin_frost": "frost", "skin_rainbow": "rainbow", "skin_void_premium": "void_premium",
            "skin_crystal": "crystal"
        }
        
        shape_mapping = {
            "skin_striker": "striker", "ship_tank": "tank", "ship_dart": "dart",
            "ship_viper": "viper", "ship_phase": "phase"
        }

        if item_type == "buy_coins":
            current_coins = old.get("coins", 0)
            supabase.table("leaderboard").update({"coins": current_coins + 5000}).eq("telegram_id", tg_id).execute()
        elif item_type.startswith("bundle_"):
            bundle_data = {
                "bundle_starter": {"skin_gold": 1, "up_antenna": 1, "up_speed": 1},
                "bundle_warrior": {"skin_crimson": 1, "up_cannons": 1, "up_hull": 1},
                "bundle_legend": {"skin_rainbow": 1, "skin_void_premium": 1, "omega": 1}
            }
            if item_type in bundle_data:
                merge_user_upgrades(tg_id, bundle_data[item_type])
                if item_type == "bundle_starter": supabase.table("leaderboard").update({"skin": "gold"}).eq("telegram_id", tg_id).execute()
                if item_type == "bundle_warrior": supabase.table("leaderboard").update({"skin": "crimson"}).eq("telegram_id", tg_id).execute()
                if item_type == "bundle_legend": supabase.table("leaderboard").update({"skin": "rainbow"}).eq("telegram_id", tg_id).execute()
        elif item_type in skin_mapping:
            merge_user_upgrades(tg_id, {item_type: 1})
            supabase.table("leaderboard").update({"skin": skin_mapping[item_type]}).eq("telegram_id", tg_id).execute()
        elif item_type in shape_mapping:
            merge_user_upgrades(tg_id, {item_type: 1})
            supabase.table("leaderboard").update({"shape": shape_mapping[item_type]}).eq("telegram_id", tg_id).execute()
        else:
            merge_user_upgrades(tg_id, {item_type: 1})

        await message.answer(f"🦾 Система обновлена! Предмет '{item_type}' успешно активирован.")
    except Exception as e:
        print(f"Ошибка оплаты: {e}")

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    args = message.text.split()
    referrer_id = None
    if len(args) > 1 and args[1].startswith("ref_"):
        try: referrer_id = int(args[1].replace("ref_", ""))
        except: pass

    tg_id = message.from_user.id
    username = message.from_user.first_name or "PILOT"
    user_lang = message.from_user.language_code or 'en'
    if user_lang != 'ru': user_lang = 'en'

    user_res = supabase.table("leaderboard").select("*").eq("telegram_id", tg_id).execute()
    is_new_user = len(user_res.data) == 0

    if is_new_user:
        supabase.table("leaderboard").upsert({"telegram_id": tg_id, "username": username, "level": 1, "coins": 500, "upgrades": {}, "lang": user_lang, "score_date": datetime.now().isoformat()}).execute()
        if referrer_id and referrer_id != tg_id:
            try:
                ref_res = supabase.table("leaderboard").select("coins").eq("telegram_id", referrer_id).execute()
                if ref_res.data:
                    supabase.table("leaderboard").update({"coins": ref_res.data[0].get("coins", 0) + 1500}).eq("telegram_id", referrer_id).execute()
                    await bot.send_message(referrer_id, f"⚡ +1500 💰 за приглашение {username}!")
            except Exception: pass

    kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="🎮 GLITCHED ARENA", web_app=WebAppInfo(url="https://glitched-arena.myftp.org"))]])
    welcome_msg = f"Привет, {username}! 🚀\n\nWelcome to Glitched Arena!"
    await message.answer(welcome_msg, reply_markup=kb)

@app.get("/get_user_personal/{tg_id}")
async def get_user_personal(tg_id: int):
    try:
        res = supabase.table('leaderboard').select('*').eq('telegram_id', tg_id).execute()
        if not res.data: return {"error": "New Player"}
        user_data = res.data[0]
        rank_res = supabase.table('leaderboard').select('telegram_id', count='exact').or_(f"level.gt.{user_data['level']},and(level.eq.{user_data['level']},score.gt.{user_data['score']})").execute()
        user_data['rank'] = (rank_res.count or 0) + 1
        return user_data
    except Exception as e: return {"error": str(e)}

app.mount("/", StaticFiles(directory=".", html=True), name="static")

async def main():
    port = int(os.getenv("PORT", 8000))
    config = uvicorn.Config(app, host="0.0.0.0", port=port)
    server = uvicorn.Server(config)
    await server.serve()

if __name__ == "__main__":
    asyncio.run(main())
