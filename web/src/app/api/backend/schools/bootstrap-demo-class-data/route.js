import { NextResponse } from "next/server";
import { resolveBackendRequestUser } from "@/app/lib/backend/auth/requestUser";
import {
  loadClassGroupRoster,
  upsertAppUser,
  upsertClassGroup,
  upsertClassGroupEnrollment,
  upsertSchool,
  upsertSchoolStaff,
  updateExamAttemptRecord,
  updatePracticeSessionRecord,
  updateRemediationSessionRecord,
} from "@/app/lib/backend/db/client";

const SCHOOL_ID = "school_firstcoastcna_demo";
const CLASS_GROUP_ID = "classgroup_spring_demo_a";

const DEMO_STUDENTS = [
  {
    id: "demo-student-ana",
    email: "ana.demo@study.firstcoastcna.com",
    fullName: "Ana Demo",
    exam: { id: "att_demo_ana_001", score: 82 },
    practice: { id: "practice_demo_ana_001", mode: "chapter", count: 5, status: "completed" },
    remediation: { id: "rem_demo_ana_001", status: "completed" },
  },
  {
    id: "demo-student-luis",
    email: "luis.demo@study.firstcoastcna.com",
    fullName: "Luis Demo",
    exam: { id: "att_demo_luis_001", score: 68 },
    practice: { id: "practice_demo_luis_001", mode: "category", count: 10, status: "completed" },
    remediation: { id: "rem_demo_luis_001", status: "active" },
  },
];

function buildExamResultsPayload(attemptId, scorePercent) {
  const didPass = scorePercent >= 80;
  return {
    final: {
      attempt_id: attemptId,
      score_percent: scorePercent,
      did_pass: didPass,
    },
    state: {
      exam_form_id: "demo_form",
      index: 59,
      summaryPage: 1,
      summaryFilter: "all",
      endAtMs: null,
      pausedRemainingSec: null,
    },
  };
}

export async function GET(request) {
  try {
    const resolved = await resolveBackendRequestUser(request, null, "School Admin");

    await upsertSchool({
      id: SCHOOL_ID,
      name: "First Coast CNA Demo School",
      slug: "firstcoastcna-demo",
    });

    await upsertSchoolStaff({
      id: `schoolstaff:${SCHOOL_ID}:${resolved.userId}`,
      schoolId: SCHOOL_ID,
      userId: resolved.userId,
      role: "admin",
    });

    await upsertClassGroup({
      id: CLASS_GROUP_ID,
      schoolId: SCHOOL_ID,
      name: "Spring Demo Cohort A",
      code: "SPRING-A",
      status: "active",
    });

    await upsertClassGroupEnrollment({
      id: `enrollment:${CLASS_GROUP_ID}:${resolved.userId}`,
      classGroupId: CLASS_GROUP_ID,
      userId: resolved.userId,
      role: "student",
      status: "active",
    });

    for (const student of DEMO_STUDENTS) {
      await upsertAppUser({
        id: student.id,
        email: student.email,
        fullName: student.fullName,
      });

      await upsertClassGroupEnrollment({
        id: `enrollment:${CLASS_GROUP_ID}:${student.id}`,
        classGroupId: CLASS_GROUP_ID,
        userId: student.id,
        role: "student",
        status: "active",
      });

      await updateExamAttemptRecord({
        id: student.exam.id,
        userId: student.id,
        testId: 1,
        lang: "en",
        mode: "finished",
        score: student.exam.score,
        deliveredQuestionIds: ["Q00001", "Q00002", "Q00003", "Q00004", "Q00005"],
        answersByQid: {
          Q00001: "A",
          Q00002: "B",
          Q00003: "C",
        },
        reviewByQid: {
          Q00004: true,
        },
        resultsPayload: buildExamResultsPayload(student.exam.id, student.exam.score),
      });

      await updatePracticeSessionRecord({
        id: student.practice.id,
        userId: student.id,
        lang: "en",
        mode: student.practice.mode,
        questionCount: student.practice.count,
        status: student.practice.status,
        payload: {
          session_id: student.practice.id,
          lang: "en",
          mode: student.practice.mode,
          status: student.practice.status,
          totalQuestions: student.practice.count,
          currentIndex: student.practice.count - 1,
          questionIds: ["Q00006", "Q00007", "Q00008", "Q00009", "Q00010"].slice(0, student.practice.count),
          submitted_total: student.practice.count,
          submitted_correct: student.id === "demo-student-ana" ? 4 : 6,
          created_at: Date.now(),
        },
      });

      await updateRemediationSessionRecord({
        id: student.remediation.id,
        userId: student.id,
        lang: "en",
        status: student.remediation.status,
        categories: ["Change in Condition", "Infection Control"],
        questionCount: 12,
        payload: {
          session_id: student.remediation.id,
          lang: "en",
          status: student.remediation.status,
          totalQuestions: 12,
          questionIds: ["Q00011", "Q00012", "Q00013", "Q00014", "Q00015", "Q00016"],
          selectedCategories: ["Change in Condition", "Infection Control"],
          submitted_total: student.remediation.status === "completed" ? 12 : 4,
          submitted_correct: student.remediation.status === "completed" ? 9 : 2,
          microOutcome: student.remediation.status === "completed" ? "Improving" : null,
          created_at: Date.now(),
        },
      });
    }

    const roster = await loadClassGroupRoster(CLASS_GROUP_ID);

    return NextResponse.json({
      ok: true,
      service: "schools-bootstrap-demo-class-data",
      user: {
        id: resolved.userId,
        source: resolved.source,
        appUser: resolved.appUser,
      },
      seededStudents: DEMO_STUDENTS.map((student) => ({
        id: student.id,
        email: student.email,
        fullName: student.fullName,
      })),
      roster,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "schools-bootstrap-demo-class-data",
        error: error instanceof Error ? error.message : "Unknown demo class bootstrap error",
      },
      { status: 500 }
    );
  }
}
