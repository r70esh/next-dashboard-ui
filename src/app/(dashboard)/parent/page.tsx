import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalender";
import EventCalendar from "@/components/EventCalendar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDB from "@/lib/db";
import { Parent, Student, Result, Attendance, Event as EventModel } from "@/lib/models";
import Image from "next/image";

const bgList = ["bg-lamaSkyLight", "bg-lamaPurpleLight", "bg-lamaYellowLight", "bg-pink-50"];

const ParentPage = async () => {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  await connectToDB();
  const parent = await Parent.findOne({ email: userEmail });

  const childrenNames: string[] = parent?.students || [];
  const children = await Student.find({ name: { $in: childrenNames } });

  const rawEvents = await EventModel.find({});
  const events = JSON.parse(JSON.stringify(rawEvents)).map((e: any) => ({
    ...e,
    id: e._id,
    date: new Date(e.date).toISOString(),
    time: `${e.startTime} - ${e.endTime}`,
  }));

  // Build per-child stats
  const childData = await Promise.all(
    children.map(async (child: any) => {
      const results = await Result.find({ student: child.name }).sort({ date: -1 });
      const attendance = await Attendance.find({ student: child.studentId });

      let present = 0;
      let absent = 0;
      let late = 0;
      attendance.forEach((a: any) => {
        if (a.status === "present") present++;
        else if (a.status === "absent") absent++;
        else late++;
      });
      const total = attendance.length;
      const percent = total > 0 ? Math.round((present / total) * 100) : 0;

      return {
        child: JSON.parse(JSON.stringify(child)),
        results: JSON.parse(JSON.stringify(results)),
        attendance: { present, absent, late, total, percent },
      };
    })
  );

  return (
    <div className="flex-1 p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4">

        {/* WELCOME */}
        <div className="bg-lamaYellow rounded-xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-2xl shadow">
            👨‍👩‍👧
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Welcome, {parent?.name || session?.user?.name || "Parent"} 👋
            </h1>
            <p className="text-sm text-gray-600">
              Monitoring {children.length} child{children.length !== 1 ? "ren" : ""}
            </p>
          </div>
        </div>

        {/* NO CHILDREN */}
        {childData.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-gray-400 text-4xl mb-3">🔗</p>
            <h2 className="font-semibold text-gray-700 mb-1">No children linked</h2>
            <p className="text-sm text-gray-500">
              Please contact the school administrator to link your child&apos;s account to your profile.
            </p>
          </div>
        )}

        {/* EACH CHILD CARD */}
        {childData.map(({ child, results, attendance }, idx) => (
          <div key={child._id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
            {/* Child header */}
            <div className={`${bgList[idx % bgList.length]} p-4 flex items-center gap-3`}>
              <Image
                src={child.photo || "/avatar.png"}
                alt=""
                width={48}
                height={48}
                className="rounded-full object-cover w-12 h-12 border-2 border-white shadow"
              />
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-800">{child.name}</h2>
                <p className="text-sm text-gray-600">Grade {child.grade} · Class {child.class}</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
              <div className="p-3 text-center">
                <p className={`text-xl font-bold ${attendance.percent >= 70 ? "text-green-600" : "text-red-500"}`}>
                  {attendance.percent}%
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">Attendance</p>
              </div>
              <div className="p-3 text-center">
                <p className="text-xl font-bold text-green-500">{attendance.present}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Present</p>
              </div>
              <div className="p-3 text-center">
                <p className="text-xl font-bold text-red-500">{attendance.absent}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Absent</p>
              </div>
              <div className="p-3 text-center">
                <p className="text-xl font-bold text-purple-500">{results.length}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Results</p>
              </div>
            </div>

            {/* Results table */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Results</h3>
              {results.length === 0 ? (
                <p className="text-gray-400 text-sm">No results recorded yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 text-xs border-b">
                      <th className="pb-2 font-medium">Subject</th>
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium">Score</th>
                      <th className="pb-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.slice(0, 5).map((r: any) => (
                      <tr key={r._id} className="border-b last:border-0">
                        <td className="py-2">{r.subject}</td>
                        <td className="py-2 capitalize text-gray-500">{r.type}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            r.score >= 80 ? "bg-green-100 text-green-700"
                            : r.score >= 50 ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                          }`}>
                            {r.score}
                          </span>
                        </td>
                        <td className="py-2 text-gray-400 text-xs">{new Date(r.date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ))}

        {/* Schedule */}
        <div className="bg-white p-4 rounded-xl">
          <h1 className="text-xl font-semibold mb-2">School Schedule</h1>
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

export default ParentPage;
