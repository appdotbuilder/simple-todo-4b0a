import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo and return true', async () => {
    // Create a test todo first
    const testTodo = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing deletion',
        completed: false
      })
      .returning()
      .execute();

    const todoId = testTodo[0].id;
    const input: DeleteTodoInput = { id: todoId };

    // Delete the todo
    const result = await deleteTodo(input);

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify the todo is actually deleted from database
    const deletedTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(deletedTodos).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent todo', async () => {
    const nonExistentId = 99999;
    const input: DeleteTodoInput = { id: nonExistentId };

    // Try to delete non-existent todo
    const result = await deleteTodo(input);

    // Should return false indicating no deletion occurred
    expect(result).toBe(false);
  });

  it('should not affect other todos when deleting one', async () => {
    // Create multiple test todos
    const todos = await db.insert(todosTable)
      .values([
        {
          title: 'Todo 1',
          description: 'First todo',
          completed: false
        },
        {
          title: 'Todo 2', 
          description: 'Second todo',
          completed: true
        },
        {
          title: 'Todo 3',
          description: 'Third todo',
          completed: false
        }
      ])
      .returning()
      .execute();

    const todoToDelete = todos[1]; // Delete the middle one
    const input: DeleteTodoInput = { id: todoToDelete.id };

    // Delete one todo
    const result = await deleteTodo(input);

    expect(result).toBe(true);

    // Verify only the target todo was deleted
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(2);
    
    // Check that the deleted todo is not in remaining todos
    const deletedTodoExists = remainingTodos.some(todo => todo.id === todoToDelete.id);
    expect(deletedTodoExists).toBe(false);

    // Check that other todos still exist
    const otherTodoIds = [todos[0].id, todos[2].id];
    const remainingIds = remainingTodos.map(todo => todo.id);
    
    otherTodoIds.forEach(id => {
      expect(remainingIds).toContain(id);
    });
  });

  it('should delete completed todos successfully', async () => {
    // Create a completed todo
    const completedTodo = await db.insert(todosTable)
      .values({
        title: 'Completed Task',
        description: 'This task is done',
        completed: true
      })
      .returning()
      .execute();

    const input: DeleteTodoInput = { id: completedTodo[0].id };

    // Delete the completed todo
    const result = await deleteTodo(input);

    expect(result).toBe(true);

    // Verify deletion
    const deletedTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, completedTodo[0].id))
      .execute();

    expect(deletedTodos).toHaveLength(0);
  });

  it('should delete todos with null descriptions', async () => {
    // Create a todo with null description
    const todoWithNullDesc = await db.insert(todosTable)
      .values({
        title: 'No Description Todo',
        description: null,
        completed: false
      })
      .returning()
      .execute();

    const input: DeleteTodoInput = { id: todoWithNullDesc[0].id };

    // Delete the todo
    const result = await deleteTodo(input);

    expect(result).toBe(true);

    // Verify deletion
    const deletedTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoWithNullDesc[0].id))
      .execute();

    expect(deletedTodos).toHaveLength(0);
  });
});