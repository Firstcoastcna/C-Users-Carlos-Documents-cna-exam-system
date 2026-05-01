# Report Audit Contract

## Purpose

This document turns the reporting architecture and our product decisions into an audit contract we can test against code.

The goal is not to redesign reports here. The goal is to answer:

1. What is each visible field supposed to mean?
2. What source is the code currently using?
3. Where does the current logic drift away from the intended behavior?

## Agreed Product Rules

These are already-decided rules from product work and report revisions.

### Student report backbone

The student report has two separate sides:

- `Exam Readiness`
- `Practice Progress`

They should not be judged by the same contract.

#### Exam side

- `My readiness` should reflect cumulative exam-based state.
- `My readiness` should not swing completely on one unusually strong or weak exam.
- `Latest exam snapshot` should be based on the latest completed exam.
- Historical exams belong in `Progress over time`.
- Recommendations can start from the latest exam, but may also consider repeated patterns over time if that explanation stays clear.

#### Practice side

- Practice should have its own lighter progress language.
- Practice can use softer phrases like `Building steadily` or `Still forming` when the sample is small.
- Practice should weigh more only when there is not enough exam data for exam-side interpretation.

#### Shared trust rules

- A strong student should look strong.
- A borderline student should look borderline, not alarming.
- A high-risk student should look clearly at risk, with obvious reasons and clear next steps.

### Report tone rules

- `On Track` should not overblow minor misses.
- `Borderline` should feel serious but workable.
- `High Risk` should feel clear, justified, and actionable.
- `What to do next` should pass the eye test against the visible data on the same screen.

## Architecture Baseline

Source: [Reporting Architecture For Cna Exam Platform.docx](/abs/path/not-applicable)

Key lines from the architecture:

- Reports should answer, in order:
  - Where am I right now?
  - What am I doing well?
  - What is weak or at risk?
  - What should I do next?
  - Am I improving over time?
- Student reporting should help the learner understand:
  - current readiness
  - what they are strong in
  - what they are weak in
  - whether they are improving
  - what to study next
- `Progress over time` should focus on trend, not noise.

## Current Student Report Source Map

### Summary payload

Built in [student-overview route](/c:/Users/Carlos/Documents/cna-exam-system/web/src/app/api/backend/reports/student-overview/route.js).

Top-level summary shape:

- `summary.exams`
- `summary.practice`
- `summary.remediation`
- `summary.questionHistory`
- `summary.practiceFocus`
- `summary.practiceDiagnostics`
- `summary.remediationFocus`
- `summary.learningSignals`
- `summary.latestExamResults`
- `summary.examHistory`

### Latest exam snapshot fields

These come from `summarizeLatestCompletedExamResult(...)` and are based on the latest completed exam attempt only.

Source: [student-overview route](/c:/Users/Carlos/Documents/cna-exam-system/web/src/app/api/backend/reports/student-overview/route.js)

- `Latest exam score`
  - source: `summary.latestExamResults.score`
  - contract status: aligned
- `Best chapter`
  - source: highest `percent` in `summary.latestExamResults.chapterBreakdown`
  - contract status: aligned
- `Worst chapter`
  - source: `summary.latestExamResults.weakestChapter`
  - contract status: aligned
- `Weakest category` in exam history card
  - source: latest exam analytics attached to that exam attempt
  - contract status: aligned if exam analytics are trustworthy

### Progress over time fields

These come from `summarizeExamHistory(...)` and are based on completed exam history.

- `Completed exams`
  - source: all completed exam attempts
  - contract status: aligned
- `Average exam`
  - source: average across completed exams
  - contract status: aligned for trend/history use
- `Best score`
  - source: max completed exam score
  - contract status: aligned for trend/history use
- `Worst score`
  - source: min completed exam score
  - contract status: aligned for trend/history use

## Current Learning Signals Source Map

Built in `summarizeLearningSignals(...)`.

Source: [student-overview route](/c:/Users/Carlos/Documents/cna-exam-system/web/src/app/api/backend/reports/student-overview/route.js)

### Current readiness

- current source:
  - `overallExamStatus = deriveOverallStatusFromScore(examSummary.averageScore)`
  - where `examSummary.averageScore` is average across all completed exams
- if latest exam analytics exist:
  - `overallStatus = overallExamStatus || analytics.overall_status || null`

Contract status:

- partially aligned

Why:

- this matches the cumulative exam-side model better than a latest-exam-only model
- but the UI needs to say clearly that readiness is based on overall exam performance so far
- and we still need to review whether the averaging method is producing the right readiness behavior for borderline and high-risk students

### Strongest categories

- current source:
  - latest exam analytics `category_priority`
  - filtered to `level === "Strong"`
- contract status:
  - mostly aligned

### Categories needing work

- current source:
  - latest exam analytics `category_priority`
  - filtered to `Weak` or `Developing`
  - excludes categories treated as `high risk weak`
- contract status:
  - mostly aligned

### High-risk categories

- current source:
  - latest exam analytics `category_priority`
  - filtered to `is_high_risk && level === "Weak"`
- contract status:
  - mostly aligned

### Chapter priorities

- current source:
  - latest exam analytics `chapter_guidance`
  - not raw chapter performance
- contract status:
  - drift

Why:

- this field is later used as if it were a real chapter weakness list
- but it is actually mapped guidance derived from category logic
- it can recommend chapters that do not look weak in the visible chapter snapshot

## Current UI Field Drift

Built in:

- [ReportsClient.js](/c:/Users/Carlos/Documents/cna-exam-system/web/src/app/reports/ReportsClient.js)
- [OwnerReportsClient.js](/c:/Users/Carlos/Documents/cna-exam-system/web/src/app/owner/reports/OwnerReportsClient.js)

### `Strongest area`

- visible field:
  - category name
- current source:
  - `learningSignals.strongestCategories[0]`
- secondary display:
  - `Main chapter` comes from hardcoded category-to-chapter mapping
  - not from best visible exam chapter

Contract status:

- partial drift

Why:

- the category can be valid
- but the `Main chapter` shown under it is mapped support content, not necessarily the student's actual strongest exam chapter

### `Needs work now`

- visible field:
  - category name
- current source:
  - `learningSignals.categoriesNeedingWork[0]` or top high-risk category
- secondary display:
  - `Main chapter` comes from hardcoded category-to-chapter mapping
  - not from the visible weakest chapter in latest exam results

Contract status:

- drift

Why:

- this can point to a chapter that does not match the visible latest exam chapter breakdown

### `What to do next`

- current source:
  - top weak category from `learningSignals.categoriesNeedingWork`
  - top high-risk category from `learningSignals.highRiskCategories`
  - top chapter from `learningSignals.chapterPriorities[0]`
  - current readiness from `learningSignals.overallStatus`
- contract status:
  - drift

Why:

- the first action uses category logic from latest exam analytics
- the chapter action uses `chapterPriorities[0]`, which is mapped chapter guidance, not actual weakest visible chapter
- the readiness sentence can be acceptable if it is clearly framed as cumulative readiness
- but the chapter recommendation still fails the latest-exam eye test in real cases

## Known Failure Pattern

### Example: strong student gets misleading chapter guidance

Observed behavior:

- latest exam score is strong
- latest visible weakest chapter might be `Chapter 1`
- report still says:
  - `Give extra attention to Chapter 3. It is the clearest chapter-level priority.`

Why this happens:

1. latest exam analytics flag a weak category, such as `Infection Control`
2. `Infection Control` is mapped to:
   - primary: `Chapter 2`
   - secondary: `Chapter 3`, `Chapter 4`
3. chapter guidance promotion rules can suppress the primary chapter
4. the same logic can still allow a secondary chapter to appear
5. the UI then phrases that mapped guidance as if it were the student's clearest real chapter weakness

This fails:

- the latest-exam snapshot contract
- the eye test
- the trust test

## First Audit Findings

### Aligned

- latest exam score
- best chapter from latest exam
- worst chapter from latest exam
- exam history list
- per-exam chapter breakdown in progress/history

### Needs review

- current readiness labeling and threshold behavior
- strongest area secondary chapter
- needs work now secondary chapter
- chapter priorities
- what to do next chapter recommendation

### Most likely root issue

The system is mixing two different concepts:

- visible latest-exam performance snapshot
- indirect category-to-chapter guidance

Both can be useful, but they should not be presented as if they are the same thing.

## Recommended Audit Sequence

### Phase 1

Audit the student report fields against this contract:

- Current readiness
- Strongest area
- Needs work now
- What to do next
- Progress over time

### Phase 2

For each field, classify:

- aligned
- technically true but misleading
- wrong source
- wrong threshold
- wrong wording

### Phase 3

Fix source logic before wording.

Priority order:

1. chapter priority source
2. `What to do next` wording and chapter recommendation
3. readiness labeling and threshold review
4. class and school aggregation logic after the student layer is trustworthy

## Immediate Candidate Changes

These are not applied yet. They are the most likely first cleanup items.

### Candidate 1

Keep cumulative readiness, but label it more clearly as overall exam performance so far.

### Candidate 2

Make `What to do next` chapter guidance come from latest visible weakest chapter, unless there is a separately-labeled mapped guidance section.

### Candidate 3

Stop using mapped category chapters as the displayed `Main chapter` under `Needs work now` unless the UI explicitly says:

- `Related chapters`

instead of:

- `Main chapter`

## Working Principle

If a strong student sees a strong report and a weak student sees a clearly weak report, trust grows.

If visible fields and recommended actions do not agree with each other, trust breaks even when the underlying math is technically defensible.
