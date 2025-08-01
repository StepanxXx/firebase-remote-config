# Firebase Remote Config Admin

Сучасний веб-інтерфейс для керування Firebase Remote Config з Angular UI та системою автоматизованого білда.

## Особливості

- **Angular 18+ UI**: Сучасний інтерфейс з Material Design
- **Комплексна візуалізація**: Відображення складних структур Firebase даних (параметри, групи, умови, персоналізація, rollout)
- **Система управління білдом**: Автоматизація npm install/build через веб-інтерфейс
- **Firebase Remote Config API**: Повна підтримка всіх методів згідно з Google Discovery Document
- **Адмін панель**: Веб-інтерфейс для управління проектом та білдами
- **Legacy підтримка**: Збереження сумісності зі старими інтерфейсами

## Передумови

- [Node.js](https://nodejs.org/) (рекомендована версія 18 або вище)
- JSON-файл облікового запису служби Firebase
- npm або yarn для керування залежностями

## Налаштування

1. Встановіть залежності:
```bash
npm install
```

2. Розмістіть облікові дані облікового запису служби Firebase на одну директорію **вище** цього проєкту під назвою `serviceAccount.json`:
```bash
/path/to/parent/serviceAccount.json
/workspace/firebase-remote-config/    # корінь проєкту
```
Сервер шукає цей файл за шляхом `../serviceAccount.json` відносно `index.js`.

3. Збілдіть Angular проект (один з варіантів):

**Варіант A: Через адмін панель (рекомендований)**
- Запустіть сервер: `node index.js`
- Відкрийте http://localhost:3000/admin
- Натисніть "Install Dependencies" → "Build Project"

**Варіант B: Вручну**
```bash
cd firebase-remote-config-ui
npm install
npm run build
```

## Запуск сервера

```bash
node index.js
```

Додаток за замовчуванням працює на порту `3000`. Ви можете встановити змінну середовища `PORT`, щоб використовувати інший порт.

## Доступ до інтерфейсів

### Основний Angular UI
- **URL**: http://localhost:3000
- **Автентифікація**: admin/admin або viewer/viewer
- **Функціонал**: Повний інтерфейс управління Firebase Remote Config

### Адмін панель управління білдом
- **URL**: http://localhost:3000/admin
- **Функціонал**: 
  - Перевірка статусу білда
  - Встановлення залежностей
  - Білд Angular проекту
  - Очищення білд артефактів
  - Моніторинг dev сервера

### Legacy інтерфейси
- **URL**: http://localhost:3000/public/index.html
- **Функціонал**: Збережена сумісність зі старим інтерфейсом

## API Endpoints

### Firebase Remote Config
- `GET /api/template` - Отримання поточного шаблону
- `GET /api/template/version/:number` - Отримання конкретної версії
- `PUT /api/template` - Оновлення шаблону
- `GET /api/versions` - Список версій
- `POST /api/rollback` - Відкат до попередньої версії
- `GET /api/history` - Історія змін
- `POST /api/fetch` - Client Fetch API
- `GET /api/downloadDefaults` - Експорт у JSON/XML/PLIST

### Управління білдом
- `GET /api/build/status` - Статус білда
- `GET /api/build/info` - Детальна інформація про проект
- `POST /api/build` - Запуск білда
- `DELETE /api/build` - Очищення білд артефактів
- `POST /api/install` - Встановлення залежностей
- `GET /api/dev/status` - Статус dev сервера

## Структура проекту

```
firebase-remote-config/
├── index.js                      # Express сервер з API
├── package.json                  # Backend залежності
├── public/                       # Legacy статичні файли
│   ├── admin.html               # Адмін панель білдів
│   ├── index.html               # Legacy інтерфейс
│   └── styles.css
└── firebase-remote-config-ui/    # Angular проект
    ├── src/
    │   └── app/
    │       ├── dashboard/        # Основний компонент
    │       ├── login/           # Автентифікація
    │       └── shared/          # Спільні сервіси
    ├── dist/                    # Білд артефакти (генеровані)
    └── package.json             # Frontend залежності
```

## Troubleshooting

### Сервер не запускається
- Перевірте, чи встановлені залежності: `npm install`
- Перевірте наявність serviceAccount.json у батьківській директорії

### Angular UI не відображається
- Перевірте статус білда на http://localhost:3000/admin
- Збілдіть проект через адмін панель або вручну
- Переконайтесь, що файли знаходяться в `firebase-remote-config-ui/dist/firebase-remote-config-ui/browser/`
- Перезапустіть сервер після білда: `node index.js`

### Помилки Firebase API
- Перевірте права доступу serviceAccount.json
- Переконайтесь, що Remote Config увімкнений у Firebase Console

### Проблеми з білдом Angular
- Перевірте версію Node.js (рекомендована 18+)
- Очистіть кеш: `npm cache clean --force`
- Видаліть node_modules і переустановіть: `rm -rf node_modules && npm install`
- Використовуйте команду `ng serve` для розробки замість білда

## Розробка

Для розробки Angular проекту:
```bash
cd firebase-remote-config-ui
npm run serve  # dev сервер на порту 4200
```

Для розробки backend:
```bash
node index.js  # або використовуйте nodemon
```

### Структура білд файлів (Angular 18+)
```
firebase-remote-config-ui/dist/firebase-remote-config-ui/
├── browser/          # Основні файли для браузера
│   ├── index.html
│   ├── main-*.js
│   ├── styles-*.css
│   └── chunk-*.js
└── prerendered-routes.json
```