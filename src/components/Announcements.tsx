import connectToDB from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Announcement, Event, Exam, Assignment, Student, Parent, Teacher } from "@/lib/models";

const bgColors = ["bg-mahankalSkyLight", "bg-mahankalPurpleLight", "bg-mahankalYellowLight"];

function normClass(cls: string): string {
  return (cls || "").replace(/[^0-9]/g, "");
}

// Does this record's class match any of the allowed (normalised) class numbers?
function inScope(itemClass: string, allowed: string[] | null): boolean {
  if (!allowed) return true; // admin sees everything
  const n = normClass(itemClass);
  if (!n) return true; // records without a class are visible to all
  return allowed.includes(n);
}

// Returns the normalised class numbers the user should see, or null = all.
async function getAllowedClasses(session: any): Promise<string[] | null> {
  const role = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;
  const email = session?.user?.email;
  if (role === "admin") return null;

  if (role === "teacher") {
    const teacher = await Teacher.findOne({ $or: [{ _id: userId }, { email }] });
    const classes = (teacher?.classes || []).map(normClass).filter(Boolean);
    return classes.length > 0 ? classes : null;
  }

  if (role === "student") {
    const student = await Student.findOne({ $or: [{ _id: userId }, { email }] });
    const n = student?.class ? normClass(student.class) : "";
    return n ? [n] : ["__none__"];
  }

  if (role === "parent") {
    const parent = await Parent.findOne({ $or: [{ _id: userId }, { email }] });
    if (parent?.students?.length > 0) {
      const children = await Student.find({
        $or: [
          { name: { $in: parent.students } },
          { studentId: { $in: parent.students } },
          { email: { $in: parent.students } },
        ],
      }).select("class");
      const levels = Array.from(
        new Set(children.map((c: any) => normClass(c.class)).filter(Boolean))
      );
      return levels.length > 0 ? levels : ["__none__"];
    }
    return ["__none__"];
  }

  return null;
}

const Announcements = async () => {
  const session = await getServerSession(authOptions);
  await connectToDB();
  const allowed = await getAllowedClasses(session);

  const rawAnnouncements = await Announcement.find({}).sort({ date: -1 }).limit(10);
  const rawEvents = await Event.find({}).sort({ date: -1 }).limit(10);
  const rawExams = await Exam.find({}).sort({ date: -1 }).limit(10);
  const rawAssignments = await Assignment.find({}).sort({ dueDate: -1 }).limit(10);

  const announcements = JSON.parse(JSON.stringify(rawAnnouncements))
    .filter((a: any) => inScope(a.class, allowed))
    .map((a: any) => ({ ...a, type: "announcement", badge: "Announcement" }));

  const events = JSON.parse(JSON.stringify(rawEvents))
    .filter((e: any) => inScope(e.class, allowed))
    .map((e: any) => ({
      ...e,
      id: e._id,
      type: "event",
      badge: "Event",
      description: e.description || `Time: ${e.startTime} - ${e.endTime}`,
    }));

  const exams = JSON.parse(JSON.stringify(rawExams))
    .filter((e: any) => inScope(e.class, allowed))
    .map((e: any) => ({
      ...e,
      id: e._id,
      title: `${e.subject} — ${e.type === "terminal_exam" ? "Terminal Exam" : "Class Test"}`,
      type: "exam",
      badge: e.type === "terminal_exam" ? "Terminal Exam" : "Class Test",
      description: `Scheduled by ${e.teacher || "the school"} for Class ${normClass(e.class) || e.class}.`,
    }));

  const assignments = JSON.parse(JSON.stringify(rawAssignments))
    .filter((a: any) => inScope(a.class, allowed))
    .map((a: any) => ({
      ...a,
      id: a._id,
      title: `Assignment: ${a.subject}`,
      date: a.dueDate,
      type: "assignment",
      badge: "Assignment",
      description: `Assigned by ${a.teacher || "the school"} for Class ${normClass(a.class) || a.class}. Due ${new Date(a.dueDate).toLocaleDateString()}.`,
    }));

  const combined = [...announcements, ...events, ...exams, ...assignments]
    .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="bg-white p-4 rounded-md">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Announcements & Events</h1>
        <span className="text-xs text-gray-400">View All</span>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        {combined.length === 0 ? (
          <p className="text-gray-500 text-sm">No announcements or events yet.</p>
        ) : (
          combined.map((item: any, i: number) => (
            <div key={item._id} className={`${bgColors[i % bgColors.length]} rounded-md p-4`}>
              <div className="flex items-center justify-between">
                <h2 className="font-medium flex items-center gap-2">
                  <span>{item.title}</span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white text-gray-600 border border-gray-200">
                    {item.badge}
                  </span>
                </h2>
                <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1 whitespace-nowrap">
                  {new Date(item.date).toLocaleDateString()}
                </span>
              </div>
              {item.class && (
                <p className="text-xs text-gray-500 mt-1">Class: {normClass(item.class) || item.class}</p>
              )}
              {item.description && (
                <p className="text-sm text-gray-700 mt-2 line-clamp-2">{item.description}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Announcements;
