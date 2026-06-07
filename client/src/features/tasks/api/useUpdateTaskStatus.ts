import { useAuth } from '@clerk/tanstack-react-start'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

interface UpdateTaskParams {
  taskId: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  repoId: string;
}

export function useUpdateTaskStatus() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return useMutation({
    mutationFn: async ({ taskId, status }: UpdateTaskParams) => {
      const token = await getToken();
      const response = await axios.patch(
        `${API_URL}/api/repositories/tasks/${taskId}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.task;
    },
    onMutate: async ({ taskId, status, repoId }) => {
      await queryClient.cancelQueries({ queryKey: ['project-details', repoId] });
      const previousDetails = queryClient.getQueryData(['project-details', repoId]);

      queryClient.setQueryData(['project-details', repoId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.map((t: any) =>
            t.id === taskId ? { ...t, status } : t
          ),
        };
      });

      return { previousDetails };
    },
    onError: (_err, variables, context) => {
      if (context?.previousDetails) {
        queryClient.setQueryData(
          ['project-details', variables.repoId],
          context.previousDetails
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-details', variables.repoId] });
    },
  });
}
