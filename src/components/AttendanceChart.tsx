import connectToDB from "@/lib/db";
import { Attendance } from "@/lib/models";
import AttendanceChartClient from "./AttendanceChartClient";

const AttendanceChart = async () => {
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

  const data = ["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => ({
    name: day,
    present: dayStats[day].present || 0,
    absent: dayStats[day].absent || 0,
  }));

  return <AttendanceChartClient data={data} />;
};

export default AttendanceChart;
