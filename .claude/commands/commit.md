Сделай git commit текущих изменений в формате Conventional Commits.

## Формат сообщения

```
<type>(<scope>): <description>

[optional body]
```

**Типы (type):**
- `feat` — новая функциональность
- `fix` — исправление бага
- `build` — изменения в системе сборки, зависимостях
- `chore` — рутинные задачи (конфиги, структура, без влияния на продукт)
- `docs` — только документация
- `refactor` — рефакторинг без новых фич и фиксов
- `test` — добавление или исправление тестов
- `style` — форматирование, отступы (без изменения логики)
- `perf` — улучшение производительности

**Scope (необязательный):** модуль или область изменений, например: `store`, `scene`, `catalog`, `ui`, `config`, `deps`

**Description:** краткое описание на английском языке, с маленькой буквы, без точки в конце, до 72 символов.

## Примеры

```
feat(store): add undo/redo with two-stack pattern
fix(scene): prevent TransformControls conflict with OrbitControls
chore(deps): install three.js and react-three-fiber
build: init vite project with react-ts template
docs: add architecture and backlog
test(store): add unit tests for sceneStore mutations
```

## Инструкция

1. Запусти `git status` и `git diff` (включая unstaged) чтобы понять что изменилось
2. Добавь в stage все релевантные файлы (не добавляй .env, секреты, временные файлы)
3. Определи тип и scope на основе изменений
4. Сформируй сообщение по формату выше
5. Создай коммит
6. Покажи итог: список файлов и финальное сообщение коммита
