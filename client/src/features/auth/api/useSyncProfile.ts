import { useAuth } from '@clerk/tanstack-react-start'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

export function useSyncProfile() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const response = await axios.post(
        `${API_URL}/api/auth/sync`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imported-projects'] });
      queryClient.invalidateQueries({ queryKey: ['github-repos'] });
    },
  });
}
