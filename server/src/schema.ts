import { z } from 'zod';

// Todo schema with proper type handling
export const todoSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(), // Nullable field, can be explicitly null
  completed: z.boolean(),
  created_at: z.coerce.date(), // Automatically converts string timestamps to Date objects
  updated_at: z.coerce.date()
});

export type Todo = z.infer<typeof todoSchema>;

// Input schema for creating todos
export const createTodoInputSchema = z.object({
  title: z.string().min(1, "Title is required"), // Ensure title is not empty
  description: z.string().nullable().optional() // Can be null or omitted
});

export type CreateTodoInput = z.infer<typeof createTodoInputSchema>;

// Input schema for updating todos
export const updateTodoInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title is required").optional(), // Optional but if provided, must not be empty
  description: z.string().nullable().optional(), // Can be null or undefined
  completed: z.boolean().optional()
});

export type UpdateTodoInput = z.infer<typeof updateTodoInputSchema>;

// Input schema for deleting todos
export const deleteTodoInputSchema = z.object({
  id: z.number()
});

export type DeleteTodoInput = z.infer<typeof deleteTodoInputSchema>;

// Input schema for getting a single todo by ID
export const getTodoInputSchema = z.object({
  id: z.number()
});

export type GetTodoInput = z.infer<typeof getTodoInputSchema>;