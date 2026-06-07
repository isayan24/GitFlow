import { useAuth } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function useImportedProjects(enabled: boolean = true) {
  const { getToken, isSignedIn } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  return useQuery({
    queryKey: ["imported-projects"],
    queryFn: async () => {
      const token = await getToken();
      const response = await axios.get(`${API_URL}/api/repositories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.repositories || [];
    },
    enabled: isSignedIn && enabled,
  });
}
