import React from 'react';
import {
  Activity,
  RefreshCw,
  Database,
  PlusCircle,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react';

interface HeaderProps {
  isLiveMode: boolean;
  setIsLiveMode: (live: boolean) => void;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenAddModal: () => void;
  onOpenApiModal: () => void;
  lastFetchedAt: string | null;
  recordsCount: number;
  apiError: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  isLiveMode,
  setIsLiveMode,
  isLoading,
  onRefresh,
  onOpenAddModal,
  onOpenApiModal,
  lastFetchedAt,
  recordsCount,
  apiError,
}) => {
  return (
    <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Main Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Activity className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  AI 스포츠 트레이너
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles className="w-3 h-3 mr-1 text-emerald-600" />
                  Gemini AI 코칭
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                구글 스프레드시트 실시간 연동 운동 기록 및 컨디션 분석 대시보드
              </p>
            </div>
          </div>

          {/* Action Hub & Google Sheet Connection Status */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Live API Status Pill */}
            <button
              onClick={onOpenApiModal}
              title="구글 웹앱 API 상태 및 원본 데이터 확인"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                apiError
                  ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                  : 'bg-emerald-50/80 border-emerald-200/90 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    apiError ? 'bg-rose-400' : 'bg-emerald-400'
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    apiError ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                ></span>
              </span>
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>구글 시트 {isLiveMode ? '실시간 연동' : '데모 모드'}</span>
              <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {/* Mode Switcher */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setIsLiveMode(true)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  isLiveMode
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                구글 시트 연동
              </button>
              <button
                type="button"
                onClick={() => setIsLiveMode(false)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  !isLiveMode
                    ? 'bg-white text-teal-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3 h-3 inline mr-1" />
                샘플 데이터 ({SAMPLE_LABEL})
              </button>
            </div>

            {/* Refresh / Fetch Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 shadow-xs disabled:opacity-60 transition"
              title="최신 운동 기록 다시 가져오기"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-emerald-600 ${
                  isLoading ? 'animate-spin' : ''
                }`}
              />
              <span>{isLoading ? '가져오는 중...' : '새로고침'}</span>
            </button>

            {/* Add Workout Button */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-xs transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>기록 추가</span>
            </button>
          </div>
        </div>

        {/* Sync Info Sub-bar */}
        <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>
                {isLiveMode
                  ? '구글 웹앱 API (AKfycb...KafASA) 정상 통신 중'
                  : '풍부한 샘플 훈련 세션 데이터 적용 중'}
              </span>
            </span>
            <span className="text-slate-300">|</span>
            <span>총 {recordsCount}건의 운동 기록 보유</span>
          </div>

          <div className="flex items-center gap-2">
            {lastFetchedAt && (
              <span>
                최근 동기화:{' '}
                {new Date(lastFetchedAt).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const SAMPLE_LABEL = '7개 훈련';
