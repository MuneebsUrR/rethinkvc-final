import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DrawingBoard from './components/DrawingBoard';
import Projects from './pages/Projects';
import './App.css';

function App() {
  return (
 
      <div className="app">
        <Routes>
          <Route path="/" element={<Projects />} />
          <Route path="/draw/:projectId" element={<DrawingBoard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
 
  );
}

export default App;
