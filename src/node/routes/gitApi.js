const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const API = require('../db/API');
const util = require('util');
const execPromise = util.promisify(exec);
const mkdirp = util.promisify(fs.mkdir);
const writeFile = util.promisify(fs.writeFile);

// Base directory for git repositories
const GIT_REPOS_DIR = path.join(os.tmpdir(), 'etherpad-git-repos');

// Ensure the base directory exists
if (!fs.existsSync(GIT_REPOS_DIR)) {
  fs.mkdirSync(GIT_REPOS_DIR, { recursive: true });
}

// Helper to get pad content
async function getPadContent(padId) {
  try {
    const result = await API.getText(padId);
    return result.text || '';
  } catch (error) {
    console.error(`Error fetching content for pad ${padId}:`, error);
    return '';
  }
}

// Create commit from pad tree
router.post('/commit', async (req, res) => {
  try {
    const { rootPadId, commitMessage, padTree } = req.body;
    
    if (!rootPadId || !commitMessage || !padTree) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    // Create or use existing repo directory
    const repoDir = path.join(GIT_REPOS_DIR, rootPadId);
    if (!fs.existsSync(repoDir)) {
      await mkdirp(repoDir);
      // Initialize Git repo if it doesn't exist
      await execPromise('git init', { cwd: repoDir });
    }

    // Process all pads in the tree
    const processedPads = new Set();
    const processPad = async (padId, relativePath = '') => {
      if (processedPads.has(padId)) return;
      processedPads.add(padId);

      const padInfo = padTree[padId];
      if (!padInfo) return;

      // Get pad content
      const content = await getPadContent(padId);
      
      // Create directory for this pad if needed
      const padDir = path.join(repoDir, relativePath);
      if (!fs.existsSync(padDir)) {
        await mkdirp(padDir);
      }

      // Save content to file
      const filePath = path.join(padDir, `${padInfo.name}.txt`);
      await writeFile(filePath, content);
      
      // Process children
      for (const childId of padInfo.children || []) {
        const childPath = path.join(relativePath, padInfo.name);
        await processPad(childId, childPath);
      }
    };

    // Start processing from root pad
    await processPad(rootPadId);

    // Add all changes to git
    await execPromise('git add .', { cwd: repoDir });
    
    // Commit changes
    await execPromise(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { cwd: repoDir });
    
    res.json({
      success: true,
      message: 'Changes committed successfully',
      commitMessage
    });
  } catch (error) {
    console.error('Git commit error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating commit',
      error: error.message
    });
  }
});

module.exports = router; 