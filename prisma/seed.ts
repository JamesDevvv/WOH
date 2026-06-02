import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Default statuses
  const statusData = [
    { name: "New Visitor", color: "#6b7280" },
    { name: "Invited", color: "#f59e0b" },
    { name: "Regular Attendee", color: "#3b82f6" },
    { name: "Member", color: "#10b981" },
    { name: "Leader", color: "#8b5cf6" },
  ];

  for (const s of statusData) {
    await prisma.status.upsert({ where: { name: s.name }, update: {}, create: s });
  }
  console.log("✅ Statuses seeded");

  // Default groups
  const groupData = [
    { name: "Children's Ministry", color: "#f97316" },
    { name: "Youth & Young Adults", color: "#ec4899" },
    { name: "Young Professionals", color: "#06b6d4" },
    { name: "Adults", color: "#3b82f6" },
    { name: "Music Team", color: "#8b5cf6" },
    { name: "Intercessory Prayer", color: "#f59e0b" },
  ];

  for (const g of groupData) {
    await prisma.group.upsert({ where: { name: g.name }, update: {}, create: g });
  }
  console.log("✅ Groups seeded");

  // Default service types
  const serviceTypeData = [
    { name: "Main Service", order: 1 },
    { name: "Sunday Service", order: 2 },
    { name: "Prayer Night", order: 3 },
    { name: "Youth Service", order: 4 },
    { name: "Bible Study", order: 5 },
    { name: "Special Event", order: 6 },
  ];

  for (const st of serviceTypeData) {
    await prisma.serviceType.upsert({ where: { name: st.name }, update: {}, create: st });
  }
  console.log("✅ Service types seeded");

  // Admin users
  const hashedPassword = await bcrypt.hash("admin123!", 12);
  await prisma.user.upsert({
    where: { email: "admin@wordofhope.org" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@wordofhope.org",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user seeded (email: admin@wordofhope.org, password: admin123!)");

  await prisma.user.upsert({
    where: { email: "cedrickbarzaga92@gmail.com" },
    update: { role: "ADMIN" },
    create: {
      name: "Cedrick Barzaga",
      email: "cedrickbarzaga92@gmail.com",
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user seeded (cedrickbarzaga92@gmail.com)");

  // Sample activities
  const activities = [
    { title: "Sunday Worship", description: "Weekly Sunday worship service", icon: "🙏", schedule: "Every Sunday, 9:00 AM", category: "Worship", order: 1 },
    { title: "Bible Study", description: "Mid-week Bible study and discussion", icon: "📖", schedule: "Every Wednesday, 7:00 PM", category: "Study", order: 2 },
    { title: "Youth Fellowship", description: "Youth gathering and activities", icon: "🎉", schedule: "Every Friday, 6:00 PM", category: "Fellowship", order: 3 },
    { title: "Prayer Meeting", description: "Corporate prayer and intercession", icon: "🤲", schedule: "Every Tuesday, 6:30 AM", category: "Prayer", order: 4 },
  ];

  for (const a of activities) {
    const existing = await prisma.activity.findFirst({ where: { title: a.title } });
    if (!existing) await prisma.activity.create({ data: a });
  }
  console.log("✅ Activities seeded");

  console.log("🎉 Seed complete!");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
