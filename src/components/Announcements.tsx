import connectToDB from "@/lib/db";
import { Announcement, Event } from "@/lib/models";

const bgColors = ["bg-mahankalSkyLight", "bg-mahankalPurpleLight", "bg-mahankalYellowLight"];

const Announcements = async () => {
  await connectToDB();
  const rawAnnouncements = await Announcement.find({}).sort({ date: -1 }).limit(5);
  const rawEvents = await Event.find({}).sort({ date: -1 }).limit(5);

  const announcements = JSON.parse(JSON.stringify(rawAnnouncements)).map((a: any) => ({
    ...a,
    type: "announcement",
  }));

  const events = JSON.parse(JSON.stringify(rawEvents)).map((e: any) => ({
    ...e,
    id: e._id,
    type: "event",
    // We treat the event description or title + times as description
    description: e.description || `Time: ${e.startTime} - ${e.endTime}`,
  }));

  const combined = [...announcements, ...events]
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
                    {item.type}
                  </span>
                </h2>
                <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1 whitespace-nowrap">
                  {new Date(item.date).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Class: {item.class}</p>
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
