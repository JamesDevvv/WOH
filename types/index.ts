import { UserRole } from "@prisma/client";

export type { UserRole };

export interface SafeUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: UserRole;
  createdAt: Date;
}

export interface MemberWithRelations {
  id: string;
  name: string;
  contact: string | null;
  email: string | null;
  address: string | null;
  birthdate: Date | null;
  age: number | null;
  ageBracket: "C1" | "C2" | "C3" | null;
  invitedBy: string | null;
  statusId: string;
  leaderId: string | null;
  notes: string | null;
  lastInteraction: Date | null;
  createdAt: Date;
  updatedAt: Date;
  status: { id: string; name: string; color: string };
  groups: { id: string; name: string; color: string }[];
  leader: { id: string; name: string } | null;
  lessonCount?: number;
}

export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemberLessonWithDetails {
  id: string;
  memberId: string;
  lessonId: string;
  completedAt: Date;
  notes: string | null;
  lesson: Lesson;
}

export interface AttendanceWithMember {
  id: string;
  memberId: string;
  date: Date;
  serviceType: string;
  groupId: string | null;
  notes: string | null;
  createdAt: Date;
  member: { id: string; name: string };
  group: { id: string; name: string } | null;
}

export interface TrainingWithMember {
  id: string;
  memberId: string;
  instrument: string;
  skillLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  progress: number;
  trainer: string | null;
  notes: string | null;
  startDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  member: { id: string; name: string };
}

export interface DashboardStats {
  totalMembers: number;
  attendanceThisWeek: number;
  upcomingEvents: number;
  activeTrainees: number;
  memberGrowth: number;
  recentMembers: MemberWithRelations[];
  groupDistribution: { name: string; count: number; color: string }[];
  statusDistribution: { name: string; count: number; color: string }[];
}
