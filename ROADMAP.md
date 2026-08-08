# Roadmap — Electrical Estimator Excel Add-in

Tracks development against [PROJECT_SPEC.md](PROJECT_SPEC.md). Work proceeds one phase at a time;
each phase requires explicit approval before the next one starts. This file is updated at the end
of every completed phase — status, what shipped, and what's next.

Status key: ✅ Completed · 🚧 In Progress · ⏳ Not Started

---

## Phase 1 — Project Scaffolding & Navigation ✅ Completed

Office Add-in (Excel Task Pane) initialized with React + TypeScript, Fluent UI, and the full
`src/` architecture from the spec. No Excel logic, calculations, or table generation yet
(intentionally out of scope for this phase).

- [x] Office Add-in project initialized (manifest.xml, webpack, Office.js)
- [x] React + TypeScript configured
- [x] Full folder architecture created (`components/`, `services/`, `models/`, `types/`, `hooks/`, `utils/`, `assets/`)
- [x] Dependencies installed (React, Fluent UI v9, webpack, ts-loader, office-addin-* tooling)
- [x] Sidebar navigation (Fluent `Drawer`) + top bar
- [x] Placeholder pages: Home, Setup, Material Manager, New Estimate, Projects, Settings
- [x] Navigation wired between all pages (`useNavigation` hook)
- [x] Modern, responsive Fluent UI styling
- [x] Typed model shells (`Material`, `Project`, `Estimate`) and service interfaces
      (`excel.ts`, `storage.ts`, `calculator.ts`) — signatures only, no logic
- [x] Production build verified (`npm run build`), manifest validated

**Fix — dev cert / HTTPS config (post-Phase-1):** webpack-dev-server was generating its own
ad-hoc self-signed certificate instead of using the trusted cert from `office-addin-dev-certs`,
which Excel's task pane rejected. `webpack.config.js` now sources `devServer.server.options`
from `office-addin-dev-certs.getHttpsServerOptions()` in development mode. No app/UI/business
logic touched.

---

## Phase 2 — Project Data Layer & Project Setup ✅ Completed

Full brief: [PHASE2_SPEC.md](PHASE2_SPEC.md). Materials carry no prices — pricing is
project-specific and lives in Project Settings, keyed by material id. No New Estimate, no Excel
generation, no calculations in this phase.

- [x] `Material` model: `id`, `name`, `category` (Pipe/Cable/Accessory), `unit` (m/pcs), `hasMpCost`
- [x] `ProjectSettings` model: project name, OH %, Margin %, Second Fix MP price, `materialPrices[]` (`materialId`, `unitCost`, `mpCost`)
- [x] Storage service backed by Office Storage APIs (`Office.context.document.settings`) — persists Materials + Project Settings, survives Excel restarts
- [x] Material Manager page: list/create/edit/delete via `MaterialFormDialog` + `MaterialTable`, duplicate-name validation, MP toggle enabled only for Pipe, delete confirmation dialog
- [x] Setup page: project name, OH %, Margin %, Second Fix MP, plus a dynamic `MaterialPriceRow` per material (MP Cost field only shown when `hasMpCost`), autosaving (debounced) via `useProjectSettings`
- [x] UI/data separation via `useMaterials` / `useProjectSettings` hooks; `utils/id.ts` + `utils/debounce.ts` added
- [x] `calculator.ts` / `Estimate.ts` type references updated to match the new models (still unimplemented — no calculations added)
- [x] Production build verified (`npm run build`) — no type errors

**Fix — Fluent UI `Dropdown` crashes WebView2 inside Excel (post-Phase-2):** Material Manager's
Add/Edit dialog blanked the entire task pane the instant either the Category or Unit selection
changed. Reproducible every time in real Excel, never in a desktop browser — pointing at a
WebView2-specific incompatibility rather than an app logic bug. No JS exception was ever
observed, even with `window.onerror`, `addEventListener("error"/"unhandledrejection")`, and a
React Error Boundary all instrumented and self-verified working (see `src/debug/`), which meant
the crash was happening below JavaScript's own error handling — consistent with a native WebView2
renderer crash. Isolated via a controlled A/B swap: replacing Category's Fluent `<Dropdown>` with
a plain native `<select>` fixed Category but Unit (still Fluent `<Dropdown>`) crashed identically,
proving the Fluent `Dropdown` component itself is the trigger, not any app-level logic. Both
Category and Unit in `MaterialFormDialog.tsx` now use a small local `NativeSelect` (native
`<select>`, Fluent-styled via `tokens`) instead of Fluent's `Dropdown`. Also added
`Cache-Control: no-store` headers to `webpack.config.js`'s `devServer` — WebView2 was caching
`taskpane.js` aggressively across reloads (it isn't content-hashed), which masked earlier fixes
during testing. `src/debug/` diagnostic instrumentation is left in place (harmless, only activates
on error) in case it's useful again.

## Phase 3 — New Estimate ✅ Completed

Estimate Builder UI only — no Excel calls, no calculations, no worksheet formatting. Modeled
directly around the final worksheet layout (screenshot reference) so Phase 5's Excel generator
can consume the built `Estimate` object with minimal translation.

- [x] `Estimate` model matches the worksheet field-for-field: `firstFixPipes[]` / `firstFixAccessories[]`
      / `secondFixCables[]` as distinct typed arrays + single `flexiblePoints: { quantity }` (not an
      array). Every item stores `materialId` only, never a material name; a row-local `id` (separate
      from `materialId`) makes edit/remove unambiguous even with duplicate material selections.
- [x] Estimate Title field
- [x] First Fix Pipes, First Fix Accessories, Second Fix Cables — unlimited dynamic rows via one
      reusable `MaterialLineTable` (parameterized by category + optional Length column)
- [x] Flexible Points — single Quantity field, not a repeatable list (matches the worksheet)
- [x] Material pickers sourced live from `useMaterials()`, filtered by category — no hardcoded names
- [x] `useEstimateBuilder` hook owns all form state/row CRUD/validation/save-load; page stays presentational
- [x] Validation: title required, material required per row, length ≥ 0, quantity > 0 (pipes/cables/accessories)
- [x] "Generate Estimate" validates + builds an `Estimate` object in-memory; "Save Estimate"
      additionally persists it (create on first save, update thereafter). No Excel calls, no cost
      calculation (`grandTotal` is always written as `0` until Phase 4).
- [x] Production build verified (`npm run build`) — no type errors

**Follow-through from the Phase 2 WebView2 fix:** every material/category/unit picker added in
this phase uses the shared `NativeSelect` (native `<select>`, extracted out of
`MaterialFormDialog.tsx` into `src/components/NativeSelect.tsx` since it's now needed in two
places) — Fluent UI's `Dropdown`/`Combobox` are not used anywhere in the app. Also deduplicated
number-input parsing (`Setup.tsx`, `MaterialPriceRow.tsx`) into `src/utils/number.ts`.

**Enhancement — multiple Estimates per project (post-Phase-3):** storage moved from a single
"current estimate" slot to full CRUD over a list (`getAllEstimates`, `getEstimate(id)`,
`saveEstimate` create, `updateEstimate`, `deleteEstimate`) in `storage.ts`. `Estimate` gained
`createdAt`/`updatedAt`/`grandTotal` (`grandTotal` stays `0` — "Pending" in the UI — until Phase 4).
The single "Load Estimate" button was replaced by a "My Estimates" dialog (`EstimatesDialog.tsx` +
`EstimateCard.tsx`, backed by a new `useEstimatesList` hook kept separate from
`useEstimateBuilder`) listing every saved estimate as a card with Open/Rename/Delete, plus a "New
Estimate" action to start a fresh draft. `useEstimateBuilder.saveEstimate` now auto-detects
create-vs-update (first save vs. subsequent saves of the same draft) so the page still exposes a
single "Save Estimate" button. Rename/Delete confirmation are inline within the card (no nested
dialogs), avoiding the WebView2 popup/portal territory this project has already had trouble with.

## Phase 4 — Calculator Service ✅ Completed

Pure, unit-testable cost logic in `calculator.ts` - the only file in the app with formulas in it.
No Excel calls, no worksheet generation.

- [x] Pipe Cost = Length × Quantity × Unit Cost (per pipe row)
- [x] Pipe MP = Length × Quantity × Pipe MP Cost (per pipe row)
- [x] Accessory Cost = Quantity × Unit Cost
- [x] Cable Cost = Length × Quantity × Unit Cost
- [x] Flexible Point Cost = Quantity × Unit Cost (new `flexiblePointUnitCost` field on `ProjectSettings`
      + Setup page input - the formula needs a price the model didn't have yet)
- [x] Second Fix MP = Flexible Point Quantity × Second Fix MP Price
- [x] First Fix Total = Pipe Costs + Pipe MP + Accessories
- [x] Second Fix Total = Cable Costs + Flexible Point Cost + Second Fix MP
- [x] Total Price = First Fix Total + Second Fix Total
- [x] OH Amount = Total Price × OH %
- [x] Total With OH = Total Price + OH Amount
- [x] Margin Amount = Total With OH × Margin %
- [x] Grand Total = Total With OH + Margin Amount
- [x] Strongly typed `CalculationResult` model (`models/Calculation.ts`) - line-level breakdown
      (`CalculatedPipeLine`/`CalculatedCableLine`/`CalculatedAccessoryLine`/`CalculatedFlexiblePoints`)
      plus every aggregate total, all derived only from those lines
- [x] "Generate Estimate" and "Save Estimate" now run `calculatorService.calculate()`, store the
      `CalculationResult` on the builder, and write the real `grandTotal` onto the `Estimate`
      (previously always `0`/"Pending") - both in the builder and once persisted, so "My Estimates"
      shows real totals for anything calculated at least once
- [x] Preview page (`CalculationPreviewDialog.tsx`) shown after Generate/Save - itemized First
      Fix/Second Fix tables plus every rollup down to Grand Total. Read-only, no Excel involved
- [x] Production build verified (`npm run build`) — no type errors

**Fix — Second Fix MP formula (post-Phase-4):** was wired to `Flexible Point Quantity × Second Fix
MP Price` (a single flat value) per the original Phase 4 instructions. Corrected per-cable-row:
`Second Fix MP = Length × Quantity × Second Fix MP Price` for each cable row (cable Unit Cost is
never used here), summed across rows for the total. `CalculatedCableLine` gained an `mp` field
(mirroring `CalculatedPipeLine`'s existing `cost`/`mp` pair) and the Preview's cables table now
shows it per row. No other formula changed.

## Phase 4.5 — Calculation Preview (verification screen) ✅ Completed

Purpose-built to verify every calculated figure against the original Excel sheet before Phase 5
ever touches Excel. No calculation happens in the UI - every number displayed is read directly
off `CalculationResult`; calculator.ts's formulas were not touched.

- [x] `CalculationPreviewDialog.tsx` rebuilt to show every intermediate value, not just totals:
      First Fix Pipes table (Material, Length, Quantity, Unit Cost, Pipe MP Cost, Material Cost,
      Pipe MP Cost Total, Row Total), Accessories table, Second Fix Cables table (Material,
      Length, Quantity, Unit Cost, Second Fix MP, Cable Cost, Second Fix MP Cost, Row Total),
      Flexible Point row, then every rollup (Pipe/Cable/Accessories/Flexible Point/Second Fix MP
      totals, First Fix Total, Second Fix Total, Total Price, OH %, OH Amount, Total With OH,
      Margin %, Margin Amount, Grand Total)
- [x] `CalculatedPipeLine`/`CalculatedCableLine` gained a `rowTotal` field (`cost + mp`) and
      `CalculatedCableLine` gained `secondFixMpRate` (the rate itself, for the column next to Unit
      Cost) - both computed once in `calculator.ts`, never re-derived in the UI
- [x] "Copy Calculation Report" button - `utils/calculationReport.ts` formats the same
      `CalculationResult` as a plain-text report (line-by-line cost/MP/row-total per item, every
      section total, full summary) and copies it via the browser Clipboard API, for pasting
      alongside the original Excel sheet to compare by eye
- [x] Same workflow as before: Generate Estimate / Save Estimate run `calculatorService.calculate()`
      and open this dialog - still no Excel calls, no worksheet writes anywhere in this phase
- [x] Production build verified (`npm run build`) — no type errors

**UI polish (post-Phase-4.5), no logic/calculation/storage changes:**
- [x] Flexible Point table in the Preview gained a leading Material column (value `"Flexible Point"`),
      matching every other table's shape
- [x] Material Manager and Setup's Material Pricing both group materials into **Pipes / Cables /
      Accessories** sections with a heading + divider each, via one shared
      `utils/materialGrouping.ts` (single source of truth for category order/labels so both pages
      stay in sync); empty categories are skipped rather than showing a blank section
- [x] Pipe pricing shows Unit Cost + MP Cost; Cable/Accessory pricing shows Unit Cost only -
      already correct pre-existing behavior (`MaterialPriceRow` only renders MP Cost when
      `material.hasMpCost`, which is only ever settable for Pipe category), verified, not changed

**Consistency pass (this message), still no logic/calculation/storage changes:** added one shared
`SectionHeading.tsx` (small-caps "eyebrow" style: uppercase, letter-spaced, brand-colored) and
applied it to every grouped section in the app - Material Manager's and Setup's Pipes/Cables/
Accessories groups, and the Calculation Preview's First Fix/Second Fix/Summary headers - replacing
three slightly different ad-hoc heading styles with one. Section-to-section spacing standardized
to `spacingVerticalXXL` and each group's internal spacing to `spacingVerticalM` across all three
pages, so the rhythm reads the same everywhere. Setup gained a matching "Project Settings" label
above its top fields for parity with "Material Pricing" below it.

## Phase 5 — Excel Table Generation ✅ Completed

Split into two internal stages per this phase's brief.

### Phase 5.1 — reusable Excel engine (`src/services/excel/`)

Generic infrastructure only - no business logic, no calculations, no knowledge of Estimates. Every
method takes an explicit cell/range address; nothing here assumes any particular worksheet layout,
so it's reusable for whatever gets generated next.

- [x] `constants.ts` - fonts, colors, number formats, default sizing (pure data)
- [x] `styles.ts` - `applyFont` / `applyFill` / `applyBorder` / `applyAlignment`, each operating on
      one `Excel.Range` and one visual concern
- [x] `helpers.ts` - address arithmetic (`columnLetter`, `cellAddress`, `rangeAddress`,
      `sanitizeSheetName`), value/currency/percentage writers, `mergeCells`, `setColumnWidth`,
      `setRowHeight`, `autoFitColumns`
- [x] `worksheetBuilder.ts` - `WorksheetBuilder` class composing the above into the engine's public
      surface (`writeValue`, `writeCurrency`, `writeHeader`, `writeSectionTitle`, `mergeCells`,
      `applyBorder`/`applyFill`/`applyFont`/`applyAlignment`, `autoFitColumns`, `setColumnWidth`,
      `setRowHeight`) - stateless, holds no row/column cursor
- [x] `excelGenerator.ts` - `createWorksheet()` (creates or replaces a sheet by name) and
      `generateWorksheet()` (wraps `Excel.run`, hands a `WorksheetBuilder` to a caller-supplied
      build callback, activates the sheet, syncs once)
- [x] Verified with `tsc --noEmit` directly, since nothing imported these files yet at this point
      (webpack only type-checks what's in the module graph)

### Phase 5.2 — Estimate worksheet (`src/services/excel.ts`)

The only file that knows what an Estimate worksheet looks like; everything it writes comes from
`CalculationResult` (plus material names and OH/Margin percentages for labels) - no calculations
performed here.

- [x] Title row, "1st, fix"/"2nd, fix" section headers, column headers (Item/Length/Qty/Unit
      Cost/Total Cost) - mirrors the reference worksheet from Phase 3
- [x] Dynamic rows: pipes then accessories (First Fix), cables then Flexible Point (Second Fix) -
      each side tracked with its own local row counter, so row counts differ freely between the two
      tables and nothing is hardcoded to a fixed row number
- [x] Accessory/Flexible Point/M.P rows merge the Length+Qty columns into one cell, matching the
      reference sheet's convention for quantity-only lines
- [x] Per-side M.P and Total rows, then a Summary block (Total Price, O.H %, Total with O.H,
      Margin %, Grand Total) positioned dynamically below whichever side ended up taller
- [x] Borders, fills, bold/centered headers, currency + percentage number formats, column widths -
      all via the Phase 5.1 engine, none of it ad hoc
- [x] "Generate Excel" button added to the Calculation Preview dialog (enabled once a result
      exists), calling `excelService.generateEstimateTable(estimate, result, materials,
      ohPercentage, marginPercentage)`
- [x] Production build + `tsc --noEmit` both verified clean

**Deviation from the original Phase 1 aspiration, intentionally:** the initial roadmap placeholder
for this phase said "live formulas (not just static values)." This phase's actual brief said "Do
not perform any calculations. Read only from CalculationResult," which means writing the
already-computed values, not re-deriving them as Excel formulas. Followed the brief actually
given, not the earlier placeholder. (Superseded by Phase 5.3 below - formulas landed after all,
once explicitly requested.)

## Phase 5.3 — Excel Synchronization & Project Workspace ✅ Completed

Turns the generated workbook from a one-shot export into a living workspace: one shared
worksheet holding every Estimate, formula-driven so edits inside Excel recalculate, with each
Estimate remembering where it lives so regenerating never duplicates a section.

- [x] **Single worksheet.** All Estimates now generate into one `"Estimates"` sheet instead of one
      sheet per estimate. Each Estimate is a self-contained, formula-only-referencing-its-own-rows
      section, stacked with a 2-row gap; a per-estimate local row counter (same pattern as Phase 5.2)
      means sections never overlap and nothing is hardcoded to a fixed row.
- [x] **Formulas instead of static values**, everywhere a value is derived from other cells within
      the same row/section: `Cost = Length×Qty×UnitCost`, `MP = Length×Qty×MpRate`,
      `Row Total = Cost+MP`, section totals via `SUM(...)`, and the whole summary chain (`Total
      Price`, `OH Amount`, `Total With OH`, `Margin Amount`, `Grand Total`). Raw inputs (Length,
      Qty, Unit Cost, MP Rate, OH %/Margin %) stay as plain editable values, since they aren't
      derived from anything else in the sheet - editing any of them now ripples through every
      downstream formula automatically. `calculator.ts` itself was **not touched** - it remains the
      single source of truth the app uses internally; the formulas are a separate, parallel
      representation written only into the worksheet.
- [x] **Estimate ↔ Excel link.** `Estimate` gained an optional `excelLocation: { worksheetName,
      startRow, endRow, lastGeneratedAt }`, keyed to the Estimate by `id` (never by name/title -
      titles can change freely without breaking the link).
- [x] **Regenerate without duplicating**, and **Generate All** (new button on the My Estimates
      page). Both funnel through one path - `useExcelSync.syncAll()` - which loads every saved
      estimate, recomputes each through `calculator.ts`, and does a full, deterministic rebuild of
      the shared sheet in stored order. See "How regeneration works" below for why a full rebuild
      was chosen over literal in-place row patching, and why it still satisfies every stated
      behavior (no duplicates, other estimates' output unchanged, deletions disappear, new ones
      append).
- [x] **My Estimates is now a full sidebar page** (`components/MyEstimates/MyEstimates.tsx`), added
      to navigation between New Estimate and Setup. Reuses the same `EstimateCard` and
      `useEstimatesList` as the existing in-builder dialog - "Open" here means "jump to it in
      Excel" (`excelService.openEstimateInExcel`), while the dialog's "Open" still means "load into
      the builder for editing." Same component, different `onOpen` wired in by each caller.
- [x] **Card simplified** (also applies to the existing dialog, since they share `EstimateCard`):
      Created/Last Updated removed, now just Name + Grand Total + Open/Rename/Delete.
- [x] **Open Estimate in Excel** - activates the shared sheet and selects the first cell of that
      estimate's tracked section.
- [x] **Architecture stayed layered**: Calculation Engine → `CalculationResult` → Excel Generator →
      Worksheet. `excelService` never imports `calculatorService` - `useExcelSync` is the one place
      that calls the calculator and hands `{estimate, result}` pairs to `excelService`, which only
      makes layout/formula/formatting decisions.
- [x] **Reused, not rewritten**: Phase 5.1's engine (`constants.ts`/`styles.ts`/`helpers.ts`/
      `worksheetBuilder.ts`/`excelGenerator.ts`) is untouched except for one additive extension
      (`writeFormula`/`writeCurrencyFormula` in `helpers.ts` + `WorksheetBuilder`) - as generic as
      everything else there, not Estimate-specific. `storage.ts` gained one additive method,
      `updateEstimates()` (bulk), alongside the existing single-estimate `updateEstimate()`.
- [x] Fixed a self-referencing-formula bug found during review: an estimate with zero pipes and
      zero accessories would have written a `SUM` formula for its First Fix Total on the same row
      the formula referenced (circular reference). First Fix (unlike Second Fix, which always has
      the Flexible Point row) can legitimately be empty, so that row now falls back to literal `0`s
      when there's no data to sum.
- [x] `tsc --noEmit` and the production build both verified clean.

### How Estimate ↔ Excel synchronization works

Every `Estimate` optionally carries `excelLocation` (worksheet name, start/end row, last-generated
timestamp), set the first time it's generated and refreshed on every subsequent sync. The link is
by `id`, so renaming an estimate never breaks it. `MyEstimates`'s "Open" button reads this location
straight off the estimate object to activate the sheet and select its first cell - no searching or
guessing required.

### How regeneration works (and why a full rebuild, not in-place patching)

The brief describes regeneration as "locate the existing section, replace its contents, keep every
other estimate untouched." The literal way to do that would be diffing row counts and using Excel's
row insert/delete-with-shift operations to resize just the one changed section in place, then
patching every other estimate's cached `startRow`/`endRow` by the resulting offset. That's a real
amount of bookkeeping with a real amount of ways to get subtly wrong (off-by-one row shifts,
formulas left pointing at stale rows, partial failures leaving the sheet and the stored locations
disagreeing).

Instead, `syncAllEstimates` always does a **full, deterministic rebuild**: delete-and-recreate the
`Estimates` sheet, then write every currently-saved estimate's section in order, tracking each
one's row range as it goes. Because the rebuild is deterministic (same estimates, same order, same
layout logic), every estimate's rendered output is byte-for-byte identical to before unless its own
data changed - so from the user's perspective, "every other estimate untouched" holds exactly as
promised, even though technically the whole sheet was rewritten. This one code path also
transparently satisfies "Generate All" (new estimates append because they're now in the saved
list, deleted ones vanish because they're no longer in it) with no separate implementation needed -
"Generate" (single) is just this same sync, triggered right after saving the one estimate being
edited. Given how small a realistic estimate count is, the performance cost of a full rebuild
inside one `Excel.run` batch is not perceptible.

The tradeoff: a manual edit made directly inside a previously-generated section (outside the
formula cells) would be lost on the next sync. This isn't a new risk introduced here - Phase 5.2
already fully overwrote its sheet on every regenerate; this generalizes that same "regenerate
means rewrite" behavior to "my section of the one shared sheet" instead of "my whole dedicated
sheet." Worth flagging in case in-place preservation was expected.

## Phase 5.4 — Worksheet Formatting Pass ✅ Completed

Formatting/layout only - `calculator.ts`, the sync workflow, and every other file's public
contract were untouched. All of it lives inside `services/excel.ts`'s row-writing functions; no
changes were needed in the Phase 5.1 engine.

- [x] **Column layout reverted to 5 columns per side** (Item/Length/Qty/Unit Cost/Total Cost),
      removing the MP Rate/MP/Row Total columns Phase 5.3 had added. **M.P is its own row again**,
      matching the original template: `Item="M.P"`, Length left blank, `Qty=1`, `Unit Cost` = the
      MP aggregate (`result.pipeMp`/`result.secondFixMp`, read straight off `CalculationResult` -
      not recomputed), `Total Cost = Qty × Unit Cost` (still a formula). The section Total row's
      `SUM` now covers one column instead of three, spanning data rows through the M.P row.
- [x] **Exact typography per element**: title 20/bold/center; section headers 12/regular; column
      headers 11/regular/white/centered; material names 16/bold; numeric cells 11/regular; M.P
      label 16/bold with 11/regular values; Total label+value 12/bold; summary labels+values
      16/bold. Applied by calling the engine's generic `applyFont`/`applyFill`/`applyAlignment`
      primitives directly with these exact values, rather than the `writeHeader`/`writeSectionTitle`
      convenience methods (whose baked-in styles no longer matched) - no engine changes needed.
- [x] **Fixed column widths** (Item wide/160, Length+Qty narrow/60+55, Unit Cost+Total Cost
      medium/90+100, gap/20) replacing reliance on auto-fit - there wasn't actually an `autoFitColumns`
      call in the generator before this pass either, just less deliberate width values.
- [x] **Fixed row heights** for every row category (title/section header/column header/material/M.P/
      Total/summary), set via the same per-row `setRowHeight` calls already used elsewhere.
- [x] **Summary block reverted to 5 rows** (Total Price / O.H & Super. / Total with O.H / Margin /
      Grand Total), matching the original template's labels exactly - down from Phase 5.3's 7-row
      version that broke OH/Margin into separate percentage + amount rows. The OH/Margin amounts are
      still formula-derived, just inlined (`=TotalPrice+TotalPrice*OhPercent`) rather than referencing
      a separate labeled cell - same math, no separate row.
- [x] **Full-width divider** between estimates: a medium-weight bottom border spanning every used
      column, placed on the first blank row after each estimate's Grand Total, with 2 more blank
      rows after it before the next estimate's title (2-3 blank rows total, consistent every time).
- [x] Fixed a second latent bug while rewriting this: the earlier per-side "no data" SUM guard is now
      structurally unreachable (the M.P row always exists, so a section's SUM range can never be
      inverted) - simplified the row-tracking accordingly instead of leaving dead reasoning behind.
- [x] `tsc --noEmit` and the production build both verified clean.

## Phase 6 — Final Product Polish & Release ✅ Completed

Usability/robustness/polish only, per this phase's explicit constraints - no changes to
`calculator.ts`, Excel formulas, worksheet layout, storage format, or any model's field names.

- [x] **Toast notifications** - `useAppToast` (backed by Fluent's `Toaster`/`useToastController`,
      mounted once via `AppToaster` in `App.tsx`) gives consistent success/error feedback for
      every mutating action: Estimate Saved/Deleted/Renamed, Calculation Updated, Material
      Saved/Deleted, Excel Generated Successfully, All Estimates Generated, Backup
      Exported/Imported, All Data Reset, and matching "Failed to ..." errors. Replaces the old
      inline success `MessageBar` in New Estimate (redundant once toasts existed); the error list
      there stays inline since it names every invalid field, not just "something's wrong."
- [x] **Loading states**: Save Estimate, Delete/Rename Estimate (per-card, not the whole list),
      Open in Excel, Generate Excel, Generate All Estimates, Material Save/Delete, Backup
      Import, and Reset All Data all disable their trigger and show an in-progress label
      (`Spinner` where a card is busy) - no action can be double-fired while in flight.
  `useEstimateBuilder.saveEstimate()` now returns the saved `Estimate` (was `boolean`) so callers
  that need the fresh id/`excelLocation` right after saving aren't reading a stale closure.
- [x] **Confirmation dialogs**: unchanged where already present (Material delete), reworded to
      "Are you sure? This action cannot be undone." for Estimate delete (inline, `EstimateCard`)
      and the new Reset All Data dialog.
- [x] **Empty states**: "No Pipes/Cables/Accessories Added" (was one generic "No rows yet." for
      all three), "No Materials Yet", "No Estimates Yet" - each with a small Fluent icon, in both
      Material Manager and every estimate-list surface.
- [x] **Validation UX**: invalid First Fix Pipes/Accessories/Second Fix Cables rows get a red-tinted
      background (`MaterialLineTable`'s new `invalidRowIds`); the Title field shows its own inline
      `Field` validation state; on a failed Generate/Save/Generate-Excel, the first invalid field or
      row is scrolled into view and focused automatically (`data-row-id` attributes + a small
      `focusFirstError` helper in `NewEstimate.tsx`).
- [x] **`CurrentEstimateContext`** (new, app-root-level React Context - the only new piece of
      cross-page shared state added) tracks which estimate is "current" (opened, generated, or
      saved). My Estimates and the in-builder dialog both show a "Current" badge + highlighted
      border on the matching card via the shared `EstimateCard`.
- [x] **Auto-navigate to Excel after Generate**: once a single "Generate Excel" sync completes,
      the workbook now jumps straight to that estimate's section (`excelService.openEstimateInExcel`)
      instead of leaving the user to find it manually. Non-fatal if it fails - the workbook is
      still correctly generated either way.
- [x] **Settings page fully built** (was a Phase 1 placeholder): app name + version (read from
      `package.json` via a default import - a named import triggered a webpack warning, fixed by
      switching to `import packageJson from "../../../package.json"`), Export Local Backup
      (materials + project settings + estimates as one downloaded JSON file), Import Backup (file
      picker, loose shape validation, then a full reload so every hook re-initializes from the
      newly-written storage), and Reset All Data (confirm dialog, clears all three storage keys via
      new `storageService.resetAll()`, then reloads). Two new storage methods added
      (`replaceAllEstimates`, `resetAll`) - additive only, same persisted data shape as before.
- [x] **Performance**: `EstimateCard` wrapped in `React.memo` (a project can have 100+ estimates -
      without it, editing one card's rename text re-rendered every other card); derived material
      filters/groupings (`pipeMaterials`/`cableMaterials`/`accessoryMaterials` in New Estimate,
      category grouping in Material Manager and Setup) moved into `useMemo` instead of recomputing
      on every render.
- [x] **Code cleanup**: deleted `src/debug/` entirely (`ErrorBoundary`, `DebugErrorPanel`,
      `installGlobalErrorLogging`, `errorLog.ts`) - this was explicitly temporary instrumentation
      built to diagnose the Phase 2 WebView2/`Dropdown` crash (see that phase's fix note); the bug
      was found and fixed, so the diagnostic tooling's job was done. A small, permanent,
      user-friendly `ErrorBoundary` (no raw stack traces, just a clear "something went wrong"
      message) was promoted to `src/app/` in its place, since a production add-in should still
      avoid a blank screen on an unexpected error - a different goal from the debug tooling it
      replaced. Swept the whole `src/` tree for `console.log`/`TODO`/`FIXME`/`debugger` - none
      found beyond the one intentional `console.error` inside the new Error Boundary.
- [x] `tsc --noEmit` and the production build both verified clean (only the pre-existing,
      unavoidable-without-code-splitting bundle-size advisories remain - not new, not errors).

**Note on scope**: this phase's brief didn't include building out the Projects page (still a
Phase 1 placeholder) - that remains open below, unchanged from before this phase.

## Post-Phase-6 Enhancements — Naming, Summary Table, Reordering, Single Generate ✅ Completed

Four incremental, explicitly-scoped enhancements - architecture and `calculator.ts` untouched.

- [x] **Automatic Title Case.** New `utils/text.ts` (`toTitleCase`) - capitalizes each word, keeping
      a small set of minor words (a/an/the/of/etc.) lowercase unless first. Applied in-app (never as
      an Excel formula) in two places: `useEstimateBuilder.buildEstimate()` (so both Generate and
      Save title-case before an `Estimate` object is even built) and `useEstimatesList.renameEstimate()`.
      `useEstimateBuilder`'s live `state.title` is also synced back to the title-cased value after a
      successful generate/save, so the visible input never drifts from what got persisted.
- [x] **Estimate Summary table**, written at the very top of the `Estimates` sheet, before the first
      estimate section: "ESTIMATE SUMMARY" title row, "Estimate Name" / "Grand Total" header, one row
      per estimate. Each Grand Total cell is a live formula (`=B{row}`) pointing straight at that
      estimate's own Grand Total cell - never a static copy - so editing a raw input inside an
      estimate's section still ripples up into the summary. Sized purely from estimate count, so it
      grows/shrinks automatically as estimates are added or removed; same title/header/fill/border
      styling as the rest of the sheet.
- [x] **Estimate reordering** via Move Up / Move Down (drag-and-drop was considered but plain
      up/down buttons were judged simpler and sufficiently ergonomic for a task-pane list - no
      objection raised at scoping time). New `useEstimatesList.moveEstimateUp`/`moveEstimateDown`
      swap two entries and persist via the existing `storageService.replaceAllEstimates`. Since
      `syncAllEstimates`/`regenerateEstimate` and the Summary Table both iterate
      `storageService.getAllEstimates()` in stored order, the order shown in My Estimates is
      mechanically the same order "Generate All" uses - no separate ordering concept to keep in sync.
- [x] **Single-estimate "Generate"** - a fourth button per card in My Estimates only (Open / Generate
      / Rename / Delete; the in-builder "My Estimates" dialog is unaffected, since regenerating a
      specific already-saved estimate from outside the builder isn't a concept that dialog needs).
      This is the one part of this batch that reopens a Phase 5.3 tradeoff: Phase 5.3 deliberately
      chose full-worksheet rebuilds over in-place patching to avoid row-shift bookkeeping. That
      tradeoff is no longer acceptable once regenerating one estimate must leave every other estimate
      "untouched" in Excel (not just byte-identical after a full rewrite). New
      `excelService.regenerateEstimate()` does real in-place patching:
      - A pure `computeSectionLayout(startRow, result)` was factored out of the old inline row-counter
        logic (used by both the full-sync path and this one), so an estimate's row layout can be
        computed from its `CalculationResult` alone, without writing anything.
      - Compares the target's new row count against its stored `excelLocation`; if unchanged, clears
        and rewrites its section range in place. If changed, uses `Range.insert`/`Range.delete` with
        `InsertShiftDirection.down`/`DeleteShiftDirection.up` at the section boundary first - Excel
        auto-adjusts every other formula's cell references when rows are shifted this way (including
        the Summary Table's references to *other* estimates), which a clear-and-rewrite would have
        silently broken.
      - Refreshes only that estimate's one Summary Table row (name + Grand Total formula); every other
        row is left alone.
      - Manually shifts the stored `excelLocation` of every estimate whose section came after the
        target's, since Excel's native row shift updates the sheet but not this app's own tracked
        metadata.
      - Safety net: if the target (or any other estimate in the current list) has no `excelLocation`
        yet - i.e. a full sync hasn't happened against this exact set before - or anything throws
        during the in-place attempt, it falls back to the existing full `syncAllEstimates`. Always
        correct, just not always the fast path.
      - `useExcelSync` gained a sibling `regenerateOne(id, materials, settings)` alongside the
        existing `syncAll`, with its own `regeneratingId` so only the one card being regenerated shows
        a spinner.
- [x] `EstimateCard` gained optional `onGenerate`/`isGenerating` and `onMoveUp`/`onMoveDown`/
      `canMoveUp`/`canMoveDown` props - all unused (so no rendered buttons) unless a caller supplies
      them, which only `MyEstimates.tsx` does; `EstimatesDialog.tsx` (the in-builder list) is
      unchanged.
- [x] `tsc --noEmit` and the production build both verified clean.

## Phase 7 — Projects Page ⏳ Not Started

- [ ] Projects page: list, open, and switch between saved projects
- [ ] Full session persistence for projects, materials, and estimates via Office Storage APIs

---

## Future Ready (deferred — architecture only, per spec)

Not implemented until explicitly requested; code should stay structured so these are additive:

- [ ] PDF Export
- [ ] Duplicate Estimate
- [ ] Update Prices (bulk)
- [ ] Dashboard
- [ ] Multi Project Support (beyond basic Projects list)
- [ ] Cloud Sync
