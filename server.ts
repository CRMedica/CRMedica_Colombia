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
app.get("/api/auth/oauth-url", async (req, res) => {
  const { provider } = req.query;
  
  // Use explicit env var or detect from host header
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  // Prefer the host from the request to ensure redirects stay on the same subdomain (pre vs dev)
  const baseUrl = `${protocol}://${host}`;
  const redirectUri = `${baseUrl}/auth/callback`;
  
  console.log("OAuth Redirect URI:", redirectUri);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as any,
    options: {
      redirectTo: redirectUri,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ url: data.url });
});

app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const { code, error, error_description } = req.query;
  console.log("OAuth Callback hit. Query:", req.query);
  console.log("OAuth Callback hit. Hash (not visible to server):", req.path);
  
  // Script to send message back to opener
  const sendMessage = (data: any) => `
    <html>
      <head>
        <title>Autenticando...</title>
        <style>
          body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; text-align: center; }
          .loader { border: 3px solid #f3f3f3; border-top: 3px solid #2563eb; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin-bottom: 16px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="loader"></div>
        <p id="status">Autenticación completada con éxito.</p>
        <p id="substatus" style="font-size: 14px; color: #64748b;">Esta ventana se cerrará automáticamente en un momento.</p>
        <script>
          const authData = ${JSON.stringify(data)};
          const channel = new BroadcastChannel('oauth_channel');
          
          function finish(dataToSend) {
            console.log("Finishing Auth with payload:", dataToSend);
            
            // 1. BroadcastChannel
            channel.postMessage({ type: "OAUTH_AUTH_SUCCESS", payload: dataToSend });
            
            // 2. window.opener
            if (window.opener) {
              try {
                window.opener.postMessage({ type: "OAUTH_AUTH_SUCCESS", payload: dataToSend }, "*");
              } catch (e) {
                console.error("Error sending postMessage:", e);
              }
            }
            
            // Close after a short delay to ensure messages are sent
            setTimeout(() => window.close(), 1500);
          }

          // Check if we are in the callback phase
          const urlParams = new URLSearchParams(window.location.search);
          const errorCode = urlParams.get('error');
          const errorDesc = urlParams.get('error_description');

          if (authData.error) {
            finish(authData);
          } else if (errorCode) {
            finish({ error: errorDesc || errorCode });
          } else if (authData.token) {
            finish(authData);
          } else {
            // Check for tokens in hash (implicit flow or Supabase automatic handling)
            const hash = window.location.hash.substring(1);
            if (hash) {
                // If there's a hash, it might be Supabase already handling it on the client
                // but since we are in a custom server callback, we should try to extract it
                // or just wait a bit if Supabase client is present (unlikely in this minimal HTML)
                const hashParams = new URLSearchParams(hash);
                const accessToken = hashParams.get('access_token');
                
                if (accessToken) {
                   // If we have an access token, we can try to use it
                   // but usually the server callback wants to send its own JWT.
                   // Let's just pass the whole hash along as info
                   finish({ type: "HASH_AUTH", hash: hash });
                } else {
                   finish({ error: "No se pudo extraer el token del hash." });
                }
            } else {
              finish({ error: "No se recibió código ni token de autenticación." });
            }
          }

          setTimeout(() => {
            document.body.innerHTML = '<h1>¡Listo!</h1><p>Ya puedes cerrar esta ventana y regresar a la aplicación.</p><button onclick="window.close()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer;">Cerrar ventana</button>';
          }, 5000);
        </script>
      </body>
    </html>
  `;

  if (error) {
    return res.send(sendMessage({ error: error_description || error }));
  }

  if (code) {
    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code as string);
      if (exchangeError) throw exchangeError;

      const { user } = data;
      if (user) {
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

  res.send(sendMessage({ error: "No se recibió código de Google." }));
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
    // Enrich context with real data based on the current path
    let enrichedContext = { ...context };
    
    const currentPath = context?.currentPath || "";
    
    if (currentPath.includes("/crm/products")) {
       const { data: products } = await supabase.from("products").select("name, sku, price, stock, category, description").limit(50);
       enrichedContext.products = products;
       enrichedContext.dataTitle = "Lista de Productos (Stock)";
    } else if (currentPath.includes("/crm/customers")) {
       const { data: customers } = await supabase.from("customers").select("id, full_name, company, email, city, status").limit(30);
       enrichedContext.customers = customers;
       enrichedContext.dataTitle = "Directorio de Clientes";
    } else if (currentPath.includes("/crm/prospects")) {
       const { data: prospects } = await supabase.from("prospects").select("id, full_name, company, status, source").limit(30);
       enrichedContext.prospects = prospects;
       enrichedContext.dataTitle = "Lista de Prospectos (Leads)";
    }

    const result = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [{ role: "user", parts: [{ text: message }] }],
      config: {
        maxOutputTokens: 800,
        temperature: 0.2, // Lower temperature for more precision
        systemInstruction: `Eres "RespiraBot", el asistente inteligente experto de RespiraCRM Colombia.
          
          TU MISIÓN: Ayudar al equipo con datos REALES del sistema.
          
          REGLAS DE ORO:
          1. DATOS: Usa EXCLUSIVAMENTE el contexto abajo para responder. Si te preguntan por stock, busca la columna "stock" en la lista de productos. Si te preguntan cuántos hay, cuenta los elementos en el JSON.
          2. PRECISIÓN: No inventes datos. Si un producto no está en la lista, di: "No encuentro ese producto en los primeros 50 registros del sistema".
          3. ESTILO: Profesional, resolutivo y breve. No des introducciones largas si es una conversación en curso.
          4. NAVEGACIÓN: Si el usuario pregunta por algo que no está en su módulo actual (ej. pregunta por clientes estando en productos), explícale que debe ir al módulo de Clientes para que tú puedas leer esa información.
          
          DATOS DEL SISTEMA (JSON):
          ${JSON.stringify(enrichedContext)}`
      },
    });

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
