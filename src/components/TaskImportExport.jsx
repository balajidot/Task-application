import React, { useState } from 'react';

const TaskImportExport = ({ goals, onImport }) => {
  const [importData, setImportData] = useState('');

  const exportTasks = async () => {
    try {
      const dataStr = JSON.stringify(goals, null, 2);
      
      // Try navigator.share first for mobile/native feel if supported
      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
        const file = new File([dataStr], 'task-planner-backup.json', { type: 'application/json' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Task Planner Backup',
            files: [file]
          });
          return;
        }
      }

      // Fallback to standard download
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `task-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    }
  };

  const importTasks = () => {
    try {
      const parsed = JSON.parse(importData);
      if (Array.isArray(parsed)) {
        onImport?.(parsed);
        setImportData('');
        alert('Tasks imported successfully!');
      } else {
        alert('Invalid format. Please export a valid task backup file.');
      }
    } catch (error) {
      alert('Error importing tasks. Please check the file format.');
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImportData(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="import-export-section">
      <div className="import-export-card">
        <h3>📤 Export Tasks</h3>
        <p>Download your tasks as a JSON backup file</p>
        <button className="export-btn" onClick={exportTasks}>
          📥 Export All Tasks
        </button>
      </div>

      <div className="import-export-card">
        <h3>📥 Import Tasks</h3>
        <p>Upload a previously exported task backup file</p>
        
        <div className="import-methods">
          <div className="import-file">
            <label className="file-upload-label">
              📁 Choose File
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="file-input"
              />
            </label>
          </div>
          
          <div className="import-text">
            <textarea
              placeholder="Or paste JSON data here..."
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              className="import-textarea"
              rows={6}
            />
          </div>
        </div>

        <button 
          className="import-btn" 
          onClick={importTasks}
          disabled={!importData.trim()}
        >
          📥 Import Tasks
        </button>
      </div>
    </div>
  );
};

export default TaskImportExport;
