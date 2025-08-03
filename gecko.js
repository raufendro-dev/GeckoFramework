
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
if (typeof inquirer !== 'object' || typeof inquirer.prompt !== 'function') {
  console.error("❌ Incompatible version of inquirer. Use: npm install inquirer@8");
  process.exit(1);
}

require('dotenv').config();

const args = process.argv.slice(2);

async function createRoute(routeName) {
  const routePath = path.join(__dirname, 'routes', `${routeName}.js`);
  const controllerPath = path.join(__dirname, 'controllers', `${routeName}Controller.js`);
  const modelPath = path.join(__dirname, 'models', `${routeName}.js`);

  if (fs.existsSync(routePath)) {
    console.log(`❌ Route '${routeName}' already exists.`);
    return;
  }

  const cliFlags = {};
  args.forEach((arg, i) => {
    if (arg.startsWith('--') && args[i + 1] && !args[i + 1].startsWith('--')) {
      cliFlags[arg.replace('--', '')] = args[i + 1];
    }
  });

  const answers = cliFlags.table && cliFlags.auth && cliFlags.summary
    ? {
        table: cliFlags.table,
        auth: cliFlags.auth === 'true',
        summary: cliFlags.summary
      }
    : await inquirer.prompt([
        {
          type: 'input',
          name: 'table',
          message: 'Enter the MySQL table name (used in SELECT queries): ',
          default: 'your_table_name'
        },
        {
          type: 'confirm',
          name: 'auth',
          message: 'Require auth?',
          default: true
        },
        {
          type: 'input',
          name: 'summary',
          message: 'Route summary (for Swagger)?',
          default: `Auto-generated ${routeName} route`
        }
      ]);

  const routeContent = `const controller = require('../controllers/${routeName}Controller');

module.exports = [
  {
    path: '/${routeName}',
    method: 'get',
    auth: ${answers.auth},
    handler: controller.getAll
  },
  {
    path: '/${routeName}/:id',
    method: 'get',
    auth: ${answers.auth},
    handler: controller.getById
  },
  {
    path: '/${routeName}',
    method: 'post',
    auth: ${answers.auth},
    handler: controller.insert
  },
  {
    path: '/${routeName}/:id',
    method: 'put',
    auth: ${answers.auth},
    handler: controller.update
  },
  {
    path: '/${routeName}/:id',
    method: 'delete',
    auth: ${answers.auth},
    handler: controller.delete
  }
];
`;
  fs.writeFileSync(routePath, routeContent);

  const dbModule = require('./utils/db');
  const [columns] = await dbModule.promise().query(`DESCRIBE ${answers.table}`);

  const requiredFields = columns.filter(col => col.Null === 'NO' && col.Field !== 'id').map(col => col.Field);
  const properties = {};
  columns.forEach(col => {
    properties[col.Field] = { type: col.Type.includes('int') ? 'integer' : 'string' };
  });

  const swaggerPath = path.join(__dirname, 'docs', 'swagger.json');
  if (fs.existsSync(swaggerPath)) {
    try {
      const swagger = JSON.parse(fs.readFileSync(swaggerPath));
      if (!swagger.paths) swagger.paths = {};
      const pathKey = `/${routeName}`;

      swagger.paths[pathKey] = {
        get: {
          summary: `Get all ${routeName}`,
          responses: {
            '200': {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      encrypted: {
                        type: 'string',
                        description: 'AES-256 encrypted JSON data'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: `Insert new ${routeName}`,
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties,
                  required: requiredFields
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Created'
            }
          }
        }
      };
      swagger.paths[`${pathKey}/{id}`] = {
        get: {
          summary: `Get ${routeName} by ID`,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            '200': {
              description: 'OK'
            }
          }
        },
        put: {
          summary: `Update ${routeName} by ID`,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties,
                  required: requiredFields
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Updated'
            }
          }
        },
        delete: {
          summary: `Delete ${routeName} by ID`,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            '200': {
              description: 'Deleted'
            }
          }
        }
      };

      fs.writeFileSync(swaggerPath, JSON.stringify(swagger, null, 2));
    } catch (err) {
      console.error('❌ Failed to update swagger.json:', err.message);
    }
  }

  const modelContent = `const db = require('../utils/db');

module.exports = {
  getAll: (callback) => {
    db.query('SELECT * FROM ${answers.table}', callback);
  },
  getById: (id, callback) => {
    db.query('SELECT * FROM ${answers.table} WHERE id = ?', [id], callback);
  },
  insert: (data, callback) => {
    db.query('INSERT INTO ${answers.table} SET ?', [data], callback);
  },
  update: (id, data, callback) => {
    db.query('UPDATE ${answers.table} SET ? WHERE id = ?', [data, id], callback);
  },
  delete: (id, callback) => {
    db.query('DELETE FROM ${answers.table} WHERE id = ?', [id], callback);
  }
};
`;
  fs.writeFileSync(modelPath, modelContent);
  console.log(`📦 Model '${routeName}' created at models/${routeName}.js`);

  const controllerContent = `const model = require('../models/${routeName}');
const { encryptAES } = require('../utils/crypto');

exports.getAll = (req, res) => {
  model.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    const encrypted = encryptAES(JSON.stringify(results));
    res.json({ encrypted });
  });
};

exports.getById = (req, res) => {
  const id = req.params.id;
  model.getById(id, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result[0] || {});
  });
};

exports.insert = (req, res) => {
  const data = req.body;
  model.insert(data, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId });
  });
};

exports.update = (req, res) => {
  const id = req.params.id;
  const data = req.body;
  model.update(id, data, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: true });
  });
};

exports.delete = (req, res) => {
  const id = req.params.id;
  model.delete(id, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: true });
  });
};
`;
  fs.writeFileSync(controllerPath, controllerContent);
  console.log(`🧠 Controller '${routeName}' created at controllers/${routeName}Controller.js`);

  console.log(`✅ Route '${routeName}' created at routes/${routeName}.js`);
}

function removeRoute(routeName) {
  const modelPath = path.join(__dirname, 'models', `${routeName}.js`);
  const routePath = path.join(__dirname, 'routes', `${routeName}.js`);
  const controllerPath = path.join(__dirname, 'controllers', `${routeName}Controller.js`);
  const swaggerPath = path.join(__dirname, 'docs', 'swagger.json');

  if (!fs.existsSync(routePath)) {
    console.log(`❌ Route '${routeName}' does not exist.`);
    process.exit(1);
  }
  fs.unlinkSync(routePath);
  console.log(`🗑️  Route '${routeName}' removed from routes/${routeName}.js`);

  if (fs.existsSync(modelPath)) {
    fs.unlinkSync(modelPath);
    console.log(`🗑️  Model '${routeName}' removed from models/${routeName}.js`);
  }

  if (fs.existsSync(controllerPath)) {
    fs.unlinkSync(controllerPath);
    console.log(`🗑️  Controller '${routeName}' removed from controllers/${routeName}Controller.js`);
  }

  if (fs.existsSync(swaggerPath)) {
    try {
      const swagger = JSON.parse(fs.readFileSync(swaggerPath));
      delete swagger.paths[`/${routeName}`];
      delete swagger.paths[`/${routeName}/{id}`];
      fs.writeFileSync(swaggerPath, JSON.stringify(swagger, null, 2));
      console.log(`🧹 Swagger docs for '/${routeName}' removed.`);
    } catch (err) {
      console.error('❌ Failed to update swagger.json:', err.message);
    }
  }
}

(async () => {
  if (args[0] === '--route' && args[1] === 'create' && args[2]) {
    await createRoute(args[2]);
    process.exit(0);
  } else if (args[0] === '--route' && args[1] === 'remove' && args[2]) {
    removeRoute(args[2]);
    process.exit(0);
  }
})();
