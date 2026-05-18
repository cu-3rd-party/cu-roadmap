import type { GraphData } from "@/shared/config";

export const MOCK_GRAPH: GraphData = {
  nodes: [
    {
      id: "8c3ff068-c93e-4eca-9034-c33c541a6862",
      label: "Разработка на Python. Основной",
      group: "tech",
      title:
        "Изучение основ синтаксиса Python, базовых структур данных и написание первых скриптов.",
      recommended_semester: 1,
    },
    {
      id: "1e7e1040-d9c2-4ebf-8570-5fc71ef48cf6",
      label: "Разработка на Python. Углублённый",
      group: "tech",
      title:
        "Командная разработка, работа с API, FastAPI, создание Telegram-ботов и интеграция с БД.",
      recommended_semester: 3,
    },
    {
      id: "a5b72212-2119-4c08-b3f8-ff7edaeaed5c",
      label: "Разработка на Python. Профессиональный",
      group: "tech",
      title:
        "Продвинутые архитектурные паттерны, оптимизация производительности и масштабируемые системы.",
      recommended_semester: 3,
    },
    {
      id: "e6930a68-ac79-4ba2-9078-31e12ce1e608",
      label: "Архитектура компьютера и ОС",
      group: "stem",
      title:
        "Изучение низкоуровневого устройства ЭВМ, работы памяти и принципов функционирования ОС.",
      recommended_semester: 1,
    },
    {
      id: "4007d8ec-af8c-4609-9914-7d244549e424",
      label: "Основы разработки на Go",
      group: "tech",
      title:
        "Изучение языка Go, его многопоточности и применения в бэкенд-разработке.",
      recommended_semester: 1,
    },
    {
      id: "253e4997-4ab3-4e4a-b060-e2924f0669a7",
      label: "Базы данных",
      group: "tech",
      title:
        "Проектирование реляционных БД, SQL запросы, транзакции и индексы.",
      recommended_semester: 1,
    },
    {
      id: "b3da833e-e657-4f7a-84b7-805d6a217dbf",
      label: "Алгоритмы и структуры данных I",
      group: "stem",
      title:
        "Основы сложности алгоритмов, сортировки, стеки, очереди и деревья.",
      recommended_semester: 3,
    },
    {
      id: "0eacc55e-39ee-4574-8d38-08682206ad76",
      label: "Теория вероятностей и матстатистика",
      group: "stem",
      title:
        "Случайные величины, распределения и основы статистического анализа данных.",
      recommended_semester: 1,
    },
    {
      id: "5bd24949-9e87-4c5c-9cb8-e330f39a95e6",
      label: "Введение в экономику",
      group: "business",
      title:
        "Базовые принципы экономики, спрос и предложение, рыночное равновесие.",
      recommended_semester: 1,
    },
    {
      id: "048fb192-2448-40c1-b0f4-4c48602f7f0f",
      label: "Основы бизнес-аналитики",
      group: "business",
      title: "Инструменты и методы сбора и анализа бизнес-требований.",
      recommended_semester: 1,
    },
    {
      id: "d5c71c18-2d73-4a58-83d0-f3f991dd96ad",
      label: "Основы финансов",
      group: "business",
      title:
        "Введение в управление финансами, временная стоимость денег и оценка активов.",
      recommended_semester: 1,
    },
    {
      id: "22a85585-693d-4459-9159-99ae8536aca0",
      label: "Микроэкономика I",
      group: "business",
      title: "Углубленное изучение поведения потребителей и фирм на рынке.",
      recommended_semester: 1,
    },
    {
      id: "2596603b-8d96-4939-8426-790a8d92daca",
      label: "Введение в статистику",
      group: "stem",
      title: "Основы описательной статистики и статистического вывода.",
      recommended_semester: 1,
    },
    {
      id: "dd406393-7065-448c-af04-33e99615fe85",
      label: "Machine Learning",
      group: "tech",
      title:
        "Классические методы машинного обучения: регрессия, классификация, кластеризация.",
      recommended_semester: 3,
    },
    {
      id: "701f118e-ca1a-45ff-a17c-ed7dab8ee96f",
      label: "Линейная алгебра и геометрия",
      group: "stem",
      title: "Векторы, матрицы, системы линейных уравнений и их применение.",
      recommended_semester: 1,
    },
    {
      id: "7d1a1ebb-2880-45b6-bcc2-e65f04f667c2",
      label: "Математический анализ",
      group: "stem",
      title: "Пределы, производные, интегралы и функции нескольких переменных.",
      recommended_semester: 1,
    },
    {
      id: "a804aa38-d91d-43fa-9590-fa79b8a46e7b",
      label: "Многопоточная синхронизация",
      group: "tech",
      title:
        "Параллельное программирование, примитивы синхронизации и предотвращение race conditions.",
      recommended_semester: 2,
    },
    {
      id: "ed1445db-88f2-4b0b-a11a-27c5fefa07d9",
      label: "Дискретная математика",
      group: "stem",
      title: "Графы, логика, комбинаторика и их применение в Computer Science.",
      recommended_semester: 2,
    },
    {
      id: "864817bb-f019-4845-8ade-b0d12df4bee3",
      label: "Информационная безопасность",
      group: "tech",
      title:
        "Принципы защиты данных, криптография и безопасность сетевых приложений.",
      recommended_semester: 2,
    },
    {
      id: "c09e82fb-3115-4a5d-abaa-b25751d96f8a",
      label: "Web-разработка",
      group: "tech",
      title:
        "Создание современных веб-приложений: frontend (React) и backend составляющие.",
      recommended_semester: 2,
    },
    {
      id: "27b6fac3-5778-412b-a8b1-22edb2ba1531",
      label: "Основы маркетинга",
      group: "business",
      title: "Стратегии продвижения продуктов, сегментация рынка и брендинг.",
      recommended_semester: 2,
    },
    {
      id: "1b5723da-fe70-42e8-a61a-9b36401b6acf",
      label: "Теория игр",
      group: "business",
      title:
        "Математические модели принятия решений в условиях конфликта интересов.",
      recommended_semester: 2,
    },
    {
      id: "8bfe6178-aa3d-4ffe-947b-c511f30688bf",
      label: "Финансы. Основной уровень",
      group: "business",
      title: "Управление корпоративными финансами и инвестиционный анализ.",
      recommended_semester: 2,
    },
    {
      id: "3f4eb877-6920-4593-8faf-205f8075ba5c",
      label: "Эконометрика I",
      group: "business",
      title:
        "Применение статистических методов для анализа экономических данных.",
      recommended_semester: 4,
    },
    {
      id: "11365ca8-ee89-4cda-b6ee-67342d18471e",
      label: "Математическая статистика",
      group: "stem",
      title: "Продвинутые методы проверки гипотез и оценивания параметров.",
      recommended_semester: 2,
    },
    {
      id: "4e5f4ec3-2572-4690-9eba-704f924cecc7",
      label: "Алгоритмы и структуры данных 2",
      group: "stem",
      title:
        "Графовые алгоритмы, динамическое программирование и продвинутые структуры.",
      recommended_semester: 4,
    },
    {
      id: "04fc9632-ecdf-4629-8d16-d3963af5b3d3",
      label: "Deep Learning",
      group: "tech",
      title: "Глубокое обучение, нейронные сети, компьютерное зрение и NLP.",
      recommended_semester: 4,
    },
    {
      id: "732e4095-7e54-44e6-b70f-edbfe83f55ab",
      label: "Архитектура компьютера и ОС 2",
      group: "stem",
      title:
        "Углубленное изучение системного программирования и архитектуры процессоров.",
      recommended_semester: 2,
    },
    {
      id: "32f88aab-3a70-45db-b2f6-f5dcb145c8d8",
      label: "Основы промышленной разработки",
      group: "tech",
      title: "Best practices написания кода, CI/CD, тестирование и код-ревью.",
      recommended_semester: 2,
    },
    {
      id: "bd35b5b5-a294-4ace-a5d2-719186a7eb36",
      label: "Макроэкономика I",
      group: "business",
      title:
        "Изучение экономики на государственном уровне: ВВП, инфляция, безработица.",
      recommended_semester: 2,
    },
    {
      id: "6c27a02e-e454-442d-b7f1-b727e0ac1932",
      label: "Введение в алгоритмы и СД",
      group: "stem",
      title: "Облегченный курс алгоритмов для студентов бизнес-направлений.",
      recommended_semester: 2,
    },
    {
      id: "4c7fee5c-5876-43ad-9a83-5e4e649a6e17",
      label: "Введение в ИИ",
      group: "tech",
      title:
        "Обзор технологий искусственного интеллекта и их применения в бизнесе.",
      recommended_semester: 2,
    },
    {
      id: "d455ad75-d229-4f42-90ca-a61a5d5ddf0e",
      label: "Командная работа по Agile",
      group: "soft",
      title: "Методологии гибкой разработки, роли в команде и процессы.",
      recommended_semester: 1,
    },
    {
      id: "cdb4032b-f33a-4694-a832-76d4f5536240",
      label: "Стресс-менеджмент",
      group: "soft",
      title: "Техники управления эмоциями и личной эффективностью.",
      recommended_semester: 1,
    },
  ],
  edges: [
    {
      from: "8c3ff068-c93e-4eca-9034-c33c541a6862",
      to: "1e7e1040-d9c2-4ebf-8570-5fc71ef48cf6",
      label: "prerequisite",
    },
    {
      from: "1e7e1040-d9c2-4ebf-8570-5fc71ef48cf6",
      to: "a5b72212-2119-4c08-b3f8-ff7edaeaed5c",
      label: "prerequisite",
    },
    {
      from: "2596603b-8d96-4939-8426-790a8d92daca",
      to: "dd406393-7065-448c-af04-33e99615fe85",
      label: "prerequisite",
    },
    {
      from: "dd406393-7065-448c-af04-33e99615fe85",
      to: "04fc9632-ecdf-4629-8d16-d3963af5b3d3",
      label: "prerequisite",
    },
    {
      from: "701f118e-ca1a-45ff-a17c-ed7dab8ee96f",
      to: "b3da833e-e657-4f7a-84b7-805d6a217dbf",
      label: "prerequisite",
    },
    {
      from: "ed1445db-88f2-4b0b-a11a-27c5fefa07d9",
      to: "b3da833e-e657-4f7a-84b7-805d6a217dbf",
      label: "corequisite_type1",
    },
    {
      from: "b3da833e-e657-4f7a-84b7-805d6a217dbf",
      to: "4e5f4ec3-2572-4690-9eba-704f924cecc7",
      label: "prerequisite",
    },
    {
      from: "e6930a68-ac79-4ba2-9078-31e12ce1e608",
      to: "732e4095-7e54-44e6-b70f-edbfe83f55ab",
      label: "prerequisite",
    },
    {
      from: "0eacc55e-39ee-4574-8d38-08682206ad76",
      to: "11365ca8-ee89-4cda-b6ee-67342d18471e",
      label: "prerequisite",
    },
    {
      from: "11365ca8-ee89-4cda-b6ee-67342d18471e",
      to: "3f4eb877-6920-4593-8faf-205f8075ba5c",
      label: "prerequisite",
    },
    {
      from: "22a85585-693d-4459-9159-99ae8536aca0",
      to: "bd35b5b5-a294-4ace-a5d2-719186a7eb36",
      label: "prerequisite",
    },
    {
      from: "701f118e-ca1a-45ff-a17c-ed7dab8ee96f",
      to: "1b5723da-fe70-42e8-a61a-9b36401b6acf",
      label: "prerequisite",
    },
    {
      from: "11365ca8-ee89-4cda-b6ee-67342d18471e",
      to: "04fc9632-ecdf-4629-8d16-d3963af5b3d3",
      label: "corequisite_type2",
    },
  ],
};
