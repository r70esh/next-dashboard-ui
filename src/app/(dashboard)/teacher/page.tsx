import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalender";
import EventCalendar from "@/components/EventCalendar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDB from "@/lib/db";
import { Teacher, Student, Event as EventModel, Attendance } from "@/lib/models";
import Image from "next/image";
import Link from "next/link";

const TeacherPage = async () => {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  await connectToDB();
  const teacher = await Teacher.findOne({ email: userEmail });

  // Get students in this teacher's classes
  let students: any[] = [];
  if (teacher?.classes?.length > 0) {
    const rawStudents = await Student.find({ class: { $in: teacher.classes } });
    students = JSON.parse(JSON.stringify(rawStudents));
  }

  const rawEvents = await EventModel.find({});
  const events = JSON.parse(JSON.stringify(rawEvents)).map((e: any) => ({
    ...e,
    id: e._id,
    date: new Date(e.date).toISOString(),
    time: `${e.startTime} - ${e.endTime}`,
  }));

  return (
    <div className="flex-1 p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4">
        {/* WELCOME */}
        <div className="bg-mahankalSky rounded-md p-4 flex items-center gap-4">
          <Image src="/avatar.png" alt="" width={60} height={60} className="rounded-full" />
          <div>
            <h1 className="text-xl font-bold">Welcome, {teacher?.name || session?.user?.name || "Teacher"} 👋</h1>
            <p className="text-sm text-gray-600">
              Subjects: {teacher?.subjects?.join(", ") || "None"} · Classes: {teacher?.classes?.join(", ") || "None"}
            </p>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-md p-4 text-center">
            <h2 className="text-2xl font-bold text-purple-500">{teacher?.classes?.length || 0}</h2>
            <p className="text-xs text-gray-500 mt-1">Classes</p>
          </div>
          <div className="bg-white rounded-md p-4 text-center">
            <h2 className="text-2xl font-bold text-blue-500">{teacher?.subjects?.length || 0}</h2>
            <p className="text-xs text-gray-500 mt-1">Subjects</p>
          </div>
          <div className="bg-white rounded-md p-4 text-center">
            <h2 className="text-2xl font-bold text-green-500">{students.length}</h2>
            <p className="text-xs text-gray-500 mt-1">Students</p>
          </div>
        </div>

        {/* QUICK ATTENDANCE CTA */}
        <Link
          href="/list/attendance"
          className="flex items-center gap-4 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl p-4 hover:opacity-90 transition shadow-md"
        >
          <div className="text-3xl">📋</div>
          <div>
            <h3 className="font-extrabold text-lg">Take Class Attendance</h3>
            <p className="text-xs opacity-90">Mark present / absent for your class students</p>
          </div>
          <span className="ml-auto text-xl font-bold">→</span>
        </Link>

        {/* MY STUDENTS */}
        <div className="bg-white rounded-md p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">My Students</h2>
            <Link href="/list/students" className="text-xs text-mahankalSky hover:underline">View All</Link>
          </div>
          {students.length === 0 ? (
            <p className="text-gray-500 text-sm">No students assigned yet. Contact admin to assign classes.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Class</th>
                    <th className="pb-2">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {students.slice(0, 8).map((s: any) => (
                    <tr key={s._id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2 font-medium">{s.name}</td>
                      <td className="py-2">{s.class}</td>
                      <td className="py-2 text-gray-400">{s.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SCHEDULE */}
        <div className="h-full bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">My Schedule</h1>
          <BigCalendar />
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <EventCalendar events={events} />
        <Announcements />
      </div>
    </div>
  );
};

export default TeacherPage;
