-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "ChecklistStatus" AS ENUM ('PENDING', 'DONE');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('GITHUB_ISSUE', 'GITHUB_PR', 'MANUAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "githubUsername" TEXT,
    "email" TEXT,
    "name" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repository" (
    "id" TEXT NOT NULL,
    "githubRepoId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "languages" JSONB,
    "importedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "IssueStatus" NOT NULL DEFAULT 'OPEN',
    "type" "TaskType" NOT NULL DEFAULT 'MANUAL',
    "githubNumber" INTEGER,
    "githubUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "repositoryId" TEXT NOT NULL,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Checklist" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ChecklistStatus" NOT NULL DEFAULT 'PENDING',
    "type" "TaskType" NOT NULL DEFAULT 'MANUAL',
    "githubNumber" INTEGER,
    "githubUrl" TEXT,
    "imageUrl" TEXT,
    "repositoryId" TEXT NOT NULL,
    "issueId" TEXT,
    "assigneeId" TEXT,
    "creatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Checklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyCommitActivity" (
    "id" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "days" INTEGER[],
    "total" INTEGER NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyCommitActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_githubUsername_key" ON "User"("githubUsername");

-- CreateIndex
CREATE UNIQUE INDEX "Repository_githubRepoId_key" ON "Repository"("githubRepoId");

-- CreateIndex
CREATE INDEX "Repository_importedById_idx" ON "Repository"("importedById");

-- CreateIndex
CREATE INDEX "Issue_repositoryId_idx" ON "Issue"("repositoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Issue_repositoryId_githubNumber_key" ON "Issue"("repositoryId", "githubNumber");

-- CreateIndex
CREATE INDEX "Checklist_repositoryId_idx" ON "Checklist"("repositoryId");

-- CreateIndex
CREATE INDEX "Checklist_issueId_idx" ON "Checklist"("issueId");

-- CreateIndex
CREATE INDEX "Checklist_assigneeId_idx" ON "Checklist"("assigneeId");

-- CreateIndex
CREATE INDEX "WeeklyCommitActivity_repositoryId_idx" ON "WeeklyCommitActivity"("repositoryId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyCommitActivity_repositoryId_week_key" ON "WeeklyCommitActivity"("repositoryId", "week");

-- AddForeignKey
ALTER TABLE "Repository" ADD CONSTRAINT "Repository_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checklist" ADD CONSTRAINT "Checklist_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checklist" ADD CONSTRAINT "Checklist_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checklist" ADD CONSTRAINT "Checklist_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checklist" ADD CONSTRAINT "Checklist_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyCommitActivity" ADD CONSTRAINT "WeeklyCommitActivity_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
