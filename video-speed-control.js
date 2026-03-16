// ==UserScript==
// @name         视频倍速播放控制
// @namespace    https://github.com/cmilycanran
// @version      1.7.2
// @description  视频倍速循环播放控制，支持快捷键切换和自定义倍速列表
// @icon        data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%234FC3F7"><path d="M8 5v14l11-7z"/></svg>
// @license      MIT
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // ==================== 常量定义 ====================
    const CONSTANTS = {
        PREFIX: 'vss_',
        DEFAULT_SPEEDS: [1, 1.25, 1.5, 1.75, 2, 2.5, 3],
        KEY_TOGGLE: '`',
        FADE_DELAY: 5000,
        FADE_TIMEOUT: 300,
        NOTIFICATION_DURATION: 1500,
        CHECK_INTERVAL_DEFAULT: 5000,
        PAUSE_FADE_DELAY_DEFAULT: 3000
    };

    const PREFIX = CONSTANTS.PREFIX;
    const DEFAULT_SPEEDS = CONSTANTS.DEFAULT_SPEEDS;
    const KEY_TOGGLE = CONSTANTS.KEY_TOGGLE;

    // SVG 图标定义
    // @icon source: https://fonts.google.com/icons
    const Icons = {
        settings: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>',
        lock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>',
        lockSmall: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>',
        unlock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"/></svg>',
        add: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>',
        delete: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>',
        close: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'
    };

    // ==================== 工具函数 ====================
    function showNotification(message) {
        const existing = document.querySelector('.vss-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = 'vss-notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('vss-notification-fadeout');
            setTimeout(() => notification.remove(), CONSTANTS.FADE_TIMEOUT);
        }, CONSTANTS.NOTIFICATION_DURATION);
    }

    // ==================== Fade 管理器 ====================
    class FadeManager {
        constructor(configManager) {
            this.configManager = configManager;
            this.fadeTimer = null;
            this.pauseFadeTimer = null;
            this.indicator = null;
            this.isHovering = false;
            this.isPanelOpen = false;
        }

        setIndicator(indicator) {
            this.indicator = indicator;
        }

        setPanelState(isOpen) {
            this.isPanelOpen = isOpen;
        }

        setHoverState(isHovering) {
            this.isHovering = isHovering;
        }

        fadeIn() {
            if (!this.indicator) return;
            this.indicator.style.display = 'flex';
            this.indicator.offsetHeight;
            this.indicator.style.opacity = '1';
            this.indicator.style.pointerEvents = 'auto';
        }

        fadeOut() {
            if (!this.indicator) return;
            this.indicator.style.opacity = '0';
            this.indicator.style.pointerEvents = 'none';
        }

        startFadeTimer(delay) {
            if (!this.configManager.isAutoFade()) return;

            this.clearFadeTimer();
            if (this.isHovering || this.isPanelOpen) return;
            
            // 如果没有传入参数，使用配置中的值
            const actualDelay = delay !== undefined ? delay : this.configManager.getFadeDelay();

            this.fadeTimer = setTimeout(() => {
                if (!this.isHovering && !this.isPanelOpen) {
                    this.fadeOut();
                }
            }, actualDelay);
        }

        clearFadeTimer() {
            if (this.fadeTimer) {
                clearTimeout(this.fadeTimer);
                this.fadeTimer = null;
            }
        }

        startPauseFadeTimer(delay = this.configManager.getPauseFadeDelay()) {
            this.clearPauseFadeTimer();
            this.pauseFadeTimer = setTimeout(() => {
                this.fadeOut();
            }, delay);
        }

        clearPauseFadeTimer() {
            if (this.pauseFadeTimer) {
                clearTimeout(this.pauseFadeTimer);
                this.pauseFadeTimer = null;
            }
        }
    }

    // ==================== 配置管理 ====================
    class ConfigManager {
        constructor() {
            const get = (key, defaultValue, transform = v => v) => {
                const value = GM_getValue(PREFIX + key, defaultValue);
                return transform(value);
            };

            this.config = {
                speedList: get('speedList', JSON.stringify(DEFAULT_SPEEDS), v => JSON.parse(v)),
                currentIndex: get('currentIndex', '0', v => parseInt(v)),
                isLocked: get('isLocked', false),
                autoCheck: get('autoCheck', true),
                checkInterval: get('checkInterval', String(CONSTANTS.CHECK_INTERVAL_DEFAULT), v => parseInt(v)),
                autoFade: get('autoFade', true),
                fadeDelay: get('fadeDelay', String(CONSTANTS.FADE_DELAY), v => parseInt(v)),
                initVisible: get('initVisible', true),
                showOnPause: get('showOnPause', false),
                pauseFade: get('pauseFade', false),
                pauseFadeDelay: get('pauseFadeDelay', String(CONSTANTS.PAUSE_FADE_DELAY_DEFAULT), v => parseInt(v)),
                enableControlBar: get('enableControlBar', true)
            };
        }

        getSpeedList() {
            return this.config.speedList;
        }

        getCurrentIndex() {
            return this.config.currentIndex;
        }

        getCurrentSpeed() {
            const list = this.getSpeedList();
            return list[this.config.currentIndex] || 1;
        }

        isLocked() {
            return this.config.isLocked;
        }

        isAutoCheck() {
            return this.config.autoCheck;
        }

        getCheckInterval() {
            return this.config.checkInterval;
        }

        isAutoFade() {
            return this.config.autoFade;
        }

        getFadeDelay() {
            return this.config.fadeDelay;
        }

        setFadeDelay(delay) {
            this.config.fadeDelay = delay;
            GM_setValue(PREFIX + 'fadeDelay', delay);
        }

        isInitVisible() {
            return this.config.initVisible;
        }

        isShowOnPause() {
            return this.config.showOnPause;
        }

        isPauseFade() {
            return this.config.pauseFade;
        }

        getPauseFadeDelay() {
            return this.config.pauseFadeDelay;
        }

        setSpeedList(list) {
            this.config.speedList = list;
            GM_setValue(PREFIX + 'speedList', JSON.stringify(list));
        }

        setCurrentIndex(index) {
            this.config.currentIndex = index;
            GM_setValue(PREFIX + 'currentIndex', index);
        }

        nextSpeed() {
            const list = this.getSpeedList();
            if (list.length === 0) return 1;
            this.config.currentIndex = (this.config.currentIndex + 1) % list.length;
            GM_setValue(PREFIX + 'currentIndex', this.config.currentIndex);
            return list[this.config.currentIndex];
        }

        setLocked(locked) {
            this.config.isLocked = locked;
            GM_setValue(PREFIX + 'isLocked', locked);
        }

        setAutoCheck(enabled) {
            this.config.autoCheck = enabled;
            GM_setValue(PREFIX + 'autoCheck', enabled);
        }

        setCheckInterval(interval) {
            this.config.checkInterval = interval;
            GM_setValue(PREFIX + 'checkInterval', interval);
        }

        setAutoFade(enabled) {
            this.config.autoFade = enabled;
            GM_setValue(PREFIX + 'autoFade', enabled);
        }

        setInitVisible(enabled) {
            this.config.initVisible = enabled;
            GM_setValue(PREFIX + 'initVisible', enabled);
        }

        setShowOnPause(enabled) {
            this.config.showOnPause = enabled;
            GM_setValue(PREFIX + 'showOnPause', enabled);
        }

        setPauseFade(enabled) {
            this.config.pauseFade = enabled;
            GM_setValue(PREFIX + 'pauseFade', enabled);
        }

        setPauseFadeDelay(delay) {
            this.config.pauseFadeDelay = delay;
            GM_setValue(PREFIX + 'pauseFadeDelay', delay);
        }

        isEnableControlBar() {
            return this.config.enableControlBar;
        }

        setEnableControlBar(enabled) {
            this.config.enableControlBar = enabled;
            GM_setValue(PREFIX + 'enableControlBar', enabled);
        }
    }

    // ==================== 视频控制器 ====================
    class SpeedController {
        constructor(configManager, speedUI) {
            this.configManager = configManager;
            this.speedUI = speedUI;
            this.hijacked = false;
            this._originalDescriptors = {};
            this._shadowDomList = [];
        }

        // 破解 Shadow DOM（支持百度网盘等 closed 模式）
        hackAttachShadow() {
            if (window._vss_shadowHack_) return;
            window._vss_shadowHack_ = true;

            const original = Element.prototype.attachShadow;
            if (!original) return;

            const controller = this;

            // 扫描已存在的 Shadow DOM
            const scanExistingShadowRoots = () => {
                const scan = (root) => {
                    if (!root || controller._shadowDomList.includes(root)) return;
                    controller._shadowDomList.push(root);
                    root.querySelectorAll('*').forEach(el => {
                        if (el.shadowRoot) scan(el.shadowRoot);
                    });
                };
                document.querySelectorAll('*').forEach(el => {
                    if (el.shadowRoot) scan(el.shadowRoot);
                });
            };
            scanExistingShadowRoots();

            Element.prototype.attachShadow = function(options) {
                const config = options ? { ...options } : {};
                const isClosed = config.mode === 'closed';
                
                if (config.mode) {
                    config.mode = 'open';
                }

                const shadowRoot = original.call(this, config);

                controller._shadowDomList.push(shadowRoot);

                if (isClosed) {
                    Object.defineProperty(this, 'shadowRoot', {
                        get: function() { return null; }
                    });
                }

                try {
                    document.dispatchEvent(new CustomEvent('vss-shadow-root-created', {
                        bubbles: true,
                        cancelable: true,
                        detail: { shadowRoot: shadowRoot }
                    }));
                } catch (e) {}

                return shadowRoot;
            };
        }

        // 获取所有视频元素（支持普通DOM和Shadow DOM）
        getAllVideos() {
            const videos = [];
            const visitedRoots = new Set();

            // 普通 DOM 中的视频
            document.querySelectorAll('video').forEach(v => videos.push(v));

            // 遍历所有带 shadowRoot 的元素
            const getShadowVideos = (root) => {
                if (!root || !root.querySelectorAll || visitedRoots.has(root)) return;
                visitedRoots.add(root);
                
                root.querySelectorAll('video').forEach(v => videos.push(v));
                root.querySelectorAll('*').forEach(el => {
                    if (el.shadowRoot) getShadowVideos(el.shadowRoot);
                });
            };

            // 扫描页面中所有 Shadow DOM
            document.querySelectorAll('*').forEach(el => {
                if (el.shadowRoot) getShadowVideos(el.shadowRoot);
            });

            return videos;
        }

        getActivePlayer() {
            const videos = this.getAllVideos();
            let activeVideo = null;
            for (const video of videos) {
                if (video.offsetParent !== null && video.readyState > 0) {
                    activeVideo = video;
                    break;
                }
            }
            if (!activeVideo && videos.length > 0) {
                activeVideo = videos[0];
            }
            return activeVideo;
        }

        // 劫持 playbackRate 属性
        hijackPlaybackRate() {
            if (this.hijacked) return;
            this.hijacked = true;

            const self = this;
            const proto = HTMLMediaElement.prototype;

            // 获取原始属性描述符
            const descriptor = Object.getOwnPropertyDescriptor(proto, 'playbackRate');
            if (!descriptor) return;

            // 保存原始 getter/setter
            this._originalDescriptors = {
                get: descriptor.get,
                set: descriptor.set
            };

            // 劫持 prototype 的 playbackRate
            Object.defineProperty(proto, 'playbackRate', {
                get: function () {
                    // 如果锁定中，返回当前锁定的倍速
                    if (self.configManager.isLocked()) {
                        return self.configManager.getCurrentSpeed();
                    }
                    // 未锁定时调用原始 getter
                    return self._originalDescriptors.get.call(this);
                },
                set: function (value) {
                    // 如果锁定中，忽略 setter
                    if (self.configManager.isLocked()) {
                        return;
                    }
                    // 未锁定时调用原始 setter
                    return self._originalDescriptors.set.call(this, value);
                },
                configurable: true,
                enumerable: true
            });
        }

        setPlaybackRate(rate, skipLock = false) {
            const video = this.getActivePlayer();
            if (!video) return false;

            if (!skipLock && this.configManager.isLocked()) {
                showNotification('倍速已被锁定');
                return false;
            }

            try {
                video.playbackRate = rate;
                return true;
            } catch (e) {
                return false;
            }
        }

        applyCurrentSpeed() {
            if (!this.configManager.isLocked()) return;
            const speed = this.configManager.getCurrentSpeed();
            this.setPlaybackRate(speed, true);
        }

        toggleLock() {
            const newState = !this.configManager.isLocked();
            this.configManager.setLocked(newState);
            if (newState) {
                this.applyCurrentSpeed();
                showNotification(`已锁定倍速: ${this.configManager.getCurrentSpeed()}x`);
            } else {
                showNotification('已解除倍速锁定');
            }
            return newState;
        }

        bindVideoPauseEvents() {
            const self = this;
            this.getAllVideos().forEach(video => this.bindVideoPauseEventToVideo(video));
        }

        bindVideoPauseEventToVideo(video) {
            if (video._vss_pauseBound) return;
            video._vss_pauseBound = true;

            const self = this;
            video.addEventListener('pause', () => {
                if (self.configManager.isShowOnPause()) {
                    self.speedUI.fadeIn();
                    self.speedUI.clearFadeTimer();
                    
                    // 如果开启了暂停时隐退，则在指定时间后隐退
                    if (self.configManager.isPauseFade()) {
                        self.speedUI.fadeManager.startPauseFadeTimer();
                    }
                }
            });

            video.addEventListener('play', () => {
                // 清除暂停隐退计时器
                self.speedUI.fadeManager.clearPauseFadeTimer();
                
                if (self.configManager.isAutoFade() && self.configManager.isShowOnPause()) {
                    self.speedUI.startFadeTimer();
                }
            });
        }
    }

    // ==================== UI管理 ====================
    class SpeedUI {
        constructor(configManager, speedController) {
            this.configManager = configManager;
            this.speedController = speedController;
            this.indicator = null;
            this.settingsPanel = null;
            this.isPanelOpen = false;
            this.isHovering = false;
            this.fadeManager = new FadeManager(configManager);
        }

        init() {
            this.createIndicator();
            this.bindEvents();
            this.fadeManager.setIndicator(this.indicator);

            if (this.configManager.isAutoFade() && !this.configManager.isInitVisible()) {
                this.fadeManager.fadeOut();
            } else if (this.configManager.isAutoFade()) {
                this.fadeManager.startFadeTimer();
            }
        }

        createIndicator() {
            this.indicator = document.createElement('div');
            this.indicator.className = 'vss-indicator';
            this.indicator.innerHTML = `
                <span class="vss-indicator-btn vss-indicator-prev" title="减速">-</span>
                <span class="vss-indicator-speed">${this.configManager.getCurrentSpeed()}x</span>
                <span class="vss-indicator-btn vss-indicator-next" title="加速">+</span>
                <span class="vss-indicator-lock ${this.configManager.isLocked() ? 'active' : ''}" title="${this.configManager.isLocked() ? '已锁定' : '未锁定'}">
                    ${this.configManager.isLocked() ? Icons.lock : ''}
                </span>
            `;
            document.body.appendChild(this.indicator);
            this._bindIndicatorEvents();
            this.updateIndicatorPosition();
        }

        _bindIndicatorEvents() {
            if (!this.indicator) return;

            // 鼠标悬停时显示
            this.indicator.addEventListener('mouseenter', () => {
                this.isHovering = true;
                this.fadeManager.setHoverState(true);
                this.fadeManager.clearFadeTimer();
                this.fadeManager.fadeIn();
            });

            // 鼠标移开时启动渐隐计时器
            this.indicator.addEventListener('mouseleave', () => {
                this.isHovering = false;
                this.fadeManager.setHoverState(false);
                this.fadeManager.startFadeTimer();
            });

            // 减速按钮
            this.indicator.querySelector('.vss-indicator-prev').addEventListener('click', (e) => {
                e.stopPropagation();
                this._adjustSpeed(-1);
            });

            // 加速按钮
            this.indicator.querySelector('.vss-indicator-next').addEventListener('click', (e) => {
                e.stopPropagation();
                this._adjustSpeed(1);
            });

            // 锁定按钮点击切换锁定状态
            this.indicator.querySelector('.vss-indicator-lock').addEventListener('click', (e) => {
                e.stopPropagation();
                this.speedController.toggleLock();
                this.updateIndicator();
                if (this.isPanelOpen) {
                    this.refreshPanel();
                }
            });

            // 启动初始渐隐计时器
            this.fadeManager.startFadeTimer();
        }

        // 渐隐功能委托给 FadeManager
        fadeIn() { return this.fadeManager.fadeIn(); }
        fadeOut() { return this.fadeManager.fadeOut(); }
        startFadeTimer(delay) { return this.fadeManager.startFadeTimer(delay); }
        clearFadeTimer() { return this.fadeManager.clearFadeTimer(); }

        _adjustSpeed(direction) {
            // direction: -1 减速, 1 加速
            const list = this.configManager.getSpeedList();
            const currentIndex = this.configManager.getCurrentIndex();
            let newIndex = currentIndex + direction;

            if (newIndex < 0) newIndex = list.length - 1;
            if (newIndex >= list.length) newIndex = 0;

            this.configManager.setCurrentIndex(newIndex);
            const newSpeed = list[newIndex];
            this.speedController.setPlaybackRate(newSpeed);
            this.updateIndicator();

            // 点击按钮时让按钮显现并重置渐隐计时器
            this.clearFadeTimer();
            this.fadeIn();
            this.startFadeTimer();

            if (this.isPanelOpen) {
                this.refreshPanel();
            }
        }

        updateIndicatorPosition() {
            if (!this.indicator) return;
            this.indicator.style.top = '10px';
            this.indicator.style.left = '10px';
        }

        updateIndicator() {
            if (!this.indicator) return;
            const speed = this.configManager.getCurrentSpeed();
            const isLocked = this.configManager.isLocked();

            this.indicator.querySelector('.vss-indicator-speed').textContent = `${speed}x`;
            const lockIcon = this.indicator.querySelector('.vss-indicator-lock');
            lockIcon.innerHTML = isLocked ? Icons.lock : '';
            lockIcon.classList.toggle('active', isLocked);
        }

        createSettingsPanel() {
            if (this.settingsPanel) return;

            this.settingsPanel = document.createElement('div');
            this.settingsPanel.className = 'vss-settings-panel';
            this.settingsPanel.innerHTML = this._getSettingsPanelHTML();
            document.body.appendChild(this.settingsPanel);

            this._bindSettingsPanelEvents();
        }

        _getSettingsPanelHTML() {
            const speedList = this.configManager.getSpeedList();
            const isLocked = this.configManager.isLocked();

            return `
                <div class="vss-settings-header">
                    <span>倍速播放设置</span>
                    <button class="vss-settings-close">${Icons.close}</button>
                </div>
                <div class="vss-settings-content">
                    <div class="vss-settings-section">
                        <div class="vss-settings-row">
                            <label>当前倍速: <strong>${this.configManager.getCurrentSpeed()}x</strong></label>
                        </div>
                        <div class="vss-settings-row">
                            <button class="vss-btn vss-btn-primary" id="vss-apply-speed">应用当前倍速</button>
                        </div>
                        <div class="vss-settings-row">
                            <button class="vss-btn ${isLocked ? 'vss-btn-warning' : 'vss-btn-secondary'}" id="vss-toggle-lock">
                                ${isLocked ? Icons.lock + ' 解除锁定' : Icons.unlock + ' 锁定倍速'}
                            </button>
                        </div>
                    </div>
                    <div class="vss-settings-section">
                        <div class="vss-settings-row">
                            <label>倍速列表（逗号分隔）:</label>
                            <input type="text" id="vss-speed-input" value="${speedList.join(', ')}">
                        </div>
                        <div class="vss-settings-row vss-settings-row-buttons">
                            <button class="vss-btn vss-btn-primary" id="vss-save-speeds">保存列表</button>
                            <button class="vss-btn vss-btn-secondary" id="vss-reset-speeds">恢复默认</button>
                        </div>
                    </div>
                    <div class="vss-settings-section">
                        <div class="vss-settings-row">
                            <label>
                                <input type="checkbox" id="vss-auto-check" ${this.configManager.isAutoCheck() ? 'checked' : ''}>
                                开启自动检查倍速
                            </label>
                        </div>
                        <div class="vss-settings-row">
                            <label>检查间隔（毫秒）:</label>
                            <input type="number" id="vss-check-interval" value="${this.configManager.getCheckInterval()}" min="1000" max="60000" step="1000">
                        </div>
                        <div class="vss-settings-row vss-settings-row-buttons">
                            <button class="vss-btn vss-btn-primary" id="vss-save-auto-check">保存设置</button>
                        </div>
                    </div>
                    <div class="vss-settings-section">
                        <div class="vss-settings-row">
                            <label>
                                <input type="checkbox" id="vss-auto-fade" ${this.configManager.isAutoFade() ? 'checked' : ''}>
                                开启自动隐退
                            </label>
                        </div>
                        <div class="vss-settings-row vss-settings-row-indent" id="vss-fade-delay-row" style="display: ${this.configManager.isAutoFade() ? 'flex' : 'none'}">
                            <label>隐退时间（毫秒）:</label>
                            <input type="number" id="vss-fade-delay" value="${this.configManager.getFadeDelay()}" min="1000" max="30000" step="500">
                        </div>
                        <div class="vss-settings-row">
                            <label class="vss-init-visible-label">
                                <span class="vss-init-visible-icon">${!this.configManager.isAutoFade() ? Icons.lockSmall : ''}</span>
                                <input type="checkbox" id="vss-init-visible" ${!this.configManager.isAutoFade() ? 'disabled checked' : ''} ${this.configManager.isAutoFade() && this.configManager.isInitVisible() ? 'checked' : ''}>
                                载入时显示按钮
                            </label>
                        </div>
                        <div class="vss-settings-row">
                            <label class="vss-show-on-pause-label">
                                <span class="vss-show-on-pause-icon">${!this.configManager.isAutoFade() ? Icons.lockSmall : ''}</span>
                                <input type="checkbox" id="vss-show-on-pause" ${!this.configManager.isAutoFade() ? 'disabled' : ''} ${this.configManager.isAutoFade() && this.configManager.isShowOnPause() ? 'checked' : ''}>
                                暂停时显示按钮
                            </label>
                        </div>
                        <div class="vss-settings-row vss-settings-row-child">
                            <label class="vss-pause-fade-label">
                                <input type="checkbox" id="vss-pause-fade" ${!this.configManager.isAutoFade() || !this.configManager.isShowOnPause() ? 'disabled' : ''} ${this.configManager.isAutoFade() && this.configManager.isShowOnPause() && this.configManager.isPauseFade() ? 'checked' : ''}>
                                暂停时让按钮隐退
                            </label>
                        </div>
                        <div class="vss-settings-row vss-settings-row-child vss-settings-row-indent" id="vss-pause-fade-delay-row" style="display: ${this.configManager.isAutoFade() && this.configManager.isShowOnPause() && this.configManager.isPauseFade() ? 'flex' : 'none'}">
                            <label>隐退时间（毫秒）:</label>
                            <input type="number" id="vss-pause-fade-delay" value="${this.configManager.getPauseFadeDelay()}" min="500" max="30000" step="500">
                        </div>
                    </div>
                    <div class="vss-settings-section">
                        <div class="vss-settings-row">
                            <label>
                                <input type="checkbox" id="vss-enable-control-bar" ${this.configManager.isEnableControlBar() ? 'checked' : ''}>
                                启用视频控制栏倍速按钮
                            </label>
                        </div>
                    </div>
                    <div class="vss-settings-section">
                        <div class="vss-settings-row">
                            <label>快捷键说明:</label>
                            <div class="vss-help-text">
                                <p><kbd>~</kbd> 循环切换倍速</p>
                                <p><kbd>Esc</kbd> 关闭设置面板</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        _bindSettingsPanelEvents() {
            const panel = this.settingsPanel;

            panel.querySelector('.vss-settings-close').addEventListener('click', () => {
                this.closeSettingsPanel();
            });

            panel.querySelector('#vss-apply-speed').addEventListener('click', () => {
                const speed = this.configManager.getCurrentSpeed();
                this.speedController.setPlaybackRate(speed);
                showNotification(`已应用倍速: ${speed}x`);
            });

            panel.querySelector('#vss-toggle-lock').addEventListener('click', () => {
                const newState = this.speedController.toggleLock();
                this.updateIndicator();
                this.refreshPanel();
            });

            panel.querySelector('#vss-save-speeds').addEventListener('click', () => {
                const input = panel.querySelector('#vss-speed-input');
                const speeds = input.value.split(',')
                    .map(s => parseFloat(s.trim()))
                    .filter(s => !isNaN(s) && s > 0);

                if (speeds.length === 0) {
                    showNotification('请输入有效的倍速值');
                    return;
                }

                this.configManager.setSpeedList(speeds);
                this.configManager.setCurrentIndex(0);
                this.updateIndicator();
                this.refreshPanel();
                showNotification('倍速列表已保存');
            });

            panel.querySelector('#vss-reset-speeds').addEventListener('click', () => {
                this.configManager.setSpeedList([...DEFAULT_SPEEDS]);
                this.configManager.setCurrentIndex(0);
                this.updateIndicator();
                this.refreshPanel();
                showNotification('已恢复默认倍速列表');
            });

            // 保存自动检查设置
            panel.querySelector('#vss-save-auto-check').addEventListener('click', () => {
                const autoCheck = panel.querySelector('#vss-auto-check').checked;
                const interval = parseInt(panel.querySelector('#vss-check-interval').value);

                if (isNaN(interval) || interval < 1000 || interval > 60000) {
                    showNotification('检查间隔需在1000-60000毫秒之间');
                    return;
                }

                this.configManager.setAutoCheck(autoCheck);
                this.configManager.setCheckInterval(interval);

                // 通知 SpeedManager 更新定时器
                if (window._vss_manager_) {
                    window._vss_manager_.updateAutoCheck();
                }

                this.refreshPanel();
                showNotification('自动检查设置已保存');
            });

            // 保存自动隐退设置
            panel.querySelector('#vss-auto-fade').addEventListener('change', (e) => {
                this.configManager.setAutoFade(e.target.checked);
                if (e.target.checked) {
                    this.fadeIn();
                    if (this.configManager.isInitVisible()) {
                        this.startFadeTimer();
                    }
                } else {
                    this.clearFadeTimer();
                    this.fadeIn();
                }
                
                // 显示/隐藏全局隐退时间输入框
                const fadeDelayRow = panel.querySelector('#vss-fade-delay-row');
                if (fadeDelayRow) {
                    fadeDelayRow.style.display = e.target.checked ? 'flex' : 'none';
                }
                // 更新子开关状态
                const initVisible = panel.querySelector('#vss-init-visible');
                const showOnPause = panel.querySelector('#vss-show-on-pause');
                if (initVisible) initVisible.disabled = !e.target.checked;
                if (showOnPause) showOnPause.disabled = !e.target.checked;
                
                this.refreshPanel();
                showNotification(e.target.checked ? '已开启自动隐退' : '已关闭自动隐退');
            });

            // 保存全局隐退时间设置
            panel.querySelector('#vss-fade-delay').addEventListener('change', (e) => {
                const delay = parseInt(e.target.value);
                if (delay >= 1000 && delay <= 30000) {
                    this.configManager.setFadeDelay(delay);
                    showNotification('隐退时间已保存');
                } else {
                    showNotification('隐退时间需在1000-30000毫秒之间');
                }
            });

            // 保存载入显示设置
            panel.querySelector('#vss-init-visible').addEventListener('change', (e) => {
                this.configManager.setInitVisible(e.target.checked);
                if (e.target.checked) {
                    this.fadeIn();
                    if (this.configManager.isAutoFade()) {
                        this.startFadeTimer();
                    }
                } else {
                    this.clearFadeTimer();
                    this.fadeOut();
                }
                showNotification(e.target.checked ? '已开启载入时显示' : '已关闭载入时显示');
            });

            // 保存暂停时显示设置
            panel.querySelector('#vss-show-on-pause').addEventListener('change', (e) => {
                this.configManager.setShowOnPause(e.target.checked);
                
                // 更新子开关状态
                const pauseFadeCheckbox = panel.querySelector('#vss-pause-fade');
                const pauseFadeDelayRow = panel.querySelector('#vss-pause-fade-delay-row');
                if (pauseFadeCheckbox) {
                    pauseFadeCheckbox.disabled = !e.target.checked;
                    if (!e.target.checked) {
                        pauseFadeCheckbox.checked = false;
                    }
                }
                if (pauseFadeDelayRow) {
                    pauseFadeDelayRow.style.display = 'none';
                }
                
                showNotification(e.target.checked ? '已开启暂停时显示' : '已关闭暂停时显示');
            });

            // 保存暂停时隐退设置
            panel.querySelector('#vss-pause-fade').addEventListener('change', (e) => {
                this.configManager.setPauseFade(e.target.checked);
                
                // 显示/隐藏时间输入框
                const pauseFadeDelayRow = panel.querySelector('#vss-pause-fade-delay-row');
                if (pauseFadeDelayRow) {
                    pauseFadeDelayRow.style.display = e.target.checked ? 'flex' : 'none';
                }
                
                showNotification(e.target.checked ? '已开启暂停时隐退' : '已关闭暂停时隐退');
            });

            // 保存暂停时隐退时间设置
            panel.querySelector('#vss-pause-fade-delay').addEventListener('change', (e) => {
                const delay = parseInt(e.target.value);
                if (delay >= 500 && delay <= 30000) {
                    this.configManager.setPauseFadeDelay(delay);
                    showNotification('暂停隐退时间已保存');
                } else {
                    showNotification('隐退时间需在500-30000毫秒之间');
                }
            });

            // 控制栏按钮开关
            panel.querySelector('#vss-enable-control-bar').addEventListener('change', (e) => {
                this.configManager.setEnableControlBar(e.target.checked);
                
                // 通知 SpeedManager 更新控制栏注入器
                if (window._vss_manager_) {
                    window._vss_manager_.updateControlBarInjector();
                }
                
                showNotification(e.target.checked ? '已开启控制栏倍速按钮' : '已关闭控制栏倍速按钮');
            });

            panel.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        refreshPanel() {
            if (!this.settingsPanel) return;
            this.settingsPanel.innerHTML = this._getSettingsPanelHTML();
            this._bindSettingsPanelEvents();
        }

        openSettingsPanel() {
            this.createSettingsPanel();
            this.settingsPanel.classList.add('vss-settings-panel-open');
            this.isPanelOpen = true;
            this.fadeManager.setPanelState(true);
            this.fadeManager.clearFadeTimer();
            this.fadeManager.fadeIn();
        }

        closeSettingsPanel() {
            if (this.settingsPanel) {
                this.settingsPanel.classList.remove('vss-settings-panel-open');
                this.isPanelOpen = false;
                this.fadeManager.setPanelState(false);
            }
            // 关闭设置面板后重新启动渐隐计时器
            this.fadeManager.startFadeTimer();
        }

        toggleSettingsPanel() {
            if (this.isPanelOpen) {
                this.closeSettingsPanel();
            } else {
                this.openSettingsPanel();
            }
        }

        bindEvents() {
            if (this.indicator) {
                this.indicator.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleSettingsPanel();
                });
            }

            document.addEventListener('click', (e) => {
                if (this.isPanelOpen && this.settingsPanel && !this.settingsPanel.contains(e.target)) {
                    this.closeSettingsPanel();
                }
            });

            window.addEventListener('resize', () => {
                this.updateIndicatorPosition();
            }, { passive: true });
        }
    }

    // ==================== 视频控制栏注入器 ====================
    class VideoControlBarInjector {
        constructor(configManager, speedController, speedUI) {
            this.configManager = configManager;
            this.speedController = speedController;
            this.speedUI = speedUI;
            this.injectedVideos = new WeakSet();
            this.observers = [];
            this.enabled = configManager.isEnableControlBar();
        }

        init() {
            this._setupConfigSync();
            this._observeVideos();
        }

        setEnabled(enabled) {
            this.enabled = enabled;
            
            // 禁用时隐藏已注入的控件
            if (!enabled) {
                document.querySelectorAll('.vss-bar-controls').forEach(el => {
                    el.style.display = 'none';
                });
            } else {
                // 启用时显示控件
                document.querySelectorAll('.vss-bar-controls').forEach(el => {
                    el.style.display = '';
                });
            }
        }

        _setupConfigSync() {
            const originalSetSpeedList = this.configManager.setSpeedList.bind(this.configManager);
            this.configManager.setSpeedList = (list) => {
                originalSetSpeedList(list);
                this._refreshAllDropdowns();
            };

            const originalNextSpeed = this.configManager.nextSpeed.bind(this.configManager);
            this.configManager.nextSpeed = () => {
                const result = originalNextSpeed();
                this._updateAllButtons();
                return result;
            };

            const originalSetCurrentIndex = this.configManager.setCurrentIndex.bind(this.configManager);
            this.configManager.setCurrentIndex = (index) => {
                originalSetCurrentIndex(index);
                this._updateAllButtons();
            };

            const originalSetLocked = this.configManager.setLocked.bind(this.configManager);
            this.configManager.setLocked = (locked) => {
                originalSetLocked(locked);
                this._updateAllLockStates();
            };
        }

        _observeVideos() {
            const processVideo = (video) => {
                if (!this.enabled) return;
                if (!video || !(video instanceof HTMLVideoElement)) return;
                if (this.injectedVideos.has(video)) return;
                
                this.injectedVideos.add(video);
                this._createControl(video);
            };

            const checkAndInject = () => {
                document.querySelectorAll('video').forEach(processVideo);
                document.querySelectorAll('*').forEach(el => {
                    if (el.shadowRoot) {
                        el.shadowRoot.querySelectorAll('video').forEach(processVideo);
                    }
                });
            };

            checkAndInject();

            const observer = new MutationObserver(() => {
                checkAndInject();
            });

            this.observers.push(observer);

            if (document.body) {
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                });
            }

            document.addEventListener('vss-shadow-root-created', (e) => {
                const shadowRoot = e.detail?.shadowRoot;
                if (shadowRoot) {
                    shadowRoot.querySelectorAll('video').forEach(processVideo);
                }
            });

            window.addEventListener('beforeunload', () => {
                observer.disconnect();
            });
        }

        _createControl(video) {
            let container = video.parentElement;
            if (!container) return;

            let wrapper = container.closest('.vss-video-wrapper');
            if (!wrapper) {
                wrapper = document.createElement('div');
                wrapper.className = 'vss-video-wrapper';
                wrapper.style.cssText = 'position: relative; display: inline-block; max-width: 100%;';
                
                if (container.parentElement) {
                    container.parentElement.insertBefore(wrapper, container);
                    wrapper.appendChild(container);
                } else {
                    return;
                }
            }

            if (wrapper.querySelector('.vss-bar-controls')) return;

            const controls = document.createElement('div');
            controls.className = 'vss-bar-controls';
            controls.innerHTML = `
                <div class="vss-speed-dropdown">
                    <button class="vss-speed-btn">${this.configManager.getCurrentSpeed()}x</button>
                    <div class="vss-speed-menu">
                        ${this.configManager.getSpeedList().map(speed => `
                            <div class="vss-speed-option" data-speed="${speed}">${speed}x</div>
                        `).join('')}
                    </div>
                </div>
            `;

            wrapper.appendChild(controls);
            this._bindEvents(controls, video, wrapper);
            this._bindDropdownEvents(controls, video, wrapper);
        }

        _bindEvents(controls, video, wrapper) {
            const showControls = () => {
                controls.classList.add('vss-bar-visible');
            };

            const hideControls = () => {
                const menu = controls.querySelector('.vss-speed-menu');
                if (!menu.classList.contains('vss-speed-menu-open')) {
                    controls.classList.remove('vss-bar-visible');
                }
            };

            wrapper.addEventListener('mouseenter', showControls);
            wrapper.addEventListener('mouseleave', hideControls);
            video.addEventListener('mousemove', showControls);

            let hideTimer = null;
            video.addEventListener('mouseout', () => {
                hideTimer = setTimeout(hideControls, 1000);
            });
            video.addEventListener('mouseover', () => {
                if (hideTimer) clearTimeout(hideTimer);
            });

            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    controls.classList.add('vss-bar-visible');
                }
            });
        }

        _bindDropdownEvents(container, video, wrapper) {
            const btn = container.querySelector('.vss-speed-btn');
            const menu = container.querySelector('.vss-speed-menu');
            const options = menu.querySelectorAll('.vss-speed-option');
            let closeTimer = null;

            const closeMenuAndHide = () => {
                menu.classList.remove('vss-speed-menu-open');
                clearCloseTimer();
                if (!wrapper.matches(':hover') && !video.matches(':hover')) {
                    container.classList.remove('vss-bar-visible');
                }
            };

            const startCloseTimer = () => {
                this._clearCloseTimer();
                closeTimer = setTimeout(() => {
                    closeMenuAndHide();
                }, 5000);
            };

            const clearCloseTimer = () => {
                if (closeTimer) {
                    clearTimeout(closeTimer);
                    closeTimer = null;
                }
            };

            this._clearCloseTimer = clearCloseTimer;

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (menu.classList.contains('vss-speed-menu-open')) {
                    closeMenuAndHide();
                } else {
                    this._closeAllMenus();
                    menu.classList.add('vss-speed-menu-open');
                    startCloseTimer();
                }
            });

            options.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const speed = parseFloat(option.dataset.speed);
                    const index = this.configManager.getSpeedList().indexOf(speed);
                    this.configManager.setCurrentIndex(index);
                    this.speedController.setPlaybackRate(speed);
                    this._updateButtonText(btn);
                    this._updateOptionStates(menu);
                    closeMenuAndHide();
                });
                
                option.addEventListener('mouseenter', () => {
                    if (menu.classList.contains('vss-speed-menu-open')) {
                        startCloseTimer();
                    }
                });
            });

            btn.addEventListener('mouseenter', () => {
                if (menu.classList.contains('vss-speed-menu-open')) {
                    startCloseTimer();
                }
            });

            document.addEventListener('click', (e) => {
                if (!container.contains(e.target)) {
                    closeMenuAndHide();
                }
            });

            this._updateOptionStates(menu);
        }

        _updateButtonText(btn) {
            if (btn) {
                btn.textContent = `${this.configManager.getCurrentSpeed()}x`;
            }
        }

        _updateOptionStates(menu) {
            if (!menu) return;
            const currentSpeed = this.configManager.getCurrentSpeed();
            menu.querySelectorAll('.vss-speed-option').forEach(option => {
                const speed = parseFloat(option.dataset.speed);
                option.classList.toggle('active', speed === currentSpeed);
            });
        }

        _updateAllButtons() {
            document.querySelectorAll('.vss-speed-btn').forEach(btn => {
                this._updateButtonText(btn);
            });
            document.querySelectorAll('.vss-speed-menu').forEach(menu => {
                this._updateOptionStates(menu);
            });
        }

        _updateAllLockStates() {}

        _refreshAllDropdowns() {
            document.querySelectorAll('.vss-speed-dropdown').forEach(container => {
                const menu = container.querySelector('.vss-speed-menu');
                const btn = container.querySelector('.vss-speed-btn');
                if (menu && btn) {
                    menu.innerHTML = this.configManager.getSpeedList().map(speed => `
                        <div class="vss-speed-option" data-speed="${speed}">${speed}x</div>
                    `).join('');
                    
                    const video = this.speedController.getActivePlayer();
                    this._bindDropdownEvents(container, video);
                }
            });
        }

        _closeAllMenus() {
            document.querySelectorAll('.vss-speed-menu-open').forEach(menu => {
                menu.classList.remove('vss-speed-menu-open');
            });
        }
    }

    // ==================== 主控制器 ====================
    class SpeedManager {
        constructor() {
            this.configManager = new ConfigManager();
            this.speedUI = new SpeedUI(this.configManager, null);
            this.speedController = new SpeedController(this.configManager, this.speedUI);
            this.speedUI.speedController = this.speedController;
            this.autoCheckTimer = null;
            this.controlBarInjector = null;
        }

        init() {
            this._injectStyles();
            this.speedController.hackAttachShadow();
            this.speedController.hijackPlaybackRate();
            this.speedController.bindVideoPauseEvents();
            this.speedUI.init();
            this._initControlBarInjector();
            this._bindKeyEvents();
            this._setupResizeObserver();
            this._setupVideoObserver();
            this._setupAutoCheck();
        }

        _initControlBarInjector() {
            if (!this.configManager.isEnableControlBar()) return;
            
            this.controlBarInjector = new VideoControlBarInjector(
                this.configManager,
                this.speedController,
                this.speedUI
            );
            this.controlBarInjector.init();
        }

        updateControlBarInjector() {
            if (this.controlBarInjector) {
                this.controlBarInjector.setEnabled(this.configManager.isEnableControlBar());
            } else if (this.configManager.isEnableControlBar()) {
                this._initControlBarInjector();
            }
        }

        // 自动检查倍速
        _setupAutoCheck() {
            this._stopAutoCheck();
            if (this.configManager.isAutoCheck()) {
                const interval = this.configManager.getCheckInterval();
                this.autoCheckTimer = setInterval(() => {
                    this._checkPlaybackRate();
                }, interval);
            }
        }

        _stopAutoCheck() {
            if (this.autoCheckTimer) {
                clearInterval(this.autoCheckTimer);
                this.autoCheckTimer = null;
            }
        }

        _checkPlaybackRate() {
            const video = this.speedController.getActivePlayer();
            if (!video) return;

            const targetSpeed = this.configManager.getCurrentSpeed();
            const currentSpeed = video.playbackRate;

            // 检查当前倍速是否符合设置
            if (currentSpeed !== targetSpeed) {
                video.playbackRate = targetSpeed;
            }
        }

        updateAutoCheck() {
            this._setupAutoCheck();
        }

        _injectStyles() {
            const styles = `
                .vss-indicator {
                    position: fixed;
                    top: 10px;
                    left: 10px;
                    z-index: 99999;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 20px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 14px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                    transition: transform 0.2s ease, opacity 0.2s ease;
                    user-select: none;
                }

                .vss-indicator:hover {
                    transform: scale(1.05);
                }

                .vss-indicator-btn {
                    width: 22px;
                    height: 22px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.15);
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 16px;
                    transition: background 0.2s;
                }

                .vss-indicator-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                }

                .vss-indicator-btn:active {
                    background: rgba(255, 255, 255, 0.4);
                }

                .vss-indicator-speed {
                    min-width: 36px;
                    text-align: center;
                }

                .vss-indicator-lock {
                    cursor: pointer;
                    padding: 2px;
                    border-radius: 50%;
                    transition: background 0.2s;
                }

                .vss-indicator-lock:hover {
                    background: rgba(255, 255, 255, 0.15);
                }

                .vss-indicator-lock.active {
                    color: #ff6b6b;
                }

                .vss-settings-panel {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) scale(0.9);
                    z-index: 99999;
                    background: #1e1e1e;
                    color: #e0e0e0;
                    border-radius: 12px;
                    width: 420px;
                    max-width: 90vw;
                    max-height: 80vh;
                    overflow: hidden;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.25s ease;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .vss-settings-panel.vss-settings-panel-open {
                    opacity: 1;
                    visibility: visible;
                    transform: translate(-50%, -50%) scale(1);
                }

                .vss-settings-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    background: #2d2d2d;
                    border-bottom: 1px solid #3d3d3d;
                }

                .vss-settings-header span {
                    font-size: 16px;
                    font-weight: 600;
                }

                .vss-settings-close {
                    background: none;
                    border: none;
                    color: #888;
                    cursor: pointer;
                    padding: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                    transition: all 0.2s;
                }

                .vss-settings-close:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                }

                .vss-settings-content {
                    padding: 20px;
                    max-height: calc(80vh - 60px);
                    overflow-y: auto;
                }

                .vss-settings-section {
                    margin-bottom: 20px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid #3d3d3d;
                }

                .vss-settings-section:last-child {
                    margin-bottom: 0;
                    padding-bottom: 0;
                    border-bottom: none;
                }

                .vss-settings-row {
                    margin-bottom: 12px;
                }

                .vss-settings-row:last-child {
                    margin-bottom: 0;
                }

                .vss-settings-row label {
                    display: block;
                    margin-bottom: 8px;
                    color: #aaa;
                    font-size: 13px;
                }

                .vss-settings-row label strong {
                    color: #4fc3f7;
                    font-size: 18px;
                }

                .vss-settings-row input[type="text"] {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #3d3d3d;
                    border-radius: 6px;
                    background: #2d2d2d;
                    color: #e0e0e0;
                    font-size: 14px;
                    box-sizing: border-box;
                }

                .vss-settings-row input[type="text"]:focus {
                    outline: none;
                    border-color: #4fc3f7;
                }

                .vss-settings-row-buttons {
                    display: flex;
                    gap: 10px;
                }

                .vss-btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s;
                }

                .vss-btn-primary {
                    background: #4fc3f7;
                    color: #1e1e1e;
                }

                .vss-btn-primary:hover {
                    background: #29b6f6;
                }

                .vss-btn-secondary {
                    background: #3d3d3d;
                    color: #e0e0e0;
                }

                .vss-btn-secondary:hover {
                    background: #4d4d4d;
                }

                .vss-btn-warning {
                    background: #ff6b6b;
                    color: white;
                }

                .vss-btn-warning:hover {
                    background: #ff5252;
                }

                .vss-help-text {
                    background: #2d2d2d;
                    padding: 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    color: #888;
                }

                .vss-help-text p {
                    margin: 6px 0;
                }

                .vss-help-text kbd {
                    background: #3d3d3d;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: monospace;
                    color: #4fc3f7;
                }

                .vss-notification {
                    position: fixed;
                    top: 60px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 999999;
                    background: rgba(0, 0, 0, 0.9);
                    color: white;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                    transition: opacity 0.3s ease;
                }

                .vss-notification-fadeout {
                    opacity: 0;
                }

                .vss-init-visible-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .vss-init-visible-icon {
                    font-size: 14px;
                    width: 18px;
                    text-align: center;
                }

                .vss-show-on-pause-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .vss-show-on-pause-icon {
                    font-size: 14px;
                    width: 18px;
                    text-align: center;
                }

                .vss-settings-row input[type="checkbox"] {
                    margin-right: 8px;
                }

                .vss-settings-row-child {
                    margin-left: 24px;
                }

                .vss-settings-row-indent {
                    margin-left: 36px;
                    margin-top: 8px;
                    align-items: center;
                    gap: 8px;
                }

                .vss-settings-row-indent label {
                    margin-bottom: 0;
                }

                .vss-settings-row-indent input[type="number"] {
                    width: 100px;
                    padding: 6px 8px;
                    border: 1px solid #3d3d3d;
                    border-radius: 4px;
                    background: #2d2d2d;
                    color: #e0e0e0;
                    font-size: 13px;
                }

                .vss-settings-row-indent input[type="number"]:focus {
                    outline: none;
                    border-color: #4fc3f7;
                }

                .vss-pause-fade-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #aaa;
                    font-size: 13px;
                }

                /* 视频控制栏倍速下拉菜单 */
                .vss-bar-controls {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    z-index: 99999;
                    opacity: 0;
                    visibility: hidden;
                    transition: opacity 0.3s ease, visibility 0.3s ease;
                }

                .vss-bar-controls.vss-bar-visible {
                    opacity: 1;
                    visibility: visible;
                }

                .vss-speed-dropdown {
                    position: relative;
                    display: inline-flex;
                    vertical-align: middle;
                }

                .vss-speed-btn {
                    background: rgba(0, 0, 0, 0.7);
                    border: none;
                    color: white;
                    padding: 4px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                    font-family: inherit;
                    transition: background 0.2s;
                }

                .vss-speed-btn:hover {
                    background: rgba(0, 0, 0, 0.85);
                }

                .vss-speed-menu {
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.9);
                    border-radius: 6px;
                    padding: 4px 0;
                    min-width: 60px;
                    display: none;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
                    z-index: 999999;
                    margin-top: 4px;
                }

                .vss-speed-menu.vss-speed-menu-open {
                    display: block;
                }

                .vss-speed-option {
                    padding: 6px 14px;
                    cursor: pointer;
                    font-size: 13px;
                    color: #e0e0e0;
                    text-align: center;
                    transition: background 0.15s;
                    white-space: nowrap;
                }

                .vss-speed-option:hover {
                    background: rgba(79, 195, 247, 0.3);
                }

                .vss-speed-option.active {
                    color: #4fc3f7;
                    font-weight: 600;
                }
            `;

            GM_addStyle(styles);
        }

        _bindKeyEvents() {
            document.addEventListener('keydown', (e) => {
                if (e.key === KEY_TOGGLE && !e.ctrlKey && !e.altKey && !e.metaKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    this._toggleSpeed();
                } else if (e.key === 'Escape' && this.speedUI.isPanelOpen) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.speedUI.closeSettingsPanel();
                }
            }, true); // 使用捕获阶段，确保优先处理
        }

        _toggleSpeed() {
            const newSpeed = this.configManager.nextSpeed();
            const success = this.speedController.setPlaybackRate(newSpeed);
            // 无论是否找到视频，都轮询到下一个倍速
            this.speedUI.updateIndicator();
            // 按下~键时让按钮显现并重置渐隐计时器
            this.speedUI.clearFadeTimer();
            this.speedUI.fadeIn();
            this.speedUI.startFadeTimer();
            if (this.speedUI.isPanelOpen) {
                this.speedUI.refreshPanel();
            }
        }

        _setupResizeObserver() {
            if (typeof ResizeObserver !== 'undefined') {
                new ResizeObserver(() => {
                    this.speedUI.updateIndicatorPosition();
                }).observe(document.body);
            }
        }

        _setupVideoObserver() {
            const handleNewVideo = (video) => {
                if (!video || !(video instanceof HTMLVideoElement)) return;
                // 如果锁定已启用，对新视频应用当前倍速
                if (this.configManager.isLocked()) {
                    const speed = this.configManager.getCurrentSpeed();
                    try {
                        video.playbackRate = speed;
                    } catch (e) {
                        // 忽略错误
                    }
                }
                // 绑定暂停/播放事件
                this.speedController.bindVideoPauseEventToVideo(video);
            };

            // 监听DOM变化，检测新增视频
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeName === 'VIDEO') {
                            handleNewVideo(node);
                        } else if (node.querySelectorAll) {
                            node.querySelectorAll('video').forEach(handleNewVideo);
                        }
                    });
                });
            });

            // 监听 Shadow DOM 创建事件
            const shadowObservers = [];
            const handleShadowRoot = (e) => {
                const shadowRoot = e.detail?.shadowRoot;
                if (shadowRoot) {
                    shadowRoot.querySelectorAll('video').forEach(handleNewVideo);
                    // 监听 Shadow DOM 内部变化
                    const shadowObserver = new MutationObserver((mutations) => {
                        mutations.forEach((mutation) => {
                            mutation.addedNodes.forEach((node) => {
                                if (node.nodeName === 'VIDEO') {
                                    handleNewVideo(node);
                                } else if (node.querySelectorAll) {
                                    node.querySelectorAll('video').forEach(handleNewVideo);
                                }
                            });
                        });
                    });
                    shadowObserver.observe(shadowRoot, {
                        childList: true,
                        subtree: true
                    });
                    shadowObservers.push(shadowObserver);
                }
            };
            document.addEventListener('vss-shadow-root-created', handleShadowRoot);

            // 确保document.body存在
            if (document.body) {
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                });
            }

            // 页面卸载时清理
            window.addEventListener('beforeunload', () => {
                observer.disconnect();
                shadowObservers.forEach(obs => obs.disconnect());
                document.removeEventListener('vss-shadow-root-created', handleShadowRoot);
            });
        }
    }

    // ==================== 初始化 ====================
    const manager = new SpeedManager();
    window._vss_manager_ = manager;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => manager.init());
    } else {
        manager.init();
    }

})();
