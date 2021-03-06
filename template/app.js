const Koa = require('koa');
const Router = require('koa-router');
const app = new Koa();
const router = new Router();
const json = require('koa-json');
const onerror = require('koa-onerror');
const bodyparser = require('koa-bodyparser');
const logger = require('koa-logger');
const debug = require('debug')('koa2:server');
const config = require('./config/server');
const routes = require('./src/server/routes');
{{#router}}
const history = require('koa2-history-api-fallback');
{{/router}}

const port = process.env.PORT || config.port;

// error handler
onerror(app);

{{#router}}
//处理vue-router history模式，需要放在其他中间件之前
if (require('./config/routerMode') === 'history') {
  app.use(history({
    htmlAcceptHeaders: ['text/html'],
    index: '/'
  }));
}
{{/router}}

// middlewares
app.use(bodyparser())
  .use(json())
  .use(logger())
  .use(router.routes())
  .use(router.allowedMethods());

//处理开发过程中的vue代码热更新
  if (process.env.NODE_ENV === 'development') {
    (async function initKoaWebpackMiddleware () {
      const KoaWebpack = require('koa-webpack');
      const config = await require('./build/webpack.dev.conf');
      app.use(await KoaWebpack({config}));
    })();
  } else {
    app.use(require('koa-static')(__dirname + '/src/server/public'));
  }

// logger
app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log(`${ctx.method} ${ctx.url} - $ms`);
});

routes(router);

app.on('error', function (err, ctx) {
  console.log(err);
});

module.exports = app.listen(port, () => {
  console.log(`Listening on http://localhost:${config.port}`);
});
