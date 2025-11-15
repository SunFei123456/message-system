// 留言管理系统 - API版本
// 连接FastAPI后端服务

class MessageManagerAPI {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8000/api/v1';
        this.messages = [];
        this.filteredMessages = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.sortField = 'created_at';
        this.sortDirection = 'desc';
        this.searchQuery = '';
        this.dateFilter = 'all';
        this.totalMessages = 0;
        this.totalPages = 0;
        
        this.debouncedApplyFilters = this.debounce(this.applyFilters, 300);
        
        this.init();
    }
    
    async init() {
        try {
            await this.checkApiConnection();
            await this.loadInitialData();
            this.setupEventListeners();
            this.animatePageLoad();
            this.updateSystemTime(); // Initial call
            setInterval(() => this.updateSystemTime(), 1000); // Update every second
        } catch (error) {
            console.error('初始化失败:', error);
            this.showErrorMessage('无法连接到服务器，请检查网络连接');
        }
    }

    updateSystemTime() {
        const systemTimeElement = document.getElementById('systemTime');
        if (systemTimeElement) {
            const now = new Date();
            const options = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            };
            systemTimeElement.textContent = now.toLocaleString('zh-CN', options);
        }
    }
    
    async checkApiConnection() {
        try {
            const response = await fetch(`${this.apiBaseUrl.replace('/api/v1', '')}/health`);
            if (!response.ok) {
                throw new Error('API连接失败');
            }
            console.log('API连接成功');
        } catch (error) {
            console.error('API连接失败:', error);
            throw error;
        }
    }
    
    async loadInitialData() {
        try {
            // 加载统计数据
            await this.loadStatistics();
            
            // 加载留言列表
            await this.loadMessages();
            
            // 渲染界面
            this.renderTable();
            this.renderMobileCards();
            this.renderPagination();
        } catch (error) {
            console.error('加载初始数据失败:', error);
            throw error;
        }
    }
    
    async loadStatistics() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/messages/statistics/overview`);
            const result = await response.json();
            
            if (result.code === 200) {
                const stats = result.data;
                this.animateNumber('totalMessages', stats.total_messages || 0);
                this.animateNumber('todayMessages', stats.today_messages || 0);
                this.animateNumber('weekMessages', stats.week_messages || 0);
                this.animateNumber('activeUsers', stats.total_users || 0);
            }
        } catch (error) {
            console.error('加载统计数据失败:', error);
            // 使用模拟数据作为后备
            this.useMockStatistics();
        }
    }
    
    async loadMessages() {
        try {
            const params = new URLSearchParams({
                page: this.currentPage.toString(),
                page_size: this.itemsPerPage.toString(),
                sort_field: this.sortField,
                sort_direction: this.sortDirection
            });
            
            if (this.searchQuery) {
                params.append('query', this.searchQuery);
            }
            
            if (this.dateFilter && this.dateFilter !== 'all') {
                params.append('date_filter', this.dateFilter);
            }
            
            const response = await fetch(`${this.apiBaseUrl}/messages/?${params}`);
            const result = await response.json();
            
            if (result.code === 200) {
                const data = result.data;
                this.filteredMessages = data.items.map(item => ({
                    id: item.id,
                    email: item.email,
                    message: item.message,
                    timestamp: new Date(item.created_at),
                    status: item.status
                }));
                this.totalMessages = data.total;
                this.totalPages = data.total_pages;
            }
        } catch (error) {
            console.error('加载留言列表失败:', error);
            // 使用模拟数据作为后备
            this.useMockData();
        }
    }
    
    useMockData() {
        // 当API不可用时使用模拟数据
        const sampleMessages = [
            { id: 1, email: "zhang.wei@email.com", message: "您好，我对贵公司的产品很感兴趣，想了解更多详细信息。", timestamp: new Date(), status: "read" },
            { id: 2, email: "li.ming@company.com", message: "技术支持团队非常专业，问题得到了快速解决，感谢！", timestamp: new Date(), status: "read" },
            { id: 3, email: "wang.fang@tech.com", message: "建议增加更多个性化设置选项，提升用户体验。", timestamp: new Date(), status: "unread" },
            { id: 4, email: "chen.gang@business.com", message: "网站加载速度有些慢，希望能优化一下性能。", timestamp: new Date(), status: "read" },
            { id: 5, email: "liu.ying@service.com", message: "客服人员态度很好，耐心解答了我的所有疑问。", timestamp: new Date(), status: "unread" }
        ];
        
        this.filteredMessages = sampleMessages;
        this.totalMessages = sampleMessages.length;
        this.totalPages = Math.ceil(this.totalMessages / this.itemsPerPage);
    }
    
    useMockStatistics() {
        this.animateNumber('totalMessages', 50);
        this.animateNumber('todayMessages', 5);
        this.animateNumber('weekMessages', 15);
        this.animateNumber('activeUsers', 25);
    }
    
    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const dateFilter = document.getElementById('dateFilter');
        const clearFilter = document.getElementById('clearFilter');
        const modal = document.getElementById('messageModal');
        const closeModalBtn = document.getElementById('closeModal');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.debouncedApplyFilters();
            });
        }
        
        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                this.dateFilter = e.target.value;
                this.applyFilters();
            });
        }
        
        if (clearFilter) {
            clearFilter.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }

        if (modal && closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.closeMessageModal());
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeMessageModal();
                }
            });
        }
    }

    openMessageModal(message) {
        const modal = document.getElementById('messageModal');
        const modalContent = document.getElementById('modalMessageContent');
        if (modal && modalContent) {
            modalContent.textContent = message;
            modal.classList.remove('hidden');
        }
    }

    closeMessageModal() {
        const modal = document.getElementById('messageModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    async applyFilters() {
        this.currentPage = 1;
        await this.loadMessages();
        this.renderTable();
        this.renderMobileCards();
        this.renderPagination();
    }
    
    clearAllFilters() {
        const searchInput = document.getElementById('searchInput');
        const dateFilter = document.getElementById('dateFilter');
        
        if (searchInput) searchInput.value = '';
        if (dateFilter) dateFilter.value = 'all';
        
        this.searchQuery = '';
        this.dateFilter = 'all';
        this.applyFilters();
    }
    
    async sortTable(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        
        this.updateSortIcons(field);
        await this.loadMessages();
        this.renderTable();
        this.renderMobileCards();
    }
    
    updateSortIcons(activeField) {
        document.querySelectorAll('.sort-icon').forEach(icon => {
            icon.classList.remove('active');
            icon.style.transform = 'rotate(0deg)';
        });
        
        const activeIcon = document.getElementById(`sort-${activeField}`);
        if (activeIcon) {
            activeIcon.classList.add('active');
            if (this.sortDirection === 'desc') {
                activeIcon.style.transform = 'rotate(180deg)';
            }
        }
    }
    
    renderMobileCards() {
        const cardsContainer = document.getElementById('messageCards');
        if (!cardsContainer) return;

        cardsContainer.innerHTML = '';

        if (this.filteredMessages.length === 0) {
            cardsContainer.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <div class="flex flex-col items-center">
                        <svg class="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        <h3 class="text-xl font-semibold">没有找到匹配的留言</h3>
                        <p class="text-sm">请尝试调整您的搜索或筛选条件。</p>
                    </div>
                </div>
            `;
            return;
        }

        this.filteredMessages.forEach((message, index) => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-lg p-4 shadow-sm border border-gray-200 loading-animation';

            const formattedDate = new Date(message.timestamp).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

            const statusIndicator = message.status === 'unread' 
                ? '<span class="w-2 h-2 bg-blue-500 rounded-full" title="未读"></span>'
                : '<span class="w-2 h-2 bg-gray-300 rounded-full" title="已读"></span>';

            card.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center space-x-2">
                        ${statusIndicator}
                        <span class="text-sm font-medium text-gray-900">#${message.id}</span>
                    </div>
                    <span class="text-xs text-gray-500">${formattedDate}</span>
                </div>
                <div class="flex items-center space-x-2 mb-3">
                    <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                    </svg>
                    <span class="text-sm text-gray-700">${message.email}</span>
                </div>
                <p class="text-sm text-gray-600 leading-relaxed mb-4 whitespace-nowrap overflow-hidden text-ellipsis" title="${message.message}">${message.message}</p>
                <div class="flex justify-end space-x-3 border-t pt-3">
                    <button class="mark-as-read-btn text-sm font-medium ${message.status === 'read' ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-900'}" ${message.status === 'read' ? 'disabled' : ''}>
                        ${message.status === 'read' ? '已读' : '标记已读'}
                    </button>
                    <button class="delete-btn text-sm font-medium text-red-600 hover:text-red-900">删除</button>
                </div>
            `;

            const deleteButton = card.querySelector('.delete-btn');
            if (deleteButton) {
                deleteButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteMessage(message.id);
                });
            }

            const markAsReadButton = card.querySelector('.mark-as-read-btn');
            if (markAsReadButton && message.status === 'unread') {
                markAsReadButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.markAsRead(message.id);
                });
            }
            
            card.addEventListener('click', () => this.openMessageModal(message.message));

            cardsContainer.appendChild(card);

            setTimeout(() => {
                card.classList.add('fade-in');
            }, index * 50);
        });
    }

    renderTable() {
        const tbody = document.getElementById('messageTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        if (this.filteredMessages.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="5" class="text-center py-12 text-gray-500">
                    <div class="flex flex-col items-center">
                        <svg class="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        <h3 class="text-xl font-semibold">没有找到匹配的留言</h3>
                        <p class="text-sm">请尝试调整您的搜索或筛选条件。</p>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
            return;
        }
        
        this.filteredMessages.forEach((message, index) => {
            const row = document.createElement('tr');
            row.className = 'table-row loading-animation';
            
            const formattedDate = new Date(message.timestamp).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

            const statusIndicator = message.status === 'unread' 
                ? '<span class="w-3 h-3 bg-blue-500 rounded-full inline-block" title="未读"></span>'
                : '<span class="w-3 h-3 bg-gray-300 rounded-full inline-block" title="已读"></span>';
            
            row.innerHTML = `
                <td class="px-6 py-4 text-sm font-medium text-gray-900">${message.id}</td>
                <td class="px-6 py-4 text-sm text-gray-700">
                    <div class="flex items-center space-x-3">
                        ${statusIndicator}
                        <span>${message.email}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-700">
                    <div class="message-content cursor-pointer" title="${message.message}">${message.message}</div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">${formattedDate}</td>
                <td class="px-6 py-4 text-sm font-medium">
                    <button class="mark-as-read-btn mr-4 ${message.status === 'read' ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-900'}" ${message.status === 'read' ? 'disabled' : ''}>
                        ${message.status === 'read' ? '已读' : '标记已读'}
                    </button>
                    <button class="delete-btn text-red-600 hover:text-red-900">删除</button>
                </td>
            `;

            const messageCell = row.querySelector('.message-content');
            if (messageCell) {
                messageCell.addEventListener('click', () => this.openMessageModal(message.message));
            }

            const deleteButton = row.querySelector('.delete-btn');
            if (deleteButton) {
                deleteButton.addEventListener('click', () => this.deleteMessage(message.id));
            }

            const markAsReadButton = row.querySelector('.mark-as-read-btn');
            if (markAsReadButton && message.status === 'unread') {
                markAsReadButton.addEventListener('click', () => this.markAsRead(message.id));
            }
            
            tbody.appendChild(row);
            
            setTimeout(() => {
                row.classList.add('fade-in');
            }, index * 50);
        });
    }

    async markAsRead(messageId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/messages/${messageId}/read`, {
                method: 'PATCH',
            });

            const result = await response.json();

            if (result.code === 200) {
                this.showSuccessMessage(result.message || '标记成功');
                await this.loadInitialData();
            } else {
                throw new Error(result.detail || '标记失败');
            }
        } catch (error) {
            console.error('标记已读失败:', error);
            this.showErrorMessage(error.message);
        }
    }

    async deleteMessage(messageId) {
        if (!confirm(`您确定要删除留言 #${messageId} 吗？此操作不可撤销。`)) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/messages/${messageId}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.code === 200) {
                this.showSuccessMessage(result.message || '留言删除成功');
                await this.loadInitialData();
            } else {
                throw new Error(result.detail || '删除失败');
            }
        } catch (error) {
            console.error('删除留言失败:', error);
            this.showErrorMessage(error.message);
        }
    }
    
    renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;
        
        pagination.innerHTML = '';
        
        // 上一页按钮
        const prevBtn = document.createElement('button');
        prevBtn.className = `pagination-btn px-4 py-2 rounded-lg ${this.currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`;
        prevBtn.innerHTML = '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.goToPage(this.currentPage - 1);
            }
        });
        pagination.appendChild(prevBtn);
        
        // 页码按钮
        for (let i = 1; i <= this.totalPages; i++) {
            if (i === 1 || i === this.totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                const pageBtn = document.createElement('button');
                pageBtn.className = `pagination-btn px-4 py-2 rounded-lg ${i === this.currentPage ? 'active' : ''}`;
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', () => {
                    this.goToPage(i);
                });
                pagination.appendChild(pageBtn);
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'px-2 text-gray-500';
                ellipsis.textContent = '...';
                pagination.appendChild(ellipsis);
            }
        }
        
        // 下一页按钮
        const nextBtn = document.createElement('button');
        nextBtn.className = `pagination-btn px-4 py-2 rounded-lg ${this.currentPage >= this.totalPages ? 'opacity-50 cursor-not-allowed' : ''}`;
        nextBtn.innerHTML = '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>';
        nextBtn.disabled = this.currentPage >= this.totalPages;
        nextBtn.addEventListener('click', () => {
            if (this.currentPage < this.totalPages) {
                this.goToPage(this.currentPage + 1);
            }
        });
        pagination.appendChild(nextBtn);
    }
    
    async goToPage(page) {
        this.currentPage = page;
        await this.loadMessages();
        this.renderTable();
        this.renderMobileCards();
        this.renderPagination();
        
        // 滚动到表格或卡片顶部
        const isMobile = window.innerWidth <= 480;
        const scrollTarget = isMobile 
            ? document.querySelector('.mobile-cards') 
            : document.querySelector('.message-table');

        if (scrollTarget) {
            scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    animateNumber(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const startValue = 0;
        const duration = 1000;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
            element.textContent = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    animatePageLoad() {
        // 统计卡片动画
        anime({
            targets: '.stats-card',
            translateY: [50, 0],
            opacity: [0, 1],
            delay: anime.stagger(100),
            duration: 800,
            easing: 'easeOutExpo'
        });
        
        // 表格动画
        anime({
            targets: '.message-table',
            translateY: [30, 0],
            opacity: [0, 1],
            delay: 400,
            duration: 600,
            easing: 'easeOutExpo'
        });
    }
    
    showErrorMessage(message) {
        // 显示错误消息
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
    
    showSuccessMessage(message) {
        // 显示成功消息
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successDiv.textContent = message;
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
}

// 全局函数
function sortTable(field) {
    if (window.messageManager) {
        window.messageManager.sortTable(field);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.messageManager = new MessageManagerAPI();
});