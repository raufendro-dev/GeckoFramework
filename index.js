require('dotenv').config();
const express = require('express');
const { requireAuth } = require('./auth/middleware');
const loadRoutes = require('./utils/loader'); 
const swaggerUi = require('swagger-ui-express');
const swaggerDoc = require('./docs/swagger.json');


const app = express();
app.use(express.json());

// Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// Load all routes
loadRoutes(app, requireAuth);

const HOST = process.env.HOST || '0.0.0.0';

app.listen(process.env.PORT, HOST, () => {
  console.log(`GeckoFramework running on http://${HOST}:${process.env.PORT}`);
  console.log(`Swagger UI available at http://${HOST}:${process.env.PORT}/docs`);
});
