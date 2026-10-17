import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  Clock,
  Gauge,
  Heart,
  FileText,
  Flame,
  Plus,
} from 'lucide-react';
import { WorkoutRecord } from '../types';

interface RecordListProps {
  records: WorkoutRecord[];
  onAddClick: () => void;
  onSelectSampleClick: () => void;
  isLiveMode: boolean;
}

export const RecordList: React.FC<RecordListProps> = ({
  records,
  onAddClick,
  onSelectSampleClick,
  isLiveMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'distance' | 'duration' | 'intensity'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Compute unique types for filter tabs
  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.type) set.add(r.type);
    });
    return Array.from(set);
  }, [records]);

  // Filter & Sort
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        // Type filter
        if (selectedType !== 'all' && r.type !== selectedType) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesType = r.type?.toLowerCase().includes(q);
          const matchesMemo = r.memo?.toLowerCase().includes(q);
          const matchesDate = r.date?.toLowerCase().includes(q);
          if (!matchesType && !matchesMemo && !matchesDate) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortBy];
        let valB: any = b[sortBy];

        if (sortBy === 'date') {
          valA = new Date(a.date).getTime();
          valB = new Date(b.date).getTime();
        } else {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
        }

        if (sortOrder === 'desc') {
          return valB > valA ? 1 : valB < valA ? -1 : 0;
        } else {
          return valA > valB ? 1 : valA < valB ? -1 : 0;
        }
      });
  }, [records, selectedType, searchQuery, sortBy, sortOrder]);

  const toggleSort = (field: 'date' | 'distance' | 'duration' | 'intensity') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const calculatePace = (dist: number, dur: number) => {
    if (dist > 0 && dur > 0) {
      const sec = (dur * 60) / dist;
      const min = Math.floor(sec / 60);
      const s = Math.round(sec % 60);
      return `${min}'${s < 10 ? '0' : ''}${s}"/km`;
    }
    return '-';
  };

  const getIntensityBadge = (int: number) => {
    const val = Number(int) || 3;
    if (val >= 4) {
      return {
        label: `강도 ${val} (고강도)`,
        style: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    } else if (val === 3) {
      return {
        label: `강도 ${val} (중강도)`,
        style: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    } else {
      return {
        label: `강도 ${val} (저강도)`,
        style: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }
  };

  const getTypeStyle = (type: string) => {
    if (type.includes('러닝') || type.includes('조깅')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (type.includes('사이클') || type.includes('자전거')) {
      return 'bg-teal-50 text-teal-700 border-teal-200';
    } else if (type.includes('웨이트') || type.includes('근력')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    } else if (type.includes('인터벌')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>최신 운동 기록 내역</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {filteredRecords.length}건
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            구글 스프레드시트 WebApp과 연동된 개별 세션 로그
          </p>
        </div>

        {/* Controls: Search & Add */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="날짜, 종목, 메모 검색..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition w-44 sm:w-56"
            />
          </div>

          <button
            onClick={onAddClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>새 기록 입력</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 sm:px-5 py-2.5 bg-slate-50/60 border-b border-slate-200/60 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" />
          종목:
        </span>
        <button
          onClick={() => setSelectedType('all')}
          className={`px-2.5 py-1 rounded-lg font-medium transition ${
            selectedType === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          전체 ({records.length})
        </button>
        {availableTypes.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedType(t)}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              selectedType === t
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Table or Empty State */}
      {filteredRecords.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 font-semibold select-none">
                <th
                  onClick={() => toggleSort('date')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>날짜</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-4">종목</th>
                <th
                  onClick={() => toggleSort('distance')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    <span>거리 (km)</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('duration')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>시간 (분)</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5" />
                    <span>페이스</span>
                  </div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" />
                    <span>평균 심박수</span>
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('intensity')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    <span>자각 강도</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>훈련 메모 / 특이사항</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((r, idx) => {
                const pace = calculatePace(r.distance, r.duration);
                const badge = getIntensityBadge(r.intensity);
                const typeStyle = getTypeStyle(r.type);

                return (
                  <tr
                    key={r.id || `${r.date}-${idx}`}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-slate-800 whitespace-nowrap">
                      {r.date}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${typeStyle}`}
                      >
                        {r.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {r.distance > 0 ? `${r.distance} km` : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      {r.duration}분
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-emerald-700 whitespace-nowrap">
                      {pace}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                      {r.heartRate > 0 ? `${r.heartRate} bpm` : '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${badge.style}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={r.memo}>
                      {r.memo || <span className="text-slate-300">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            {records.length === 0
              ? '현재 등록된 운동 기록이 없습니다'
              : '조건에 일치하는 기록이 없습니다'}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {records.length === 0
              ? isLiveMode
                ? '구글 스프레드시트가 비어있습니다. 샘플 데이터를 적용해 대시보드를 둘러보거나 새 기록을 추가해보세요.'
                : '새로운 운동을 기록해보세요.'
              : '검색어나 필터 조건을 변경해보세요.'}
          </p>

          {records.length === 0 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={onSelectSampleClick}
                className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition"
              >
                풍부한 샘플 데이터 불러오기
              </button>
              <button
                onClick={onAddClick}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
              >
                직접 운동 기록 작성
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
