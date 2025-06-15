import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';

const DrawingBoard = () => {
  const { projectId } = useParams();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState('pencil');
  const [shapes, setShapes] = useState([]);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [selectedShape, setSelectedShape] = useState(null);
  const [isMoving, setIsMoving] = useState(false);
  const [pencilColor, setPencilColor] = useState('#000000');
  const [pencilSize, setPencilSize] = useState(2);
  const [shapeLabel, setShapeLabel] = useState('');
  const [isLabeling, setIsLabeling] = useState(false);
  const [isEraser, setIsEraser] = useState(false);

  // Load saved project from server
  useEffect(() => {
    const fetchDrawings = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/drawings/${projectId}`);
        const data = await response.json();
        setShapes(data);
        redrawCanvas(data);
      } catch (error) {
        console.error('Error fetching drawings:', error);
      }
    };

    fetchDrawings();
  }, [projectId]);

  // Poll for updates every 2 seconds
  useEffect(() => {
    const fetchDrawings = async () => {
      if (!projectId) return;
      
      try {
        const response = await fetch(`http://localhost:3001/api/drawings/${projectId}`);
        const data = await response.json();
        
        // Only update if the server has more shapes than we do
        if (data.length > shapes.length) {
          setShapes(data);
          redrawCanvas(data);
        }
      } catch (error) {
        console.error('Error fetching drawings:', error);
      }
    };

    const interval = setInterval(fetchDrawings, 2000);
    return () => clearInterval(interval);
  }, [projectId, shapes.length]);

  // Save project to server whenever shapes change
  useEffect(() => {
    const saveDrawings = async () => {
      try {
        await fetch(`http://localhost:3001/api/drawings/${projectId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(shapes),
        });
      } catch (error) {
        console.error('Error saving drawings:', error);
      }
    };

    if (projectId && shapes.length > 0) {
      saveDrawings();
    }
  }, [shapes, projectId]);

  const redrawCanvas = (shapesToDraw) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    shapesToDraw.forEach(shape => {
      ctx.beginPath();
      ctx.strokeStyle = shape.color || '#000000';
      ctx.lineWidth = shape.size || 2;
      
      switch (shape.type) {
        case 'pencil':
          ctx.moveTo(shape.points[0].x, shape.points[0].y);
          shape.points.forEach(point => {
            ctx.lineTo(point.x, point.y);
          });
          ctx.stroke();
          break;
        case 'rectangle':
          ctx.rect(shape.startX, shape.startY, 
            shape.endX - shape.startX, shape.endY - shape.startY);
          ctx.stroke();
          break;
        case 'circle':
          const radius = Math.sqrt(
            Math.pow(shape.endX - shape.startX, 2) + 
            Math.pow(shape.endY - shape.startY, 2)
          );
          ctx.arc(shape.startX, shape.startY, radius, 0, 2 * Math.PI);
          ctx.stroke();
          break;
        case 'diamond':
          const width = shape.endX - shape.startX;
          const height = shape.endY - shape.startY;
          ctx.moveTo(shape.startX, shape.startY + height/2);
          ctx.lineTo(shape.startX + width/2, shape.startY);
          ctx.lineTo(shape.startX + width, shape.startY + height/2);
          ctx.lineTo(shape.startX + width/2, shape.startY + height);
          ctx.closePath();
          ctx.stroke();
          break;
      }

      // Draw label if it exists
      if (shape.label) {
        ctx.font = '14px Arial';
        ctx.fillStyle = shape.color || '#000000';
        let labelX, labelY;
        
        if (shape.type === 'pencil') {
          labelX = shape.points[0].x;
          labelY = shape.points[0].y - 10;
        } else {
          labelX = shape.startX;
          labelY = shape.startY - 10;
        }
        
        ctx.fillText(shape.label, labelX, labelY);
      }
    });
  };

  const isPointInShape = (point, shape) => {
    if (shape.type === 'pencil') {
      return shape.points.some(p => 
        Math.abs(p.x - point.x) < 5 && Math.abs(p.y - point.y) < 5
      );
    }

    if (shape.type === 'diamond') {
      const width = shape.endX - shape.startX;
      const height = shape.endY - shape.startY;
      const centerX = shape.startX + width/2;
      const centerY = shape.startY + height/2;
      
      // Transform point to diamond's coordinate system
      const dx = Math.abs(point.x - centerX);
      const dy = Math.abs(point.y - centerY);
      
      // Check if point is inside diamond
      return (dx / (width/2) + dy / (height/2)) <= 1;
    }

    // For rectangle and circle
    const minX = Math.min(shape.startX, shape.endX);
    const maxX = Math.max(shape.startX, shape.endX);
    const minY = Math.min(shape.startY, shape.endY);
    const maxY = Math.max(shape.startY, shape.endY);

    if (shape.type === 'rectangle') {
      return point.x >= minX && point.x <= maxX && 
             point.y >= minY && point.y <= maxY;
    }

    if (shape.type === 'circle') {
      const radius = Math.sqrt(
        Math.pow(shape.endX - shape.startX, 2) + 
        Math.pow(shape.endY - shape.startY, 2)
      );
      const distance = Math.sqrt(
        Math.pow(point.x - shape.startX, 2) + 
        Math.pow(point.y - shape.startY, 2)
      );
      return distance <= radius;
    }

    return false;
  };

  const handleEraser = async (e) => {
    if (!isEraser) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const shapesToKeep = shapes.filter(shape => !isPointInShape({ x, y }, shape));
    if (shapesToKeep.length !== shapes.length) {
      setShapes(shapesToKeep);
      redrawCanvas(shapesToKeep);
      
      // Update server with new shapes
      if (projectId) {
        try {
          await fetch(`http://localhost:3001/api/drawings/${projectId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(shapesToKeep),
          });
        } catch (error) {
          console.error('Error updating drawings:', error);
        }
      }
    }
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (isEraser) {
      handleEraser(e);
      return;
    }

    const clickedShapeIndex = shapes.findIndex(shape => isPointInShape({ x, y }, shape));
    
    if (clickedShapeIndex !== -1) {
      setSelectedShape(clickedShapeIndex);
      setIsMoving(true);
      setStartPoint({ x, y });
      return;
    }

    setIsDrawing(true);
    setStartPoint({ x, y });
    setSelectedShape(null);
    
    if (currentShape === 'pencil') {
      setShapes([...shapes, { 
        type: 'pencil', 
        points: [{ x, y }],
        color: pencilColor,
        size: pencilSize
      }]);
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isMoving && selectedShape !== null) {
      const newShapes = [...shapes];
      const shape = newShapes[selectedShape];
      const dx = x - startPoint.x;
      const dy = y - startPoint.y;

      if (shape.type === 'pencil') {
        shape.points = shape.points.map(p => ({
          x: p.x + dx,
          y: p.y + dy
        }));
      } else {
        shape.startX += dx;
        shape.startY += dy;
        shape.endX += dx;
        shape.endY += dy;
      }

      setStartPoint({ x, y });
      setShapes(newShapes);
      redrawCanvas(newShapes);
      return;
    }

    if (isEraser) {
      handleEraser(e);
      return;
    }

    if (!isDrawing) return;
    
    if (currentShape === 'pencil') {
      const newShapes = [...shapes];
      newShapes[newShapes.length - 1].points.push({ x, y });
      setShapes(newShapes);
      redrawCanvas(newShapes);
    } else {
      const tempShapes = [...shapes];
      redrawCanvas([...tempShapes, {
        type: currentShape,
        startX: startPoint.x,
        startY: startPoint.y,
        endX: x,
        endY: y,
        color: pencilColor,
        size: pencilSize
      }]);
    }
  };

  const handleMouseUp = (e) => {
    if (isMoving) {
      setIsMoving(false);
      return;
    }

    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentShape !== 'pencil') {
      setShapes([...shapes, {
        type: currentShape,
        startX: startPoint.x,
        startY: startPoint.y,
        endX: x,
        endY: y,
        color: pencilColor,
        size: pencilSize
      }]);
    }
    
    setIsDrawing(false);
  };

  const handleLabelSubmit = (e) => {
    e.preventDefault();
    if (selectedShape !== null && shapeLabel.trim()) {
      const newShapes = [...shapes];
      newShapes[selectedShape] = {
        ...newShapes[selectedShape],
        label: shapeLabel.trim()
      };
      setShapes(newShapes);
      setShapeLabel('');
      setIsLabeling(false);
      redrawCanvas(newShapes);
    }
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `drawing-${projectId || 'export'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleClearCanvas = async () => {
    setShapes([]);
    redrawCanvas([]);
    
    // Clear the drawing on the server
    if (projectId) {
      try {
        await fetch(`http://localhost:3001/api/drawings/${projectId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Error clearing drawings:', error);
      }
    }
  };

  return (
    <div className="drawing-board">
      <nav className="navbar">
        
        <div className="nav-center">
          <div className="tool-group">
            <button 
              className={`tool-button ${currentShape === 'pencil' && !isEraser ? 'active' : ''}`}
              onClick={() => {
                setCurrentShape('pencil');
                setIsEraser(false);
              }}
              title="Pencil"
            >
              <i className="fas fa-pencil-alt"></i>
            </button>
            <button 
              className={`tool-button ${isEraser ? 'active' : ''}`}
              onClick={() => {
                setIsEraser(true);
                setCurrentShape(null);
              }}
              title="Eraser"
            >
              <i className="fas fa-eraser"></i>
            </button>
            <button 
              className={`tool-button ${currentShape === 'rectangle' ? 'active' : ''}`}
              onClick={() => {
                setCurrentShape('rectangle');
                setIsEraser(false);
              }}
              title="Rectangle"
            >
              <i className="fas fa-square"></i>
            </button>
            <button 
              className={`tool-button ${currentShape === 'circle' ? 'active' : ''}`}
              onClick={() => {
                setCurrentShape('circle');
                setIsEraser(false);
              }}
              title="Circle"
            >
              <i className="fas fa-circle"></i>
            </button>
            <button 
              className={`tool-button ${currentShape === 'diamond' ? 'active' : ''}`}
              onClick={() => {
                setCurrentShape('diamond');
                setIsEraser(false);
              }}
              title="Diamond"
            >
              <i className="fas fa-gem"></i>
            </button>
          </div>

          <div className="tool-group">
            <input
              type="color"
              value={pencilColor}
              onChange={(e) => setPencilColor(e.target.value)}
              title="Color"
            />
            <input
              type="range"
              min="1"
              max="20"
              value={pencilSize}
              onChange={(e) => setPencilSize(parseInt(e.target.value))}
              title="Size"
            />
          </div>
        </div>

        <div className="nav-right">
          {selectedShape !== null && (
            <form onSubmit={handleLabelSubmit} className="label-form">
              <input
                type="text"
                value={shapeLabel}
                onChange={(e) => setShapeLabel(e.target.value)}
                placeholder="Add label..."
                className="label-input"
              />
              <button type="submit" className="label-button">Add Label</button>
            </form>
          )}
          <button 
            className="export-button"
            onClick={handleExport}
            title="Export Drawing"
          >
            <i className="fas fa-download"></i>
          </button>
          <button 
            className="clear-button"
            onClick={handleClearCanvas}
          >
            Clear Canvas
          </button>
        </div>
      </nav>

      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          width={window.innerWidth - 20}
          height={window.innerHeight - 100}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      </div>
    </div>
  );
};

export default DrawingBoard; 