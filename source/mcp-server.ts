import * as net from 'net';
import * as readline from 'readline';
import { v4 as uuidv4 } from 'uuid';
import { MCPServerSettings, ServerStatus, MCPClient, ToolDefinition } from './types';
import { SceneTools } from './tools/scene-tools';
import { NodeTools } from './tools/node-tools';
import { ComponentTools } from './tools/component-tools';
import { PrefabTools } from './tools/prefab-tools';
import { ProjectTools } from './tools/project-tools';
import { DebugTools } from './tools/debug-tools';
import { PreferencesTools } from './tools/preferences-tools';
import { ServerTools } from './tools/server-tools';
import { BroadcastTools } from './tools/broadcast-tools';
import { SceneAdvancedTools } from './tools/scene-advanced-tools';
import { SceneViewTools } from './tools/scene-view-tools';
import { ReferenceImageTools } from './tools/reference-image-tools';
import { AssetAdvancedTools } from './tools/asset-advanced-tools';
import { ValidationTools } from './tools/validation-tools';

export class MCPServer {
    private settings: MCPServerSettings;
    private tcpServer: net.Server | null = null;
    private clients: Map<string, MCPClient> = new Map();
    private tools: Record<string, any> = {};
    private toolsList: ToolDefinition[] = [];
    private enabledTools: any[] = []; // 存储启用的工具列表

    constructor(settings: MCPServerSettings) {
        this.settings = settings;
        this.initializeTools();
    }

    private initializeTools(): void {
        try {
            console.log('[MCPServer] Initializing tools...');
            this.tools.scene = new SceneTools();
            this.tools.node = new NodeTools();
            this.tools.component = new ComponentTools();
            this.tools.prefab = new PrefabTools();
            this.tools.project = new ProjectTools();
            this.tools.debug = new DebugTools();
            this.tools.preferences = new PreferencesTools();
            this.tools.server = new ServerTools();
            this.tools.broadcast = new BroadcastTools();
            this.tools.sceneAdvanced = new SceneAdvancedTools();
            this.tools.sceneView = new SceneViewTools();
            this.tools.referenceImage = new ReferenceImageTools();
            this.tools.assetAdvanced = new AssetAdvancedTools();
            this.tools.validation = new ValidationTools();
            console.log('[MCPServer] Tools initialized successfully');
        } catch (error) {
            console.error('[MCPServer] Error initializing tools:', error);
            throw error;
        }
    }

    public async start(): Promise<void> {
        if (this.tcpServer) {
            console.log('[MCPServer] Server is already running');
            return;
        }

        try {
            console.log(`[MCPServer] Starting TCP server on port ${this.settings.port}...`);
            this.tcpServer = net.createServer(this.handleConnection.bind(this));

            await new Promise<void>((resolve, reject) => {
                this.tcpServer!.listen(this.settings.port, '127.0.0.1', () => {
                    console.log(`[MCPServer] ✅ TCP server started successfully on 127.0.0.1:${this.settings.port}`);
                    resolve();
                });
                this.tcpServer!.on('error', (err: any) => {
                    console.error('[MCPServer] ❌ Failed to start server:', err);
                    if (err.code === 'EADDRINUSE') {
                        console.error(`[MCPServer] Port ${this.settings.port} is already in use. Please change the port in settings.`);
                    }
                    reject(err);
                });
            });

            this.setupTools();
            console.log('[MCPServer] 🚀 MCP Server is ready for direct connections via TCP');
        } catch (error) {
            console.error('[MCPServer] ❌ Failed to start server:', error);
            throw error;
        }
    }

    private handleConnection(socket: net.Socket): void {
        const clientId = uuidv4();
        console.log(`[MCPServer] New client connected: ${clientId}`);
        
        this.clients.set(clientId, {
            id: clientId,
            lastActivity: new Date()
        });

        const rl = readline.createInterface({
            input: socket,
            terminal: false
        });

        rl.on('line', async (line) => {
            if (!line.trim()) return;

            const client = this.clients.get(clientId);
            if (client) {
                client.lastActivity = new Date();
            }

            try {
                let message;
                try {
                    message = JSON.parse(line);
                } catch (parseError: any) {
                    const fixedLine = this.fixCommonJsonIssues(line);
                    try {
                        message = JSON.parse(fixedLine);
                    } catch (e) {
                        throw parseError;
                    }
                }

                const response = await this.handleMessage(message);
                socket.write(JSON.stringify(response) + '\n');
            } catch (error: any) {
                console.error(`[MCPServer] Error handling message from ${clientId}:`, error);
                socket.write(JSON.stringify({
                    jsonrpc: '2.0',
                    id: null,
                    error: {
                        code: -32700,
                        message: `Parse error: ${error.message}`
                    }
                }) + '\n');
            }
        });

        socket.on('close', () => {
            console.log(`[MCPServer] Client disconnected: ${clientId}`);
            this.clients.delete(clientId);
        });

        socket.on('error', (err) => {
            console.error(`[MCPServer] Socket error for ${clientId}:`, err);
        });
    }

    private setupTools(): void {
        this.toolsList = [];
        
        // 如果没有启用工具配置，返回所有工具
        if (!this.enabledTools || this.enabledTools.length === 0) {
            for (const [category, toolSet] of Object.entries(this.tools)) {
                const tools = toolSet.getTools();
                for (const tool of tools) {
                    this.toolsList.push({
                        name: `${category}_${tool.name}`,
                        description: tool.description,
                        inputSchema: tool.inputSchema
                    });
                }
            }
        } else {
            // 根据启用的工具配置过滤
            const enabledToolNames = new Set(this.enabledTools.map(tool => `${tool.category}_${tool.name}`));
            
            for (const [category, toolSet] of Object.entries(this.tools)) {
                const tools = toolSet.getTools();
                for (const tool of tools) {
                    const toolName = `${category}_${tool.name}`;
                    if (enabledToolNames.has(toolName)) {
                        this.toolsList.push({
                            name: toolName,
                            description: tool.description,
                            inputSchema: tool.inputSchema
                        });
                    }
                }
            }
        }
        
        console.log(`[MCPServer] Setup tools: ${this.toolsList.length} tools available`);
    }

    public getFilteredTools(enabledTools: any[]): ToolDefinition[] {
        if (!enabledTools || enabledTools.length === 0) {
            return this.toolsList; // 如果没有过滤配置，返回所有工具
        }

        const enabledToolNames = new Set(enabledTools.map(tool => `${tool.category}_${tool.name}`));
        return this.toolsList.filter(tool => enabledToolNames.has(tool.name));
    }

    public async executeToolCall(toolName: string, args: any): Promise<any> {
        const parts = toolName.split('_');
        const category = parts[0];
        const toolMethodName = parts.slice(1).join('_');
        
        if (this.tools[category]) {
            return await this.tools[category].execute(toolMethodName, args);
        }
        
        throw new Error(`Tool ${toolName} not found`);
    }

    public getClients(): MCPClient[] {
        return Array.from(this.clients.values());
    }
    public getAvailableTools(): ToolDefinition[] {
        return this.toolsList;
    }

    public updateEnabledTools(enabledTools: any[]): void {
        console.log(`[MCPServer] Updating enabled tools: ${enabledTools.length} tools`);
        this.enabledTools = enabledTools;
        this.setupTools(); // 重新设置工具列表
    }

    public getSettings(): MCPServerSettings {
        return this.settings;
    }


    private async handleMessage(message: any): Promise<any> {
        const { id, method, params } = message;

        try {
            let result: any;

            switch (method) {
                case 'tools/list':
                    result = { tools: this.getAvailableTools() };
                    break;
                case 'tools/call':
                    const { name, arguments: args } = params;
                    const toolResult = await this.executeToolCall(name, args);
                    result = { content: [{ type: 'text', text: JSON.stringify(toolResult) }] };
                    break;
                case 'initialize':
                    // MCP initialization
                    result = {
                        protocolVersion: '2024-11-05',
                        capabilities: {
                            tools: {}
                        },
                        serverInfo: {
                            name: 'cocos-mcp-server',
                            version: '1.0.0'
                        }
                    };
                    break;
                default:
                    throw new Error(`Unknown method: ${method}`);
            }

            return {
                jsonrpc: '2.0',
                id,
                result
            };
        } catch (error: any) {
            return {
                jsonrpc: '2.0',
                id,
                error: {
                    code: -32603,
                    message: error.message
                }
            };
        }
    }


    private fixCommonJsonIssues(jsonStr: string): string {
        let fixed = jsonStr;
        
        // Fix common escape character issues
        fixed = fixed
            // Fix unescaped quotes in strings
            .replace(/([^\\])"([^"]*[^\\])"([^,}\]:])/g, '$1\\"$2\\"$3')
            // Fix trailing commas
            .replace(/,(\s*[}\]])/g, '$1')
            // Fix common control characters
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
        
        return fixed;
    }

    public stop(): void {
        if (this.tcpServer) {
            this.tcpServer.close();
            this.tcpServer = null;
            console.log('[MCPServer] TCP server stopped');
        }

        this.clients.clear();
    }

    public getStatus(): ServerStatus {
        return {
            running: !!this.tcpServer,
            port: this.settings.port,
            clients: this.clients.size
        };
    }

    public updateSettings(settings: MCPServerSettings) {
        this.settings = settings;
        if (this.tcpServer) {
            this.stop();
            this.start();
        }
    }
}

// HTTP transport doesn't need persistent connections
// MCP over HTTP uses request-response pattern