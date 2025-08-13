import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput, type CreateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

// Helper function to create a test todo
const createTestTodo = async (input: CreateTodoInput = { title: 'Test Todo' }) => {
  const result = await db.insert(todosTable)
    .values({
      title: input.title,
      description: input.description || null,
      completed: false
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a todo title', async () => {
    // Create a test todo
    const todo = await createTestTodo({ title: 'Original Title' });
    
    const input: UpdateTodoInput = {
      id: todo.id,
      title: 'Updated Title'
    };

    const result = await updateTodo(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(todo.id);
    expect(result!.title).toEqual('Updated Title');
    expect(result!.description).toEqual(todo.description);
    expect(result!.completed).toEqual(todo.completed);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(todo.updated_at.getTime());
  });

  it('should update a todo description', async () => {
    // Create a test todo
    const todo = await createTestTodo({ 
      title: 'Test Todo',
      description: 'Original description'
    });
    
    const input: UpdateTodoInput = {
      id: todo.id,
      description: 'Updated description'
    };

    const result = await updateTodo(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(todo.id);
    expect(result!.title).toEqual(todo.title);
    expect(result!.description).toEqual('Updated description');
    expect(result!.completed).toEqual(todo.completed);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(todo.updated_at.getTime());
  });

  it('should update todo completion status', async () => {
    // Create a test todo (defaults to completed: false)
    const todo = await createTestTodo({ title: 'Test Todo' });
    
    const input: UpdateTodoInput = {
      id: todo.id,
      completed: true
    };

    const result = await updateTodo(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(todo.id);
    expect(result!.title).toEqual(todo.title);
    expect(result!.description).toEqual(todo.description);
    expect(result!.completed).toEqual(true);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(todo.updated_at.getTime());
  });

  it('should update multiple fields at once', async () => {
    // Create a test todo
    const todo = await createTestTodo({ 
      title: 'Original Title',
      description: 'Original description'
    });
    
    const input: UpdateTodoInput = {
      id: todo.id,
      title: 'Updated Title',
      description: 'Updated description',
      completed: true
    };

    const result = await updateTodo(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(todo.id);
    expect(result!.title).toEqual('Updated Title');
    expect(result!.description).toEqual('Updated description');
    expect(result!.completed).toEqual(true);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(todo.updated_at.getTime());
  });

  it('should set description to null', async () => {
    // Create a test todo with description
    const todo = await createTestTodo({ 
      title: 'Test Todo',
      description: 'Original description'
    });
    
    const input: UpdateTodoInput = {
      id: todo.id,
      description: null
    };

    const result = await updateTodo(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(todo.id);
    expect(result!.title).toEqual(todo.title);
    expect(result!.description).toBeNull();
    expect(result!.completed).toEqual(todo.completed);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(todo.updated_at.getTime());
  });

  it('should return null for non-existent todo', async () => {
    const input: UpdateTodoInput = {
      id: 999, // Non-existent ID
      title: 'Updated Title'
    };

    const result = await updateTodo(input);

    expect(result).toBeNull();
  });

  it('should save updated todo to database', async () => {
    // Create a test todo
    const todo = await createTestTodo({ title: 'Original Title' });
    
    const input: UpdateTodoInput = {
      id: todo.id,
      title: 'Database Updated Title',
      completed: true
    };

    await updateTodo(input);

    // Query database directly to verify the update
    const updatedTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todo.id))
      .execute();

    expect(updatedTodos).toHaveLength(1);
    const updatedTodo = updatedTodos[0];
    expect(updatedTodo.title).toEqual('Database Updated Title');
    expect(updatedTodo.completed).toEqual(true);
    expect(updatedTodo.updated_at).toBeInstanceOf(Date);
    expect(updatedTodo.updated_at.getTime()).toBeGreaterThan(todo.updated_at.getTime());
  });

  it('should only update provided fields', async () => {
    // Create a test todo with all fields
    const todo = await createTestTodo({ 
      title: 'Original Title',
      description: 'Original description'
    });
    
    // Update only the title
    const input: UpdateTodoInput = {
      id: todo.id,
      title: 'Only Title Updated'
    };

    const result = await updateTodo(input);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Only Title Updated');
    expect(result!.description).toEqual(todo.description); // Should remain unchanged
    expect(result!.completed).toEqual(todo.completed); // Should remain unchanged
  });

  it('should always update timestamp even with no other changes', async () => {
    // Create a test todo
    const todo = await createTestTodo({ title: 'Test Todo' });
    
    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Update with only the ID (no field changes)
    const input: UpdateTodoInput = {
      id: todo.id
    };

    const result = await updateTodo(input);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual(todo.title); // Same as original
    expect(result!.description).toEqual(todo.description); // Same as original
    expect(result!.completed).toEqual(todo.completed); // Same as original
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(todo.updated_at.getTime()); // Timestamp should be updated
  });
});