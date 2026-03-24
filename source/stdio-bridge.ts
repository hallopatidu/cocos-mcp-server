#!/usr/bin/env node
import * as http from 'http';
import * as readline from 'readline';

const serverUrl = process.argv[2] || 'http://127.0.0.1:3000/mcp';

const rl = readline.createInterface({
    input: process.stdin,
    terminal: false
});

rl.on('line', (line) => {
    if (!line.trim()) return;

    try {
        const message = JSON.parse(line);
        forwardToHttp(message);
    } catch (error) {
        console.error('Invalid JSON from stdin:', line);
    }
});

function forwardToHttp(message: any) {
    const data = JSON.stringify(message);
    const url = new URL(serverUrl);

    const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        }
    };

    const req = http.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => {
            responseBody += chunk;
        });
        res.on('end', () => {
            if (res.statusCode === 200) {
                process.stdout.write(responseBody + '\n');
            } else {
                // Try to see if server already returned a valid JSON-RPC error
                try {
                    const errorJson = JSON.parse(responseBody);
                    if (errorJson.jsonrpc === '2.0' && errorJson.error) {
                        process.stdout.write(responseBody + '\n');
                        return;
                    }
                } catch (e) {}
                
                sendError(message.id, `Server returned status ${res.statusCode}: ${responseBody}`);
            }
        });
    });

    req.on('error', (error) => {
        sendError(message.id, `Failed to connect to MCP server at ${serverUrl}: ${error.message}. Make sure the server is started in Cocos Creator.`);
    });

    req.write(data);
    req.end();
}

function sendError(id: any, message: string) {
    const errorResponse = {
        jsonrpc: '2.0',
        id: id || null,
        error: {
            code: -32603,
            message: message
        }
    };
    process.stdout.write(JSON.stringify(errorResponse) + '\n');
}

console.error(`[Cocos MCP Bridge] Forwarding stdio to ${serverUrl}`);
