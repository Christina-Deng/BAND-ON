export interface PracticeLog {
  id: string;
  bandId: string;
  userId: string;
  date: string;
  durationMinutes: number;
  note: string | null;
  audioUrl: string | null;
  user: { id: string; displayName: string };
}

export interface TodayMemberStatus {
  userId: string;
  displayName: string;
  instrument: string;
  skillLevel: number;
  profileComplete: boolean;
  checkedIn: boolean;
  durationMinutes: number | null;
  note: string | null;
  audioUrl: string | null;
}

export interface PersonalPracticeStats {
  streakDays: number;
  weekMinutes: number;
  weekCheckInDays: number;
  monthMinutes: number;
  monthCheckInDays: number;
}

export interface BandPracticeStats {
  teamToday: {
    checkedIn: number;
    total: number;
    totalMinutes: number;
    allCheckedIn: boolean;
  };
  weekMinutes: number;
  weekCheckInCount: number;
  weekMostActive: { displayName: string; checkInDays: number } | null;
}

export interface PracticeStats {
  personal: PersonalPracticeStats;
  band: BandPracticeStats;
}
