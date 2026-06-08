import { useAuth } from '@clerk/tanstack-react-start'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

interface UpdateIssueStatusParams {
  issueId: string;
  status: 'OPEN' | 'CLOSED';
  repoId: string;
}

export function useUpdateIssueStatus() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return useMutation({
    mutationFn: async ({ issueId, status }: UpdateIssueStatusParams) => {
      const token = await getToken();
      const response = await axios.patch(
        `${API_URL}/api/repositories/issues/${issueId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.issue;
    },
    onMutate: async ({ issueId, status, repoId }) => {
      await queryClient.cancelQueries({ queryKey: ['project-details', repoId] });
      const previousDetails = queryClient.getQueryData(['project-details', repoId]);

      queryClient.setQueryData(['project-details', repoId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          issues: old.issues.map((i: any) =>
            i.id === issueId ? { ...i, status } : i
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
      queryClient.invalidateQueries({ queryKey: ['imported-projects'] });
    },
  });
}
