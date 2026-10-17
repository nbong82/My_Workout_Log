export interface WorkoutRecord {
  id?: string;
  date: string;
  type: string;
  distance: number;
  duration: number;
  heartRate: number;
  intensity: number; // 1 to 5
  memo: string;
}

export interface WorkoutSummary {
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

export interface ApiResponse {
  success: boolean;
  source: string;
  fetchedAt: string;
  data: {
    records: WorkoutRecord[];
    summary: WorkoutSummary;
  };
  error?: string;
}

export interface CoachFeedbackResponse {
  feedback: string;
  engine: string;
}
