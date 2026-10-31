import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ryflow_todos';
const DEFAULT_TODOS = [
  { id: 1, text: 'Cek jadwal & agenda hari ini', done: false },
  { id: 2, text: 'Eksplor fitur baru Ryflow', done: true },
];

export function useTodos() {
  const [todos, setTodos] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_TODOS;
    } catch {
      return DEFAULT_TODOS;
    }
  });
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch { }
  }, [todos]);

  const handleAddTodo = (e) => {
    e.preventDefault();
    const trimmed = newTodo.trim();
    if (!trimmed) return;
    setTodos((prev) => [...prev, { id: Date.now(), text: trimmed, done: false }]);
    setNewTodo('');
  };

  const toggleTodo = (id) => {
    setTodos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const deleteTodo = (id) => {
    setTodos((prev) => prev.filter((item) => item.id !== id));
  };

  const completedTodos = todos.filter((t) => t.done).length;

  return {
    todos,
    newTodo,
    setNewTodo,
    handleAddTodo,
    toggleTodo,
    deleteTodo,
    completedTodos,
  };
}