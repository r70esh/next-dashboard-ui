"use client";
import Image from "next/image";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const Performance = ({ attendancePercent = 92 }: { attendancePercent?: number }) => {
  const absent = 100 - attendancePercent;
  const data = [
    { name: "Present", value: attendancePercent, fill: "#C3EBFA" },
    { name: "Absent", value: absent, fill: "#FAE27C" },
  ];

  return (
    <div className="bg-white p-4 rounded-md h-80 relative">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Attendance</h1>
        <Image src="/moreDark.png" alt="" width={16} height={16} />
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            dataKey="value"
            startAngle={180}
            endAngle={0}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            fill="#8884d8"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center mt-4">
        <h1 className={`text-3xl font-bold ${attendancePercent >= 75 ? "text-green-600" : "text-red-500"}`}>
          {attendancePercent}%
        </h1>
        <p className="text-xs text-gray-400">Attendance Rate</p>
      </div>
      <h2 className="font-medium absolute bottom-16 left-0 right-0 m-auto text-center text-xs text-gray-500">
        Present: {attendancePercent}% · Absent: {absent}%
      </h2>
    </div>
  );
};

export default Performance;
