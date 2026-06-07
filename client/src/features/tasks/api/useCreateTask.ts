import { useAuth } from '@clerk/tanstack-react-start'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

interface CreateTaskParams {
  repoId: string;
  title: string;
  description: string | null;
  status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
}

export function useCreateTask() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return useMutation({
    mutationFn: async ({ repoId, title, description, status }: CreateTaskParams) => {
      const token = await getToken();
      const response = await axios.post(
        `${API_URL}/api/repositories/${repoId}/tasks`,
        { title, description, status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.task;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-details', variables.repoId] });
      queryClient.invalidateQueries({ queryKey: ['imported-projects'] });
    },
  });
}
