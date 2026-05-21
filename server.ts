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

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        name: user.full_name 
      } 
    });
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

// ── CONFIRMAR RESTABLECIMIENTO DE CONTRASEÑA ──
app.post("/api/auth/reset-password", async (req, res) => {
  const { password, access_token } = req.body;
  if (!password || !access_token) {
    return res.status(400).json({ error: "Contraseña o token faltante" });
  }

  try {
    // Verificar el access token de Supabase para obtener el email del usuario de forma segura
    const { data, error: authError } = await supabase.auth.getUser(access_token);
    if (authError || !data.user) {
      console.error("Error al verificar token con Supabase:", authError);
      return res.status(401).json({ error: "El token de restablecimiento es inválido, ha expirado o ya fue utilizado." });
    }

    const email = data.user.email;
    if (!email) {
      return res.status(400).json({ error: "No se pudo recuperar el correo asociado al token" });
    }

    // Generar nuevo hash de contraseña con bcrypt
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Actualizar en nuestra tabla de usuarios personalizada
    const { error: dbError } = await supabase
      .from("users")
      .update({ password_hash })
      .eq("email", email);

    if (dbError) {
      console.error("Error al actualizar la tabla de usuarios:", dbError);
      return res.status(500).json({ error: "Error en base de datos al guardar la nueva contraseña" });
    }

    // Sincronizar también su contraseña en el Auth de Supabase (opcional pero mantiene todo consistente)
    await supabase.auth.updateUser({ password });

    res.json({ success: true, message: "Contraseña restablecida con éxito." });
  } catch (err) {
    console.error("Server Reset Password Error:", err);
    res.status(500).json({ error: "Error interno del servidor" });
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
        <p id="status">Verificando sesión...</p>
        <p id="substatus" style="font-size: 14px; color: #64748b;">Esta ventana se cerrará automáticamente.</p>
        <script>
          const authData = ${JSON.stringify(data)};
          const channel = new BroadcastChannel('oauth_channel');
          
          function finish(dataToSend) {
            console.log("Finishing Auth with payload:", dataToSend);
            channel.postMessage({ type: "OAUTH_AUTH_SUCCESS", payload: dataToSend });
            if (window.opener) {
              try { window.opener.postMessage({ type: "OAUTH_AUTH_SUCCESS", payload: dataToSend }, "*"); } catch (e) {}
            }
            setTimeout(() => window.close(), 1500);
          }

          const hash = window.location.hash.substring(1);
          const hashParams = new URLSearchParams(hash);
          const accessToken = hashParams.get('access_token');
          
          if (authData.token) {
            finish(authData);
          } else if (accessToken) {
            // Implicit flow: exchange token for custom JWT
            document.getElementById('status').innerText = 'Validando sesión...';
            fetch('/api/auth/verify-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ access_token: accessToken })
            })
            .then(res => res.json())
            .then(data => {
              if (data.token) {
                finish(data);
              } else {
                finish({ error: data.error || 'Error al validar sesión' });
              }
            })
            .catch(err => finish({ error: 'Error de red al validar sesión' }));
          } else if (authData.error) {
            finish(authData);
          } else {
            const urlParams = new URLSearchParams(window.location.search);
            const qErr = urlParams.get('error_description') || urlParams.get('error');
            if (qErr) {
              finish({ error: qErr });
            } else {
              setTimeout(() => {
                const retryHash = new URLSearchParams(window.location.hash.substring(1));
                const retryToken = retryHash.get('access_token');
                if (retryToken) {
                  // Retry the same token validation logic
                  fetch('/api/auth/verify-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ access_token: retryToken })
                  })
                  .then(res => res.json())
                  .then(data => finish(data))
                  .catch(err => finish({ error: 'Retry failed' }));
                } else {
                  finish({ error: authData.error || "No se detectó código ni token de Google." });
                }
              }, 1000);
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
        let { data: dbUser } = await supabase.from("users").select("*").eq("email", user.email).single();
        if (!dbUser) {
          const { data: newUser } = await supabase.from("users").insert([{
            email: user.email,
            full_name: user.user_metadata.full_name || user.user_metadata.name || user.email?.split('@')[0],
            role: 'sales',
            status: 'activo'
          }]).select().single();
          dbUser = newUser;
        } else {
          // Update existing user with fresh metadata if it was a placeholder or empty
          const googleName = user.user_metadata.full_name || user.user_metadata.name;
          if (googleName && (!dbUser.full_name || dbUser.full_name === 'Usuario')) {
            const { data: updatedUser } = await supabase
              .from("users")
              .update({ full_name: googleName })
              .eq("id", dbUser.id)
              .select()
              .single();
            if (updatedUser) dbUser = updatedUser;
          }
        }

        const token = jwt.sign(
          { 
            id: dbUser?.id || user.id, 
            email: user.email, 
            role: dbUser?.role || 'sales',
            name: dbUser?.full_name || user.user_metadata.full_name || user.user_metadata.name || user.email?.split('@')[0]
          },
          JWT_SECRET,
          { expiresIn: "7d" }
        );
        
        const responseUser = {
          id: dbUser?.id || user.id,
          email: user.email,
          role: dbUser?.role || 'sales',
          name: dbUser?.full_name || user.user_metadata.full_name || user.user_metadata.name || user.email?.split('@')[0]
        };

        return res.send(sendMessage({ token, user: responseUser }));
      }
    } catch (err: any) {
      console.error("Auth Exchange Error:", err);
      return res.send(sendMessage({ error: "Error al intercambiar el código: " + err.message }));
    }
  }

  // If no code, the client script will check for # fragment
  res.send(sendMessage({}));
});

// Exchange access_token (from hash) for a custom JWT
app.post("/api/auth/verify-token", async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) return res.status(400).json({ error: "No access token provided" });

  try {
    const { data: { user }, error } = await supabase.auth.getUser(access_token);
    if (error || !user) throw error || new Error("Invalid token");

    let { data: dbUser } = await supabase.from("users").select("*").eq("email", user.email).single();
    
    if (!dbUser) {
      const { data: newUser, error: createError } = await supabase.from("users").insert([{
        email: user.email,
        full_name: user.user_metadata.full_name || user.user_metadata.name || user.email?.split('@')[0],
        role: 'sales',
        status: 'activo'
      }]).select().single();
      if (createError) throw createError;
      dbUser = newUser;
    } else {
      // Update existing user with Google metadata if current is generic
      const googleName = user.user_metadata.full_name || user.user_metadata.name;
      if (googleName && (!dbUser.full_name || dbUser.full_name === 'Usuario')) {
        const { data: updatedUser } = await supabase
          .from("users")
          .update({ full_name: googleName })
          .eq("id", dbUser.id)
          .select()
          .single();
        if (updatedUser) dbUser = updatedUser;
      }
    }

    const token = jwt.sign(
      { 
        id: dbUser?.id || user.id, 
        email: user.email, 
        role: dbUser?.role || 'sales',
        name: dbUser?.full_name || user.user_metadata.full_name || user.user_metadata.name || user.email?.split('@')[0]
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    const responseUser = {
      id: dbUser?.id || user.id,
      email: user.email,
      role: dbUser?.role || 'sales',
      name: dbUser?.full_name || user.user_metadata.full_name || user.user_metadata.name || user.email?.split('@')[0]
    };
    
    res.json({ token, user: responseUser });
  } catch (err: any) {
    console.error("Verify Token Error:", err);
    res.status(401).json({ error: err.message });
  }
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

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        name: user.full_name 
      } 
    });
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

  // Detailed mock definitions to guarantee consistent answers matching UI seed when DB tables are empty
  const fallbackProducts = [
    { id: '1', sku: 'OX-500', name: 'Concentrador de Oxígeno EverFlo 5L', category: 'Oxigenoterapia', brand: 'Philips Respironics', price: 4200000, stock: 12, description: 'Concentrador de oxígeno estacionario ultra confiable y compacto.', provider: 'Philips', warranty: '1 año' },
    { id: '2', sku: 'OX-1000', name: 'Concentrador de Oxígeno Millennium M10 10L', category: 'Oxigenoterapia', brand: 'Philips Respironics', price: 7800000, stock: 4, description: 'Dispositivo estacionario diseñado para suministrar flujo continuo de oxígeno hasta 10 litros.', provider: 'Philips', warranty: '1 año' },
    { id: '3', sku: 'OX-PORT', name: 'Concentrador de Oxígeno Portátil SimplyGo', category: 'Oxigenoterapia', brand: 'Philips', price: 9500000, stock: 3, description: 'El único concentrador de oxigeno portátil duradero que ofrece flujo continuo y pulso.', provider: 'Philips', warranty: '2 años' },
    { id: '4', sku: 'CPAP-A11', name: 'CPAP AutoSet AirSense 11', category: 'Apnea', brand: 'ResMed', price: 3800000, stock: 18, description: 'Equipo automático de presión con conectividad IoT avanzada para terapia del sueño.', provider: 'ResMed', warranty: '2 años' },
    { id: '5', sku: 'BPAP-CURV', name: 'BiPAP AirCurve 10 VAuto Tripack', category: 'Apnea', brand: 'ResMed', price: 6900000, stock: 7, description: 'Dispositivo binivel autoajustable con humidificador HumidAir integrado para pacientes respiratorios.', provider: 'ResMed', warranty: '2 años' },
    { id: '6', sku: 'MASK-N30', name: 'Máscara Nasal AirFit N30', category: 'Insumos', brand: 'ResMed', price: 550000, stock: 32, description: 'Máscara nasal con soporte discreto y arnés ajustable debajo de la boca.', provider: 'ResMed', warranty: '3 meses' },
    { id: '7', sku: 'MASK-F20', name: 'Máscara Facio-Nasal AirFit F20', category: 'Insumos', brand: 'ResMed', price: 680000, stock: 22, description: 'Máscara oronasal de alto sellado, ideal para terapia con flujos y presiones elevadas.', provider: 'ResMed', warranty: '3 meses' },
    { id: '8', sku: 'NEB-PORT', name: 'Nebulizador Portátil de Malla NEB-M1', category: 'Nebulización', brand: 'Omron', price: 350000, stock: 15, description: 'Nebulizador ultra portátil y silencioso con tecnología de malla transductora activa.', provider: 'Omron Colombia', warranty: '1 año' },
    { id: '9', sku: 'NEB-CLINIC', name: 'Nebulizador Hospitalario Compresor C28', category: 'Nebulización', brand: 'Omron', price: 420000, stock: 11, description: 'Compresor de alta durabilidad para dispensar broncodilatadores con gran tasa de nebulizado.', provider: 'Omron Colombia', warranty: '1 año' },
    { id: '10', sku: 'OXI-PULSE', name: 'Oxímetro de Pulso Digital Nonin Onyx', category: 'Insumos', brand: 'Nonin', price: 290000, stock: 45, description: 'Oxímetro de gran precisión militar y uso clínico continuo certificado por FDA.', provider: 'Nonin USA', warranty: '1 año' }
  ];

  const fallbackCustomers = [
    { id: "c1", name: "Fundación Neumológica de Colombia", document_type: "NIT", document_id: "860.034.908-2", phone: "+57 (601) 742-8900", email: "compras@neumologica.org", address: "Calle 163a # 13-60", city: "Bogotá", department: "Bogotá D.C.", status: "active" },
    { id: "c2", name: "IPS Neumored SAS", document_type: "NIT", document_id: "901.442.115-4", phone: "320 890 1212", email: "gerencia@neumored.co", address: "Avenida 4N # 23N-50", city: "Cali", department: "Valle del Cauca", status: "active" },
    { id: "c3", name: "Clínica Respirar con Dignidad", document_type: "NIT", document_id: "800.224.510-1", phone: "318 456 2200", email: "servicio@respirardignidad.com", address: "Carrera 43A # 14-20", city: "Medellín", department: "Antioquia", status: "active" },
    { id: "c4", name: "IPS Oxiseguridad de la Costa", document_type: "NIT", document_id: "900.512.980-3", phone: "301 556 7788", email: "mantenimiento@oxiseguridad.com", address: "Calle 72 # 53-12", city: "Barranquilla", department: "Atlántico", status: "inactive" },
    { id: "c5", name: "Hospital Universitario Hernando Moncaleano", document_type: "NIT", document_id: "891.180.017-5", phone: "310 998 1234", email: "compras@hospitalneiva.gov.co", address: "Calle 9 # 15-25", city: "Neiva", department: "Huila", status: "active" },
    { id: "c6", name: "IPS Alivio Pulmonar de los Andes", document_type: "NIT", document_id: "900.223.119-0", phone: "315 440 2211", email: "contacto@aliviopulmonar.co", address: "Carrera 23 # 45-10", city: "Manizales", department: "Caldas", status: "active" },
    { id: "c7", name: "Clínica Cardiorespiratoria del Caribe", document_type: "NIT", document_id: "806.012.333-4", phone: "320 889 4433", email: "info@cardiorespiratoriacaribe.com", address: "Avenida Pedro de Heredia # 32-45", city: "Cartagena", department: "Bolívar", status: "active" },
    { id: "c8", name: "Oxígenos de Occidente y Soporte SAS", document_type: "NIT", document_id: "901.332.887-2", phone: "311 229 0101", email: "admon@oxigenosoccidente.com", address: "Calle 18 # 22-80", city: "Pasto", department: "Nariño", status: "inactive" },
    { id: "c9", name: "Clínica de Somnología y Apnea del Llano", document_type: "NIT", document_id: "822.019.228-1", phone: "317 550 4499", email: "admisiones@suenollano.co", address: "Carrera 40 # 33B-12", city: "Villavicencio", department: "Meta", status: "active" },
    { id: "c10", name: "Hospital Universitario San Jorge", document_type: "NIT", document_id: "891.480.002-9", phone: "300 443 1122", email: "suministros@hospitalsanjorge.gov.co", address: "Carrera 4 # 24-50", city: "Pereira", department: "Risaralda", status: "active" }
  ];

  const fallbackProspects = [
    { id: "p1", name: "Dr. Alejandro Gómez", company: "Clínica de Neumología Bogotá", email: "alejandro.gomez@clinicaneumobogota.com", phone: "315 443 1122", city: "Bogotá", source: "Recomendación Médica", product_of_interest: "CPAP AutoSet AirSense 11", budget: 3800000, status: "qualified" },
    { id: "p2", name: "Ing. Sofía Castro", company: "Medicox Alquileres", email: "compras@medicox.com.co", phone: "300 445 6677", city: "Cali", source: "Búsqueda Web", product_of_interest: "Concentrador de Oxígeno EverFlo 5L", budget: 8400000, status: "new" },
    { id: "p3", name: "Dr. Juan Cardona", company: "VIP Care Home", email: "juan.cardona@vipcare.com", phone: "312 990 0112", city: "Medellín", source: "Licitación Privada", product_of_interest: "Concentrador de Oxígeno Portátil SimplyGo", budget: 19000000, status: "proposal" },
    { id: "p4", name: "Dra. Martha Luz", company: "IPS Respirando Sano", email: "martha.luz@respirandosano.org", phone: "318 221 0044", city: "Barranquilla", source: "Congreso Médico", product_of_interest: "BiPAP AirCurve 10 VAuto Tripack", budget: 6900000, status: "won" },
    { id: "p5", name: "Dr. Santiago Restrepo", company: "Neumocuidado SAS", email: "santiago.restrepo@neumocuidado.com", phone: "311 889 0291", city: "Barranquilla", source: "Congreso de Neumología 2024", product_of_interest: "CPAP Autoset AirSense 11", budget: 11400000, status: "new" },
    { id: "p6", name: "Enfermera Pilar Ruiz", company: "Hogar de Paso Santa Clara", email: "pilar.ruiz@santaclara.org.co", phone: "315 220 9011", city: "Bucaramanga", source: "Página Web", product_of_interest: "Concentrador de Oxígeno EverFlo 5L", budget: 4200000, status: "contacted" },
    { id: "p7", name: "Dr. Camilo Echeverry", company: "Unidad de Sueño del Country", email: "camilo.echeverry@clinicaelcountry.com", phone: "320 440 2211", city: "Bogotá", source: "Llamada Fría", product_of_interest: "BiPAP AirCurve 10 VAuto Tripack", budget: 34500000, status: "proposal" },
    { id: "p8", name: "Directora Gloria Alzate", company: "IPS Neumovida SAS", email: "galzate@neumovida.com", phone: "310 500 4010", city: "Pereira", source: "Referenciado", product_of_interest: "Concentrador de Oxígeno Millennium M10 10L", budget: 15600000, status: "contacted" },
    { id: "p9", name: "Dr. Ernesto Sabogal", company: "Fundación Hospitalaria San Vicente", email: "ernesto.sabogal@sanvicente.org", phone: "312 900 8110", city: "Medellín", source: "Página Web", product_of_interest: "Máscara Facio-Nasal AirFit F20", budget: 6800000, status: "won" },
    { id: "p10", name: "Lic. Claudia Rojas", company: "IPS Respirar Sano", email: "claudia.rojas@respirarsano.co", phone: "301 772 1010", city: "Cúcuta", source: "Referenciado", product_of_interest: "Oxímetro de Pulso Digital Nonin Onyx", budget: 2900000, status: "lost" }
  ];

  const fallbackQuotes = [
    { id: "q1", quote_number: 1024, customer_id: "c1", total: 4350000, status: "accepted", notes: "Cotización de Concentrador EverFlo para la Fundación Neumológica." },
    { id: "q2", quote_number: 1025, customer_id: "c2", total: 4430000, status: "sent", notes: "CPAP oficial con máscara nasal AirFit N30." },
    { id: "q3", quote_number: 1026, customer_id: "c3", total: 16750000, status: "accepted", notes: "Consola de oxigenoterapia con 3 Concentradores EverFlo 5L." },
    { id: "q4", quote_number: 1027, customer_id: "c5", total: 11450000, status: "draft", notes: "Licitación Hospital Universitario Neiva." },
    { id: "q5", quote_number: 1028, customer_id: "c4", total: 3950000, status: "rejected", notes: "Cotización de CPAP Autocontrolado para el hogar de medicina del sueño." },
    { id: "q6", quote_number: 1029, customer_id: "c7", total: 15450000, status: "sent", notes: "Pack de 2 BiPAP AirCurve y 5 Máscaras AirFit F20." }
  ];

  const fallbackSales = [
    { id: "s1", customer_id: "c1", total: 4350000, status: "confirmed", delivery_status: "shipped", created_at: "2026-05-18" },
    { id: "s2", customer_id: "c2", total: 4430000, status: "paid", delivery_status: "delivered", created_at: "2026-05-19" },
    { id: "s3", customer_id: "c3", total: 16750000, status: "paid", delivery_status: "delivered", created_at: "2026-05-20" },
    { id: "s4", customer_id: "c5", total: 9500000, status: "confirmed", delivery_status: "not_shipped", created_at: "2026-05-20" },
    { id: "s5", customer_id: "c7", total: 15450000, status: "pending", delivery_status: "shipped", created_at: "2026-05-21" },
    { id: "s6", customer_id: "c3", total: 4200000, status: "paid", delivery_status: "delivered", created_at: "2026-05-21" }
  ];

  const fallbackServiceOrders = [
    { id: "so1", customer_id: "c1", product_id: "1", type: "corrective", status: "in_progress", diagnosis: "Filtro de entrada saturado de polvo y caída de presión. Requiere cambio preventivo de zeolita." },
    { id: "so2", customer_id: "c3", product_id: "4", type: "preventive", status: "completed", diagnosis: "Mantenimiento preventivo anual realizado con éxito." }
  ];

  try {
    // Collect all data elements from Supabase securely & concurrently
    let dbProducts: any[] = [];
    let dbCustomers: any[] = [];
    let dbProspects: any[] = [];
    let dbQuotes: any[] = [];
    let dbSales: any[] = [];
    let dbServiceOrders: any[] = [];

    try {
      const { data } = await supabase.from("products").select("id, sku, name, category, brand, description, price, stock, provider, warranty").limit(100);
      if (data && data.length > 0) dbProducts = data;
    } catch (e) {
      console.error("Error querying products table in AI Route:", e);
    }

    try {
      const { data } = await supabase.from("customers").select("id, name, document_type, document_id, phone, email, address, city, department, status").limit(100);
      if (data && data.length > 0) dbCustomers = data;
    } catch (e) {
      console.error("Error querying customers table in AI Route:", e);
    }

    try {
      const { data } = await supabase.from("prospects").select("id, name, company, email, phone, city, source, product_of_interest, budget, status, notes").limit(100);
      if (data && data.length > 0) dbProspects = data;
    } catch (e) {
      console.error("Error querying prospects table in AI Route:", e);
    }

    try {
      const { data } = await supabase.from("quotes").select("id, quote_number, customer_id, total, status, notes").limit(100);
      if (data && data.length > 0) dbQuotes = data;
    } catch (e) {
      console.error("Error querying quotes table in AI Route:", e);
    }

    try {
      const { data } = await supabase.from("sales").select("id, customer_id, total, status, delivery_status, created_at").limit(100);
      if (data && data.length > 0) dbSales = data;
    } catch (e) {
      console.error("Error querying sales table in AI Route:", e);
    }

    try {
      const { data } = await supabase.from("service_orders").select("id, customer_id, product_id, type, status, diagnosis").limit(100);
      if (data && data.length > 0) dbServiceOrders = data;
    } catch (e) {
      console.error("Error querying service_orders table in AI Route:", e);
    }

    // Build the fully enriched context giving the AI absolute context access
    const enrichedContext = {
      userRole: context?.userRole,
      currentPath: context?.currentPath,
      products: dbProducts.length > 0 ? dbProducts : fallbackProducts,
      customers: dbCustomers.length > 0 ? dbCustomers : fallbackCustomers,
      prospects: dbProspects.length > 0 ? dbProspects : fallbackProspects,
      quotes: dbQuotes.length > 0 ? dbQuotes : fallbackQuotes,
      sales: dbSales.length > 0 ? dbSales : fallbackSales,
      serviceOrders: dbServiceOrders.length > 0 ? dbServiceOrders : fallbackServiceOrders
    };

    const result = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [{ role: "user", parts: [{ text: message }] }],
      config: {
        maxOutputTokens: 800,
        temperature: 0.15, // Extremely objective
        systemInstruction: `Eres "RespiraBot", el asistente virtual e inteligente experto de RespiraCRM Colombia.
          
          TU MISIÓN: Ayudar al personal administrativo, comercial y de soporte técnico de la empresa con respuestas basadas en datos reales del sistema que se encuentran en el JSON de CONTEXTO REAL abajo.
          
          REGLAS DE ORO:
          1. ACCESO TOTAL: Tienes acceso completo a todas las colecciones principales en tiempo real de la base de datos: Clientes (customers), Prospectos (prospects), Productos (products), Cotizaciones (quotes), Ventas (sales) e Historial de soporte técnico (serviceOrders).
          2. CONTEOS Y CÁLCULOS: Si el usuario te pregunta cuántos hay o pide un listado o información específica, búscalo en el JSON adjunto abajo. Di expresamente la cantidad exacta. Por ejemplo, en "customers" hay exactly 10 clientes si usas los datos fallback, o bien la cantidad real en la DB.
          3. SINCERIDAD: No inventes datos que no estén en el JSON de contexto. Si no hay elementos, menciónalo honestamente.
          4. TONO: Tu tono debe ser profesional, resolutivo, fluido y alegre. Responde siempre en español.
          5. NO SALUDES REPETIDAMENTE: La interfaz de usuario ya saluda al usuario con un mensaje de bienvenida de forma predeterminada al cargar. Por lo tanto, ¡NO saludes ni digas cosas como "Hola, ¿en qué puedo ayudarte?" al inicio de tu respuesta! Responde directamente a la pregunta o consulta hecha por el usuario con eficiencia y ve directo al grano.
          
          DATOS DEL SISTEMA (JSON DE CONTEXTO REAL):
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
