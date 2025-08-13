import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type GetTodoInput } from '../schema';
import { getTodo } from '../handlers/get_todo';

describe('getTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a todo when it exists', async () => {
    // Create a test todo in the database
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A test todo item',
        completed: false
      })
      .returning()
      .execute();

    const createdTodo = insertResult[0];
    const testInput: GetTodoInput = { id: createdTodo.id };

    // Fetch the todo using the handler
    const result = await getTodo(testInput);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTodo.id);
    expect(result!.title).toEqual('Test Todo');
    expect(result!.description).toEqual('A test todo item');
    expect(result!.completed).toEqual(false);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when todo does not exist', async () => {
    const testInput: GetTodoInput = { id: 999 }; // Non-existent ID

    const result = await getTodo(testInput);

    expect(result).toBeNull();
  });

  it('should return todo with null description', async () => {
    // Create a todo with null description
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Todo with null description',
        description: null,
        completed: true
      })
      .returning()
      .execute();

    const createdTodo = insertResult[0];
    const testInput: GetTodoInput = { id: createdTodo.id };

    const result = await getTodo(testInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTodo.id);
    expect(result!.title).toEqual('Todo with null description');
    expect(result!.description).toBeNull();
    expect(result!.completed).toEqual(true);
  });

  it('should return the correct todo when multiple todos exist', async () => {
    // Create multiple todos
    const todo1 = await db.insert(todosTable)
      .values({
        title: 'First Todo',
        description: 'First description',
        completed: false
      })
      .returning()
      .execute();

    const todo2 = await db.insert(todosTable)
      .values({
        title: 'Second Todo',
        description: 'Second description',
        completed: true
      })
      .returning()
      .execute();

    const testInput: GetTodoInput = { id: todo2[0].id };

    const result = await getTodo(testInput);

    // Verify we got the correct todo (second one)
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(todo2[0].id);
    expect(result!.title).toEqual('Second Todo');
    expect(result!.description).toEqual('Second description');
    expect(result!.completed).toEqual(true);
  });

  it('should handle database timestamps correctly', async () => {
    // Create a todo and wait a moment to ensure timestamp differences
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Timestamp Test Todo',
        description: 'Testing timestamp handling',
        completed: false
      })
      .returning()
      .execute();

    const createdTodo = insertResult[0];
    const testInput: GetTodoInput = { id: createdTodo.id };

    const result = await getTodo(testInput);

    expect(result).not.toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    
    // Verify timestamps are reasonable (within the last minute)
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    
    expect(result!.created_at >= oneMinuteAgo).toBe(true);
    expect(result!.created_at <= now).toBe(true);
    expect(result!.updated_at >= oneMinuteAgo).toBe(true);
    expect(result!.updated_at <= now).toBe(true);
  });
});