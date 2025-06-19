'use client';

import { useState } from 'react';
import { Upload, message, Button, Modal, Spin } from 'antd';
import { UploadOutlined, UserOutlined, PictureOutlined, LoadingOutlined } from '@ant-design/icons';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
import { LogAction, logAction } from '../../../utils/logger';
import ImgCrop from 'antd-img-crop';

interface AvatarUploadProps {
    currentAvatar?: string | null;
    onAvatarChange: (newAvatarUrl: string) => void;
    userRole: string;
    userId: string;
}

export default function AvatarUpload({ currentAvatar, onAvatarChange, userRole, userId }: AvatarUploadProps) {
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [previewImage, setPreviewImage] = useState('');
    const [previewOpen, setPreviewOpen] = useState(false);
    const [uploading, setUploading] = useState(false);

    // 获取角色对应的颜色
    const getRoleColor = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return '#f56a00';
            case 'TEACHER':
                return '#1677ff';
            case 'STUDENT':
                return '#52c41a';
            default:
                return '#bfbfbf';
        }
    };

    // 上传前检查文件
    const beforeUpload = (file: RcFile) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('只能上传图片文件!');
            return false;
        }

        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('图片必须小于2MB!');
            return false;
        }

        return true;
    };

    // 自定义上传操作
    const customUpload = async (options: any) => {
        const { file, onSuccess, onError } = options;

        const formData = new FormData();
        formData.append('avatar', file);

        setUploading(true);

        try {
            const response = await fetch('/api/users/uploadAvatar', {
                method: 'POST',
                body: formData,
            });

            // 先克隆响应，以便可以多次读取
            const responseClone = response.clone();
            const result = await responseClone.json();

            if (!response.ok) {
                throw new Error(result.error || '上传失败');
            }

            // 记录日志
            try {
                // 不要等待日志记录完成，避免阻塞主流程
                logAction(LogAction.UPDATE_AVATAR, '用户更新了头像', userId).catch(error => {
                    console.error('记录日志失败:', error);
                });
            } catch (error) {
                console.error('记录日志失败:', error);
            }

            // 确保头像URL包含用户ID
            if (!result.avatarUrl.includes(`userId=${userId}`)) {
                console.warn('头像URL不包含用户ID，这可能导致问题');
            }

            // 更新头像
            onAvatarChange(result.avatarUrl);
            message.success('头像上传成功!');

            // 更新localStorage中的头像URL
            localStorage.setItem('userAvatar', result.avatarUrl);

            // 触发自定义事件通知组件刷新
            const profileUpdateEvent = new CustomEvent('profile-updated', {
                detail: { avatarUrl: result.avatarUrl }
            });
            window.dispatchEvent(profileUpdateEvent);

            onSuccess(result, file);
        } catch (error: any) {
            console.error('上传错误:', error);
            message.error(`上传失败: ${error.message}`);
            onError(error);
        } finally {
            setUploading(false);
            setFileList([]);
        }
    };

    // 处理预览
    const handlePreview = (file: UploadFile) => {
        setPreviewImage(file.url || (file.preview as string) || '');
        setPreviewOpen(true);
    };

    // 关闭预览
    const handleCancel = () => setPreviewOpen(false);

    // 处理文件列表变化
    const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
        setFileList(newFileList);
    };

    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 16 }}>
                <div
                    style={{
                        width: 120,
                        height: 120,
                        margin: '0 auto',
                        borderRadius: '50%',
                        background: getRoleColor(userRole),
                        overflow: 'hidden',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                >
                    {currentAvatar ? (
                        <img
                            src={currentAvatar}
                            alt="头像"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <UserOutlined style={{ fontSize: 60, color: 'white' }} />
                    )}
                </div>
            </div>

            <ImgCrop rotationSlider>
                <Upload
                    name="avatar"
                    listType="picture"
                    fileList={fileList}
                    beforeUpload={beforeUpload}
                    customRequest={customUpload}
                    onPreview={handlePreview}
                    onChange={handleChange}
                    maxCount={1}
                    showUploadList={true}
                >
                    <Button
                        icon={uploading ? <LoadingOutlined /> : <UploadOutlined />}
                        disabled={uploading}
                    >
                        {uploading ? '上传中...' : '更换头像'}
                    </Button>
                </Upload>
            </ImgCrop>

            <Modal
                open={previewOpen}
                title="预览头像"
                footer={null}
                onCancel={handleCancel}
            >
                <img alt="预览" style={{ width: '100%' }} src={previewImage} />
            </Modal>
        </div>
    );
} 