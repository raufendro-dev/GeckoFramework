# GeckoFramework 🦎

**GeckoFramework** is a secure and developer-friendly Node.js backend framework designed to rapidly build RESTful APIs connected to MySQL, with built-in AES-256 response encryption, JWT authentication, CLI-powered route generation, and auto-generated Swagger documentation.

---

## 🚀 Features

* ✅ **Simple & Fast**: Minimal setup, fully working CRUD APIs in seconds
* 🔐 **Secure**: AES-256-CBC encrypted JSON responses, JWT-based auth
* 📦 **Modular**: Auto-generates models, controllers, routes
* 🧪 **Swagger Docs**: API documentation updates automatically with each route
* 💻 **CLI Tool**: Create or delete routes using a single command

---

## 🛠️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/geckoframework.git
cd geckoframework
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Create a `.env` file and fill in the following:

```env
CRYPTO_KEY=4a3b5d2ef6aa9d77cc46d14a8e5d1c59430b2c795fbd947579ff8abbb73e97fa
JWT_SECRET=s3cr3tJwtKey!
PORT=3000
HOST=0.0.0.0
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASS=your_mysql_password
DB_NAME=your_database
DB_PORT=3306
```

### 4. Start the server

```bash
npm start
```

Your API will be running at: `http://localhost:3000`
Swagger documentation is available at: `http://localhost:3000/docs`

---

## ⚙️ CLI Usage

### Create a new route

```bash
node gecko.js --route create users
```

You will be prompted for:

* **MySQL table name (for SELECT query)?**
* **Require auth? (true/false)**
* **Swagger summary?**

This will generate:

* `routes/users.js`
* `models/users.js`
* `controllers/usersController.js`
* And auto-update `swagger.json`

### Delete a route

```bash
node gecko.js --route remove users
```

This will remove all files and the Swagger entry for the route.

---

## 🔐 JWT Auth

To access protected routes, include the token:

```http
Authorization: Bearer <your-jwt-token>
```

You can create a login route and generate token using:

```js
const { createToken } = require('./auth/token');
const token = createToken({ id: user.id, role: user.role });
```

---

## 🔒 AES-256 Encryption

All list responses (e.g., `GET /users`) return:

```json
{
  "encrypted": "<AES-256-CBC encrypted payload>"
}
```

Use the `decryptAES` function from `utils/crypto.js` to decrypt it if needed.

---

## 🧪 Swagger

Auto-updated at `docs/swagger.json` every time a route is created/removed.
View in browser at: `http://localhost:3000/docs`

---

## 📁 Folder Structure

```
.
├── auth/                # Auth middleware & token helpers
├── controllers/         # Controller logic per route
├── docs/                # Swagger spec
├── models/              # Database queries
├── routes/              # Route definitions
├── utils/               # DB, crypto, loader utilities
├── .env                 # Configuration
├── gecko.js             # CLI tool
├── index.js             # Main server file
```

---

## 🤝 Contributing

Feel free to open issues or PRs. GeckoFramework is built to help developers ship secure APIs fast. If it helps you, consider ⭐ starring the repo!

---
