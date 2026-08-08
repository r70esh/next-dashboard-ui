"use server";

import connectToDB from "@/lib/db";
import { Teacher, Student, Parent, Admin, Subject, Class, Lesson, Exam, Assignment, Result, Attendance, Event, Announcement } from "@/lib/models";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

// ── TEACHER ──────────────────────────────────────────────────────────────────
export async function createTeacher(data: any) {
  try {
    if (!data.name || !data.email || !data.password || !data.phone || !data.address) {
      return { success: false, error: "Name, email, password, phone, and address are required." };
    }
    await connectToDB();
    const hashed = await bcrypt.hash(data.password, 10);
    const count = await Teacher.countDocuments();
    await Teacher.create({
      teacherId: `T${Date.now()}`,
      name: data.name,
      email: data.email,
      password: hashed,
      phone: data.phone,
      address: data.address,
      subjects: data.subjects ? data.subjects.split(",").map((s: string) => s.trim()) : [],
      classes: [],
    });
    revalidatePath("/list/teachers");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
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
      subjects: data.subjects ? data.subjects.split(",").map((s: string) => s.trim()) : [],
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
      grade: parseInt(data.grade) || 1,
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
      grade: parseInt(data.grade) || 1,
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
      students: data.students ? data.students.split(",").map((s: string) => s.trim()) : [],
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
      students: data.students ? data.students.split(",").map((s: string) => s.trim()) : [],
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
    await Subject.create({ name: data.name, teachers: data.teachers ? data.teachers.split(",").map((s:string)=>s.trim()) : [] });
    revalidatePath("/list/subjects");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}

export async function updateSubject(id: string, data: any) {
  try {
    await connectToDB();
    await Subject.findByIdAndUpdate(id, {
      name: data.name,
      teachers: data.teachers ? data.teachers.split(",").map((s:string)=>s.trim()) : [],
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

// ── CLASS ─────────────────────────────────────────────────────────────────────
export async function createClass(data: any) {
  try {
    await connectToDB();
    await Class.create({ name: data.name, capacity: parseInt(data.capacity), grade: parseInt(data.grade), supervisor: data.supervisor });
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
      grade: parseInt(data.grade),
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

// ── EXAM ──────────────────────────────────────────────────────────────────────
export async function createExam(data: any) {
  try {
    await connectToDB();
    await Exam.create({ subject: data.subject, class: data.class, teacher: data.teacher, date: new Date(data.date) });
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
    await Exam.findByIdAndUpdate(id, {
      subject: data.subject,
      class: data.class,
      teacher: data.teacher,
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
    await Assignment.create({ subject: data.subject, class: data.class, teacher: data.teacher, dueDate: new Date(data.dueDate) });
    revalidatePath("/list/assignments");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}
export async function updateAssignment(id: string, data: any) {
  try {
    await connectToDB();
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
    await Attendance.create({ student: data.student, date: new Date(), status: data.status });
    revalidatePath("/list/attendance");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}
export async function updateAttendance(id: string, data: any) {
  try {
    await connectToDB();
    await Attendance.findByIdAndUpdate(id, { status: data.status });
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
    await Lesson.findByIdAndUpdate(id, {
      subject: data.subject,
      class: data.class,
      teacher: data.teacher,
    });
    revalidatePath("/list/lessons");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
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
    revalidatePath("/list/students");
    revalidatePath("/list/teachers");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function changeUserPassword(email: string, newPassword: string) {
  try {
    await connectToDB();
    if (!email || !newPassword) {
      return { success: false, error: "Email and new password are required." };
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    
    let updated = await Admin.findOneAndUpdate({ email }, { password: hashed });
    if (!updated) updated = await Teacher.findOneAndUpdate({ email }, { password: hashed });
    if (!updated) updated = await Student.findOneAndUpdate({ email }, { password: hashed });
    if (!updated) updated = await Parent.findOneAndUpdate({ email }, { password: hashed });

    if (!updated) {
      return { success: false, error: "User with this email was not found." };
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── CLASS BULK ATTENDANCE ───────────────────────────────────────────────────
export async function getClassStudentsAndAttendance(className: string, dateStr: string) {
  try {
    await connectToDB();
    if (!className) return { success: false, students: [] };

    // Fetch students in this class
    const students = await Student.find({ class: className }).sort({ name: 1 });
    
    // Parse target date boundaries (start of day to end of day)
    const targetDate = new Date(dateStr);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Fetch existing attendance records for this date
    const existingRecords = await Attendance.find({
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

export async function bulkSaveAttendance(className: string, dateStr: string, records: Array<{ name: string; studentId: string; status: "present" | "absent" | "late" }>) {
  try {
    await connectToDB();
    if (!className || !dateStr || !records || records.length === 0) {
      return { success: false, error: "Class, date, and student records are required." };
    }

    const startOfDay = new Date(new Date(dateStr).setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(dateStr).setHours(23, 59, 59, 999));

    // Capture the exact current time for this attendance record
    const exactNow = new Date();

    for (const item of records) {
      // Find existing attendance for this student on this day
      const existing = await Attendance.findOne({
        student: item.name,
        date: { $gte: startOfDay, $lte: endOfDay }
      }) || await Attendance.findOne({
        student: item.studentId,
        date: { $gte: startOfDay, $lte: endOfDay }
      });

      if (existing) {
        existing.status = item.status;
        existing.class = className;
        // Update the timestamp to the latest submission time
        existing.date = exactNow;
        await existing.save();
      } else {
        await Attendance.create({
          date: exactNow,
          student: item.name,
          class: className,
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


