import { useAuth } from '@clerk/tanstack-react-start'
import { useInfiniteQuery } from '@tanstack/react-query'
import axios from 'axios'

export function useUserGithubRepos(searchQuery: string = '', enabled: boolean = true) {
  const { getToken, isSignedIn } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return useInfiniteQuery({
    queryKey: ['github-repos', searchQuery],
    queryFn: async ({ pageParam = 1 }) => {
      const token = await getToken();
      const response = await axios.get(`${API_URL}/api/github/repos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: pageParam,
          per_page: 20,
          search: searchQuery,
        },
      });
      return response.data.repositories || [];
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 20 ? allPages.length + 1 : undefined;
    },
    enabled: isSignedIn && enabled,
  });
}
