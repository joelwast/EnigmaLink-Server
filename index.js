const net = require('net'); // Importar el módulo net
const MessagingServer = require('./server');
const http = require('http'); // Importar el módulo http
const dns = require('dns'); // Importar el módulo dns

// Crear una instancia del servidor
const server = new MessagingServer();

// Manejar eventos del servidor
server.on('serverStarted', (ip, port) => {
    console.log(`Servidor escuchando en ${ip}:${port}`);
});

server.on('serverStopped', () => {
    console.log('Servidor detenido.');
});

server.on('clientConnected', (clientSocket) => {
    console.log(`Cliente conectado: ${clientSocket.remoteAddress}:${clientSocket.remotePort}`);
});

server.on('clientDisconnected', (clientSocket) => {
    console.log(`Cliente desconectado: ${clientSocket.remoteAddress}:${clientSocket.remotePort}`);
});

server.on('messageReceived', (clientSocket, message) => {
    console.log(`Mensaje recibido de ${clientSocket.remoteAddress}:${clientSocket.remotePort}: ${message}`);
});

server.on('error', (err, clientSocket) => {
    if (clientSocket) {
        console.log(`Error de comunicación con ${clientSocket.remoteAddress}:${clientSocket.remotePort}: ${err.message}`);
    } else {
        console.error(`Error del servidor: ${err.message}`);
    }
});

// Función para encontrar un puerto disponible
const findAvailablePort = (startPort, endPort) => {
    return new Promise((resolve, reject) => {
        const tryPort = (port) => {
            const testServer = net.createServer();
            testServer.listen(port, () => {
                testServer.close(() => resolve(port)); // Puerto disponible
            });
            testServer.on('error', () => {
                if (port < endPort) {
                    tryPort(port + 1); // Intentar el siguiente puerto
                } else {
                    reject(new Error('No hay puertos disponibles en el rango especificado.'));
                }
            });
        };
        tryPort(startPort);
    });
};

// Función para obtener la IP pública
const getPublicIP = () => {
    return new Promise((resolve, reject) => {
        // Usamos una API para obtener la IP pública
        http.get('http://api.ipify.org?format=json', (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                const result = JSON.parse(data);
                resolve(result.ip);
            });
        }).on('error', (err) => {
            reject(`Error al obtener IP pública: ${err.message}`);
        });
    });
};

// Iniciar el servidor en un puerto disponible
const startServer = async () => {
    try {
        const availablePort = await findAvailablePort(5000, 5100);
        await server.start(availablePort);

        // Obtener e imprimir la IP pública
        const publicIP = await getPublicIP();
        console.log(`IP pública del servidor: ${publicIP}`);
    } catch (error) {
        console.error(error.message);
    }
};

startServer();
