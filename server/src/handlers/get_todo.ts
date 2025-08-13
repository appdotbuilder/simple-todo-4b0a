import { db } from '../db';
import { todosTable } from '../db/schema';
import { type GetTodoInput, type Todo } from '../schema';
import { eq } from 'drizzle-orm';

export const getTodo = async (input: GetTodoInput): Promise<Todo | null> => {
  try {
    // Query the database for a todo with the specified ID
    const result = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, input.id))
      .execute();

    // Return the todo if found, null otherwise
    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Get todo failed:', error);
    throw error;
  }
};