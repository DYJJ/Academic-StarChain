'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Spin, Alert, Typography, Divider, List, Tag, Collapse, Space, Progress, Steps, Select, Radio, Input, Tooltip } from 'antd';
import { RobotOutlined, BulbOutlined, WarningOutlined, LoadingOutlined, CheckCircleOutlined, EditOutlined, ThunderboltOutlined, ApiOutlined, LaptopOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { AIAnalysisResult, defaultAIAnalysisResult, analyzeGradesWithAI, analyzeGradesWithGitHubAPI, AnalysisStage } from '../utils/aiUtils';
import { GradeData } from '../utils/types';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { Step } = Steps;

interface AIAnalysisProps {
  grades: GradeData[];
  selectedCourse: string;
  selectedSemester: string;
}

// 添加样式
const listItemStyle = {
  transition: 'all 0.3s ease',
  ':hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  }
};

const tagStyle = {
  transition: 'all 0.3s ease'
};

// 添加打字机效果组件
const Typewriter: React.FC<{ text: string, speed?: number }> = ({ text, speed = 30 }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // 重置状态，当传入的文本发生变化时
    setDisplayText('');
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else {
      setIsComplete(true);
    }
  }, [currentIndex, speed, text]);

  return (
    <div style={{ whiteSpace: 'pre-line' }}>
      {displayText}
      {!isComplete && <span className="cursor">|</span>}
      <style jsx>{`
        .cursor {
          animation: blink 1s infinite;
          color: #1890ff;
          font-weight: bold;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// 区分思考过程和结论的分析部分组件
const ThoughtfulAnalysis: React.FC<{ analysis: string }> = ({ analysis }) => {
  // 检查是否包含<think>标签（旧格式）
  const hasThinkTag = analysis.includes('<think>') && analysis.includes('</think>');

  let thinkingPart = '';
  let conclusionPart = analysis;

  if (hasThinkTag) {
    // 提取旧格式的思考部分和结论部分
    const thinkMatch = analysis.match(/<think>([\s\S]*?)<\/think>/);
    thinkingPart = thinkMatch ? thinkMatch[1].trim() : '';
    conclusionPart = analysis.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  } else {
    // 使用常规分隔符拆分
    const parts = analysis.split(/(?=总结：|结论：|综合而言：|综上所述：|因此：)/i);
    if (parts.length > 1) {
      thinkingPart = parts[0].trim();
      conclusionPart = parts.slice(1).join('').trim();
    }
  }

  // 如果没有明确的结论部分，则整个内容作为结论
  if (!conclusionPart || conclusionPart.length < 10) {
    conclusionPart = analysis;
    thinkingPart = '';
  }

  const [showThinking, setShowThinking] = useState(false);

  return (
    <div>
      {thinkingPart && (
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '8px',
              cursor: 'pointer'
            }}
            onClick={() => setShowThinking(!showThinking)}
          >
            <EditOutlined style={{ color: '#722ed1', marginRight: '8px' }} />
            <Text strong style={{ color: '#722ed1' }}>思考过程</Text>
            <Tag color="purple" style={{ marginLeft: '8px' }}>
              {showThinking ? '点击隐藏' : '点击展开'}
            </Tag>
          </div>

          {showThinking && (
            <div
              style={{
                backgroundColor: '#f9f0ff',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #d3adf7',
                fontSize: '14px',
                marginBottom: '16px'
              }}
            >
              <Typewriter text={thinkingPart} speed={10} />
            </div>
          )}
        </div>
      )}

      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <ThunderboltOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
          <Text strong style={{ color: '#1890ff' }}>分析结论</Text>
        </div>

        <div
          style={{
            backgroundColor: '#f0f8ff',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #91d5ff',
            fontSize: '14px'
          }}
        >
          <Typewriter text={conclusionPart} speed={20} />
        </div>
      </div>
    </div>
  );
};

const AIAnalysis: React.FC<AIAnalysisProps> = ({
  grades,
  selectedCourse,
  selectedSemester
}) => {
  const [result, setResult] = useState<AIAnalysisResult>(defaultAIAnalysisResult);
  const [ollamaStatus, setOllamaStatus] = useState<'unknown' | 'running' | 'error'>('unknown');
  // 添加新状态，用于实时文本
  const [streamingText, setStreamingText] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  // 添加模式选择状态
  const [analysisMode, setAnalysisMode] = useState<'local' | 'api'>('api');
  // 添加API模型选择状态
  const [selectedApiModel, setSelectedApiModel] = useState<string>('gpt-3.5-turbo');

  // 获取AI分析结果
  const fetchAIAnalysis = async () => {
    try {
      setResult({ ...defaultAIAnalysisResult, loading: true });
      setStreamingText(''); // 清空流式文本
      setIsStreaming(true); // 开始流式传输

      if (analysisMode === 'local') {
        // 使用本地Ollama模型分析
        // 先检查Ollama服务是否运行
        try {
          const statusResponse = await fetch('http://localhost:11434/api/version', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });

          if (statusResponse.ok) {
            setOllamaStatus('running');
          } else {
            setOllamaStatus('error');
            setResult({
              ...defaultAIAnalysisResult,
              error: 'Ollama服务未启动，请在终端运行 "ollama run deepseek-r1:8b"'
            });
            return;
          }
        } catch (error) {
          setOllamaStatus('error');
          setResult({
            ...defaultAIAnalysisResult,
            error: 'Ollama服务连接失败，请确认服务已启动: ollama run deepseek-r1:8b'
          });
          return;
        }

        // 使用直接调用方式，而不是通过API
        try {
          await analyzeGradesWithAI(
            grades,
            selectedCourse,
            selectedSemester,
            (stage, progress) => {
              setResult(prev => ({
                ...prev,
                currentStep: stage,
                progress: progress,
                loading: progress < 100
              }));
            },
            // 添加流式文本回调
            (text) => {
              setStreamingText(text);
            }
          ).then(analysisResult => {
            setResult({
              ...analysisResult,
              loading: false
            });
            setIsStreaming(false); // 结束流式传输
          });
        } catch (error: any) {
          console.error('AI分析失败:', error);
          setResult({
            ...defaultAIAnalysisResult,
            error: error.message || '获取AI分析失败'
          });
          setIsStreaming(false); // 错误时也结束流式传输
        }
      } else {
        // 使用GitHub API模式
        try {
          // 使用工具函数进行API分析，不再需要传递API Key
          const analysisResult = await analyzeGradesWithGitHubAPI(
            grades,
            selectedCourse,
            selectedSemester,
            selectedApiModel,
            (stage, progress) => {
              setResult(prev => ({
                ...prev,
                currentStep: stage,
                progress: progress,
                loading: progress < 100
              }));
            }
          );

          setResult({
            ...analysisResult,
            loading: false
          });
          setIsStreaming(false);
        } catch (error: any) {
          console.error('GitHub AI API分析失败:', error);
          setResult({
            ...defaultAIAnalysisResult,
            error: error.message || 'GitHub AI API分析失败'
          });
          setIsStreaming(false);
        }
      }
    } catch (error: any) {
      console.error('AI分析请求失败:', error);
      setResult({
        ...defaultAIAnalysisResult,
        error: error.message || '获取AI分析失败'
      });
      setIsStreaming(false); // 错误时也结束流式传输
    }
  };

  // 获取当前阶段对应的步骤索引
  const getCurrentStepIndex = (): number => {
    const stages = Object.values(AnalysisStage);
    const index = stages.indexOf(result.currentStep as any);
    return index >= 0 ? index : 0;
  };

  // 创建一个实时流式响应显示组件
  const StreamingResponse: React.FC<{ text: string }> = ({ text }) => {
    // 使用ref记录上次渲染的文本位置
    const textRef = useRef<HTMLDivElement>(null);

    // 每次文本更新后自动滚动到底部
    useEffect(() => {
      if (textRef.current) {
        textRef.current.scrollTop = textRef.current.scrollHeight;
      }
    }, [text]);

    // 尝试分离思考过程和结论
    let displayText = text;
    let thinkingPart = '';
    let conclusionPart = '';

    // 查找思考过程标签
    if (text.includes('<think>') && text.includes('</think>')) {
      const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/);
      thinkingPart = thinkMatch ? thinkMatch[1] : '';
      // 移除思考过程标签，保留内容
      displayText = text.replace(/<think>[\s\S]*?<\/think>/g, thinkingPart);
    }

    // 查找结论标记
    const conclusionStart = displayText.search(/总结：|结论：|综合而言：|综上所述：|因此：/i);
    if (conclusionStart > -1) {
      thinkingPart = displayText.substring(0, conclusionStart);
      conclusionPart = displayText.substring(conclusionStart);

      return (
        <div
          ref={textRef}
          style={{
            whiteSpace: 'pre-line',
            maxHeight: '400px',
            overflowY: 'auto',
            fontSize: '14px',
            lineHeight: '1.6',
            padding: '10px'
          }}
        >
          {thinkingPart && (
            <div style={{
              backgroundColor: '#f9f0ff',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #d3adf7',
              marginBottom: '16px'
            }}>
              {thinkingPart}
            </div>
          )}

          {conclusionPart && (
            <div style={{
              backgroundColor: '#f0f8ff',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #91d5ff'
            }}>
              {conclusionPart}
            </div>
          )}

          <span className="cursor">|</span>
          <style jsx>{`
            .cursor {
              animation: blink 1s infinite;
              color: #1890ff;
              font-weight: bold;
            }
            @keyframes blink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0; }
            }
          `}</style>
        </div>
      );
    }

    // 如果没有明确的分隔，就直接显示整个文本
    return (
      <div
        ref={textRef}
        style={{
          whiteSpace: 'pre-line',
          maxHeight: '400px',
          overflowY: 'auto',
          padding: '16px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #f0f0f0',
          fontSize: '14px',
          lineHeight: '1.6'
        }}
      >
        {displayText}
        <span className="cursor">|</span>
        <style jsx>{`
          .cursor {
            animation: blink 1s infinite;
            color: #1890ff;
            font-weight: bold;
          }
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
        `}</style>
      </div>
    );
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <RobotOutlined style={{ marginRight: 8, color: '#1890ff', fontSize: 20 }} />
          <span style={{ fontSize: 16, fontWeight: 'bold' }}>AI学习分析与建议</span>
        </div>
      }
      style={{
        marginTop: 24,
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden'
      }}
      headStyle={{
        backgroundColor: '#f0f8ff',
        borderBottom: '1px solid #e8f4ff',
        padding: '12px 24px'
      }}
      bodyStyle={{ padding: 24 }}
      extra={
        <Button
          type="primary"
          loading={result.loading}
          onClick={fetchAIAnalysis}
          icon={<RobotOutlined />}
          disabled={result.loading}
          style={{
            borderRadius: 8,
            height: 40,
            fontWeight: 'bold',
            boxShadow: '0 2px 6px rgba(24, 144, 255, 0.2)'
          }}
        >
          {ollamaStatus === 'error' ? '重试连接AI' : result.loading ? '分析中...' : '获取AI分析'}
        </Button>
      }
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Radio.Group
            value={analysisMode}
            onChange={(e) => setAnalysisMode(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="local">
              <LaptopOutlined /> 本地模型
            </Radio.Button>
            <Radio.Button value="api">
              <ApiOutlined /> GitHub API模式
            </Radio.Button>
          </Radio.Group>

          {analysisMode === 'api' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              <Select
                style={{ width: 240 }}
                value={selectedApiModel}
                onChange={(value) => setSelectedApiModel(value)}
                options={[
                  { label: 'GPT-4o-mini (速度一般)', value: 'gpt-4o-mini' },
                  { label: 'GPT-3.5-turbo-0125', value: 'gpt-3.5-turbo-0125' },
                  { label: 'GPT-3.5-turbo-1106', value: 'gpt-3.5-turbo-1106' },
                  { label: 'GPT-3.5-turbo', value: 'gpt-3.5-turbo' },
                  { label: 'GPT-3.5-turbo-16k', value: 'gpt-3.5-turbo-16k' },
                  { label: 'Net-GPT-3.5-turbo (可联网搜索)', value: 'net-gpt-3.5-turbo' },
                  { label: 'Whisper-1', value: 'whisper-1' },
                  { label: 'DALL-E-2', value: 'dall-e-2' }
                ]}
              />
              <div style={{ marginLeft: '8px', fontSize: '14px', color: '#1890ff' }}>
                使用自定义API服务
              </div>
            </div>
          )}
        </div>

        <Button
          type="primary"
          onClick={fetchAIAnalysis}
          loading={result.loading}
          disabled={result.loading}
          icon={<BulbOutlined />}
        >
          {result.loading ? '分析中...' : '开始分析'}
        </Button>
      </div>

      {result.loading ? (
        <div style={{
          padding: '20px 0',
          background: 'linear-gradient(to bottom, #f9fcff, #ffffff)',
          borderRadius: '8px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 32, color: '#1890ff' }} spin />} />
            <p style={{
              marginTop: 16,
              fontSize: 16,
              padding: '8px 12px',
              background: '#e6f7ff',
              borderRadius: '4px',
              display: 'inline-block'
            }}>
              <Text strong>{result.currentStep}</Text>
              <Text>（{result.progress}%）</Text>
            </p>
          </div>

          {/* 添加实时AI响应显示 */}
          {isStreaming && streamingText && (
            <div style={{ margin: '20px' }}>
              <Divider orientation="left">
                <Text strong>实时AI响应</Text>
              </Divider>
              <StreamingResponse text={streamingText} />
            </div>
          )}

          <Progress
            percent={result.progress}
            status="active"
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
            style={{
              marginBottom: 30,
              padding: '0 30px'
            }}
          />

          <Steps
            current={getCurrentStepIndex()}
            size="small"
            style={{ marginTop: 20, maxWidth: 800, margin: '0 auto' }}
          >
            <Step title="准备数据" />
            <Step title="连接AI服务" />
            <Step title="分析整体表现" />
            <Step title="分析学习趋势" />
            <Step title="生成学习建议" />
            <Step title="格式化结果" />
            <Step title="完成" />
          </Steps>

          <div style={{ marginTop: 30, padding: '10px 20px', backgroundColor: '#f5f5f5', borderRadius: 4 }}>
            <Text type="secondary">提示: AI分析过程需要一定时间，请耐心等待。分析结果由本地DeepSeek大模型生成，质量取决于您的数据量和模型版本。</Text>
          </div>
        </div>
      ) : result.error ? (
        <Alert
          message={analysisMode === 'local' ? "本地AI分析服务暂不可用" : "GitHub API连接问题"}
          description={
            <div>
              <p>{result.error}</p>
              {analysisMode === 'local' ? (
                <p>
                  请确保本地Ollama服务已启动，可通过在终端运行以下命令启动：
                  <br />
                  <code>ollama run deepseek-r1:8b</code>
                </p>
              ) : (
                <p>
                  GitHub API连接可能遇到以下问题：
                  <ol>
                    <li>API密钥已过期或权限不足</li>
                    <li>API请求限制（Rate limit）已达上限</li>
                    <li>网络连接问题</li>
                  </ol>
                  <div style={{ backgroundColor: '#f6ffed', padding: '8px', borderRadius: '4px', marginTop: '10px' }}>
                    <b>提示：</b> 系统使用固定的GitHub Token: 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
                  </div>
                </p>
              )}
            </div>
          }
          type="error"
          showIcon
          icon={<WarningOutlined />}
        />
      ) : result.analysis ? (
        <div>
          <div className="analysis-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            padding: '12px 16px',
            backgroundColor: '#f6ffed',
            borderRadius: '8px',
            border: '1px solid #b7eb8f'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleOutlined style={{
                color: '#52c41a',
                marginRight: 8,
                fontSize: 18,
              }} />
              <Text strong style={{ color: '#389e0d' }}>分析完成 ({result.progress}%)</Text>
            </div>
            <Tag color="green" style={{
              fontWeight: 'bold',
              borderRadius: '12px',
              padding: '0 8px'
            }}>AI生成</Tag>
          </div>

          <div className="analysis-section">
            <Title level={5} style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: 8 }}>整体学习表现分析</span>
              <Tag color="blue">AI分析</Tag>
            </Title>
            <ThoughtfulAnalysis analysis={result.analysis} />
          </div>

          <Divider />

          <div className="suggestions-section">
            <Title level={5} style={{ display: 'flex', alignItems: 'center' }}>
              <BulbOutlined style={{ marginRight: 8, color: '#faad14' }} />
              <span>学习改进建议</span>
            </Title>

            {result.suggestions && result.suggestions.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={result.suggestions.filter(item => item && item.trim().length > 0 && !/^[0-9]+$/.test(item.trim()))}
                renderItem={(item, index) => {
                  // 识别课程特定建议
                  const isCourseSpecific = item.startsWith('针对');
                  // 识别学期建议
                  const isSemesterSpecific = /^[0-9]+-[0-9]+学年/.test(item);

                  // 决定标签颜色
                  let tagColor = 'blue';
                  let tagText = '一般建议';

                  if (isCourseSpecific) {
                    tagColor = 'green';
                    tagText = '课程建议';
                  } else if (isSemesterSpecific) {
                    tagColor = 'purple';
                    tagText = '学期建议';
                  }

                  return (
                    <List.Item style={{
                      padding: '16px',
                      marginBottom: '8px',
                      backgroundColor: '#fafafa',
                      borderRadius: '8px',
                      border: '1px solid #f0f0f0',
                      transition: 'all 0.3s ease',
                      cursor: 'default'
                    }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                      }}>
                      <List.Item.Meta
                        avatar={
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #1890ff, #52c41a)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '14px',
                              boxShadow: '0 2px 8px rgba(24, 144, 255, 0.2)'
                            }}
                          >
                            {index + 1}
                          </div>
                        }
                        title={<Tag color={tagColor}>{tagText}</Tag>}
                        description={
                          <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'rgba(0, 0, 0, 0.85)' }}>
                            {item}
                          </div>
                        }
                      />
                    </List.Item>
                  );
                }}
                style={{
                  maxHeight: '400px',
                  overflow: 'auto',
                  padding: '8px',
                  marginBottom: '16px',
                  borderRadius: '8px'
                }}
              />
            ) : (
              <div style={{
                padding: '24px',
                backgroundColor: '#fafafa',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <BulbOutlined style={{ fontSize: '24px', color: '#d9d9d9', marginBottom: '8px' }} />
                <Text type="secondary">请稍等，正在生成改进建议...</Text>
                <div style={{ marginTop: '16px' }}>
                  <Button type="primary" size="small" onClick={fetchAIAnalysis}>
                    重新生成建议
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Divider dashed />

          <div style={{
            textAlign: 'center',
            backgroundColor: '#f0f8ff',
            padding: '12px',
            borderRadius: '8px',
            marginTop: '16px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              {analysisMode === 'local' ? (
                <>
                  <RobotOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                  <Text type="secondary" style={{ fontStyle: 'italic', fontSize: '14px' }}>
                    由本地 DeepSeek-R1 8B 模型提供分析，仅供参考
                  </Text>
                </>
              ) : (
                <>
                  <ApiOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                  <Text type="secondary" style={{ fontStyle: 'italic', fontSize: '14px' }}>
                    由({selectedApiModel})提供分析，仅供参考
                  </Text>
                </>
              )}
            </div>
            <Button
              type="primary"
              ghost
              size="small"
              onClick={fetchAIAnalysis}
              icon={analysisMode === 'local' ? <RobotOutlined /> : <ApiOutlined />}
              style={{
                borderRadius: '16px',
                fontSize: '12px',
                boxShadow: 'none'
              }}
            >
              重新生成分析
            </Button>
          </div>
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '40px 0',
          backgroundColor: '#f9fcff',
          borderRadius: 12,
          border: '1px dashed #d9e8ff'
        }}>
          <BulbOutlined style={{
            fontSize: 48,
            color: '#1890ff',
            marginBottom: 16,
            background: '#e6f7ff',
            padding: 16,
            borderRadius: '50%'
          }} />
          <p style={{
            fontSize: 16,
            color: 'rgba(0, 0, 0, 0.65)',
            maxWidth: 400,
            margin: '0 auto 20px'
          }}>
            点击"开始分析"按钮，获取基于您成绩的个性化学习分析与建议
          </p>
          <Space size={[8, 16]} wrap style={{ justifyContent: 'center' }}>
            <Tag color="blue" style={{ padding: '4px 12px', borderRadius: 16 }}>整体表现</Tag>
            <Tag color="green" style={{ padding: '4px 12px', borderRadius: 16 }}>优势学科</Tag>
            <Tag color="orange" style={{ padding: '4px 12px', borderRadius: 16 }}>薄弱环节</Tag>
            <Tag color="purple" style={{ padding: '4px 12px', borderRadius: 16 }}>学习建议</Tag>
          </Space>
        </div>
      )}
    </Card>
  );
};

export default AIAnalysis; 