-- AddForeignKey
ALTER TABLE `grade_edit_history` ADD CONSTRAINT `grade_edit_history_gradeId_fkey` FOREIGN KEY (`gradeId`) REFERENCES `grades`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grade_edit_history` ADD CONSTRAINT `grade_edit_history_editorId_fkey` FOREIGN KEY (`editorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
