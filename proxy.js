const http = require('http');
const net = require('net');
const url = require('url');
const { Throttle } = require('stream-throttle');
const EventEmitter = require('events');

class Proxy extends EventEmitter {
    constructor() {
        super()
        this.stats = {};
        this.totalSent = 0;
        this.totalReceived = 0;
        this.lastTotalSent = 0;
        this.lastTotalReceived = 0;

        this.proxy = http.createServer((...a) => {
            this.handleHttp(...a)

        });
        this.proxy.on('connect', (...a) => {
            this.handleConnect(...a)

        });
        setInterval(() => {
            if (this.totalSent != this.lastTotalSent || this.totalReceived != this.lastTotalReceived) {
                this.emit("use.update", this.totalSent - this.lastTotalSent, this.totalReceived - this.lastTotalReceived, this.stats)
            }
            this.lastTotalSent = this.totalSent;
            this.lastTotalReceived = this.totalReceived;
        }, 1000);
        this.proxy.listen(3128, () => console.log('Proxy sur 3128'));
    }

    // HTTP “normales”
    handleHttp(req, res) {
        const target = url.parse(req.url);
        this.ensureTarget(target.hostname);

        const options = {
            hostname: target.hostname,
            port: target.port || 80,
            path: target.path,
            method: req.method,
            headers: req.headers
        };

        const proxyReq = http.request(options, proxyRes => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);

            // Si on veut limiter ce host à 50 KB/s
            let responseStream = proxyRes;
            if (target.hostname === 'audio-ak.spotifycdn.com' && false) {
                responseStream = proxyRes.pipe(new Throttle({ rate: 500 * 1024 }));
            }

            responseStream.on('data', chunk => {
                this.totalReceived += chunk.length;
                this.stats[target.hostname].received += chunk.length;
                res.write(chunk);
            });
            responseStream.on('end', () => res.end());
        });

        req.on('data', chunk => {
            this.totalSent += chunk.length;
            this.stats[target.hostname].sent += chunk.length;
            proxyReq.write(chunk);
        });
        req.on('end', () => proxyReq.end());
    }

    // Tunnels HTTPS
    handleConnect(req, clientSocket, head) {
        const { hostname, port } = url.parse(`http://${req.url}`);
        this.ensureTarget(hostname);

        const serverSocket = net.connect(port, hostname, () => {
            clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
            serverSocket.write(head);

            if (hostname === 'audio-ak.spotifycdn.com') {
                // throttle bidirectionnel à 50 KB/s
                const throttleDown = new Throttle({ rate: 500 * 1024 });
                const throttleUp = new Throttle({ rate: 500 * 1024 });

                serverSocket.pipe(throttleDown).pipe(clientSocket);
                clientSocket.pipe(throttleUp).pipe(serverSocket);
            } else {
                // flux non limités
                serverSocket.pipe(clientSocket);
                clientSocket.pipe(serverSocket);
            }

            serverSocket.on('data', chunk => {
                this.totalReceived += chunk.length;
                this.stats[hostname].received += chunk.length;
            });
            clientSocket.on('data', chunk => {
                this.totalSent += chunk.length;
                this.stats[hostname].sent += chunk.length;
            });
        });

        serverSocket.on('error', () => clientSocket.destroy());
        clientSocket.on('error', () => serverSocket.destroy());
    }

    ensureTarget(host) {
        if (!this.stats[host]) this.stats[host] = { sent: 0, received: 0 };
    }

    reset() {
        this.totalSent = 0;
        this.totalReceived = 0;
        this.stats = {};
    }

    get rules() {
        return 'http=localhost:3128;https=localhost:3128'
    }
}

module.exports = Proxy;
