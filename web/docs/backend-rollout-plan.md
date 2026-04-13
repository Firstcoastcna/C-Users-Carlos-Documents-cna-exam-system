# Backend Rollout Plan

This app currently runs with browser-local persistence.

The backend migration should happen in parallel, not as a live rewrite.

## Goal

Move from:

- local browser storage
- per-device progress
- no real student identity

To:

- account-based access
- database-backed progress
- cross-device resume
- shared question history across exam, practice, and remediation
- future-ready school, class, and student reporting

## Rollout Strategy

1. Keep the current app working in `local` mode.
2. Add server-side contracts and route scaffolding.
3. Add auth and database wiring.
4. Mirror key state server-side behind feature flags.
5. Switch individual flows from local to server persistence.
6. Make `server` mode the production default only after QA.

## Recommended First Build Order

1. Authentication
   - student identity
   - protected routes
   - session lookup

2. Database schema
   - users
   - exam attempts
   - practice sessions
   - remediation sessions
   - results payloads
   - question history
   - school and class membership foundations

3. Server routes/actions
   - bootstrap/session status
   - load progress
   - save progress
   - generate attempts using shared server history

4. Storage adapters
   - keep local adapter
   - add server adapter
   - migrate pages to read through one interface

## Non-Goals For The First Backend Slice

- Do not remove local storage yet.
- Do not redesign the interface.
- Do not force a one-way migration before the server path is proven.

## Reporting Direction

The long-term reporting layer should support both:

- individual student reporting
  - exam history
  - best and average score
  - chapter/category trends
  - practice and remediation activity
  - question exposure history

- school/class reporting
  - class-level score summaries
  - common weak chapters/categories
  - activity and completion trends
  - students needing attention
  - filtering by class, date range, language, and mode

## Foundation Tables For That Future

The schema now reserves room for:

- `schools`
- `school_staff`
- `class_groups`
- `class_group_enrollments`

These are not wired into the live app yet, but they give us a clean path toward:

- school admin roles
- instructor dashboards
- cohort/class reports
- student-to-class linkage without rewriting the core attempt tables later
