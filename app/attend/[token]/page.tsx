import type { Metadata } from "next";
import { AttendPage } from "./AttendPage";

export const metadata: Metadata = { title: "Attendance — Word of Hope Sta. Clara" };

export default async function QRAttendancePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <AttendPage token={token} />;
}
