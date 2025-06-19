'use client';

import React from 'react';
import { Card, Row, Col, Select, Button, Typography } from 'antd';

const { Text } = Typography;
const { Option } = Select;

interface FilterSectionProps {
  selectedCourse: string;
  setSelectedCourse: (value: string) => void;
  selectedSemester: string;
  setSelectedSemester: (value: string) => void;
  courseOptions: { value: string; label: string }[];
  semesterOptions: { value: string; label: string }[];
}

const FilterSection: React.FC<FilterSectionProps> = ({
  selectedCourse,
  setSelectedCourse,
  selectedSemester,
  setSelectedSemester,
  courseOptions,
  semesterOptions
}) => {
  return (
    <Card style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={8} md={6}>
          <Text strong>选择课程：</Text>
          <Select 
            style={{ width: '100%', marginTop: 8 }}
            value={selectedCourse}
            onChange={setSelectedCourse}
          >
            {courseOptions.map(option => (
              <Option key={option.value} value={option.value}>{option.label}</Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Text strong>选择学期：</Text>
          <Select 
            style={{ width: '100%', marginTop: 8 }}
            value={selectedSemester}
            onChange={setSelectedSemester}
          >
            {semesterOptions.map(option => (
              <Option key={option.value} value={option.value}>{option.label}</Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Button 
            type="primary" 
            onClick={() => {
              setSelectedCourse('all');
              setSelectedSemester('all');
            }}
          >
            重置筛选
          </Button>
        </Col>
      </Row>
    </Card>
  );
};

export default FilterSection; 