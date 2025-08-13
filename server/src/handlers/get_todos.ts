import { db } from '../db';
import { todosTable } from '../db/schema';
import { type Todo } from '../schema';
import { desc } from 'drizzle-orm';

export const getTodos = async (): Promise<Todo[]> => {
  try {
    // Fetch all todos ordered by creation date (newest first)
    const results = await db.select()
      .from(todosTable)
      .orderBy(desc(todosTable.created_at))
      .execute();

    // Return results directly - no numeric conversions needed as all fields are proper types
    return results;
  } catch (error) {
    console.error('Failed to fetch todos:', error);
    throw error;
  }
};