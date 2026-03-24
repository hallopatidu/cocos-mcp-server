"use strict";
/* eslint-disable vue/one-component-per-file */
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const vue_1 = require("vue");
const panelDataMap = new WeakMap();
module.exports = Editor.Panel.define({
    listeners: {
        show() {
            console.log('[MCP Panel] Panel shown');
        },
        hide() {
            console.log('[MCP Panel] Panel hidden');
        },
    },
    template: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/template/default/index.html'), 'utf-8'),
    style: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/style/default/index.css'), 'utf-8'),
    $: {
        app: '#app',
        panelTitle: '#panelTitle',
    },
    ready() {
        if (this.$.app) {
            const app = (0, vue_1.createApp)({});
            app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('ui-');
            // Tạo component ứng dụng chính
            app.component('McpServerApp', (0, vue_1.defineComponent)({
                setup() {
                    // Dữ liệu reactive
                    const activeTab = (0, vue_1.ref)('server');
                    const serverRunning = (0, vue_1.ref)(false);
                    const serverStatus = (0, vue_1.ref)('Đã dừng');
                    const connectedClients = (0, vue_1.ref)(0);
                    const httpUrl = (0, vue_1.ref)('');
                    const isProcessing = (0, vue_1.ref)(false);
                    const settings = (0, vue_1.ref)({
                        port: 3000,
                        autoStart: false,
                        debugLog: false,
                        maxConnections: 10
                    });
                    const availableTools = (0, vue_1.ref)([]);
                    const toolCategories = (0, vue_1.ref)([]);
                    // Thuộc tính computed
                    const statusClass = (0, vue_1.computed)(() => ({
                        'status-running': serverRunning.value,
                        'status-stopped': !serverRunning.value
                    }));
                    const totalTools = (0, vue_1.computed)(() => availableTools.value.length);
                    const enabledTools = (0, vue_1.computed)(() => availableTools.value.filter(t => t.enabled).length);
                    const disabledTools = (0, vue_1.computed)(() => totalTools.value - enabledTools.value);
                    const settingsChanged = (0, vue_1.ref)(false);
                    // Các phương thức
                    const switchTab = (tabName) => {
                        activeTab.value = tabName;
                        if (tabName === 'tools') {
                            loadToolManagerState();
                        }
                    };
                    const toggleServer = async () => {
                        try {
                            if (serverRunning.value) {
                                await Editor.Message.request('cocos-mcp-server', 'stop-server');
                            }
                            else {
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
                        }
                        catch (error) {
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
                        }
                        catch (error) {
                            console.error('[Vue App] Failed to save settings:', error);
                        }
                    };
                    const copyUrl = async () => {
                        try {
                            await navigator.clipboard.writeText(httpUrl.value);
                            console.log('[Vue App] URL copied to clipboard');
                        }
                        catch (error) {
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
                        }
                        catch (error) {
                            console.error('[Vue App] Failed to load tool manager state:', error);
                        }
                    };
                    const updateToolStatus = async (category, name, enabled) => {
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
                            }
                            else {
                                console.log('[Vue App] Backend update successful');
                            }
                        }
                        catch (error) {
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
                        }
                        catch (error) {
                            console.error('[Vue App] Failed to select all tools:', error);
                        }
                    };
                    const deselectAllTools = async () => {
                        try {
                            // Cập nhật trạng thái cục bộ trực tiếp, sau đó lưu
                            availableTools.value.forEach(tool => tool.enabled = false);
                            await saveChanges();
                        }
                        catch (error) {
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
                        }
                        catch (error) {
                            console.error('[Vue App] Failed to save tool changes:', error);
                        }
                    };
                    const toggleCategoryTools = async (category, enabled) => {
                        try {
                            // Cập nhật trạng thái cục bộ trực tiếp, sau đó lưu
                            availableTools.value.forEach(tool => {
                                if (tool.category === category) {
                                    tool.enabled = enabled;
                                }
                            });
                            await saveChanges();
                        }
                        catch (error) {
                            console.error('[Vue App] Failed to toggle category tools:', error);
                        }
                    };
                    const getToolsByCategory = (category) => {
                        return availableTools.value.filter(tool => tool.category === category);
                    };
                    const getCategoryDisplayName = (category) => {
                        const categoryNames = {
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
                    (0, vue_1.watch)(settings, () => {
                        settingsChanged.value = true;
                    }, { deep: true });
                    // Tải dữ liệu khi component được mount
                    (0, vue_1.onMounted)(async () => {
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
                            }
                            else if (serverStatus && serverStatus.port) {
                                // Tương thích với phiên bản cũ, chỉ lấy thông tin cổng
                                settings.value.port = serverStatus.port;
                                console.log('[Vue App] Port loaded from server status:', serverStatus.port);
                            }
                        }
                        catch (error) {
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
                            }
                            catch (error) {
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
                template: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/template/vue/mcp-server-app.html'), 'utf-8'),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWxzL2RlZmF1bHQvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLCtDQUErQzs7QUFFL0MsdUNBQXdDO0FBQ3hDLCtCQUE0QjtBQUM1Qiw2QkFBaUc7QUFFakcsTUFBTSxZQUFZLEdBQUcsSUFBSSxPQUFPLEVBQVksQ0FBQztBQTRCN0MsTUFBTSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUNqQyxTQUFTLEVBQUU7UUFDUCxJQUFJO1lBQ0EsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFDRCxJQUFJO1lBQ0EsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7S0FDSjtJQUNELFFBQVEsRUFBRSxJQUFBLHVCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLDZDQUE2QyxDQUFDLEVBQUUsT0FBTyxDQUFDO0lBQy9GLEtBQUssRUFBRSxJQUFBLHVCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLHlDQUF5QyxDQUFDLEVBQUUsT0FBTyxDQUFDO0lBQ3hGLENBQUMsRUFBRTtRQUNDLEdBQUcsRUFBRSxNQUFNO1FBQ1gsVUFBVSxFQUFFLGFBQWE7S0FDNUI7SUFDRCxLQUFLO1FBQ0QsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ2IsTUFBTSxHQUFHLEdBQUcsSUFBQSxlQUFTLEVBQUMsRUFBRSxDQUFDLENBQUM7WUFDMUIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsZUFBZSxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRTVFLCtCQUErQjtZQUMvQixHQUFHLENBQUMsU0FBUyxDQUFD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RyxHQUFHLFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbkMsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUNOLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNsQixDQUFDO0lBQ0wsQ0FBQztDQUNKLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIHZ1ZS9vbmUtY29tcG9uZW50LXBlci1maWxlICovXHJcblxyXG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcy1leHRyYSc7XHJcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgY3JlYXRlQXBwLCBBcHAsIGRlZmluZUNvbXBvbmVudCwgcmVmLCBjb21wdXRlZCwgb25Nb3VudGVkLCB3YXRjaCwgbmV4dFRpY2sgfSBmcm9tICd2dWUnO1xyXG5cclxuY29uc3QgcGFuZWxEYXRhTWFwID0gbmV3IFdlYWtNYXA8YW55LCBBcHA+KCk7XHJcblxyXG4vLyDEkOG7i25oIG5naMSpYSBpbnRlcmZhY2UgY2hvIGPhuqV1IGjDrG5oIGPDtG5nIGPhu6UgKFRvb2xDb25maWcpXHJcbmludGVyZmFjZSBUb29sQ29uZmlnIHtcclxuICAgIGNhdGVnb3J5OiBzdHJpbmc7XHJcbiAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICBlbmFibGVkOiBib29sZWFuO1xyXG4gICAgZGVzY3JpcHRpb246IHN0cmluZztcclxufVxyXG5cclxuLy8gxJDhu4tuaCBuZ2jEqWEgaW50ZXJmYWNlIGNobyBj4bqldSBow6xuaCAoQ29uZmlndXJhdGlvbilcclxuaW50ZXJmYWNlIENvbmZpZ3VyYXRpb24ge1xyXG4gICAgaWQ6IHN0cmluZztcclxuICAgIG5hbWU6IHN0cmluZztcclxuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmc7XHJcbiAgICB0b29sczogVG9vbENvbmZpZ1tdO1xyXG4gICAgY3JlYXRlZEF0OiBzdHJpbmc7XHJcbiAgICB1cGRhdGVkQXQ6IHN0cmluZztcclxufVxyXG5cclxuLy8gxJDhu4tuaCBuZ2jEqWEgaW50ZXJmYWNlIGNobyBjw6BpIMSR4bq3dCBtw6F5IGNo4bunIChTZXJ2ZXJTZXR0aW5ncylcclxuaW50ZXJmYWNlIFNlcnZlclNldHRpbmdzIHtcclxuICAgIHBvcnQ6IG51bWJlcjtcclxuICAgIGF1dG9TdGFydDogYm9vbGVhbjtcclxuICAgIGRlYnVnTG9nOiBib29sZWFuO1xyXG4gICAgbWF4Q29ubmVjdGlvbnM6IG51bWJlcjtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBFZGl0b3IuUGFuZWwuZGVmaW5lKHtcclxuICAgIGxpc3RlbmVyczoge1xyXG4gICAgICAgIHNob3coKSB7IFxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW01DUCBQYW5lbF0gUGFuZWwgc2hvd24nKTsgXHJcbiAgICAgICAgfSxcclxuICAgICAgICBoaWRlKCkgeyBcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tNQ1AgUGFuZWxdIFBhbmVsIGhpZGRlbicpOyBcclxuICAgICAgICB9LFxyXG4gICAgfSxcclxuICAgIHRlbXBsYXRlOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9zdGF0aWMvdGVtcGxhdGUvZGVmYXVsdC9pbmRleC5odG1sJyksICd1dGYtOCcpLFxyXG4gICAgc3R5bGU6IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL3N0YXRpYy9zdHlsZS9kZWZhdWx0L2luZGV4LmNzcycpLCAndXRmLTgnKSxcclxuICAgICQ6IHtcclxuICAgICAgICBhcHA6ICcjYXBwJyxcclxuICAgICAgICBwYW5lbFRpdGxlOiAnI3BhbmVsVGl0bGUnLFxyXG4gICAgfSxcclxuICAgIHJlYWR5KCkge1xyXG4gICAgICAgIGlmICh0aGlzLiQuYXBwKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGFwcCA9IGNyZWF0ZUFwcCh7fSk7XHJcbiAgICAgICAgICAgIGFwcC5jb25maWcuY29tcGlsZXJPcHRpb25zLmlzQ3VzdG9tRWxlbWVudCA9ICh0YWcpID0+IHRhZy5zdGFydHNXaXRoKCd1aS0nKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFThuqFvIGNvbXBvbmVudCDhu6luZyBk4bulbmcgY2jDrW5oXHJcbiAgICAgICAgICAgIGFwcC5jb21wb25lbnQoJ01jcFNlcnZlckFwcCcsIGRlZmluZUNvbXBvbmVudCh7XHJcbiAgICAgICAgICAgICAgICBzZXR1cCgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBE4buvIGxp4buHdSByZWFjdGl2ZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdGl2ZVRhYiA9IHJlZignc2VydmVyJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VydmVyUnVubmluZyA9IHJlZihmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VydmVyU3RhdHVzID0gcmVmKCfEkMOjIGThu6tuZycpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbm5lY3RlZENsaWVudHMgPSByZWYoMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaHR0cFVybCA9IHJlZignJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNQcm9jZXNzaW5nID0gcmVmKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzZXR0aW5ncyA9IHJlZjxTZXJ2ZXJTZXR0aW5ncz4oe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3J0OiAzMDAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhdXRvU3RhcnQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWJ1Z0xvZzogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heENvbm5lY3Rpb25zOiAxMFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF2YWlsYWJsZVRvb2xzID0gcmVmPFRvb2xDb25maWdbXT4oW10pO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRvb2xDYXRlZ29yaWVzID0gcmVmPHN0cmluZ1tdPihbXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRodeG7mWMgdMOtbmggY29tcHV0ZWRcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGF0dXNDbGFzcyA9IGNvbXB1dGVkKCgpID0+ICh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdzdGF0dXMtcnVubmluZyc6IHNlcnZlclJ1bm5pbmcudmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdzdGF0dXMtc3RvcHBlZCc6ICFzZXJ2ZXJSdW5uaW5nLnZhbHVlXHJcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRvdGFsVG9vbHMgPSBjb21wdXRlZCgoKSA9PiBhdmFpbGFibGVUb29scy52YWx1ZS5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVuYWJsZWRUb29scyA9IGNvbXB1dGVkKCgpID0+IGF2YWlsYWJsZVRvb2xzLnZhbHVlLmZpbHRlcih0ID0+IHQuZW5hYmxlZCkubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXNhYmxlZFRvb2xzID0gY29tcHV0ZWQoKCkgPT4gdG90YWxUb29scy52YWx1ZSAtIGVuYWJsZWRUb29scy52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNldHRpbmdzQ2hhbmdlZCA9IHJlZihmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ8OhYyBwaMawxqFuZyB0aOG7qWNcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzd2l0Y2hUYWIgPSAodGFiTmFtZTogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZVRhYi52YWx1ZSA9IHRhYk5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YWJOYW1lID09PSAndG9vbHMnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkVG9vbE1hbmFnZXJTdGF0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0b2dnbGVTZXJ2ZXIgPSBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VydmVyUnVubmluZy52YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAnc3RvcC1zZXJ2ZXInKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU+G7rSBk4bulbmcgY8OgaSDEkeG6t3QgaGnhu4duIHThuqFpIGPhu6dhIGLhuqNuZyDEkWnhu4F1IGtoaeG7gW4ga2hpIGto4bufaSDEkeG7mW5nIG3DoXkgY2jhu6dcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50U2V0dGluZ3MgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvcnQ6IHNldHRpbmdzLnZhbHVlLnBvcnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9TdGFydDogc2V0dGluZ3MudmFsdWUuYXV0b1N0YXJ0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVEZWJ1Z0xvZzogc2V0dGluZ3MudmFsdWUuZGVidWdMb2csXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heENvbm5lY3Rpb25zOiBzZXR0aW5ncy52YWx1ZS5tYXhDb25uZWN0aW9uc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICd1cGRhdGUtc2V0dGluZ3MnLCBjdXJyZW50U2V0dGluZ3MpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAnc3RhcnQtc2VydmVyJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1Z1ZSBBcHBdIFNlcnZlciB0b2dnbGVkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbVnVlIEFwcF0gRmFpbGVkIHRvIHRvZ2dsZSBzZXJ2ZXI6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzYXZlU2V0dGluZ3MgPSBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBU4bqhbyBt4buZdCDEkeG7kWkgdMaw4bujbmcgxJHGoW4gZ2nhuqNuIMSR4buDIHRyw6FuaCBs4buXaSBjbG9uZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2V0dGluZ3NEYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvcnQ6IHNldHRpbmdzLnZhbHVlLnBvcnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXV0b1N0YXJ0OiBzZXR0aW5ncy52YWx1ZS5hdXRvU3RhcnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVidWdMb2c6IHNldHRpbmdzLnZhbHVlLmRlYnVnTG9nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heENvbm5lY3Rpb25zOiBzZXR0aW5ncy52YWx1ZS5tYXhDb25uZWN0aW9uc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICd1cGRhdGUtc2V0dGluZ3MnLCBzZXR0aW5nc0RhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tWdWUgQXBwXSBTYXZlIHNldHRpbmdzIHJlc3VsdDonLCByZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0dGluZ3NDaGFuZ2VkLnZhbHVlID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbVnVlIEFwcF0gRmFpbGVkIHRvIHNhdmUgc2V0dGluZ3M6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb3B5VXJsID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQoaHR0cFVybC52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1Z1ZSBBcHBdIFVSTCBjb3BpZWQgdG8gY2xpcGJvYXJkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbVnVlIEFwcF0gRmFpbGVkIHRvIGNvcHkgVVJMOicsIGVycm9yKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbG9hZFRvb2xNYW5hZ2VyU3RhdGUgPSBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ2dldFRvb2xNYW5hZ2VyU3RhdGUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgJiYgcmVzdWx0LnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBMdcO0biB04bqjaSB0cuG6oW5nIHRow6FpIHThu6sgYmFja2VuZCDEkeG7gyDEkeG6o20gYuG6o28gZOG7ryBsaeG7h3UgbeG7m2kgbmjhuqV0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlVG9vbHMudmFsdWUgPSByZXN1bHQuYXZhaWxhYmxlVG9vbHMgfHwgW107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tWdWUgQXBwXSBMb2FkZWQgdG9vbHM6JywgYXZhaWxhYmxlVG9vbHMudmFsdWUubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBD4bqtcCBuaOG6rXQgcGjDom4gbG/huqFpIGPDtG5nIGPhu6VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjYXRlZ29yaWVzID0gbmV3IFNldChhdmFpbGFibGVUb29scy52YWx1ZS5tYXAodG9vbCA9PiB0b29sLmNhdGVnb3J5KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9vbENhdGVnb3JpZXMudmFsdWUgPSBBcnJheS5mcm9tKGNhdGVnb3JpZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1Z1ZSBBcHBdIEZhaWxlZCB0byBsb2FkIHRvb2wgbWFuYWdlciBzdGF0ZTonLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHVwZGF0ZVRvb2xTdGF0dXMgPSBhc3luYyAoY2F0ZWdvcnk6IHN0cmluZywgbmFtZTogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1Z1ZSBBcHBdIHVwZGF0ZVRvb2xTdGF0dXMgY2FsbGVkOicsIGNhdGVnb3J5LCBuYW1lLCBlbmFibGVkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgY+G7pWMgYuG7mSB0csaw4bubY1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdG9vbEluZGV4ID0gYXZhaWxhYmxlVG9vbHMudmFsdWUuZmluZEluZGV4KHQgPT4gdC5jYXRlZ29yeSA9PT0gY2F0ZWdvcnkgJiYgdC5uYW1lID09PSBuYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0b29sSW5kZXggIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlVG9vbHMudmFsdWVbdG9vbEluZGV4XS5lbmFibGVkID0gZW5hYmxlZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDDiXAgYnXhu5ljIGvDrWNoIGhv4bqhdCBj4bqtcCBuaOG6rXQgcmVhY3RpdmVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdmFpbGFibGVUb29scy52YWx1ZSA9IFsuLi5hdmFpbGFibGVUb29scy52YWx1ZV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tWdWUgQXBwXSBMb2NhbCBzdGF0ZSB1cGRhdGVkLCB0b29sIGVuYWJsZWQ6JywgYXZhaWxhYmxlVG9vbHMudmFsdWVbdG9vbEluZGV4XS5lbmFibGVkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR+G7jWkgYmFja2VuZCDEkeG7gyBj4bqtcCBuaOG6rXRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAndXBkYXRlVG9vbFN0YXR1cycsIGNhdGVnb3J5LCBuYW1lLCBlbmFibGVkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzdWx0IHx8ICFyZXN1bHQuc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE7hur91IGPhuq1wIG5o4bqtdCBiYWNrZW5kIHRo4bqldCBi4bqhaSwgaG/DoG4gdMOhYyB0cuG6oW5nIHRow6FpIGPhu6VjIGLhu5lcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodG9vbEluZGV4ICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdmFpbGFibGVUb29scy52YWx1ZVt0b29sSW5kZXhdLmVuYWJsZWQgPSAhZW5hYmxlZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlVG9vbHMudmFsdWUgPSBbLi4uYXZhaWxhYmxlVG9vbHMudmFsdWVdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbVnVlIEFwcF0gQmFja2VuZCB1cGRhdGUgZmFpbGVkLCByb2xsZWQgYmFjayBsb2NhbCBzdGF0ZScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1Z1ZSBBcHBdIEJhY2tlbmQgdXBkYXRlIHN1Y2Nlc3NmdWwnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE7hur91IHjhuqN5IHJhIGzhu5dpLCBob8OgbiB0w6FjIHRy4bqhbmcgdGjDoWkgY+G7pWMgYuG7mVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdG9vbEluZGV4ID0gYXZhaWxhYmxlVG9vbHMudmFsdWUuZmluZEluZGV4KHQgPT4gdC5jYXRlZ29yeSA9PT0gY2F0ZWdvcnkgJiYgdC5uYW1lID09PSBuYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0b29sSW5kZXggIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlVG9vbHMudmFsdWVbdG9vbEluZGV4XS5lbmFibGVkID0gIWVuYWJsZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlVG9vbHMudmFsdWUgPSBbLi4uYXZhaWxhYmxlVG9vbHMudmFsdWVdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1Z1ZSBBcHBdIEZhaWxlZCB0byB1cGRhdGUgdG9vbCBzdGF0dXM6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzZWxlY3RBbGxUb29scyA9IGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEPhuq1wIG5o4bqtdCB0cuG6oW5nIHRow6FpIGPhu6VjIGLhu5kgdHLhu7FjIHRp4bq/cCwgc2F1IMSRw7MgbMawdVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlVG9vbHMudmFsdWUuZm9yRWFjaCh0b29sID0+IHRvb2wuZW5hYmxlZCA9IHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgc2F2ZUNoYW5nZXMoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tWdWUgQXBwXSBGYWlsZWQgdG8gc2VsZWN0IGFsbCB0b29sczonLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRlc2VsZWN0QWxsVG9vbHMgPSBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBD4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSBj4bulYyBi4buZIHRy4buxYyB0aeG6v3AsIHNhdSDEkcOzIGzGsHVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF2YWlsYWJsZVRvb2xzLnZhbHVlLmZvckVhY2godG9vbCA9PiB0b29sLmVuYWJsZWQgPSBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBzYXZlQ2hhbmdlcygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1Z1ZSBBcHBdIEZhaWxlZCB0byBkZXNlbGVjdCBhbGwgdG9vbHM6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNhdmVDaGFuZ2VzID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVOG6oW8gxJHhu5FpIHTGsOG7o25nIHRow7RuZyB0aMaw4budbmcgxJHhu4MgdHLDoW5oIGzhu5dpIGNsb25lIMSR4buRaSB0xrDhu6NuZyByZWFjdGl2ZSBj4bunYSBWdWUzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB1cGRhdGVzID0gYXZhaWxhYmxlVG9vbHMudmFsdWUubWFwKHRvb2wgPT4gKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeTogU3RyaW5nKHRvb2wuY2F0ZWdvcnkpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFN0cmluZyh0b29sLm5hbWUpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IEJvb2xlYW4odG9vbC5lbmFibGVkKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1Z1ZSBBcHBdIFNlbmRpbmcgdXBkYXRlczonLCB1cGRhdGVzLmxlbmd0aCwgJ3Rvb2xzJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAndXBkYXRlVG9vbFN0YXR1c0JhdGNoJywgdXBkYXRlcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgJiYgcmVzdWx0LnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1Z1ZSBBcHBdIFRvb2wgY2hhbmdlcyBzYXZlZCBzdWNjZXNzZnVsbHknKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tWdWUgQXBwXSBGYWlsZWQgdG8gc2F2ZSB0b29sIGNoYW5nZXM6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdG9nZ2xlQ2F0ZWdvcnlUb29scyA9IGFzeW5jIChjYXRlZ29yeTogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBD4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSBj4bulYyBi4buZIHRy4buxYyB0aeG6v3AsIHNhdSDEkcOzIGzGsHVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF2YWlsYWJsZVRvb2xzLnZhbHVlLmZvckVhY2godG9vbCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRvb2wuY2F0ZWdvcnkgPT09IGNhdGVnb3J5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvb2wuZW5hYmxlZCA9IGVuYWJsZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBzYXZlQ2hhbmdlcygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1Z1ZSBBcHBdIEZhaWxlZCB0byB0b2dnbGUgY2F0ZWdvcnkgdG9vbHM6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBnZXRUb29sc0J5Q2F0ZWdvcnkgPSAoY2F0ZWdvcnk6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXZhaWxhYmxlVG9vbHMudmFsdWUuZmlsdGVyKHRvb2wgPT4gdG9vbC5jYXRlZ29yeSA9PT0gY2F0ZWdvcnkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ2V0Q2F0ZWdvcnlEaXNwbGF5TmFtZSA9IChjYXRlZ29yeTogc3RyaW5nKTogc3RyaW5nID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2F0ZWdvcnlOYW1lczogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdzY2VuZSc6ICdDw7RuZyBj4bulIGPhuqNuaCAoU2NlbmUpJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdub2RlJzogJ0PDtG5nIGPhu6UgbsO6dCAoTm9kZSknLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2NvbXBvbmVudCc6ICdDw7RuZyBj4bulIHRow6BuaCBwaOG6p24gKENvbXBvbmVudCknLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3ByZWZhYic6ICdDw7RuZyBj4bulIFByZWZhYicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAncHJvamVjdCc6ICdDw7RuZyBj4bulIGThu7Egw6FuJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkZWJ1Zyc6ICdDw7RuZyBj4bulIGfhu6EgbOG7l2kgKERlYnVnKScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAncHJlZmVyZW5jZXMnOiAnQ8O0bmcgY+G7pSBUw7l5IGNo4buJbmggKFByZWZlcmVuY2VzKScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnc2VydmVyJzogJ0PDtG5nIGPhu6UgbcOheSBjaOG7pycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnYnJvYWRjYXN0JzogJ0PDtG5nIGPhu6UgcXXhuqNuZyBiw6EgKEJyb2FkY2FzdCknLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3NjZW5lQWR2YW5jZWQnOiAnQ8O0bmcgY+G7pSBj4bqjbmggbsOibmcgY2FvJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdzY2VuZVZpZXcnOiAnQ8O0bmcgY+G7pSB4ZW0gY+G6o25oJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdyZWZlcmVuY2VJbWFnZSc6ICdDw7RuZyBj4bulIGjDrG5oIOG6o25oIHRoYW0gY2hp4bq/dScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnYXNzZXRBZHZhbmNlZCc6ICdDw7RuZyBj4bulIHTDoGkgbmd1ecOqbiBuw6JuZyBjYW8nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3ZhbGlkYXRpb24nOiAnQ8O0bmcgY+G7pSB4w6FjIHRo4buxYydcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhdGVnb3J5TmFtZXNbY2F0ZWdvcnldIHx8IGNhdGVnb3J5O1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAvLyBUaGVvIGTDtWkgdGhheSDEkeG7lWkgY8OgaSDEkeG6t3RcclxuICAgICAgICAgICAgICAgICAgICB3YXRjaChzZXR0aW5ncywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXR0aW5nc0NoYW5nZWQudmFsdWUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sIHsgZGVlcDogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVOG6o2kgZOG7ryBsaeG7h3Uga2hpIGNvbXBvbmVudCDEkcaw4bujYyBtb3VudFxyXG4gICAgICAgICAgICAgICAgICAgIG9uTW91bnRlZChhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFThuqNpIHRy4bqhbmcgdGjDoWkgdHLDrG5oIHF14bqjbiBsw70gY8O0bmcgY+G7pVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBsb2FkVG9vbE1hbmFnZXJTdGF0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTOG6pXkgdGjDtG5nIHRpbiBjw6BpIMSR4bq3dCB04burIHRy4bqhbmcgdGjDoWkgbcOheSBjaOG7p1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VydmVyU3RhdHVzID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICdnZXQtc2VydmVyLXN0YXR1cycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlcnZlclN0YXR1cyAmJiBzZXJ2ZXJTdGF0dXMuc2V0dGluZ3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXR0aW5ncy52YWx1ZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9ydDogc2VydmVyU3RhdHVzLnNldHRpbmdzLnBvcnQgfHwgMzAwMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXV0b1N0YXJ0OiBzZXJ2ZXJTdGF0dXMuc2V0dGluZ3MuYXV0b1N0YXJ0IHx8IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWJ1Z0xvZzogc2VydmVyU3RhdHVzLnNldHRpbmdzLmVuYWJsZURlYnVnTG9nIHx8IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhDb25uZWN0aW9uczogc2VydmVyU3RhdHVzLnNldHRpbmdzLm1heENvbm5lY3Rpb25zIHx8IDEwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1Z1ZSBBcHBdIFNlcnZlciBzZXR0aW5ncyBsb2FkZWQgZnJvbSBzdGF0dXM6Jywgc2VydmVyU3RhdHVzLnNldHRpbmdzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VydmVyU3RhdHVzICYmIHNlcnZlclN0YXR1cy5wb3J0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVMawxqFuZyB0aMOtY2ggduG7m2kgcGhpw6puIGLhuqNuIGPFqSwgY2jhu4kgbOG6pXkgdGjDtG5nIHRpbiBj4buVbmdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXR0aW5ncy52YWx1ZS5wb3J0ID0gc2VydmVyU3RhdHVzLnBvcnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tWdWUgQXBwXSBQb3J0IGxvYWRlZCBmcm9tIHNlcnZlciBzdGF0dXM6Jywgc2VydmVyU3RhdHVzLnBvcnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1Z1ZSBBcHBdIEZhaWxlZCB0byBnZXQgc2VydmVyIHN0YXR1czonLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1Z1ZSBBcHBdIFVzaW5nIGRlZmF1bHQgc2VydmVyIHNldHRpbmdzJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIMSQ4buLbmgga+G7syBj4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSBtw6F5IGNo4bunXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldEludGVydmFsKGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICdnZXQtc2VydmVyLXN0YXR1cycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VydmVyUnVubmluZy52YWx1ZSA9IHJlc3VsdC5ydW5uaW5nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXJ2ZXJTdGF0dXMudmFsdWUgPSByZXN1bHQucnVubmluZyA/ICfEkGFuZyBjaOG6oXknIDogJ8SQw6MgZOG7q25nJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29ubmVjdGVkQ2xpZW50cy52YWx1ZSA9IHJlc3VsdC5jbGllbnRzIHx8IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGh0dHBVcmwudmFsdWUgPSByZXN1bHQucnVubmluZyA/IGBodHRwOi8vbG9jYWxob3N0OiR7cmVzdWx0LnBvcnR9YCA6ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc1Byb2Nlc3NpbmcudmFsdWUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tWdWUgQXBwXSBGYWlsZWQgdG8gZ2V0IHNlcnZlciBzdGF0dXM6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCAyMDAwKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBE4buvIGxp4buHdVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmVUYWIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZlclJ1bm5pbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZlclN0YXR1cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29ubmVjdGVkQ2xpZW50cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaHR0cFVybCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXNQcm9jZXNzaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXR0aW5ncyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlVG9vbHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvb2xDYXRlZ29yaWVzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXR0aW5nc0NoYW5nZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaHXhu5ljIHTDrW5oIGNvbXB1dGVkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1c0NsYXNzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3RhbFRvb2xzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkVG9vbHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkVG9vbHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDw6FjIHBoxrDGoW5nIHRo4bupY1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2hUYWIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvZ2dsZVNlcnZlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2F2ZVNldHRpbmdzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3B5VXJsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkVG9vbE1hbmFnZXJTdGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlVG9vbFN0YXR1cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0QWxsVG9vbHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2VsZWN0QWxsVG9vbHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhdmVDaGFuZ2VzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b2dnbGVDYXRlZ29yeVRvb2xzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBnZXRUb29sc0J5Q2F0ZWdvcnksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdldENhdGVnb3J5RGlzcGxheU5hbWVcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9zdGF0aWMvdGVtcGxhdGUvdnVlL21jcC1zZXJ2ZXItYXBwLmh0bWwnKSwgJ3V0Zi04JyksXHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGFwcC5tb3VudCh0aGlzLiQuYXBwKTtcclxuICAgICAgICAgICAgcGFuZWxEYXRhTWFwLnNldCh0aGlzLCBhcHApO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tNQ1AgUGFuZWxdIFZ1ZTMgYXBwIG1vdW50ZWQgc3VjY2Vzc2Z1bGx5Jyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIGJlZm9yZUNsb3NlKCkgeyB9LFxyXG4gICAgY2xvc2UoKSB7XHJcbiAgICAgICAgY29uc3QgYXBwID0gcGFuZWxEYXRhTWFwLmdldCh0aGlzKTtcclxuICAgICAgICBpZiAoYXBwKSB7XHJcbiAgICAgICAgICAgIGFwcC51bm1vdW50KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxufSk7Il19