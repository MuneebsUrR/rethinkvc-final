const gitApiRouter = require('../../routes/gitApi');

exports.expressCreateServer = function (hook_name, args) {
  // Add CORS middleware specifically for the git API routes
  args.app.use('/api/git', (req, res, next) => {
    // Allow requests from both localhost and 0.0.0.0
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });
  
  // Then use the router
  args.app.use('/api/git', gitApiRouter);
}; 