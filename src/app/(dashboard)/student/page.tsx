import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalender";
import EventCalendar from "@/components/EventCalendar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDB from "@/lib/db";
import { Student, Result, Attendance } from "@/lib/models";
import Image from "next/image";

import { Event as EventModel } from "@/lib/models";

const StudentPage = async () => {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  await connectToDB();
  const student = await Student.findOne({ email: userEmail });

  let results: any[] = [];
  let attendanceSummary = { present: 0, absent: 0, late: 0, total: 0 };

  if (student) {
    const rawResults = await Result.find({ student: student.name });
    results = JSON.parse(JSON.stringify(rawResults));

    // Match by name OR studentId
    const rawAttendance = await Attendance.find({
      $or: [{ student: student.name }, { student: student.studentId }]
    });
    rawAttendance.forEach((a: any) => {
      attendanceSummary.total++;
      if (a.status === "present") attendanceSummary.present++;
      else if (a.status === "absent") attendanceSummary.absent++;
      else attendanceSummary.late++;
    });
  }


  const rawEvents = await EventModel.find({});
  const events = JSON.parse(JSON.stringify(rawEvents)).map((e: any) => ({
    ...e,
    id: e._id,
    date: new Date(e.date).toISOString(),
    time: `${e.startTime} - ${e.endTime}`,
  }));

  const attendancePercent = attendanceSummary.total > 0
    ? Math.round(((attendanceSummary.present + attendanceSummary.late) / attendanceSummary.total) * 100)
    : 100;

  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4">
        {/* WELCOME CARD */}
        <div className="bg-mahankalSky rounded-md p-4 flex items-center gap-4">
          <Image src="/avatar.png" alt="" width={60} height={60} className="rounded-full" />
          <div>
            <h1 className="text-xl font-bold">Welcome, {student?.name || session?.user?.name || "Student"} 👋</h1>
            <p className="text-sm text-gray-600">Grade {student?.grade} · Class {student?.class}</p>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-md p-4 text-center">
            <h2 className={`text-2xl font-bold ${attendancePercent >= 75 ? "text-green-500" : "text-red-500"}`}>{attendanceSummary.total > 0 ? attendancePercent + "%" : "N/A"}</h2>
            <p className="text-xs text-gray-500 mt-1">Attendance</p>
          </div>
          <div className="bg-white rounded-md p-4 text-center">
            <h2 className="text-2xl font-bold text-blue-500">{attendanceSummary.present}</h2>
            <p className="text-xs text-gray-500 mt-1">Days Present</p>
          </div>
          <div className="bg-white rounded-md p-4 text-center">
            <h2 className="text-2xl font-bold text-red-500">{attendanceSummary.absent}</h2>
            <p className="text-xs text-gray-500 mt-1">Days Absent</p>
          </div>
          <div className="bg-white rounded-md p-4 text-center">
            <h2 className="text-2xl font-bold text-purple-500">{results.length}</h2>
            <p className="text-xs text-gray-500 mt-1">Results</p>
          </div>
        </div>


        {/* RECENT RESULTS */}
        <div className="bg-white rounded-md p-4">
          <h2 className="text-lg font-semibold mb-3">My Recent Results</h2>
          {results.length === 0 ? (
            <p className="text-gray-500 text-sm">No results yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Subject</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Score</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 5).map((r) => (
                  <tr key={r._id} className="border-b last:border-0">
                    <td className="py-2">{r.subject}</td>
                    <td className="py-2 capitalize">{r.type}</td>
                    <td className="py-2">
                      <span className={`font-bold ${r.score >= 70 ? "text-green-600" : "text-red-500"}`}>
                        {r.score}
                      </span>
                    </td>
                    <td className="py-2">{new Date(r.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* SCHEDULE */}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold mb-2">My Schedule</h1>
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

export default StudentPage;
