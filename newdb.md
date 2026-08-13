Table disciplines {
  id UUID [primary key]
  title String [note: 'Официальное название']
  internal_description Text [note: 'Внутреннее описание для администраторов']
  handbook_link Text
  available_semesters Array [note: 'в каких семестрах читают']
  workload Float [note: 'Кредиты']
  students_metric Float [note: 'например, CSAT студентов. Любая другая метрика для того, чтобы студент мог оценить сложность курса']
  lectures_per_week int
  seminars_per_week int
  timetable_id UUID [note: "на будущее для составлпения календаря студента"]
  requisites_id UUID [note: "ссылка на курсы которые необходимо пройти для попадания на этот. Кореквизиты/пререквизиты"]
  available_to_students_group UUID [note: "ссылка на группу студентов, кому она доступна, если пусто, значит всем"]
  Note: 'Таблица для хранения дисциплин. Здесь должна храниться минимальная информация о дисциплине без прикрепления к году поступления, семестра, мейджору, специализации и тд. То есть информация, одинаковая вообще для всех студентов'
}

Table requisites {
  id UUID [primary key]
  discipline_group_id UUID
  type bool [note: "0 - пререквизит, 1 - кореквизит"]
}

Table disciplineGroups {
  id UUID [primary key]
  title String [note: 'Внутреннее название группы-коробки. Например: "Математический анализ всех уровней"']
  internal_description Text [note: "Внутренее описание коробки для администраторов"]
  discpline_group_resolver_box_id UUID [note: 'Внутренний невидимый администратору объект, описывающий связи курсов в коробке']
  math_expression Text [note: 'Храним то, что ввел администратор при забивании группы курсов. Например он блоками составил "Один из 3 на выбор", это сохранилось как, пусть будет, [1/3]. В общем это исходное то, что ввел администратор, чтобы ему не показывать деревья из resolver коробок']
}

Table disciplineGroupResolverBoxes {
  id UUID [primary key]
  resolver_box_id_first UUID [note: 'ссылается на внутреннюю коробку']
  resolver_box_id_second UUID [note: 'ссылается на внутреннюю вторую коробку']
  relation text [note: "OR, XOR, AND... выставляет связь между двумя коробками"]
  discipline_id UUID [note: 'необязателен. В конце концов самые глубокие коробки в дереве ссылаются напрямую на дисциплины']
  Note: "это таблица рекурсивных объектов - коробок. "
}

Table schools {
  id UUID [primary key]
  title Text [note: "Школа технологий / Дизайн"]
}

Table majors {
  id UUID [primary key]
  title Text [note: "Разработка"]
  admission_year int [note: "2025"]
  school UUID
}

Table tracks {
  id UUID [primary key]
  title Text [note: "Development / Engineering"]
  major_id UUID
  is_visible bool [note: "Треки используются только для разработки. Для остальных мы скрываем наличия прослойки-заглушки ввиде трека, но формально он существует"]
}

Table specializations {
  id UUID [primary key]
  title Text [note: "Инженер данных"]
  track_id UUID
  is_common bool [note: 'является ли специализация общей для всех студентов или она создана для конкретного студента в индивидуальном поряде']
  visible_to_students_group UUId [note: "В LMS вроде уже есть возможность создавать группы студентов, здесь будет информация о том, каким студентам доступна специализация, если она не common"]
  restrictions_enabled_id UUID [note: "ссылка на список ограничений, накладываемых на специализации"]
}

Table restrictionsList {
  id UUID [primary key]
  restrction_id UUID
}

Table disciplineTypes {
  id UUID [primary key]
  title Text [note: "Major Core / Major Choice / Fundamentals / ..."]
  Note: "предполагаем, что мы один раз создаем эти типы курсов, но если вдруг в ЦУ всё поменяется, то мы их просто тут переименуем / добавим новые, это просто названия"
}

Table specializationsConnections {
  id UUID [primary key]
  specialization_id UUID [note: "для какой специализации"]
  discipline_group_id UUID
  discipline_type UUID [note: "ссылка на Major Core / Major Choice / ..."]
  is_mandatory bool [note: "Обязательно ли проходить данную группу дисциплин"]
}

Table restrictions {
  id UUID [primary key]
  internal_description Text [note: 'Внутренее описание для администраторов']
  minimum int [note: "Минимум курсов нужно закрыть"]
  maximum int [note: "Максимум курсов нужно взять"]
  specialization_connections_group_id UUID [note: "Указывается группа по сути подключенных групп курсов"]
  semester int [note: "в каком семестре включено ограничение"]
}

Table specializationConnectionGroups {
  id UUID [primary key]
  specializion_connection_id uuid
}


Ref: "disciplineGroups"."discpline_group_resolver_box_id" < "disciplineGroupResolverBoxes"."id"

Ref: "disciplineGroupResolverBoxes"."discipline_id" < "disciplines"."id"

Ref: "majors"."school" < "schools"."id"

Ref: "tracks"."major_id" < "majors"."id"

Ref: "specializations"."track_id" < "tracks"."id"

Ref: "disciplines"."requisites_id" < "requisites"."id"

Ref: "requisites"."discipline_group_id" < "disciplineGroups"."id"

Ref: "specializationsConnections"."discipline_type" < "disciplineTypes"."id"

Ref: "specializationsConnections"."specialization_id" < "specializations"."id"

Ref: "specializationsConnections"."discipline_group_id" < "disciplineGroups"."id"




Ref: "restrictions"."specialization_connections_group_id" < "specializationConnectionGroups"."id"

Ref: "specializationConnectionGroups"."specializion_connection_id" < "specializationsConnections"."id"

Ref: "specializations"."restrictions_enabled_id" < "restrictionsList"."id"

Ref: "restrictionsList"."restrction_id" < "restrictions"."id"
