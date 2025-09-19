# Configuración para tu IP específica (192.168.1.21)

## ✅ Configuración completada

He configurado automáticamente tu aplicación para usar tu IP local **192.168.1.21**.

### Archivos modificados:

1. **`.env`** - Configurado con tu IP:
   ```
   EXPO_PUBLIC_RORK_API_BASE_URL=http://192.168.1.21:3000
   EXPO_PUBLIC_DEV_SERVER_URL=http://192.168.1.21:3000
   ```

2. **`lib/trpc.ts`** - Actualizado para usar tu IP como primera opción

### Pasos para probar:

1. **Reinicia el servidor de desarrollo** (importante):
   ```bash
   # Detén el servidor actual (Ctrl+C)
   # Luego ejecuta:
   bun start
   ```

2. **Prueba la conexión desde tu celular**:
   - Abre la app en tu celular
   - Ve a la pantalla de login
   - Toca el botón "🔧 Probar Conexión Backend"
   - Deberías ver un mensaje de éxito

3. **Si aún no funciona**:
   - Verifica que tu computadora y celular estén en la misma red WiFi
   - Desactiva temporalmente el firewall de Windows
   - Asegúrate de que el puerto 3000 esté abierto

### Verificación rápida:

Desde tu celular, abre el navegador y ve a: `http://192.168.1.21:3000/api`

Si ves un JSON con `{"status":"ok","message":"API is running"}`, entonces el backend está funcionando correctamente.

### Solución de problemas:

Si el botón de prueba muestra errores:
1. Verifica que el backend esté ejecutándose
2. Comprueba que tu IP no haya cambiado (ejecuta `ipconfig` de nuevo)
3. Intenta desactivar temporalmente el firewall
4. Asegúrate de estar en la misma red WiFi

### Cuentas de prueba disponibles:
- Email: `demo@taskbalance.com` / Contraseña: `demo123`
- Email: `test@test.com` / Contraseña: `test123`