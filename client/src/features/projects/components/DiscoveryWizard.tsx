import { useState } from 'react'
import { Search, Loader2, GitBranch, CheckCircle, ArrowRight } from 'lucide-react'
import { useUserGithubRepos } from '../api/useUserGithubRepos'
import { useImportedProjects } from '../api/useImportedProjects'
import { useImportProject } from '../api/useImportProject'

interface DiscoveryWizardProps {
  onImportSuccess: (importedRepoId: string) => void
}

export function DiscoveryWizard({ onImportSuccess }: DiscoveryWizardProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: githubRepos = [], isLoading: loadingRepos } = useUserGithubRepos()
  const { data: importedRepos = [] } = useImportedProjects()
  const importMutation = useImportProject()

  const filteredRepos = githubRepos.filter((repo: any) =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.owner.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleImport = async (repo: any) => {
    try {
      const newRepo = await importMutation.mutateAsync({
        githubRepoId: repo.id,
        name: repo.name,
        owner: repo.owner,
        description: repo.description,
        url: repo.url,
        isPrivate: repo.isPrivate,
        imageUrl: repo.ownerAvatarUrl,
      })
      onImportSuccess(newRepo.id)
    } catch (error) {
      console.error('Error importing project:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 text-left">
      <div className="flex flex-col gap-1">
        <h3 className="text-2xl font-extrabold tracking-tight text-foreground">Import a Repository</h3>
        <p className="text-muted-foreground text-sm">
          Search and select a repository from your GitHub account to stand up an automated project workspace.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <input
          type="text"
          placeholder="Search repository name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-muted/60 focus:border-primary focus:bg-muted/80 transition duration-150 text-sm placeholder:text-muted-foreground/30 text-foreground outline-none"
        />
      </div>

      {loadingRepos ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={36} className="animate-spin text-primary stroke-[1.5]" />
          <span className="text-sm text-muted-foreground">Retrieving repositories from GitHub...</span>
        </div>
      ) : filteredRepos.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3">
          <GitBranch size={32} className="text-muted-foreground/35 stroke-[1.5] self-center" />
          <span className="text-muted-foreground text-sm">
            {searchQuery ? 'No matching repositories found' : 'No repositories returned from your account'}
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRepos.map((repo: any) => {
            const isImported = importedRepos.some((i: any) => i.githubRepoId === repo.id)
            const isImporting = importMutation.isPending && importMutation.variables?.githubRepoId === repo.id

            return (
              <div
                key={repo.id}
                className="p-5 rounded-2xl border border-border bg-card/45 backdrop-blur-sm flex flex-col justify-between hover:border-accent transition duration-150"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={repo.ownerAvatarUrl}
                    alt={repo.owner}
                    className="w-10 h-10 rounded-lg bg-muted border border-border shrink-0 mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-foreground truncate leading-none">
                        {repo.name}
                      </h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        repo.isPrivate
                          ? 'text-purple-400 bg-purple-500/5 border-purple-500/20'
                          : 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20'
                      }`}>
                        {repo.isPrivate ? 'Private' : 'Public'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 truncate">
                      {repo.description || 'No description provided.'}
                    </p>
                    <span className="text-3xs text-muted-foreground/60 mt-3 block font-medium">
                      Owned by @{repo.owner}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between">
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:text-primary/90 font-semibold"
                  >
                    View on GitHub ↗
                  </a>

                  {isImported ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-500/5 border border-emerald-500/20">
                      <CheckCircle size={12} />
                      Imported
                    </span>
                  ) : (
                    <button
                      onClick={() => handleImport(repo)}
                      disabled={isImporting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-secondary border border-border text-secondary-foreground hover:border-accent hover:bg-secondary/90 transition duration-155 cursor-pointer"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          Import Project
                          <ArrowRight size={12} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
