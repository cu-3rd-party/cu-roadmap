# CU Roadmap Engine

Планировщик учебных траекторий для университета: подбор курсов по мажору, визуализация зависимостей, идентификация направления.

## Стек

| Слой      | Технологии                                           |
|-----------|------------------------------------------------------|
| Бэкенд    | Go 1.26, Gin, GORM, PostgreSQL 16                    |
| Фронтенд  | React 19, TypeScript, Vite, Tailwind CSS 4, pnpm     |
| Инфра     | Docker Compose, Nginx, Google Sheets API             |

## Структура

```
backend/
  main.go              точка входа, инициализация store → роутер → сервер
  api/                 HTTP-обработчики (gin handlers)
    courses.go         GET /api/v1/courses/
    majors.go          GET /api/v1/majors/
    auth.go            POST /api/v1/auth/login
    middleware/
      auth.go          middleware для проверки cookie-авторизации
    docs/api/v1.yaml   OpenAPI спецификация
  store/               слой данных
    memory.go          in-memory реализация (CSV seeding)
    postgres.go        PostgreSQL реализация (GORM)
    factory.go         синглтон store (InitStore / GetStore / CloseStore)
    helpers/           конвертеры (CourseData ↔ gin.H)
  domain/              типы данных и модели GORM
    models/
    enums/
    schemas/
  service/             бизнес-логика
    planner.go         генерация roadmap
    validator.go       валидация семестров и roadmap
    greedy.go          жадный алгоритм планирования
  Dockerfile           multi-stage сборка
frontend/
  src/
    App.tsx            корневой компонент (табы + гейт авторизации)
    pages/             страницы приложения
    shared/            переиспользуемые UI и конфигурация
    app/providers/     AuthProvider, ThemeProvider
```

## Локальный запуск

### Требования

- Go 1.26+
- pnpm (устанавливается через `corepack enable` или `npm install -g pnpm`)
- Node.js 22+
- PostgreSQL 16 (опционально, можно использовать in-memory store)

### Быстрый старт (in-memory store, без БД)

```bash
# клонируем и настраиваем хуки
git clone <repo>
cd cu-roadmap
git config core.hooksPath .githooks

# бэкенд
cd backend
FORCE_MEMORY_STORE=true go run .
# → сервер на 0.0.0.0:8080, данные загружаются из *.csv

# фронтенд (в другом терминале)
cd frontend
pnpm install
pnpm dev
# → http://localhost:5173
```

### С PostgreSQL

```bash
# .env файл
DATABASE_URL=postgres://user:pass@localhost:5432/roadmap_db?sslmode=disable
FORCE_MEMORY_STORE=false

cd backend
go run .
```

### Через Docker Compose

```bash
docker compose up --build
# → nginx на :9679, бэкенд на :8080, фронтенд на :5173
```

## Тестирование

```bash
# бэкенд
cd backend && go test -p 1 -count=1 ./...

# фронтенд
cd frontend && pnpm test
```

## Форматирование

Хуки в `.githooks/pre-commit` автоматически форматируют код перед коммитом:

- Go: `gofumpt -w`
- Фронтенд: `prettier --write`
- `go mod tidy`

В CI те же проверки запускаются в GitHub Actions.

## API

Полная спецификация: `backend/docs/api/v1.yaml`

Основные эндпоинты:

| Метод  | Путь                                | Описание                              |
|--------|-------------------------------------|---------------------------------------|
| GET    | `/api/v1/courses/`                  | все курсы с to_major маппингом        |
| GET    | `/api/v1/majors/`                   | все мажоры с требованиями             |
| POST   | `/api/v1/majors/identify`           | идентификация мажора по курсам        |
| POST   | `/api/v1/planner/generate`          | генерация roadmap                     |
| POST   | `/api/v1/planner/goal-path/`        | путь до целевого курса                |
| POST   | `/api/v1/planner/validate-roadmap/` | валидация roadmap                     |
| GET    | `/api/v1/graph/data`                | данные графа зависимостей             |
| POST   | `/api/v1/auth/login`                | вход по паролю (устанавливает cookie) |
| GET    | `/api/v1/auth/check`                | проверка валидности cookie            |
| DELETE | `/api/v1/auth/logout`               | завершение сессии и logout            |

Админ-эндпоинты (требуют cookie, полученную через `/auth/login`):

| Метод  | Путь                  | Описание       |
|--------|-----------------------|----------------|
| POST   | `/api/v1/courses/`    | создать курс   |
| PUT    | `/api/v1/courses/:id` | обновить курс  |
| DELETE | `/api/v1/courses/:id` | удалить курс   |
| PUT    | `/api/v1/majors/:id`  | обновить мажор |

## Фичи

- **Планировщик roadmap** — автоматическая генерация семестров на основе требований мажора
- **Каталог курсов** — поиск, фильтрация по категориям и семестрам
- **Граф зависимостей** — визуализация пререквизитов через vis-network
- **Идентификация мажора** — расчёт индекса Жаккара между пройденными курсами и требованиями мажора
- **Целевой путь** — построение траектории до конкретного курса
- **Ручное планирование** — drag-and-drop составление roadmap с валидацией
- **Авторизация** — вход по паролю, cookie-сессия, защита админ-эндпоинтов
