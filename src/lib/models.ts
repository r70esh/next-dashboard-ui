import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    teacherId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, unique: true },
    password: { type: String, required: true },
    photo: { type: String },
    phone: { type: String, required: true },
    subjects: { type: [String] },
    classes: { type: [String] },
    address: { type: String, required: true },
  },
  { timestamps: true }
);

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, unique: true },
    password: { type: String, required: true },
    photo: { type: String },
    phone: { type: String },
    grade: { type: Number, required: true },
    class: { type: String, required: true },
    address: { type: String, required: true },
  },
  { timestamps: true }
);

const parentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    students: { type: [String] },
    email: { type: String, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
  },
  { timestamps: true }
);

const adminSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    photo: { type: String },
  },
  { timestamps: true }
);

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  teachers: { type: [String] },
}, { timestamps: true });

const classSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  capacity: { type: Number, required: true },
  grade: { type: Number, required: true },
  supervisor: { type: String, required: true },
}, { timestamps: true });

const lessonSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  class: { type: String, required: true },
  teacher: { type: String, required: true },
}, { timestamps: true });

const examSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  class: { type: String, required: true },
  teacher: { type: String, required: true },
  date: { type: Date, required: true },
}, { timestamps: true });

const assignmentSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  class: { type: String, required: true },
  teacher: { type: String, required: true },
  dueDate: { type: Date, required: true },
}, { timestamps: true });

const resultSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  class: { type: String, required: true },
  teacher: { type: String, required: true },
  student: { type: String, required: true },
  type: { type: String, enum: ["assignment", "class_test", "terminal_exam"], required: true },
  date: { type: Date, required: true },
  score: { type: Number, required: true },
  maxScore: { type: Number, default: 100 },
}, { timestamps: true });

const attendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  student: { type: String, required: true },
  class: { type: String },
  status: { type: String, enum: ["present", "absent", "late"], required: true },
}, { timestamps: true });


const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  class: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
}, { timestamps: true });

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  class: { type: String, required: true },
  date: { type: Date, required: true },
}, { timestamps: true });

export const Teacher = mongoose.models.Teacher || mongoose.model("Teacher", teacherSchema);
export const Student = mongoose.models.Student || mongoose.model("Student", studentSchema);
export const Parent = mongoose.models.Parent || mongoose.model("Parent", parentSchema);
export const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);
export const Subject = mongoose.models.Subject || mongoose.model("Subject", subjectSchema);
export const Class = mongoose.models.Class || mongoose.model("Class", classSchema);
export const Lesson = mongoose.models.Lesson || mongoose.model("Lesson", lessonSchema);
export const Exam = mongoose.models.Exam || mongoose.model("Exam", examSchema);
export const Assignment = mongoose.models.Assignment || mongoose.model("Assignment", assignmentSchema);
export const Result = mongoose.models.Result || mongoose.model("Result", resultSchema);
export const Attendance = mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
export const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);
export const Announcement = mongoose.models.Announcement || mongoose.model("Announcement", announcementSchema);

