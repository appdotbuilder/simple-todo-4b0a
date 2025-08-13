import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createTodoInputSchema, 
  updateTodoInputSchema, 
  deleteTodoInputSchema, 
  getTodoInputSchema 
} from './schema';

// Import handlers
import { createTodo } from './handlers/create_todo';
import { getTodos } from './handlers/get_todos';
import { getTodo } from './handlers/get_todo';
import { updateTodo } from './handlers/update_todo';
import { deleteTodo } from './handlers/delete_todo';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Create a new todo
  createTodo: publicProcedure
    .input(createTodoInputSchema)
    .mutation(({ input }) => createTodo(input)),
  
  // Get all todos
  getTodos: publicProcedure
    .query(() => getTodos()),
  
  // Get a single todo by ID
  getTodo: publicProcedure
    .input(getTodoInputSchema)
    .query(({ input }) => getTodo(input)),
  
  // Update an existing todo
  updateTodo: publicProcedure
    .input(updateTodoInputSchema)
    .mutation(({ input }) => updateTodo(input)),
  
  // Delete a todo
  deleteTodo: publicProcedure
    .input(deleteTodoInputSchema)
    .mutation(({ input }) => deleteTodo(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();