import { useAuth } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface DashboardStats {
  languages: Record<string, number>;
  commitActivity: {
    week: number;
    days: number[];
    total: number;
  }[];
  issues: {
    open: number;
    closed: number;
    avgResolutionDays: number;
  };
  radarProfile: {
    feature: number;
    fix: number;
    refactor: number;
    test: number;
    docs: number;
    chore: number;
  };
  punchCard: {
    day: number;
    hour: number;
    count: number;
  }[];
  streak: {
    current: number;
    longest: number;
  };
  leaderboard: {
    repoId: string;
    repoName: string;
    commits: number;
  }[];
}

export function useDashboardStats(enabled: boolean = true) {
  const { getToken, isSignedIn } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  return useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const token = await getToken();
      const response = await axios.get(`${API_URL}/api/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.stats;
    },
    enabled: isSignedIn && enabled,
  });
}
