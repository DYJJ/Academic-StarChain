import React from 'react';

const PageStyles: React.FC = () => {
  return (
    <style jsx global>{`
      .course-card {
        height: 100%;
        transition: all 0.3s;
        overflow: hidden;
        border-radius: 16px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.05);
        border: none;
      }
      
      .course-card:hover {
        transform: translateY(-6px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      }
      
      .ant-card-head {
        border-bottom: none;
      }
      
      .ant-card-body {
        padding: 24px;
      }
      
      .custom-modal .ant-modal-content {
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 8px 30px rgba(0,0,0,0.12);
      }
      
      .custom-modal .ant-modal-header {
        border-bottom: 1px solid #f0f0f0;
        padding: 16px 24px;
      }
      
      .custom-modal .ant-modal-footer {
        border-top: 1px solid #f0f0f0;
        padding: 16px 24px;
      }
      
      .ant-progress-text {
        font-weight: 600;
      }
      
      .ant-statistic-title {
        margin-bottom: 12px;
      }
      
      .ant-tag {
        border: none;
        font-weight: 500;
        border-radius: 4px;
      }
      
      .ant-list-item {
        transition: all 0.2s;
      }
      
      .ant-list-item:hover {
        background: #f0f5ff !important;
        transform: translateY(-2px);
      }
      
      .ant-btn {
        transition: all 0.3s;
      }
      
      .ant-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0,0,0,0.1);
      }
      
      .ant-list-item-meta-title {
        margin-bottom: 8px;
      }
      
      .ant-list-item-meta-description {
        line-height: 1.8;
      }
      
      .page-header {
        animation: fadeIn 0.5s ease-out;
      }
      
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `}</style>
  );
};

export default PageStyles; 