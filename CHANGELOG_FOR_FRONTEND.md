# Changelog и Руководство для Фронтенд-разработчика

Документация по изменениям бэкенда и API с момента коммита [`a92fd1d4f066b8bc5444596a5df64d0bdf11ac57`](https://github.com/cu-3rd-party/cu-roadmap/commit/a92fd1d4f066b8bc5444596a5df64d0bdf11ac57).

---

## 1. Категории курсов и классификация Fundamentals
- **Проблема**: Курсы базового цикла (Fundamentals, например, Английский язык, Безопасность жизнедеятельности) в ответах API ошибочно классифицировались как `core`.
- **Изменение**: 
  - Сохранено исходное значение `category = "fundamentals"`.
  - Поле `by_major_type` для таких курсов не переопределяется на `core`, если курс является общеуниверситетским фундаментальным предметом.
- **Влияние на фронтенд**: Не требуется никаких специальных обработок. Курсы Fundamentals корректно возвращаются с категорией `fundamentals`.

---

## 2. Переход на архитектуру Коробок (Discipline Group Boxes) для пререквизитов и кореквизитов

### Что изменилось на бэкенде:
- Все пререквизиты и кореквизиты при автоматическом импорте из Google Sheets теперь преобразуются в сущности **Discipline Group (Коробки Дисциплин)** и рекурсивное дерево узлов (`Box` / `BoxEdge`).
- В структуру зависимостей `CourseDependencyData` добавлено поле `RequiredGroupID` (указывает на UUID соответствующей `DisciplineGroup`).

### Обратная совместимость для клиентского фронтенда (Студенческий интерфейс):
- Эндпоинты `GET /api/v1/courses`, `GET /api/v1/courses/{cohort_year}` и `GET /api/v1/courses/{cohort_year}/{major_id}` **продолжают возвращать пререквизиты и кореквизиты в привычном формате массива UUID курсов**:
  ```json
  {
    "id": "2a1340e2-51ad-46c4-9a32-9db478877771",
    "title": "Поведенческая экономика и финансы",
    "prerequisites": [
      "8e26a091-0000-0000-0000-000000000000"
    ],
    "corequisites": []
  }
  ```
- **Результат**: Публичные карточки курсов и интерфейс студенческих траекторий полностью совместимы.

---

## 3. Новые API-эндпоинты и структуры для админки коробок

При разработке админ-панели для визуального редактирования деревьев требований и коробок доступны следующие эндпоинты:

### 1) `GET /api/v1/discipline-groups`
Возвращает список всех коробок дисциплин (`DisciplineGroup`).
- **Схема ответа**:
  ```json
  [
    {
      "id": "96d180b6-cdfa-5431-bbb7-f5d1200d5172",
      "title": "Пререквизит для Поведенческая экономика: Введение в экономику",
      "category": "prerequisite",
      "root_box_id": "a1b2c3d4-...",
      "math_expression": {
        "type": "logical",
        "logical_op": "and",
        "min_count": 1,
        "children": [
          {
            "type": "course",
            "course_id": "8e26a091-...",
            "title": "Введение в экономику"
          }
        ]
      }
    }
  ]
  ```

### 2) CRUD эндпоинты коробок:
- `POST /api/v1/discipline-groups` — создать новую коробку
- `PUT /api/v1/discipline-groups/{id}` — обновить коробку (`title`, `category`, `math_expression`)
- `DELETE /api/v1/discipline-groups/{id}` — удалить коробку
- `GET /api/v1/discipline-groups/specialization/{id}` — получить список коробок, привязанных к специализации
- `POST /api/v1/discipline-groups/{id}/attach` — привязать коробку к специализации
- `POST /api/v1/discipline-groups/{id}/detach` — отвязать коробку от специализации

### 3) `GET /api/v1/courses/dependencies`
Возвращает сырые связи пререквизитов курсов с указанием привязанной `DisciplineGroup` (`required_group_id`):
- **Схема ответа**:
  ```json
  [
    {
      "id": "c1d2e3f4-...",
      "course_id": "2a1340e2-51ad-46c4-9a32-9db478877771",
      "required_course_id": "8e26a091-...",
      "required_group_id": "96d180b6-cdfa-5431-bbb7-f5d1200d5172",
      "dependency_type": "prerequisite",
      "alternative_group": 0
    }
  ]
  ```

### 4) `POST /api/v1/admin/sync`
Запускает ручную синхронизацию бэкенда с Google Sheets для автоматического переформирования коробок дисциплин.

---

## 4. Обновления OpenAPI Спецификации
Файл спецификации `backend/docs/api/v1.yaml` обновлен:
- Добавлены описания эндпоинтов `/api/v1/courses/dependencies` и `/api/v1/admin/sync`.
- Добавлена схема `CourseDependency` с описанием полей `required_group_id`, `dependency_type`, `alternative_group`.
