import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { supabase } from "./src/lib/supabase.js";
import { ai } from "./src/lib/gemini.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "default_secret_respiracrm_2024";

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable for Vite dev
  })
);

// Serve static uploads
app.use("/uploads", express.static(uploadDir));

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Access denied" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

// --- AUTH ROUTES ---
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) return res.status(400).json({ error: "User not found" });

    const validPass = await bcrypt.compare(password, user.password_hash);
    if (!validPass) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.full_name },
      JWT_SECRET,
      { expiresIn: "10h" }
    );

    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.full_name } });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { email, password, full_name, role } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const { data, error } = await supabase
      .from("users")
      .insert([{ email, password_hash, full_name, role }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── RECUPERAR CONTRASEÑA ──
app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.APP_URL || "http://localhost:3000"}/reset-password`,
    });
    if (error) {
       console.error("Supabase Reset Password Error:", error);
    }
    // Siempre responder éxito (no revelar si el correo existe)
    res.json({ message: "Si el correo está registrado, recibirás un enlace." });
  } catch (err) {
    console.error("Server Forgot Password Error:", err);
    res.json({ message: "Si el correo está registrado, recibirás un enlace." });
  }
});

app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
  res.json(req.user);
});

// --- OAUTH ROUTES ---
// We let the client handle /auth/callback to use Supabase client's session detection
// but we keep oauth-exchange to sync user profile in our DB

// Exchange OAuth code/tokens for a custom JWT
app.post("/api/auth/oauth-exchange", async (req, res) => {
  const { email, full_name, role } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    // Check if user exists in custom users table
    let { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error && error.code !== "PGRST116") { // Other error than 'not found'
      return res.status(400).json({ error: error.message });
    }

    if (!user) {
      // Create new user if they don't exist
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert([{ 
          email, 
          full_name: full_name || email.split('@')[0], 
          role: role || "sales", // Default role
          password_hash: "OAUTH_USER" // Placeholder
        }])
        .select()
        .single();
      
      if (createError) return res.status(400).json({ error: createError.message });
      user = newUser;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.full_name },
      JWT_SECRET,
      { expiresIn: "10h" }
    );

    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.full_name } });
  } catch (err) {
    res.status(500).json({ error: "Server error during exchange" });
  }
});

// --- UPLOAD ROUTE ---
app.post("/api/upload", authenticateToken, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

// --- CRM ROUTES (Generic CRUD) ---
const tables = [
  "customers",
  "prospects",
  "products",
  "quotes",
  "quote_items",
  "sales",
  "sale_items",
  "payments",
  "service_orders",
  "notifications",
  "audit_logs"
];

tables.forEach((table) => {
  // List
  app.get(`/api/${table}`, authenticateToken, async (req, res) => {
    let query = supabase.from(table).select("*");
    
    // Simple filter for related tables
    if (table === "prospects" && (req as any).user?.role === "sales") {
      query = query.eq("assigned_to", (req as any).user?.id);
    }
    
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  });

  // Get One
  app.get(`/api/${table}/:id`, authenticateToken, async (req, res) => {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("id", req.params.id)
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  });

  // Create
  app.post(`/api/${table}`, authenticateToken, async (req, res) => {
    const { data, error } = await supabase
      .from(table)
      .insert([req.body])
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  });

  // Update
  app.put(`/api/${table}/:id`, authenticateToken, async (req, res) => {
    console.log(`Updating ${table} ID ${req.params.id} with:`, req.body);
    const { data, error } = await supabase
      .from(table)
      .update(req.body)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) {
      console.error(`Update Error on ${table}:`, error);
      return res.status(400).json({ error: error.message });
    }
    res.json(data);
  });

  // Delete
  app.delete(`/api/${table}/:id`, authenticateToken, async (req, res) => {
    const { error } = await supabase.from(table).delete().eq("id", req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Deleted successfully" });
  });
});

// --- AI BOT ROUTES ---
app.post("/api/ai/chat", authenticateToken, async (req, res) => {
  const { message, context } = req.body;
  if (!message) return res.status(400).json({ error: "Mensaje vacío" });
  
  try {
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: message,
      config: {
        maxOutputTokens: 500,
        temperature: 0.7,
        systemInstruction: `Eres "RespiraBot", el asistente inteligente del CRM de RespiraCRM Colombia. 
        Tu objetivo es ayudar a los empleados (vendedores, técnicos, gerentes) a consultar información, stock, y procesos.
        Contexto actual del usuario: ${JSON.stringify(context)}.
        Responde de forma profesional, amable y en español. Si te piden datos que no tienes, sugiere revisar los módulos correspondientes.`
      }
    });

    // Handle response structure for @google/genai SDK
    const botResponse = result.text || "No pude generar una respuesta clara.";

    res.json({ response: botResponse });
  } catch (err: any) {
    console.error("AI Chat Error Details:", err);
    res.status(500).json({ error: "Error en el asistente AI: " + (err.message || 'Error desconocido') });
  }
});

// --- VITE MIDDLEWARE ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
