# Despliegue en Vercel

## Pasos para desplegar el backend en Vercel

### 1. Preparar el proyecto

El proyecto ya está configurado con los archivos necesarios:
- `vercel.json` - Configuración de Vercel
- `api/index.js` - Punto de entrada para Vercel
- Backend adaptado para PostgreSQL en producción

### 2. Crear cuenta en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Crea una cuenta o inicia sesión
3. Conecta tu cuenta de GitHub

### 3. Configurar base de datos PostgreSQL

1. En el dashboard de Vercel, ve a tu proyecto
2. Ve a la pestaña "Storage"
3. Crea una nueva base de datos PostgreSQL
4. Vercel te dará las variables de entorno automáticamente

### 4. Configurar variables de entorno

En el dashboard de Vercel, ve a Settings > Environment Variables y agrega:

```
JWT_SECRET=tu_clave_secreta_jwt_muy_segura_aqui
NODE_ENV=production
```

Si usas Google OAuth, también agrega:
```
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
```

### 5. Desplegar

#### Opción A: Desde GitHub
1. Conecta tu repositorio de GitHub a Vercel
2. Vercel desplegará automáticamente en cada push

#### Opción B: Desde CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel

# Para producción
vercel --prod
```

### 6. Actualizar la URL del frontend

Una vez desplegado, actualiza la variable de entorno en tu app:

```env
EXPO_PUBLIC_RORK_API_BASE_URL=https://tu-app.vercel.app
```

### 7. Verificar el despliegue

1. Ve a `https://tu-app.vercel.app/api` - deberías ver `{"status":"ok","message":"API is running"}`
2. Prueba las rutas tRPC en `https://tu-app.vercel.app/api/trpc/`

## Solución de problemas

### Error: "Database not initialized"
- Verifica que las variables de entorno de PostgreSQL estén configuradas
- Revisa los logs en el dashboard de Vercel

### Error: "Network request failed"
- Verifica que la URL en `EXPO_PUBLIC_RORK_API_BASE_URL` sea correcta
- Asegúrate de que no haya `/` al final de la URL

### Error: "CORS"
- El backend ya está configurado para CORS
- Si persiste, verifica que la URL del frontend esté en la lista de orígenes permitidos

## Estructura de archivos para Vercel

```
proyecto/
├── api/
│   └── index.js          # Punto de entrada para Vercel
├── backend/
│   ├── hono.ts           # Servidor Hono
│   ├── database/
│   │   └── connection.ts # Conexión dual SQLite/PostgreSQL
│   └── trpc/             # Rutas tRPC
├── vercel.json           # Configuración de Vercel
└── package.json
```

## Notas importantes

1. **Base de datos**: En desarrollo usa SQLite, en producción usa PostgreSQL
2. **Variables de entorno**: Diferentes para desarrollo y producción
3. **CORS**: Ya configurado para permitir todos los orígenes
4. **Logs**: Revisa los logs en el dashboard de Vercel para debugging