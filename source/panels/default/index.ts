/* eslint-disable vue/one-component-per-file */

import { readFileSync } from 'fs-extra';
import { join } from 'path';
import { createApp, App, defineComponent, ref, computed, onMounted, watch, nextTick } from 'vue';

const panelDataMap = new WeakMap<any, App>();

// Định nghĩa interface cho cấu hình công cụ (ToolConfig)
interface ToolConfig {
    category: string;
    name: string;
    enabled: boolean;
    description: string;
}

// Định nghĩa interface cho cấu hình (Configuration)
interface Configuration {
    id: string;
    name: string;
    description: string;
    tools: ToolConfig[];
    createdAt: string;
    updatedAt: string;
}

// Định nghĩa interface cho cài đặt máy chủ (ServerSettings)
interface ServerSettings {
    port: number;
    autoStart: boolean;
    debugLog: boolean;
    maxConnections: number;
}

module.exports = Editor.Panel.define({
    listeners: {
        show() { 
            console.log('[MCP Panel] Panel shown'); 
        },
        hide() { 
            console.log('[MCP Panel] Panel hidden'); 
        },
    },
    template: readFileSync(join(__dirname, '../../../static/template/default/index.html'), 'utf-8'),
    style: readFileSync(join(__dirname, '../../../static/style/default/index.css'), 'utf-8'),
    $: {
        app: '#app',
        panelTitle: '#panelTitle',
    },
    ready() {
        if (this.$.app) {
            const app = createApp({});
            app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('ui-');
            
            // Tạo component ứng dụng chính
            app.component('McpServerApp', defineComponent({
                setup() {
                    // Dữ liệu reactive
                    const activeTab = ref('server');
                    const serverRunning = ref(false);
                    const serverStatus = ref('Đã dừng');
                    const connectedClients = ref(0);
                    const httpUrl = ref('');
                    const isProcessing = ref(false);
                    
                    const settings = ref<ServerSettings>({
                        port: 3000,
                        autoStart: false,
                        debugLog: false,
                        maxConnections: 10
                    });
                    
                    const availableTools = ref<ToolConfig[]>([]);
                    const toolCategories = ref<string[]>([]);
                    

                    
                    // Thuộc tính computed
                    const statusClass = computed(() => ({
                        'status-running': serverRunning.value,
                        'status-stopped': !serverRunning.value
                    }));
                    
                    const totalTools = computed(() => availableTools.value.length);
                    const enabledTools = computed(() => availableTools.value.filter(t => t.enabled).length);
                    const disabledTools = computed(() => totalTools.value - enabledTools.value);
                    

                    
                    const settingsChanged = ref(false);
                    
                    // Các phương thức
                    const switchTab = (tabName: string) => {
                        activeTab.value = tabName;
                        if (tabName === 'tools') {
                            loadToolManagerState();
                        }
                    };
                    
                    const toggleServer = async () => {
                        try {
                            if (serverRunning.value) {
                                await Editor.Message.request('cocos-mcp-server', 'stop-server');
                            } else {
                                // Sử dụng cài đặt hiện tại của bảng điều khiền khi khởi động máy chủ
                                const currentSettings = {
                                    port: settings.value.port,
                                    autoStart: settings.value.autoStart,
                                    enableDebugLog: settings.value.debugLog,
                                    maxConnections: settings.value.maxConnections
                                };
                                await Editor.Message.request('cocos-mcp-server', 'update-settings', currentSettings);
                                await Editor.Message.request('cocos-mcp-server', 'start-server');
                            }
                            console.log('[Vue App] Server toggled');
                        } catch (error) {
                            console.error('[Vue App] Failed to toggle server:', error);
                        }
                    };
                    
                    const saveSettings = async () => {
                        try {
                            // Tạo một đối tượng đơn giản để tránh lỗi clone
                            const settingsData = {
                                port: settings.value.port,
                                autoStart: settings.value.autoStart,
                                debugLog: settings.value.debugLog,
                                maxConnections: settings.value.maxConnections
                            };
                            
                            const result = await Editor.Message.request('cocos-mcp-server', 'update-settings', settingsData);
                            console.log('[Vue App] Save settings result:', result);
                            settingsChanged.value = false;
                        } catch (error) {
                            console.error('[Vue App] Failed to save settings:', error);
                        }
                    };
                    
                    const copyUrl = async () => {
                        try {
                            await navigator.clipboard.writeText(httpUrl.value);
                            console.log('[Vue App] URL copied to clipboard');
                        } catch (error) {
                            console.error('[Vue App] Failed to copy URL:', error);
                        }
                    };
                    
                    const loadToolManagerState = async () => {
                        try {
                            const result = await Editor.Message.request('cocos-mcp-server', 'getToolManagerState');
                            if (result && result.success) {
                                // Luôn tải trạng thái từ backend để đảm bảo dữ liệu mới nhất
                                availableTools.value = result.availableTools || [];
                                console.log('[Vue App] Loaded tools:', availableTools.value.length);
                                
                                // Cập nhật phân loại công cụ
                                const categories = new Set(availableTools.value.map(tool => tool.category));
                                toolCategories.value = Array.from(categories);
                            }
                        } catch (error) {
                            console.error('[Vue App] Failed to load tool manager state:', error);
                        }
                    };
                    
                    const updateToolStatus = async (category: string, name: string, enabled: boolean) => {
                        try {
                            console.log('[Vue App] updateToolStatus called:', category, name, enabled);
                            
                            // Cập nhật trạng thái cục bộ trước
                            const toolIndex = availableTools.value.findIndex(t => t.category === category && t.name === name);
                            if (toolIndex !== -1) {
                                availableTools.value[toolIndex].enabled = enabled;
                                // Ép buộc kích hoạt cập nhật reactive
                                availableTools.value = [...availableTools.value];
                                console.log('[Vue App] Local state updated, tool enabled:', availableTools.value[toolIndex].enabled);
                            }
                            
                            // Gọi backend để cập nhật
                            const result = await Editor.Message.request('cocos-mcp-server', 'updateToolStatus', category, name, enabled);
                            if (!result || !result.success) {
                                // Nếu cập nhật backend thất bại, hoàn tác trạng thái cục bộ
                                if (toolIndex !== -1) {
                                    availableTools.value[toolIndex].enabled = !enabled;
                                    availableTools.value = [...availableTools.value];
                                }
                                console.error('[Vue App] Backend update failed, rolled back local state');
                            } else {
                                console.log('[Vue App] Backend update successful');
                            }
                        } catch (error) {
                            // Nếu xảy ra lỗi, hoàn tác trạng thái cục bộ
                            const toolIndex = availableTools.value.findIndex(t => t.category === category && t.name === name);
                            if (toolIndex !== -1) {
                                availableTools.value[toolIndex].enabled = !enabled;
                                availableTools.value = [...availableTools.value];
                            }
                            console.error('[Vue App] Failed to update tool status:', error);
                        }
                    };
                    
                    const selectAllTools = async () => {
                        try {
                            // Cập nhật trạng thái cục bộ trực tiếp, sau đó lưu
                            availableTools.value.forEach(tool => tool.enabled = true);
                            await saveChanges();
                        } catch (error) {
                            console.error('[Vue App] Failed to select all tools:', error);
                        }
                    };
                    
                    const deselectAllTools = async () => {
                        try {
                            // Cập nhật trạng thái cục bộ trực tiếp, sau đó lưu
                            availableTools.value.forEach(tool => tool.enabled = false);
                            await saveChanges();
                        } catch (error) {
                            console.error('[Vue App] Failed to deselect all tools:', error);
                        }
                    };
                    
                                        const saveChanges = async () => {
                        try {
                            // Tạo đối tượng thông thường để tránh lỗi clone đối tượng reactive của Vue3
                            const updates = availableTools.value.map(tool => ({
                                category: String(tool.category),
                                name: String(tool.name),
                                enabled: Boolean(tool.enabled)
                            }));
                            
                            console.log('[Vue App] Sending updates:', updates.length, 'tools');
                            
                            const result = await Editor.Message.request('cocos-mcp-server', 'updateToolStatusBatch', updates);
                            
                            if (result && result.success) {
                                console.log('[Vue App] Tool changes saved successfully');
                            }
                        } catch (error) {
                            console.error('[Vue App] Failed to save tool changes:', error);
                        }
                    };
                    

                    
                    const toggleCategoryTools = async (category: string, enabled: boolean) => {
                        try {
                            // Cập nhật trạng thái cục bộ trực tiếp, sau đó lưu
                            availableTools.value.forEach(tool => {
                                if (tool.category === category) {
                                    tool.enabled = enabled;
                                }
                            });
                            await saveChanges();
                        } catch (error) {
                            console.error('[Vue App] Failed to toggle category tools:', error);
                        }
                    };
                    
                    const getToolsByCategory = (category: string) => {
                        return availableTools.value.filter(tool => tool.category === category);
                    };
                    
                    const getCategoryDisplayName = (category: string): string => {
                        const categoryNames: { [key: string]: string } = {
                            'scene': 'Công cụ cảnh (Scene)',
                            'node': 'Công cụ nút (Node)',
                            'component': 'Công cụ thành phần (Component)',
                            'prefab': 'Công cụ Prefab',
                            'project': 'Công cụ dự án',
                            'debug': 'Công cụ gỡ lỗi (Debug)',
                            'preferences': 'Công cụ Tùy chỉnh (Preferences)',
                            'server': 'Công cụ máy chủ',
                            'broadcast': 'Công cụ quảng bá (Broadcast)',
                            'sceneAdvanced': 'Công cụ cảnh nâng cao',
                            'sceneView': 'Công cụ xem cảnh',
                            'referenceImage': 'Công cụ hình ảnh tham chiếu',
                            'assetAdvanced': 'Công cụ tài nguyên nâng cao',
                            'validation': 'Công cụ xác thực'
                        };
                        return categoryNames[category] || category;
                    };
                    

                    

                    
                    // Theo dõi thay đổi cài đặt
                    watch(settings, () => {
                        settingsChanged.value = true;
                    }, { deep: true });
                    

                    
                    // Tải dữ liệu khi component được mount
                    onMounted(async () => {
                        // Tải trạng thái trình quản lý công cụ
                        await loadToolManagerState();
                        
                        // Lấy thông tin cài đặt từ trạng thái máy chủ
                        try {
                            const serverStatus = await Editor.Message.request('cocos-mcp-server', 'get-server-status');
                            if (serverStatus && serverStatus.settings) {
                                settings.value = {
                                    port: serverStatus.settings.port || 3000,
                                    autoStart: serverStatus.settings.autoStart || false,
                                    debugLog: serverStatus.settings.enableDebugLog || false,
                                    maxConnections: serverStatus.settings.maxConnections || 10
                                };
                                console.log('[Vue App] Server settings loaded from status:', serverStatus.settings);
                            } else if (serverStatus && serverStatus.port) {
                                // Tương thích với phiên bản cũ, chỉ lấy thông tin cổng
                                settings.value.port = serverStatus.port;
                                console.log('[Vue App] Port loaded from server status:', serverStatus.port);
                            }
                        } catch (error) {
                            console.error('[Vue App] Failed to get server status:', error);
                            console.log('[Vue App] Using default server settings');
                        }
                        
                        // Định kỳ cập nhật trạng thái máy chủ
                        setInterval(async () => {
                            try {
                                const result = await Editor.Message.request('cocos-mcp-server', 'get-server-status');
                                if (result) {
                                    serverRunning.value = result.running;
                                    serverStatus.value = result.running ? 'Đang chạy' : 'Đã dừng';
                                    connectedClients.value = result.clients || 0;
                                    httpUrl.value = result.running ? `http://localhost:${result.port}` : '';
                                    isProcessing.value = false;
                                }
                            } catch (error) {
                                console.error('[Vue App] Failed to get server status:', error);
                            }
                        }, 2000);
                    });
                    
                    return {
                        // Dữ liệu
                        activeTab,
                        serverRunning,
                        serverStatus,
                        connectedClients,
                        httpUrl,
                        isProcessing,
                        settings,
                        availableTools,
                        toolCategories,
                        settingsChanged,
                        
                        // Thuộc tính computed
                        statusClass,
                        totalTools,
                        enabledTools,
                        disabledTools,
                        
                        // Các phương thức
                        switchTab,
                        toggleServer,
                        saveSettings,
                        copyUrl,
                        loadToolManagerState,
                        updateToolStatus,
                        selectAllTools,
                        deselectAllTools,
                        saveChanges,
                        toggleCategoryTools,
                        getToolsByCategory,
                        getCategoryDisplayName
                    };
                },
                template: readFileSync(join(__dirname, '../../../static/template/vue/mcp-server-app.html'), 'utf-8'),
            }));
            
            app.mount(this.$.app);
            panelDataMap.set(this, app);
            
            console.log('[MCP Panel] Vue3 app mounted successfully');
        }
    },
    beforeClose() { },
    close() {
        const app = panelDataMap.get(this);
        if (app) {
            app.unmount();
        }
    },
});