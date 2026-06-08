import { useAuth } from '@clerk/tanstack-react-start'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

interface CreateIssueParams {
  repositoryId: string;
  title: string;
  description: string;
  type: 'MANUAL' | 'GITHUB_ISSUE';
  status?: 'OPEN' | 'CLOSED';
}

export function useCreateIssue() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return useMutation({
    mutationFn: async ({ repositoryId, title, description, type, status }: CreateIssueParams) => {
      const token = await getToken();
      const response = await axios.post(
        `${API_URL}/api/repositories/${repositoryId}/issues`,
        { title, description, type, status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.issue;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-details', variables.repositoryId] });
      queryClient.invalidateQueries({ queryKey: ['imported-projects'] });
    },
  });
}
