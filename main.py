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

# --- API ЭНДПОИНТЫ ---

@app.get("/get_invoice")
async def get_invoice(item_type: str, user_id: int, username: str):
    prices_map = {"skin_gold": 300, "skin_ghost": 300, "omega": 100, "buy_coins": 50}
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

        existing = supabase.table("leaderboard").select("*").eq("telegram_id", data.telegram_id).execute()
        old = existing.data[0] if existing.data else {}

        old_upgrades = old.get("upgrades") or {}
        new_upgrades = data.upgrades or {}

        merged_upgrades = old_upgrades.copy()
        for key, val in new_upgrades.items():
            try:
                merged_upgrades[key] = max(int(val), int(merged_upgrades.get(key, 0)))
            except:
                merged_upgrades[key] = val or merged_upgrades.get(key, 0)

        payload = {
            "telegram_id": data.telegram_id,
            "username": data.username or old.get("username") or "PILOT",
            "score": max(data.score, old.get("score", 0)),
            "level": max(data.level, old.get("level", 0)),
            "best_level": max(data.best_level or 0, old.get("best_level", 0)),
            "explosion_color": data.explosion_color or old.get("explosion_color") or 0xff0000,
            "skin": data.skin or old.get("skin") or "classic",
            "shape": data.shape or old.get("shape") or "classic",
            "coins": max(data.coins or 0, old.get("coins", 0)),
            "upgrades": merged_upgrades,
            "total_dist": max(data.total_dist or 0, old.get("total_dist", 0)),
            "bosses_killed": max(data.bosses_killed or 0, old.get("bosses_killed", 0)),
            "ship_name": data.ship_name or old.get("ship_name") or "RAZOR-01",
            "score_date": current_date
        }

        res = supabase.table("leaderboard").upsert(payload, on_conflict="telegram_id").execute()
        return {"status": "ok", "merged_level": payload["level"], "merged_score": payload["score"]}

    except Exception as e:
        print(f"Ошибка submit_score: {e}")
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

        if item_type == "buy_coins":
            current = old.get("coins", 0)
            supabase.table("leaderboard").upsert({
                "telegram_id": tg_id,
                "username": old.get("username", message.from_user.first_name or "PILOT"),
                "score": old.get("score", 0),
                "level": old.get("level", 1),
                "skin": old.get("skin", "classic"),
                "shape": old.get("shape", "classic"),
                "coins": current + 5000,
                "upgrades": old.get("upgrades", {}),
                "total_dist": old.get("total_dist", 0),
                "bosses_killed": old.get("bosses_killed", 0),
                "ship_name": old.get("ship_name", "RAZOR-01"),
                "score_date": old.get("score_date") or datetime.now().isoformat()
            }, on_conflict="telegram_id").execute()

        elif item_type == "omega":
            merge_user_upgrades(tg_id, {"omega": 1})

        elif item_type == "skin_gold":
            merge_user_upgrades(tg_id, {"skingold": 1})
            supabase.table("leaderboard").update({"skin": "gold"}).eq("telegram_id", tg_id).execute()

        elif item_type == "skin_ghost":
            merge_user_upgrades(tg_id, {"skinghost": 1})
            supabase.table("leaderboard").update({"skin": "ghost"}).eq("telegram_id", tg_id).execute()

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