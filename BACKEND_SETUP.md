# Configuración del Backend para Dispositivos Móviles

## Problema
La aplicación funciona desde la PC pero no desde el celular porque el backend está configurado para localhost.

## Solución

### 1. Encuentra tu IP local
En tu computadora, ejecuta uno de estos comandos:

**Windows:**
```cmd
ipconfig
```
Busca "IPv4 Address" en tu adaptador de red activo.

**Mac/Linux:**
```bash
ifconfig
```
Busca "inet" en tu interfaz de red activa (generalmente eth0 o wlan0).

### 2. Configura la variable de entorno
Crea un archivo `.env` en la raíz del proyecto con tu IP:

```env
EXPO_PUBLIC_RORK_API_BASE_URL=http://TU_IP_AQUI:3000
```

**Ejemplo:**
```env
EXPO_PUBLIC_RORK_API_BASE_URL=http://192.168.1.100:3000
```

### 3. Reinicia el servidor
Después de configurar la IP, reinicia tanto el servidor de desarrollo como la aplicación móvil.

### 4. Verifica la conexión
Usa el botón "🔧 Probar Conexión Backend" en la pantalla de login para verificar que la conexión funciona.

## Notas Importantes
- Tu computadora y celular deben estar en la misma red WiFi
- Algunos routers pueden bloquear conexiones entre dispositivos
- Si usas un firewall, asegúrate de permitir conexiones en el puerto 3000
- La IP puede cambiar si reinicias el router o cambias de red

## Alternativa: Usar túnel
Si tienes problemas con la IP local, puedes usar:
```bash
npx expo start --tunnel
```
Esto creará un túnel público temporal para pruebas.