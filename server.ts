import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";
import { supabase } from "./src/lib/supabase.js";
import { ai } from "./src/lib/gemini.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "default_secret_respiracrm_2024";

// Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable for Vite dev
  })
);

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
app.get("/api/auth/oauth-url", async (req, res) => {
  const { provider } = req.query;
  const redirectUri = `${process.env.APP_URL || "http://localhost:3000"}/auth/callback`;
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as any,
    options: {
      redirectTo: redirectUri,
      skipBrowserRedirect: true
    }
  });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ url: data.url });
});

app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const { code } = req.query;
  
  // Script to send message back to opener
  const sendMessage = (data: any) => `
    <html>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: "OAUTH_AUTH_SUCCESS", payload: ${JSON.stringify(data)} }, "*");
            window.close();
          } else {
            window.location.href = "/";
          }
        </script>
        <p>Autenticando... Esta ventana se cerrará automáticamente.</p>
      </body>
    </html>
  `;

  if (code) {
    try {
      // Create a fresh client for the server exchange that uses the anon key or service role
      // But we need to use the same logic as the initial request
      const { data, error } = await supabase.auth.exchangeCodeForSession(code as string);
      if (error) throw error;

      const { user } = data;
      if (user) {
        // Find or create in custom users table
        let { data: dbUser, error: dbError } = await supabase
          .from("users")
          .select("*")
          .eq("email", user.email)
          .single();

        if (!dbUser && (!dbError || dbError.code === "PGRST116")) {
          const { data: newUser, error: createError } = await supabase
            .from("users")
            .insert([{ 
              email: user.email, 
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0], 
              role: "sales",
              password_hash: "OAUTH_USER"
            }])
            .select()
            .single();
          if (createError) throw createError;
          dbUser = newUser;
        } else if (dbError && dbError.code !== "PGRST116") {
          throw dbError;
        }

        const token = jwt.sign(
          { id: dbUser.id, email: dbUser.email, role: dbUser.role, name: dbUser.full_name },
          JWT_SECRET,
          { expiresIn: "10h" }
        );

        return res.send(sendMessage({ token, user: { id: dbUser.id, email: dbUser.email, role: dbUser.role, name: dbUser.full_name } }));
      }
    } catch (err: any) {
      console.error("OAuth Exchange Error:", err);
      return res.send(sendMessage({ error: err.message }));
    }
  }

  res.send(sendMessage({ error: "No code provided" }));
});

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
    const { data, error } = await supabase
      .from(table)
      .update(req.body)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
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
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: message }] }],
      generationConfig: {
        systemInstruction: `Eres "RespiraBot", el asistente inteligente del CRM de RespiraCRM Colombia. 
        Tu objetivo es ayudar a los empleados (vendedores, técnicos, gerentes) a consultar información, stock, y procesos.
        Contexto actual del usuario: ${JSON.stringify(context)}.
        Responde de forma profesional, amable y concisa. Si te piden datos que no tienes, sugiere revisar los módulos correspondientes.`
      }
    });

    res.json({ response: response.text });
  } catch (err: any) {
    console.error("AI Chat Error:", err);
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
