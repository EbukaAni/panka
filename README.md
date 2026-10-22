# Express MVC App (ORM-agnostic)

A clean Node.js + Express project structured with **routes → controllers → models**.
Models are currently plain in-memory JS (no ORM wired up yet), so you can drop in
Mongoose, Sequelize, Prisma, or anything else later with minimal rewiring.

## Structure

```
express-app/
├── config/            # (empty for now — add db.js here when you pick an ORM)
├── controllers/
│   └── userController.js
├── middleware/
│   ├── errorHandler.js
│   └── notFound.js
├── models/
│   └── userModel.js   # in-memory data store, ORM-shaped method names
├── routes/
│   └── userRoutes.js
├── .env.example
├── package.json
└── server.js
```

## Getting started

```bash
npm install
cp .env.example .env
npm run dev      # requires nodemon (already in devDependencies)
# or
npm start
```

Server runs on `http://localhost:5000` by default.

## API endpoints (Users example)

| Method | Endpoint          | Description       |
|--------|-------------------|--------------------|
| GET    | /api/users        | List all users     |
| GET    | /api/users/:id    | Get a single user  |
| POST   | /api/users        | Create a user      |
| PUT    | /api/users/:id    | Update a user      |
| DELETE | /api/users/:id    | Delete a user      |

Example create request:
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe", "email": "jane@example.com", "age": 28}'
```

## Adding an ORM later

The model file (`models/userModel.js`) already exposes ORM-style methods:
`find`, `findById`, `create`, `findByIdAndUpdate`, `findByIdAndDelete`.

To swap in a real ORM:
1. Install it (`npm install mongoose` or `npm install sequelize pg`, etc.)
2. Create `config/db.js` with your connection logic, and call it from `server.js`.
3. Rewrite the internals of the functions in `userModel.js` to use real queries,
   keeping the same function names — `userController.js` won't need any changes.

## Adding more resources

To add a new resource (e.g. "Product"), just repeat the pattern:
1. `models/productModel.js`
2. `controllers/productController.js`
3. `routes/productRoutes.js`
4. Register it in `server.js`: `app.use('/api/products', productRoutes);`
