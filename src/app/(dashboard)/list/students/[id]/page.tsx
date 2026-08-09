import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalender";
import Image from "next/image";
import Link from "next/link";
import connectToDB from "@/lib/db";
import { Student, Attendance as AttendanceModel, Parent } from "@/lib/models";
import ProfileEditForm from "@/components/ProfileEditForm";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStudentPerformance } from "@/lib/actions";
import StudentPerformanceCard from "@/components/StudentPerformanceCard";
import Performance from "@/components/Performance";

const SingleStudentPage = async ({ params }: { params: { id: string } }) => {
  await connectToDB();

  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role || "admin";
  const userId = (session?.user as any)?.id;
  const userEmail = session?.user?.email;

  let student: any = null;
  try {
    if (params.id.match(/^[0-9a-fA-F]{24}$/)) {
      student = await Student.findById(params.id);
    }
    if (!student) {
      student = await Student.findOne({ studentId: params.id });
    }
  } catch (e) {
    console.error(e);
  }

  if (!student) {
    return notFound();
  }

  const plainId = student._id.toString();

  // ── ACCESS CONTROL for performance ──────────────────────────────────────────
  // Admin: always can see
  // Student: only their own
  // Parent: only if this student is their child
  // Teacher: cannot see individual performance
  let canSeePerformance = false;

  if (role === "admin") {
    canSeePerformance = true;
  } else if (role === "student") {
    // Student sees only their own performance
    const selfStudent = await Student.findOne({ $or: [{ _id: userId }, { email: userEmail }] });
    canSeePerformance = selfStudent?._id.toString() === plainId;
  } else if (role === "parent") {
    // Parent sees only their children's performance
    const parentObj = await Parent.findOne({ $or: [{ _id: userId }, { email: userEmail }] });
    if (parentObj?.students) {
      canSeePerformance = parentObj.students.some(
        (s: string) => s === student.name || s === student.studentId || s === student.email
      );
    }
  }

  // ── Attendance % ────────────────────────────────────────────────────────────
  const attendanceRecords = await AttendanceModel.find({
    $or: [{ student: student.name }, { student: student.studentId }]
  });
  let attendancePercent = 100;
  if (attendanceRecords.length > 0) {
    const presentCount = attendanceRecords.filter(
      (r: any) => r.status === "present" || r.status === "late"
    ).length;
    attendancePercent = Math.round((presentCount / attendanceRecords.length) * 100);
  }

  // ── Full performance (only if allowed) ──────────────────────────────────────
  let perfData: any = null;
  if (canSeePerformance) {
    const perfResult = await getStudentPerformance(student.name, student.studentId);
    if (perfResult.success) {
      perfData = perfResult;
    }
  }

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* TOP */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* USER INFO CARD */}
          <div className="bg-mahankalSky py-6 px-4 rounded-md flex-1 flex gap-4">
            <div className="w-1/3">
              <Image
                src={student.photo || "https://images.pexels.com/photos/5414817/pexels-photo-5414817.jpeg?auto=compress&cs=tinysrgb&w=1200"}
                alt={student.name}
                width={144}
                height={144}
                className="w-36 h-36 rounded-full object-cover"
              />
            </div>
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold">{student.name}</h1>
                <p className="text-sm text-gray-500">Student ID: {student.studentId}</p>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full flex items-center gap-2">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span>{student.email}</span>
                </div>
                <div className="w-full flex items-center gap-2">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span>{student.phone || "N/A"}</span>
                </div>
                <div className="w-full flex items-center gap-2 mt-1">
                  <span className="bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded text-xs">
                    Class: {student.class}
                  </span>
                </div>
              </div>

              {/* Edit name & phone - allowed for admin and the student themselves */}
              {(role === "admin" || (role === "student" && canSeePerformance)) && (
                <ProfileEditForm
                  id={plainId}
                  role="student"
                  initialName={student.name}
                  initialPhone={student.phone || ""}
                  initialAddress={student.address || ""}
                />
              )}
            </div>
          </div>
          {/* SMALL CARDS */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image src="/singleAttendance.png" alt="" width={24} height={24} className="w-6 h-6" />
              <div>
                <h1 className={`text-xl font-semibold ${attendancePercent >= 75 ? "text-green-600" : "text-red-500"}`}>
                  {attendanceRecords.length > 0 ? attendancePercent + "%" : "N/A"}
                </h1>
                <span className="text-sm text-gray-400">Attendance</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image src="/singleLesson.png" alt="" width={24} height={24} className="w-6 h-6" />
              <div>
                <h1 className="text-xl font-semibold">18</h1>
                <span className="text-sm text-gray-400">Lessons</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image src="/singleClass.png" alt="" width={24} height={24} className="w-6 h-6" />
              <div>
                <h1 className="text-xl font-semibold">{student.class}</h1>
                <span className="text-sm text-gray-400">Class</span>
              </div>
            </div>
            {canSeePerformance && perfData && (
              <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
                <span className="text-2xl">🏆</span>
                <div>
                  <h1 className={`text-xl font-semibold ${gradeTextColor(perfData.grade)}`}>
                    {perfData.grade}
                  </h1>
                  <span className="text-sm text-gray-400">Grade</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PERFORMANCE CARD — private to student / parent / admin */}
        {canSeePerformance && perfData ? (
          <div className="mt-4">
            <StudentPerformanceCard perf={perfData} />
          </div>
        ) : role === "teacher" ? (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 font-medium">
            📋 Individual student performance details are private to the student, their parent, and admin.
          </div>
        ) : null}

        {/* SCHEDULE */}
        <div className="mt-4 bg-white rounded-md p-4 h-[800px]">
          <h1>Student&apos;s Schedule</h1>
          <BigCalendar />
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Shortcuts</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
            <Link className="p-3 rounded-md bg-mahankalSkyLight" href="/list/lessons">Student&apos;s Lessons</Link>
            <Link className="p-3 rounded-md bg-mahankalPurpleLight" href="/list/teachers">Student&apos;s Teachers</Link>
            <Link className="p-3 rounded-md bg-pink-50" href="/list/exams">Student&apos;s Exams</Link>
            <Link className="p-3 rounded-md bg-mahankalSkyLight" href="/list/assignments">Student&apos;s Assignments</Link>
            <Link className="p-3 rounded-md bg-mahankalYellowLight" href="/list/results">Student&apos;s Results</Link>
          </div>
        </div>
        <Performance attendancePercent={attendancePercent} />
        <Announcements />
      </div>
    </div>
  );
};

function gradeTextColor(grade: string) {
  if (grade === "A+" || grade === "A") return "text-green-600";
  if (grade === "B+" || grade === "B") return "text-sky-600";
  if (grade === "C") return "text-amber-600";
  if (grade === "D") return "text-orange-600";
  return "text-red-600";
}

export default SingleStudentPage;
