import { useAuth } from '@clerk/tanstack-react-start'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

interface ImportRepoParams {
  githubRepoId: number;
  name: string;
  owner: string;
  description: string | null;
  url: string;
  isPrivate: boolean;
  imageUrl: string | null;
}

export function useImportProject() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return useMutation({
    mutationFn: async (params: ImportRepoParams) => {
      const token = await getToken();
      const response = await axios.post(
        `${API_URL}/api/repositories/import`,
        params,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.repository;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imported-projects'] });
    },
  });
}
