import { NextRequest, NextResponse } from 'next/server';
import { GradeData } from '@/app/analytics/utils/types';
import { AnalysisStage } from '@/app/analytics/utils/aiUtils';

export async function POST(request: NextRequest) {
  try {
    // 从请求体获取成绩数据
    const requestData = await request.json();
    const { grades, courseFilter, semesterFilter } = requestData;

    if (!grades || !Array.isArray(grades) || grades.length === 0) {
      return NextResponse.json(
        { error: '没有提供成绩数据' },
        { status: 400 }
      );
    }

    // 过滤成绩数据
    const filteredGrades = grades.filter(grade => {
      const courseMatch = courseFilter === 'all' || grade.courseId === courseFilter;
      const semesterMatch = semesterFilter === 'all' || grade.semester === semesterFilter;
      return courseMatch && semesterMatch;
    });

    if (filteredGrades.length === 0) {
      return NextResponse.json(
        { error: '没有符合条件的成绩数据可供分析' },
        { status: 400 }
      );
    }

    // 准备传递给AI的数据
    const coursesData = filteredGrades.map(grade => ({
      course: grade.courseName,
      score: grade.score,
      semester: grade.semester,
      date: grade.date
    }));

    // 构建提示词
    const prompt = `作为一个学习分析专家，请基于以下学生的成绩数据，提供详细分析和改进建议。
    
成绩数据:
${JSON.stringify(coursesData, null, 2)}

请提供以下内容：
1. 整体表现分析：评估学生在不同课程的整体表现、优势和劣势
2. 学习趋势分析：分析学生成绩随时间的变化趋势
3. 具体的改进建议：针对每门表现较弱的课程提供针对性的学习建议
4. 时间管理建议：基于成绩分布，如何更好地分配学习时间

请确保分析具体、实用且有建设性。

非常重要: 请在生成过程中，每完成一个步骤都请先输出当前步骤名称，使用"[STEP:步骤名称]"的格式。
例如：先输出"[STEP:整体表现分析]"，再开始输出分析内容。`;

    try {
      // 创建流式响应
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // 发送进度更新 - 准备阶段
            controller.enqueue(encoder.encode(JSON.stringify({
              progress: 10,
              currentStep: AnalysisStage.PREPARING
            }) + '\n'));
            
            // 发送进度更新 - 连接阶段
            controller.enqueue(encoder.encode(JSON.stringify({
              progress: 20,
              currentStep: AnalysisStage.CONNECTING
            }) + '\n'));
            
            // 发送请求到本地Ollama服务，使用流式API
            const response = await fetch('http://localhost:11434/api/generate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'deepseek-r1:8b',
                prompt: prompt,
                stream: true,
              }),
            });

            if (!response.ok) {
              throw new Error(`调用AI服务失败: ${response.statusText}`);
            }
            
            // 发送进度更新 - 分析阶段
            controller.enqueue(encoder.encode(JSON.stringify({
              progress: 30,
              currentStep: AnalysisStage.ANALYZING_OVERALL
            }) + '\n'));
            
            // 读取流式响应
            const reader = response.body?.getReader();
            if (!reader) {
              throw new Error('无法获取流式响应');
            }
            
            let fullResponse = '';
            let currentStage = AnalysisStage.ANALYZING_OVERALL;
            let progressValue = 30;
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              // 解析流式响应块
              const chunk = new TextDecoder().decode(value);
              try {
                const jsonLines = chunk.split('\n').filter(line => line.trim());
                
                for (const line of jsonLines) {
                  const data = JSON.parse(line);
                  if (data.response) {
                    fullResponse += data.response;
                    
                    // 检测当前阶段
                    const stepMatch = data.response.match(/\[STEP:(.*?)\]/);
                    if (stepMatch) {
                      const detectedStage = stepMatch[1].trim();
                      
                      // 根据检测到的阶段更新进度
                      if (detectedStage.includes('整体表现') || detectedStage.includes('分析')) {
                        currentStage = AnalysisStage.ANALYZING_OVERALL;
                        progressValue = 40;
                      } else if (detectedStage.includes('趋势')) {
                        currentStage = AnalysisStage.ANALYZING_TRENDS;
                        progressValue = 60;
                      } else if (detectedStage.includes('建议') || detectedStage.includes('改进')) {
                        currentStage = AnalysisStage.GENERATING_SUGGESTIONS;
                        progressValue = 80;
                      }
                      
                      // 发送进度更新
                      controller.enqueue(encoder.encode(JSON.stringify({
                        progress: progressValue,
                        currentStep: currentStage
                      }) + '\n'));
                    }
                    
                    // 根据响应长度更新进度
                    if (fullResponse.length > 500 && progressValue < 50) {
                      progressValue = 50;
                      controller.enqueue(encoder.encode(JSON.stringify({
                        progress: progressValue,
                        currentStep: currentStage
                      }) + '\n'));
                    } else if (fullResponse.length > 1000 && progressValue < 70) {
                      progressValue = 70;
                      controller.enqueue(encoder.encode(JSON.stringify({
                        progress: progressValue,
                        currentStep: currentStage
                      }) + '\n'));
                    } else if (fullResponse.length > 2000 && progressValue < 90) {
                      progressValue = 90;
                      controller.enqueue(encoder.encode(JSON.stringify({
                        progress: progressValue,
                        currentStep: currentStage
                      }) + '\n'));
                    }
                  }
                }
              } catch (e) {
                console.error('解析流式响应出错:', e);
              }
            }
            
            // 发送进度更新 - 格式化阶段
            controller.enqueue(encoder.encode(JSON.stringify({
              progress: 95,
              currentStep: AnalysisStage.FORMATTING
            }) + '\n'));
            
            // 清理AI响应中的阶段标记
            const cleanedResponse = fullResponse.replace(/\[STEP:.*?\]/g, '');
            
            // 解析AI回复
            const analysisMatch = cleanedResponse.match(/整体表现分析[：:]([\s\S]*?)(?=\d+\.|\n\n|$)/i);
            const suggestionsText = cleanedResponse.match(/改进建议[：:]([\s\S]*?)(?=\d+\.|\n\n|$)/i) || 
                                    cleanedResponse.match(/具体的改进建议[：:]([\s\S]*?)(?=\d+\.|\n\n|$)/i);
            
            // 提取建议列表
            const suggestionsList = suggestionsText ? 
              suggestionsText[1].split(/\n[•-]\s*/).filter(Boolean).map(s => s.trim()) :
              cleanedResponse.split('\n').filter(line => line.trim().startsWith('- ')).map(s => s.replace(/^-\s*/, ''));
            
            // 发送完成信号和最终结果
            controller.enqueue(encoder.encode(JSON.stringify({
              progress: 100,
              currentStep: AnalysisStage.COMPLETE,
              analysis: analysisMatch ? analysisMatch[1].trim() : cleanedResponse,
              suggestions: suggestionsList.length > 0 ? suggestionsList : [cleanedResponse]
            }) + '\n'));
            
            // 完成流
            controller.close();
          } catch (error: any) {
            // 发送错误信息
            controller.enqueue(encoder.encode(JSON.stringify({
              error: `AI服务调用失败: ${error.message}`,
              progress: 0,
              currentStep: ''
            }) + '\n'));
            controller.close();
          }
        }
      });
      
      // 返回流式响应
      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'application/json',
          'Transfer-Encoding': 'chunked'
        }
      });
    } catch (error: any) {
      console.error('调用Ollama服务失败:', error);
      return NextResponse.json(
        { 
          error: `AI服务调用失败: ${error.message}`,
          rawError: error 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('API处理出错:', error);
    return NextResponse.json(
      { error: `服务器内部错误: ${error.message}` },
      { status: 500 }
    );
  }
} 