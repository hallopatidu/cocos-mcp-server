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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RkaW8tYnJpZGdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc291cmNlL3N0ZGlvLWJyaWRnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSwyQ0FBNkI7QUFDN0IsbURBQXFDO0FBRXJDLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksMkJBQTJCLENBQUM7QUFFakUsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLGVBQWUsQ0FBQztJQUNoQyxLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUs7SUFDcEIsUUFBUSxFQUFFLEtBQUs7Q0FDbEIsQ0FBQyxDQUFDO0FBRUgsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtJQUNuQixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRTtRQUFFLE9BQU87SUFFekIsSUFBSSxDQUFDO1FBQ0QsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDM0IsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDYixPQUFPLENBQUMsS0FBSyxDQUFDLDBCQUEwQixFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3BELENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUVILFNBQVMsYUFBYSxDQUFDLE9BQVk7SUFDL0IsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNyQyxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUUvQixNQUFNLE9BQU8sR0FBRztRQUNaLFFBQVEsRUFBRSxHQUFHLENBQUMsUUFBUTtRQUN0QixJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUk7UUFDZCxJQUFJLEVBQUUsR0FBRyxDQUFDLFFBQVE7UUFDbEIsTUFBTSxFQUFFLE1BQU07UUFDZCxPQUFPLEVBQUU7WUFDTCxjQUFjLEVBQUUsa0JBQWtCO1lBQ2xDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO1NBQzVDO0tBQ0osQ0FBQztJQUVGLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUU7UUFDdEMsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDO1FBQ3RCLEdBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUU7WUFDckIsWUFBWSxJQUFJLEtBQUssQ0FBQztRQUMxQixDQUFDLENBQUMsQ0FBQztRQUNILEdBQUcsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRTtZQUNmLElBQUksR0FBRyxDQUFDLFVBQVUsS0FBSyxHQUFHLEVBQUUsQ0FBQztnQkFDekIsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQzlDLENBQUM7aUJBQU0sQ0FBQztnQkFDSiwrREFBK0Q7Z0JBQy9ELElBQUksQ0FBQztvQkFDRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO29CQUMzQyxJQUFJLFNBQVMsQ0FBQyxPQUFPLEtBQUssS0FBSyxJQUFJLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDakQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxDQUFDO3dCQUMxQyxPQUFPO29CQUNYLENBQUM7Z0JBQ0wsQ0FBQztnQkFBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFZixTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSwwQkFBMEIsR0FBRyxDQUFDLFVBQVUsS0FBSyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZGLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUMsQ0FBQyxDQUFDO0lBRUgsR0FBRyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUN0QixTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxzQ0FBc0MsU0FBUyxLQUFLLEtBQUssQ0FBQyxPQUFPLHFEQUFxRCxDQUFDLENBQUM7SUFDbEosQ0FBQyxDQUFDLENBQUM7SUFFSCxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2hCLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNkLENBQUM7QUFFRCxTQUFTLFNBQVMsQ0FBQyxFQUFPLEVBQUUsT0FBZTtJQUN2QyxNQUFNLGFBQWEsR0FBRztRQUNsQixPQUFPLEVBQUUsS0FBSztRQUNkLEVBQUUsRUFBRSxFQUFFLElBQUksSUFBSTtRQUNkLEtBQUssRUFBRTtZQUNILElBQUksRUFBRSxDQUFDLEtBQUs7WUFDWixPQUFPLEVBQUUsT0FBTztTQUNuQjtLQUNKLENBQUM7SUFDRixPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO0FBQy9ELENBQUM7QUFFRCxPQUFPLENBQUMsS0FBSyxDQUFDLDBDQUEwQyxTQUFTLEVBQUUsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxyXG5pbXBvcnQgKiBhcyBodHRwIGZyb20gJ2h0dHAnO1xyXG5pbXBvcnQgKiBhcyByZWFkbGluZSBmcm9tICdyZWFkbGluZSc7XHJcblxyXG5jb25zdCBzZXJ2ZXJVcmwgPSBwcm9jZXNzLmFyZ3ZbMl0gfHwgJ2h0dHA6Ly8xMjcuMC4wLjE6MzAwMC9tY3AnO1xyXG5cclxuY29uc3QgcmwgPSByZWFkbGluZS5jcmVhdGVJbnRlcmZhY2Uoe1xyXG4gICAgaW5wdXQ6IHByb2Nlc3Muc3RkaW4sXHJcbiAgICB0ZXJtaW5hbDogZmFsc2VcclxufSk7XHJcblxyXG5ybC5vbignbGluZScsIChsaW5lKSA9PiB7XHJcbiAgICBpZiAoIWxpbmUudHJpbSgpKSByZXR1cm47XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBtZXNzYWdlID0gSlNPTi5wYXJzZShsaW5lKTtcclxuICAgICAgICBmb3J3YXJkVG9IdHRwKG1lc3NhZ2UpO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdJbnZhbGlkIEpTT04gZnJvbSBzdGRpbjonLCBsaW5lKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5mdW5jdGlvbiBmb3J3YXJkVG9IdHRwKG1lc3NhZ2U6IGFueSkge1xyXG4gICAgY29uc3QgZGF0YSA9IEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UpO1xyXG4gICAgY29uc3QgdXJsID0gbmV3IFVSTChzZXJ2ZXJVcmwpO1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSB7XHJcbiAgICAgICAgaG9zdG5hbWU6IHVybC5ob3N0bmFtZSxcclxuICAgICAgICBwb3J0OiB1cmwucG9ydCxcclxuICAgICAgICBwYXRoOiB1cmwucGF0aG5hbWUsXHJcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICAgICAnQ29udGVudC1MZW5ndGgnOiBCdWZmZXIuYnl0ZUxlbmd0aChkYXRhKVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgY29uc3QgcmVxID0gaHR0cC5yZXF1ZXN0KG9wdGlvbnMsIChyZXMpID0+IHtcclxuICAgICAgICBsZXQgcmVzcG9uc2VCb2R5ID0gJyc7XHJcbiAgICAgICAgcmVzLm9uKCdkYXRhJywgKGNodW5rKSA9PiB7XHJcbiAgICAgICAgICAgIHJlc3BvbnNlQm9keSArPSBjaHVuaztcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXMub24oJ2VuZCcsICgpID0+IHtcclxuICAgICAgICAgICAgaWYgKHJlcy5zdGF0dXNDb2RlID09PSAyMDApIHtcclxuICAgICAgICAgICAgICAgIHByb2Nlc3Muc3Rkb3V0LndyaXRlKHJlc3BvbnNlQm9keSArICdcXG4nKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIFRyeSB0byBzZWUgaWYgc2VydmVyIGFscmVhZHkgcmV0dXJuZWQgYSB2YWxpZCBKU09OLVJQQyBlcnJvclxyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnJvckpzb24gPSBKU09OLnBhcnNlKHJlc3BvbnNlQm9keSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9ySnNvbi5qc29ucnBjID09PSAnMi4wJyAmJiBlcnJvckpzb24uZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUocmVzcG9uc2VCb2R5ICsgJ1xcbicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkgeyB9XHJcblxyXG4gICAgICAgICAgICAgICAgc2VuZEVycm9yKG1lc3NhZ2UuaWQsIGBTZXJ2ZXIgcmV0dXJuZWQgc3RhdHVzICR7cmVzLnN0YXR1c0NvZGV9OiAke3Jlc3BvbnNlQm9keX1gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmVxLm9uKCdlcnJvcicsIChlcnJvcikgPT4ge1xyXG4gICAgICAgIHNlbmRFcnJvcihtZXNzYWdlLmlkLCBgRmFpbGVkIHRvIGNvbm5lY3QgdG8gTUNQIHNlcnZlciBhdCAke3NlcnZlclVybH06ICR7ZXJyb3IubWVzc2FnZX0uIE1ha2Ugc3VyZSB0aGUgc2VydmVyIGlzIHN0YXJ0ZWQgaW4gQ29jb3MgQ3JlYXRvci5gKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJlcS53cml0ZShkYXRhKTtcclxuICAgIHJlcS5lbmQoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2VuZEVycm9yKGlkOiBhbnksIG1lc3NhZ2U6IHN0cmluZykge1xyXG4gICAgY29uc3QgZXJyb3JSZXNwb25zZSA9IHtcclxuICAgICAgICBqc29ucnBjOiAnMi4wJyxcclxuICAgICAgICBpZDogaWQgfHwgbnVsbCxcclxuICAgICAgICBlcnJvcjoge1xyXG4gICAgICAgICAgICBjb2RlOiAtMzI2MDMsXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoSlNPTi5zdHJpbmdpZnkoZXJyb3JSZXNwb25zZSkgKyAnXFxuJyk7XHJcbn1cclxuXHJcbmNvbnNvbGUuZXJyb3IoYFtDb2NvcyBNQ1AgQnJpZGdlXSBGb3J3YXJkaW5nIHN0ZGlvIHRvICR7c2VydmVyVXJsfWApO1xyXG4iXX0=