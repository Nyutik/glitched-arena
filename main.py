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

# --- API ЭНДПОИНТЫ ---

@app.get("/get_invoice")
async def get_invoice(item_type: str, user_id: int, username: str):
    prices_map = {
        "skin_gold": 200, "skin_ghost": 200, "skin_crimson": 300, "skin_void": 300,
        "skin_plasma": 300, "skin_solar": 300, "skin_frost": 300,
        "skin_rainbow": 350, "skin_void_premium": 400, "skin_crystal": 350,
        "skin_striker": 1500, "ship_tank": 1200, "ship_dart": 1000, "ship_viper": 1500, "ship_phase": 1800,
        "bundle_starter": 100, "bundle_warrior": 250, "bundle_legend": 500,
        "omega": 100, "buy_coins": 50, "fx_blue": 100, "fx_pink": 100, "fx_gold": 150, "fx_green": 150, "fx_red": 150,
        "helper_drone": 500, "helper_autoshield": 400, "helper_autobomb": 600, "helper_autoheal": 350,
        "up_extralife": 800, "up_doubleDMG": 700, "up_enhanced": 1500
    }
    amount = prices_map.get(item_type, 100)
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


@app.post("/submit_score")
async def submit_score(data: ScoreData):
    try:
        current_date = datetime.now().isoformat()
        print(f"[Sync] Incoming score from {data.username} (ID: {data.telegram_id}): Level={data.level}, Best={data.best_level}")

        existing = supabase.table("leaderboard").select("*").eq("telegram_id", data.telegram_id).execute()
        old = existing.data[0] if existing.data else {}

        old_upgrades = old.get("upgrades") or {}
        new_upgrades = data.upgrades or {}
        merged_upgrades = old_upgrades.copy()

        for key, val in new_upgrades.items():
            try:
                old_val = merged_upgrades.get(key)
                if old_val is None: old_val = 0
                new_val_int = int(val) if val is not None else 0
                old_val_int = int(old_val)
                merged_upgrades[key] = max(new_val_int, old_val_int)
            except:
                merged_upgrades[key] = val if val is not None else merged_upgrades.get(key, 0)
        
        old_achievements = old.get("achievements") or {}
        new_achievements = data.achievements or {}
        merged_achievements = {**old_achievements, **new_achievements}

        def safe_int(val):
            if val is None: return 0
            try: return int(val)
            except: return 0

        db_level = safe_int(old.get("level"))
        db_best = safe_int(old.get("best_level"))
        db_score = safe_int(old.get("score"))
        db_coins = safe_int(old.get("coins"))
        db_total_dist = safe_int(old.get("total_dist"))
        db_bosses_killed = safe_int(old.get("bosses_killed"))

        merged_level = max(safe_int(data.level), db_level)
        merged_best_level = max(safe_int(data.best_level), db_best, merged_level)

        payload = {
            "telegram_id": data.telegram_id,
            "username": data.username or old.get("username") or "PILOT",
            "score": max(safe_int(data.score), db_score),
            "level": merged_level,
            "best_level": merged_best_level,
            "explosion_color": data.explosion_color or old.get("explosion_color") or 0xff0000,
            "skin": data.skin or old.get("skin") or "classic",
            "shape": data.shape or old.get("shape") or "classic",
            "coins": max(safe_int(data.coins), db_coins),
            "upgrades": merged_upgrades,
            "achievements": merged_achievements,
            "total_dist": max(safe_int(data.total_dist), db_total_dist),
            "bosses_killed": max(safe_int(data.bosses_killed), db_bosses_killed),
            "ship_name": data.ship_name or old.get("ship_name") or "RAZOR-01",
            "rank_xp": max(safe_int(data.rank_xp), safe_int(old.get("rank_xp"))),
            "daily_quests": data.daily_quests or old.get("daily_quests") or {},
            "last_daily_reset": data.last_daily_reset if data.last_daily_reset else old.get("last_daily_reset", 0),
            "daily_login_streak": data.daily_login_streak if data.daily_login_streak is not None else old.get("daily_login_streak", 0),
            "last_login_date": data.last_login_date or old.get("last_login_date"),
            "score_date": current_date
        }

        supabase.table("leaderboard").upsert(payload, on_conflict="telegram_id").execute()
        
        return {
            "status": "ok",
            "merged_level": payload["level"],
            "merged_best_level": payload["best_level"],
            "merged_score": payload["score"]
        }
    except Exception as e:
        print(f"❌ Ошибка submit_score: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get_leaderboard")
async def get_leaderboard():
    try:
        res = supabase.table('leaderboard').select('*').order('level', desc=True).order('score', desc=True).limit(50).execute()
        return res.data
    except Exception as e:
        return {"error": str(e)}

# --- ТЕЛЕГРАМ ОБРАБОТЧИКИ ---

@dp.pre_checkout_query()
async def checkout(query: PreCheckoutQuery):
    await query.answer(ok=True)

def merge_user_upgrades(tg_id: int, patch: dict):
    res = supabase.table("leaderboard").select("*").eq("telegram_id", tg_id).execute()
    old = res.data[0] if res.data else {}
    upgrades = old.get("upgrades") or {}
    for key, val in patch.items():
        upgrades[key] = max(val, upgrades.get(key, 0))

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
    user_res = supabase.table("leaderboard").select("*").eq("telegram_id", tg_id).execute()
    is_new_user = len(user_res.data) == 0

    if is_new_user:
        supabase.table("leaderboard").upsert({"telegram_id": tg_id, "username": username, "level": 1, "coins": 500, "upgrades": {}, "score_date": datetime.now().isoformat()}).execute()
        if referrer_id and referrer_id != tg_id:
            try:
                ref_res = supabase.table("leaderboard").select("coins").eq("telegram_id", referrer_id).execute()
                if ref_res.data:
                    old_coins = ref_res.data[0].get("coins", 0)
                    supabase.table("leaderboard").update({"coins": old_coins + 1500}).eq("telegram_id", referrer_id).execute()
                    await bot.send_message(referrer_id, f"⚡ Новый пилот в твоей эскадрилье! +1500 💰 за приглашение {username}.")
            except Exception as e: print(f"Error rewarding referrer: {e}")

    kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="🎮 GLITCHED ARENA", web_app=WebAppInfo(url="https://glitched-arena.onrender.com/"))]])
    welcome_msg = f"Привет, {username}! 🚀\n\nДобро пожаловать в Glitched Arena!\n🦾 Прокачивай корабль\n👾 Уничтожай боссов\nТвой стартовый бонус: 500 💰"
    if not is_new_user: welcome_msg = f"С возвращением, {username}! Твои системы готовы к бою. 🦾"
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
    await asyncio.gather(server.serve(), dp.start_polling(bot))

if __name__ == "__main__":
    asyncio.run(main())
