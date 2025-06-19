-- CreateTable
CREATE TABLE `appeals` (
    `id` VARCHAR(191) NOT NULL,
    `gradeId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `type` ENUM('SCORE_ERROR', 'CALCULATION_ERROR', 'MISSING_POINTS', 'OTHER') NOT NULL DEFAULT 'SCORE_ERROR',
    `reason` TEXT NOT NULL,
    `expectedScore` DOUBLE NULL,
    `evidence` TEXT NULL,
    `meetingTime` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `teacherComment` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `appeals_gradeId_idx`(`gradeId`),
    INDEX `appeals_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `appeals` ADD CONSTRAINT `appeals_gradeId_fkey` FOREIGN KEY (`gradeId`) REFERENCES `grades`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appeals` ADD CONSTRAINT `appeals_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
