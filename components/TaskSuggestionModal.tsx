import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons';

interface TaskSuggestionModalProps {
  isOpen: boolean;
  suggestions: string[];
  onClose: () => void;
  onAddTasks: (selectedTasks: string[]) => void;
}

const TaskSuggestionModal: React.FC<TaskSuggestionModalProps> = ({ isOpen, suggestions, onClose, onAddTasks }) => {
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
        const initialSelection: Record<string, boolean> = {};
        suggestions.forEach(s => {
          initialSelection[s] = true; // Select all by default
        });
        setSelected(initialSelection);
    }
  }, [isOpen, suggestions]);

  if (!isOpen) return null;

  const handleToggle = (suggestion: string) => {
    setSelected(prev => ({ ...prev, [suggestion]: !prev[suggestion] }));
  };

  const handleAdd = () => {
    const tasksToAdd = Object.keys(selected).filter(key => selected[key]);
    if (tasksToAdd.length > 0) {
        onAddTasks(tasksToAdd);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-slate-900">Sugerencias de Tareas (IA)</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><XMarkIcon /></button>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4">La IA sugiere las siguientes tareas. Desmarca las que no quieras añadir.</p>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {suggestions.map((s, i) => (
              <label key={i} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-md cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={selected[s] ?? true}
                  onChange={() => handleToggle(s)}
                  className="h-5 w-5 rounded border-slate-400 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-sm text-slate-800">{s}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end space-x-3 p-4 bg-slate-50 border-t rounded-b-xl">
          <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg">Cancelar</button>
          <button onClick={handleAdd} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg">Añadir Tareas</button>
        </div>
      </div>
    </div>
  );
};

export default TaskSuggestionModal;