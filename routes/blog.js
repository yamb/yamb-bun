import { controller } from '../controllers/blog.js';

function trusted(base) {
  return (handler) => (req) => {
    const host = req.headers.get('host') === base.host;
    const origin = req.method !== 'POST' || req.headers.get('origin') === base.origin;

    return host && origin ? handler(req) : new Response('Forbidden', { status: 403 });
  };
}

export function routes(blog, base) {
  const posts = controller(blog);
  const guard = trusted(base);

  return {
    '/': { GET: guard(posts.index) },
    '/posts': { POST: guard(posts.create) },
    '/posts/new': { GET: guard(posts.add) },
    '/posts/:id': { GET: guard(posts.edit), POST: guard(posts.update) },
    '/posts/:id/delete': { POST: guard(posts.remove) },
    '/:year/:month/:slug': { GET: guard(posts.article) }
  };
}
