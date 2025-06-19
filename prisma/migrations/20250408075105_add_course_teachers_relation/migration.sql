-- CreateTable
CREATE TABLE `_CourseTeachers` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_CourseTeachers_AB_unique`(`A`, `B`),
    INDEX `_CourseTeachers_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_CourseTeachers` ADD CONSTRAINT `_CourseTeachers_A_fkey` FOREIGN KEY (`A`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CourseTeachers` ADD CONSTRAINT `_CourseTeachers_B_fkey` FOREIGN KEY (`B`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
