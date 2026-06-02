-- Add leaderId to members
ALTER TABLE "members" ADD COLUMN "leaderId" TEXT;
ALTER TABLE "members" ADD CONSTRAINT "members_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create lessons table
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- Create member_lessons junction table
CREATE TABLE "member_lessons" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "member_lessons_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "member_lessons" ADD CONSTRAINT "member_lessons_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "member_lessons" ADD CONSTRAINT "member_lessons_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "member_lessons_memberId_lessonId_key" ON "member_lessons"("memberId", "lessonId");
