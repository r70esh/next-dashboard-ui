import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminScheduleManager from "@/components/schedule/AdminScheduleManager";
import StudentSchedule from "@/components/schedule/StudentSchedule";
import ParentSchedule from "@/components/schedule/ParentSchedule";
import TeacherScheduleViewer from "@/components/schedule/TeacherScheduleViewer";

const SchedulesPage = async () => {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role || "admin";

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <h1 className="text-lg font-semibold mb-4">Schedules</h1>

      {role === "admin" && <AdminScheduleManager />}
      {role === "teacher" && <TeacherScheduleViewer />}
      {role === "student" && <StudentSchedule />}
      {role === "parent" && <ParentSchedule />}
    </div>
  );
};

export default SchedulesPage;
