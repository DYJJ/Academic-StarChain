/*
  Warnings:

  - You are about to drop the column `changeDescription` on the `grade_edit_history` table. All the data in the column will be lost.
  - You are about to drop the column `newCourseId` on the `grade_edit_history` table. All the data in the column will be lost.
  - You are about to drop the column `newScore` on the `grade_edit_history` table. All the data in the column will be lost.
  - You are about to drop the column `newStudentId` on the `grade_edit_history` table. All the data in the column will be lost.
  - You are about to drop the column `previousCourseId` on the `grade_edit_history` table. All the data in the column will be lost.
  - You are about to drop the column `previousScore` on the `grade_edit_history` table. All the data in the column will be lost.
  - You are about to drop the column `previousStudentId` on the `grade_edit_history` table. All the data in the column will be lost.
  - You are about to drop the column `revisionNumber` on the `grade_edit_history` table. All the data in the column will be lost.
  - Added the required column `editNumber` to the `grade_edit_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `newValues` to the `grade_edit_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `oldValues` to the `grade_edit_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reason` to the `grade_edit_history` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `grade_edit_history` DROP COLUMN `changeDescription`,
    DROP COLUMN `newCourseId`,
    DROP COLUMN `newScore`,
    DROP COLUMN `newStudentId`,
    DROP COLUMN `previousCourseId`,
    DROP COLUMN `previousScore`,
    DROP COLUMN `previousStudentId`,
    DROP COLUMN `revisionNumber`,
    ADD COLUMN `editNumber` INTEGER NOT NULL,
    ADD COLUMN `newValues` TEXT NOT NULL,
    ADD COLUMN `oldValues` TEXT NOT NULL,
    ADD COLUMN `reason` TEXT NOT NULL;
