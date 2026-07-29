import { NextResponse } from "next/server";
import connectToDB from "@/lib/db";
import { Student } from "@/lib/models";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const className = searchParams.get("class");

    await connectToDB();
    const query = className ? { class: className } : {};
    const students = await Student.find(query).select("name studentId class grade _id");
    const data = JSON.parse(JSON.stringify(students));
    return NextResponse.json({ students: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
