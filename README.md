# Telegram Mailing Bot

Telegram-бот для рассылки сообщений по форумным топикам супергрупп.

## Стек

* **Node.js 22**
* **TypeScript**
* **grammY** — Telegram Bot API
* **PostgreSQL** — база данных
* **Drizzle ORM + Drizzle Kit** — работа с БД и миграции
* **Docker + Docker Compose** — контейнеризация

## Возможности

* Авторизация владельца через Telegram
* Регистрация супергрупп и форумных топиков
* Создание рассылок из нескольких сообщений
* Выбор топика по названию
* Фиксированный интервал между сообщениями
* Отправка сообщений во все активные топики с выбранным названием
* Хранение состояния рассылок в PostgreSQL
* Автоматическое завершение рассылки после последнего сообщения

---

## Запуск без Docker

### 1. Установить зависимости

```bash
npm install
```

### 2. Создать `.env`

```env
BOT_TOKEN=your_telegram_bot_token
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tg_mailing
```

### 3. Создать базу данных

Создать PostgreSQL database:

```text
tg_mailing
```

### 4. Выполнить миграции

```bash
npm run db:migrate
```

### 5. Запустить

Development:

```bash
npm run dev
```

Production:

```bash
npm run build
npm start
```

---

## Запуск через Docker

Создать `.env`:

```env
BOT_TOKEN=your_telegram_bot_token
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/tg_mailing
```

Собрать контейнеры:

```bash
docker compose build
```

Запустить PostgreSQL:

```bash
docker compose up -d postgres
```

Выполнить миграции:

```bash
docker compose run --rm bot npm run db:migrate
```

Запустить бота:

```bash
docker compose up -d bot
```

Проверить логи:

```bash
docker compose logs -f bot
```

Остановить:

```bash
docker compose down
```

## Production

Проект рассчитан на запуск на VPS через Docker Compose.

Достаточно установить Docker, положить `.env`, собрать контейнеры, выполнить миграции и запустить:

```bash
docker compose build
docker compose up -d postgres
docker compose run --rm bot npm run db:migrate
docker compose up -d bot
```

PostgreSQL хранит данные в Docker volume, поэтому данные сохраняются между перезапусками контейнера.

---

## Миграции

После изменения `src/db/schema.ts` создать миграцию:

```bash
npm run db:generate
```

Применить:

```bash
npm run db:migrate
```

---

## Переменные окружения

```env
BOT_TOKEN=...
DATABASE_URL=...
```

`.env` не должен попадать в Git.
