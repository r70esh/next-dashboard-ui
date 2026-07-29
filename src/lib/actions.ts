"use server";

import connectToDB from "@/lib/db";
import { Teacher, Student, Parent, Admin, Subject, Class, Lesson, Exam, Assignment, Result, Attendance, Event, Announcement } from "@/lib/models";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

// ── TEACHER ──────────────────────────────────────────────────────────────────
export async function createTeacher(data: any) {
  try {
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
    await Result.create({ subject: data.subject, class: data.class, teacher: data.teacher, student: data.student, type: data.type, date: new Date(data.date), score: parseInt(data.score) });
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
    });
    revalidatePath("/list/results");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}


// ── ATTENDANCE ────────────────────────────────────────────────────────────────
export async function createAttendance(data: any) {
  try {
    await connectToDB();
    await Attendance.create({ student: data.student, date: new Date(data.date), status: data.status });
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

