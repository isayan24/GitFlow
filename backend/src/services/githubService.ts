import axios from 'axios';

const GITHUB_API_URL = 'https://api.github.com';

export interface GitHubRepoResponse {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface GitHubIssueResponse {
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  html_url: string;
  pull_request?: object;
  created_at: string;
  updated_at: string;
}

export interface GitHubCommitActivityResponse {
  days: number[];
  total: number;
  week: number;
}

/**
 * Service to interact with the GitHub REST API
 */
export const githubService = {
  /**
   * Fetches the repositories belonging to the authenticated GitHub user
   */
  async fetchUserRepos(token: string): Promise<GitHubRepoResponse[]> {
    const response = await axios.get<GitHubRepoResponse[]>(`${GITHUB_API_URL}/user/repos`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
      params: {
        sort: 'updated',
        per_page: 100,
      },
    });
    return response.data;
  },

  /**
   * Fetches issues and pull requests for a specific repository
   */
  async fetchRepoIssues(
    token: string,
    owner: string,
    repo: string
  ): Promise<GitHubIssueResponse[]> {
    const response = await axios.get<GitHubIssueResponse[]>(
      `${GITHUB_API_URL}/repos/${owner}/${repo}/issues`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
        },
        params: {
          state: 'all',
          per_page: 100,
        },
      }
    );
    return response.data;
  },

  /**
   * Fetches commit activity stats for a specific repository (last 52 weeks)
   */
  async fetchRepoCommitActivity(
    token: string,
    owner: string,
    repo: string
  ): Promise<GitHubCommitActivityResponse[]> {
    const maxRetries = 5;
    const delayMs = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`🐙 Fetching commit activity for ${owner}/${repo} (attempt ${attempt}/${maxRetries})...`);
      const response = await axios.get<GitHubCommitActivityResponse[]>(
        `${GITHUB_API_URL}/repos/${owner}/${repo}/stats/commit_activity`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
          },
        }
      );

      if (response.status === 200) {
        // Statistics are ready, return them
        return response.data || [];
      }

      if (response.status === 202) {
        console.warn(`⚠️ GitHub statistics for ${owner}/${repo} are currently calculating (status 202). Waiting ${delayMs}ms before retry...`);
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    console.warn(`❌ Failed to retrieve calculated commit activity statistics for ${owner}/${repo} after ${maxRetries} retries.`);
    return [];
  },

  /**
   * Fetches metadata for a specific repository to verify existence and access
   */
  async fetchRepoMetadata(
    token: string,
    owner: string,
    repo: string
  ): Promise<GitHubRepoResponse> {
    const response = await axios.get<GitHubRepoResponse>(
      `${GITHUB_API_URL}/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );
    return response.data;
  },
};
