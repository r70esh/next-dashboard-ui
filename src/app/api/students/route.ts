import { NextResponse } from "next/server";
import connectToDB from "@/lib/db";
import { Student } from "@/lib/models";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const className = searchParams.get("class");
    const roll = searchParams.get("roll");
    const studentId = searchParams.get("studentId");

    await connectToDB();

    let query: any = {};

    if (studentId) {
      query = { studentId: { $regex: `^${escapeRegex(studentId.trim())}$`, $options: "i" } };
    } else if (roll) {
      const classNum = (className || "").replace(/\D/g, "");
      const rollRaw = roll.replace(/\D/g, "");
      const rollNum = String(Number(rollRaw) || 0);
      const candidates = new Set<string>();
      if (classNum && rollNum) {
        candidates.add(`c${classNum}${rollNum}`);
        for (let w = 1; w <= rollRaw.length; w++) {
          candidates.add(`c${classNum}${rollNum.padStart(w, "0")}`);
        }
      }
      if (candidates.size === 0) {
        return NextResponse.json({ students: [] });
      }
      const patterns = Array.from(candidates).map((id) => `^${escapeRegex(id)}$`);
      query = { studentId: { $regex: `^(?:${patterns.join("|")})$`, $options: "i" } };
    } else if (className) {
      query = { class: className };
    }

    const students = await Student.find(query).select("name studentId class grade _id").limit(50);
    const data = JSON.parse(JSON.stringify(students));
    return NextResponse.json({ students: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
