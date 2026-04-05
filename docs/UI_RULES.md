# UI Rules (MVP)

This file defines the baseline visual rules for the frontend so new screens stay consistent.

## 1. Component-first rule

- Use shared components from `frontend/src/components/ui/*` and `frontend/src/components/layout/*`.
- Do not create one-off button/input/table styles inside feature pages when a shared component exists.
- If a visual variant is needed in more than one place, add it to the shared component.

## 2. Surface and spacing rule

- Main containers use `Card`/`Panel` (not custom wrappers).
- Interactive rows/cards use rounded corners consistent with the system (`rounded-xl` for container surfaces).
- Keep internal spacing on a 2/3/4/6 scale (`gap-2`, `gap-3`, `gap-4`, `p-6`).

## 3. Typography rule

- Section eyebrow labels must use:
  - `text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground`
- Body helper text uses `text-sm` or `text-xs` with `text-muted-foreground`.
- KPI values and numeric labels use `tabular-nums`.

## 4. Controls rule

- Buttons: always use `Button` component variants (`default`, `outline`, `secondary`, `destructive`, `ghost`, `link`).
- Inputs/Textareas: always use `Input` / `Textarea` components.
- Status chips: always use `Badge` with tone (`success`, `info`, `warning`, `danger`, `neutral`).

## 5. Data table rule

- All table pages must use `DataTable`.
- Keep header style consistent (uppercase compact label, muted background).
- Empty/loading/error states must be shown in-table with existing table patterns.

## 6. Do-not rule

- No `!important`.
- No inline style overrides for routine styling.
- No ad-hoc shadow/radius systems outside shared components.

