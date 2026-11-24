import { open } from './models/blog.js';
import { routes } from './routes/blog.js';

const hostname = '127.0.0.1';
const port = Number(Bun.env.PORT ?? 3002);
const base = new URL(`http://${hostname}:${port}`);

const stopping = Promise.withResolvers();
process.on('SIGINT', stopping.resolve);
process.on('SIGTERM', stopping.resolve);

await using resources = new AsyncDisposableStack();

const blog = await open(resources, {
  base,
  path: Bun.env.YAMB_POSTS_DIR
});

const server = Bun.serve({
  hostname,
  port,
  reusePort: false,
  routes: routes(blog, base),
  development: false
});

resources.defer(() => server.stop());
base.port = String(server.port);

console.log(base.origin);
await stopping.promise;
