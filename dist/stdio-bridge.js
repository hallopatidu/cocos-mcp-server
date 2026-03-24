#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const http = __importStar(require("http"));
const readline = __importStar(require("readline"));
const serverUrl = process.argv[2] || 'http://127.0.0.1:3000/mcp';
const rl = readline.createInterface({
    input: process.stdin,
    terminal: false
});
rl.on('line', (line) => {
    if (!line.trim())
        return;
    try {
        const message = JSON.parse(line);
        forwardToHttp(message);
    }
    catch (error) {
        console.error('Invalid JSON from stdin:', line);
    }
});
function forwardToHttp(message) {
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
            }
            else {
                // Try to see if server already returned a valid JSON-RPC error
                try {
                    const errorJson = JSON.parse(responseBody);
                    if (errorJson.jsonrpc === '2.0' && errorJson.error) {
                        process.stdout.write(responseBody + '\n');
                        return;
                    }
                }
                catch (e) { }
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
function sendError(id, message) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RkaW8tYnJpZGdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc291cmNlL3N0ZGlvLWJyaWRnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSwyQ0FBNkI7QUFDN0IsbURBQXFDO0FBRXJDLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksMkJBQTJCLENBQUM7QUFFakUsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLGVBQWUsQ0FBQztJQUNoQyxLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUs7SUFDcEIsUUFBUSxFQUFFLEtBQUs7Q0FDbEIsQ0FBQyxDQUFDO0FBRUgsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtJQUNuQixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRTtRQUFFLE9BQU87SUFFekIsSUFBSSxDQUFDO1FBQ0QsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDM0IsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDYixPQUFPLENBQUMsS0FBSyxDQUFDLDBCQUEwQixFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3BELENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUVILFNBQVMsYUFBYSxDQUFDLE9BQVk7SUFDL0IsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNyQyxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUUvQixNQUFNLE9BQU8sR0FBRztRQUNaLFFBQVEsRUFBRSxHQUFHLENBQUMsUUFBUTtRQUN0QixJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUk7UUFDZCxJQUFJLEVBQUUsR0FBRyxDQUFDLFFBQVE7UUFDbEIsTUFBTSxFQUFFLE1BQU07UUFDZCxPQUFPLEVBQUU7WUFDTCxjQUFjLEVBQUUsa0JBQWtCO1lBQ2xDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO1NBQzVDO0tBQ0osQ0FBQztJQUVGLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUU7UUFDdEMsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDO1FBQ3RCLEdBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUU7WUFDckIsWUFBWSxJQUFJLEtBQUssQ0FBQztRQUMxQixDQUFDLENBQUMsQ0FBQztRQUNILEdBQUcsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRTtZQUNmLElBQUksR0FBRyxDQUFDLFVBQVUsS0FBSyxHQUFHLEVBQUUsQ0FBQztnQkFDekIsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQzlDLENBQUM7aUJBQU0sQ0FBQztnQkFDSiwrREFBK0Q7Z0JBQy9ELElBQUksQ0FBQztvQkFDRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO29CQUMzQyxJQUFJLFNBQVMsQ0FBQyxPQUFPLEtBQUssS0FBSyxJQUFJLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDakQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxDQUFDO3dCQUMxQyxPQUFPO29CQUNYLENBQUM7Z0JBQ0wsQ0FBQztnQkFBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUEsQ0FBQztnQkFFZCxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSwwQkFBMEIsR0FBRyxDQUFDLFVBQVUsS0FBSyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZGLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUMsQ0FBQyxDQUFDO0lBRUgsR0FBRyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUN0QixTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxzQ0FBc0MsU0FBUyxLQUFLLEtBQUssQ0FBQyxPQUFPLHFEQUFxRCxDQUFDLENBQUM7SUFDbEosQ0FBQyxDQUFDLENBQUM7SUFFSCxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2hCLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNkLENBQUM7QUFFRCxTQUFTLFNBQVMsQ0FBQyxFQUFPLEVBQUUsT0FBZTtJQUN2QyxNQUFNLGFBQWEsR0FBRztRQUNsQixPQUFPLEVBQUUsS0FBSztRQUNkLEVBQUUsRUFBRSxFQUFFLElBQUksSUFBSTtRQUNkLEtBQUssRUFBRTtZQUNILElBQUksRUFBRSxDQUFDLEtBQUs7WUFDWixPQUFPLEVBQUUsT0FBTztTQUNuQjtLQUNKLENBQUM7SUFDRixPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO0FBQy9ELENBQUM7QUFFRCxPQUFPLENBQUMsS0FBSyxDQUFDLDBDQUEwQyxTQUFTLEVBQUUsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuaW1wb3J0ICogYXMgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCAqIGFzIHJlYWRsaW5lIGZyb20gJ3JlYWRsaW5lJztcblxuY29uc3Qgc2VydmVyVXJsID0gcHJvY2Vzcy5hcmd2WzJdIHx8ICdodHRwOi8vMTI3LjAuMC4xOjMwMDAvbWNwJztcblxuY29uc3QgcmwgPSByZWFkbGluZS5jcmVhdGVJbnRlcmZhY2Uoe1xuICAgIGlucHV0OiBwcm9jZXNzLnN0ZGluLFxuICAgIHRlcm1pbmFsOiBmYWxzZVxufSk7XG5cbnJsLm9uKCdsaW5lJywgKGxpbmUpID0+IHtcbiAgICBpZiAoIWxpbmUudHJpbSgpKSByZXR1cm47XG5cbiAgICB0cnkge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gSlNPTi5wYXJzZShsaW5lKTtcbiAgICAgICAgZm9yd2FyZFRvSHR0cChtZXNzYWdlKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdJbnZhbGlkIEpTT04gZnJvbSBzdGRpbjonLCBsaW5lKTtcbiAgICB9XG59KTtcblxuZnVuY3Rpb24gZm9yd2FyZFRvSHR0cChtZXNzYWdlOiBhbnkpIHtcbiAgICBjb25zdCBkYXRhID0gSlNPTi5zdHJpbmdpZnkobWVzc2FnZSk7XG4gICAgY29uc3QgdXJsID0gbmV3IFVSTChzZXJ2ZXJVcmwpO1xuXG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgaG9zdG5hbWU6IHVybC5ob3N0bmFtZSxcbiAgICAgICAgcG9ydDogdXJsLnBvcnQsXG4gICAgICAgIHBhdGg6IHVybC5wYXRobmFtZSxcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAnQ29udGVudC1MZW5ndGgnOiBCdWZmZXIuYnl0ZUxlbmd0aChkYXRhKVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IHJlcSA9IGh0dHAucmVxdWVzdChvcHRpb25zLCAocmVzKSA9PiB7XG4gICAgICAgIGxldCByZXNwb25zZUJvZHkgPSAnJztcbiAgICAgICAgcmVzLm9uKCdkYXRhJywgKGNodW5rKSA9PiB7XG4gICAgICAgICAgICByZXNwb25zZUJvZHkgKz0gY2h1bms7XG4gICAgICAgIH0pO1xuICAgICAgICByZXMub24oJ2VuZCcsICgpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXMuc3RhdHVzQ29kZSA9PT0gMjAwKSB7XG4gICAgICAgICAgICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUocmVzcG9uc2VCb2R5ICsgJ1xcbicpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBUcnkgdG8gc2VlIGlmIHNlcnZlciBhbHJlYWR5IHJldHVybmVkIGEgdmFsaWQgSlNPTi1SUEMgZXJyb3JcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnJvckpzb24gPSBKU09OLnBhcnNlKHJlc3BvbnNlQm9keSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvckpzb24uanNvbnJwYyA9PT0gJzIuMCcgJiYgZXJyb3JKc29uLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZShyZXNwb25zZUJvZHkgKyAnXFxuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHNlbmRFcnJvcihtZXNzYWdlLmlkLCBgU2VydmVyIHJldHVybmVkIHN0YXR1cyAke3Jlcy5zdGF0dXNDb2RlfTogJHtyZXNwb25zZUJvZHl9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmVxLm9uKCdlcnJvcicsIChlcnJvcikgPT4ge1xuICAgICAgICBzZW5kRXJyb3IobWVzc2FnZS5pZCwgYEZhaWxlZCB0byBjb25uZWN0IHRvIE1DUCBzZXJ2ZXIgYXQgJHtzZXJ2ZXJVcmx9OiAke2Vycm9yLm1lc3NhZ2V9LiBNYWtlIHN1cmUgdGhlIHNlcnZlciBpcyBzdGFydGVkIGluIENvY29zIENyZWF0b3IuYCk7XG4gICAgfSk7XG5cbiAgICByZXEud3JpdGUoZGF0YSk7XG4gICAgcmVxLmVuZCgpO1xufVxuXG5mdW5jdGlvbiBzZW5kRXJyb3IoaWQ6IGFueSwgbWVzc2FnZTogc3RyaW5nKSB7XG4gICAgY29uc3QgZXJyb3JSZXNwb25zZSA9IHtcbiAgICAgICAganNvbnJwYzogJzIuMCcsXG4gICAgICAgIGlkOiBpZCB8fCBudWxsLFxuICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgY29kZTogLTMyNjAzLFxuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZVxuICAgICAgICB9XG4gICAgfTtcbiAgICBwcm9jZXNzLnN0ZG91dC53cml0ZShKU09OLnN0cmluZ2lmeShlcnJvclJlc3BvbnNlKSArICdcXG4nKTtcbn1cblxuY29uc29sZS5lcnJvcihgW0NvY29zIE1DUCBCcmlkZ2VdIEZvcndhcmRpbmcgc3RkaW8gdG8gJHtzZXJ2ZXJVcmx9YCk7XG4iXX0=