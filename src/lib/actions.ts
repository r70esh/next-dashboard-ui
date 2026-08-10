"use server";

import connectToDB from "@/lib/db";
import { Teacher, Student, Parent, Admin, Subject, Class, Lesson, Exam, Assignment, Result, Attendance, Event, Announcement, LessonPlan, ScheduleEntry } from "@/lib/models";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPeriodCountForClass, PERIOD_DURATION_MINUTES, WEEK_DAYS, DAY_LABELS } from "@/lib/periods";

// ── TEACHER ──────────────────────────────────────────────────────────────────
// `selfRegister` = account created from the public /register page.
// Such teachers must be approved by an admin before they can log in.
const toArray = (v: any) => {
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
};

export async function createTeacher(data: any, selfRegister = false) {
  try {
    if (!data.name || !data.email || !data.password || !data.phone || !data.address) {
      return { success: false, error: "Name, email, password, phone, and address are required." };
    }
    await connectToDB();
    const hashed = await bcrypt.hash(data.password, 10);
    await Teacher.create({
      teacherId: `T${Date.now()}`,
      name: data.name,
      email: data.email,
      password: hashed,
      phone: data.phone,
      address: data.address,
      subjects: toArray(data.subjects),
      classes: toArray(data.classes),
      status: selfRegister ? "pending" : "approved",
    });
    revalidatePath("/list/teachers");
    return { success: true, pending: selfRegister };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function approveTeacher(id: string) {
  try {
    await connectToDB();
    await Teacher.findByIdAndUpdate(id, { status: "approved" });
    revalidatePath("/list/teachers");
    revalidatePath(`/list/teachers/${id}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function rejectTeacher(id: string) {
  try {
    await connectToDB();
    await Teacher.findByIdAndDelete(id);
    revalidatePath("/list/teachers");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getTeacherStatus(email: string) {
  try {
    await connectToDB();
    const teacher = await Teacher.findOne({ email }).select("status");
    if (!teacher) return { exists: false, pending: false };
    return { exists: true, pending: teacher.status === "pending" };
  } catch {
    return { exists: false, pending: false };
  }
}

export async function updateTeacher(id: string, data: any) {
  try {
    await connectToDB();
    const update: any = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      subjects: toArray(data.subjects),
      classes: toArray(data.classes),
    };
    if (data.password) update.password = await bcrypt.hash(data.password, 10);
    await Teacher.findByIdAndUpdate(id, update);
    revalidatePath("/list/teachers");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteTeacher(id: string) {
  try {
    await connectToDB();
    await Teacher.findByIdAndDelete(id);
    revalidatePath("/list/teachers");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── STUDENT ──────────────────────────────────────────────────────────────────
export async function createStudent(data: any) {
  try {
    if (!data.name || !data.email || !data.password || !data.address) {
      return { success: false, error: "Name, email, password, and address are required." };
    }
    await connectToDB();
    const hashed = await bcrypt.hash(data.password, 10);
    // Use the pre-computed studentId (c311 format) if provided, otherwise generate one
    const studentId = data.studentId || `S${Date.now()}`;
    await Student.create({
      studentId,
      name: data.name,
      email: data.email,
      password: hashed,
      phone: data.phone,
      address: data.address,
      class: data.class || "1",
    });
    revalidatePath("/list/students");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateStudent(id: string, data: any) {
  try {
    await connectToDB();
    const update: any = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      class: data.class,
    };
    if (data.password) update.password = await bcrypt.hash(data.password, 10);
    await Student.findByIdAndUpdate(id, update);
    revalidatePath("/list/students");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteStudent(id: string) {
  try {
    await connectToDB();
    await Student.findByIdAndDelete(id);
    revalidatePath("/list/students");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── PARENT ───────────────────────────────────────────────────────────────────
export async function createParent(data: any) {
  try {
    if (!data.name || !data.email || !data.password || !data.phone || !data.address) {
      return { success: false, error: "Name, email, password, phone, and address are required." };
    }
    await connectToDB();
    const hashed = await bcrypt.hash(data.password, 10);
    await Parent.create({
      name: data.name,
      email: data.email,
      password: hashed,
      phone: data.phone,
      address: data.address,
      students: toArray(data.students),
    });
    revalidatePath("/list/parents");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateParent(id: string, data: any) {
  try {
    await connectToDB();
    const update: any = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      students: toArray(data.students),
    };
    if (data.password) update.password = await bcrypt.hash(data.password, 10);
    await Parent.findByIdAndUpdate(id, update);
    revalidatePath("/list/parents");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteParent(id: string) {
  try {
    await connectToDB();
    await Parent.findByIdAndDelete(id);
    revalidatePath("/list/parents");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── SUBJECT ──────────────────────────────────────────────────────────────────
export async function createSubject(data: any) {
  try {
    await connectToDB();
    await Subject.create({ name: data.name, teachers: toArray(data.teachers), classes: toArray(data.classes) });
    revalidatePath("/list/subjects");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}

export async function updateSubject(id: string, data: any) {
  try {
    await connectToDB();
    await Subject.findByIdAndUpdate(id, {
      name: data.name,
      teachers: toArray(data.teachers),
      classes: toArray(data.classes),
    });
    revalidatePath("/list/subjects");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}

export async function deleteSubject(id: string) {
  try {
    await connectToDB();
    await Subject.findByIdAndDelete(id);
    revalidatePath("/list/subjects");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}

export async function getSubjectOptions() {
  try {
    await connectToDB();
    const subjects = await Subject.find({}).select("name").sort({ name: 1 });
    return { success: true, subjects: JSON.parse(JSON.stringify(subjects)) };
  } catch (e: any) {
    return { success: false, error: e.message, subjects: [] };
  }
}

// Returns the classes + subjects assigned to the logged-in teacher so their
// create forms can be restricted to only those. Empty arrays = unrestricted
// (existing teachers that predate this feature keep full access).
export async function getTeacherScope() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (role !== "teacher") {
      return { success: true, subjects: [], classes: [] };
    }
    await connectToDB();
    const teacher = await Teacher.findOne({
      $or: [{ _id: (session?.user as any)?.id }, { email: session?.user?.email }],
    });
    if (!teacher) return { success: true, subjects: [], classes: [] };
    return {
      success: true,
      subjects: (teacher.subjects || []).filter(Boolean),
      classes: (teacher.classes || []).filter(Boolean),
    };
  } catch (e: any) {
    return { success: false, error: e.message, subjects: [], classes: [] };
  }
}

// ── CLASS ─────────────────────────────────────────────────────────────────────
export async function createClass(data: any) {
  try {
    await connectToDB();
    await Class.create({ name: data.name, capacity: parseInt(data.capacity), class: parseInt(data.class), supervisor: data.supervisor });
    revalidatePath("/list/classes");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}

export async function updateClass(id: string, data: any) {
  try {
    await connectToDB();
    await Class.findByIdAndUpdate(id, {
      name: data.name,
      capacity: parseInt(data.capacity),
      class: parseInt(data.class),
      supervisor: data.supervisor,
    });
    revalidatePath("/list/classes");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}

export async function deleteClass(id: string) {
  try {
    await connectToDB();
    await Class.findByIdAndDelete(id);
    revalidatePath("/list/classes");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}

// ── TEACHER OPTIONS (for supervisor selectors) ───────────────────────────────
export async function getTeacherOptions() {
  try {
    await connectToDB();
    const teachers = await Teacher.find({ status: { $ne: "pending" } }).select("teacherId name").sort({ name: 1 });
    return { success: true, teachers: JSON.parse(JSON.stringify(teachers)) };
  } catch (e: any) {
    return { success: false, error: e.message, teachers: [] };
  }
}

// When a teacher (logged in) creates/updates a record:
//  - the teacher name is always taken from the session (cannot be typed/forged),
//  - subject/class are restricted to what the teacher was assigned.
// Returns null when allowed, or an error object to short-circuit with.
async function enforceTeacherScope(data: any) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (role !== "teacher") return null;

  const teacher = await Teacher.findOne({
    $or: [{ _id: (session?.user as any)?.id }, { email: session?.user?.email }],
  });
  if (!teacher) return { error: "Teacher account not found." };

  if (session?.user?.name) data.teacher = session.user.name;

  const allowedSubjects = (teacher.subjects || []).map(String).filter(Boolean);
  const allowedClasses = (teacher.classes || []).map(String).filter(Boolean);

  if (allowedSubjects.length > 0 && !allowedSubjects.includes(String(data.subject))) {
    return { error: `You can only use your assigned subjects: ${allowedSubjects.join(", ")}.` };
  }
  if (allowedClasses.length > 0 && !allowedClasses.includes(String(data.class))) {
    return { error: `You can only select your assigned classes: ${allowedClasses.join(", ")}.` };
  }
  return null;
}

// ── EXAM ──────────────────────────────────────────────────────────────────────
// Resolves the exam type (class_test vs terminal_exam).
// - class_test:   created by teacher OR admin, for one specific subject.
// - terminal_exam: created by ADMIN ONLY, covers ALL subjects of the class.
async function resolveExamPayload(data: any): Promise<{ ok: true; subject: string; type: string } | { ok: false; error: string }> {
  const type = data.type === "terminal_exam" ? "terminal_exam" : "class_test";
  if (type === "terminal_exam") {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (role !== "admin") {
      return { ok: false, error: "Only admins can create Terminal Exams." };
    }
    return { ok: true, subject: "All Subjects", type };
  }
  return { ok: true, subject: data.subject, type };
}

export async function createExam(data: any) {
  try {
    await connectToDB();
    const resolved = await resolveExamPayload(data);
    if (!resolved.ok) return { success: false, error: resolved.error };
    const { subject, type } = resolved;
    const scopeError = await enforceTeacherScope({ ...data, subject });
    if (scopeError) return { success: false, error: scopeError.error };
    await Exam.create({ subject, class: data.class, teacher: data.teacher, type, date: new Date(data.date) });
    revalidatePath("/list/exams");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}
export async function deleteExam(id: string) {
  try {
    await connectToDB();
    await Exam.findByIdAndDelete(id);
    revalidatePath("/list/exams");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}

export async function updateExam(id: string, data: any) {
  try {
    await connectToDB();
    const resolved = await resolveExamPayload(data);
    if (!resolved.ok) return { success: false, error: resolved.error };
    const { subject, type } = resolved;
    const scopeError = await enforceTeacherScope({ ...data, subject });
    if (scopeError) return { success: false, error: scopeError.error };
    await Exam.findByIdAndUpdate(id, {
      subject,
      class: data.class,
      teacher: data.teacher,
      type,
      date: new Date(data.date),
    });
    revalidatePath("/list/exams");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}


// ── ASSIGNMENT ────────────────────────────────────────────────────────────────
export async function createAssignment(data: any) {
  try {
    await connectToDB();
    const scopeError = await enforceTeacherScope(data);
    if (scopeError) return { success: false, error: scopeError.error };
    await Assignment.create({ subject: data.subject, class: data.class, teacher: data.teacher, dueDate: new Date(data.dueDate) });
    revalidatePath("/list/assignments");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}
export async function updateAssignment(id: string, data: any) {
  try {
    await connectToDB();
    const scopeError = await enforceTeacherScope(data);
    if (scopeError) return { success: false, error: scopeError.error };
    await Assignment.findByIdAndUpdate(id, {
      subject: data.subject,
      class: data.class,
      teacher: data.teacher,
      dueDate: new Date(data.dueDate),
    });
    revalidatePath("/list/assignments");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}
export async function deleteAssignment(id: string) {
  try {
    await connectToDB();
    await Assignment.findByIdAndDelete(id);
    revalidatePath("/list/assignments");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}

// ── RESULT ────────────────────────────────────────────────────────────────────
export async function createResult(data: any) {
  try {
    await connectToDB();
    const scopeError = await enforceTeacherScope(data);
    if (scopeError) return { success: false, error: scopeError.error };
    await Result.create({
      subject: data.subject,
      class: data.class,
      teacher: data.teacher,
      student: data.student,
      type: data.type,
      date: new Date(data.date),
      score: parseInt(data.score),
      maxScore: parseInt(data.maxScore) || 100,
    });
    revalidatePath("/list/results");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}
export async function deleteResult(id: string) {
  try {
    await connectToDB();
    await Result.findByIdAndDelete(id);
    revalidatePath("/list/results");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}

export async function updateResult(id: string, data: any) {
  try {
    await connectToDB();
    const scopeError = await enforceTeacherScope(data);
    if (scopeError) return { success: false, error: scopeError.error };
    await Result.findByIdAndUpdate(id, {
      subject: data.subject,
      class: data.class,
      teacher: data.teacher,
      student: data.student,
      type: data.type,
      date: new Date(data.date),
      score: parseInt(data.score),
      maxScore: parseInt(data.maxScore) || 100,
    });
    revalidatePath("/list/results");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}

// ── STUDENT PERFORMANCE CALCULATION ──────────────────────────────────────────
export async function getStudentPerformance(studentName: string, studentId: string) {
  try {
    await connectToDB();

    // Fetch all results for this student
    const allResults = await Result.find({
      $or: [
        { student: studentName },
        { student: studentId }
      ]
    });

    // Fetch attendance
    const attendanceRecords = await Attendance.find({
      $or: [
        { student: studentName },
        { student: studentId }
      ]
    });

    // ─ Attendance %
    let attendancePercent = 100;
    if (attendanceRecords.length > 0) {
      const present = attendanceRecords.filter((r: any) => r.status === "present" || r.status === "late").length;
      attendancePercent = Math.round((present / attendanceRecords.length) * 100);
    }

    // ─ Group results by type and calculate avg %
    const byType: Record<string, { totalScore: number; totalMax: number; count: number }> = {
      assignment: { totalScore: 0, totalMax: 0, count: 0 },
      class_test: { totalScore: 0, totalMax: 0, count: 0 },
      terminal_exam: { totalScore: 0, totalMax: 0, count: 0 },
    };

    const resultDetails: any[] = [];

    allResults.forEach((r: any) => {
      const type = r.type;
      const max = r.maxScore || 100;
      if (byType[type]) {
        byType[type].totalScore += r.score;
        byType[type].totalMax += max;
        byType[type].count += 1;
      }
      resultDetails.push({
        id: r._id.toString(),
        subject: r.subject,
        type: r.type,
        score: r.score,
        maxScore: max,
        percent: Math.round((r.score / max) * 100),
        date: new Date(r.date).toLocaleDateString(),
        teacher: r.teacher,
      });
    });

    const calcPct = (t: typeof byType.assignment) =>
      t.totalMax > 0 ? Math.round((t.totalScore / t.totalMax) * 100) : null;

    const assignmentPct = calcPct(byType.assignment);
    const classTestPct = calcPct(byType.class_test);
    const terminalPct = calcPct(byType.terminal_exam);

    // Weighted overall: assignment 20%, classTest 30%, terminal 50%
    let overall = null;
    const weights = [];
    if (assignmentPct !== null) weights.push({ val: assignmentPct, w: 0.2 });
    if (classTestPct !== null) weights.push({ val: classTestPct, w: 0.3 });
    if (terminalPct !== null) weights.push({ val: terminalPct, w: 0.5 });

    if (weights.length > 0) {
      const totalW = weights.reduce((s, x) => s + x.w, 0);
      overall = Math.round(weights.reduce((s, x) => s + (x.val * x.w), 0) / totalW);
    }

    const grade = (pct: number | null) => {
      if (pct === null) return "N/A";
      if (pct >= 90) return "A+";
      if (pct >= 80) return "A";
      if (pct >= 70) return "B+";
      if (pct >= 60) return "B";
      if (pct >= 50) return "C";
      if (pct >= 40) return "D";
      return "F";
    };

    return {
      success: true,
      attendancePercent,
      attendanceTotal: attendanceRecords.length,
      assignmentPct,
      classTestPct,
      terminalPct,
      overall,
      grade: grade(overall),
      resultDetails: JSON.parse(JSON.stringify(resultDetails)),
      counts: {
        assignment: byType.assignment.count,
        class_test: byType.class_test.count,
        terminal_exam: byType.terminal_exam.count,
      }
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}



// ── ATTENDANCE ────────────────────────────────────────────────────────────────
export async function createAttendance(data: any) {
  try {
    await connectToDB();
    await Attendance.create({ student: data.student, date: new Date(), class: data.class, period: data.period || "", status: data.status });
    revalidatePath("/list/attendance");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}
export async function updateAttendance(id: string, data: any) {
  try {
    await connectToDB();
    await Attendance.findByIdAndUpdate(id, { status: data.status, class: data.class, period: data.period || "" });
    revalidatePath("/list/attendance");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}
export async function deleteAttendance(id: string) {
  try {
    await connectToDB();
    await Attendance.findByIdAndDelete(id);
    revalidatePath("/list/attendance");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}

// ── EVENT ─────────────────────────────────────────────────────────────────────
export async function createEvent(data: any) {
  try {
    await connectToDB();
    await Event.create({
      title: data.title,
      description: data.description,
      class: data.class,
      date: new Date(data.date),
      startTime: data.startTime,
      endTime: data.endTime,
    });
    revalidatePath("/list/events");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}
export async function updateEvent(id: string, data: any) {
  try {
    await connectToDB();
    await Event.findByIdAndUpdate(id, {
      title: data.title,
      description: data.description,
      class: data.class,
      date: new Date(data.date),
      startTime: data.startTime,
      endTime: data.endTime,
    });
    revalidatePath("/list/events");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}
export async function deleteEvent(id: string) {
  try {
    await connectToDB();
    await Event.findByIdAndDelete(id);
    revalidatePath("/list/events");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}

// ── ANNOUNCEMENT ──────────────────────────────────────────────────────────────
export async function createAnnouncement(data: any) {
  try {
    await connectToDB();
    await Announcement.create({ title: data.title, class: data.class, date: new Date(data.date) });
    revalidatePath("/list/announcements");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}
export async function deleteAnnouncement(id: string) {
  try {
    await connectToDB();
    await Announcement.findByIdAndDelete(id);
    revalidatePath("/list/announcements");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}

// ── LESSON ────────────────────────────────────────────────────────────────────
export async function createLesson(data: any) {
  try {
    await connectToDB();
    const scopeError = await enforceTeacherScope(data);
    if (scopeError) return { success: false, error: scopeError.error };
    await Lesson.create({ subject: data.subject, class: data.class, teacher: data.teacher });
    revalidatePath("/list/lessons");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}
export async function deleteLesson(id: string) {
  try {
    await connectToDB();
    await Lesson.findByIdAndDelete(id);
    revalidatePath("/list/lessons");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}
export async function updateLesson(id: string, data: any) {
  try {
    await connectToDB();
    const scopeError = await enforceTeacherScope(data);
    if (scopeError) return { success: false, error: scopeError.error };
    await Lesson.findByIdAndUpdate(id, {
      subject: data.subject,
      class: data.class,
      teacher: data.teacher,
    });
    revalidatePath("/list/lessons");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── LESSON PLANS ────────────────────────────────────────────────────────────
function sanitizePlan(data: any) {
  return {
    subject: String(data.subject || "").trim(),
    class: String(data.class || "").trim(),
    topic: String(data.topic || "").trim(),
    date: String(data.date || ""),
    duration: Number(data.duration) || 45,
    students: Number(data.students) || 0,
    objectives: Array.isArray(data.objectives) ? data.objectives.map((o: any) => String(o || "").trim()).filter(Boolean) : [],
    resources: Array.isArray(data.resources) ? data.resources.map((r: any) => String(r || "").trim()).filter(Boolean) : [],
    resourceLinks: Array.isArray(data.resourceLinks) ? data.resourceLinks.map((l: any) => String(l || "").trim()).filter(Boolean) : [],
    activities: Array.isArray(data.activities)
      ? data.activities.map((a: any) => ({
          time: Number(a.time) || 0,
          activity: String(a.activity || "").trim(),
          method: String(a.method || "").trim(),
        }))
      : [],
    assessments: Array.isArray(data.assessments)
      ? data.assessments.map((a: any) => ({
          method: String(a.method || "").trim(),
          tool: String(a.tool || "").trim(),
          criteria: String(a.criteria || "").trim(),
        }))
      : [],
    reflection: String(data.reflection || "").trim(),
    status: data.status === "published" ? "published" : "draft",
    sharedWith: Array.isArray(data.sharedWith) ? data.sharedWith.map((s: any) => String(s || "").trim()).filter(Boolean) : [],
  };
}

async function getSessionTeacher() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const userId = (session.user as any).id;
  const userEmail = session.user.email;
  await connectToDB();
  const teacher = await Teacher.findOne({ $or: [{ _id: userId }, { email: userEmail }] });
  if (!teacher) return null;
  return teacher;
}

// Returns an error string if the teacher's subject/class are outside their
// assigned scope (empty assigned list = unrestricted). Null = allowed.
function checkTeacherScope(teacher: any, subject: any, className: any) {
  const allowedSubjects = (teacher.subjects || []).map(String).filter(Boolean);
  const allowedClasses = (teacher.classes || []).map(String).filter(Boolean);
  if (allowedSubjects.length > 0 && !allowedSubjects.includes(String(subject))) {
    return `You can only use your assigned subjects: ${allowedSubjects.join(", ")}.`;
  }
  if (allowedClasses.length > 0 && !allowedClasses.includes(String(className))) {
    return `You can only select your assigned classes: ${allowedClasses.join(", ")}.`;
  }
  return null;
}

export async function createLessonPlan(data: any) {
  try {
    const teacher = await getSessionTeacher();
    if (!teacher) {
      return { success: false, error: "Only teachers can create lesson plans." };
    }
    const scopeError = checkTeacherScope(teacher, data.subject, data.class);
    if (scopeError) return { success: false, error: scopeError };
    const plan = await LessonPlan.create({
      ownerId: teacher._id.toString(),
      ownerName: teacher.name,
      ...sanitizePlan(data),
      template: !!data.template,
    });
    revalidatePath("/lesson-plans");
    return { success: true, id: plan._id.toString() };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateLessonPlan(id: string, data: any) {
  try {
    const teacher = await getSessionTeacher();
    if (!teacher) {
      return { success: false, error: "Only teachers can edit lesson plans." };
    }
    const scopeError = checkTeacherScope(teacher, data.subject, data.class);
    if (scopeError) return { success: false, error: scopeError };
    const plan = await LessonPlan.findById(id);
    if (!plan) return { success: false, error: "Lesson plan not found." };
    if (plan.ownerId !== teacher._id.toString()) {
      return { success: false, error: "You can only edit your own lesson plan." };
    }
    await LessonPlan.findByIdAndUpdate(id, sanitizePlan(data));
    revalidatePath("/lesson-plans");
    revalidatePath(`/lesson-plans/${id}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteLessonPlan(id: string) {
  try {
    const teacher = await getSessionTeacher();
    if (!teacher) {
      return { success: false, error: "Only teachers can delete lesson plans." };
    }
    const plan = await LessonPlan.findById(id);
    if (!plan) return { success: false, error: "Lesson plan not found." };
    if (plan.ownerId !== teacher._id.toString()) {
      return { success: false, error: "You can only delete your own lesson plan." };
    }
    await LessonPlan.findByIdAndDelete(id);
    revalidatePath("/lesson-plans");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function duplicateLessonPlan(id: string) {
  try {
    const teacher = await getSessionTeacher();
    if (!teacher) {
      return { success: false, error: "Only teachers can duplicate lesson plans." };
    }
    const original = await LessonPlan.findById(id);
    if (!original) return { success: false, error: "Lesson plan not found." };
    const copy = await LessonPlan.create({
      ownerId: teacher._id.toString(),
      ownerName: teacher.name,
      ...sanitizePlan(original.toObject()),
      status: "draft",
      sharedWith: [],
      template: false,
    });
    revalidatePath("/lesson-plans");
    return { success: true, id: copy._id.toString() };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function shareLessonPlan(id: string, teacherName: string) {
  try {
    const teacher = await getSessionTeacher();
    if (!teacher) return { success: false, error: "Only teachers can share lesson plans." };
    const plan = await LessonPlan.findById(id);
    if (!plan) return { success: false, error: "Lesson plan not found." };
    if (plan.ownerId !== teacher._id.toString()) {
      return { success: false, error: "You can only share your own lesson plan." };
    }
    const name = String(teacherName || "").trim();
    if (!name) return { success: false, error: "Enter a teacher's name." };
    const shared = Array.isArray(plan.sharedWith) ? plan.sharedWith : [];
    if (!shared.includes(name)) shared.push(name);
    plan.sharedWith = shared;
    await plan.save();
    revalidatePath("/lesson-plans");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createLessonPlanFromTemplate(data: any) {
  try {
    const teacher = await getSessionTeacher();
    if (!teacher) {
      return { success: false, error: "Only teachers can create lesson plans." };
    }
    const scopeError = checkTeacherScope(teacher, data.subject, data.class);
    if (scopeError) return { success: false, error: scopeError };
    const plan = await LessonPlan.create({
      ownerId: teacher._id.toString(),
      ownerName: teacher.name,
      ...sanitizePlan(data),
      template: false,
    });
    revalidatePath("/lesson-plans");
    return { success: true, id: plan._id.toString() };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── USER PROFILE & PASSWORD ──────────────────────────────────────────────────
export async function updateUserProfile(id: string, role: string, data: { name?: string; phone?: string; address?: string }) {
  try {
    if (data.address !== undefined && !data.address.trim()) {
      return { success: false, error: "Address is required." };
    }
    await connectToDB();
    const update: any = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.phone !== undefined) update.phone = data.phone;
    if (data.address !== undefined) update.address = data.address;

    if (role === "teacher") {
      await Teacher.findByIdAndUpdate(id, update);
    } else if (role === "student") {
      await Student.findByIdAndUpdate(id, update);
    } else if (role === "parent") {
      await Parent.findByIdAndUpdate(id, update);
    } else if (role === "admin") {
      await Admin.findByIdAndUpdate(id, update);
    }
    revalidatePath("/profile");
    revalidatePath("/list");
    revalidatePath("/list/students");
    revalidatePath("/list/teachers");
    revalidatePath("/list/parents");
    revalidatePath("/list/students/[id]");
    revalidatePath("/list/teachers/[id]");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── CLASS BULK ATTENDANCE ───────────────────────────────────────────────────
// Fetch the students of a class with their attendance status for the given
// date and period (period "1".."8"; empty period = whole-day / general).
export async function getClassStudentsAndAttendance(className: string, dateStr: string, period = "") {
  try {
    await connectToDB();
    if (!className) return { success: false, students: [] };

    // Fetch students in this class
    const students = await Student.find({ class: className }).sort({ name: 1 });

    // Parse target date boundaries (start of day to end of day)
    const targetDate = new Date(dateStr);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Fetch existing attendance records for this date, class, and period
    const existingRecords = await Attendance.find({
      class: className,
      period,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    const attendanceMap: Record<string, string> = {};
    existingRecords.forEach((rec: any) => {
      attendanceMap[rec.student] = rec.status;
    });

    const result = students.map((st: any) => ({
      id: st._id.toString(),
      studentId: st.studentId,
      name: st.name,
      email: st.email,
      class: st.class,
      status: attendanceMap[st.name] || attendanceMap[st.studentId] || "present",
    }));

    return { success: true, students: JSON.parse(JSON.stringify(result)) };
  } catch (e: any) {
    return { success: false, error: e.message, students: [] };
  }
}

export async function bulkSaveAttendance(className: string, dateStr: string, period = "", records: Array<{ name: string; studentId: string; status: "present" | "absent" | "late" }>) {
  try {
    await connectToDB();
    if (!className || !dateStr || !records || records.length === 0) {
      return { success: false, error: "Class, date, and student records are required." };
    }

    // Guard: the period must be within the class's valid period count.
    if (period) {
      const maxPeriod = getPeriodCountForClass(className);
      const p = parseInt(period, 10);
      if (isNaN(p) || p < 1 || p > maxPeriod) {
        return { success: false, error: `Class ${className} has only ${maxPeriod} periods (${maxPeriod} x ${PERIOD_DURATION_MINUTES} min).` };
      }
    }

    const startOfDay = new Date(new Date(dateStr).setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(dateStr).setHours(23, 59, 59, 999));

    // Capture the exact current time for this attendance record
    const exactNow = new Date();

    for (const item of records) {
      // Find existing attendance for this student on this day, class, and period
      const existing = await Attendance.findOne({
        class: className,
        period,
        student: item.name,
        date: { $gte: startOfDay, $lte: endOfDay }
      }) || await Attendance.findOne({
        class: className,
        period,
        student: item.studentId,
        date: { $gte: startOfDay, $lte: endOfDay }
      });

      if (existing) {
        existing.status = item.status;
        existing.class = className;
        existing.period = period;
        // Update the timestamp to the latest submission time
        existing.date = exactNow;
        await existing.save();
      } else {
        await Attendance.create({
          date: exactNow,
          student: item.name,
          class: className,
          period,
          status: item.status,
        });
      }
    }

    revalidatePath("/list/attendance");
    revalidatePath("/profile");
    revalidatePath("/list/students");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// Weekly present/absent counts for a specific class + period, used by the
// admin dashboard chart (period "1".."8"; empty period = all periods).
export async function getPeriodAttendanceStats(className = "", period = "") {
  try {
    await connectToDB();
    const filter: any = {};
    if (className) filter.class = className;
    if (period) filter.period = period;

    const records = await Attendance.find(filter);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayStats: Record<string, { present: number; absent: number }> = {
      Mon: { present: 0, absent: 0 },
      Tue: { present: 0, absent: 0 },
      Wed: { present: 0, absent: 0 },
      Thu: { present: 0, absent: 0 },
      Fri: { present: 0, absent: 0 },
    };

    records.forEach((rec: any) => {
      const dayName = days[new Date(rec.date).getDay()];
      if (dayStats[dayName]) {
        if (rec.status === "present" || rec.status === "late") {
          dayStats[dayName].present += 1;
        } else {
          dayStats[dayName].absent += 1;
        }
      }
    });

    return {
      success: true,
      data: ["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => ({
        name: day,
        present: dayStats[day].present || 0,
        absent: dayStats[day].absent || 0,
      })),
    };
  } catch (e: any) {
    return { success: false, error: e.message, data: [] };
  }
}

export async function getStudentAttendancePercentage(studentIdentifier: string) {
  try {
    await connectToDB();
    const records = await Attendance.find({
      $or: [
        { student: studentIdentifier },
        { class: studentIdentifier }
      ]
    });
    if (!records || records.length === 0) return 100;
    const presentOrLate = records.filter((r: any) => r.status === "present" || r.status === "late").length;
    return Math.round((presentOrLate / records.length) * 100);
  } catch {
    return 100;
  }
}

export async function getWeeklyAttendanceData() {
  try {
    await connectToDB();
    const records = await Attendance.find({});
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayStats: Record<string, { present: number; absent: number }> = {
      Mon: { present: 0, absent: 0 },
      Tue: { present: 0, absent: 0 },
      Wed: { present: 0, absent: 0 },
      Thu: { present: 0, absent: 0 },
      Fri: { present: 0, absent: 0 },
    };

    records.forEach((rec: any) => {
      const dayName = days[new Date(rec.date).getDay()];
      if (dayStats[dayName]) {
        if (rec.status === "present" || rec.status === "late") {
          dayStats[dayName].present += 1;
        } else {
          dayStats[dayName].absent += 1;
        }
      }
    });

    return ["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => ({
      name: day,
      present: dayStats[day].present || 10,
      absent: dayStats[day].absent || 1,
    }));
  } catch {
    return [
      { name: "Mon", present: 15, absent: 1 },
      { name: "Tue", present: 18, absent: 2 },
      { name: "Wed", present: 20, absent: 0 },
      { name: "Thu", present: 17, absent: 3 },
      { name: "Fri", present: 19, absent: 1 },
    ];
  }
}

// ── SCHEDULE (Class Routine) ─────────────────────────────────────────────────
// One ScheduleEntry per (class, day, period) slot. Rows are edited on a
// per-day grid and bulk-saved, but individual slots can also be saved/deleted
// directly. Only admins can modify the timetable; students/parents/teachers
// get read-only views scoped to their own class.

const SCHEDULE_CLASS_REGEX = /^([1-9]|10|11|12)$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;
const SCHEDULE_TYPES = ["class", "break", "lunch", "assembly", "other"];

async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.role === "admin" ? session : null;
}

function validateSchedulePayload(data: any): string | null {
  const cls = String(data.class || "").trim();
  if (!SCHEDULE_CLASS_REGEX.test(cls)) return "Select a valid class (1-12).";
  const day = String(data.day || "");
  if (!WEEK_DAYS.some((d) => d.value === day)) return "Select a valid day.";
  const period = Number(data.period);
  if (!Number.isInteger(period) || period < 1) return "Select a valid period.";
  const start = String(data.startTime || "");
  const end = String(data.endTime || "");
  if (!TIME_REGEX.test(start) || !TIME_REGEX.test(end)) return "Times must use HH:MM format (e.g. 10:10).";
  if (start >= end) return "End time must be after start time.";
  return null;
}

// Contiguous slots are allowed (one ends exactly when the next starts); true
// overlaps are rejected.
function checkDayOverlap(entries: any[]): string | null {
  const sorted = [...entries].sort((a, b) => {
    if (a.startTime === b.startTime) return Number(a.period) - Number(b.period);
    return a.startTime < b.startTime ? -1 : 1;
  });
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (prev.endTime > curr.startTime) {
      return `Time overlap: ${prev.startTime}-${prev.endTime} conflicts with ${curr.startTime}-${curr.endTime}.`;
    }
  }
  return null;
}

// ── MONTHLY ROUTINE HELPERS ──────────────────────────────────────────────────
function parseMonthStr(monthStr: string): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(String(monthStr || ""));
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

function dateStrFor(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function weekdayFor(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][
    new Date(y, m - 1, d).getDay()
  ];
}

// The previous schema used a unique index on (class, day, period). The monthly
// feature stores one row per (class, day, period, date), so that old index
// would wrongly block multiple dates for the same weekday slot. Drop it once
// so the new (class, day, period, date) unique index is the only constraint.
let scheduleIndexMigration: Promise<void> | null = null;
function ensureScheduleIndexes(): Promise<void> {
  if (!scheduleIndexMigration) {
    scheduleIndexMigration = (async () => {
      try {
        const indexes = await ScheduleEntry.collection.indexes();
        const legacy = indexes.find(
          (i) =>
            i.name === "class_1_day_1_period_1" &&
            JSON.stringify(i.key) === JSON.stringify({ class: 1, day: 1, period: 1 })
        );
        if (legacy) await ScheduleEntry.collection.dropIndex("class_1_day_1_period_1");
      } catch {
        // Ignore: index already gone, or the collection does not exist yet.
      }
    })();
  }
  return scheduleIndexMigration;
}

export async function getScheduleForClassDay(className: string, day: string) {
  try {
    await connectToDB();
    const entries = await ScheduleEntry.find({ class: String(className), day, date: null }).sort({ period: 1 });
    return { success: true, entries: JSON.parse(JSON.stringify(entries)) };
  } catch (e: any) {
    return { success: false, error: e.message, entries: [] };
  }
}

export async function getWeeklyScheduleForClass(className: string) {
  try {
    await connectToDB();
    const entries = await ScheduleEntry.find({ class: String(className), date: null }).sort({ period: 1 });
    const week: Record<string, any[]> = {};
    for (const d of WEEK_DAYS) week[d.value] = [];
    entries.forEach((e: any) => {
      const obj = JSON.parse(JSON.stringify(e));
      if (week[obj.day]) week[obj.day].push(obj);
    });
    return { success: true, week };
  } catch (e: any) {
    return { success: false, error: e.message, week: {} };
  }
}

export async function saveScheduleEntry(data: any) {
  try {
    if (!(await requireAdminSession())) {
      return { success: false, error: "Only admins can modify schedules." };
    }
    await connectToDB();
    const err = validateSchedulePayload(data);
    if (err) return { success: false, error: err };

    const cls = String(data.class);
    const day = String(data.day);
    const period = Number(data.period);
    const payload = {
      class: cls,
      day,
      date: null,
      period,
      startTime: data.startTime,
      endTime: data.endTime,
      subject: String(data.subject || "").trim(),
      teacher: String(data.teacher || "").trim(),
      room: String(data.room || "").trim(),
      type: SCHEDULE_TYPES.includes(data.type) ? data.type : "class",
      notes: String(data.notes || "").trim(),
    };

    if (data.id) {
      await ScheduleEntry.findByIdAndUpdate(data.id, payload);
    } else {
      // Upsert on the unique (class, day, period, date) index so re-saving a
      // weekly slot never creates a duplicate row.
      await ScheduleEntry.findOneAndUpdate(
        { class: cls, day, period, date: null },
        { $set: payload },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    revalidatePath("/list/schedules");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteScheduleEntry(id: string) {
  try {
    if (!(await requireAdminSession())) {
      return { success: false, error: "Only admins can modify schedules." };
    }
    await connectToDB();
    await ScheduleEntry.findByIdAndDelete(id);
    revalidatePath("/list/schedules");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function bulkSaveSchedule(className: string, day: string, rows: any[]) {
  try {
    if (!(await requireAdminSession())) {
      return { success: false, error: "Only admins can modify schedules." };
    }
    if (!WEEK_DAYS.some((d) => d.value === day)) {
      return { success: false, error: "Select a valid day." };
    }
    await connectToDB();
    const cls = String(className);
    const entries: any[] = [];
    for (const row of rows) {
      const err = validateSchedulePayload({ ...row, class: cls, day });
      if (err) return { success: false, error: `Period ${row.period}: ${err}` };
      const { _id, ...clean } = row;
      entries.push({ ...clean, class: cls, day, date: null });
    }
    const overlap = checkDayOverlap(entries);
    if (overlap) return { success: false, error: overlap };

    await ScheduleEntry.deleteMany({ class: cls, day, date: null });
    if (entries.length > 0) {
      await ScheduleEntry.insertMany(entries);
    }
    revalidatePath("/list/schedules");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function copyScheduleDay(
  sourceClass: string,
  sourceDay: string,
  targetClass: string,
  targetDay: string
) {
  try {
    if (!(await requireAdminSession())) {
      return { success: false, error: "Only admins can modify schedules." };
    }
    if (sourceClass === targetClass && sourceDay === targetDay) {
      return { success: false, error: "Source and target are the same day." };
    }
    if (
      !WEEK_DAYS.some((d) => d.value === sourceDay) ||
      !WEEK_DAYS.some((d) => d.value === targetDay)
    ) {
      return { success: false, error: "Select valid days." };
    }
    await connectToDB();
    const source = await ScheduleEntry.find({ class: String(sourceClass), day: sourceDay, date: null });
    if (source.length === 0) {
      return { success: false, error: `No schedule found for Class ${sourceClass} on ${DAY_LABELS[sourceDay]}.` };
    }
    const targetClassStr = String(targetClass);
    const targetDayStr = String(targetDay);
    await ScheduleEntry.deleteMany({ class: targetClassStr, day: targetDayStr, date: null });
    await ScheduleEntry.insertMany(
      source.map((e: any) => ({
        class: targetClassStr,
        day: targetDayStr,
        date: null,
        period: e.period,
        startTime: e.startTime,
        endTime: e.endTime,
        subject: e.subject || "",
        teacher: e.teacher || "",
        room: e.room || "",
        type: e.type || "class",
        notes: e.notes || "",
      }))
    );
    revalidatePath("/list/schedules");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function copyScheduleWeek(sourceClass: string, targetClass: string) {
  try {
    if (!(await requireAdminSession())) {
      return { success: false, error: "Only admins can modify schedules." };
    }
    if (sourceClass === targetClass) {
      return { success: false, error: "Source and target class are the same." };
    }
    await connectToDB();
    const source = await ScheduleEntry.find({ class: String(sourceClass), date: null });
    if (source.length === 0) {
      return { success: false, error: `No schedule found for Class ${sourceClass}.` };
    }
    const target = String(targetClass);
    await ScheduleEntry.deleteMany({ class: target, date: null });
    await ScheduleEntry.insertMany(
      source.map((e: any) => ({
        class: target,
        day: e.day,
        date: null,
        period: e.period,
        startTime: e.startTime,
        endTime: e.endTime,
        subject: e.subject || "",
        teacher: e.teacher || "",
        room: e.room || "",
        type: e.type || "class",
        notes: e.notes || "",
      }))
    );
    revalidatePath("/list/schedules");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// Read-only accessors used by the student/parent/teacher dashboards. These do
// NOT require an admin session; they resolve the caller's own class scope.
export async function getMyClassSchedule() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (role !== "student") {
      return { success: false, error: "Only students can view this.", className: "", week: {} };
    }
    await connectToDB();
    const student = await Student.findOne({
      $or: [{ email: session?.user?.email }, { name: session?.user?.name }],
    });
    if (!student || !student.class) {
      return { success: false, error: "No class assigned to your account.", className: "", week: {} };
    }
    const className = String(student.class);
    const weekRes = await getWeeklyScheduleForClass(className);
    return { success: true, className, week: weekRes.week || {} };
  } catch (e: any) {
    return { success: false, error: e.message, className: "", week: {} };
  }
}

export async function getMyChildrenSchedules() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (role !== "parent") {
      return { success: false, error: "Only parents can view this.", children: [] };
    }
    await connectToDB();
    const parent = await Parent.findOne({ email: session?.user?.email });
    if (!parent) {
      return { success: false, error: "Parent account not found.", children: [] };
    }
    const linked: string[] = Array.isArray(parent.students) ? parent.students : [];
    const students = await Student.find({ $or: [{ studentId: { $in: linked } }, { name: { $in: linked } }] });
    const children: Array<{ id: string; name: string; className: string; photo: string; week: Record<string, any[]> }> = [];
    for (const s of students) {
      const className = String(s.class);
      const weekRes = await getWeeklyScheduleForClass(className);
      children.push({
        id: String(s._id),
        name: s.name,
        className,
        photo: s.photo || "",
        week: weekRes.week || {},
      });
    }
    return { success: true, children };
  } catch (e: any) {
    return { success: false, error: e.message, children: [] };
  }
}

export async function getTeacherAssignedClasses() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (role !== "teacher") {
      return { success: false, error: "Only teachers can view this.", classes: [] };
    }
    await connectToDB();
    const teacher = await Teacher.findOne({
      $or: [{ _id: (session?.user as any)?.id }, { email: session?.user?.email }],
    });
    const classes: string[] = (teacher?.classes || []).map(String).filter(Boolean);
    return { success: true, classes };
  } catch (e: any) {
    return { success: false, error: e.message, classes: [] };
  }
}

// ── MONTHLY ROUTINE ──────────────────────────────────────────────────────────
// The weekly pattern (date: null) repeats every week. "Copy to month"
// materializes it into date-specific rows for every school day of a chosen
// month, so the month is filled without per-day data entry. Each date can then
// be edited (an override) or reset back to the weekly pattern.

export async function copyScheduleToMonth(className: string, monthStr: string) {
  try {
    if (!(await requireAdminSession())) {
      return { success: false, error: "Only admins can modify schedules." };
    }
    const parsed = parseMonthStr(monthStr);
    if (!parsed) return { success: false, error: "Select a valid month." };
    await connectToDB();
    await ensureScheduleIndexes();
    const cls = String(className);
    const pattern = await ScheduleEntry.find({ class: cls, date: null });
    if (pattern.length === 0) {
      return { success: false, error: "Create the weekly routine for this class first, then copy it to the month." };
    }
    const patternByWeekday: Record<string, any[]> = {};
    pattern.forEach((e: any) => {
      (patternByWeekday[e.day] = patternByWeekday[e.day] || []).push(e);
    });

    const { year, month } = parsed;
    const daysInMonth = new Date(year, month, 0).getDate();
    let created = 0;
    let skipped = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = dateStrFor(year, month, d);
      const weekday = weekdayFor(dateStr);
      if (weekday === "saturday") continue;
      const template = patternByWeekday[weekday];
      if (!template || template.length === 0) continue;

      const existing = await ScheduleEntry.find({ class: cls, date: dateStr });
      if (existing.length > 0) {
        skipped++;
        continue;
      }
      await ScheduleEntry.insertMany(
        template.map((e: any) => ({
          class: cls,
          day: weekday,
          date: dateStr,
          period: e.period,
          startTime: e.startTime,
          endTime: e.endTime,
          subject: e.subject || "",
          teacher: e.teacher || "",
          room: e.room || "",
          type: e.type || "class",
          notes: e.notes || "",
        }))
      );
      created++;
    }
    revalidatePath("/list/schedules");
    return {
      success: true,
      message: `Copied the weekly routine to ${created} school day(s) in this month${
        skipped > 0 ? ` · skipped ${skipped} date(s) you already customized.` : "."
      }`,
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getMonthlySchedule(className: string, monthStr: string) {
  try {
    const parsed = parseMonthStr(monthStr);
    if (!parsed) return { success: false, error: "Select a valid month.", dates: [] };
    await connectToDB();
    const cls = String(className);
    const { year, month } = parsed;
    const startStr = dateStrFor(year, month, 1);
    const endStr = dateStrFor(year, month, new Date(year, month, 0).getDate());

    const pattern = await ScheduleEntry.find({ class: cls, date: null }).sort({ period: 1 });
    const dateEntries = await ScheduleEntry.find({
      class: cls,
      date: { $gte: startStr, $lte: endStr },
    }).sort({ period: 1 });

    const patternByWeekday: Record<string, any[]> = {};
    pattern.forEach((e: any) => {
      (patternByWeekday[e.day] = patternByWeekday[e.day] || []).push(JSON.parse(JSON.stringify(e)));
    });
    const byDate: Record<string, any[]> = {};
    dateEntries.forEach((e: any) => {
      (byDate[e.date] = byDate[e.date] || []).push(JSON.parse(JSON.stringify(e)));
    });

    const daysInMonth = new Date(year, month, 0).getDate();
    const dates: Array<{ date: string; weekday: string; isOverride: boolean; entries: any[] }> = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = dateStrFor(year, month, d);
      const weekday = weekdayFor(dateStr);
      const specific = byDate[dateStr] || [];
      const effective = specific.length > 0 ? specific : patternByWeekday[weekday] || [];
      dates.push({ date: dateStr, weekday, isOverride: specific.length > 0, entries: effective });
    }
    return { success: true, dates };
  } catch (e: any) {
    return { success: false, error: e.message, dates: [] };
  }
}

export async function saveDateSchedule(className: string, dateStr: string, rows: any[]) {
  try {
    if (!(await requireAdminSession())) {
      return { success: false, error: "Only admins can modify schedules." };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return { success: false, error: "Select a valid date." };
    }
    await connectToDB();
    await ensureScheduleIndexes();
    const cls = String(className);
    const weekday = weekdayFor(dateStr);
    const entries: any[] = [];
    for (const row of rows) {
      const err = validateSchedulePayload({ ...row, class: cls, day: weekday });
      if (err) return { success: false, error: `Period ${row.period}: ${err}` };
      const { _id, ...clean } = row;
      entries.push({ ...clean, class: cls, day: weekday, date: dateStr });
    }
    const overlap = checkDayOverlap(entries);
    if (overlap) return { success: false, error: overlap };

    await ScheduleEntry.deleteMany({ class: cls, date: dateStr });
    if (entries.length > 0) {
      await ScheduleEntry.insertMany(entries);
    }
    revalidatePath("/list/schedules");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function resetDateSchedule(className: string, dateStr: string) {
  try {
    if (!(await requireAdminSession())) {
      return { success: false, error: "Only admins can modify schedules." };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return { success: false, error: "Select a valid date." };
    }
    await connectToDB();
    await ScheduleEntry.deleteMany({ class: String(className), date: dateStr });
    revalidatePath("/list/schedules");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}


