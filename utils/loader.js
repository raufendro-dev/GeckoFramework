function loadRoutes(app, requireAuth) {
  const fs = require('fs');
  const path = require('path');
  const routesPath = path.join(__dirname, '../routes');
  const routeFiles = fs.readdirSync(routesPath);

  routeFiles.forEach(file => {
    const routeDefs = require(path.join(routesPath, file));
    const routeArray = Array.isArray(routeDefs) ? routeDefs : [routeDefs];

    routeArray.forEach(route => {
      const method = route.method.toLowerCase();
      if (typeof app[method] !== 'function') {
        console.error(`❌ Invalid HTTP method: ${route.method}`);
        return;
      }

      const middlewares = route.auth ? [requireAuth, route.handler] : [route.handler];
      app[method](route.path, ...middlewares);

      // console.log(`✅ ${method.toUpperCase()} ${route.path} ${route.auth ? '[auth]' : ''}`);
    });
  });
}

module.exports = loadRoutes;
