import os
import asyncio
from datetime import datetime
from typing import List, Optional
from aiogram import Bot, Dispatcher, types, F
from aiogram.types import LabeledPrice, PreCheckoutQuery
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

# --- API ЭНДПОИНТЫ ---

@app.get("/get_invoice")
async def get_invoice(item_type: str, user_id: int, username: str):
    prices_map = {
        "skin_gold": 200, "skin_ghost": 200, "skin_crimson": 300, "skin_void": 300,
        "skin_plasma": 300, "skin_solar": 300, "skin_frost": 300,
        "skin_striker": 1500, "ship_tank": 1200, "ship_dart": 1000, "ship_viper": 1500, "ship_phase": 1800,
        "omega": 100, "buy_coins": 50, "fx_blue": 100, "fx_pink": 100
    }
    amount = prices_map.get(item_type, 100)

    # Теперь в полезную нагрузку пишем ID, а не имя!
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

        if old:
            print(f"[Sync] Existing data for {data.telegram_id}: Level={old.get('level')}, Best={old.get('best_level')}")

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

        new_level = int(data.level) if data.level is not None else 0
        new_best = int(data.best_level) if data.best_level is not None else 0
        
        # Гарантируем, что уровень в базе не откатывается назад (строгая обработка None)
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

        merged_level = max(new_level, db_level)
        merged_best_level = max(new_best, db_best, merged_level)

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
            "score_date": current_date
        }

        print(f"[Sync] Upserting payload: Level={payload['level']}, Best={payload['best_level']}")
        res = supabase.table("leaderboard").upsert(payload, on_conflict="telegram_id").execute()
        
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
        res = supabase.table('leaderboard').select('*') \
            .order('level', desc=True) \
            .order('score', desc=True) \
            .limit(50).execute()
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
        "score": old.get("score", 0),
        "level": old.get("level", 1),
        "best_level": old.get("best_level", old.get("level", 1)),
        "explosion_color": old.get("explosion_color", 0xff0000),
        "skin": old.get("skin", "classic"),
        "shape": old.get("shape", "classic"),
        "coins": old.get("coins", 0),
        "upgrades": upgrades,
        "total_dist": old.get("total_dist", 0),
        "bosses_killed": old.get("bosses_killed", 0),
        "ship_name": old.get("ship_name", "RAZOR-01"),
        "score_date": old.get("score_date") or datetime.now().isoformat()
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
            "skin_gold": "gold",
            "skin_ghost": "ghost",
            "skin_crimson": "crimson",
            "skin_void": "void_skin",
            "skin_plasma": "plasma",
            "skin_solar": "solar",
            "skin_frost": "frost"
        }
        
        shape_mapping = {
            "skin_striker": "striker",
            "ship_tank": "tank",
            "ship_dart": "dart",
            "ship_viper": "viper",
            "ship_phase": "phase"
        }
        
        upgrade_mapping = {
            "omega": "omega", "fx_blue": "fx_blue", "fx_pink": "fx_pink",
            "skin_striker": "skin_striker", "ship_tank": "ship_tank",
            "ship_dart": "ship_dart", "ship_viper": "ship_viper",
            "ship_phase": "ship_phase", "skin_crimson": "skin_crimson",
            "skin_void": "skin_void", "skin_plasma": "skin_plasma",
            "skin_solar": "skin_solar", "skin_frost": "skin_frost"
        }

        if item_type == "buy_coins":
            current = old.get("coins", 0)
            supabase.table("leaderboard").upsert({
                "telegram_id": tg_id,
                "username": old.get("username", message.from_user.first_name or "PILOT"),
                "score": old.get("score", 0),
                "level": old.get("level", 1),
                "best_level": old.get("best_level", old.get("level", 1)),
                "explosion_color": old.get("explosion_color", 0xff0000),
                "skin": old.get("skin", "classic"),
                "shape": old.get("shape", "classic"),
                "coins": current + 5000,
                "upgrades": old.get("upgrades", {}),
                "total_dist": old.get("total_dist", 0),
                "bosses_killed": old.get("bosses_killed", 0),
                "ship_name": old.get("ship_name", "RAZOR-01"),
                "score_date": old.get("score_date") or datetime.now().isoformat()
            }, on_conflict="telegram_id").execute()
        elif item_type in skin_mapping:
            upgrade_key = item_type
            new_skin = skin_mapping[item_type]
            merge_user_upgrades(tg_id, {upgrade_key: 1})
            supabase.table("leaderboard").update({"skin": new_skin}).eq("telegram_id", tg_id).execute()
        elif item_type in shape_mapping:
            upgrade_key = upgrade_mapping.get(item_type, item_type)
            new_shape = shape_mapping[item_type]
            merge_user_upgrades(tg_id, {upgrade_key: 1})
            supabase.table("leaderboard").update({"shape": new_shape}).eq("telegram_id", tg_id).execute()
        elif item_type in upgrade_mapping:
            upgrade_key = upgrade_mapping[item_type]
            merge_user_upgrades(tg_id, {upgrade_key: 1})

        await message.answer(f"🦾 Система обновлена! Покупка привязана к ID: {tg_id}")

    except Exception as e:
        print(f"Ошибка оплаты: {e}")


@app.get("/get_user_personal/{tg_id}")
async def get_user_personal(tg_id: int):
    try:
        res = supabase.table('leaderboard').select('*').eq('telegram_id', tg_id).execute()
        if not res.data: return {"error": "New Player"}

        user_data = res.data[0]
        rank_res = supabase.table('leaderboard').select('telegram_id', count='exact') \
            .or_(f"level.gt.{user_data['level']},and(level.eq.{user_data['level']},score.gt.{user_data['score']})") \
            .execute()

        user_data['rank'] = (rank_res.count or 0) + 1
        return user_data
    except Exception as e:
        return {"error": str(e)}


# --- ПОДКЛЮЧЕНИЕ ФРОНТЕНДА ---
app.mount("/", StaticFiles(directory=".", html=True), name="static")

async def main():
    port = int(os.getenv("PORT", 8000))
    config = uvicorn.Config(app, host="0.0.0.0", port=port)
    server = uvicorn.Server(config)
    await asyncio.gather(server.serve(), dp.start_polling(bot))

if __name__ == "__main__":
    asyncio.run(main())