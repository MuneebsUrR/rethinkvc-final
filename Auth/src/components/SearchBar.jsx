import React from 'react'

const SearchBar = ({ onSearch }) => {
  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="Search repositories..."
        onChange={(e) => onSearch(e.target.value)}
        className="search-input"
      />
    </div>
  )
}

export default SearchBar
