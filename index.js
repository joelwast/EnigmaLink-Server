const net = require('net');
const readline = require('readline');
const os = require('os');

const clients = new Set();

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return '0.0.0.0'; // Fallback to all interfaces if no specific IP is found
}

function handleClient(socket) {
    console.log(`Nuevo cliente conectado: ${socket.remoteAddress}:${socket.remotePort}`);
    clients.add(socket);

    socket.on('data', (data) => {
        const [encryptedMessage, key] = data.toString().split('|');
        console.log(`Mensaje recibido de ${socket.remoteAddress}:${socket.remotePort}`);

        // Reenvía el mensaje cifrado y la clave a todos los clientes, excepto al remitente
        for (const client of clients) {
            if (client !== socket) {
                client.write(`${encryptedMessage}|${key}`);
            }
        }
    });

    socket.on('end', () => {
        console.log(`Cliente desconectado: ${socket.remoteAddress}:${socket.remotePort}`);
        clients.delete(socket);
    });

    socket.on('error', (err) => {
        console.error(`Error en la conexión con ${socket.remoteAddress}:${socket.remotePort}: ${err.message}`);
        clients.delete(socket);
    });
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Ingresa el puerto para el servidor: ', (port) => {
    port = parseInt(port);
    if (isNaN(port)) {
        console.error("El puerto debe ser un número entero válido.");
        process.exit(1);
    }

    const server = net.createServer(handleClient);
    const ip = getLocalIP();

    server.listen(port, ip, () => {
        console.log(`Servidor escuchando en ${ip}:${port}`);
    });

    server.on('error', (err) => {
        console.error(`Error en el servidor: ${err.message}`);
    });

    rl.close();
});