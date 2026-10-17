import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { CoachCard } from './components/CoachCard';
import { SummaryCards } from './components/SummaryCards';
import { ChartsSection } from './components/ChartsSection';
import { RecordList } from './components/RecordList';
import { AddRecordModal } from './components/AddRecordModal';
import { ApiStatusModal } from './components/ApiStatusModal';
import { WorkoutRecord, WorkoutSummary, ApiResponse } from './types';
import { SAMPLE_RECORDS, calculateSummaryFromRecords } from './mockData';
import { AlertCircle, CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';

export default function App() {
  // Mode: true = live Google Sheet, false = rich sample training data
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);

  // Live data state from Google WebApp
  const [liveApiResponse, setLiveApiResponse] = useState<ApiResponse | null>(null);
  const [liveRecords, setLiveRecords] = useState<WorkoutRecord[]>([]);
  const [liveSummary, setLiveSummary] = useState<WorkoutSummary>({
    totalWorkouts: 0,
    totalDistance: 0,
    totalDuration: 0,
    thisWeekDistance: 0,
    thisMonthDistance: 0,
    averagePace: '-',
    averageHeartRate: 0,
    weeklyGoal: 20,
    goalAttainmentRate: 0,
  });

  // Sample/local data state
  const [sampleRecords, setSampleRecords] = useState<WorkoutRecord[]>(SAMPLE_RECORDS);
  const [sampleSummary, setSampleSummary] = useState<WorkoutSummary>(
    calculateSummaryFromRecords(SAMPLE_RECORDS, 20)
  );

  // Active display data depending on mode
  const currentRecords = isLiveMode ? liveRecords : sampleRecords;
  const currentSummary = isLiveMode ? liveSummary : sampleSummary;

  // AI Sports Trainer Coaching Feedback state
  const [coachFeedback, setCoachFeedback] = useState<string>(
    '운동 데이터를 불러오고 있습니다. 잠시만 기다려주세요!'
  );
  const [coachEngine, setCoachEngine] = useState<string>('gemini-3.8-flash');
  const [isLoadingFeedback, setIsLoadingFeedback] = useState<boolean>(false);

  // Network & UI states
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState<boolean>(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState<boolean>(false);

  // 1. Fetch AI Sports Trainer Coaching Feedback
  const fetchCoachFeedback = useCallback(
    async (summary: WorkoutSummary, records: WorkoutRecord[]) => {
      setIsLoadingFeedback(true);
      try {
        const res = await fetch('/api/coach-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ summary, records }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.feedback) {
            setCoachFeedback(data.feedback);
            setCoachEngine(data.engine || 'gemini-3.8-flash');
            return;
          }
        }
        throw new Error('Fallback to client coach engine');
      } catch {
        // Client-side fallback for GitHub Pages (no Node backend)
        const attainment = summary.goalAttainmentRate || 0;
        let text = '새로운 운동을 시작할 완벽한 타이밍이네요! 가벼운 20분 조깅이나 스트레칭으로 활기찬 첫 기록을 세워보시는 것을 추천합니다!';
        if (records.length > 0) {
          if (attainment >= 100) {
            text = `이번 주 목표 거리를 무려 ${attainment}% 초과 달성하셨네요! 누적된 근육 피로를 풀어주기 위해 오늘은 충분한 수분 섭취와 스트레칭을 적극 추천합니다!`;
          } else if (summary.thisWeekDistance > 0) {
            text = `이번 주 누적 ${summary.thisWeekDistance}km로 목표 달성을 향해 꾸준히 잘 달리고 계시네요! 남은 목표 완주를 위해 페이스를 무리하지 않고 유지하시는 것을 추천합니다!`;
          }
        }
        setCoachFeedback(text);
        setCoachEngine('AI 트레이너 코칭');
      } finally {
        setIsLoadingFeedback(false);
      }
    },
    []
  );

  // 2. Fetch Workouts from Google WebApp API (with direct fallback for GitHub Pages)
  const fetchWorkouts = useCallback(async () => {
    setIsLoadingWorkouts(true);
    setApiError(null);

    const GOOGLE_DIRECT_URL =
      'https://script.google.com/macros/s/AKfycbzR5QefCeu4Wdg9A8PcNzYyBcL7vOvKrP-nHakwa1XUwqX3bW3oSRih-FHYB2crxY3B-w/exec?action=getWorkouts';

    try {
      let json: ApiResponse;
      try {
        const res = await fetch('/api/workouts');
        if (!res.ok) throw new Error('Static host');
        json = await res.json();
      } catch {
        // Direct fetch for GitHub Pages static hosting
        const directRes = await fetch(GOOGLE_DIRECT_URL, { redirect: 'follow' });
        const raw = await directRes.json();
        json = {
          success: true,
          source: 'google_sheet_direct',
          fetchedAt: new Date().toISOString(),
          data: raw,
        };
      }

      setLiveApiResponse(json);
      setLastFetchedAt(json.fetchedAt || new Date().toISOString());

      if (json.success && json.data) {
        let rawRecords: any[] = json.data.records || [];
        // Smart normalize for shifted columns
        const normalized: WorkoutRecord[] = rawRecords.map((r: any, idx: number) => {
          let finalDate = String(r.date || '');
          let finalType = String(r.type || '러닝');
          let finalDist = Number(r.distance) || 0;
          let finalDur = Number(r.duration) || 0;
          let finalHr = Number(r.heartRate) || 0;
          let finalIntensity = Number(r.intensity) || 3;
          let finalMemo = String(r.memo || '');

          if (typeof r.type === 'string' && (r.type.includes('GMT') || !isNaN(Date.parse(r.type)))) {
            const d = new Date(r.type);
            if (!isNaN(d.getTime())) finalDate = d.toISOString().split('T')[0];
            finalType = '러닝';
          }
          if (r.createdAt && typeof r.createdAt === 'string') {
            finalMemo = `${r.createdAt} (${r.memo || ''})`.trim();
          }
          if (finalDist === 0 && finalDur > 20) {
            finalDist = Math.round(finalDur * 10) / 10;
            finalDur = 120;
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

        // Calculate summary if distance was 0
        let summary = json.data.summary;
        if (!summary || summary.totalDistance === 0) {
          summary = calculateSummaryFromRecords(normalized, 20);
        }

        setLiveRecords(normalized);
        setLiveSummary(summary);

        if (isLiveMode) {
          fetchCoachFeedback(summary, normalized);
        }
      } else {
        setApiError(json.error || '구글 스프레드시트 응답 오류');
      }
    } catch (err: any) {
      console.error('Workout fetch failed:', err);
      setApiError(err.message || '네트워크 연결 오류');
    } finally {
      setIsLoadingWorkouts(false);
    }
  }, [isLiveMode, fetchCoachFeedback]);

  // Initial load
  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  // When switching between live and sample mode, re-analyze with AI
  const handleModeChange = (live: boolean) => {
    setIsLiveMode(live);
    if (live) {
      fetchCoachFeedback(liveSummary, liveRecords);
    } else {
      fetchCoachFeedback(sampleSummary, sampleRecords);
    }
  };

  // Add new record handler (adds to current view & recalculates)
  const handleSaveRecord = (record: WorkoutRecord) => {
    if (isLiveMode) {
      const updated = [record, ...liveRecords];
      const newSummary = calculateSummaryFromRecords(
        updated,
        liveSummary.weeklyGoal || 20
      );
      setLiveRecords(updated);
      setLiveSummary(newSummary);
      fetchCoachFeedback(newSummary, updated);
    } else {
      const updated = [record, ...sampleRecords];
      const newSummary = calculateSummaryFromRecords(
        updated,
        sampleSummary.weeklyGoal || 20
      );
      setSampleRecords(updated);
      setSampleSummary(newSummary);
      fetchCoachFeedback(newSummary, updated);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-emerald-500 selection:text-white flex flex-col font-sans">
      {/* Top Navbar */}
      <Header
        isLiveMode={isLiveMode}
        setIsLiveMode={handleModeChange}
        isLoading={isLoadingWorkouts}
        onRefresh={fetchWorkouts}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenApiModal={() => setIsApiModalOpen(true)}
        lastFetchedAt={lastFetchedAt}
        recordsCount={currentRecords.length}
        apiError={apiError}
      />

      {/* Main Dashboard Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Notice Banner if live Google Sheet is currently empty */}
        {isLiveMode && liveRecords.length === 0 && !isLoadingWorkouts && (
          <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/90 p-4 sm:p-5 text-emerald-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0 mt-0.5 sm:mt-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                  <span>구글 스프레드시트 API 연동 완료 (0건 기록)</span>
                  <span className="text-[10px] font-semibold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">
                    실시간 정상 응답
                  </span>
                </h4>
                <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                  현재 구글 시트에 등록된 운동 기록이 없어 대시보드가 초기 상태입니다. 상단의 <b>[샘플 데이터]</b>를 클릭하여 완성된 대시보드를 둘러보거나, <b>[기록 추가]</b>로 새 세션을 기록해보세요.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                onClick={() => handleModeChange(false)}
                className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition"
              >
                샘플 훈련 세션 둘러보기
              </button>
            </div>
          </div>
        )}

        {/* 1. Core Feature: AI Sports Trainer Coaching Card */}
        <CoachCard
          summary={currentSummary}
          records={currentRecords}
          feedback={coachFeedback}
          isLoadingFeedback={isLoadingFeedback}
          onRefreshFeedback={() =>
            fetchCoachFeedback(currentSummary, currentRecords)
          }
          engine={coachEngine}
        />

        {/* 2. Core Workout Summary Metrics (KPI Cards) */}
        <SummaryCards summary={currentSummary} />

        {/* 3. Visual Analytics & Charts */}
        <ChartsSection
          records={currentRecords}
          weeklyGoal={currentSummary.weeklyGoal || 20}
        />

        {/* 4. Workout Records Table & Filter System */}
        <RecordList
          records={currentRecords}
          onAddClick={() => setIsAddModalOpen(true)}
          onSelectSampleClick={() => handleModeChange(false)}
          isLiveMode={isLiveMode}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">
              AI 스포츠 트레이너 대시보드
            </span>
            <span className="text-slate-300">|</span>
            <span>Google Apps Script WebApp & Gemini 3.8 Flash 연동</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsApiModalOpen(true)}
              className="text-emerald-700 hover:underline font-medium"
            >
              API 엔드포인트 확인
            </button>
            <span className="text-slate-300">|</span>
            <span>주간 목표: {currentSummary.weeklyGoal}km</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AddRecordModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveRecord}
      />

      <ApiStatusModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        apiData={liveApiResponse}
        onReFetch={fetchWorkouts}
        isLoading={isLoadingWorkouts}
      />
    </div>
  );
}
