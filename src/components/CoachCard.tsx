import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  RefreshCw,
  Award,
  Zap,
  Heart,
  Quote,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import { WorkoutSummary, WorkoutRecord } from '../types';

interface CoachCardProps {
  summary: WorkoutSummary;
  records: WorkoutRecord[];
  feedback: string;
  isLoadingFeedback: boolean;
  onRefreshFeedback: () => void;
  engine?: string;
}

export const CoachCard: React.FC<CoachCardProps> = ({
  summary,
  records,
  feedback,
  isLoadingFeedback,
  onRefreshFeedback,
  engine = 'gemini-3.8-flash',
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSupported(true);
    }
  }, []);

  const handleSpeak = () => {
    if (!speechSupported || !feedback) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(feedback);
    utterance.lang = 'ko-KR';
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    // Find Korean voice if available
    const voices = window.speechSynthesis.getVoices();
    const koVoice = voices.find((v) => v.lang.startsWith('ko'));
    if (koVoice) {
      utterance.voice = koVoice;
    }

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  // Determine key physiological takeaway tags
  const attainment = summary.goalAttainmentRate || 0;
  let statusBadge = {
    text: '목표 순항 중',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  };
  let nextRecommendation = '가벼운 유산소 조깅 30분';

  if (records.length === 0) {
    statusBadge = {
      text: '새 훈련 대기',
      color: 'bg-slate-100 text-slate-700 border-slate-300',
    };
    nextRecommendation = '첫 20분 가벼운 러닝';
  } else if (attainment >= 100) {
    statusBadge = {
      text: '주간 목표 달성 완료',
      color: 'bg-purple-100 text-purple-800 border-purple-300',
    };
    nextRecommendation = '폼롤러 근막 이완 및 휴식';
  } else if (attainment >= 50) {
    statusBadge = {
      text: '안정적인 빌드업 구간',
      color: 'bg-blue-100 text-blue-800 border-blue-300',
    };
    nextRecommendation = '5km 템포 지속주';
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-6 text-white shadow-xl border border-emerald-900/50">
      {/* Background Decorative Accents */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-5">
        {/* Left: Coach Profile & Header */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-emerald-400">
                <Award className="w-7 h-7" />
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            </span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
                수석 AI 스포츠 트레이너
              </h2>
              <span
                className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge.color}`}
              >
                <Zap className="w-3 h-3 mr-1" />
                {statusBadge.text}
              </span>
              <span className="text-[11px] text-emerald-400 font-mono bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                {engine}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              구글 시트 실시간 운동 기록(records) 및 요약 통계(summary) 정밀 분석
            </p>
          </div>
        </div>

        {/* Right: Actions (Voice Listen & Regenerate) */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {speechSupported && (
            <button
              onClick={handleSpeak}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                isPlayingAudio
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/30 animate-pulse'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="음성으로 코칭 피드백 듣기 (TTS)"
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>음성 중지</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>코칭 음성 듣기</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onRefreshFeedback}
            disabled={isLoadingFeedback}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-sm transition disabled:opacity-60"
            title="AI 스포츠 트레이너에게 맞춤 피드백 다시 요청"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isLoadingFeedback ? 'animate-spin' : ''
              }`}
            />
            <span>{isLoadingFeedback ? '분석 중...' : '피드백 재분석'}</span>
          </button>
        </div>
      </div>

      {/* Main Feedback Content Box */}
      <div className="mt-5 relative rounded-xl bg-slate-800/90 border border-emerald-500/30 p-4 sm:p-5 shadow-inner">
        <Quote className="absolute top-3 right-4 w-8 h-8 text-emerald-500/15 pointer-events-none" />

        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>

          <div className="flex-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1.5 flex items-center gap-1.5">
              <span>오늘의 맞춤형 코칭 피드백</span>
              <span className="text-[10px] text-slate-400 font-normal">
                (두 문장 이내 전문 코칭)
              </span>
            </div>

            {isLoadingFeedback ? (
              <div className="flex items-center gap-2 py-1 text-slate-300 text-sm animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>
                  구글 시트의 최신 운동량과 심박수, 페이스를 종합 분석하고
                  있습니다...
                </span>
              </div>
            ) : (
              <p className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed tracking-normal select-text">
                {feedback}
              </p>
            )}
          </div>
        </div>

        {/* Quick Sports Physiology Indicators */}
        <div className="mt-4 pt-3.5 border-t border-slate-700/70 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <div className="truncate">
              <span className="text-slate-400">심폐 부하: </span>
              <span className="font-semibold text-slate-200">
                {summary.averageHeartRate > 0
                  ? `${summary.averageHeartRate} bpm (Zone 2~3)`
                  : '기록 대기 중'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <div className="truncate">
              <span className="text-slate-400">주간 페이스: </span>
              <span className="font-semibold text-slate-200">
                {summary.averagePace !== '-'
                  ? summary.averagePace
                  : '기록 없음'}
              </span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div className="truncate">
              <span className="text-slate-400">추천 세션: </span>
              <span className="font-semibold text-emerald-300">
                {nextRecommendation}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
