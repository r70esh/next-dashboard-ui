"use client";

import Image from "next/image";
import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export type EventType = {
  id: string;
  title: string;
  time: string;
  description: string;
  date: string; // ISO string or short date
};

const EventCalendar = ({ events }: { events: EventType[] }) => {
  const [value, onChange] = useState<Value>(new Date());

  // Filter events based on the selected date
  const selectedDateStr = value instanceof Date ? value.toLocaleDateString() : "";
  const filteredEvents = events.filter((event) => {
    return new Date(event.date).toLocaleDateString() === selectedDateStr;
  });

  return (
    <div className="bg-white p-4 rounded-md">
      <Calendar onChange={onChange} value={value} />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold my-4">Events</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      <div className="flex flex-col gap-4">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <div
              className="p-5 rounded-md border-2 border-gray-100 border-t-4 odd:border-t-mahankalSky even:border-t-mahankalPurple"
              key={event.id}
            >
              <div className="flex items-center justify-between">
                <h1 className="font-semibold text-gray-600">{event.title}</h1>
                <span className="text-gray-300 text-xs">{event.time}</span>
              </div>
              <p className="mt-2 text-gray-400 text-sm">{event.description}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">No events for this date.</p>
        )}
      </div>
    </div>
  );
};

export default EventCalendar;
