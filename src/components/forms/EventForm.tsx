"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../InputField";
import { createEvent, updateEvent } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

const schema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters!" }),
  description: z.string().min(2, { message: "Description is required!" }),
  class: z.string().refine((val) => {
    const n = parseInt(val);
    return n >= 1 && n <= 12 && !isNaN(n);
  }, { message: "Class must be between 1 and 12!" }),
  date: z.string().min(1, { message: "Date is required!" }),
  startTime: z.string().min(1, { message: "Start time is required!" }),
  endTime: z.string().min(1, { message: "End time is required!" }),
});

type Inputs = z.infer<typeof schema>;

const EventForm = ({ type, data }: { type: "create" | "update"; data?: any }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: data?.title || "",
      description: data?.description || "",
      class: data?.class || "",
      date: data?.date ? new Date(data.date).toISOString().split("T")[0] : "",
      startTime: data?.startTime || "",
      endTime: data?.endTime || "",
    },
  });

  const onSubmit = handleSubmit(async (formData) => {
    setLoading(true);
    setError("");
    setSuccess("");

    let result;
    if (type === "create") {
      result = await createEvent(formData);
    } else {
      result = await updateEvent(data?.id, formData);
    }

    if (result.success) {
      setSuccess(type === "create" ? "Event created successfully!" : "Event updated!");
      router.refresh();
    } else {
      setError(result.error || "Something went wrong.");
    }
    setLoading(false);
  });

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">{type === "create" ? "Create a New Event" : "Update Event"}</h1>

      {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}
      {success && <p className="text-green-600 text-sm bg-green-50 p-2 rounded">{success}</p>}

      <span className="text-xs text-gray-400 font-medium">Event Details</span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField label="Event Title" name="title" register={register} error={errors.title} />
        <InputField label="Class (1-12)" name="class" register={register} error={errors.class} />
        <InputField label="Date" name="date" type="date" register={register} error={errors.date} />
        <InputField label="Start Time (e.g. 10:00 AM)" name="startTime" register={register} error={errors.startTime} />
        <InputField label="End Time (e.g. 12:00 PM)" name="endTime" register={register} error={errors.endTime} />
      </div>

      <div className="flex flex-col gap-2 w-full">
        <label className="text-xs text-gray-500">Description</label>
        <textarea
          {...register("description")}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full outline-none focus:ring-lamaSky"
          rows={3}
          placeholder="Enter event details here..."
        ></textarea>
        {errors.description?.message && (
          <p className="text-xs text-red-400">{errors.description.message.toString()}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-lamaYellow text-white p-2 rounded-md font-medium disabled:opacity-60 mt-2"
      >
        {loading ? "Saving..." : type === "create" ? "Create Event" : "Update Event"}
      </button>
    </form>
  );
};

export default EventForm;
