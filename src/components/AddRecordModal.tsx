import React, { useState } from 'react';
import { X, Calendar, Activity, Clock, Heart, Flame, FileText, Footprints } from 'lucide-react';
import { WorkoutRecord } from '../types';

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: WorkoutRecord) => void;
}

export const AddRecordModal: React.FC<AddRecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [type, setType] = useState('러닝');
  const [distance, setDistance] = useState<string>('5.0');
  const [duration, setDuration] = useState<string>('28');
  const [heartRate, setHeartRate] = useState<string>('148');
  const [intensity, setIntensity] = useState<number>(3);
  const [memo, setMemo] = useState('');

  if (!isOpen) return null;

  // Live Pace Calculation
  const distNum = parseFloat(distance) || 0;
  const durNum = parseFloat(duration) || 0;
  let calculatedPace = '-';
  if (distNum > 0 && durNum > 0) {
    const sec = (durNum * 60) / distNum;
    const min = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    calculatedPace = `${min}'${s < 10 ? '0' : ''}${s}"/km`;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: WorkoutRecord = {
      id: `custom-${Date.now()}`,
      date,
      type,
      distance: distNum,
      duration: durNum,
      heartRate: parseInt(heartRate, 10) || 0,
      intensity,
      memo: memo.trim(),
    };
    onSave(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                새 운동 세션 기록
              </h3>
              <p className="text-xs text-slate-500">
                운동 기록 추가 후 AI 트레이너가 실시간 맞춤 피드백을 생성합니다
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                날짜
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                운동 종목
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              >
                <option value="러닝">러닝 (Running)</option>
                <option value="조깅">조깅 (Jogging)</option>
                <option value="인터벌 러닝">인터벌 러닝 (Intervals)</option>
                <option value="사이클">사이클 (Cycling)</option>
                <option value="웨이트">웨이트 트레이닝 (Strength)</option>
                <option value="수영">수영 (Swimming)</option>
                <option value="등산">등산 (Hiking)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Footprints className="w-3.5 h-3.5 text-slate-400" />
                거리 (km)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="예: 5.2"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                소요 시간 (분)
              </label>
              <input
                type="number"
                min="1"
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="예: 30"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Real-time pace preview */}
          <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-100 flex items-center justify-between text-xs">
            <span className="text-emerald-800 font-medium">자동 환산 페이스:</span>
            <span className="font-mono font-bold text-emerald-700 text-sm">
              {calculatedPace}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                평균 심박수 (bpm)
              </label>
              <input
                type="number"
                min="40"
                max="220"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                placeholder="예: 152"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                운동 자각 강도 (1~5점)
              </label>
              <div className="flex items-center gap-1.5 mt-1">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setIntensity(lvl)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${
                      intensity === lvl
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              훈련 메모 / 코스 및 컨디션
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="예: 한강 코스 역풍, 후반부 빌드업 성공"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl shadow-xs transition"
            >
              기록 저장 & AI 피드백 갱신
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
