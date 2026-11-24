import { PostStatusError, PostValidationError, UriTakenError } from 'yamb/errors';
import { IdSchema, UriSchema } from 'yamb/schemas';

import * as views from '../views/blog.js';

const invalid = [PostStatusError, PostValidationError, UriTakenError];

const missing = () => new Response('Not Found', { status: 404 });
const home = () => Response.redirect('/', 303);

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
}

async function save(req, post) {
  const { title, text, status } = Object.fromEntries(await req.formData());

  try {
    Object.assign(post, { title, text, status });
    await post.save();

    return home();
  } catch (error) {
    if (!invalid.some((type) => error instanceof type)) {
      throw error;
    }

    const values = { id: post.id, title, text, status };

    return html(views.form(values, error.message), 422);
  }
}

export function controller(blog) {
  const find = (id) => (IdSchema.safeParse(id).success ? blog.find(id) : null);

  return {
    async index() {
      const posts = await blog.all().toArray();

      return html(views.index(posts));
    },

    async article({ params }) {
      const { year, month, slug } = params;
      const uri = `${year}/${month}/${slug}`;
      const post = UriSchema.safeParse(uri).success ? await blog.fetch(uri) : null;

      if (post?.status !== 'published') {
        return missing();
      }

      const { body } = await post.render('html');

      return html(views.article(post.title, body));
    },

    add() {
      return html(views.form({}));
    },

    create(req) {
      return save(req, blog.build());
    },

    async edit(req) {
      const post = await find(req.params.id);

      return post ? html(views.form(post)) : missing();
    },

    async update(req) {
      const post = await find(req.params.id);

      return post ? save(req, post) : missing();
    },

    async remove(req) {
      const post = await find(req.params.id);

      if (!post) {
        return missing();
      }

      await post.remove();

      return home();
    }
  };
}
