-- CreateTable
CREATE TABLE `blockchain_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `transactionHash` VARCHAR(191) NOT NULL,
    `blockNumber` INTEGER NOT NULL,
    `gradeId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `teacherId` VARCHAR(191) NOT NULL,
    `blockchainData` TEXT NOT NULL,
    `blockTimestamp` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `blockchain_transactions_transactionHash_key`(`transactionHash`),
    INDEX `blockchain_transactions_gradeId_idx`(`gradeId`),
    INDEX `blockchain_transactions_studentId_idx`(`studentId`),
    INDEX `blockchain_transactions_courseId_idx`(`courseId`),
    INDEX `blockchain_transactions_teacherId_idx`(`teacherId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `blockchain_transactions` ADD CONSTRAINT `blockchain_transactions_gradeId_fkey` FOREIGN KEY (`gradeId`) REFERENCES `grades`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `_courseteachers` RENAME INDEX `_CourseTeachers_AB_unique` TO `_courseteachers_AB_unique`;

-- RenameIndex
ALTER TABLE `_courseteachers` RENAME INDEX `_CourseTeachers_B_index` TO `_courseteachers_B_index`;
