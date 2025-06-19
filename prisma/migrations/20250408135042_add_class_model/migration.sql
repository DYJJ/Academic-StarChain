-- AlterTable
ALTER TABLE `users` ADD COLUMN `classId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `classes` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `year` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `users_classId_idx` ON `users`(`classId`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
