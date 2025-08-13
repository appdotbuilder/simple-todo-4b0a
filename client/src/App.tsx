import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Trash2, Plus, CheckCircle2, Circle } from 'lucide-react';
// Using type-only import for better TypeScript compliance
import type { Todo, CreateTodoInput } from '../../server/src/schema';

function App() {
  // Explicit typing with Todo interface
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state with proper typing for nullable fields
  const [formData, setFormData] = useState<CreateTodoInput>({
    title: '',
    description: null // Explicitly null, not undefined
  });

  // useCallback to memoize function used in useEffect
  const loadTodos = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty deps since trpc is stable

  // useEffect with proper dependencies
  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    setIsCreating(true);
    try {
      const response = await trpc.createTodo.mutate(formData);
      // Update todos list with explicit typing in setState callback
      setTodos((prev: Todo[]) => [response, ...prev]);
      // Reset form
      setFormData({
        title: '',
        description: null
      });
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const updatedTodo = await trpc.updateTodo.mutate({
        id: todo.id,
        completed: !todo.completed
      });
      
      if (updatedTodo) {
        setTodos((prev: Todo[]) =>
          prev.map((t: Todo) => (t.id === todo.id ? updatedTodo : t))
        );
      }
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const handleDelete = async (todoId: number) => {
    try {
      const success = await trpc.deleteTodo.mutate({ id: todoId });
      if (success) {
        setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== todoId));
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-2xl px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">✅ Simple Todo</h1>
          <p className="text-gray-600">Keep track of your daily tasks</p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-4 mb-6">
          <Badge variant="outline" className="px-3 py-1">
            {totalCount} {totalCount === 1 ? 'task' : 'tasks'}
          </Badge>
          <Badge variant="default" className="px-3 py-1">
            {completedCount} completed
          </Badge>
        </div>

        {/* Add Todo Form */}
        <Card className="p-6 mb-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                placeholder="What needs to be done?"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateTodoInput) => ({ ...prev, title: e.target.value }))
                }
                className="text-lg"
                disabled={isCreating}
                required
              />
            </div>
            <div>
              <Textarea
                placeholder="Add a description (optional)"
                // Handle nullable field with fallback to empty string
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateTodoInput) => ({
                    ...prev,
                    description: e.target.value || null // Convert empty string back to null
                  }))
                }
                rows={2}
                disabled={isCreating}
              />
            </div>
            <Button 
              type="submit" 
              disabled={isCreating || !formData.title.trim()}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isCreating ? 'Adding...' : 'Add Task'}
            </Button>
          </form>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading tasks...</p>
          </div>
        )}

        {/* Todo List */}
        {!isLoading && todos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-500 text-lg">No tasks yet. Create one above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todos.map((todo: Todo) => (
              <Card 
                key={todo.id} 
                className={`p-4 transition-all duration-200 hover:shadow-md ${
                  todo.completed ? 'bg-gray-50 opacity-75' : 'bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleComplete(todo)}
                    className="mt-1 text-gray-400 hover:text-green-600 transition-colors"
                  >
                    {todo.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 
                      className={`font-medium text-gray-900 ${
                        todo.completed ? 'line-through text-gray-500' : ''
                      }`}
                    >
                      {todo.title}
                    </h3>
                    {/* Handle nullable description */}
                    {todo.description && (
                      <p 
                        className={`text-sm text-gray-600 mt-1 ${
                          todo.completed ? 'line-through text-gray-400' : ''
                        }`}
                      >
                        {todo.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Created: {todo.created_at.toLocaleDateString()}
                    </p>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(todo.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Footer */}
        {todos.length > 0 && (
          <div className="mt-8 pt-6">
            <Separator className="mb-4" />
            <div className="text-center text-sm text-gray-500">
              {completedCount === totalCount && totalCount > 0 ? (
                <span className="text-green-600 font-medium">🎉 All tasks completed! Great job!</span>
              ) : (
                <span>
                  {totalCount - completedCount} {totalCount - completedCount === 1 ? 'task' : 'tasks'} remaining
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;