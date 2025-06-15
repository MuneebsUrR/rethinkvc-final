import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// In-memory storage (replace with a database in production)
let drawings = {};

app.get('/api/drawings/:projectId', (req, res) => {
  const { projectId } = req.params;
  res.json(drawings[projectId] || []);
});

app.post('/api/drawings/:projectId', (req, res) => {
  const { projectId } = req.params;
  const shapes = req.body;
  drawings[projectId] = shapes;
  res.json({ success: true });
});

app.delete('/api/drawings/:projectId', (req, res) => {
  const { projectId } = req.params;
  delete drawings[projectId];
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 