import { NextResponse } from "next/server";
import connectToDB from "@/lib/db";
import { Admin, Teacher, Student, Parent, LessonPlan } from "@/lib/models";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await connectToDB();
    const hashedPassword = await bcrypt.hash("password123", 10);
    const hashedAdminPassword = await bcrypt.hash(":r70esh.d", 10);

    // Clear existing
    await Admin.deleteMany({});
    await Teacher.deleteMany({});
    await Student.deleteMany({});
    await Parent.deleteMany({});
    await LessonPlan.deleteMany({});

    // 1. Create Admin
    await Admin.create({ email: "dulalrupesh31@gmail.com", password: hashedAdminPassword });

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
    const createdTeachers = await Teacher.insertMany(teachers);
    const teacherRefs = createdTeachers.map((t) => ({
      ownerId: t._id.toString(),
      ownerName: t.name,
    }));

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

    // 5. Create sample Lesson Plans (2 per teacher)
    const planTemplates = [
      {
        subject: "Math",
        topic: "Fractions: Addition and Subtraction",
        objectives: [
          "Students will be able to add fractions with like denominators.",
          "Students will be able to subtract fractions with like denominators.",
          "Students will be able to solve real-life word problems involving fractions.",
        ],
        resources: ["Whiteboard", "Fraction strips", "Textbook p.45-52", "Printed worksheets"],
        resourceLinks: ["https://www.mathsisfun.com/fractions_addition.html"],
        activities: [
          { time: 5, activity: "Warm-up: quick mental math and recall of previous lesson", method: "Q&A" },
          { time: 15, activity: "Introduce the concept using fraction strips on the board", method: "Demonstration" },
          { time: 15, activity: "Guided practice: solve sample problems in pairs", method: "Pair Work" },
          { time: 10, activity: "Independent worksheet and summary of key steps", method: "Individual Practice" },
        ],
        assessments: [
          { method: "Worksheet", tool: "Checklist", criteria: "Correctly solves 8/10 addition problems" },
          { method: "Class observation", tool: "Anecdotal notes", criteria: "Explains steps when asked" },
        ],
        reflection: "Students grasped addition well; subtraction of mixed numbers needs review next class.",
        grade: "Grade 5",
        students: 32,
      },
      {
        subject: "Science",
        topic: "Photosynthesis and the Food-Making Process",
        objectives: [
          "Students will be able to explain the process of photosynthesis.",
          "Students will be able to identify the inputs and outputs of photosynthesis.",
          "Students will be able to draw and label a simple diagram of a plant leaf.",
        ],
        resources: ["Plant leaf specimens", "Microscope", "Chart paper", "Science textbook ch.3"],
        resourceLinks: ["https://www.nationalgeographic.org/encyclopedia/photosynthesis/"],
        activities: [
          { time: 5, activity: "Brainstorm: how do plants get their food?", method: "Discussion" },
          { time: 15, activity: "Observe leaf cells under the microscope and draw them", method: "Lab Work" },
          { time: 15, activity: "Teacher explains the photosynthesis equation with chart", method: "Lecture + Diagram" },
          { time: 10, activity: "Groups label diagrams and present to class", method: "Group Presentation" },
        ],
        assessments: [
          { method: "Diagram labeling", tool: "Rubric", criteria: "All 6 parts correctly labeled" },
          { method: "Quiz", tool: "Answer key", criteria: "70%+ on the 5-question quiz" },
        ],
        reflection: "Lab work was engaging; microscope setup took longer than planned, adjust timing.",
        grade: "Grade 7",
        students: 28,
      },
      {
        subject: "English",
        topic: "Essay Writing: Structure and Paragraphs",
        objectives: [
          "Students will be able to identify the parts of a five-paragraph essay.",
          "Students will be able to write a clear thesis statement.",
          "Students will be able to organize ideas into an outline.",
        ],
        resources: ["Sample essays", "Outline template", "Projector", "Writing journals"],
        resourceLinks: [],
        activities: [
          { time: 5, activity: "Read a short sample essay aloud", method: "Read Aloud" },
          { time: 10, activity: "Label introduction, body, and conclusion together", method: "Whole Class" },
          { time: 15, activity: "Draft a thesis statement and outline on your own topic", method: "Individual Work" },
          { time: 15, activity: "Peer review outlines with a partner", method: "Peer Feedback" },
        ],
        assessments: [
          { method: "Outline submission", tool: "Checklist", criteria: "Includes thesis, 3 points, evidence" },
          { method: "Peer review", tool: "Feedback form", criteria: "Gives 2 strengths and 1 suggestion" },
        ],
        reflection: "Students found thesis statements tricky; add one more guided example next time.",
        grade: "Grade 8",
        students: 25,
      },
      {
        subject: "Nepali",
        topic: "नेपाली व्याकरण: समासको परिचय",
        objectives: [
          "विद्यार्थीहरूले समासका प्रकारहरू चिन्न सक्नेछन्।",
          "विद्यार्थीहरूले समस्त पदलाई विग्रह गर्न सक्नेछन्।",
          "विद्यार्थीहरूले आफ्नै वाक्यमा समास प्रयोग गर्न सक्नेछन्।",
        ],
        resources: ["पाठ्यपुस्तक", "श्वेतपट्ट", "अभ्यास पत्र"],
        resourceLinks: [],
        activities: [
          { time: 5, activity: "उदाहरण वाक्यबाट समासको परिचय", method: "प्रश्नोत्तर" },
          { time: 15, activity: "समासका प्रकार र विग्रहको अभ्यास", method: "शिक्षक व्याख्या" },
          { time: 15, activity: "साना समूहमा विग्रह अभ्यास", method: "समूह कार्य" },
          { time: 10, activity: "अभ्यास पत्रको समाधान र सारांश", method: "स्वतन्त्र अभ्यास" },
        ],
        assessments: [
          { method: "अभ्यास पत्र", tool: "उत्तर कुञ्जी", criteria: "१० मध्ये ७ वटा सही" },
          { method: "मौखिक परीक्षण", tool: "अवलोकन", criteria: "विग्रह सही बनाउन सक्ने" },
        ],
        reflection: "समूह कार्य राम्रो भयो, तर समय व्यवस्थापनमा ध्यान दिनुपर्ने।",
        grade: "Grade 6",
        students: 30,
      },
      {
        subject: "Science",
        topic: "States of Matter: Solid, Liquid, Gas",
        objectives: [
          "Students will be able to describe the three states of matter.",
          "Students will be able to give examples of each state.",
          "Students will be able to explain simple changes of state.",
        ],
        resources: ["Ice cubes", "Water", "Balloons", "Science kit"],
        resourceLinks: [],
        activities: [
          { time: 5, activity: "Show ice, water, and steam as examples", method: "Demonstration" },
          { time: 10, activity: "Classify objects on the board into solid, liquid, gas", method: "Sorting Game" },
          { time: 15, activity: "Experiment: observe melting and evaporation", method: "Hands-on Activity" },
          { time: 15, activity: "Complete observation table and discuss findings", method: "Individual Work" },
        ],
        assessments: [
          { method: "Observation table", tool: "Checklist", criteria: "All 3 states correctly classified" },
          { method: "Exit ticket", tool: "3-2-1", criteria: "Names 1 example per state" },
        ],
        reflection: "Draft — needs review before publishing.",
        grade: "Grade 4",
        students: 27,
      },
      {
        subject: "Math",
        topic: "Geometry: Angles and Triangles",
        objectives: [
          "Students will be able to measure angles using a protractor.",
          "Students will be able to classify triangles by their angles.",
          "Students will be able to find the missing angle of a triangle.",
        ],
        resources: ["Protractors", "Rulers", "Triangle cutouts", "Geometry worksheet"],
        resourceLinks: [],
        activities: [
          { time: 5, activity: "Recall types of angles with a quick quiz", method: "Quiz" },
          { time: 15, activity: "Practice measuring angles on the worksheet", method: "Individual Practice" },
          { time: 15, activity: "Classify triangle cutouts and paste them in groups", method: "Group Work" },
          { time: 10, activity: "Solve missing-angle problems on the board", method: "Whole Class" },
        ],
        assessments: [
          { method: "Worksheet", tool: "Answer key", criteria: "Measures 5 angles within 2 degrees" },
          { method: "Exit ticket", tool: "One problem", criteria: "Finds missing angle correctly" },
        ],
        reflection: "Draft — waiting for protractor sets to be delivered.",
        grade: "Grade 6",
        students: 29,
      },
    ];

    const lessonPlans = planTemplates.map((p, i) => ({
      ...teacherRefs[i % teacherRefs.length],
      subject: p.subject,
      grade: p.grade,
      topic: p.topic,
      date: new Date(Date.now() - (planTemplates.length - i) * 86400000).toISOString().slice(0, 10),
      duration: p.activities.reduce((sum, a) => sum + a.time, 0),
      students: p.students,
      objectives: p.objectives,
      resources: p.resources,
      resourceLinks: p.resourceLinks,
      activities: p.activities,
      assessments: p.assessments,
      reflection: p.reflection,
      status: i % 2 === 0 ? "published" : "draft",
      sharedWith: i % 3 === 0 ? [teacherRefs[(i + 1) % teacherRefs.length].ownerName] : [],
      template: false,
    }));
    await LessonPlan.insertMany(lessonPlans);

    return NextResponse.json({ message: "Seeding successful. Admin password: :r70esh.d. Other users: password123" });
  } catch (error: any) {
    console.error("Seeding error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
