'use client';

import { useState } from 'react';
import { Upload, Button, message, Modal, Spin } from 'antd';
import { UploadOutlined, PictureOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import Image from 'next/image';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

interface CourseImageUploadProps {
  courseId: string;
  currentImageUrl: string | null;
  onImageUpdate: (imageUrl: string | null) => void;
}

export default function CourseImageUpload({ 
  courseId, 
  currentImageUrl,
  onImageUpdate 
}: CourseImageUploadProps) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  // 处理上传操作
  const handleUpload = async () => {
    const formData = new FormData();
    fileList.forEach(file => {
      formData.append('image', file as any);
    });

    setUploading(true);

    try {
      const response = await fetch(`/api/courses/${courseId}/image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '上传失败');
      }

      const data = await response.json();
      
      setFileList([]);
      message.success('课程图片上传成功');
      
      // 通知父组件图片已更新
      onImageUpdate(data.imageUrl);
    } catch (error: any) {
      console.error('上传错误:', error);
      message.error(error.message || '上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  // 处理删除图片
  const handleDeleteImage = async () => {
    setUploading(true);
    
    try {
      const response = await fetch(`/api/courses/${courseId}/image`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '删除失败');
      }

      message.success('课程图片已删除');
      
      // 通知父组件图片已删除
      onImageUpdate(null);
      
      setConfirmDeleteVisible(false);
    } catch (error: any) {
      console.error('删除错误:', error);
      message.error(error.message || '删除失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const props: UploadProps = {
    onRemove: file => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: file => {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        message.error('只能上传图片文件!');
        return Upload.LIST_IGNORE;
      }
      
      // 检查文件大小 (5MB限制)
      if (file.size > 5 * 1024 * 1024) {
        message.error('图片不能超过5MB!');
        return Upload.LIST_IGNORE;
      }
      
      setFileList([file]);
      return false;
    },
    fileList,
    maxCount: 1,
  };

  // 预览图片
  const handlePreview = () => {
    if (currentImageUrl) {
      setPreviewImage(currentImageUrl);
      setPreviewOpen(true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        {currentImageUrl ? (
          <div className="relative">
            <div className="relative w-48 h-32 overflow-hidden rounded-md shadow-md">
              <Image 
                src={currentImageUrl}
                alt="课程图片"
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div className="flex mt-2 space-x-2">
              <Button 
                size="small" 
                icon={<EyeOutlined />} 
                onClick={handlePreview}
              >
                查看
              </Button>
              <Button 
                size="small" 
                danger 
                icon={<DeleteOutlined />} 
                onClick={() => setConfirmDeleteVisible(true)}
              >
                删除
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center w-48 h-32 bg-gray-100 rounded-md">
            <PictureOutlined style={{ fontSize: 24, color: '#999' }} />
          </div>
        )}
        
        {!currentImageUrl && (
          <div>
            <Upload {...props} listType="picture">
              <Button icon={<UploadOutlined />}>选择图片</Button>
            </Upload>
            <Button
              type="primary"
              onClick={handleUpload}
              disabled={fileList.length === 0}
              loading={uploading}
              style={{ marginTop: 16 }}
            >
              {uploading ? '上传中...' : '上传图片'}
            </Button>
          </div>
        )}
        
        {currentImageUrl && (
          <div>
            <Upload {...props} listType="picture">
              <Button icon={<UploadOutlined />}>更换图片</Button>
            </Upload>
            <Button
              type="primary"
              onClick={handleUpload}
              disabled={fileList.length === 0}
              loading={uploading}
              style={{ marginTop: 16 }}
            >
              {uploading ? '上传中...' : '确认更新'}
            </Button>
          </div>
        )}
      </div>
      
      <div className="text-gray-500 text-sm">
        图片将用作课程卡片背景，建议尺寸 1200 x 600 像素，最大 5MB，
        <br />
        上传宽高比例为 2:1 的图片效果最佳
      </div>
      
      {/* 图片预览模态框 */}
      <Modal
        open={previewOpen}
        title="课程图片预览"
        footer={null}
        onCancel={() => setPreviewOpen(false)}
      >
        <img alt="预览" style={{ width: '100%' }} src={previewImage} />
      </Modal>
      
      {/* 确认删除模态框 */}
      <Modal
        title="确认删除"
        open={confirmDeleteVisible}
        onOk={handleDeleteImage}
        onCancel={() => setConfirmDeleteVisible(false)}
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true, loading: uploading }}
      >
        <p>确定要删除课程图片吗？此操作无法恢复。</p>
        {uploading && <Spin className="mt-4 block" />}
      </Modal>
    </div>
  );
} 