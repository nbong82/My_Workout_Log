import React from 'react';
import {
  Flame,
  Gauge,
  Timer,
  Heart,
  Calendar,
  Footprints,
  Target,
  Trophy,
} from 'lucide-react';
import { WorkoutSummary } from '../types';

interface SummaryCardsProps {
  summary: WorkoutSummary;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  // Format duration into hours and minutes
  const formatDuration = (mins: number) => {
    if (!mins || mins === 0) return '0분';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}분`;
    return `${h}시간 ${m > 0 ? `${m}분` : ''}`;
  };

  // Estimate calories burned (running: ~65 kcal per km, or 9 kcal per minute)
  const estimatedCalories = Math.round(
    summary.totalDistance > 0
      ? summary.totalDistance * 68
      : summary.totalDuration * 8.5
  );

  const attainment = summary.goalAttainmentRate || 0;
  const progressPercent = Math.min(attainment, 100);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. 이번 주 달린 거리 & 주간 목표 (Featured Big Card) */}
      <div className="col-span-2 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                이번 주 달린 거리
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {summary.thisWeekDistance}{' '}
                <span className="text-sm font-semibold text-slate-500">km</span>
              </h3>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400">주간 목표</span>
            <div className="text-sm font-bold text-slate-700">
              {summary.weeklyGoal} km
            </div>
            <span
              className={`inline-flex items-center px-2 py-0.5 mt-0.5 rounded-full text-[11px] font-bold ${
                attainment >= 100
                  ? 'bg-emerald-100 text-emerald-700'
                  : attainment >= 50
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {attainment}% 달성
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1">
            <span>목표 달성률</span>
            <span>
              {summary.thisWeekDistance} / {summary.weeklyGoal} km
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                attainment >= 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. 총 누적 거리 */}
      <div className="rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">총 누적 거리</span>
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
            <Footprints className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {summary.totalDistance}{' '}
            <span className="text-xs font-semibold text-slate-500">km</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>이번 달: {summary.thisMonthDistance} km</span>
          </div>
        </div>
      </div>

      {/* 3. 총 운동 횟수 & 시간 */}
      <div className="rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">총 운동 기록</span>
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Trophy className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {summary.totalWorkouts}{' '}
            <span className="text-xs font-semibold text-slate-500">회</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <Timer className="w-3 h-3 text-slate-400" />
            <span>총 {formatDuration(summary.totalDuration)}</span>
          </div>
        </div>
      </div>

      {/* 4. 평균 페이스 */}
      <div className="rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">평균 페이스</span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Gauge className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            {summary.averagePace}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            러닝 및 조깅 속도 기준
          </div>
        </div>
      </div>

      {/* 5. 평균 심박수 */}
      <div className="rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">평균 심박수</span>
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <Heart className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {summary.averageHeartRate > 0 ? (
              <>
                {summary.averageHeartRate}{' '}
                <span className="text-xs font-semibold text-slate-500">bpm</span>
              </>
            ) : (
              <span className="text-lg font-normal text-slate-400">-</span>
            )}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {summary.averageHeartRate > 0 ? 'Zone 2-3 에어로빅 존' : '기록 없음'}
          </div>
        </div>
      </div>

      {/* 6. 소모 칼로리 추정 */}
      <div className="col-span-2 rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">
              총 누적 에너지 소비량
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {estimatedCalories.toLocaleString()}{' '}
              <span className="text-xs font-semibold text-slate-500">kcal</span>
            </div>
          </div>
        </div>
        <div className="text-right text-[11px] text-slate-500 hidden sm:block">
          <div>신체 대사 활성화 및 기초체력 증진</div>
          <div className="text-emerald-600 font-semibold mt-0.5">
            심폐 지구력 유지 중
          </div>
        </div>
      </div>
    </div>
  );
};
