import { readFileSync } from 'fs-extra';
import { join } from 'path';

module.exports = Editor.Panel.define({
    listeners: {
        show() { console.log('Tool Manager panel shown'); },
        hide() { console.log('Tool Manager panel hidden'); }
    },
    template: readFileSync(join(__dirname, '../../../static/template/default/tool-manager.html'), 'utf-8'),
    style: readFileSync(join(__dirname, '../../../static/style/default/index.css'), 'utf-8'),
    $: {
        panelTitle: '#panelTitle',
        createConfigBtn: '#createConfigBtn',
        importConfigBtn: '#importConfigBtn',
        exportConfigBtn: '#exportConfigBtn',
        configSelector: '#configSelector',
        applyConfigBtn: '#applyConfigBtn',
        editConfigBtn: '#editConfigBtn',
        deleteConfigBtn: '#deleteConfigBtn',
        toolsContainer: '#toolsContainer',
        selectAllBtn: '#selectAllBtn',
        deselectAllBtn: '#deselectAllBtn',
        saveChangesBtn: '#saveChangesBtn',
        totalToolsCount: '#totalToolsCount',
        enabledToolsCount: '#enabledToolsCount',
        disabledToolsCount: '#disabledToolsCount',
        configModal: '#configModal',
        modalTitle: '#modalTitle',
        configForm: '#configForm',
        configName: '#configName',
        configDescription: '#configDescription',
        closeModal: '#closeModal',
        cancelConfigBtn: '#cancelConfigBtn',
        saveConfigBtn: '#saveConfigBtn',
        importModal: '#importModal',
        importConfigJson: '#importConfigJson',
        closeImportModal: '#closeImportModal',
        cancelImportBtn: '#cancelImportBtn',
        confirmImportBtn: '#confirmImportBtn'
    },
    methods: {
        async loadToolManagerState(this: any) {
            try {
                this.toolManagerState = await Editor.Message.request('cocos-mcp-server', 'getToolManagerState');
                this.currentConfiguration = this.toolManagerState.currentConfiguration;
                this.configurations = this.toolManagerState.configurations;
                this.availableTools = this.toolManagerState.availableTools;
                this.updateUI();
            } catch (error) {
                console.error('Failed to load tool manager state:', error);
                this.showError('Tải trạng thái trình quản lý công cụ thất bại');
            }
        },

        updateUI(this: any) {
            this.updateConfigSelector();
            this.updateToolsDisplay();
            this.updateStatusBar();
            this.updateButtons();
        },

        updateConfigSelector(this: any) {
            const selector = this.$.configSelector;
            selector.innerHTML = '<option value="">Chọn cấu hình...</option>';
            
            this.configurations.forEach((config: any) => {
                const option = document.createElement('option');
                option.value = config.id;
                option.textContent = config.name;
                if (this.currentConfiguration && config.id === this.currentConfiguration.id) {
                    option.selected = true;
                }
                selector.appendChild(option);
            });
        },

        updateToolsDisplay(this: any) {
            const container = this.$.toolsContainer;
            
            if (!this.currentConfiguration) {
                container.innerHTML = `
                    <div class="empty-state">
                        <h3>Chưa chọn cấu hình</h3>
                        <p>Vui lòng chọn hoặc tạo cấu hình mới trước</p>
                    </div>
                `;
                return;
            }

            const toolsByCategory: any = {};
            this.currentConfiguration.tools.forEach((tool: any) => {
                if (!toolsByCategory[tool.category]) {
                    toolsByCategory[tool.category] = [];
                }
                toolsByCategory[tool.category].push(tool);
            });

            container.innerHTML = '';
            
            Object.entries(toolsByCategory).forEach(([category, tools]: [string, any]) => {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'tool-category';
                
                const enabledCount = tools.filter((t: any) => t.enabled).length;
                const totalCount = tools.length;
                
                categoryDiv.innerHTML = `
                    <div class="category-header">
                        <div class="category-name">${this.getCategoryDisplayName(category)}</div>
                        <div class="category-toggle">
                            <span>${enabledCount}/${totalCount}</span>
                            <input type="checkbox" class="checkbox category-checkbox" 
                                   data-category="${category}" 
                                   ${enabledCount === totalCount ? 'checked' : ''}>
                        </div>
                    </div>
                    <div class="tool-list">
                        ${tools.map((tool: any) => `
                            <div class="tool-item">
                                <div class="tool-info">
                                    <div class="tool-name">${tool.name}</div>
                                    <div class="tool-description">${tool.description}</div>
                                </div>
                                <div class="tool-toggle">
                                    <input type="checkbox" class="checkbox tool-checkbox" 
                                           data-category="${tool.category}" 
                                           data-name="${tool.name}" 
                                           ${tool.enabled ? 'checked' : ''}>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
                
                container.appendChild(categoryDiv);
            });

            this.bindToolEvents();
        },

        bindToolEvents(this: any) {
            document.querySelectorAll('.category-checkbox').forEach((checkbox: any) => {
                checkbox.addEventListener('change', (e: any) => {
                    const category = e.target.dataset.category;
                    const checked = e.target.checked;
                    this.toggleCategoryTools(category, checked);
                });
            });

            document.querySelectorAll('.tool-checkbox').forEach((checkbox: any) => {
                checkbox.addEventListener('change', (e: any) => {
                    const category = e.target.dataset.category;
                    const name = e.target.dataset.name;
                    const enabled = e.target.checked;
                    this.updateToolStatus(category, name, enabled);
                });
            });
        },

        async toggleCategoryTools(this: any, category: string, enabled: boolean) {
            if (!this.currentConfiguration) return;

            console.log(`Toggling category tools: ${category} = ${enabled}`);

            const categoryTools = this.currentConfiguration.tools.filter((tool: any) => tool.category === category);
            if (categoryTools.length === 0) return;

            const updates = categoryTools.map((tool: any) => ({
                category: tool.category,
                name: tool.name,
                enabled: enabled
            }));

            try {
                // Cập nhật trạng thái cục bộ trước
                categoryTools.forEach((tool: any) => {
                    tool.enabled = enabled;
                });
                console.log(`Updated local category state: ${category} = ${enabled}`);
                
                // Cập nhật giao diện UI ngay lập tức
                this.updateStatusBar();
                this.updateCategoryCounts();
                this.updateToolCheckboxes(category, enabled);

                // Sau đó gửi yêu cầu đến backend
                await Editor.Message.request('cocos-mcp-server', 'updateToolStatusBatch', 
                    this.currentConfiguration.id, updates);
                
            } catch (error) {
                console.error('Failed to toggle category tools:', error);
                this.showError('Chuyển đổi công cụ danh mục thất bại');
                
                // Nếu cập nhật backend thất bại, hoàn tác trạng thái cục bộ
                categoryTools.forEach((tool: any) => {
                    tool.enabled = !enabled;
                });
                this.updateStatusBar();
                this.updateCategoryCounts();
                this.updateToolCheckboxes(category, !enabled);
            }
        },

        async updateToolStatus(this: any, category: string, name: string, enabled: boolean) {
            if (!this.currentConfiguration) return;

            console.log(`Updating tool status: ${category}.${name} = ${enabled}`);
            console.log(`Current config ID: ${this.currentConfiguration.id}`);

            // Cập nhật trạng thái cục bộ trước
            const tool = this.currentConfiguration.tools.find((t: any) => 
                t.category === category && t.name === name);
            if (!tool) {
                console.error(`Tool not found: ${category}.${name}`);
                return;
            }

            try {
                tool.enabled = enabled;
                console.log(`Updated local tool state: ${tool.name} = ${tool.enabled}`);
                
                // Cập nhật UI ngay lập tức (chỉ cập nhật thông tin thống kê, không render lại danh sách công cụ)
                this.updateStatusBar();
                this.updateCategoryCounts();

                // Sau đó gửi yêu cầu đến backend
                console.log(`Sending to backend: configId=${this.currentConfiguration.id}, category=${category}, name=${name}, enabled=${enabled}`);
                const result = await Editor.Message.request('cocos-mcp-server', 'updateToolStatus', 
                    this.currentConfiguration.id, category, name, enabled);
                console.log('Backend response:', result);
                
            } catch (error) {
                console.error('Failed to update tool status:', error);
                this.showError('Cập nhật trạng thái công cụ thất bại');
                
                // Nếu cập nhật backend thất bại, hoàn tác trạng thái cục bộ
                tool.enabled = !enabled;
                this.updateStatusBar();
                this.updateCategoryCounts();
            }
        },

        updateStatusBar(this: any) {
            if (!this.currentConfiguration) {
                this.$.totalToolsCount.textContent = '0';
                this.$.enabledToolsCount.textContent = '0';
                this.$.disabledToolsCount.textContent = '0';
                return;
            }

            const total = this.currentConfiguration.tools.length;
            const enabled = this.currentConfiguration.tools.filter((t: any) => t.enabled).length;
            const disabled = total - enabled;

            console.log(`Status bar update: total=${total}, enabled=${enabled}, disabled=${disabled}`);

            this.$.totalToolsCount.textContent = total.toString();
            this.$.enabledToolsCount.textContent = enabled.toString();
            this.$.disabledToolsCount.textContent = disabled.toString();
        },

        updateCategoryCounts(this: any) {
            if (!this.currentConfiguration) return;

            // Cập nhật hiển thị số lượng của từng danh mục
            document.querySelectorAll('.category-checkbox').forEach((checkbox: any) => {
                const category = checkbox.dataset.category;
                const categoryTools = this.currentConfiguration.tools.filter((t: any) => t.category === category);
                const enabledCount = categoryTools.filter((t: any) => t.enabled).length;
                const totalCount = categoryTools.length;
                
                // Cập nhật hiển thị đếm số lượng
                const countSpan = checkbox.parentElement.querySelector('span');
                if (countSpan) {
                    countSpan.textContent = `${enabledCount}/${totalCount}`;
                }
                
                // Cập nhật trạng thái checkbox danh mục
                checkbox.checked = enabledCount === totalCount;
            });
        },

        updateToolCheckboxes(this: any, category: string, enabled: boolean) {
            // Cập nhật tất cả các checkbox công cụ của một danh mục cụ thể
            document.querySelectorAll(`.tool-checkbox[data-category="${category}"]`).forEach((checkbox: any) => {
                checkbox.checked = enabled;
            });
        },

        updateButtons(this: any) {
            const hasCurrentConfig = !!this.currentConfiguration;
            this.$.editConfigBtn.disabled = !hasCurrentConfig;
            this.$.deleteConfigBtn.disabled = !hasCurrentConfig;
            this.$.exportConfigBtn.disabled = !hasCurrentConfig;
            this.$.applyConfigBtn.disabled = !hasCurrentConfig;
        },

        async createConfiguration(this: any) {
            this.editingConfig = null;
            this.$.modalTitle.textContent = 'Tạo cấu hình mới';
            this.$.configName.value = '';
            this.$.configDescription.value = '';
            this.showModal('configModal');
        },

        async editConfiguration(this: any) {
            if (!this.currentConfiguration) return;

            this.editingConfig = this.currentConfiguration;
            this.$.modalTitle.textContent = 'Chỉnh sửa cấu hình';
            this.$.configName.value = this.currentConfiguration.name;
            this.$.configDescription.value = this.currentConfiguration.description || '';
            this.showModal('configModal');
        },

        async saveConfiguration(this: any) {
            const name = this.$.configName.value.trim();
            const description = this.$.configDescription.value.trim();

            if (!name) {
                this.showError('Tên cấu hình không được để trống');
                return;
            }

            try {
                if (this.editingConfig) {
                    await Editor.Message.request('cocos-mcp-server', 'updateToolConfiguration', 
                        this.editingConfig.id, { name, description });
                } else {
                    await Editor.Message.request('cocos-mcp-server', 'createToolConfiguration', name, description);
                }
                
                this.hideModal('configModal');
                await this.loadToolManagerState();
            } catch (error) {
                console.error('Failed to save configuration:', error);
                this.showError('Lưu cấu hình thất bại');
            }
        },

        async deleteConfiguration(this: any) {
            if (!this.currentConfiguration) return;

            const confirmed = await Editor.Dialog.warn('Xác nhận xóa', {
                detail: `Bạn có chắc chắn muốn xóa cấu hình "${this.currentConfiguration.name}" không? Thao tác này không thể hoàn tác.`
            });
            
            if (confirmed) {
                try {
                    await Editor.Message.request('cocos-mcp-server', 'deleteToolConfiguration', 
                        this.currentConfiguration.id);
                    await this.loadToolManagerState();
                } catch (error) {
                    console.error('Failed to delete configuration:', error);
                    this.showError('Xóa cấu hình thất bại');
                }
            }
        },

        async applyConfiguration(this: any) {
            const configId = this.$.configSelector.value;
            if (!configId) return;

            try {
                await Editor.Message.request('cocos-mcp-server', 'setCurrentToolConfiguration', configId);
                await this.loadToolManagerState();
            } catch (error) {
                console.error('Failed to apply configuration:', error);
                this.showError('Áp dụng cấu hình thất bại');
            }
        },

        async exportConfiguration(this: any) {
            if (!this.currentConfiguration) return;

            try {
                const result = await Editor.Message.request('cocos-mcp-server', 'exportToolConfiguration', 
                    this.currentConfiguration.id);
                
                Editor.Clipboard.write('text', result.configJson);
                Editor.Dialog.info('Xuất thành công', { detail: 'Cấu hình đã được sao chép vào bộ nhớ tạm' });
            } catch (error) {
                console.error('Failed to export configuration:', error);
                this.showError('Xuất cấu hình thất bại');
            }
        },

        async importConfiguration(this: any) {
            this.$.importConfigJson.value = '';
            this.showModal('importModal');
        },

        async confirmImport(this: any) {
            const configJson = this.$.importConfigJson.value.trim();
            if (!configJson) {
                this.showError('Vui lòng nhập JSON cấu hình');
                return;
            }

            try {
                await Editor.Message.request('cocos-mcp-server', 'importToolConfiguration', configJson);
                this.hideModal('importModal');
                await this.loadToolManagerState();
                Editor.Dialog.info('Nhập thành công', { detail: 'Cấu hình đã được nhập thành công' });
            } catch (error) {
                console.error('Failed to import configuration:', error);
                this.showError('Nhập cấu hình thất bại');
            }
        },

        async selectAllTools(this: any) {
            if (!this.currentConfiguration) return;

            console.log('Selecting all tools');

            const updates = this.currentConfiguration.tools.map((tool: any) => ({
                category: tool.category,
                name: tool.name,
                enabled: true
            }));

            try {
                // Cập nhật trạng thái cục bộ trước
                this.currentConfiguration.tools.forEach((tool: any) => {
                    tool.enabled = true;
                });
                console.log('Updated local state: all tools enabled');
                
                // Cập nhật UI ngay lập tức
                this.updateStatusBar();
                this.updateToolsDisplay();

                // Sau đó gửi yêu cầu đến backend
                await Editor.Message.request('cocos-mcp-server', 'updateToolStatusBatch', 
                    this.currentConfiguration.id, updates);
                
            } catch (error) {
                console.error('Failed to select all tools:', error);
                this.showError('Chọn tất cả công cụ thất bại');
                
                // Nếu cập nhật backend thất bại, hoàn tác trạng thái cục bộ
                this.currentConfiguration.tools.forEach((tool: any) => {
                    tool.enabled = false;
                });
                this.updateStatusBar();
                this.updateToolsDisplay();
            }
        },

        async deselectAllTools(this: any) {
            if (!this.currentConfiguration) return;

            console.log('Deselecting all tools');

            const updates = this.currentConfiguration.tools.map((tool: any) => ({
                category: tool.category,
                name: tool.name,
                enabled: false
            }));

            try {
                // Cập nhật trạng thái cục bộ trước
                this.currentConfiguration.tools.forEach((tool: any) => {
                    tool.enabled = false;
                });
                console.log('Updated local state: all tools disabled');
                
                // Cập nhật UI ngay lập tức
                this.updateStatusBar();
                this.updateToolsDisplay();

                // Sau đó gửi yêu cầu đến backend
                await Editor.Message.request('cocos-mcp-server', 'updateToolStatusBatch', 
                    this.currentConfiguration.id, updates);
                
            } catch (error) {
                console.error('Failed to deselect all tools:', error);
                this.showError('Bỏ chọn tất cả công cụ thất bại');
                
                // Nếu cập nhật backend thất bại, hoàn tác trạng thái cục bộ
                this.currentConfiguration.tools.forEach((tool: any) => {
                    tool.enabled = true;
                });
                this.updateStatusBar();
                this.updateToolsDisplay();
            }
        },

        getCategoryDisplayName(this: any, category: string): string {
            const categoryNames: any = {
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
        },

        showModal(this: any, modalId: string) {
            this.$[modalId].style.display = 'block';
        },

        hideModal(this: any, modalId: string) {
            this.$[modalId].style.display = 'none';
        },

        showError(this: any, message: string) {
            Editor.Dialog.error('Lỗi', { detail: message });
        },

        async saveChanges(this: any) {
            if (!this.currentConfiguration) {
                this.showError('Chưa chọn cấu hình');
                return;
            }

            try {
                // Đảm bảo cấu hình hiện tại đã được lưu vào backend
                await Editor.Message.request('cocos-mcp-server', 'updateToolConfiguration', 
                    this.currentConfiguration.id, {
                        name: this.currentConfiguration.name,
                        description: this.currentConfiguration.description,
                        tools: this.currentConfiguration.tools
                    });
                
                Editor.Dialog.info('Lưu thành công', { detail: 'Các thay đổi cấu hình đã được lưu' });
            } catch (error) {
                console.error('Failed to save changes:', error);
                this.showError('Lưu thay đổi thất bại');
            }
        },

        bindEvents(this: any) {
            this.$.createConfigBtn.addEventListener('click', this.createConfiguration.bind(this));
            this.$.editConfigBtn.addEventListener('click', this.editConfiguration.bind(this));
            this.$.deleteConfigBtn.addEventListener('click', this.deleteConfiguration.bind(this));
            this.$.applyConfigBtn.addEventListener('click', this.applyConfiguration.bind(this));
            this.$.exportConfigBtn.addEventListener('click', this.exportConfiguration.bind(this));
            this.$.importConfigBtn.addEventListener('click', this.importConfiguration.bind(this));

            this.$.selectAllBtn.addEventListener('click', this.selectAllTools.bind(this));
            this.$.deselectAllBtn.addEventListener('click', this.deselectAllTools.bind(this));
            this.$.saveChangesBtn.addEventListener('click', this.saveChanges.bind(this));

            this.$.closeModal.addEventListener('click', () => this.hideModal('configModal'));
            this.$.cancelConfigBtn.addEventListener('click', () => this.hideModal('configModal'));
            this.$.configForm.addEventListener('submit', (e: any) => {
                e.preventDefault();
                this.saveConfiguration();
            });

            this.$.closeImportModal.addEventListener('click', () => this.hideModal('importModal'));
            this.$.cancelImportBtn.addEventListener('click', () => this.hideModal('importModal'));
            this.$.confirmImportBtn.addEventListener('click', this.confirmImport.bind(this));

            this.$.configSelector.addEventListener('change', this.applyConfiguration.bind(this));
        }
    },
    ready() {
        (this as any).toolManagerState = null;
        (this as any).currentConfiguration = null;
        (this as any).configurations = [];
        (this as any).availableTools = [];
        (this as any).editingConfig = null;

        (this as any).bindEvents();
        (this as any).loadToolManagerState();
    },
    beforeClose() {
        // Công việc dọn dẹp
    },
    close() {
        // Dọn dẹp khi bảng điều khiển đóng
    }
} as any); 