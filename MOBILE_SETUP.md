# Configuración para Dispositivos Móviles

Si estás teniendo problemas de conexión con el backend desde tu dispositivo móvil, sigue estos pasos:

## Problema
Los dispositivos móviles físicos no pueden conectarse a `localhost:3000` porque "localhost" se refiere al propio dispositivo, no a tu computadora de desarrollo.

## Solución

### Paso 1: Encuentra la IP de tu computadora

**Windows:**
1. Abre Command Prompt (cmd)
2. Ejecuta: `ipconfig`
3. Busca "Wireless LAN adapter Wi-Fi" o "Ethernet adapter"
4. Anota la dirección IPv4 (ejemplo: 192.168.1.100)

**Mac/Linux:**
1. Abre Terminal
2. Ejecuta: `ifconfig`
3. Busca tu interfaz de red (usualmente `en0` para Wi-Fi)
4. Anota la dirección inet (ejemplo: 192.168.1.100)

### Paso 2: Configura la variable de entorno

1. Crea un archivo `.env` en la raíz del proyecto (si no existe)
2. Agrega la siguiente línea con tu IP:
```
EXPO_PUBLIC_RORK_API_BASE_URL=http://TU_IP_AQUI:3000
```

**Ejemplo:**
```
EXPO_PUBLIC_RORK_API_BASE_URL=http://192.168.1.100:3000
```

### Paso 3: Reinicia el servidor de desarrollo

1. Detén el servidor de Expo (Ctrl+C)
2. Reinicia con: `npm start` o `bun start`
3. Escanea el código QR nuevamente desde tu dispositivo

## Verificación

1. Abre la app en tu dispositivo móvil
2. Ve a la pantalla de login
3. Presiona el botón "🔧 Probar Conexión Backend"
4. Deberías ver un mensaje de éxito con tu IP configurada

## Problemas Comunes

### "Network request failed"
- Verifica que tu computadora y dispositivo estén en la misma red Wi-Fi
- Asegúrate de que el backend esté ejecutándose (`npm run dev` en otra terminal)
- Verifica que la IP sea correcta

### "Connection refused"
- El backend no está ejecutándose
- El puerto 3000 está bloqueado por firewall
- La IP cambió (las IPs pueden cambiar al reconectarse al Wi-Fi)

### "JSON parser error"
- Problema con la respuesta del servidor
- Verifica los logs del backend en la terminal

## Comandos Útiles

**Verificar que el backend esté funcionando:**
```bash
curl http://TU_IP:3000/api
```

**Ver logs del backend:**
Revisa la terminal donde ejecutaste `npm run dev`

## Notas Importantes

- La IP puede cambiar cuando te reconectes al Wi-Fi
- Asegúrate de que ambos dispositivos estén en la misma red
- Para producción, usarías una URL real, no una IP local