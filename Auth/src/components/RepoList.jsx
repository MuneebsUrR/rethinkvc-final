import React, { useState } from 'react'
import SearchBar from './SearchBar'

const RepoList = ({ repos }) => {
  const [searchTerm, setSearchTerm] = useState('')
  console.log(repos)

  const filteredRepos = repos.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleImport = (repo) => {
    // Save to history in localStorage
    const history = JSON.parse(localStorage.getItem('repoHistory') || '[]')
    const newHistory = [
      { ...repo, accessedAt: new Date().toISOString() },
      ...history.filter(r => r.id !== repo.id)
    ].slice(0, 10) // Keep only last 10 items
    
    localStorage.setItem('repoHistory', JSON.stringify(newHistory))
    
    // Navigate to etherpad
    window.open(`http://0.0.0.0:9001/p/${repo.id}`, '_blank')
  }

  // Format date to be more readable
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="repos-container">
      <SearchBar onSearch={setSearchTerm} />
      <div className="main-content">
        <div className="repos-list-vertical">
          {filteredRepos.map(repo => (
            <div key={repo.id} className="repo-item">
              <div className="repo-content">
                <div className="repo-main-info">
                  <div className="repo-header">
                    <div className="repo-title-section">
                      <img 
                        src={repo.owner.avatar_url} 
                        alt={repo.owner.login}
                        className="owner-avatar"
                      />
                      <h3>
                        <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                          {repo.name}
                        </a>
                      </h3>
                      {repo.private && <span className="private-badge">Private</span>}
                    </div>
                    <div className="repo-actions">
                      <button 
                        className="import-button"
                        onClick={() => handleImport(repo)}
                      >
                        Import
                      </button>
                    </div>
                  </div>
                  
                  {repo.description && (
                    <p className="repo-description">{repo.description}</p>
                  )}
                  
                  <div className="repo-meta">
                    {repo.language && (
                      <span className="meta-item">
                        <span className="language-dot"></span>
                        {repo.language}
                      </span>
                    )}
                    {repo.stargazers_count > 0 && (
                      <span className="meta-item">
                        ⭐ {repo.stargazers_count}
                      </span>
                    )}
                    {repo.forks_count > 0 && (
                      <span className="meta-item">
                        🔱 {repo.forks_count}
                      </span>
                    )}
                    <span className="meta-item">
                      Created by <a href={repo.owner.html_url} target="_blank" rel="noopener noreferrer">{repo.owner.login}</a>
                    </span>
                    <span className="meta-item">
                      Updated on {formatDate(repo.updated_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RepoList
