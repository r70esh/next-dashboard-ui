import { NextResponse } from "next/server";
import connectToDB from "@/lib/db";
import { Admin, Teacher, Student, Parent } from "@/lib/models";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await connectToDB();
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Clear existing
    await Admin.deleteMany({});
    await Teacher.deleteMany({});
    await Student.deleteMany({});
    await Parent.deleteMany({});

    // 1. Create Admin
    await Admin.create({ email: "dulalrupesh31@gmail.com", password: hashedPassword });

    // 2. Create 3 Teachers
    const teachers = [];
    for (let i = 1; i <= 3; i++) {
      teachers.push({
        teacherId: `T${i}000`,
        name: `Teacher Name ${i}`,
        email: `teacher${i}@example.com`,
        password: hashedPassword,
        photo: "https://images.pexels.com/photos/2888150/pexels-photo-2888150.jpeg?auto=compress&cs=tinysrgb&w=1200",
        phone: `123456789${i}`,
        subjects: ["Math", "Science"],
        classes: ["1A", "2B"],
        address: `${i} Teacher St, City, Country`,
      });
    }
    await Teacher.insertMany(teachers);

    // 3. Create 20 Students
    const students = [];
    for (let i = 1; i <= 20; i++) {
      students.push({
        studentId: `S${i}000`,
        name: `Student Name ${i}`,
        email: `student${i}@example.com`,
        password: hashedPassword,
        photo: "https://images.pexels.com/photos/2888150/pexels-photo-2888150.jpeg?auto=compress&cs=tinysrgb&w=1200",
        phone: `987654321${i}`,
        grade: 5,
        class: "1A",
        address: `${i} Student Ave, City, Country`,
      });
    }
    await Student.insertMany(students);

    // 4. Create 120 Parents
    const parents = [];
    for (let i = 1; i <= 120; i++) {
      parents.push({
        name: `Parent Name ${i}`,
        students: [`Student Name ${(i % 20) + 1}`],
        email: `parent${i}@example.com`,
        password: hashedPassword,
        phone: `55555555${i}`,
        address: `${i} Parent Blvd, City, Country`,
      });
    }
    await Parent.insertMany(parents);

    return NextResponse.json({ message: "Seeding successful. All users have password: password123" });
  } catch (error: any) {
    console.error("Seeding error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
