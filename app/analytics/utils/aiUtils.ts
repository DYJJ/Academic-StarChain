import { GradeData } from './types';
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

export interface AIAnalysisResult {
  analysis: string;
  suggestions: string[];
  loading: boolean;
  error: string | null;
  progress: number;
  currentStep: string;
  streamText?: string;
  isStreaming?: boolean;
}

// 默认AI分析结果
export const defaultAIAnalysisResult: AIAnalysisResult = {
  analysis: '',
  suggestions: [],
  loading: false,
  error: null,
  progress: 0,
  currentStep: '',
  streamText: '',
  isStreaming: false
};

// 分析阶段枚举
export enum AnalysisStage {
  PREPARING = '准备数据',
  CONNECTING = '连接AI服务',
  ANALYZING_OVERALL = '分析整体表现',
  ANALYZING_TRENDS = '分析学习趋势',
  GENERATING_SUGGESTIONS = '生成学习建议',
  FORMATTING = '格式化结果',
  COMPLETE = '分析完成'
}

/**
 * 使用OpenAI API分析成绩数据
 */
export async function analyzeGradesWithGitHubAPI(
  grades: GradeData[],
  courseFilter: string = 'all',
  semesterFilter: string = 'all',
  model: string = 'gpt-3.5-turbo',
  onProgress: (stage: string, progress: number) => void
): Promise<AIAnalysisResult> {
  try {
    // 阶段1: 准备数据
    onProgress(AnalysisStage.PREPARING, 10);

    // 过滤成绩数据
    const filteredGrades = grades.filter(grade => {
      const courseMatch = courseFilter === 'all' || grade.courseId === courseFilter;
      const semesterMatch = semesterFilter === 'all' || grade.semester === semesterFilter;
      return courseMatch && semesterMatch;
    });

    if (filteredGrades.length === 0) {
      return {
        ...defaultAIAnalysisResult,
        error: '没有符合条件的成绩数据可供分析'
      };
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
1. 整体表现分析
2. 学习趋势分析
3. 具体的改进建议：针对每门表现较弱的课程提供针对性的学习建议
4. 时间管理建议：基于成绩分布，如何更好地分配学习时间`;

    // 阶段2: 连接API服务
    onProgress(AnalysisStage.CONNECTING, 20);

    // 获取自定义API设置
    const apiUrl = process.env.NEXT_PUBLIC_OPENAI_API_URL || 'https://free.v36.cm';
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || 'sk-vGD78RmVYMVXqkncA1306f47C57c4f45A0Ec5266100c27Bf';

    // 阶段3: 分析数据
    onProgress(AnalysisStage.ANALYZING_OVERALL, 50);

    // 检查是否使用联网模型
    const isWebSearch = model === 'net-gpt-3.5-turbo';

    // 使用RESTful请求
    const response = await fetch(`${apiUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: isWebSearch ? 'gpt-3.5-turbo' : model, // 联网模型使用基础模型
        messages: [
          {
            role: "system",
            content: isWebSearch
              ? "你是一个有联网搜索能力的AI助手，可以搜索最新信息回答问题。"
              : "你是一个专业的学习分析助手，擅长分析学生学习成绩和提供改进建议。"
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        web_search: isWebSearch // 联网搜索参数
      })
    });

    // 检查API响应
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API请求失败: ${response.status} - ${errorText}`);
    }

    // 解析API响应
    const apiResponse = await response.json();
    const analysisText = apiResponse.choices[0].message.content;

    // 阶段4: 格式化结果
    onProgress(AnalysisStage.FORMATTING, 90);

    // 提取建议
    const suggestions = extractSuggestionsFromText(analysisText);

    // 完成
    onProgress(AnalysisStage.COMPLETE, 100);

    return {
      analysis: analysisText,
      suggestions: suggestions,
      loading: false,
      error: null,
      progress: 100,
      currentStep: AnalysisStage.COMPLETE
    };
  } catch (error: any) {
    console.error('API分析失败:', error);
    return {
      ...defaultAIAnalysisResult,
      error: error.message || 'API分析失败，请检查API配置和网络连接'
    };
  }
}

/**
 * 从文本中提取建议列表
 */
export function extractSuggestionsFromText(text: string): string[] {
  const suggestions: string[] = [];

  // 尝试多种模式匹配提取建议
  let suggestionsText = null;

  // 匹配模式1：改进建议:后面的内容
  suggestionsText = text.match(/改进建议[：:]([\s\S]*?)(?=$)/i);
  // 匹配模式2：具体的改进建议:后面的内容
  if (!suggestionsText) {
    suggestionsText = text.match(/具体的改进建议[：:]([\s\S]*?)(?=$)/i);
  }
  // 匹配模式3：学习建议:后面的内容
  if (!suggestionsText) {
    suggestionsText = text.match(/学习建议[：:]([\s\S]*?)(?=$)/i);
  }

  if (suggestionsText && suggestionsText[1]) {
    const suggestionsContent = suggestionsText[1].trim();

    // 尝试使用数字+点+空格分割 (如 "1. 建议内容")
    const numericListItems = suggestionsContent.split(/\d+\.\s+/).filter(s => s.trim().length > 0);
    if (numericListItems.length > 0) {
      return numericListItems;
    }

    // 如果没有明确的列表格式，就返回整个文本
    return [suggestionsContent];
  }

  return suggestions;
}

/**
 * 调用本地Ollama模型生成成绩分析
 */
export async function analyzeGradesWithAI(
  grades: GradeData[],
  courseFilter: string = 'all',
  semesterFilter: string = 'all',
  onProgress: (stage: string, progress: number) => void,
  onStream?: (text: string) => void
): Promise<AIAnalysisResult> {
  try {
    // 阶段1: 准备数据
    onProgress(AnalysisStage.PREPARING, 10);

    // 过滤成绩数据
    const filteredGrades = grades.filter(grade => {
      const courseMatch = courseFilter === 'all' || grade.courseId === courseFilter;
      const semesterMatch = semesterFilter === 'all' || grade.semester === semesterFilter;
      return courseMatch && semesterMatch;
    });

    if (filteredGrades.length === 0) {
      return {
        ...defaultAIAnalysisResult,
        error: '没有符合条件的成绩数据可供分析'
      };
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
1. 整体表现分析：
   a. 先以<think>标签内详细展示你的思考过程，分析各科目表现
   b. 然后以"总结："开头，给出简明的结论
2. 学习趋势分析
3. 具体的改进建议：针对每门表现较弱的课程提供针对性的学习建议
4. 时间管理建议：基于成绩分布，如何更好地分配学习时间

格式示例：
==========
整体表现分析：
<think>
我看到这位学生在数学课上的成绩是85分，而物理课是75分，英语课是95分...
考虑到英语课的成绩显著高于其他科目，说明学生在语言学习方面有优势...
数学成绩尚可，但有提升空间...
</think>

总结：该学生在语言类科目表现出色，理科科目有待提高，整体成绩良好。
==========

请确保分析具体、实用且有建设性。

非常重要: 请在生成过程中，每完成一个步骤都请先输出当前步骤名称，使用"[STEP:步骤名称]"的格式。
例如：先输出"[STEP:整体表现分析]"，再开始输出分析内容。`;

    // 阶段2: 连接AI服务
    onProgress(AnalysisStage.CONNECTING, 20);

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

    // 阶段3: 开始分析
    onProgress(AnalysisStage.ANALYZING_OVERALL, 30);

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
            // 添加到完整响应中
            fullResponse += data.response;

            // 提供流式文本给UI，实时更新
            if (onStream) {
              onStream(fullResponse);
            }

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

              onProgress(currentStage, progressValue);
            }

            // 根据响应长度更新进度
            if (fullResponse.length > 500 && progressValue < 50) {
              progressValue = 50;
              onProgress(currentStage, progressValue);
            } else if (fullResponse.length > 1000 && progressValue < 70) {
              progressValue = 70;
              onProgress(currentStage, progressValue);
            } else if (fullResponse.length > 2000 && progressValue < 90) {
              progressValue = 90;
              onProgress(currentStage, progressValue);
            }
          }
        }
      } catch (e) {
        console.error('解析流式响应出错:', e);
      }
    }

    // 阶段4: 格式化结果
    onProgress(AnalysisStage.FORMATTING, 95);

    // 清理AI响应中的阶段标记
    const cleanedResponse = fullResponse.replace(/\[STEP:.*?\]/g, '');

    // 解析AI回复，处理思考过程标签
    let analysisText = '';
    const analysisMatch = cleanedResponse.match(/整体表现分析[：:]([\s\S]*?)(?=学习趋势分析|具体的改进建议|改进建议|时间管理建议|$)/i);

    // 处理带有思考过程的分析
    if (analysisMatch && analysisMatch[1]) {
      const rawAnalysis = analysisMatch[1].trim();

      // 检查是否包含思考过程
      if (rawAnalysis.includes('<think>') && rawAnalysis.includes('</think>')) {
        // 将<think>标签替换为HTML兼容的格式
        analysisText = rawAnalysis.replace(/<\/?think>/g, '');
      } else {
        analysisText = rawAnalysis;
      }
    } else {
      analysisText = cleanedResponse;
    }

    // 尝试多种模式匹配提取建议
    let suggestionsText = null;
    // 匹配模式1：改进建议:后面的内容
    suggestionsText = cleanedResponse.match(/改进建议[：:]([\s\S]*?)(?=$)/i);
    // 匹配模式2：具体的改进建议:后面的内容
    if (!suggestionsText) {
      suggestionsText = cleanedResponse.match(/具体的改进建议[：:]([\s\S]*?)(?=$)/i);
    }
    // 匹配模式3：学习改进建议:后面的内容
    if (!suggestionsText) {
      suggestionsText = cleanedResponse.match(/学习改进建议[：:]([\s\S]*?)(?=$)/i);
    }
    // 匹配模式4：学习建议:后面的内容
    if (!suggestionsText) {
      suggestionsText = cleanedResponse.match(/学习建议[：:]([\s\S]*?)(?=$)/i);
    }
    // 匹配模式5：时间管理建议:后面的内容
    if (!suggestionsText) {
      suggestionsText = cleanedResponse.match(/时间管理建议[：:]([\s\S]*?)(?=$)/i);
    }

    // 尝试从匹配文本中提取建议列表
    let suggestionsList: string[] = [];

    if (suggestionsText && suggestionsText[1]) {
      const suggestionsContent = suggestionsText[1].trim();

      // 尝试多种分割模式提取建议列表
      // 模式1：使用数字+点+空格分割 (如 "1. 建议内容")
      const numericListItems = suggestionsContent.split(/\d+\.\s+/).filter(s => s.trim().length > 0);
      if (numericListItems.length > 0) {
        suggestionsList = numericListItems;
      } else {
        // 模式2：使用短横线或项目符号分割 (如 "- 建议内容" 或 "• 建议内容")
        const bulletListItems = suggestionsContent.split(/\n[•\-]\s*/).filter(s => s.trim().length > 0);
        if (bulletListItems.length > 0) {
          suggestionsList = bulletListItems;
        } else {
          // 模式3：尝试按段落分割
          const paragraphs = suggestionsContent.split(/\n\s*\n/).filter(s => s.trim().length > 0);
          if (paragraphs.length > 0) {
            suggestionsList = paragraphs;
          } else {
            // 模式4：按行分割
            const lines = suggestionsContent.split(/\n/).filter(s => s.trim().length > 0);
            suggestionsList = lines;
          }
        }
      }
    }

    // 如果依然没有提取到建议，尝试从完整响应中查找特定模式
    if (suggestionsList.length === 0) {
      // 处理以Markdown加粗标记的标题格式 (如 "**标题**：内容")
      const markdownTitlePattern = /\*\*(.*?)\*\*[：:]([\s\S]*?)(?=\*\*|$)/g;
      let markdownMatch;
      while ((markdownMatch = markdownTitlePattern.exec(cleanedResponse)) !== null) {
        const title = markdownMatch[1].trim();
        const content = markdownMatch[2].trim();
        if (content.length > 0) {
          // 将标题和内容组合为建议
          suggestionsList.push(`${title}：${content}`);
        }
      }

      // 如果上面的提取仍然没有获得建议，查找标准格式的行项目
      if (suggestionsList.length === 0) {
        // 查找所有以数字开头的行
        const numericLines = cleanedResponse.split('\n')
          .filter(line => /^\d+\./.test(line.trim()))
          .map(line => line.replace(/^\d+\.\s*/, '').trim());

        if (numericLines.length > 0) {
          suggestionsList = numericLines;
        } else {
          // 查找所有以短横线或项目符号开头的行
          const bulletLines = cleanedResponse.split('\n')
            .filter(line => /^[•\-]/.test(line.trim()))
            .map(line => line.replace(/^[•\-]\s*/, '').trim());

          if (bulletLines.length > 0) {
            suggestionsList = bulletLines;
          }
        }
      }
    }

    // 从原始文本中提取特定模式的分段
    if (suggestionsList.length === 0) {
      // 提取特定模式：数字+一般建议 (移除了s标志，改用多行匹配)
      const generalAdvicePattern = /(\d+)\s*[\n\r]*一般建议\s*[\n\r]*(.+?)(?=\d+\s*[\n\r]*一般建议|$)/g;

      // 将文本转换为适合多行匹配的格式
      const cleanedText = cleanedResponse.replace(/\n/g, ' __NEWLINE__ ');

      let generalMatch;
      while ((generalMatch = generalAdvicePattern.exec(cleanedText)) !== null) {
        const index = generalMatch[1].trim();
        // 恢复原始换行符
        const content = generalMatch[2].trim().replace(/__NEWLINE__/g, '\n');

        if (content.length > 0) {
          // 针对不同类型的建议内容进行处理
          if (content.includes("**")) {
            // 有标题的内容，提取标题
            const titleMatch = content.match(/\*\*(.*?)\*\*[：:]([\s\S]*)/);
            if (titleMatch) {
              const title = titleMatch[1].trim();
              const advice = titleMatch[2].trim();
              suggestionsList.push(`${title}：${advice}`);
            } else {
              suggestionsList.push(content);
            }
          } else {
            suggestionsList.push(content);
          }
        }
      }

      // 如果仍然没有找到，尝试一个更宽松的模式
      if (suggestionsList.length === 0) {
        // 查找所有非空行
        const nonEmptyLines = cleanedResponse.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && !/^[\d\s]*$/.test(line));

        // 查找可能的建议模式
        for (let i = 0; i < nonEmptyLines.length; i++) {
          const line = nonEmptyLines[i];
          // 如果行包含冒号且不是步骤标记
          if ((line.includes('：') || line.includes(':')) &&
            !line.includes('[STEP:') &&
            !line.includes('整体表现分析') &&
            !line.includes('学习趋势分析')) {
            suggestionsList.push(line);
          }
          // 如果有"建议"字样但不包含冒号
          else if (line.includes('建议') && !line.includes('：') && !line.includes(':')) {
            suggestionsList.push(line);
          }
        }
      }
    }

    // 最后的兜底：如果还是没有建议，创建一个默认建议
    if (suggestionsList.length === 0) {
      // 如果分析内容存在，基于分析内容生成一个通用建议
      if (analysisMatch && analysisMatch[1]) {
        const analysis = analysisMatch[1].trim();
        // 提取课程名字，尝试找到内容中可能提到的课程
        const courseNames = analysis.match(/(?:计算机|数学|物理|英语|编程|大家安静|操作系统|数据结构|算法)[a-zA-Z0-9]*(?:\s*导论|\s*基础)?/g);

        if (courseNames && courseNames.length > 0) {
          // 为找到的每个课程创建一个建议
          courseNames.forEach(course => {
            suggestionsList.push(`针对${course}：建议加强学习和巩固练习，提高该科目的掌握程度。`);
          });
        }

        // 添加一些通用建议
        suggestionsList.push("优势：继续保持当前的学习方法和态度，进一步巩固已有的学科优势。");
        suggestionsList.push("劣势：针对较弱学科，建议增加练习量，尝试不同的学习方法如思维导图或小组讨论。");
        suggestionsList.push("课程安排规划：建议制定合理的学习计划，平衡各科目的学习时间。");
        suggestionsList.push("高效学习方法：可以采用番茄工作法，提高学习效率和专注度。");
        suggestionsList.push("应对压力管理：定期进行体育锻炼和休息，保持良好的心态面对学习压力。");
      } else {
        // 如果没有分析内容，提供完全通用的建议
        suggestionsList = [
          "优势：继续保持现有的学习优势，并尝试分享你的学习方法。",
          "劣势：针对薄弱环节，建议寻求老师或同学的帮助，制定专项提升计划。",
          "总体评价：总体表现良好，建议继续保持积极的学习态度和方法。",
          "高效学习方法：采用有效的学习技巧，如主动回顾、习题练习和知识点归纳。",
          "应对压力管理：保持心理健康对学习同样重要，建议适当放松，劳逸结合。"
        ];
      }
    }

    // 清理建议内容：移除空项和仅包含数字的项，以及末尾的数字编号
    suggestionsList = suggestionsList
      .map(item => {
        // 移除建议末尾的数字序号(例如 "建议内容 1." 或 "建议内容 1")
        return item.replace(/\s+\d+\.?\s*$/, '');
      })
      .map(item => item.trim())
      .filter(item => item.length > 0 && !/^\d+$/.test(item));

    // 阶段5: 完成
    onProgress(AnalysisStage.COMPLETE, 100);

    return {
      analysis: analysisText,
      suggestions: suggestionsList,
      loading: false,
      error: null,
      progress: 100,
      currentStep: AnalysisStage.COMPLETE,
      streamText: fullResponse
    };
  } catch (error: any) {
    console.error('AI分析失败:', error);
    return {
      ...defaultAIAnalysisResult,
      error: `AI分析出错: ${error.message}`,
      progress: 0,
      currentStep: ''
    };
  }
} 