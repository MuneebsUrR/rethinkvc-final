import React from 'react'

const UserProfile = ({ user, onLogout }) => {
  return (
    <div className="user-info">
      <img src={user.photoURL} alt="Profile" className="avatar" />
      <h2>Welcome, {user.displayName}</h2>
      <button style={{backgroundColor:'#DC2626'}} onClick={onLogout}>Logout</button>
    </div>
  )
}

export default UserProfile
