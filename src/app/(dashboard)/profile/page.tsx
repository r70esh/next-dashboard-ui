import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDB from "@/lib/db";
import { Admin, Teacher, Student, Parent } from "@/lib/models";
import Image from "next/image";
import { redirect } from "next/navigation";
import ProfileEditForm from "@/components/ProfileEditForm";
import BigCalendar from "@/components/BigCalender";
import Announcements from "@/components/Announcements";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/sign-in");
  }

  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const userEmail = session.user.email;

  await connectToDB();

  let userData: any = null;

  if (role === "admin") {
    userData = await Admin.findOne({ _id: userId }) || await Admin.findOne({ email: userEmail });
  } else if (role === "teacher") {
    userData = await Teacher.findOne({ _id: userId }) || await Teacher.findOne({ email: userEmail });
  } else if (role === "student") {
    userData = await Student.findOne({ _id: userId }) || await Student.findOne({ email: userEmail });
  } else if (role === "parent") {
    userData = await Parent.findOne({ _id: userId }) || await Parent.findOne({ email: userEmail });
  }

  if (!userData) {
    return (
      <div className="p-6 text-center text-red-500 font-semibold">
        User profile not found.
      </div>
    );
  }

  const plainId = userData._id.toString();
  const name = userData.name || "Admin User";
  const email = userData.email || "";
  const phone = userData.phone || "N/A";
  const photo = userData.photo || "/avatar.png";
  const address = userData.address || "N/A";

  // Role specific fields
  const studentClass = role === "student" ? (userData.class || "N/A") : null;
  const teacherClasses = role === "teacher" ? (userData.classes && userData.classes.length > 0 ? userData.classes : ["N/A"]) : null;

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* TOP / PROFILE CARD */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="bg-mahankalSky py-6 px-6 rounded-2xl flex-1 flex flex-col sm:flex-row gap-6 shadow-sm border border-sky-100">
            <div className="w-32 h-32 relative rounded-full overflow-hidden shrink-0 border-4 border-white shadow-sm">
              <Image
                src={photo}
                alt={name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-800">{name}</h1>
                  <span className="bg-sky-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {role}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {role === "student" && `Enrolled Student • ID: ${userData.studentId || plainId}`}
                  {role === "teacher" && `Faculty Member • ID: ${userData.teacherId || plainId}`}
                  {role === "parent" && `Parent / Guardian`}
                  {role === "admin" && `System Administrator`}
                </p>
              </div>

              {/* Class display requirement */}
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-700 bg-white/70 p-3 rounded-xl border border-sky-100">
                <div className="flex items-center gap-2">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span>{email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span>{phone}</span>
                </div>

                {/* Show Class for Student */}
                {role === "student" && (
                  <div className="flex items-center gap-2 bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200">
                    <span className="font-bold">Class:</span>
                    <span>{studentClass}</span>
                  </div>
                )}

                {/* Show Teaching Classes for Teacher */}
                {role === "teacher" && (
                  <div className="flex items-center gap-2 bg-purple-100 text-purple-900 px-2.5 py-1 rounded-lg border border-purple-200">
                    <span className="font-bold">Teaching Classes:</span>
                    <span>{teacherClasses ? teacherClasses.join(", ") : "None"}</span>
                  </div>
                )}
              </div>

              {/* Edit Profile Form */}
              <ProfileEditForm
                id={plainId}
                role={role}
                initialName={userData.name || ""}
                initialPhone={userData.phone || ""}
                initialAddress={userData.address || ""}
              />
            </div>
          </div>
        </div>

        {/* BOTTOM SCHEDULE */}
        <div className="mt-4 bg-white rounded-2xl p-4 h-[750px] shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-2">My Schedule</h2>
          <BigCalendar />
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-3">Profile Info</h2>
          <div className="flex flex-col gap-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Address</span>
              <span className="font-bold text-slate-700 text-right">{address}</span>
            </div>
            {role === "student" && (
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Grade</span>
                <span className="font-bold text-slate-700">{userData.grade || "N/A"}</span>
              </div>
            )}
            {role === "teacher" && (
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Subjects</span>
                <span className="font-bold text-slate-700">{userData.subjects ? userData.subjects.join(", ") : "N/A"}</span>
              </div>
            )}
          </div>
        </div>
        <Announcements />
      </div>
    </div>
  );
}
