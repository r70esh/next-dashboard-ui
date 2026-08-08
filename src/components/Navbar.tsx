import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDB from "@/lib/db";
import { Admin, Teacher, Student, Parent } from "@/lib/models";

const Navbar = async () => {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  // Always fetch the latest profile info from the DB so edits show
  // everywhere immediately (session name is only refreshed on re-login).
  let displayName = user?.name || "Unknown";
  if (user?.id && user?.role) {
    try {
      await connectToDB();
      let doc: any = null;
      if (user.role === "admin") doc = await Admin.findById(user.id);
      else if (user.role === "teacher") doc = await Teacher.findById(user.id);
      else if (user.role === "student") doc = await Student.findById(user.id);
      else if (user.role === "parent") doc = await Parent.findById(user.id);
      if (doc?.name) displayName = doc.name;
    } catch {}
  }

  return (
    <div className='flex items-center justify-between p-4'>
      {/* SEARCH BAR */}
      <div className='hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2'>
        <Image src="/search.png" alt="" width={14} height={14}/>
        <input type="text" placeholder="Search..." className="w-[200px] p-2 bg-transparent outline-none"/>
      </div>
      {/* ICONS AND USER */}
      <div className='flex items-center gap-6 justify-end w-full'>
        <div className='bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer'>
          <Image src="/message.png" alt="" width={20} height={20}/>
        </div>
        <div className='bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative'>
          <Image src="/announcement.png" alt="" width={20} height={20}/>
          <div className='absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-purple-500 text-white rounded-full text-xs'>1</div>
        </div>
        <Link href="/profile" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition">
          <div className='flex flex-col'>
            <span className="text-xs leading-3 font-medium">{displayName}</span>
            <span className="text-[10px] text-gray-500 text-right capitalize">{user?.role || "Guest"}</span>
          </div>
          <Image src="/avatar.png" alt="" width={36} height={36} className="rounded-full"/>
        </Link>
      </div>
    </div>
  )
}

export default Navbar;