import React, { useEffect, useState } from 'react'

const RecentHistory = () => {
  const [recentRepos, setRecentRepos] = useState([])

  useEffect(() => {
    // Load history from localStorage
    const history = JSON.parse(localStorage.getItem('repoHistory') || '[]')
    setRecentRepos(history)
  }, [])

  const handleImport = (repoId) => {
    window.open(`http://13.49.70.181:9001/p/${repoId}`, '_blank')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="recent-history-card">
      <h2 className="history-title">Recent Activity</h2>
      {recentRepos.length > 0 ? (
        <ul className="history-list">
          {recentRepos.map((repo, index) => (
            <li key={`${repo.id}-${index}`} className="history-item">
              <div className="history-repo-info">
                <img 
                  src={repo.owner.avatar_url} 
                  alt="" 
                  className="history-avatar"
                />
                <div className="history-details">
                  <div className="history-header">
                    <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                      {repo.name}
                    </a>
                    <button 
                      className="import-button small"
                      onClick={() => handleImport(repo.id)}
                    >
                      Import
                    </button>
                  </div>
                  <span className="history-timestamp">
                    Accessed on {formatDate(repo.accessedAt)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-history">No recent activity</p>
      )}
    </div>
  )
}

export default RecentHistory