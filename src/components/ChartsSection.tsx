import React, { useMemo } from 'react';
import { BarChart3, PieChart, Activity, Zap } from 'lucide-react';
import { WorkoutRecord } from '../types';

interface ChartsSectionProps {
  records: WorkoutRecord[];
  weeklyGoal: number;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  records,
  weeklyGoal = 20,
}) => {
  // 1. Calculate past 8 weeks data
  const weeklyData = useMemo(() => {
    const weeks: { label: string; dist: number; fullLabel: string }[] = [];
    const now = new Date();

    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      weeks.push({
        label,
        fullLabel: `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} 주차`,
        dist: 0,
      });
    }

    records.forEach((r) => {
      const dist = Number(r.distance) || 0;
      if (dist <= 0) return;
      const rDate = new Date(r.date);
      if (isNaN(rDate.getTime())) return;

      const diffDays = Math.floor(
        (now.getTime() - rDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const idx = 7 - Math.floor(diffDays / 7);
      if (idx >= 0 && idx < 8) {
        weeks[idx].dist += dist;
      }
    });

    return weeks.map((w) => ({
      ...w,
      dist: Math.round(w.dist * 10) / 10,
    }));
  }, [records]);

  // Max distance for bar scaling
  const maxWeeklyDist = useMemo(() => {
    const maxVal = Math.max(...weeklyData.map((w) => w.dist), weeklyGoal, 10);
    return Math.ceil(maxVal / 5) * 5;
  }, [weeklyData, weeklyGoal]);

  // 2. Workout Type Breakdown
  const typeDistribution = useMemo(() => {
    const counts: Record<string, { count: number; totalKm: number }> = {};
    records.forEach((r) => {
      const type = r.type || '기타';
      if (!counts[type]) counts[type] = { count: 0, totalKm: 0 };
      counts[type].count += 1;
      counts[type].totalKm += Number(r.distance) || 0;
    });

    const totalCount = records.length || 1;
    const colors = [
      'bg-emerald-500',
      'bg-teal-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-amber-500',
      'bg-rose-500',
    ];

    return Object.entries(counts).map(([type, val], idx) => ({
      type,
      count: val.count,
      totalKm: Math.round(val.totalKm * 10) / 10,
      percentage: Math.round((val.count / totalCount) * 100),
      color: colors[idx % colors.length],
    }));
  }, [records]);

  // 3. Heart Rate & Intensity Zones
  const intensityStats = useMemo(() => {
    let low = 0; // 1-2
    let mid = 0; // 3
    let high = 0; // 4-5
    records.forEach((r) => {
      const int = Number(r.intensity) || 3;
      if (int <= 2) low++;
      else if (int === 3) mid++;
      else high++;
    });
    return { low, mid, high, total: records.length || 1 };
  }, [records]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* 1. 주간 러닝 거리 추이 (2/3 width) */}
      <div className="lg:col-span-2 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>주간 유산소 거리 추이 (최근 8주)</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              주간 목표치({weeklyGoal}km) 대비 트레이닝 볼륨 변화
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
              <span>실제 거리 (km)</span>
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <span className="w-4 h-0.5 border-t border-dashed border-rose-400 inline-block" />
              <span>목표선 ({weeklyGoal}km)</span>
            </span>
          </div>
        </div>

        {/* Bar Chart Container */}
        <div className="relative h-52 sm:h-56 w-full pt-6 pb-6">
          {/* Goal Line */}
          <div
            className="absolute left-0 right-0 border-t border-dashed border-rose-400 z-10 flex items-center justify-end pr-2 pointer-events-none"
            style={{
              bottom: `${Math.min(
                (weeklyGoal / maxWeeklyDist) * 100,
                95
              )}%`,
            }}
          >
            <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
              목표 {weeklyGoal}km
            </span>
          </div>

          {/* Bars */}
          <div className="h-full flex items-end justify-between gap-2 sm:gap-4 px-2">
            {weeklyData.map((item, idx) => {
              const heightPercent =
                maxWeeklyDist > 0
                  ? Math.min((item.dist / maxWeeklyDist) * 100, 100)
                  : 0;
              const isCurrentWeek = idx === weeklyData.length - 1;

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative"
                >
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] font-medium py-1 px-2 rounded pointer-events-none whitespace-nowrap z-20 shadow-md">
                    {item.fullLabel}: {item.dist} km
                  </div>

                  {/* Value Above Bar */}
                  {item.dist > 0 && (
                    <span className="text-[10px] font-bold text-slate-600 mb-1 group-hover:text-emerald-600 transition">
                      {item.dist}
                    </span>
                  )}

                  {/* The Bar */}
                  <div className="w-full max-w-[34px] bg-slate-100 rounded-t-lg h-full flex items-end overflow-hidden p-0.5">
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        isCurrentWeek
                          ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-sm'
                          : 'bg-emerald-500/80 hover:bg-emerald-600'
                      }`}
                      style={{
                        height: `${Math.max(heightPercent, item.dist > 0 ? 8 : 0)}%`,
                      }}
                    />
                  </div>

                  {/* X Axis Label */}
                  <span
                    className={`text-[11px] mt-2 font-medium ${
                      isCurrentWeek
                        ? 'text-emerald-700 font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {records.length === 0 && (
          <div className="text-center py-2 text-xs text-slate-400">
            아직 구글 시트에 기록된 운동 데이터가 없습니다. 상단에서 샘플 데이터를 불러오거나 새 기록을 추가해보세요.
          </div>
        )}
      </div>

      {/* 2. 운동 종목 분포 & 자각 강도 요약 (1/3 width) */}
      <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-1">
            <PieChart className="w-4 h-4 text-teal-600" />
            <span>운동 종목별 분포</span>
          </h4>
          <p className="text-xs text-slate-500 mb-4">
            트레이닝 밸런스 및 다변화 분석
          </p>

          {typeDistribution.length > 0 ? (
            <div className="space-y-3">
              {typeDistribution.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${item.color}`}
                      />
                      {item.type}
                    </span>
                    <span className="text-slate-500 font-mono">
                      {item.count}회 ({item.percentage}%) / {item.totalKm}km
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400">
              운동 종목 데이터가 없습니다.
            </div>
          )}
        </div>

        {/* Intensity / RPE Gauge Breakdown */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>운동 자각 강도 (RPE) 비중</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800">
              <div className="text-[10px] text-emerald-600 font-medium">
                저강도(1-2)
              </div>
              <div className="font-bold text-sm mt-0.5">
                {intensityStats.low}회
              </div>
              <div className="text-[10px] text-slate-400">회복/유산소</div>
            </div>

            <div className="p-2 rounded-lg bg-blue-50 text-blue-800">
              <div className="text-[10px] text-blue-600 font-medium">
                중강도(3)
              </div>
              <div className="font-bold text-sm mt-0.5">
                {intensityStats.mid}회
              </div>
              <div className="text-[10px] text-slate-400">에어로빅 템포</div>
            </div>

            <div className="p-2 rounded-lg bg-rose-50 text-rose-800">
              <div className="text-[10px] text-rose-600 font-medium">
                고강도(4-5)
              </div>
              <div className="font-bold text-sm mt-0.5">
                {intensityStats.high}회
              </div>
              <div className="text-[10px] text-slate-400">역치/인터벌</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
