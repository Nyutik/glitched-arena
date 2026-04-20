# 🛠 DEV NOTES (Glitched Arena)

## 🔑 SSH & Deployment
*   **Server IP:** `83.147.243.97` (glitched-arena.myftp.org)
*   **User:** `root`
*   **Project Path:** `/var/www/glitched-arena`
*   **Local Keys:** `arena_id_rsa` (Private), `arena_id_rsa.pub` (Public)

## 🚀 Automation (CI/CD)
Настроен GitHub Actions (`.github/workflows/deploy.yml`). 
Для работы необходимо добавить секрет `SSH_PRIVATE_KEY` в настройках репозитория на GitHub.

## 🐛 Bug Fixes History
*   **20.04.2026:** Исправлен баг `+0` в ежедневных квестах (добавлены fallbacks и проверка на undefined reward в `03-utils.js`).
*   **20.04.2026:** Исправлен UI при победе — теперь пишет "СЕКТОР ОЧИЩЕН" вместо "ДОБЫТО: 0 💰".
*   **20.04.2026:** Поправлена глубина (depth: 101) для полоски здоровья игрока.
