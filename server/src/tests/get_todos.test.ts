import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput } from '../schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();

    expect(result).toEqual([]);
  });

  it('should return all todos ordered by creation date (newest first)', async () => {
    // Create test todos with slight delays to ensure different timestamps
    const todo1 = await db.insert(todosTable)
      .values({
        title: 'First Todo',
        description: 'First todo description',
        completed: false
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const todo2 = await db.insert(todosTable)
      .values({
        title: 'Second Todo',
        description: 'Second todo description',
        completed: true
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const todo3 = await db.insert(todosTable)
      .values({
        title: 'Third Todo',
        description: null, // Test nullable description
        completed: false
      })
      .returning()
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    
    // Verify ordering - newest first (Third, Second, First)
    expect(result[0].title).toEqual('Third Todo');
    expect(result[1].title).toEqual('Second Todo');
    expect(result[2].title).toEqual('First Todo');

    // Verify all fields are properly returned
    expect(result[0].id).toBeDefined();
    expect(result[0].description).toBeNull();
    expect(result[0].completed).toBe(false);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].description).toEqual('Second todo description');
    expect(result[1].completed).toBe(true);

    expect(result[2].description).toEqual('First todo description');
    expect(result[2].completed).toBe(false);
  });

  it('should handle todos with various completion states', async () => {
    // Create a mix of completed and incomplete todos
    await db.insert(todosTable)
      .values([
        {
          title: 'Completed Todo',
          description: 'This is done',
          completed: true
        },
        {
          title: 'Incomplete Todo 1',
          description: 'Still working on this',
          completed: false
        },
        {
          title: 'Incomplete Todo 2',
          description: null,
          completed: false
        }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    
    // Verify all todos are returned regardless of completion status
    const completedTodos = result.filter(todo => todo.completed);
    const incompleteTodos = result.filter(todo => !todo.completed);
    
    expect(completedTodos).toHaveLength(1);
    expect(incompleteTodos).toHaveLength(2);
    
    // Verify completed todo
    expect(completedTodos[0].title).toEqual('Completed Todo');
    expect(completedTodos[0].description).toEqual('This is done');
    
    // Verify incomplete todos
    expect(incompleteTodos.some(todo => todo.title === 'Incomplete Todo 1')).toBe(true);
    expect(incompleteTodos.some(todo => todo.title === 'Incomplete Todo 2')).toBe(true);
  });

  it('should return todos with proper date objects', async () => {
    await db.insert(todosTable)
      .values({
        title: 'Date Test Todo',
        description: 'Testing date handling',
        completed: false
      })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(1);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    
    // Verify dates are reasonable (within last minute)
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    
    expect(result[0].created_at >= oneMinuteAgo).toBe(true);
    expect(result[0].created_at <= now).toBe(true);
    expect(result[0].updated_at >= oneMinuteAgo).toBe(true);
    expect(result[0].updated_at <= now).toBe(true);
  });
});