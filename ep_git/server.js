const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const util = require('util');
const axios = require('axios');
const app = express();
const PORT = 5000;

// Promisify exec
const execPromise = util.promisify(exec);
const mkdirp = util.promisify(fs.mkdir);
const writeFile = util.promisify(fs.writeFile);

// Enable CORS for Etherpad
app.use(cors({
  origin: true, // Allow any origin
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Base directory for git repositories
const GIT_REPOS_DIR = path.join(os.tmpdir(), 'etherpad-git-repos');

// Ensure the base directory exists
if (!fs.existsSync(GIT_REPOS_DIR)) {
  fs.mkdirSync(GIT_REPOS_DIR, { recursive: true });
}

// Helper to get pad content from Etherpad API
async function getPadContent(padId) {
  try {
    // Using the Etherpad API to get pad content
    const response = await axios.get(`http://localhost:9001/api/1.2.13/getText?padID=${padId}`);
    if (response.data && response.data.data && response.data.data.text) {
      return response.data.data.text;
    }
    return '';
  } catch (error) {
    console.error(`Error fetching content for pad ${padId}:`, error.message);
    return '';
  }
}

// Create commit from pad tree
app.post('/api/git/commit', async (req, res) => {
  try {
    const { rootPadId, commitMessage, padTree } = req.body;
    
    if (!rootPadId || !commitMessage || !padTree) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    console.log(`Creating commit for root pad: ${rootPadId}`);
    console.log(`Commit message: ${commitMessage}`);
    console.log(`Pad tree contains ${Object.keys(padTree).length} pads`);

    // Create or use existing repo directory
    const repoDir = path.join(GIT_REPOS_DIR, rootPadId);
    if (!fs.existsSync(repoDir)) {
      await mkdirp(repoDir);
      // Initialize Git repo if it doesn't exist
      await execPromise('git init', { cwd: repoDir });
      console.log(`Initialized new git repository in: ${repoDir}`);
    }

    // Process all pads in the tree
    const processedPads = new Set();
    const processPad = async (padId, relativePath = '') => {
      if (processedPads.has(padId)) return;
      processedPads.add(padId);

      const padInfo = padTree[padId];
      if (!padInfo) {
        console.log(`No information found for pad: ${padId}`);
        return;
      }

      // Get pad content
      console.log(`Fetching content for pad: ${padId}`);
      const content = await getPadContent(padId);
      
      // Create directory for this pad if needed
      const padDir = path.join(repoDir, relativePath);
      if (!fs.existsSync(padDir)) {
        await mkdirp(padDir);
        console.log(`Created directory: ${padDir}`);
      }

      // Save content to file
      const filePath = path.join(padDir, `${padInfo.name}.txt`);
      await writeFile(filePath, content);
      console.log(`Saved content to: ${filePath}`);
      
      // Process children
      for (const childId of padInfo.children || []) {
        const childPath = path.join(relativePath, padInfo.name);
        await processPad(childId, childPath);
      }
    };

    // Start processing from root pad
    await processPad(rootPadId);
    console.log(`Processed all pads in the tree`);

    // Add all changes to git
    await execPromise('git add .', { cwd: repoDir });
    console.log(`Added all changes to git staging`);
    
    // Commit changes
    const commitResult = await execPromise(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { cwd: repoDir });
    console.log(`Committed changes: ${commitResult.stdout}`);
    
    res.json({
      success: true,
      message: 'Changes committed successfully',
      commitMessage,
      details: commitResult.stdout
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

// Push to remote repository
app.post('/api/git/push', async (req, res) => {
  try {
    const { rootPadId, remoteUrl } = req.body;
    console.log('Received push request with body:', req.body);
    if (!rootPadId || !remoteUrl) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    console.log(`Pushing repo for pad: ${rootPadId}`);
    console.log(`Remote URL: ${remoteUrl}`);

    // Get the repository directory
    const repoDir = path.join(GIT_REPOS_DIR, rootPadId);
    if (!fs.existsSync(repoDir)) {
      return res.status(404).json({
        success: false,
        message: 'Repository not found. Please make a commit first.'
      });
    }

    // Check if remote is already configured
    try {
      await execPromise('git remote -v', { cwd: repoDir });
      // Remove existing origin if it exists (to handle URL changes)
      await execPromise('git remote remove origin', { cwd: repoDir });
    } catch (error) {
      // It's OK if the remote doesn't exist yet
      console.log('Remote not yet configured');
    }

    // Add remote
    await execPromise(`git remote add origin "${remoteUrl}"`, { cwd: repoDir });
    console.log(`Added remote: ${remoteUrl}`);
    
    // Push to remote
    const pushResult = await execPromise('git push -u origin master', { cwd: repoDir });
    console.log(`Push result: ${pushResult.stdout}`);
    
    res.json({
      success: true,
      message: 'Changes pushed successfully',
      details: pushResult.stdout
    });
  } catch (error) {
    console.error('Git push error:', error);
    res.status(500).json({
      success: false,
      message: 'Error pushing changes',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Git API server running on http://localhost:${PORT}`);
}); 