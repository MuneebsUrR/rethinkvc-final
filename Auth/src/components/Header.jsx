import React from 'react'

const Header = ({ user, onLogout }) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="header-title">RethinkVC</h1>
        </div>
        <div className="header-right">
          <div className="user-profile">
            <img 
              src={user.photoURL} 
              alt="Profile" 
              className="header-avatar"
            />
            <span className="username">{user.displayName}</span>
            <button onClick={onLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
