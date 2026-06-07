import { useAuth } from "@clerk/tanstack-react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export function useSyncProject() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  return useMutation({
    mutationFn: async (repoId: string) => {
      const token = await getToken();
      const response = await axios.post(
        `${API_URL}/api/repositories/${repoId}/sync`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    },
    onSuccess: (data, repoId) => {
      queryClient.invalidateQueries({ queryKey: ["imported-projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-details", repoId] });
    },
  });
}
