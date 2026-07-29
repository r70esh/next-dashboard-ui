const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const MONGODB_URI = "mongodb://dulalrupesh31_db_user:wHpyOX5HARD0JBmK@ac-pcdht8o-shard-00-00.3clqbjo.mongodb.net:27017,ac-pcdht8o-shard-00-01.3clqbjo.mongodb.net:27017,ac-pcdht8o-shard-00-02.3clqbjo.mongodb.net:27017/school_management?ssl=true&replicaSet=atlas-mfu5ns-shard-0&authSource=admin&retryWrites=true&w=majority";

const teacherSchema = new mongoose.Schema(
  {
    teacherId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, unique: true },
    password: { type: String, required: true },
    photo: { type: String },
    phone: { type: String, required: true },
    subjects: { type: [String] },
    classes: { type: [String] },
    address: { type: String, required: true },
  },
  { timestamps: true }
);

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, unique: true },
    password: { type: String, required: true },
    photo: { type: String },
    phone: { type: String },
    grade: { type: Number, required: true },
    class: { type: String, required: true },
    address: { type: String, required: true },
  },
  { timestamps: true }
);

const parentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    students: { type: [String] },
    email: { type: String, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
  },
  { timestamps: true }
);

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

const Teacher = mongoose.models.Teacher || mongoose.model("Teacher", teacherSchema);
const Student = mongoose.models.Student || mongoose.model("Student", studentSchema);
const Parent = mongoose.models.Parent || mongoose.model("Parent", parentSchema);
const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for seeding...");

    const hashedPassword = await bcrypt.hash("password123", 10);

    // Clear existing
    await Admin.deleteMany({});
    await Teacher.deleteMany({});
    await Student.deleteMany({});
    await Parent.deleteMany({});
    console.log("Cleared existing data.");

    // 1. Create Admin
    await Admin.create({ email: "dulalrupesh31@gmail.com", password: hashedPassword });
    console.log("Admin seeded.");

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
    console.log("Teachers seeded.");

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
    console.log("Students seeded.");

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
    console.log("Parents seeded.");

    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seed();
