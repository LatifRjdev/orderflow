# 📐 ITL OrderFlow — Полная инструкция для дизайна в Stitch

> **Тип продукта:** SaaS веб-приложение (fully responsive)
> **Целевая аудитория:** IT-компании
> **Назначение:** Управление заказами, отслеживание прогресса, клиентский портал

---

## 🎨 БАЗОВЫЙ СТИЛЬ (используй в каждом промпте)

Добавляй этот блок в начало каждого промпта:

```
Design a modern SaaS dashboard interface for "ITL OrderFlow" — a project management system for IT companies.

STYLE GUIDELINES:
- Clean, minimal, professional design
- Primary: #3B82F6 (blue)
- Success: #10B981 (green)
- Warning: #F59E0B (amber)  
- Danger: #EF4444 (red)
- Background: #F9FAFB (light gray)
- Cards: white with subtle shadow (shadow-sm)
- Border radius: 8-12px
- Font: Inter or SF Pro
- Dark sidebar (slate-900) with light main content
- Language: Russian (Cyrillic text)

RESPONSIVE REQUIREMENTS:
- Desktop: Full sidebar + main content
- Tablet (768-1024px): Collapsible sidebar, adjusted grid
- Mobile (<768px): Bottom navigation or hamburger menu, single column, touch-friendly targets (min 44px)

Show desktop version primarily, but design with mobile-first principles.
```

---

## 📑 СОДЕРЖАНИЕ

1. [Аутентификация](#модуль-1-аутентификация) (4 экрана)
2. [Главный дашборд](#модуль-2-главный-дашборд) (2 экрана)
3. [Клиенты](#модуль-3-клиенты) (4 экрана)
4. [Заказы](#модуль-4-заказы) (7 экранов)
5. [Задачи](#модуль-5-задачи) (3 экрана)
6. [Учёт времени](#модуль-6-учёт-времени) (3 экрана)
7. [Финансы](#модуль-7-финансы) (6 экранов)
8. [Клиентский портал](#модуль-8-клиентский-портал) (5 экранов)
9. [Настройки](#модуль-9-настройки) (7 экранов)
10. [Отчёты](#модуль-10-отчёты) (3 экрана)
11. [UI компоненты](#модуль-11-ui-компоненты) (6 компонентов)

**Всего: 50 экранов и компонентов**

---

# МОДУЛЬ 1: АУТЕНТИФИКАЦИЯ

## 1.1 Страница входа (Login)

```
Design a login page for "ITL OrderFlow" SaaS platform.

LAYOUT - Split screen:
- Left side (60%): Dark blue gradient (#1E3A8A to #3B82F6) with abstract geometric shapes or isometric illustration showing project management workflow
- Logo "ITL OrderFlow" top-left corner
- Tagline center: "Управление заказами для IT-компаний"
- Trust badges at bottom: "500+ компаний", "Безопасность данных", "24/7 поддержка"

- Right side (40%): White background with login form

FORM ELEMENTS:
- Heading: "Войти в аккаунт"
- Subheading: "Введите данные для входа"
- Email input with envelope icon, label "Email", placeholder "name@company.com"
- Password input with lock icon, show/hide toggle
- Row: checkbox "Запомнить меня" + link "Забыли пароль?"
- Primary button full-width: "Войти"
- Divider: line with "или" text
- Google sign-in button (outline): Google icon + "Войти через Google"
- Bottom text: "Нет аккаунта?" + link "Зарегистрироваться"

RESPONSIVE:
- Mobile: Single column, left illustration becomes top banner (shorter)
- Form takes full width with proper padding
- Buttons remain full-width, inputs stack vertically
```

---

## 1.2 Регистрация — Шаг 1 (Company Info)

```
Design registration page Step 1 of 3 for "ITL OrderFlow" SaaS.

LAYOUT: Same split-screen as login

LEFT SIDE:
- Same branding
- Different illustration: team collaboration/growth theme
- Feature highlights:
  • "✓ 14 дней бесплатно"
  • "✓ Без привязки карты"
  • "✓ Отмена в любое время"

RIGHT SIDE - Form:
- Progress indicator: 3 dots, first active (blue), others gray
- Step label: "Шаг 1 из 3"
- Heading: "Создайте аккаунт"
- Subheading: "Информация о компании"

Form fields:
- "Название компании" input (required *)
- "Ваше имя" input (required *)
- "Рабочий email" input (required *)
- "Пароль" input with strength indicator bar below (weak/medium/strong)
- Password requirements hint text (small, gray)
- Checkbox: "Я согласен с" + links "условиями использования" и "политикой конфиденциальности"

- Primary button: "Продолжить →"
- Bottom: "Уже есть аккаунт?" + link "Войти"

RESPONSIVE:
- Mobile: Full-width form, progress dots smaller
- Illustration hidden on mobile, just gradient header
```

---

## 1.3 Регистрация — Шаг 2 (Preferences)

```
Design registration page Step 2 of 3 for "ITL OrderFlow" SaaS.

Same layout structure.

RIGHT SIDE - Form:
- Progress: dot 1 complete (checkmark), dot 2 active, dot 3 gray
- Step label: "Шаг 2 из 3"
- Heading: "Настройте рабочее пространство"

Form fields:
- "URL вашего пространства" input with prefix "orderflow.app/" and slug input
- "Часовой пояс" dropdown (detect automatically, show detected)
- "Валюта по умолчанию" dropdown: TJS, RUB, USD, EUR
- "Размер команды" radio buttons styled as cards:
  • "1-5 человек" (Solo/Small)
  • "6-20 человек" (Growing)
  • "20+ человек" (Large)
- "Как вы о нас узнали?" dropdown (optional): Поиск, Рекомендация, Реклама, Другое

Buttons row:
- "← Назад" text button (left)
- "Продолжить →" primary button (right)

RESPONSIVE: Same as step 1
```

---

## 1.4 Регистрация — Шаг 3 (Plan Selection)

```
Design registration page Step 3 of 3 - pricing plan selection for "ITL OrderFlow".

FULL WIDTH LAYOUT (no split):
- Clean white/gray background
- Logo centered at top
- Progress: dots 1,2 complete, dot 3 active
- Step label: "Шаг 3 из 3"

HEADER:
- Heading: "Выберите тарифный план"
- Subheading: "Начните с 14-дневного бесплатного периода. Отмена в любое время."
- Toggle switch: "Ежемесячно" | "Ежегодно (-20%)" 

PRICING CARDS (3 columns on desktop):

CARD 1 - START:
- Light border, white background
- Name: "Start"
- Price: "$29" + "/месяц"
- Description: "Для небольших команд"
- Divider
- Features list with checkmarks:
  • 3 пользователя
  • 10 активных проектов
  • 5 GB хранилище
  • Email уведомления
  • Клиентский портал
  • Базовые отчёты
- Outline button: "Выбрать Start"

CARD 2 - BUSINESS (highlighted):
- Blue border (primary color), subtle blue tint background
- "Популярный" badge top-right
- Name: "Business"
- Price: "$79" + "/месяц"
- Description: "Для растущих компаний"
- Features (includes all Start +):
  • 10 пользователей
  • 50 проектов
  • 25 GB хранилище
  • Telegram уведомления
  • White-label портал
  • Расширенная аналитика
  • 1 интеграция
- Primary filled button: "Выбрать Business"

CARD 3 - ENTERPRISE:
- Light border
- Name: "Enterprise"  
- Price: "$199" + "/месяц"
- Description: "Для крупных команд"
- Features (includes all Business +):
  • Безлимит пользователей
  • Безлимит проектов
  • 100 GB хранилище
  • Все интеграции
  • API доступ
  • Приоритетная поддержка
  • SLA гарантии
- Outline button: "Выбрать Enterprise"

BOTTOM:
- Link: "Пропустить — выберу позже"
- Small text: "Вы сможете изменить план в любое время"

RESPONSIVE:
- Tablet: 3 cards in row, smaller padding
- Mobile: Cards stack vertically, Business card first (reorder), full-width cards
```

---

## 1.5 Восстановление пароля

```
Design a forgot password page for "ITL OrderFlow" SaaS.

LAYOUT: Centered card on gradient background (same as login left side)

CARD (max-width 450px):
- Logo at top center
- Heading: "Восстановление пароля"
- Subheading: "Введите email, и мы отправим ссылку для сброса пароля"
- Email input field
- Primary button full-width: "Отправить ссылку"
- Link below: "← Вернуться к входу"

SUCCESS STATE (same card, different content):
- Checkmark icon in green circle
- Heading: "Проверьте почту"
- Text: "Мы отправили ссылку для сброса пароля на email@example.com"
- Small text: "Не получили письмо?" + link "Отправить повторно"
- Link: "← Вернуться к входу"

RESPONSIVE: Card becomes full-width on mobile with padding
```

---

# МОДУЛЬ 2: ГЛАВНЫЙ ДАШБОРД

## 2.1 Основной дашборд

```
Design the main dashboard for "ITL OrderFlow" SaaS application.

LAYOUT STRUCTURE:
- Left: Dark sidebar (240px width, collapsible to 64px icons-only)
- Top: Header bar (height 64px)
- Main: Content area with widgets grid

SIDEBAR (dark slate-900):
- Top: Logo "ITL OrderFlow" (collapses to icon "OF")
- Navigation items with Lucide icons:
  • Дашборд (LayoutDashboard) — ACTIVE state (blue background, white text)
  • Заказы (Folder)
  • Клиенты (Users)
  • Задачи (CheckSquare)
  • Время (Clock)
  • Финансы (DollarSign)
  • Отчёты (BarChart3)
  • Документы (FileText)
- Divider line
- Bottom section:
  • Настройки (Settings)
  • Collapse button (ChevronsLeft)
- Hover states: slightly lighter background

HEADER:
- Left: Hamburger menu (mobile only), Breadcrumb "Главная"
- Center: Search bar with placeholder "Поиск... ⌘K" (expandable)
- Right: 
  • Notification bell with red dot badge (3)
  • Organization dropdown: "ITL Solutions ▼"
  • User avatar with dropdown

MAIN CONTENT:

Row 1 - KPI Cards (4 cards, equal width):
- Card 1: "Активных проектов" | Value: "12" | Blue icon (Folder)
- Card 2: "На ревью клиента" | Value: "3" | Amber icon (Eye) 
- Card 3: "Выручка за месяц" | Value: "245 000 ₽" | Green icon (TrendingUp) | Badge "+12%"
- Card 4: "Часов за неделю" | Value: "186" | Purple icon (Clock)

Row 2 (2 columns: 2/3 + 1/3):
- Left: Card "Статусы проектов"
  • Horizontal stacked bar chart showing pipeline
  • Legend: Новые (gray), В работе (blue), Ревью (amber), Завершён (green)
  • Counts on bars
  
- Right: Card "Срочные задачи"
  • List of 4 tasks
  • Each: priority dot, task name, project name (small), due badge (red if urgent)
  • Link "Все задачи →"

Row 3 (2 columns: 1/2 + 1/2):
- Left: Card "Загрузка команды"
  • Horizontal bar chart
  • Team member names with avatars on Y-axis
  • Hours on X-axis
  • Benchmark line at 40h
  
- Right: Card "Последняя активность"
  • Timeline/feed style
  • Each entry: avatar, action text, timestamp
  • "Алексей изменил статус проекта 'Портал'" — 5 мин назад
  • Max 5 entries, scrollable

Row 4:
- Full width card "Ближайшие дедлайны"
  • Table: Проект | Клиент | Дедлайн | Осталось дней
  • Color coding: red (<3 days), amber (3-7), green (>7)
  • 5 rows max
  • Link "Все проекты →"

RESPONSIVE:
- Tablet: 2 columns instead of 4 for KPIs, sidebar collapses
- Mobile: 
  • Sidebar becomes bottom navigation (5 main items)
  • Single column layout
  • KPIs become horizontal scroll
  • Cards stack vertically
  • Search moves to separate screen
```

---

## 2.2 Дашборд — Пустое состояние

```
Design an empty state dashboard for new users of "ITL OrderFlow".

Same layout with sidebar and header.

MAIN CONTENT - Centered:
- Friendly illustration: isometric graphic of person organizing tasks/projects (not sad, encouraging)
- Heading: "Добро пожаловать в ITL OrderFlow!"
- Subheading: "Настройте рабочее пространство за несколько шагов"

QUICK START CARDS (3 cards horizontal):

Card 1:
- Icon: Users (blue circle background)
- Title: "Добавьте клиента"
- Description: "Создайте карточку вашего первого клиента"
- Button: "Добавить клиента"

Card 2:
- Icon: FolderPlus (green circle background)  
- Title: "Создайте заказ"
- Description: "Оформите новый проект для клиента"
- Button: "Создать заказ"

Card 3:
- Icon: UserPlus (purple circle background)
- Title: "Пригласите команду"
- Description: "Добавьте коллег для совместной работы"
- Button: "Пригласить"

BOTTOM:
- Divider
- "Нужна помощь?" section
- Link: "📹 Посмотреть видео-гайд (3 мин)"
- Link: "📖 Читать документацию"
- Link: "💬 Написать в поддержку"

RESPONSIVE:
- Mobile: Cards stack vertically, full-width buttons
```

---

# МОДУЛЬ 3: КЛИЕНТЫ

## 3.1 Список клиентов

```
Design a clients list page for "ITL OrderFlow" SaaS.

Standard layout with sidebar and header.

PAGE HEADER:
- Breadcrumb: "Главная / Клиенты"
- Title: "Клиенты" with count badge "(47)"
- Right side actions:
  • Search input (expandable on mobile)
  • Filter button with dropdown indicator
  • Primary button "+ Добавить клиента"

FILTERS BAR (collapsible, below header):
- Tags multi-select dropdown
- Status dropdown: "Все", "Активные", "Архив"
- Industry dropdown
- Sort by dropdown: "По названию", "По дате добавления", "По количеству проектов"
- "Сбросить" link

MAIN CONTENT - Table:

Table header row (sortable columns):
☐ | Компания | Контакт | Email | Телефон | Проектов | Добавлен | ⋯

Table rows:
- Checkbox for selection
- Company: Logo circle placeholder + Company name + Tag badges (VIP, Постоянный)
- Contact: Name + Position (small gray text below)
- Email: clickable mailto link
- Phone: clickable tel link
- Projects: Number badge with blue background
- Added: Date (e.g., "15 мар 2024")
- Actions: 3-dot menu (Редактировать, Архивировать, Удалить)

Table features:
- Alternating row background (subtle)
- Hover state: slight highlight
- Sortable column headers with arrows
- Selected row: blue tint

PAGINATION (bottom):
- "Показано 1-20 из 47"
- Items per page dropdown: 20, 50, 100
- Page navigation: < 1 2 3 ... 5 >

EMPTY STATE (if no clients):
- Illustration of empty contacts
- "У вас пока нет клиентов"
- "Добавьте первого клиента, чтобы начать работу"
- Button: "+ Добавить клиента"

RESPONSIVE:
- Tablet: Hide some columns (phone, added date)
- Mobile: 
  • Switch to card view instead of table
  • Each client = card with name, contact, tags, project count
  • Swipe actions or tap to expand
  • FAB button for adding
```

---

## 3.2 Карточка клиента (детали)

```
Design a client detail page for "ITL OrderFlow" SaaS.

PAGE HEADER:
- Back arrow + Breadcrumb: "Клиенты / ООО ТехноСофт"
- Left: Large avatar/logo circle + Company name "ООО ТехноСофт"
- Status badge: "Активный" (green dot + text)
- Tags inline: "VIP", "IT-сектор"
- Right: "Редактировать" outline button + 3-dot menu (Архивировать, Удалить)

TAB NAVIGATION (horizontal, scrollable on mobile):
- Обзор (active)
- Проекты (5)
- Контакты (3)
- Документы (12)
- Финансы
- История

---

TAB: ОБЗОР

Two column layout (2/3 + 1/3):

LEFT COLUMN:

Card "Информация о компании":
- Grid of info rows:
  • Юр. название: ООО "ТехноСофт"
  • ИНН: 7707083893
  • Адрес: г. Москва, ул. Примерная, 123
  • Сайт: technosoft.ru (link icon)
  • Отрасль: Информационные технологии
  • Источник: Рекомендация
- "Редактировать" link at bottom

Card "Заметки":
- Text area showing existing notes
- Editable on click
- "Последнее обновление: 2 дня назад" small text
- Auto-save indicator

RIGHT COLUMN:

Card "Статистика":
- Metric rows:
  • Всего проектов: 12
  • Активных: 5
  • Общая сумма: 2 450 000 ₽
  • С нами с: Март 2022

Card "Основной контакт":
- Avatar + Name "Иван Петров"
- Position: "CTO"
- Contact buttons row: Email, Phone, Telegram icons
- "Все контакты →" link

Card "Последние проекты":
- List of 3 projects:
  • Status dot + Project name + Date
- "Все проекты →" link

Card "Быстрые действия":
- Button list (vertical):
  • "Создать заказ"
  • "Выставить счёт"
  • "Запланировать встречу"

RESPONSIVE:
- Mobile: Single column, cards stack
- Tabs become horizontally scrollable
- Contact buttons become full-width
```

---

## 3.3 Контакты клиента (вкладка)

```
Design the Contacts tab for client detail page in "ITL OrderFlow".

Same page structure, "Контакты" tab active.

HEADER for tab:
- "Контактные лица" title
- "+ Добавить контакт" button

CONTACTS as cards (grid, 2-3 per row):

Contact Card:
- Top right: Primary badge if primary contact, Decision maker badge if LPR
- Avatar (large, circle)
- Name: "Иван Петров"
- Position: "CTO"
- Divider
- Contact info rows with icons:
  • Email: ivan@technosoft.ru (copy button)
  • Телефон: +7 999 123-45-67 (copy button)  
  • Telegram: @ivanpetrov
- Action buttons row: "Написать", "Позвонить"
- 3-dot menu: "Редактировать", "Сделать основным", "Удалить"

EMPTY STATE:
- "Нет контактных лиц"
- "Добавьте контакты для связи с клиентом"
- Button: "+ Добавить контакт"

RESPONSIVE:
- Mobile: Single column of contact cards
- Action buttons stack vertically
```

---

## 3.4 Модальное окно — Добавить/Редактировать клиента

```
Design a modal for adding/editing a client in "ITL OrderFlow".

MODAL: 
- Width: 600px (desktop), full-screen on mobile
- Overlay: dark semi-transparent

STRUCTURE:
- Header: "Новый клиент" or "Редактировать клиента" + X close button
- Scrollable content
- Sticky footer with actions

FORM CONTENT:

Section "Основная информация":
- Company name input (required *) — full width
- Legal name input — full width
- INN input — half width
- Industry dropdown — half width
- Website input — full width
- Address textarea — full width

Section "Основной контакт":
- Two columns: First name + Last name
- Position input — full width
- Email input (required *) — full width
- Phone input — half width
- Telegram input — half width
- Checkbox: "Лицо, принимающее решения (ЛПР)"

Section "Дополнительно":
- Tags multi-select with ability to create new tags
- Source dropdown: "Откуда пришёл клиент" (Рекомендация, Сайт, Реклама, Холодный звонок, Другое)
- Notes textarea — full width

FOOTER:
- Left: "Отмена" text button
- Right: "Создать клиента" / "Сохранить" primary button

VALIDATION:
- Required fields marked with *
- Red border and error text below invalid fields
- Button disabled until valid

RESPONSIVE:
- Mobile: Full-screen modal
- All inputs full-width
- Sections clearly separated
- Footer sticky at bottom
```

---

# МОДУЛЬ 4: ЗАКАЗЫ

## 4.1 Kanban-доска заказов

```
Design a Kanban board view for orders/projects in "ITL OrderFlow" SaaS.

PAGE HEADER:
- Breadcrumb: "Главная / Заказы"
- Title: "Заказы"
- View toggle buttons: [Kanban (active)] [Таблица] [Календарь]
- Filters: Client dropdown, Manager dropdown, Priority dropdown
- Right: "+ Новый заказ" primary button

QUICK FILTERS (chips below header):
- "Все", "Мои заказы", "Срочные", "Просроченные"

KANBAN BOARD:
- Horizontal scrollable container
- Each column = pipeline stage

COLUMNS (example, 7 columns):

Column 1 "Новые заявки":
- Header: Gray color bar + Column name + Count "(3)"
- 3-dot menu: Rename, Hide, Settings

Column 2 "Оценка":
- Blue color bar
- Count "(2)"

Column 3 "КП отправлено":
- Purple color bar
- Count "(4)"

Column 4 "В работе":
- Yellow/amber color bar
- Count "(6)"

Column 5 "Тестирование":
- Orange color bar
- Count "(2)"

Column 6 "Ревью клиента":
- Pink color bar
- Count "(3)"

Column 7 "Завершён":
- Green color bar
- Count "(8)"

KANBAN CARD (inside columns):
- Top: Project code "#ORD-2024-047" (small, gray)
- Title: "Редизайн мобильного приложения" (bold, 2 lines max)
- Client row: Small logo circle + "ООО ТехноСофт"
- Progress bar with percentage label "65%"
- Bottom row:
  • Due date with icon (color coded: red/amber/green)
  • Priority flag icon if high/urgent
  • Stacked avatars (max 3 + "+2")
- Tags at very bottom: small colored pills

CARD STATES:
- Default: white background, subtle shadow
- Hover: lift effect, stronger shadow
- Dragging: slight rotation, opacity 0.9
- Drop zone: dashed border highlight

COLUMN FOOTER:
- "+ Добавить заказ" link (gray, hover reveals)

RESPONSIVE:
- Tablet: Columns narrower, horizontal scroll
- Mobile: 
  • Single column view with status filter tabs at top
  • Or horizontal scroll with larger touch targets
  • FAB for new order
```

---

## 4.2 Таблица заказов

```
Design a table view for orders/projects in "ITL OrderFlow" SaaS.

Same header as Kanban, but [Таблица] toggle is active.

ADVANCED FILTERS BAR (expandable panel):
- Status multi-select
- Client dropdown
- Manager dropdown
- Priority dropdown
- Date range picker (Created, Deadline)
- Tags multi-select
- Budget range (min-max)
- Row: "Сбросить фильтры" link + "Применить" button

TABLE:

Header row (all sortable):
☐ | № | Название | Клиент | Статус | Прогресс | Менеджер | Дедлайн | Бюджет | ⋯

Row content:
- Checkbox
- № (order number): "#ORD-2024-047" — clickable link
- Название: "Редизайн портала" + priority icon (flag) if high
- Клиент: Company name (link to client)
- Статус: Colored badge "В работе" (yellow bg)
- Прогресс: Mini progress bar + "65%"
- Менеджер: Avatar + Name
- Дедлайн: "15 мар" — red text if overdue, amber if <7 days
- Бюджет: "450 000 ₽"
- Actions: 3-dot menu

TABLE FEATURES:
- Column resizing (drag handles)
- Row click → navigate to detail
- Sticky header on scroll
- Alternating row colors

BULK ACTIONS BAR (appears when rows selected):
- "Выбрано: 3 заказа"
- "Изменить статус" dropdown
- "Назначить менеджера" dropdown
- "Удалить" button (red)
- "✕ Отменить выбор"

PAGINATION:
- "Показано 1-25 из 156"
- Items per page dropdown
- Page numbers with arrows

RESPONSIVE:
- Tablet: Fewer columns, horizontal scroll
- Mobile: Switch to card list view
```

---

## 4.3 Детали заказа — Обзор

```
Design an order/project detail page - Overview tab for "ITL OrderFlow" SaaS.

PAGE HEADER:
- Back arrow + Breadcrumb: "Заказы / #ORD-2024-047"
- Status dropdown (clickable to change): Colored dot + "В работе" + chevron
- Title (large): "Редизайн корпоративного портала"
- Project code below: #ORD-2024-047
- Right actions: "Клиентский портал" link button (external icon) + "Редактировать" button + 3-dot menu

META INFO ROW (horizontal, wrapping):
- Pill: Client icon + "ООО ТехноСофт" (clickable)
- Pill: User icon + "Алексей С." (manager)
- Pill: Flag icon + "Высокий" (red)
- Pill: Calendar icon + "15 марта 2024"
- Pill: Wallet icon + "450 000 ₽"

TAB NAVIGATION:
- Обзор (active)
- Этапы и задачи
- Время (45ч)
- Файлы (24)
- Финансы
- Комментарии (8)
- История

---

TAB CONTENT: ОБЗОР

Two columns (2/3 + 1/3):

LEFT COLUMN:

Card "Описание проекта":
- Rich text formatted content
- Images if any
- Expandable if long ("Показать полностью")

Card "Прогресс":
- Large progress bar (full width, 12px height)
- Percentage: "65% выполнено"
- Text: "Выполнено 12 из 18 задач"

Card "Этапы" (summary view):
- Horizontal stepper/timeline:
  • Step 1: ✓ "Аналитика" (done, green)
  • Step 2: ✓ "Дизайн" (done, green)
  • Step 3: ● "Разработка" (current, blue, pulsing dot)
  • Step 4: ○ "Тестирование" (upcoming, gray)
  • Step 5: ○ "Запуск" (upcoming, gray)
- "Подробнее об этапах →" link

RIGHT COLUMN:

Card "Команда проекта":
- List of team members:
  • Avatar + Name + Role badge (Lead, Developer, Designer)
- "+ Добавить" link at bottom

Card "Клиент":
- Mini contact card:
  • Company logo + name
  • Primary contact: avatar + name
  • Quick action buttons: Email, Call, Message

Card "Быстрые действия":
- Vertical button list:
  • "Создать задачу"
  • "Добавить время"
  • "Загрузить файл"
  • "Выставить счёт"

Card "Ссылки":
- External links with icons:
  • Figma (design)
  • GitHub (repository)
  • Staging (preview)
- "+ Добавить ссылку"

RESPONSIVE:
- Mobile: Single column, cards stack
- Stepper becomes vertical timeline
- Quick actions become bottom sheet
```

---

## 4.4 Детали заказа — Этапы и задачи

```
Design the Milestones & Tasks tab for order detail page in "ITL OrderFlow".

Same page header and tabs, "Этапы и задачи" tab active.

TAB HEADER:
- "+ Добавить этап" button
- View toggle: [Список (active)] [Доска] [Gantt]
- Filters: Исполнитель dropdown, Статус dropdown

---

VIEW: СПИСОК (Accordion style)

MILESTONE 1 (expanded):
Header row:
- Drag handle (⋮⋮)
- Expand/collapse chevron (▼)
- Flag icon
- Title: "Дизайн"
- Progress: "4/6 задач" + mini progress bar
- Due date: "28 фев"
- Status badge: "В работе" (yellow)
- Approval icon (if requires sign-off): 👁️
- 3-dot menu

Tasks inside (indented):
Each task row:
- Checkbox (circular, fills on complete)
- Priority dot (red/yellow/green)
- Task title: "Создать мокапы главной страницы"
- Assignee avatar (small)
- Due: "25 фев"
- Time estimate: "4ч"
- Subtask indicator: "▸ 3 подзадачи" (if any)

Task hover: show quick actions (edit, delete, move)

Add task row at bottom of milestone:
- "+ Добавить задачу" input (appears on click)

MILESTONE 2 (collapsed):
- Same header row but chevron points right (▸)
- Shows only summary: "Разработка — 2/10 задач — 15 мар"

MILESTONE 3 (completed):
- Green checkmark icon
- Muted colors, strikethrough optional
- "Завершён 15 фев"

Bottom of list:
- "+ Добавить этап" button (full width, dashed border)

DRAG AND DROP:
- Reorder milestones
- Reorder tasks within milestone
- Move task between milestones

RESPONSIVE:
- Mobile: Full-width milestones
- Task rows show less info (hide estimate, due date on hover)
- Drag-drop with long press
```

---

## 4.5 Детали заказа — Файлы

```
Design the Files tab for order detail page in "ITL OrderFlow".

TAB HEADER:
- "+ Загрузить файл" button
- View toggle: [Сетка (active)] [Список]
- Sort: Dropdown "По дате" / "По имени" / "По размеру"
- Filter: Category dropdown "Все", "Документы", "Изображения", "Дизайн"

DRAG-DROP ZONE (if empty or always visible at top):
- Dashed border area
- Cloud upload icon
- "Перетащите файлы сюда или нажмите для выбора"
- "Максимум 50 MB на файл"

---

VIEW: СЕТКА (Grid)

Files as cards (4 per row desktop):

File card:
- Preview thumbnail (image preview, PDF icon, generic file icon)
- Filename: "Главная страница v2.png" (truncated with ellipsis)
- Meta row: "PNG • 2.4 MB"
- Date: "15 мар 2024"
- Uploaded by: small avatar
- Visibility badge: "Клиент видит" (eye icon) or lock icon if internal
- Hover: overlay with actions:
  • Download
  • Preview
  • Share with client toggle
  • Delete

---

VIEW: СПИСОК (Table)

Columns:
- Thumbnail (small)
- Имя файла
- Категория (badge)
- Размер
- Загружен (date + avatar)
- Видимость
- Действия

FOLDER ORGANIZATION (optional):
- Folders at top: "Дизайн", "Документы", "Ресурсы"
- Click folder to enter
- Breadcrumb for navigation within folders

RESPONSIVE:
- Tablet: 3 cards per row
- Mobile: 2 cards per row or list view
```

---

## 4.6 Gantt-диаграмма

```
Design a Gantt chart view for project milestones and tasks in "ITL OrderFlow".

Same page, view toggle set to [Gantt].

GANTT HEADER:
- Zoom controls: Buttons "День" | "Неделя" | "Месяц"
- Navigation: "< Сегодня >"
- Date range display: "Февраль — Март 2024"
- "Экспорт" dropdown: PNG, PDF

LAYOUT: Split view

LEFT PANEL (resizable, ~300px):
- Tree structure table:
  • Expand/collapse arrows
  • Milestone/Task name
  • Assignee column (avatar)
  • Duration column (e.g., "5d")
- Alternating row colors
- Sticky header

RIGHT PANEL (scrollable timeline):
- Date headers based on zoom level
- Vertical "Today" line (red, dashed)
- Weekend shading (subtle gray columns)

GANTT ELEMENTS:

Milestone:
- Diamond shape marker
- Positioned at due date

Task bar:
- Rounded rectangle
- Color coded by: status or assignee (legend below)
- Progress fill (darker shade inside bar)
- Label on bar if space permits
- Resize handles on edges (change duration)

Dependencies:
- Arrows connecting bars (start-to-finish, etc.)
- Different line styles for dependency types

INTERACTIONS:
- Drag bar edges: resize (change dates)
- Drag whole bar: move timeline
- Click bar: select, show tooltip with details
- Double-click: open edit modal
- Scroll: horizontal auto-scroll when dragging

TOOLTIP on hover:
- Task name
- Date range
- Assignee
- Progress %
- Quick actions: Edit, Complete

LEGEND (bottom):
- Color meanings for status or team members

RESPONSIVE:
- Tablet: Works but cramped, suggest zoom out
- Mobile: Show message "Gantt лучше работает на большом экране" + option to view anyway
- Alternative: simple timeline view for mobile
```

---

## 4.7 Модальное окно — Создать заказ

```
Design a multi-step modal for creating a new order in "ITL OrderFlow".

MODAL: Large (800px width), full-screen on mobile

HEADER:
- Step indicator: ● ○ ○ (3 dots)
- Title changes per step
- X close button

---

STEP 1: "Основная информация"

Form fields:
- "Клиент" — searchable dropdown with client list + "+ Новый клиент" option at bottom (required *)
- "Название проекта" — text input (required *)
- "Тип проекта" — dropdown: Web-разработка, Мобильное приложение, Дизайн, Консалтинг, Поддержка, Другое
- "Описание" — rich text editor or textarea
- "Приоритет" — radio cards: ○ Низкий | ○ Средний (default) | ○ Высокий | ○ Срочный
- "Теги" — multi-select with create option

FOOTER:
- "Отмена" (left)
- "Далее →" (right)

---

STEP 2: "Сроки и бюджет"

Form fields:
- "Планируемое начало" — date picker
- "Дедлайн" — date picker
- "Оценка времени" — number input + "часов"
- "Бюджет" — number input + currency selector (TJS, RUB, USD)
- "Тип оплаты" — radio: ○ Фиксированная цена | ○ Почасовая | ○ По этапам
- "Примечания по оплате" — textarea (optional)

FOOTER:
- "← Назад" (left)
- "Далее →" (right)

---

STEP 3: "Команда и настройки"

Form fields:
- "Менеджер проекта" — dropdown with user avatars (required *)
- "Команда" — multi-select user picker with role assignment:
  Each selected: Avatar + Name + Role dropdown (Developer, Designer, QA)

Toggles section "Настройки":
- ☑ Включить клиентский портал
- ☑ Уведомлять клиента о смене статуса
- ☐ Автоматически считать прогресс из задач
- ☐ Требовать одобрение этапов клиентом

- "Начальный статус" — dropdown (default: first in pipeline)

SUMMARY CARD (collapsible):
- Shows all entered data from steps 1-2
- Allows quick review before creating

FOOTER:
- "← Назад" (left)
- "Создать заказ" primary button (right)

LOADING STATE:
- Button shows spinner
- "Создание заказа..."

SUCCESS:
- Modal closes
- Toast notification: "Заказ #ORD-2024-048 создан"
- Redirect to new order page

RESPONSIVE:
- Mobile: Full-screen modal
- Steps as horizontal scroll indicator
- All fields full-width
- Summary card always expanded
```

---

# МОДУЛЬ 5: ЗАДАЧИ

## 5.1 Список всех задач

```
Design a Tasks list page (organization-wide) for "ITL OrderFlow" SaaS.

PAGE HEADER:
- Title: "Задачи"
- View toggle: [Список (active)] [Доска]
- Filters: Проект, Исполнитель, Статус, Приоритет, Дедлайн
- Right: "+ Новая задача" button

QUICK FILTERS (chips):
- "Все", "Мои задачи", "Сегодня", "На этой неделе", "Просроченные"

---

VIEW: СПИСОК

Grouped by Project (collapsible):

Project Group Header:
- Expand/collapse chevron
- Project name: "#ORD-2024-047 — Корпоративный портал"
- Task count: "(8 задач)"

Tasks table within group:
Columns: ☐ | Приоритет | Задача | Этап | Исполнитель | Срок | Статус | ⋯

Row:
- Checkbox (to complete)
- Priority dot (red/yellow/green)
- Task name (clickable)
- Milestone name (small, gray)
- Assignee avatar + name
- Due date (color coded)
- Status dropdown: To Do, In Progress, Review, Done

Row hover: subtle highlight + quick actions appear

COMPLETED TASKS:
- Option to show/hide at bottom of each group
- Strikethrough style, muted colors

---

VIEW: ДОСКА (Kanban by status)

4 columns: "К выполнению" | "В работе" | "На проверке" | "Готово"

Task cards (similar to order cards but simpler):
- Task title
- Project name (small)
- Assignee avatar
- Due date
- Priority indicator

Drag between columns to change status.

RESPONSIVE:
- Mobile: List view only (simpler)
- Swipe to complete or change status
- Tap to expand task details
```

---

## 5.2 Модальное окно — Детали задачи

```
Design a task detail modal/panel for "ITL OrderFlow" SaaS.

SLIDE-OVER PANEL (from right, 500px width) or MODAL:

HEADER:
- Checkbox (large) + Task title inline (editable)
- Status badge dropdown
- X close button

META ROW:
- Project link: "Корпоративный портал"
- Milestone: "Дизайн"

---

CONTENT:

Section "Детали":
- Priority selector (inline): flag icons
- Assignee picker (avatar + name, click to change)
- Due date picker
- Time estimate input: "4ч оценка"

Section "Описание":
- Rich text area (editable)
- Placeholder: "Добавить описание..."

Section "Чек-лист" (if exists):
- Progress: "2 из 5"
- Checklist items with checkboxes:
  ☑ Подготовить контент
  ☑ Создать wireframe
  ☐ Дизайн в Figma
  ☐ Ревью с командой
  ☐ Согласовать с клиентом
- "+ Добавить пункт" input

Section "Подзадачи" (if exists):
- List of subtasks (same style as checklist but more detail)
- "+ Добавить подзадачу"

Section "Вложения":
- File thumbnails
- "+ Загрузить файл"

Section "Комментарии":
- Comment thread (avatar + name + time + text)
- Input at bottom: "Написать комментарий..."

Section "Активность" (collapsible):
- Timeline of changes: "Алексей изменил статус на 'В работе' — 2ч назад"

---

FOOTER:
- "Удалить задачу" text button (red, left)
- "Залогировать время" button
- "Готово" button (marks complete)

RESPONSIVE:
- Mobile: Full-screen modal
- Sections collapse/expand
- Bottom sheet for actions
```

---

## 5.3 Быстрое добавление задачи

```
Design a quick task add component for "ITL OrderFlow".

INLINE ADD (within milestone/project context):
- Input field: "Добавить задачу..." placeholder
- On focus: expands to show additional fields

EXPANDED STATE:
- Task name input (focused)
- Row of quick selectors:
  • Assignee avatar picker
  • Due date quick pick: "Сегодня", "Завтра", "+7 дней", calendar icon
  • Priority dropdown (dots)
- "Enter для сохранения, Esc для отмены"
- Or: "Создать" button + "Подробнее" link (opens full modal)

KEYBOARD SHORTCUTS:
- Enter: create task
- Tab: move between fields
- Esc: cancel

---

GLOBAL QUICK ADD (triggered by ⌘K or FAB):

Modal (compact, 500px):
- Input: "Что нужно сделать?"
- Project picker (searchable dropdown) — required
- Milestone picker (optional)
- Assignee, Due date, Priority (inline row)
- "Создать задачу" button

RESPONSIVE:
- Mobile: Bottom sheet with same fields
- Larger touch targets for selectors
```

---

# МОДУЛЬ 6: УЧЁТ ВРЕМЕНИ

## 6.1 Страница учёта времени

```
Design a time tracking page for "ITL OrderFlow" SaaS.

PAGE HEADER:
- Title: "Учёт времени"
- Date navigation: "< Сегодня >" with week view: "18-24 марта 2024"
- View toggle: [Неделя (active)] [День] [Месяц]
- Right: "+ Добавить запись" button

---

ACTIVE TIMER WIDGET (if running, sticky at top):
Card with pulsing border animation:
- Left: "Таймер запущен" badge (green dot + text)
- Task: "Разработка API авторизации"
- Project: "#ORD-2024-047 — Корпоративный портал"
- Center: Running time "01:23:45" (large monospace font)
- Right: "Пауза" button (outline) + "Стоп" button (primary)
- Description input below (optional)

---

MAIN CONTENT: Weekly Timesheet

Grid layout:
- First column: Project + Task names (hierarchical tree)
- 7 day columns: Пн 18 | Вт 19 | Ср 20 | Чт 21 | Пт 22 | Сб 23 | Вс 24
- Last column: Итого (row totals)

Row examples:
Project "Корпоративный портал":
├─ Дизайн главной: [2] [1.5] [ ] [3] [ ] [ ] [ ] = 6.5ч
├─ Разработка API: [ ] [4] [4] [2] [4] [ ] [ ] = 14ч
└─ Тестирование: [ ] [ ] [ ] [ ] [2] [ ] [ ] = 2ч

Project "Мобильное приложение":
├─ UI компоненты: [3] [ ] [2] [ ] [1] [ ] [ ] = 6ч
└─ ...

Cell styling:
- Empty: light gray background, "—" or empty
- With time: white background, number
- Click to edit inline
- Today column: highlighted border

TOTALS ROW (bottom, sticky):
- Daily totals: 5 | 5.5 | 6 | 5 | 7 | 0 | 0
- Week total: 28.5ч

SUMMARY BAR (above grid):
- "Эта неделя: 28.5 ч"
- "Оплачиваемых: 24 ч (84%)"
- "Цель: 40 ч"
- Progress bar visualization

---

ALTERNATIVE: List view toggle

List shows individual entries:
- Date
- Project
- Task
- Description
- Hours
- Billable toggle
- Status (pending/approved)
- Actions (edit/delete)

RESPONSIVE:
- Tablet: Scroll horizontally on grid
- Mobile: 
  • Day view by default
  • Single column list of entries for selected day
  • Date picker at top
  • Quick entry at bottom (FAB)
```

---

## 6.2 Модальное окно — Добавить время

```
Design a modal for adding time entry in "ITL OrderFlow".

MODAL (500px width):

HEADER:
- "Добавить время" + X close

FORM:

- "Дата" — date picker (default: today)

- "Проект" — searchable dropdown with recent projects at top (required *)

- "Задача" — dropdown filtered by project (optional, "Без привязки к задаче")

- "Время" — toggle between modes:
  MODE 1 (default): Hours input
  - Number input: "2.5" + "часов"
  
  MODE 2: Start/End time
  - Two time pickers: "С" [09:00] "До" [11:30]
  - Auto-calculated: "= 2.5ч"

- "Описание работы" — textarea
  - Recent descriptions as clickable chips below for quick reuse

- "Оплачиваемое время" — toggle switch (default: on)
  - If on, shows: "Ставка: 2 500 ₽/ч"

CALCULATED DISPLAY (if billable):
- "Сумма: 6 250 ₽"

---

FOOTER:
- "Отмена" (left)
- "Сохранить" primary button

---

ALTERNATIVE: Quick entry mode

Compact form (for embedding in other views):
- Project + Task selector (combined)
- Hours input
- "Добавить" button
- All in one row

RESPONSIVE:
- Mobile: Full-screen modal
- Time input with larger touch targets
- Project picker as separate screen
```

---

## 6.3 Таймер (widget)

```
Design a floating timer widget for "ITL OrderFlow".

COLLAPSED STATE (corner widget):
- Small pill: "▶ 01:23:45"
- Click to expand

EXPANDED STATE (floating card, draggable):

Card (300px width):
- Header: "Таймер" + minimize button + X (discard)
- Project selector dropdown
- Task selector dropdown (optional)
- Description input (small)
- Large time display: "01:23:45" (monospace)
- Control buttons:
  • Not started: "▶ Старт" (primary)
  • Running: "⏸ Пауза" + "⏹ Стоп"
  • Paused: "▶ Продолжить" + "⏹ Стоп"

ON STOP:
- Show mini-form to confirm:
  - Review project/task
  - Adjust time if needed
  - Add description
  - "Сохранить" / "Отменить"

POSITION:
- Bottom-right corner by default
- Draggable to any position
- Remembers position

NOTIFICATION:
- When timer running, show in page title: "01:23:45 — ITL OrderFlow"

RESPONSIVE:
- Mobile: Fixed at bottom of screen
- Tap to expand
- Compact controls
```

---

# МОДУЛЬ 7: ФИНАНСЫ

## 7.1 Финансовый дашборд

```
Design a financial dashboard for "ITL OrderFlow" SaaS.

PAGE HEADER:
- Title: "Финансы"
- Period selector: "Этот месяц ▼" (dropdown: Эта неделя, Этот месяц, Этот квартал, Этот год, Custom range)
- Right: "Экспорт" button

NAVIGATION TABS (sub-nav):
- Обзор (active) | Счета | КП | Платежи | Акты

---

TAB: ОБЗОР

Row 1 - KPI Cards (4):
- "Выручка" — 1 245 000 ₽ — green trend arrow +15% — chart sparkline
- "Ожидает оплаты" — 345 000 ₽ — amber icon — "5 счетов"
- "Просрочено" — 89 000 ₽ — red icon — "2 счета" — warning style
- "Прибыль" — 620 000 ₽ — green icon — "49% маржа"

Row 2 (2/3 + 1/3):
- Left: "Выручка по месяцам"
  • Bar chart: 12 months
  • Current month highlighted
  • Hover for details

- Right: "По типам проектов"
  • Donut chart
  • Legend: Web 45%, Mobile 30%, Design 15%, Other 10%

Row 3 (1/2 + 1/2):
- Left: "Топ клиенты по выручке"
  • Horizontal bar chart
  • Top 5 clients
  • Amount labels

- Right: "Прибыльность проектов"
  • Mini table: Project | Доход | Затраты | Маржа%
  • Color coding for margin (green/yellow/red)
  • Top 5 projects

Row 4:
- "Последние операции"
  • Table: Дата | Тип | Описание | Клиент | Сумма
  • Type icons: income (green arrow up), expense (red arrow down)
  • Link: "Все операции →"

RESPONSIVE:
- Mobile: Single column
- Charts adapt to width
- KPIs as 2x2 grid
```

---

## 7.2 Список счетов

```
Design an invoices list page for "ITL OrderFlow" SaaS.

Same financial nav, "Счета" tab active.

PAGE HEADER:
- Title: "Счета"
- Status tabs: Все | Черновики (3) | Отправлены (5) | Оплачены (12) | Просрочены (2)
- Right: "+ Создать счёт" primary button

FILTERS (below tabs):
- Client dropdown
- Date range
- Amount range (min-max)
- Search by invoice number

TABLE:

Columns: ☐ | № счёта | Клиент | Проект | Дата | Срок оплаты | Сумма | Оплачено | Статус | ⋯

Row example:
- ☐ | INV-2024-015 | ООО ТехноСофт | Корпоративный портал | 15 мар | 30 мар | 150 000 ₽ | — | "Отправлен" (blue badge) | ⋯

Status badges:
- Черновик: gray
- Отправлен: blue
- Просмотрен: purple
- Оплачен: green
- Частично: yellow (show amounts)
- Просрочен: red

Actions menu:
- Отправить (if draft)
- Скачать PDF
- Записать оплату
- Дублировать
- Отменить
- Удалить

BULK ACTIONS:
- "Отправить выбранные"
- "Экспорт"

SUMMARY FOOTER:
- "Выставлено: 500 000 ₽ | Оплачено: 300 000 ₽ | К оплате: 200 000 ₽"

RESPONSIVE:
- Mobile: Card view for invoices
- Key info: number, client, amount, status
- Swipe for actions
```

---

## 7.3 Создание/редактирование счёта

```
Design an invoice create/edit page for "ITL OrderFlow" SaaS.

FULL PAGE (not modal):

PAGE HEADER:
- Back arrow
- Title: "Новый счёт" or "Счёт INV-2024-015"
- Status badge (if existing)
- Actions: "Сохранить черновик" | "Предпросмотр" | "Отправить клиенту"

---

TWO COLUMN LAYOUT (3/5 + 2/5):

LEFT - FORM:

Section "Основное":
- Invoice number: auto-generated, editable (INV-2024-016)
- Client: searchable dropdown (required)
- Project: dropdown filtered by client (optional)
- Issue date: date picker (default: today)
- Due date: date picker OR quick select: "Net 15" | "Net 30" | "Net 45"

Section "Позиции":
Line items table:
| Описание | Кол-во | Ед. | Цена | Сумма | ✕ |

Row inputs:
- Description: text input
- Quantity: number
- Unit: dropdown (часы, штуки, дни)
- Unit price: number
- Total: calculated, readonly
- Delete button

"+ Добавить позицию" button
"📊 Импорт из учёта времени" button (opens modal to select time entries)

Section "Итого" (right-aligned):
- Подытог: 125 000 ₽
- Скидка: input (% or ₽ toggle) [0]
- Налог: input (%) [0]
- Divider
- Итого: 125 000 ₽ (large, bold)

Section "Дополнительно":
- Notes textarea: "Примечания для клиента"
- Internal notes: "Внутренние заметки" (won't appear on invoice)

---

RIGHT - LIVE PREVIEW:

Invoice preview card (paper-style):
- Scales to fit
- Shows actual invoice design:
  • Your company header/logo
  • Client info
  • Invoice number, dates
  • Line items table
  • Totals
  • Notes
- "ЧЕРНОВИК" watermark if draft
- Updates in real-time

Preview actions:
- "Скачать PDF"
- "Открыть на весь экран"

---

BOTTOM ACTIONS (sticky):
- "Сохранить черновик" outline button
- "Отправить клиенту" primary button

ON SEND:
- Confirmation modal: preview + email input + message
- "Отправить" / "Отмена"

RESPONSIVE:
- Tablet: Preview becomes collapsible
- Mobile: 
  • Single column form
  • Preview as separate tab/screen
  • Line items as cards
```

---

## 7.4 Список КП (Proposals)

```
Design a proposals/quotes list page for "ITL OrderFlow" SaaS.

Same financial nav, navigated to "КП" tab.

PAGE HEADER:
- Title: "Коммерческие предложения"
- Status tabs: Все | Черновики | Отправлены | Приняты | Отклонены | Просрочены
- Right: "+ Создать КП" button

TABLE similar to invoices:
Columns: ☐ | № | Название | Клиент | Дата | Действует до | Сумма | Статус | ⋯

Status badges:
- Черновик: gray
- Отправлено: blue
- Просмотрено: purple (with view count)
- Принято: green (✓)
- Отклонено: red (✕)
- Просрочено: gray strikethrough

Actions:
- Отправить
- Скачать PDF
- Дублировать
- Конвертировать в заказ (if accepted)
- Редактировать
- Удалить

CONVERSION METRICS (summary cards at top):
- "Отправлено: 24" | "Просмотрено: 18" | "Принято: 12" | "Конверсия: 50%"

RESPONSIVE: Same as invoices
```

---

## 7.5 Создание КП

```
Design a proposal/quote editor page for "ITL OrderFlow" SaaS.

Similar to invoice but with more content sections.

PAGE HEADER:
- Back arrow
- Title: "Новое КП" or "КП #PRO-2024-008"
- Actions: "Сохранить" | "Предпросмотр" | "Отправить"

---

TWO COLUMN LAYOUT:

LEFT - FORM:

Section "Основное":
- Proposal number (auto)
- Client dropdown (required)
- Title: "Название предложения"
- Valid until: date picker

Section "Введение":
- Rich text editor
- Template variable hints: {{client_name}}, {{company}}

Section "Объём работ":
- Rich text editor with bullet formatting

Section "Этапы и стоимость":
Table:
| Этап | Описание | Срок | Стоимость |

Row for each phase/milestone
"+ Добавить этап"

Totals:
- Подытог
- Скидка
- Налог
- Итого

Section "Сроки выполнения":
- Timeline textarea or date range

Section "Условия":
- Payment terms dropdown preset + custom text
- Rich text for additional terms

---

RIGHT - LIVE PREVIEW:

Formatted proposal document:
- Professional template
- Page breaks indicated
- Scrollable preview
- Company branding applied
- Sign-off area at bottom

---

TEMPLATES:
- "Выбрать шаблон" dropdown at top of form
- Pre-fills content structure

RESPONSIVE:
- Same as invoice page
```

---

## 7.6 Учёт платежей

```
Design a payments tracking page/modal for "ITL OrderFlow".

Can be accessed from invoice detail or as separate section.

PAYMENT RECORD MODAL:

HEADER:
- "Записать оплату" + X close

For invoice context:
- Invoice info: "#INV-2024-015 — 150 000 ₽"
- Outstanding: "К оплате: 100 000 ₽"

FORM:
- Amount: number input (default: outstanding amount)
- Payment date: date picker
- Payment method: dropdown (Банковский перевод, Наличные, Карта, Другое)
- Reference number: text input (optional, for bank reference)
- Notes: textarea

Footer:
- "Отмена" | "Записать оплату"

---

PAYMENTS LIST (within invoice detail or separate page):

Table:
| Дата | Сумма | Способ | Референс | Записал | Действия |

- 15 мар 2024 | 50 000 ₽ | Банковский перевод | #123456 | Алексей | ⋯

Actions: Edit, Delete (with confirmation)

PARTIAL PAYMENT handling:
- Invoice status auto-changes to "Частично оплачен"
- Shows paid vs remaining

RESPONSIVE: Standard table to cards conversion
```

---

# МОДУЛЬ 8: КЛИЕНТСКИЙ ПОРТАЛ

## 8.1 Портал — Вход клиента

```
Design a client portal login page for "ITL OrderFlow".

DIFFERENT VISUAL STYLE from admin panel:
- Cleaner, simpler, client-facing
- Can be white-labeled (company logo from settings)
- Lighter, more welcoming feel

LAYOUT:
- Centered card on subtle gradient or pattern background
- Organization's logo at top (or ITL OrderFlow if not customized)
- Powered by badge at bottom: "Работает на ITL OrderFlow"

LOGIN OPTIONS:

Option 1 - Magic Link:
- Heading: "Войти в портал"
- Email input
- "Отправить ссылку для входа" button
- Description: "Мы отправим вам ссылку на email"

Option 2 - Access by direct link:
- No login required if accessed via unique project URL
- Shows directly project view

Option 3 - Password (if set):
- Email + Password fields
- "Войти" button

SUCCESS STATE (after magic link):
- Check icon
- "Проверьте почту"
- "Мы отправили ссылку для входа на your@email.com"

RESPONSIVE: Full-width on mobile, centered card on desktop
```

---

## 8.2 Портал — Дашборд клиента

```
Design a client portal dashboard for "ITL OrderFlow".

SIMPLIFIED LAYOUT:
- Clean white background
- Minimal navigation

HEADER:
- Left: Organization logo (the IT company's logo)
- Right: Client company name + Contact person name + Logout

NAVIGATION (horizontal tabs or sidebar):
- Мои проекты (active)
- Документы
- Счета
- Сообщения

---

PAGE CONTENT:

GREETING:
- "Добро пожаловать, Иван!"
- Subtext: "Вот статус ваших проектов"

ACTIVE PROJECTS (cards grid, 2-3 per row):

Project Card:
- Project name: "Корпоративный портал"
- Status badge: "В работе"
- Large circular progress: 65%
- Current stage: "Этап: Разработка"
- Last update: "Обновлено: 2 дня назад"
- "Подробнее →" link

Project Card 2:
- Different project
- Different status
- etc.

---

Section "Требует вашего внимания" (if any):
Alert style cards:
- "Этап 'Дизайн' готов к согласованию" — [Посмотреть] button
- "Выставлен счёт на 150 000 ₽" — [Оплатить] button
- "Ожидается ваш ответ" — [Ответить] button

---

Section "Последние обновления":
Timeline feed:
- Date + "Завершён этап 'Аналитика'" — Project: Портал
- Date + "Загружены новые макеты" — Project: Мобильное приложение
- etc.

RESPONSIVE:
- Mobile: Single column
- Project cards full-width
- Bottom navigation optional
```

---

## 8.3 Портал — Детали проекта для клиента

```
Design a client-facing project detail view for "ITL OrderFlow" portal.

CLEAN, READ-FOCUSED LAYOUT:

HEADER:
- Back arrow to dashboard
- Project name: "Корпоративный портал"
- Status badge: "В работе"

HERO SECTION:
- Large progress visualization:
  • Circular progress ring (65%) with animation
  • Or horizontal progress bar
- Current stage: "Текущий этап: Разработка"
- Estimated completion: "Планируемое завершение: 30 апреля"

---

TAB NAVIGATION (simple):
- Прогресс (active)
- Документы
- Обсуждение
- Счета

---

TAB: ПРОГРЕСС

Visual Timeline (vertical):
- Connected dots/nodes for each milestone
- Completed: green checkmark, date completed
- Current: blue dot (animated pulse), in progress indicator
- Upcoming: gray dot

Example:
✓ Аналитика — Завершено 15 фев
✓ Дизайн — Завершено 28 фев
● Разработка — В процессе (65%)
○ Тестирование — Запланировано: 15 апр
○ Запуск — Запланировано: 30 апр

---

CURRENT STAGE DETAIL CARD:
- Stage name: "Разработка"
- What's happening: description text
- Progress within stage: mini bar
- Expected completion: date
- Action button if approval needed: "✓ Одобрить этап"

---

Section "Последние обновления":
Feed of recent changes:
- Team member avatar + action + timestamp
- "Алексей добавил 3 новых экрана в Figma" — 2 часа назад
- "Завершена интеграция с API" — вчера

---

TAB: ДОКУМЕНТЫ

Grid of shared files:
- Thumbnails
- Filter by milestone
- Download buttons

---

TAB: ОБСУЖДЕНИЕ

Chat/comment thread:
- Messages from both sides (team + client)
- Timestamp, avatars
- File attachments
- Reply input at bottom

RESPONSIVE:
- Mobile-first design
- Timeline vertical and compact
- Clear touch targets
```

---

## 8.4 Портал — Одобрение этапа

```
Design a milestone approval screen for client portal in "ITL OrderFlow".

MODAL or DEDICATED PAGE:

HEADER:
- "Согласование этапа"
- Project name (small)
- Milestone name: "Этап 2: Дизайн макетов"

---

CONTENT:

Section "Что было сделано":
- Checklist of deliverables (readonly):
  ✓ Главная страница — 3 варианта
  ✓ Страница каталога
  ✓ Карточка товара
  ✓ Личный кабинет
  ✓ UI kit и компоненты

Section "Файлы для просмотра":
- Thumbnails/previews
- Click to open full preview
- Download all button

Section "Детали":
- Info grid:
  • Начало: 20 февраля
  • Завершён: 28 февраля
  • Затрачено времени: 45 часов
  • Стоимость этапа: 75 000 ₽

Section "Комментарий от команды":
- Text from team (if any)

---

ACTION SECTION:

"Ваш отзыв" textarea:
- Placeholder: "Оставьте комментарий или пожелания..."

TWO ACTION BUTTONS (large):

Left button (outline, amber):
- "⟲ Запросить доработки"
- Opens feedback form with specific requests

Right button (primary, green):
- "✓ Одобрить этап"
- Confirmation: "Подтвердить одобрение?"

---

SIGNATURE (optional, if required by settings):
- "Ваша подпись:"
- Canvas drawing area
- "Очистить" button

---

FOOTER NOTE (small text):
- "После одобрения этап считается завершённым. При необходимости будет выставлен счёт."

RESPONSIVE:
- Mobile: Full-screen
- Signature canvas adapts
- Large touch-friendly buttons
```

---

## 8.5 Портал — Счета клиента

```
Design client invoices view for portal in "ITL OrderFlow".

Accessed from portal navigation "Счета" tab.

PAGE HEADER:
- "Счета"
- Filter tabs: Все | К оплате | Оплачены

---

INVOICES LIST as cards (cleaner than table):

Invoice Card:
- Top row: Invoice number + Date
- Client-friendly title: "Разработка — этап 2"
- Amount: "150 000 ₽" (large)
- Status badge:
  • К оплате (yellow)
  • Оплачен (green check)
  • Просрочен (red warning)
- Due date: "Оплатить до: 30 марта"
- Actions:
  • "Скачать PDF" button
  • "Оплатить онлайн" button (if payment integration enabled)

---

INVOICE DETAIL (when clicked):

Modal or page:
- Invoice header with numbers
- Line items table (readonly)
- Totals
- Payment status
- Download PDF button
- Payment history (if partial)

If online payment enabled:
- "Оплатить картой" button
- Opens payment form/redirect

RESPONSIVE:
- Cards stack vertically
- Full-width on mobile
```

---

# МОДУЛЬ 9: НАСТРОЙКИ

## 9.1 Настройки — Профиль компании

```
Design organization profile settings page for "ITL OrderFlow" SaaS.

LAYOUT: Settings sidebar + main content

SETTINGS SIDEBAR (left, 250px):
- Section: "Организация"
  • Профиль компании (active)
  • Пользователи
  • Роли и права
- Section: "Рабочий процесс"
  • Статусы заказов
  • Шаблоны документов
  • Теги и категории
- Section: "Уведомления"
  • Email уведомления
  • Telegram бот
- Section: "Интеграции"
  • Подключения
  • API
- Section: "Биллинг"
  • Подписка
  • История платежей
- Section: "Безопасность"
  • Аутентификация
  • Журнал действий
- Section: "Данные"
  • Экспорт данных
  • Удаление аккаунта

---

MAIN CONTENT: "Профиль компании"

Section "Основная информация":
- Company name input
- Legal name input
- INN input
- Address textarea
- Phone input
- Email input
- Website input

Section "Брендирование":
- Logo upload:
  • Current logo preview (circle)
  • Drag-drop area or browse button
  • "Удалить" link
  • Hint: "PNG или JPG, макс 2 MB"
- Primary color picker:
  • Color swatch
  • HEX input
  • Preview of how it looks
- "Эти настройки применяются в клиентском портале и документах"

Section "Локализация":
- Timezone dropdown (with auto-detect option)
- Currency dropdown: TJS, RUB, USD, EUR
- Date format dropdown: DD.MM.YYYY, MM/DD/YYYY, YYYY-MM-DD
- Language dropdown: Русский, English

Section "Клиентский портал":
- Toggle: "Включить клиентский портал"
- Custom domain input (enterprise): portal.yourcompany.com
- Welcome message textarea
- Toggle: "Разрешить клиентам загружать файлы"
- Toggle: "Требовать авторизацию (или доступ по ссылке)"

SAVE BUTTON (sticky bottom):
- "Сохранить изменения" primary button
- Unsaved changes indicator

RESPONSIVE:
- Mobile: Settings nav becomes hamburger/drawer
- Full-width form fields
```

---

## 9.2 Настройки — Пользователи

```
Design users management settings page for "ITL OrderFlow" SaaS.

Settings sidebar active on "Пользователи"

MAIN CONTENT:

HEADER:
- Title: "Пользователи"
- Plan limit indicator: "5 из 10 пользователей"
- Right: "+ Пригласить" button

TABS: Активные | Приглашённые | Деактивированные

---

TAB: АКТИВНЫЕ

Users table:
| Пользователь | Email | Роль | Последняя активность | Статус | ⋯ |

Row:
- Avatar + Name
- Email
- Role badge dropdown (Owner, Admin, Manager, Developer, Viewer)
- "2 часа назад" or "Никогда"
- Status: Active (green dot)
- Actions: Edit, Deactivate, Remove

OWNER row: Can't be removed, role locked

---

TAB: ПРИГЛАШЁННЫЕ

Pending invitations:
| Email | Роль | Приглашён | Истекает | ⋯ |

Actions: Resend, Cancel invitation

---

INVITE MODAL:

Triggered by "+ Пригласить":
- Email input (can add multiple, comma separated)
- Role dropdown
- Personal message textarea (optional)
- "Отправить приглашение" button

---

USER EDIT MODAL:

When editing a user:
- Name (readonly or editable)
- Email
- Role dropdown
- Avatar upload
- Toggle: "Активен"
- "Сохранить" button

RESPONSIVE:
- Mobile: User cards instead of table
- Modal fullscreen
```

---

## 9.3 Настройки — Статусы заказов (Pipeline)

```
Design order statuses/pipeline configuration page for "ITL OrderFlow".

Settings > Статусы заказов

HEADER:
- Title: "Статусы заказов"
- Description: "Настройте этапы, через которые проходят ваши заказы"
- "Сбросить к стандартным" link

---

PIPELINE PREVIEW (top):
Visual horizontal flow:
[Новая заявка] → [Оценка] → [КП отправлено] → [В работе] → [Тестирование] → [Ревью] → [Завершён]
- Colors shown
- Drag to reorder

---

STATUSES LIST (sortable):

Each status row (card style):
- Drag handle (⋮⋮)
- Color picker (dot, click to change)
- Status name (editable inline)
- System code (readonly, small text)
- Icon selector dropdown

Toggles row:
- "Начальный" radio (only one can be selected)
- "Завершающий" checkbox
- "Уведомлять клиента" checkbox
- "Требует одобрения" checkbox

Actions:
- Toggle active/inactive
- Delete (if not system status)

Validation:
- Can't delete if orders exist with this status
- Warning icon if misconfigured

---

ADD STATUS:
- "+ Добавить статус" button at bottom
- Inline add or modal

---

PREVIEW SECTION:
- "Так будет выглядеть Kanban:"
- Mini preview of kanban columns with sample cards

RESPONSIVE:
- Mobile: Vertical list
- Drag with long press
- Inline toggles become expandable sections
```

---

## 9.4 Настройки — Шаблоны документов

```
Design document templates settings page for "ITL OrderFlow".

Settings > Шаблоны документов

HEADER:
- Title: "Шаблоны документов"
- Description: "Настройте внешний вид счетов, КП и актов"

---

TEMPLATE CATEGORIES (tabs or sections):
- Счета
- Коммерческие предложения
- Акты
- Договоры

---

EACH CATEGORY shows template cards:

Template Card:
- Thumbnail preview of document
- Template name: "Стандартный счёт"
- "По умолчанию" badge if default
- "Редактировать" | "Дублировать" | "Удалить"

"+ Создать шаблон" card

---

TEMPLATE EDITOR (when editing):

Full-page editor:
- Back to templates list

Left panel (settings):
- Template name input
- Page size: A4, Letter
- Orientation: Portrait, Landscape
- Margins inputs (top, right, bottom, left)
- Toggle: "Использовать по умолчанию"

Center (WYSIWYG editor):
- Visual editor for template layout
- Drag-drop blocks:
  • Header (company logo, info)
  • Client info block
  • Document title/number
  • Line items table
  • Totals block
  • Notes
  • Footer
- Formatting tools: fonts, colors, alignment

Right panel (variables):
- Available variables list:
  • {{company_name}}
  • {{company_logo}}
  • {{client_name}}
  • {{invoice_number}}
  • {{invoice_date}}
  • {{items}}
  • {{total}}
  • etc.
- Click to insert

Preview button:
- Shows rendered template with sample data

Save/Cancel buttons

RESPONSIVE:
- Mobile: Template list only, editor requires desktop
- Show message: "Редактирование шаблонов доступно на компьютере"
```

---

## 9.5 Настройки — Интеграции

```
Design integrations marketplace/settings for "ITL OrderFlow".

Settings > Интеграции

HEADER:
- Title: "Интеграции"
- Description: "Подключите сторонние сервисы"
- Search integrations input

---

CATEGORY FILTER (tabs):
- Все
- Управление задачами
- Коммуникации
- Хранилище
- Бухгалтерия
- Разработка

---

CONNECTED SECTION (top):
- "Подключённые интеграции"
- Cards of connected services

Connected card:
- Service logo (Jira, Telegram, etc.)
- Service name
- "Подключено" green badge
- Last sync: "5 мин назад"
- "Настроить" button

---

AVAILABLE SECTION:

Integration cards grid (3 per row):

Card:
- Service logo
- Service name: "Jira"
- Description: "Синхронизация задач с Jira"
- "Подключить" button

OR for enterprise:
- "Enterprise" badge
- "Upgrade" button instead

---

INTEGRATION DETAIL (when clicked or configuring):

Slide-over panel or modal:

HEADER:
- Service logo (large)
- Service name
- Description paragraph
- "Подключено" status (if connected)

FEATURES LIST:
- ✓ Синхронизация задач
- ✓ Автоматическое обновление статусов
- ✓ Комментарии в обе стороны

SETUP SECTION:
- OAuth: "Подключить аккаунт" button → redirect to service
- OR API key input field

CONFIGURATION (if connected):
- Sync settings:
  • Project mapping dropdown
  • Status mapping table
  • Sync direction: both/one-way
  • Sync frequency

- Toggle: "Активна"

- "Отключить интеграцию" danger button

SAVE button

RESPONSIVE:
- Mobile: Single column cards
- Detail as full-screen modal
```

---

## 9.6 Настройки — Подписка и биллинг

```
Design subscription and billing settings page for "ITL OrderFlow".

Settings > Подписка

---

CURRENT PLAN CARD (prominent):
- Plan name: "Business"
- Price: "$79/месяц"
- Status: "Активна" green badge
- Next billing: "15 апреля 2024"
- "Изменить план" button | "Отменить подписку" link

USAGE METRICS:
- Users: 7 из 10 (progress bar)
- Projects: 23 из 50 (progress bar)
- Storage: 8.5 GB из 25 GB (progress bar)

---

PLAN COMPARISON (collapsed, expandable):
- "Сравнить планы" link
- Expands to show pricing table similar to signup

---

PAYMENT METHOD:
Card:
- "Способ оплаты"
- Card icon + •••• 4242 | Visa
- Expires: 12/25
- "Изменить" button

Add payment method if none:
- "Добавить карту" button

---

BILLING HISTORY:
Table:
| Дата | Описание | Сумма | Статус | Скачать |

Rows:
- 15 мар 2024 | Business план (ежемесячно) | $79 | Оплачено ✓ | PDF

---

BILLING INFO:
- Company name (for invoices)
- Billing email
- Tax ID / VAT number
- Billing address
- "Редактировать" button

RESPONSIVE:
- Single column on mobile
- Plan card prominent at top
```

---

## 9.7 Настройки — Уведомления

```
Design notification settings page for "ITL OrderFlow".

Settings > Уведомления

HEADER:
- Title: "Уведомления"
- Description: "Настройте, как и когда получать уведомления"

---

CHANNEL TOGGLES (top section):

Card row:
- Email: toggle ON/OFF, email shown
- Telegram: toggle + "Подключить бот" button (if not connected)
- Browser push: toggle + permission status

---

NOTIFICATION PREFERENCES:

Table/Matrix:
Event types vs channels

| Событие | В приложении | Email | Telegram |
|---------|--------------|-------|----------|
| Новый заказ | ✓ | ✓ | ☐ |
| Назначение на задачу | ✓ | ✓ | ✓ |
| Комментарий к проекту | ✓ | ☐ | ✓ |
| Приближается дедлайн | ✓ | ✓ | ✓ |
| Получен платёж | ✓ | ✓ | ☐ |
| Клиент одобрил этап | ✓ | ✓ | ☐ |

Checkboxes in each cell.

---

SCHEDULE SECTION:
"Тихие часы":
- Toggle: "Не беспокоить"
- Time pickers: "С 22:00 до 08:00"
- Days: checkboxes for each day

---

TELEGRAM BOT SETUP (if not connected):
Card:
- Telegram icon
- "Подключите Telegram для мгновенных уведомлений"
- Instructions:
  1. Откройте бота @ITLOrderFlowBot
  2. Отправьте команду /start
  3. Введите код: ABC123
- QR code for quick access

---

SAVE BUTTON (sticky)

RESPONSIVE:
- Mobile: Matrix becomes expandable sections by event
```

---

# МОДУЛЬ 10: ОТЧЁТЫ

## 10.1 Центр отчётов

```
Design a reports center page for "ITL OrderFlow" SaaS.

PAGE HEADER:
- Title: "Отчёты"
- Global date range picker: "Последние 30 дней ▼"

---

REPORT CATEGORIES as card sections:

Section "Проекты":
Report cards (3 per row):

Card 1:
- Icon: PieChart (blue circle bg)
- Title: "Статусы проектов"
- Description: "Распределение заказов по статусам"
- Arrow icon →

Card 2:
- Icon: Funnel
- Title: "Воронка продаж"
- Description: "Конверсия от КП до заказа"

Card 3:
- Icon: Calendar
- Title: "Соблюдение сроков"
- Description: "Анализ дедлайнов"

---

Section "Финансы":

Card 1:
- Icon: TrendingUp (green)
- Title: "Выручка"
- Description: "Доходы по периодам и клиентам"

Card 2:
- Icon: Table
- Title: "P&L по проектам"
- Description: "Прибыльность проектов"

Card 3:
- Icon: AlertTriangle (red)
- Title: "Дебиторская задолженность"
- Description: "Неоплаченные счета"

---

Section "Команда":

Card 1:
- Icon: Users
- Title: "Загрузка команды"
- Description: "Распределение часов"

Card 2:
- Icon: Activity
- Title: "Производительность"
- Description: "Эффективность сотрудников"

Card 3:
- Icon: Clock
- Title: "Время по проектам"
- Description: "Детализация трудозатрат"

---

Section "Клиенты":

Card 1:
- Icon: Star
- Title: "Топ клиенты"
- Description: "По выручке и количеству проектов"

Card 2:
- Icon: Heart
- Title: "Lifetime Value"
- Description: "Ценность клиента за всё время"

---

Card hover: slight lift, border color change
Card click: navigate to report detail

RESPONSIVE:
- Tablet: 2 cards per row
- Mobile: Single column, full-width cards
```

---

## 10.2 Детальный отчёт (пример: Загрузка команды)

```
Design a detailed report page "Team Workload" for "ITL OrderFlow".

PAGE HEADER:
- Back arrow + Breadcrumb: "Отчёты / Загрузка команды"
- Title: "Загрузка команды"
- Date range picker (from center page or override)
- Right: "Экспорт ▼" dropdown (PDF, Excel, CSV) + "Поделиться" button

---

FILTERS BAR:
- Team members multi-select
- Projects multi-select
- Billable/All toggle
- "Применить" button

---

SUMMARY CARDS (4):
- "Всего часов" — 1 245 — icon: Clock
- "Среднее на человека" — 156 — icon: User
- "Оплачиваемых" — 78% — icon: DollarSign
- "Переработки" — 45 ч — icon: AlertTriangle (warning color)

---

MAIN VISUALIZATION:

Stacked Horizontal Bar Chart:
- Y-axis: Team member names (with avatars)
- X-axis: Hours (0 to max)
- Bars: segmented by project (different colors)
- Vertical line: Target/norm (e.g., 160h)
- Legend: Project names with colors

Chart interactions:
- Hover bar segment: tooltip with project name + hours
- Click: filter to that person/project

---

DETAILED TABLE (below chart):

Columns: Сотрудник | Проект 1 | Проект 2 | ... | Внутренние | Итого | % от нормы

Rows: Each team member
Last row: Totals

Cell styling:
- Over target: red background
- Under 50%: yellow
- Normal: green

---

INSIGHTS PANEL (optional, AI-generated):
Card with lightbulb icon:
- "⚠️ Алексей превысил норму на 12% — рекомендуется перераспределить задачи"
- "📊 Проект 'Корпоративный портал' занимает 40% времени команды"
- "✅ Мария недозагружена — можно назначить дополнительные задачи"

---

DRILL-DOWN:
- Click on person → detailed breakdown for that person
- Click on project → time by person for that project

RESPONSIVE:
- Mobile: Chart becomes vertical or summary only
- Table scrolls horizontally
- Filters collapse
```

---

## 10.3 Отчёт — Воронка продаж

```
Design a sales funnel report for "ITL OrderFlow".

PAGE HEADER:
- Back + "Воронка продаж"
- Date range picker
- Export button

---

FUNNEL VISUALIZATION:

Classic funnel shape:
- Stage 1: "КП отправлено" — 50 — 100% (widest)
- Stage 2: "КП просмотрено" — 38 — 76%
- Stage 3: "КП принято" — 25 — 50%
- Stage 4: "Заказ создан" — 22 — 44%
- Stage 5: "Заказ завершён" — 18 — 36% (narrowest)

Funnel styling:
- Each stage different color (gradient from top)
- Percentage shown
- Conversion rate between stages (e.g., "76% →")
- Hover: show detailed numbers

---

METRICS ROW:
- "Общая конверсия: 36%"
- "Средний цикл: 14 дней"
- "Средний чек: 150 000 ₽"

---

BREAKDOWN TABLE:

By Period:
| Месяц | КП отправлено | Принято | Конверсия | Сумма |
| Январь | 15 | 6 | 40% | 900 000 ₽ |
| Февраль | 20 | 9 | 45% | 1 200 000 ₽ |
| ... | | | | |

By Source (if tracked):
| Источник | КП | Заказы | Конверсия |
| Рекомендации | 30 | 15 | 50% |
| Сайт | 15 | 5 | 33% |
| Реклама | 5 | 2 | 40% |

---

TRENDS CHART:
Line chart showing conversion rate over time

RESPONSIVE:
- Mobile: Funnel simplifies to horizontal bars
- Tables scroll
```

---

# МОДУЛЬ 11: UI КОМПОНЕНТЫ

## 11.1 Уведомления (Dropdown Panel)

```
Design a notifications dropdown panel for "ITL OrderFlow".

TRIGGER: Bell icon in header with badge

PANEL (slides down, 400px width, max-height 500px):

HEADER:
- "Уведомления"
- "Отметить все как прочитанные" link (if any unread)
- Settings gear icon → link to notification settings

TABS: Все | Непрочитанные (3)

---

NOTIFICATIONS LIST (scrollable):

Notification item (unread):
- Left: Blue dot indicator
- Icon based on type (comment, status change, deadline, etc.)
- Content:
  • Bold text: "Новый комментарий"
  • Detail: "Клиент оставил комментарий к проекту 'Корпоративный портал'"
  • Link: project name clickable
- Right: Timestamp "5 мин назад"
- Hover: "Mark as read" X button appears

Notification item (read):
- No blue dot
- Slightly muted colors
- Same structure

GROUPING:
- "Сегодня"
- "Вчера"
- "Ранее"

---

EMPTY STATE:
- Bell icon (muted)
- "Нет новых уведомлений"
- "Мы сообщим, когда что-то произойдёт"

---

FOOTER:
- "Все уведомления →" link (goes to full notifications page)

OUTSIDE CLICK: closes panel

RESPONSIVE:
- Mobile: Full-screen modal instead of dropdown
```

---

## 11.2 Глобальный поиск (Command Palette)

```
Design a global search / command palette for "ITL OrderFlow".

TRIGGER: ⌘K keyboard shortcut OR clicking search bar

OVERLAY: Dark semi-transparent backdrop

MODAL (centered, 600px width):

SEARCH INPUT:
- Large input field
- Placeholder: "Поиск заказов, клиентов, задач..."
- Search icon left
- Clear button right (when has text)
- Keyboard hint: "Esc для закрытия"
- Auto-focus on open

---

INITIAL STATE (no query):

"Быстрые действия":
- [+] Создать заказ — ⌘N
- [+] Добавить клиента — ⌘⇧C
- [+] Новая задача — ⌘T
- [clock] Записать время — ⌘⇧T

"Недавние":
- Recent items list (last 5 viewed)

---

SEARCH RESULTS (when typing):

Grouped by type:

"Заказы" (3):
- Icon + "#ORD-2024-047 — Корпоративный портал" + Client name (small)
- Highlight matching text

"Клиенты" (2):
- Icon + "ООО ТехноСофт" + "5 активных проектов"

"Задачи" (4):
- Icon + "Создать макеты главной" + Project name

"Документы" (1):
- Icon + "Техническое задание.pdf" + Project name

Each result row:
- Left icon (color by type)
- Title with highlight
- Context info (gray)
- Keyboard nav: arrow up/down to select

---

KEYBOARD NAVIGATION:
- ↑↓ navigate results
- Enter select
- Tab switch category
- Esc close

---

NO RESULTS:
- "Ничего не найдено по запросу 'xyz'"
- "Попробуйте другой запрос"

FOOTER:
- Keyboard hints: "↑↓ навигация • Enter выбрать • Esc закрыть"

RESPONSIVE:
- Mobile: Full-screen modal
- Touch-friendly result rows
- No keyboard hints shown
```

---

## 11.3 Комментарии (Thread Component)

```
Design a comments thread component for "ITL OrderFlow".

Used in: Order detail, Task detail, Client portal

---

COMMENTS SECTION:

HEADER:
- "Комментарии" + count "(8)"
- Filter toggle: "Все" | "Только внешние" (visible to client)

---

THREAD:

Comment (team member):
- Left: Avatar
- Right:
  • Name + Role badge (optional) + Timestamp
  • Comment text (supports markdown/formatting)
  • Attachments row (if any): file thumbnails
  • Actions (on hover): Reply, Edit (own), Delete (own)
- Internal badge if internal comment (eye-off icon)

Comment (client - in portal context):
- Different style: client badge, different background tint
- Avatar + Name + "Клиент" badge

Reply (indented):
- Indented under parent
- Same structure
- Collapse/expand for long threads

---

LOAD MORE:
- "Показать предыдущие комментарии" if many

---

INPUT (bottom, sticky):

Input area:
- Avatar (current user)
- Textarea: "Написать комментарий..."
- Expand on focus

Expanded state:
- Larger textarea
- Formatting buttons (bold, italic, list)
- Attachment button (paperclip)
- Toggle: "Видимый клиенту" checkbox (default based on context)
- "Отправить" button (or ⌘Enter)

---

MENTIONS (typing @):
- Dropdown with team members
- Filter as you type

RESPONSIVE:
- Full-width comments
- Input at bottom of screen (mobile)
- Simplified formatting on mobile
```

---

## 11.4 Загрузка файлов (Upload Component)

```
Design a file upload component for "ITL OrderFlow".

---

DRAG-DROP ZONE:
- Dashed border (2px, gray)
- Center content:
  • Cloud upload icon (large)
  • "Перетащите файлы сюда"
  • "или" divider
  • "Выберите файлы" link/button
- Hint below: "Макс. размер: 50 MB • PNG, JPG, PDF, DOC, XLS"

DRAG OVER STATE:
- Blue border
- Blue tint background
- Icon animates

---

UPLOAD PROGRESS:

Uploading item:
- File icon (by type)
- Filename: "presentation.pdf"
- Size: "2.4 MB"
- Progress bar (animated)
- Percentage: "45%"
- Cancel button (X)

Multiple files: stacked list

---

COMPLETED:
- Green checkmark
- Filename
- Size
- "Удалить" link

---

ERROR STATE:
- Red warning icon
- Filename
- Error: "Файл слишком большой"
- "Повторить" | "Удалить"

---

COMPACT MODE (for inline use):
- Button: "+ Прикрепить файл"
- Small thumbnails of attached files
- Remove button on each

RESPONSIVE:
- Full-width on mobile
- Larger touch targets
- Camera option on mobile (for photos)
```

---

## 11.5 Пустые состояния (Empty States)

```
Design empty state templates for "ITL OrderFlow".

---

TEMPLATE 1: No items (list/table)

Centered content:
- Illustration (relevant to context: empty folder, no users, etc.)
- Heading: "Пока нет [объектов]"
- Subtext: "Описание, что делать дальше"
- Primary action button: "+ Создать [объект]"
- Secondary link (optional): "Узнать больше"

Example - No orders:
- Illustration: empty folder with sparkles
- "Пока нет заказов"
- "Создайте первый заказ, чтобы начать работу"
- Button: "+ Создать заказ"

---

TEMPLATE 2: No search results

Centered content:
- Illustration: magnifying glass with question mark
- Heading: "Ничего не найдено"
- Subtext: "По запросу '[query]' не найдено результатов"
- Suggestions:
  • "Проверьте правильность написания"
  • "Попробуйте другие ключевые слова"
- Link: "Сбросить фильтры"

---

TEMPLATE 3: No access / Error

Centered content:
- Illustration: lock or error icon
- Heading: "Нет доступа" or "Что-то пошло не так"
- Subtext: explanation
- Button: "Вернуться назад" or "Обновить страницу"

---

TEMPLATE 4: Feature not enabled

- Illustration: feature-specific
- Heading: "Интеграция не подключена"
- Subtext: "Подключите [сервис] для использования этой функции"
- Button: "Подключить"

RESPONSIVE: Same structure, illustrations may be smaller
```

---

## 11.6 Toast уведомления (Toasts)

```
Design toast notification component for "ITL OrderFlow".

POSITION: Bottom-right corner (desktop), bottom-center (mobile)

---

TOAST VARIANTS:

SUCCESS:
- Green left border or background tint
- Checkmark icon (green)
- Title: "Заказ создан"
- Description (optional): "Заказ #ORD-2024-048 успешно создан"
- Close X button
- Auto-dismiss: 5 seconds

ERROR:
- Red left border
- X-circle icon (red)
- Title: "Ошибка сохранения"
- Description: "Не удалось сохранить изменения. Попробуйте снова."
- "Повторить" action link
- No auto-dismiss (user must close)

WARNING:
- Amber left border
- AlertTriangle icon
- Title: "Внимание"
- Description: message
- Auto-dismiss: 7 seconds

INFO:
- Blue left border
- Info icon
- Neutral information
- Auto-dismiss: 5 seconds

---

TOAST WITH ACTION:
- Same structure
- Action button inline: "Отменить" (for undo actions)

---

STACKING:
- Multiple toasts stack vertically
- Newest on top
- Max 3 visible, older ones collapse

---

ANIMATIONS:
- Slide in from right
- Fade out on dismiss
- Progress bar for auto-dismiss timer (optional)

---

TOAST ANATOMY:
[Icon] [Content: Title + Description] [Action?] [Close X]

Width: 360px (desktop), full-width minus padding (mobile)

RESPONSIVE:
- Mobile: Bottom center, full width
- Swipe to dismiss
```

---

# ✅ ЧЕК-ЛИСТ ВСЕХ ЭКРАНОВ

## Аутентификация (5)
- [ ] 1.1 Login
- [ ] 1.2 Register Step 1
- [ ] 1.3 Register Step 2
- [ ] 1.4 Register Step 3 (Pricing)
- [ ] 1.5 Forgot Password

## Дашборд (2)
- [ ] 2.1 Main Dashboard
- [ ] 2.2 Empty Dashboard

## Клиенты (4)
- [ ] 3.1 Clients List
- [ ] 3.2 Client Detail
- [ ] 3.3 Client Contacts Tab
- [ ] 3.4 Add/Edit Client Modal

## Заказы (7)
- [ ] 4.1 Orders Kanban
- [ ] 4.2 Orders Table
- [ ] 4.3 Order Detail - Overview
- [ ] 4.4 Order Detail - Tasks
- [ ] 4.5 Order Detail - Files
- [ ] 4.6 Gantt Chart
- [ ] 4.7 Create Order Modal

## Задачи (3)
- [ ] 5.1 Tasks List
- [ ] 5.2 Task Detail Modal
- [ ] 5.3 Quick Add Task

## Учёт времени (3)
- [ ] 6.1 Time Tracking Page
- [ ] 6.2 Add Time Modal
- [ ] 6.3 Timer Widget

## Финансы (6)
- [ ] 7.1 Financial Dashboard
- [ ] 7.2 Invoices List
- [ ] 7.3 Invoice Create/Edit
- [ ] 7.4 Proposals List
- [ ] 7.5 Proposal Create/Edit
- [ ] 7.6 Payment Record

## Клиентский портал (5)
- [ ] 8.1 Portal Login
- [ ] 8.2 Portal Dashboard
- [ ] 8.3 Portal Project Detail
- [ ] 8.4 Portal Milestone Approval
- [ ] 8.5 Portal Invoices

## Настройки (7)
- [ ] 9.1 Organization Profile
- [ ] 9.2 Users Management
- [ ] 9.3 Order Statuses/Pipeline
- [ ] 9.4 Document Templates
- [ ] 9.5 Integrations
- [ ] 9.6 Subscription & Billing
- [ ] 9.7 Notifications

## Отчёты (3)
- [ ] 10.1 Reports Center
- [ ] 10.2 Team Workload Report
- [ ] 10.3 Sales Funnel Report

## UI Компоненты (6)
- [ ] 11.1 Notifications Panel
- [ ] 11.2 Global Search (Command Palette)
- [ ] 11.3 Comments Thread
- [ ] 11.4 File Upload
- [ ] 11.5 Empty States
- [ ] 11.6 Toast Notifications

---

**ВСЕГО: 46 экранов и компонентов**

---

# 📝 Советы по работе в Stitch

1. **Копируй базовый стиль** в каждый промпт для консистентности
2. **Начни с основных экранов**: Login → Dashboard → Orders → Order Detail
3. **Собирай компоненты**: сначала создай базовые UI элементы, потом собирай экраны
4. **Проверяй responsive**: запрашивай мобильную версию отдельно если нужно
5. **Итерируй**: "Make the cards more compact", "Use less shadow", "Change to single column"

---

*Документ создан для ITL Solutions — ITL OrderFlow SaaS Platform*
