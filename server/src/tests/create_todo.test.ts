import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput } from '../schema';
import { createTodo } from '../handlers/create_todo';
import { eq } from 'drizzle-orm';

// Simple test input with all required fields
const testInput: CreateTodoInput = {
  title: 'Test Todo',
  description: 'A todo for testing'
};

// Test input with minimal data
const minimalInput: CreateTodoInput = {
  title: 'Minimal Todo'
};

// Test input with null description
const nullDescriptionInput: CreateTodoInput = {
  title: 'Todo with null description',
  description: null
};

describe('createTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a todo with all fields', async () => {
    const result = await createTodo(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Todo');
    expect(result.description).toEqual('A todo for testing');
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a todo with minimal data', async () => {
    const result = await createTodo(minimalInput);

    expect(result.title).toEqual('Minimal Todo');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a todo with null description', async () => {
    const result = await createTodo(nullDescriptionInput);

    expect(result.title).toEqual('Todo with null description');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
  });

  it('should save todo to database', async () => {
    const result = await createTodo(testInput);

    // Query using proper drizzle syntax
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Test Todo');
    expect(todos[0].description).toEqual('A todo for testing');
    expect(todos[0].completed).toEqual(false);
    expect(todos[0].created_at).toBeInstanceOf(Date);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should default completed to false', async () => {
    const result = await createTodo(testInput);

    expect(result.completed).toEqual(false);

    // Verify in database as well
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos[0].completed).toEqual(false);
  });

  it('should set timestamps automatically', async () => {
    const beforeCreate = new Date();
    const result = await createTodo(testInput);
    const afterCreate = new Date();

    // Verify created_at is within reasonable time range
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());

    // Verify updated_at is within reasonable time range
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
  });

  it('should generate unique IDs for multiple todos', async () => {
    const result1 = await createTodo({ title: 'First Todo' });
    const result2 = await createTodo({ title: 'Second Todo' });
    const result3 = await createTodo({ title: 'Third Todo' });

    expect(result1.id).not.toEqual(result2.id);
    expect(result2.id).not.toEqual(result3.id);
    expect(result1.id).not.toEqual(result3.id);

    // IDs should be positive integers
    expect(result1.id).toBeGreaterThan(0);
    expect(result2.id).toBeGreaterThan(0);
    expect(result3.id).toBeGreaterThan(0);
  });

  it('should handle empty description as null', async () => {
    const inputWithUndefinedDescription: CreateTodoInput = {
      title: 'Todo without description'
    };

    const result = await createTodo(inputWithUndefinedDescription);

    expect(result.title).toEqual('Todo without description');
    expect(result.description).toBeNull();
  });
});