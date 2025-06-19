-- CreateTable
CREATE TABLE `grade_edit_history` (
    `id` VARCHAR(191) NOT NULL,
    `gradeId` VARCHAR(191) NOT NULL,
    `editorId` VARCHAR(191) NOT NULL,
    `previousScore` DOUBLE NOT NULL,
    `newScore` DOUBLE NOT NULL,
    `previousStudentId` VARCHAR(191) NOT NULL,
    `newStudentId` VARCHAR(191) NOT NULL,
    `previousCourseId` VARCHAR(191) NOT NULL,
    `newCourseId` VARCHAR(191) NOT NULL,
    `revisionNumber` INTEGER NOT NULL,
    `changeDescription` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `grade_edit_history_gradeId_idx`(`gradeId`),
    INDEX `grade_edit_history_editorId_idx`(`editorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `relatedId` VARCHAR(191) NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `readAt` DATETIME(3) NULL,

    INDEX `notifications_userId_idx`(`userId`),
    INDEX `notifications_type_idx`(`type`),
    INDEX `notifications_read_idx`(`read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
