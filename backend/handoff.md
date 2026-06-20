# Handoff: Analog Group Dependency Resolution Fix

## Overview
This document summarizes the changes made to the `cu-roadmap` backend to resolve a complex regression where the roadmap planner incorrectly recommended multiple overlapping courses from the same `AnalogGroup` (specifically, recommending both "🔵 Основы математического анализа и линейной алгебры 2" and "🔴 Математический анализ 2. Основной уровень" simultaneously).

## Root Cause Analysis
The bug stemmed from a combination of deterministic alternative selection and "hidden" mandatory dependencies:
1. **Blind First-Choice Selection:** When `resolveDependencies` encountered an alternative group (e.g., `[🔵 Основы, 🔴 Линал]`), if neither course was already in the roadmap, it blindly picked the first option (`🔵 Основы`).
2. **Hidden Mandatory Requirements:** Later in the dependency tree, a course like "Дифференциальные уравнения" would strictly demand `🔴 Матан` (which belongs to the same analog group as `🔵 Основы`).
3. **The Result:** The planner would add `🔵 Основы` for the first requirement and later force-add `🔴 Матан` for the second, resulting in two courses fulfilling the same analog group requirement.

## The Solution
The fix involves introducing a "look-ahead" mechanism (a pre-pass of the dependency graph) to prioritize globally mandatory requirements.

### Changes Made to `backend/service/roadmap_planner_impl.go`:
1. **Mandatory Requirements Tracking (`mandatoryReqs`)**:
   - During the initialization of the graph dependencies (`allDeps`), we now track which courses are strictly mandatory (`AlternativeGroup == 0`).
2. **Target Course Pruning**:
   - Before `resolveDependencies` runs, the `targetCourses` map is pruned. If two courses in `targetCourses` share the same `AnalogGroup`, the one present in `mandatoryReqs` is kept, and the non-mandatory one is discarded.
3. **Smart Alternative Selection**:
   - Inside the recursive `resolveDependencies` loop, when faced with an alternative group `altIDs` where no course is currently in the plan, the algorithm no longer just picks the first one.
   - It now explicitly checks `mandatoryReqs[reqID]`. If an alternative is known to be globally mandatory for *another* course down the line, it is prioritized and selected.
   - If no alternative is mandatory, it falls back to checking the existing analog groups in the plan to avoid duplicates.

## Verification
- Running the `generateRoadmap` API for the "Искусственный интеллект" (2025) cohort now correctly generates exactly one course for Matan 2 (`🔴 Математический анализ 2`) and exactly one course for Linal 2 (`🔴 Линейная алгебра и геометрия 2`), entirely eliminating the redundant `🔵 Основы` course.
- Backend was successfully compiled (`go build .`) and restarted on port 8080.

## Next Steps / Notes
- The backend is running with `USE_MEMORY_STORE=true`. If the server stops, it will perform a fresh Google Sheets synchronization upon startup.
- Minor mismatch warnings remain in the sync logs due to punctuation/spacing differences in the Google Sheets titles compared to the exact course names (e.g., "Теория веростяностей и математическая статистика / Математика для экономистов"). These need to be resolved by the content team in the spreadsheet to silence the warnings.

## Fix: Disappearing "ОБЯЗ" Courses
**The Problem:** The user added the `ОБЯЗ:` prefix to several fundamental course groups to force them to be scheduled early. However, these courses disappeared completely from the roadmap (e.g., "Основы бизнес-аналитики", "Разработка на Python").
**The Cause:** When multiple variants of the same `ОБЯЗ:` group were parsed into `requirements`, the first variant was kept, and subsequent variants were marked as `virtuallyPassedIDs`. However, our analog pruning logic mistakenly added these `virtuallyPassedIDs` to the `analogGroupKeepers` tracking, treating them as explicit user-passed courses. This resulted in the algorithm dropping the original valid mandatory requirement.
**The Fix:** Updated the `analogGroupKeepers` initialization to strictly exclude `virtuallyPassedIDs`. Now, virtually passed courses won't artificially block the actual required course from being scheduled.
**Result:** All `ОБЯЗ:` courses are now successfully prioritized and correctly scheduled in Semesters 1 and 2.
