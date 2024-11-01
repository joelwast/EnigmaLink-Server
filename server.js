const http = require('http');
const os = require('os');
const EventEmitter = require('events');

class MessagingServer extends EventEmitter {
    constructor() {
        super();
        this.clients = [];
        this.server = null;
    }

    // Método para iniciar el servidor
    start(port) {
        this.server = http.createServer((req, res) => {
            // Manejar diferentes tipos de solicitudes HTTP
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('Hello, world!\n'); // Respuesta básica para comprobar que el servidor funciona
        });

        this.server.on('connection', (clientSocket) => {
            this.clients.push(clientSocket);
            this.emit('clientConnected', clientSocket);

            clientSocket.on('data', (data) => {
                const message = data.toString();
                this.emit('messageReceived', clientSocket, message);

                // Reenvía el mensaje a todos los clientes, excepto al remitente
                this.clients.forEach(client => {
                    if (client !== clientSocket) {
                        client.write(message);
                    }
                });
            });

            clientSocket.on('error', (err) => {
                this.emit('error', err, clientSocket);
            });

            clientSocket.on('close', () => {
                this.clients.splice(this.clients.indexOf(clientSocket), 1);
                this.emit('clientDisconnected', clientSocket);
            });
        });

        this.server.listen(parseInt(port), '0.0.0.0', () => {
            const interfaces = os.networkInterfaces();
            let localIP = 'localhost';

            for (let iface in interfaces) {
                for (let i = 0; i < interfaces[iface].length; i++) {
                    const address = interfaces[iface][i].address;
                    if (address.includes('192.168.') || address.includes('10.') || address.includes('172.')) {
                        localIP = address;
                        break;
                    }
                }
            }

            this.emit('serverStarted', localIP, port);
        });

        this.server.on('error', (err) => {
            this.emit('error', err);
        });
    }

    // Método para detener el servidor
    stop() {
        if (this.server) {
            this.server.close(() => {
                this.emit('serverStopped');
            });
        }
    }
}

// Exportar la clase
module.exports = MessagingServer;
