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
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScoreData(BaseModel):
    username: str
    score: int
    level: int
    skin: str
    coins: Optional[int] = 0
    upgrades: Optional[dict] = {}

# --- API ЭНДПОИНТЫ ---

@app.get("/get_invoice")
async def get_invoice(item_type: str, user_id: str, username: str):
    prices_map = {"skin_gold": 300, "skin_ghost": 300, "omega": 100, "buy_coins": 50}
    amount = prices_map.get(item_type, 100)
    payload = f"{item_type}:{username}"

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

        # Данные для сохранения
        payload = {
            "username": data.username,
            "score": data.score,
            "level": data.level,
            "skin": data.skin,
            "coins": data.coins,
            "upgrades": data.upgrades,
            "score_date": current_date
        }

        res = supabase.table('leaderboard').upsert(payload, on_conflict="username").execute()

        return {"status": "ok"}
    except Exception as e:
        print(f"Ошибка сохранения: {e}")
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

@dp.message(F.successful_payment)
async def got_payment(message: types.Message):
    payload = message.successful_payment.invoice_payload
    item_type, username = payload.split(":")
    try:
        if item_type == "buy_coins":
            res = supabase.table('leaderboard').select('coins').eq('username', username).execute()
            current = res.data[0]['coins'] if (res.data and 'coins' in res.data[0]) else 0
            supabase.table('leaderboard').update({"coins": current + 5000}).eq('username', username).execute()
        elif item_type == "omega":
            supabase.table('leaderboard').update({"omega": 1}).eq('username', username).execute()
        elif "skin_" in item_type:
            skin_name = item_type.replace("skin_", "")
            supabase.table('leaderboard').update({"skin": skin_name}).eq('username', username).execute()

        await message.answer(f"🦾 СИСТЕМА ОБНОВЛЕНА! {item_type} теперь твой.")
    except Exception as e:
        print(f"Ошибка оплаты: {e}")


@app.get("/get_user_personal/{username}")
async def get_user_personal(username: str):
    try:
        # 1. Получаем данные самого игрока
        res = supabase.table('leaderboard').select('*').eq('username', username).execute()

        if not res.data:
            return {"error": "New Player"}

        user_data = res.data[0]

        # 2. Высчитываем ранг (место в топе)
        # Считаем, сколько людей имеют уровень выше, ИЛИ такой же уровень, но больше метров
        rank_res = supabase.table('leaderboard').select('username', count='exact') \
            .or_(f"level.gt.{user_data['level']},and(level.eq.{user_data['level']},score.gt.{user_data['score']})") \
            .execute()

        user_data['rank'] = (rank_res.count or 0) + 1  # Место = (кол-во тех, кто лучше) + 1

        return user_data
    except Exception as e:
        print(f"Personal Data Error: {e}")
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