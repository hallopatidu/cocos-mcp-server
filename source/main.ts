#!/usr/bin/env node

/**
 * Cocos MCP Server Extension / Bridge
 * 
 * Standalone Mode: Acts as a Stdio-to-TCP bridge for Claude Desktop.
 * Extension Mode: Starts the MCP server inside Cocos Creator.
 */

// --- 1. Standalone Bridge Mode ---
if (typeof (global as any).Editor === 'undefined') {
    const net = require('net');
    
    // Default TCP port for the extension
    const port = parseInt(process.env.MCP_PORT || '') || 3000;
    const host = '127.0.0.1';

    console.error(`[Cocos MCP Bridge] 🔌 Connecting to Cocos extension at ${host}:${port}...`);

    const socket = net.connect(port, host, () => {
        console.error(`[Cocos MCP Bridge] ✅ Connected! Forwarding Stdio <-> TCP`);
        process.stdin.pipe(socket);
        socket.pipe(process.stdout);
    });

    socket.on('error', (err: any) => {
        console.error(`[Cocos MCP Bridge] ❌ Connection error: ${err.message}`);
        if (err.code === 'ECONNREFUSED') {
            console.error(`[Cocos MCP Bridge] Cocos Creator is not running or the MCP server is not started.`);
        }
        process.exit(1);
    });

    socket.on('close', () => {
        console.error('[Cocos MCP Bridge] ℹ️ Connection closed');
        process.exit(0);
    });

    socket.on('end', () => {
        process.exit(0);
    });

    process.stdin.on('error', () => {});
    process.stdout.on('error', () => process.exit(0));
    
    // CRITICAL: We MUST NOT return or continue execution here
    // because the rest of the file (extension imports) would crash the bridge.
    // The bridge will stay alive as long as the socket/stdin/stdout are active.
} else {
    // --- 2. Extension Mode ---
    // We use dynamic requires here to avoid polluting the bridge process with heavy imports
    const { MCPServer } = require('./mcp-server');
    const { readSettings, saveSettings } = require('./settings');
    const { ToolManager } = require('./tools/tool-manager');

    let mcpServer: any = null;
    let toolManager: any = null;

    module.exports.methods = {
        openPanel() {
            (global as any).Editor.Panel.open('cocos-mcp-server');
        },

        async startServer() {
            if (!mcpServer) return;
            const enabledTools = toolManager.getEnabledTools();
            mcpServer.updateEnabledTools(enabledTools);
            await mcpServer.start();
        },

        async stopServer() {
            if (mcpServer) mcpServer.stop();
        },

        getServerStatus() {
            const status = mcpServer ? mcpServer.getStatus() : { running: false, port: 0, clients: 0 };
            const settings = mcpServer ? mcpServer.getSettings() : readSettings();
            return { ...status, settings };
        },

        updateSettings(settings: any) {
            saveSettings(settings);
            if (mcpServer) {
                mcpServer.stop();
                mcpServer = new MCPServer(settings);
                mcpServer.start();
            } else {
                mcpServer = new MCPServer(settings);
                mcpServer.start();
            }
        },

        getToolsList() {
            return mcpServer ? mcpServer.getAvailableTools() : [];
        },

        getFilteredToolsList() {
            if (!mcpServer) return [];
            const enabledTools = toolManager.getEnabledTools();
            mcpServer.updateEnabledTools(enabledTools);
            return mcpServer.getFilteredTools(enabledTools);
        },

        async getServerSettings() {
            return mcpServer ? mcpServer.getSettings() : readSettings();
        },

        async getSettings() {
            return mcpServer ? mcpServer.getSettings() : readSettings();
        },

        async getToolManagerState() {
            return toolManager.getToolManagerState();
        },

        async createToolConfiguration(name: string, description?: string) {
            const config = toolManager.createConfiguration(name, description);
            return { success: true, id: config.id, config };
        },

        async updateToolConfiguration(configId: string, updates: any) {
            return toolManager.updateConfiguration(configId, updates);
        },

        async deleteToolConfiguration(configId: string) {
            toolManager.deleteConfiguration(configId);
            return { success: true };
        },

        async setCurrentToolConfiguration(configId: string) {
            toolManager.setCurrentConfiguration(configId);
            return { success: true };
        },

        async updateToolStatus(category: string, toolName: string, enabled: boolean) {
            const currentConfig = toolManager.getCurrentConfiguration();
            if (!currentConfig) throw new Error('No configuration selected');
            toolManager.updateToolStatus(currentConfig.id, category, toolName, enabled);
            if (mcpServer) {
                mcpServer.updateEnabledTools(toolManager.getEnabledTools());
            }
            return { success: true };
        },

        async updateToolStatusBatch(updates: any[]) {
            const currentConfig = toolManager.getCurrentConfiguration();
            if (!currentConfig) throw new Error('No configuration selected');
            toolManager.updateToolStatusBatch(currentConfig.id, updates);
            if (mcpServer) {
                mcpServer.updateEnabledTools(toolManager.getEnabledTools());
            }
            return { success: true };
        },

        async exportToolConfiguration(configId: string) {
            return { configJson: toolManager.exportConfiguration(configId) };
        },

        async importToolConfiguration(configJson: string) {
            return toolManager.importConfiguration(configJson);
        },

        async getEnabledTools() {
            return toolManager.getEnabledTools();
        }
    };

    module.exports.load = function() {
        console.log('Cocos MCP Server extension loaded');
        toolManager = new ToolManager();
        const settings = readSettings();
        mcpServer = new MCPServer(settings);
        mcpServer.updateEnabledTools(toolManager.getEnabledTools());
        
        if (settings.autoStart) {
            mcpServer.start().catch((err: any) => {
                console.error('Failed to auto-start MCP server:', err);
            });
        }
    };

    module.exports.unload = function() {
        if (mcpServer) {
            mcpServer.stop();
            mcpServer = null;
        }
    };
}