from datetime import datetime

import os
import asyncio
from typing import List, Optional
from aiogram import Bot, Dispatcher, types, F
from aiogram.types import LabeledPrice, PreCheckoutQuery
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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

# Разрешаем фронтенду общаться с бэкендом
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- МОДЕЛИ ДАННЫХ ---
class ScoreData(BaseModel):
    username: str
    score: int
    level: int
    skin: str


# --- API ЭНДПОИНТЫ (Для игры) ---

# 1. Получить ссылку на оплату Stars
@app.get("/get_invoice")
async def get_invoice(item_type: str, user_id: str, username: str):
    prices_map = {"skin_gold": 300, "skin_ghost": 300, "omega": 100, "buy_coins": 50}
    amount = prices_map.get(item_type, 100)
    payload = f"{item_type}:{username}"

    invoice_link = await bot.create_invoice_link(
        title=f"Glitched Arena: {item_type}",
        description=f"Цифровой апгрейд для {username}",
        payload=payload,
        provider_token="",  # Пусто для Telegram Stars
        currency="XTR",
        prices=[LabeledPrice(label="Покупка", amount=amount)]
    )
    return {"url": invoice_link}


# 2. Безопасно отправить рекорд в базу
@app.post("/submit_score")
async def submit_score(data: ScoreData):
    try:
        # Текущая дата в формате ISO
        current_date = datetime.now().isoformat()

        res = supabase.table('leaderboard').select('score').eq('username', data.username).execute()

        if res.data:
            old_score = res.data[0]['score']
            if data.score > old_score:
                # Обновляем счет и СТАВИМ ДАТУ
                supabase.table('leaderboard').update({
                    "score": data.score,
                    "level": data.level,
                    "skin": data.skin,
                    "score_date": current_date
                }).eq('username', data.username).execute()
        else:
            # Новый игрок: записываем всё сразу с датой
            supabase.table('leaderboard').insert({
                "username": data.username,
                "score": data.score,
                "level": data.level,
                "skin": data.skin,
                "score_date": current_date
            }).execute()
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 3. Получить таблицу лидеров для игры
@app.get("/get_leaderboard")
async def get_leaderboard():
    try:
        res = supabase.table('leaderboard').select('*').order('score', desc=True).limit(50).execute()
        return res.data
    except Exception as e:
        return {"error": str(e)}


# --- ОБРАБОТКА ПЛАТЕЖЕЙ (Для Telegram) ---

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

        await message.answer(f"🦾 СИСТЕМА ОБНОВЛЕНА! {item_type} разблокирован навсегда.")
    except Exception as e:
        print(f"Ошибка после оплаты: {e}")


async def main():
    # Render использует переменную окружения PORT
    port = int(os.getenv("PORT", 8000))
    config = uvicorn.Config(app, host="0.0.0.0", port=port)
    server = uvicorn.Server(config)
    # Запускаем сервер API и бота параллельно
    await asyncio.gather(server.serve(), dp.start_polling(bot))


if __name__ == "__main__":
    asyncio.run(main())