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
const history = require('koa2-history-api-fallback');

const port = process.env.PORT || config.port;

// error handler
onerror(app);

//处理vue-router history模式，需要放在其他中间件之前
if (require('./config/routerMode') === 'history') {
  app.use(history({
    htmlAcceptHeaders: ['text/html'],
    index: '/'
  }));
}

// middlewares
app.use(bodyparser())
  .use(json())
  .use(logger())
  .use(router.routes())
  .use(router.allowedMethods());

//处理开发过程中的vue代码热更新
if (process.env.NODE_ENV === 'development') {
  const webpack = require('webpack');
  const webpackMiddleware = require('koa-webpack-middleware');
  const webpackConfig = require('./build/webpack.dev.conf');
  webpackConfig.then(devConfig => {
    let compile = webpack(devConfig);
    app.use(webpackMiddleware.devMiddleware(compile, {
      publicPath: devConfig.output.publicPath,
      stats: {colors: true}
    }))
      .use(webpackMiddleware.hotMiddleware(compile));
  });
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
