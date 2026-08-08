import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalender";
import Performance from "@/components/Performance";
import Image from "next/image";
import Link from "next/link";
import connectToDB from "@/lib/db";
import { Teacher } from "@/lib/models";
import ProfileEditForm from "@/components/ProfileEditForm";
import { notFound } from "next/navigation";

const SingleTeacherPage = async ({ params }: { params: { id: string } }) => {
  await connectToDB();

  let teacher: any = null;
  try {
    if (params.id.match(/^[0-9a-fA-F]{24}$/)) {
      teacher = await Teacher.findById(params.id);
    }
    if (!teacher) {
      teacher = await Teacher.findOne({ teacherId: params.id });
    }
  } catch (e) {
    console.error(e);
  }

  if (!teacher) {
    return notFound();
  }

  const plainId = teacher._id.toString();
  const teachingClasses = teacher.classes && teacher.classes.length > 0 ? teacher.classes.join(", ") : "None";

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
                src={teacher.photo || "https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=1200"}
                alt={teacher.name}
                width={144}
                height={144}
                className="w-36 h-36 rounded-full object-cover"
              />
            </div>
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold">{teacher.name}</h1>
                <p className="text-sm text-gray-500">Teacher ID: {teacher.teacherId}</p>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full flex items-center gap-2">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span>{teacher.email}</span>
                </div>
                <div className="w-full flex items-center gap-2">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span>{teacher.phone}</span>
                </div>
                {/* TEACHING CLASSES DISPLAY */}
                <div className="w-full flex items-center gap-2 mt-1">
                  <span className="bg-purple-200 text-purple-900 font-bold px-2.5 py-1 rounded text-xs">
                    Teaching Classes: {teachingClasses}
                  </span>
                </div>
              </div>

              {/* Edit name & phone */}
              <ProfileEditForm
                id={plainId}
                role="teacher"
                initialName={teacher.name}
                initialPhone={teacher.phone}
                initialAddress={teacher.address || ""}
              />
            </div>
          </div>
          {/* SMALL CARDS */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image src="/singleAttendance.png" alt="" width={24} height={24} className="w-6 h-6" />
              <div>
                <h1 className="text-xl font-semibold">90%</h1>
                <span className="text-sm text-gray-400">Attendance</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image src="/singleBranch.png" alt="" width={24} height={24} className="w-6 h-6" />
              <div>
                <h1 className="text-xl font-semibold">{teacher.subjects?.length || 0}</h1>
                <span className="text-sm text-gray-400">Subjects</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image src="/singleClass.png" alt="" width={24} height={24} className="w-6 h-6" />
              <div>
                <h1 className="text-xl font-semibold">{teacher.classes?.length || 0}</h1>
                <span className="text-sm text-gray-400">Classes</span>
              </div>
            </div>
          </div>
        </div>
        {/* BOTTOM */}
        <div className="mt-4 bg-white rounded-md p-4 h-[800px]">
          <h1>Teacher&apos;s Schedule</h1>
          <BigCalendar />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Shortcuts</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
            <Link className="p-3 rounded-md bg-mahankalSkyLight" href="/list/classes">Teacher&apos;s Classes</Link>
            <Link className="p-3 rounded-md bg-mahankalPurpleLight" href="/list/students">Teacher&apos;s Students</Link>
            <Link className="p-3 rounded-md bg-mahankalYellowLight" href="/list/lessons">Teacher&apos;s Lessons</Link>
            <Link className="p-3 rounded-md bg-pink-50" href="/list/exams">Teacher&apos;s Exams</Link>
            <Link className="p-3 rounded-md bg-mahankalSkyLight" href="/list/assignments">Teacher&apos;s Assignments</Link>
          </div>
        </div>
        <Performance />
        <Announcements />
      </div>
    </div>
  );
};

export default SingleTeacherPage;
