Сделай git commit текущих изменений в формате Conventional Commits.

## Формат сообщения

```
<type>(<scope>): <description>

[optional body]
```

**Типы:** feat, fix, refactor, test, docs, style, perf, build, chore
**Scope:** store, scene, catalog, ui, config, deps
**Description:** английский, lowercase, без точки, до 72 символов.

## Примеры

```
feat(store): add undo/redo with two-stack pattern
fix(scene): prevent TransformControls conflict with OrbitControls
```

## Инструкция

1. `git status` + `git diff --stat` — список изменённых файлов и объём правок
2. Добавь в stage релевантные файлы (не `.env`, не секреты, не temp-файлы)
3. Определи type/scope по именам файлов и контексту текущей задачи
4. Сформируй сообщение: title обязателен, body — если нужно объяснить «почему»
5. Создай коммит с `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
6. Покажи итог: файлы и финальное сообщение коммита
