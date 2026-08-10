import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import connectToDB from "@/lib/db";
import { Admin, Teacher, Student, Parent } from "@/lib/models";

export const RESET_TOKEN_COOKIE = "pw_reset_token";
export const RESET_CODE_TTL_MINUTES = 10;
export const MAX_CODE_ATTEMPTS = 5;

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export const hashResetToken = (token: string) => sha256(`reset:${token}`);

export const hashResetCode = (code: string, token: string) => sha256(`code:${code}:${token}`);

export const generateResetToken = () => randomBytes(32).toString("hex");

export const generateResetCode = () =>
  String(randomBytes(3).readUIntBE(0, 3) % 1000000).padStart(6, "0");

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const findUserByEmail = async (email: string) => {
  await connectToDB();
  const query = { email: new RegExp(`^${escapeRegex(email)}$`, "i") };
  return (
    (await Admin.findOne(query)) ||
    (await Teacher.findOne(query)) ||
    (await Student.findOne(query)) ||
    (await Parent.findOne(query))
  );
};

export const updatePasswordByEmail = async (email: string, password: string) => {
  await connectToDB();
  const hashed = await bcrypt.hash(password, 10);
  const query = { email: new RegExp(`^${escapeRegex(email)}$`, "i") };
  let updated = await Admin.findOneAndUpdate(query, { password: hashed });
  if (!updated) updated = await Teacher.findOneAndUpdate(query, { password: hashed });
  if (!updated) updated = await Student.findOneAndUpdate(query, { password: hashed });
  if (!updated) updated = await Parent.findOneAndUpdate(query, { password: hashed });
  return !!updated;
};

const rateStore = new Map<string, number[]>();

export const isRateLimited = (key: string, limit: number, windowMs: number) => {
  const now = Date.now();
  const recent = (rateStore.get(key) || []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    rateStore.set(key, recent);
    return true;
  }
  recent.push(now);
  rateStore.set(key, recent);
  if (Math.random() < 0.01) {
    rateStore.forEach((times, k) => {
      if (times.length === 0 || now - times[times.length - 1] > windowMs) rateStore.delete(k);
    });
  }
  return false;
};

export const clientIp = (req: Request) =>
  (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim() || "unknown";
