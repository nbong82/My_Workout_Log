import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const GOOGLE_WEBAPP_URL =
  'https://script.google.com/macros/s/AKfycbzR5QefCeu4Wdg9A8PcNzYyBcL7vOvKrP-nHakwa1XUwqX3bW3oSRih-FHYB2crxY3B-w/exec?action=getWorkouts';

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface WorkoutRecord {
  id?: string;
  date: string;
  type: string;
  distance: number;
  duration: number;
  heartRate: number;
  intensity: number;
  memo: string;
}

interface WorkoutSummary {
  totalWorkouts: number;
  totalDistance: number;
  totalDuration: number;
  thisWeekDistance: number;
  thisMonthDistance: number;
  averagePace: string;
  averageHeartRate: number;
  weeklyGoal: number;
  goalAttainmentRate: number;
}

// Helper to generate rule-based fallback coaching advice
function generateFallbackFeedback(summary: WorkoutSummary, records: WorkoutRecord[]): string {
  if (!records || records.length === 0 || summary.totalWorkouts === 0) {
    return '새로운 운동을 시작할 완벽한 타이밍이네요! 가벼운 20분 조깅이나 스트레칭으로 활기찬 첫 기록을 세워보시는 것을 추천합니다!';
  }

  const attainment = summary.goalAttainmentRate || 0;
  const recentRecord = records[0];

  if (attainment >= 100) {
    return `이번 주 목표 거리를 무려 ${attainment}% 초과 달성하셨네요! 누적된 근육 피로를 풀어주기 위해 오늘은 충분한 수분 섭취와 폼롤러 스트레칭을 적극 추천합니다!`;
  } else if (attainment >= 60) {
    return `이번 주 누적 ${summary.thisWeekDistance}km로 목표 달성을 향해 정말 꾸준히 잘 달리고 계시네요! 남은 목표 완주를 위해 페이스를 무리하지 않고 유지하시는 것을 추천합니다!`;
  } else if (recentRecord && recentRecord.intensity >= 4) {
    return `최근 고강도 ${recentRecord.type} 운동을 성공적으로 소화해내셨네요! 다음 세션은 심박수를 안정시킬 수 있는 저강도 회복 러닝으로 이어가시는 것을 추천합니다!`;
  } else {
    return `규칙적인 운동 리듬으로 건강한 습관을 탄탄히 다져가고 계시네요! 주간 목표 ${summary.weeklyGoal || 20}km 달성을 위해 이번 주말 3~5km 지속주를 가볍게 시도해보시는 것을 추천합니다!`;
  }
}

// 1. Fetch workout records & summary from Google Apps Script WebApp
app.get('/api/workouts', async (_req: Request, res: Response) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const apiRes = await fetch(GOOGLE_WEBAPP_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/plain, */*',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!apiRes.ok) {
      throw new Error(`Google WebApp returned HTTP ${apiRes.status}`);
    }

    const textData = await apiRes.text();
    let parsed: { records: any[]; summary: WorkoutSummary };

    try {
      parsed = JSON.parse(textData);
    } catch (parseError) {
      console.warn('Failed to parse direct JSON, cleaning response string...');
      const firstBrace = textData.indexOf('{');
      const lastBrace = textData.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        parsed = JSON.parse(textData.substring(firstBrace, lastBrace + 1));
      } else {
        throw new Error('Invalid JSON format from Google Apps Script');
      }
    }

    // Smart normalizer for sheet records
    const normalizedRecords: WorkoutRecord[] = (parsed.records || []).map((r: any, idx: number) => {
      let finalDate = String(r.date || '');
      let finalType = String(r.type || '러닝');
      let finalDist = Number(r.distance) || 0;
      let finalDur = Number(r.duration) || 0;
      let finalHr = Number(r.heartRate) || 0;
      let finalIntensity = Number(r.intensity) || 3;
      let finalMemo = String(r.memo || '');

      // Check if Date is actually in `r.type` (e.g. "Sat Oct 17 2026...")
      if (typeof r.type === 'string' && (r.type.includes('GMT') || !isNaN(Date.parse(r.type)))) {
        const d = new Date(r.type);
        if (!isNaN(d.getTime())) {
          finalDate = d.toISOString().split('T')[0];
        }
        finalType = '러닝';
      }

      // If memo is in `r.createdAt` and `r.memo` is intensity text like "보통"
      if (r.createdAt && typeof r.createdAt === 'string' && r.createdAt.trim()) {
        finalMemo = `${r.createdAt} (${r.memo || ''})`.trim();
      }

      // If intensity is heart-rate sized (> 40), swap/adjust
      if (finalIntensity > 30 && finalHr <= 30) {
        finalHr = finalIntensity;
        finalIntensity = 3;
      } else if (finalIntensity > 10) {
        // e.g. 150 bpm heart rate
        if (finalHr > 0 && finalHr <= 10) {
          const temp = finalHr;
          finalHr = finalIntensity;
          finalIntensity = temp;
        } else {
          finalIntensity = 4;
        }
      }

      // If duration is fractional like 23.7 and distance is 0, duration is 24 mins or distance 23.7km
      if (finalDist === 0 && finalDur > 0) {
        // In sports, 23.7 is typically km distance or minutes
        if (finalDur > 20) {
          finalDist = Math.round(finalDur * 10) / 10;
          finalDur = 120; // 2 hours or default
        }
      }

      return {
        id: r.id || `row-${idx}`,
        date: finalDate,
        type: finalType,
        distance: finalDist,
        duration: finalDur,
        heartRate: finalHr,
        intensity: finalIntensity,
        memo: finalMemo,
      };
    });

    parsed.records = normalizedRecords;

    // Recalculate summary if the Google Sheet summary is 0 but records have distances
    const hasDistances = normalizedRecords.some((r) => r.distance > 0);
    if (parsed.summary.totalDistance === 0 && hasDistances) {
      let totalDist = 0;
      let totalDur = 0;
      let weekDist = 0;
      let monthDist = 0;
      let hrSum = 0;
      let hrCount = 0;
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      normalizedRecords.forEach((r) => {
        totalDist += r.distance;
        totalDur += r.duration;
        const rDate = new Date(r.date);
        if (rDate >= oneWeekAgo) weekDist += r.distance;
        if (rDate >= startOfMonth) monthDist += r.distance;
        if (r.heartRate > 0) {
          hrSum += r.heartRate;
          hrCount++;
        }
      });

      const weeklyGoal = parsed.summary.weeklyGoal || 20;
      const attainment = weeklyGoal > 0 ? Math.round((weekDist / weeklyGoal) * 100) : 0;

      let avgPace = '-';
      if (totalDist > 0 && totalDur > 0) {
        const sec = (totalDur * 60) / totalDist;
        const min = Math.floor(sec / 60);
        const s = Math.round(sec % 60);
        avgPace = `${min}'${s < 10 ? '0' : ''}${s}"/km`;
      }

      parsed.summary = {
        totalWorkouts: normalizedRecords.length,
        totalDistance: Math.round(totalDist * 10) / 10,
        totalDuration: Math.round(totalDur),
        thisWeekDistance: Math.round(weekDist * 10) / 10,
        thisMonthDistance: Math.round(monthDist * 10) / 10,
        averagePace: avgPace,
        averageHeartRate: hrCount > 0 ? Math.round(hrSum / hrCount) : parsed.summary.averageHeartRate || 0,
        weeklyGoal,
        goalAttainmentRate: attainment,
      };
    }

    return res.json({
      success: true,
      source: 'google_sheet',
      fetchedAt: new Date().toISOString(),
      data: parsed,
    });
  } catch (err: any) {
    console.error('Fetch Google WebApp error:', err.message);
    return res.json({
      success: false,
      error: err.message || 'Failed to fetch from Google WebApp',
      fetchedAt: new Date().toISOString(),
      data: {
        records: [],
        summary: {
          totalWorkouts: 0,
          totalDistance: 0,
          totalDuration: 0,
          thisWeekDistance: 0,
          thisMonthDistance: 0,
          averagePace: '-',
          averageHeartRate: 0,
          weeklyGoal: 20,
          goalAttainmentRate: 0,
        },
      },
    });
  }
});

// 2. Generate AI Sports Trainer Personalized One-Line Coaching Feedback
app.post('/api/coach-feedback', async (req: Request, res: Response) => {
  try {
    const { summary, records } = req.body as {
      summary: WorkoutSummary;
      records: WorkoutRecord[];
    };

    const hasRecords = records && records.length > 0;
    const summaryInfo = summary || {
      totalWorkouts: 0,
      totalDistance: 0,
      totalDuration: 0,
      thisWeekDistance: 0,
      thisMonthDistance: 0,
      averagePace: '-',
      averageHeartRate: 0,
      weeklyGoal: 20,
      goalAttainmentRate: 0,
    };

    if (!process.env.GEMINI_API_KEY) {
      const fallback = generateFallbackFeedback(summaryInfo, records || []);
      return res.json({ feedback: fallback, engine: 'rule-based' });
    }

    const recentList = (records || []).slice(0, 4).map((r) =>
      `[${r.date}] ${r.type} ${r.distance}km (${r.duration}분, 심박수:${r.heartRate}bpm, 강도:${r.intensity}/5, 메모:${r.memo || '없음'})`
    ).join('\n');

    const prompt = `
너는 구글 스프레드시트와 연동된 전문 AI 스포츠 트레이너야.
사용자가 운동 기록 대시보드를 확인하고 있으며, 너는 최신 운동 기록(records)과 통계(summary) 데이터를 바탕으로 사용자의 운동 상태를 전문적으로 분석하고 동기부여를 주는 한 줄 맞춤형 코칭 피드백을 작성해야 해.

[사용자 운동 요약 통계]
- 총 운동 횟수: ${summaryInfo.totalWorkouts}회
- 총 누적 거리: ${summaryInfo.totalDistance}km
- 총 운동 시간: ${summaryInfo.totalDuration}분
- 이번 주 달린 거리: ${summaryInfo.thisWeekDistance}km (주간 목표: ${summaryInfo.weeklyGoal}km, 달성률: ${summaryInfo.goalAttainmentRate}%)
- 이번 달 누적 거리: ${summaryInfo.thisMonthDistance}km
- 평균 페이스: ${summaryInfo.averagePace}
- 평균 심박수: ${summaryInfo.averageHeartRate} bpm

[최근 운동 기록 내역]
${recentList || '(아직 기록된 운동이 없음)'}

[출력 규칙 - 엄격 준수!]
1. 어조: 친근하면서도 전문적인 피트니스 코치의 말투 (~하셨네요!, ~를 추천합니다!)
2. 길이: 웹 화면에 표시하기 좋게 반드시 '두 문장 이내(100자 내외)'로 짧게 작성할 것.
3. 주의: 답변에 마크다운 문법(**, #, 따옴표 등)을 일절 쓰지 말고 순수한 텍스트로만 출력할 것. 다른 인사말이나 군더더기 없이 두 문장의 코칭 텍스트만 출력할 것.
`;

    const aiRes = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    let feedback = aiRes.text?.trim() || '';
    // Strip markdown formatting and unnecessary quotes
    feedback = feedback.replace(/[*#_`"\\]/g, '').trim();

    // If empty or strange, fallback
    if (!feedback || feedback.length < 10) {
      feedback = generateFallbackFeedback(summaryInfo, records || []);
    }

    return res.json({ feedback, engine: 'gemini-3.8-flash' });
  } catch (error: any) {
    console.error('Gemini Coaching Feedback generation error:', error);
    const summary = req.body?.summary || {
      totalWorkouts: 0,
      totalDistance: 0,
      totalDuration: 0,
      thisWeekDistance: 0,
      thisMonthDistance: 0,
      averagePace: '-',
      averageHeartRate: 0,
      weeklyGoal: 20,
      goalAttainmentRate: 0,
    };
    const fallback = generateFallbackFeedback(summary, req.body?.records || []);
    return res.json({ feedback: fallback, engine: 'fallback' });
  }
});

// Full-stack Vite / Express integration
const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function startServer() {
  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Sports Trainer App running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
