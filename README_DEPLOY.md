# RespiraCRM Colombia - Guía de Configuración

Este CRM ha sido diseñado específicamente para la gestión de dispositivos médicos respiratorios en Colombia.

## 1. Configuración de Base de Datos (Supabase)

Para poner en marcha la base de datos, siga estos pasos:

1. Inicie sesión en [Supabase](https://supabase.com/).
2. Vaya al **SQL Editor** de su proyecto `CRMedica` (ID: `aqbkeowafoprbzxgdggq`).
3. Copie y pegue el contenido del archivo `schema.sql` que se encuentra en la raíz de este proyecto.
4. Ejecute el script para crear todas las tablas y relaciones necesarias.

### Crear Usuario Administrador Inicial
Puede ejecutar este SQL para tener un acceso inicial:

```sql
INSERT INTO users (email, password_hash, full_name, role) 
VALUES ('admin@respiracrm.com', '$2b$10$YourHashedPasswordHere', 'Administrador Sistema', 'admin');
```
*(Nota: Debe usar un hash de bcrypt para la contraseña en producción)*.

## 2. Variables de Entorno

Asegúrese de configurar las siguientes variables en el panel de **Settings > Secrets** de AI Studio o en su archivo `.env`:

- `SUPABASE_URL`: URL del proyecto de Supabase.
- `SUPABASE_ANON_KEY`: Llave pública anónima.
- `SUPABASE_SERVICE_ROLE_KEY`: Llave de servicio (requerida para bypass de RLS si no se configuran reglas específicas).
- `JWT_SECRET`: Una cadena aleatoria para la firma de tokens.
- `GEMINI_API_KEY`: Requerida para el funcionamiento de "RespiraBot".

## 3. Despliegue en Render

El proyecto está configurado con:
- `npm run build`: Compila el frontend y el servidor backend.
- `npm start`: Inicia el servidor de producción.

Utilice `node dist/server.cjs` como comando de inicio en Render.
