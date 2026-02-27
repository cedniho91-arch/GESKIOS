import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("pos.db");

// Initialisation de la base de données
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    is_available INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount REAL NOT NULL,
    payment_mode TEXT NOT NULL,
    status TEXT DEFAULT 'COMPLETED'
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id TEXT NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS expense_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    date DATE DEFAULT (DATE('now'))
  );
`);

// Insertion de données de test si vide
const categoryCount = db.prepare("SELECT COUNT(*) as count FROM expense_categories").get() as { count: number };
if (categoryCount.count === 0) {
  const insertCat = db.prepare("INSERT INTO expense_categories (name) VALUES (?)");
  ['Loyer', 'Electricité', 'Eau', 'Autres'].forEach(cat => insertCat.run(cat));
}

const productCount = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
if (productCount.count === 0) {
  const insertProduct = db.prepare("INSERT INTO products (name, price, category) VALUES (?, ?, ?)");
  insertProduct.run("Burger Classique", 3500, "Plats");
  insertProduct.run("Pizza Margherita", 5000, "Plats");
  insertProduct.run("Coca Cola", 500, "Boissons");
  insertProduct.run("Café Expresso", 1000, "Boissons");
  insertProduct.run("Tiramisu", 2500, "Desserts");
}

const app = express();
app.use(express.json());

// API Routes
app.get("/api/products", (req, res) => {
  const products = db.prepare("SELECT * FROM products").all();
  res.json(products);
});

app.post("/api/products", (req, res) => {
  const { name, price, category } = req.body;
  try {
    const result = db.prepare("INSERT INTO products (name, price, category) VALUES (?, ?, ?)")
      .run(name, price, category);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.put("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const { name, price, category, is_available } = req.body;
  try {
    db.prepare("UPDATE products SET name = ?, price = ?, category = ?, is_available = ? WHERE id = ?")
      .run(name, price, category, is_available, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("DELETE FROM products WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/api/expense-categories", (req, res) => {
  const categories = db.prepare("SELECT * FROM expense_categories").all();
  res.json(categories);
});

app.post("/api/expense-categories", (req, res) => {
  const { name } = req.body;
  try {
    const result = db.prepare("INSERT INTO expense_categories (name) VALUES (?)").run(name);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/sales", (req, res) => {
  const { id, total_amount, payment_mode, items } = req.body;
  
  const transaction = db.transaction(() => {
    db.prepare("INSERT INTO sales (id, total_amount, payment_mode) VALUES (?, ?, ?)")
      .run(id, total_amount, payment_mode);
    
    const insertItem = db.prepare("INSERT INTO sale_items (sale_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)");
    for (const item of items) {
      insertItem.run(id, item.product_id, item.quantity, item.unit_price);
    }
  });

  try {
    transaction();
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/api/dashboard", (req, res) => {
  const sales = db.prepare("SELECT SUM(total_amount) as total FROM sales WHERE status = 'COMPLETED'").get() as { total: number };
  const expenses = db.prepare("SELECT SUM(amount) as total FROM expenses").get() as { total: number };
  
  const ca = sales.total || 0;
  const charges = expenses.total || 0;
  
  res.json({
    ca,
    charges,
    profit: ca - charges
  });
});

app.get("/api/expenses", (req, res) => {
  const expenses = db.prepare("SELECT * FROM expenses ORDER BY date DESC").all();
  res.json(expenses);
});

app.post("/api/expenses", (req, res) => {
  const { description, amount, category } = req.body;
  try {
    db.prepare("INSERT INTO expenses (description, amount, category) VALUES (?, ?, ?)")
      .run(description, amount, category);
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/api/backup", (req, res) => {
  const products = db.prepare("SELECT * FROM products").all();
  const sales = db.prepare("SELECT * FROM sales").all();
  const sale_items = db.prepare("SELECT * FROM sale_items").all();
  const expenses = db.prepare("SELECT * FROM expenses").all();
  const expense_categories = db.prepare("SELECT * FROM expense_categories").all();
  
  const backup = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    data: {
      products,
      sales,
      sale_items,
      expenses,
      expense_categories
    }
  };
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=pos_backup.json');
  res.send(JSON.stringify(backup, null, 2));
});

app.post("/api/restore", (req, res) => {
  const { data } = req.body;
  if (!data) return res.status(400).json({ error: "No data provided" });

  const transaction = db.transaction(() => {
    // Clear existing data
    db.prepare("DELETE FROM sale_items").run();
    db.prepare("DELETE FROM sales").run();
    db.prepare("DELETE FROM products").run();
    db.prepare("DELETE FROM expenses").run();
    db.prepare("DELETE FROM expense_categories").run();

    // Restore products
    if (data.products) {
      const insert = db.prepare("INSERT INTO products (id, name, price, category, image_url, is_available) VALUES (?, ?, ?, ?, ?, ?)");
      for (const p of data.products) {
        insert.run(p.id, p.name, p.price, p.category, p.image_url, p.is_available);
      }
    }

    // Restore expense categories
    if (data.expense_categories) {
      const insert = db.prepare("INSERT INTO expense_categories (id, name) VALUES (?, ?)");
      for (const c of data.expense_categories) {
        insert.run(c.id, c.name);
      }
    }

    // Restore expenses
    if (data.expenses) {
      const insert = db.prepare("INSERT INTO expenses (id, description, amount, category, date) VALUES (?, ?, ?, ?, ?)");
      for (const e of data.expenses) {
        insert.run(e.id, e.description, e.amount, e.category, e.date);
      }
    }

    // Restore sales
    if (data.sales) {
      const insert = db.prepare("INSERT INTO sales (id, created_at, total_amount, payment_mode, status) VALUES (?, ?, ?, ?, ?)");
      for (const s of data.sales) {
        insert.run(s.id, s.created_at, s.total_amount, s.payment_mode, s.status);
      }
    }

    // Restore sale items
    if (data.sale_items) {
      const insert = db.prepare("INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?)");
      for (const i of data.sale_items) {
        insert.run(i.id, i.sale_id, i.product_id, i.quantity, i.unit_price);
      }
    }
  });

  try {
    transaction();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, "dist")));
}

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
