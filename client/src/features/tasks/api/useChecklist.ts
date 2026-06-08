import { useAuth } from '@clerk/tanstack-react-start'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

interface CreateChecklistItemParams {
  issueId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  repoId: string;
}

interface UpdateChecklistItemParams {
  checklistId: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  status?: 'PENDING' | 'DONE';
  repoId: string;
}

interface DeleteChecklistItemParams {
  checklistId: string;
  repoId: string;
}

export function useCreateChecklistItem() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return useMutation({
    mutationFn: async ({ issueId, title, description, imageUrl }: CreateChecklistItemParams) => {
      const token = await getToken();
      const response = await axios.post(
        `${API_URL}/api/repositories/issues/${issueId}/checklists`,
        { title, description, imageUrl },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.checklist;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-details', variables.repoId] });
    },
  });
}

export function useUpdateChecklistItem() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return useMutation({
    mutationFn: async ({ checklistId, title, description, status, imageUrl }: UpdateChecklistItemParams) => {
      const token = await getToken();
      const response = await axios.patch(
        `${API_URL}/api/repositories/checklists/${checklistId}`,
        { title, description, status, imageUrl },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.checklist;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-details', variables.repoId] });
    },
  });
}

export function useDeleteChecklistItem() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return useMutation({
    mutationFn: async ({ checklistId }: DeleteChecklistItemParams) => {
      const token = await getToken();
      const response = await axios.delete(
        `${API_URL}/api/repositories/checklists/${checklistId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-details', variables.repoId] });
    },
  });
}
