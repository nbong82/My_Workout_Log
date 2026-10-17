import { WorkoutRecord, WorkoutSummary } from './types';

export const SAMPLE_RECORDS: WorkoutRecord[] = [
  {
    id: 'rec-1',
    date: '2026-10-16',
    type: '러닝',
    distance: 7.2,
    duration: 38,
    heartRate: 152,
    intensity: 4,
    memo: '한강 달리기 코스, 후반부 빌드업 성공',
  },
  {
    id: 'rec-2',
    date: '2026-10-14',
    type: '인터벌 러닝',
    distance: 5.0,
    duration: 27,
    heartRate: 168,
    intensity: 5,
    memo: '400m 6세트 인터벌 트레이닝, 호흡 가쁨',
  },
  {
    id: 'rec-3',
    date: '2026-10-12',
    type: '조깅',
    distance: 4.5,
    duration: 26,
    heartRate: 135,
    intensity: 2,
    memo: '퇴근 후 가벼운 리커버리 조깅',
  },
  {
    id: 'rec-4',
    date: '2026-10-10',
    type: '러닝',
    distance: 10.0,
    duration: 54,
    heartRate: 156,
    intensity: 4,
    memo: '주말 10km 지속주 완주, 페이스 안정적',
  },
  {
    id: 'rec-5',
    date: '2026-10-08',
    type: '웨이트',
    distance: 0,
    duration: 50,
    heartRate: 124,
    intensity: 4,
    memo: '하체 스쿼트 및 코어 보강 운동',
  },
  {
    id: 'rec-6',
    date: '2026-10-05',
    type: '사이클',
    distance: 18.5,
    duration: 48,
    heartRate: 138,
    intensity: 3,
    memo: '탄천 자전거 전용도로 유산소 라이딩',
  },
  {
    id: 'rec-7',
    date: '2026-10-02',
    type: '러닝',
    distance: 6.0,
    duration: 32,
    heartRate: 148,
    intensity: 3,
    memo: '남산 순환코스 완만한 경사로 러닝',
  },
];

export function calculateSummaryFromRecords(records: WorkoutRecord[], weeklyGoal = 20): WorkoutSummary {
  if (!records || records.length === 0) {
    return {
      totalWorkouts: 0,
      totalDistance: 0,
      totalDuration: 0,
      thisWeekDistance: 0,
      thisMonthDistance: 0,
      averagePace: '-',
      averageHeartRate: 0,
      weeklyGoal,
      goalAttainmentRate: 0,
    };
  }

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let totalDist = 0;
  let totalDur = 0;
  let runningDist = 0;
  let runningDur = 0;
  let thisWeekDist = 0;
  let thisMonthDist = 0;
  let hrSum = 0;
  let hrCount = 0;

  records.forEach((r) => {
    const dist = Number(r.distance) || 0;
    const dur = Number(r.duration) || 0;
    const hr = Number(r.heartRate) || 0;
    const rDate = new Date(r.date);

    totalDist += dist;
    totalDur += dur;

    if (dist > 0 && dur > 0) {
      runningDist += dist;
      runningDur += dur;
    }

    if (rDate >= oneWeekAgo && dist > 0) {
      thisWeekDist += dist;
    }

    if (rDate >= startOfMonth && dist > 0) {
      thisMonthDist += dist;
    }

    if (hr > 0) {
      hrSum += hr;
      hrCount++;
    }
  });

  // Calculate Pace
  let averagePace = '-';
  if (runningDist > 0 && runningDur > 0) {
    const totalSec = (runningDur * 60) / runningDist;
    const min = Math.floor(totalSec / 60);
    const sec = Math.round(totalSec % 60);
    averagePace = `${min}'${sec < 10 ? '0' : ''}${sec}"/km`;
  }

  const totalWorkouts = records.length;
  const averageHeartRate = hrCount > 0 ? Math.round(hrSum / hrCount) : 0;
  const roundedWeekDist = Math.round(thisWeekDist * 10) / 10;
  const attainment = weeklyGoal > 0 ? Math.round((roundedWeekDist / weeklyGoal) * 100) : 0;

  return {
    totalWorkouts,
    totalDistance: Math.round(totalDist * 10) / 10,
    totalDuration: Math.round(totalDur),
    thisWeekDistance: roundedWeekDist,
    thisMonthDistance: Math.round(thisMonthDist * 10) / 10,
    averagePace,
    averageHeartRate,
    weeklyGoal,
    goalAttainmentRate: attainment,
  };
}

export const SAMPLE_SUMMARY: WorkoutSummary = calculateSummaryFromRecords(SAMPLE_RECORDS, 20);
