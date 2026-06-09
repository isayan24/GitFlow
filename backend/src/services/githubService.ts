import axios from "axios";

const GITHUB_API_URL = "https://api.github.com";

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
  language?: string | null;
}

export interface GitHubIssueResponse {
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
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
   * Fetches the repositories belonging to the authenticated GitHub user, optionally filtered by search query
   */
  async fetchUserRepos(
    token: string,
    page: number = 1,
    perPage: number = 20,
    search?: string,
  ): Promise<GitHubRepoResponse[]> {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    };

    if (search?.trim()) {
      try {
        const userRes = await axios.get<{ login: string }>(`${GITHUB_API_URL}/user`, config);
        const username = userRes.data.login;

        const orgsRes = await axios.get<Array<{ login: string }>>(`${GITHUB_API_URL}/user/orgs`, config);
        const scopes = [username, ...orgsRes.data.map((o) => o.login)];

        const results = await Promise.all(
          scopes.map(async (scope) => {
            try {
              const res = await axios.get<{ items: GitHubRepoResponse[] }>(
                `${GITHUB_API_URL}/search/repositories`,
                {
                  ...config,
                  params: {
                    q: `${search.trim()} user:${scope}`,
                    page,
                    per_page: perPage,
                  },
                },
              );
              return res.data.items || [];
            } catch (err) {
              console.error(`⚠️ Failed to search repos in scope ${scope}:`, err);
              return [];
            }
          }),
        );
        return results.flat();
      } catch (err) {
        console.error("⚠️ Failed searching GitHub repos, falling back to all repos list:", err);
      }
    }

    const response = await axios.get<GitHubRepoResponse[]>(
      `${GITHUB_API_URL}/user/repos`,
      {
        ...config,
        params: {
          sort: "updated",
          page,
          per_page: perPage,
        },
      },
    );
    return response.data;
  },

  /**
   * Fetches issues and pull requests for a specific repository
   */
  async fetchRepoIssues(
    token: string,
    owner: string,
    repo: string,
  ): Promise<GitHubIssueResponse[]> {
    const response = await axios.get<GitHubIssueResponse[]>(
      `${GITHUB_API_URL}/repos/${owner}/${repo}/issues`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
        params: {
          state: "all",
          per_page: 100,
        },
      },
    );
    return response.data;
  },

  /**
   * Fetches commit activity stats for a specific repository (last 52 weeks)
   */
  async fetchRepoCommitActivity(
    token: string,
    owner: string,
    repo: string,
  ): Promise<GitHubCommitActivityResponse[]> {
    const maxRetries = 5;
    const delayMs = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const response = await axios.get<GitHubCommitActivityResponse[]>(
        `${GITHUB_API_URL}/repos/${owner}/${repo}/stats/commit_activity`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
          },
        },
      );

      if (response.status === 200) {
        // Statistics are ready, return them
        return response.data || [];
      }

      if (response.status === 202) {
        console.warn(
          `⚠️ GitHub statistics for ${owner}/${repo} are currently calculating (status 202). Waiting ${delayMs}ms before retry...`,
        );
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    console.warn(
      `❌ Failed to retrieve calculated commit activity statistics for ${owner}/${repo} after ${maxRetries} retries.`,
    );
    return [];
  },

  /**
   * Fetches metadata for a specific repository to verify existence and access
   */
  async fetchRepoMetadata(
    token: string,
    owner: string,
    repo: string,
  ): Promise<GitHubRepoResponse> {
    const response = await axios.get<GitHubRepoResponse>(
      `${GITHUB_API_URL}/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      },
    );
    return response.data;
  },

  /**
   * Creates an issue in a GitHub repository
   */
  async createIssue(
    token: string,
    owner: string,
    repo: string,
    title: string,
    body: string | null,
  ): Promise<GitHubIssueResponse> {
    const response = await axios.post<GitHubIssueResponse>(
      `${GITHUB_API_URL}/repos/${owner}/${repo}/issues`,
      { title, body },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      },
    );
    return response.data;
  },

  /**
   * Updates an issue's state (open/closed) in a GitHub repository
   */
  async updateIssueState(
    token: string,
    owner: string,
    repo: string,
    issueNumber: number,
    state: "open" | "closed",
  ): Promise<GitHubIssueResponse> {
    const response = await axios.patch<GitHubIssueResponse>(
      `${GITHUB_API_URL}/repos/${owner}/${repo}/issues/${issueNumber}`,
      { state },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      },
    );
    return response.data;
  },

  /**
   * Detects the tech stack of a repository by inspecting its root files and package.json if present
   */
  async detectTechStack(
    token: string,
    owner: string,
    repo: string,
  ): Promise<string | null> {
    try {
      // 1. Fetch root contents
      const response = await axios.get<Array<{ name: string; type: string }>>(
        `${GITHUB_API_URL}/repos/${owner}/${repo}/contents`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
          },
        },
      );
      const files = response.data || [];
      const fileNames = files.map((f) => f.name);

      // Check for Go
      if (fileNames.includes("go.mod")) {
        return "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg";
      }
      // Check for Rust
      if (fileNames.includes("Cargo.toml")) {
        return "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-original.svg";
      }
      // Check for Python
      if (
        fileNames.includes("requirements.txt") ||
        fileNames.includes("pyproject.toml") ||
        fileNames.includes("Pipfile")
      ) {
        return "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg";
      }

      // Check for Node/JS/TS (including monorepo paths)
      const pathsToCheck = [
        "package.json",
        "client/package.json",
        "frontend/package.json",
        "apps/client/package.json",
        "apps/frontend/package.json"
      ];

      for (const p of pathsToCheck) {
        const topDir = p.split("/")[0];
        if (topDir !== "package.json" && !fileNames.includes(topDir)) {
          continue;
        }

        try {
          const pkgResponse = await axios.get<{ content: string }>(
            `${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${p}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json",
              },
            },
          );
          if (pkgResponse.data?.content) {
            const decoded = Buffer.from(
              pkgResponse.data.content,
              "base64",
            ).toString("utf-8");
            const pkg = JSON.parse(decoded);
            const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

            if (deps.next) {
              return "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg";
            }
            if (deps.react) {
              return "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg";
            }
            if (deps.typescript) {
              return "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg";
            }
            return "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg";
          }
        } catch (e) {
          // Expected 404s for non-existing files
        }
      }

      // Pure HTML/CSS/JS fallback
      if (fileNames.includes("index.html")) {
        return "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg";
      }
    } catch (err) {
      console.error("⚠️ Failed to detect tech stack:", err);
    }
    return null;
  },

  /**
   * Fetches commits for a specific repository within a date range
   */
  async fetchRepoCommits(
    token: string,
    owner: string,
    repo: string,
    since: string,
    until: string,
  ): Promise<any[]> {
    const response = await axios.get<any[]>(
      `${GITHUB_API_URL}/repos/${owner}/${repo}/commits`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
        params: {
          since,
          until,
          per_page: 100,
        },
      },
    );
    return response.data;
  },

  /**
   * Fetches languages used in a specific repository
   */
  async fetchRepoLanguages(
    token: string,
    owner: string,
    repo: string,
  ): Promise<Record<string, number>> {
    const response = await axios.get<Record<string, number>>(
      `${GITHUB_API_URL}/repos/${owner}/${repo}/languages`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      },
    );
    return response.data;
  },

  /**
   * Fetches the most recent commits for a repository
   */
  async fetchRecentCommits(
    token: string,
    owner: string,
    repo: string,
    perPage: number = 30,
  ): Promise<any[]> {
    const response = await axios.get<any[]>(
      `${GITHUB_API_URL}/repos/${owner}/${repo}/commits`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
        params: {
          per_page: perPage,
        },
      },
    );
    return response.data;
  },
};
