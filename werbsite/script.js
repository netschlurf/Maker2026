// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Header scroll effect
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(10, 10, 10, 0.98)';
    } else {
        header.style.background = 'rgba(10, 10, 10, 0.95)';
    }
});

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all feature cards and pricing cards
document.querySelectorAll('.feature, .pricing-card, .performance-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Real-time data simulation for dashboard
function updateDashboardMetrics() {
    // Simulate real-time PnL updates
    const pnlElement = document.querySelector('.metric-value.positive');
    if (pnlElement) {
        const currentValue = parseFloat(pnlElement.textContent.replace('%', '').replace('+', ''));
        const change = (Math.random() - 0.5) * 0.1; // Random change between -0.05% and +0.05%
        const newValue = Math.max(0, currentValue + change);
        pnlElement.textContent = `+${newValue.toFixed(2)}%`;
        
        // Add visual feedback for changes
        if (change > 0) {
            pnlElement.style.color = '#00ff88';
        } else if (change < 0) {
            pnlElement.style.color = '#ff6b6b';
        }
        
        setTimeout(() => {
            pnlElement.style.color = '#00ff88';
        }, 500);
    }
}

// Update metrics every 3 seconds
setInterval(updateDashboardMetrics, 3000);

// Initialize typing animation when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Removed typing animation - direct display instead
    console.log('Page loaded - no typing animation');
});

// Add particle background effect
function createParticles() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(0, 212, 255, 0.3);
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float ${3 + Math.random() * 4}s ease-in-out infinite;
            animation-delay: ${Math.random() * 2}s;
        `;
        hero.appendChild(particle);
    }
}

// Add CSS for particle animation
const style = document.createElement('style');
style.textContent = `
    @keyframes float {
        0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
        50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
    }
`;
document.head.appendChild(style);

// Initialize particles
document.addEventListener('DOMContentLoaded', createParticles);

// Add hover effects for cards
document.querySelectorAll('.feature, .pricing-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
        this.style.boxShadow = '0 20px 40px rgba(0, 212, 255, 0.2)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(-5px) scale(1)';
        this.style.boxShadow = '0 10px 25px rgba(0, 212, 255, 0.1)';
    });
});

// Mobile menu toggle (for future mobile navigation)
function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.toggle('mobile-active');
}

// Add click handlers for CTA buttons
document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('click', function(e) {
        if (this.textContent.includes('Demo') || this.textContent.includes('testen')) {
            e.preventDefault();
            alert('Demo wird geladen... Kontaktieren Sie uns für Zugang zur Live-Demo!');
        }
    });
});

// Performance counter animation
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        element.textContent = Math.floor(current);
        
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        }
    }, 16);
}

// Add loading states for buttons
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const original = this.innerHTML;
        this.innerHTML = '<span style="opacity: 0.7;">Laden...</span>';
        this.style.pointerEvents = 'none';
        
        setTimeout(() => {
            this.innerHTML = original;
            this.style.pointerEvents = 'auto';
        }, 1500);
    });
});

console.log('TotalHedge Website loaded successfully! 🚀');

// Live PnL Data Management
class LivePnLManager {
    constructor() {
        this.apiBaseUrl = window.location.origin + '/api';
        this.updateInterval = 30000; // 30 seconds
        this.isLocal = window.location.hostname === 'localhost';
        this.init();
    }

    init() {
        this.startLiveUpdates();
        this.fetchInitialData();
    }

    async fetchInitialData() {
        try {
            await this.updateLivePnL();
        } catch (error) {
            this.showFallbackData();
        }
    }

    async updateLivePnL() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/pnl/live`);
            if (!response.ok) throw new Error('API not available');
            
            const data = await response.json();
            this.displayLiveData(data);
            this.displayRecentTrades(data.recentTrades);
            
        } catch (error) {
            console.log('Live API not available, using demo data');
            if (!this.isLocal) {
                this.showFallbackData();
            }
        }
    }

    displayLiveData(data) {
        // Update PnL
        const pnlElement = document.getElementById('live-pnl');
        if (pnlElement) {
            const pnlValue = parseFloat(data.totalPnL);
            pnlElement.textContent = pnlValue >= 0 ? `+${pnlValue}` : pnlValue.toString();
            pnlElement.className = `metric-value ${pnlValue >= 0 ? 'positive' : 'negative'}`;
        }

        // Update trades count
        const tradesElement = document.getElementById('live-trades');
        if (tradesElement) {
            tradesElement.textContent = data.totalTrades;
        }

        // Update symbol
        const symbolElement = document.getElementById('live-symbol');
        if (symbolElement) {
            symbolElement.textContent = data.symbol;
        }

        // Update win rate
        const winrateElement = document.getElementById('live-winrate');
        if (winrateElement) {
            winrateElement.textContent = `${data.winRate}%`;
        }

        // Update volume
        const volumeElement = document.getElementById('live-volume');
        if (volumeElement) {
            const totalVolume = data.recentTrades?.reduce((sum, trade) => 
                sum + parseFloat(Math.abs(trade.pnl)), 0) || 0;
            volumeElement.textContent = `${totalVolume.toFixed(2)} USDT`;
        }

        // Update timestamp
        const updateElement = document.getElementById('last-update');
        if (updateElement) {
            const now = new Date();
            updateElement.textContent = `Letztes Update: ${now.toLocaleTimeString()}`;
        }

        // Update status
        const statusElement = document.getElementById('bot-status');
        if (statusElement) {
            statusElement.className = 'metric-value safe';
        }
    }

    displayRecentTrades(trades) {
        const container = document.getElementById('recent-trades');
        if (!container) return;

        if (!trades || trades.length === 0) {
            container.innerHTML = '<div class="loading-placeholder">Keine aktuellen Trades</div>';
            return;
        }

        container.innerHTML = trades.map(trade => {
            const pnlValue = parseFloat(trade.pnl);
            const isProfit = pnlValue >= 0;
            
            return `
                <div class="trade-item ${isProfit ? 'profit' : 'loss'}">
                    <div class="trade-info">
                        <div class="trade-symbol">${trade.symbol}</div>
                        <div class="trade-side">${trade.side} • ${trade.qty}</div>
                    </div>
                    <div class="trade-pnl">
                        <div class="trade-amount ${isProfit ? 'positive' : 'negative'}">
                            ${isProfit ? '+' : ''}${trade.pnl} USDT
                        </div>
                        <div class="trade-time">${trade.time}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    showFallbackData() {
        // Show demo data if API is not available
        const demoData = {
            totalPnL: '+2.45',
            totalTrades: 12,
            winRate: '83.3',
            symbol: 'DEMO MODE',
            recentTrades: [
                { symbol: 'BTCUSDT', side: 'LONG', pnl: '+0.125', time: '14:32:15', qty: '0.05' },
                { symbol: 'ETHUSDT', side: 'SHORT', pnl: '+0.087', time: '14:28:42', qty: '0.15' },
                { symbol: 'SOLUSDT', side: 'LONG', pnl: '-0.032', time: '14:25:18', qty: '2.5' }
            ]
        };
        
        this.displayLiveData(demoData);
        this.displayRecentTrades(demoData.recentTrades);
        
        // Show demo notice
        const container = document.getElementById('recent-trades');
        if (container) {
            container.insertAdjacentHTML('afterbegin', 
                '<div class="error-message">Demo-Modus: Live-Daten nicht verfügbar</div>'
            );
        }
    }

    startLiveUpdates() {
        setInterval(() => {
            this.updateLivePnL();
        }, this.updateInterval);
    }
}

// Initialize Live PnL Manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LivePnLManager();
});

// Live PnL Data Management
class LivePnLManager {
    constructor() {
        this.apiBaseUrl = window.location.origin + '/api';
        this.updateInterval = 30000; // 30 seconds
        this.isLocal = window.location.hostname === 'localhost';
        this.init();
    }

    init() {
        this.startLiveUpdates();
        this.fetchInitialData();
    }

    async fetchInitialData() {
        try {
            await this.updateLivePnL();
        } catch (error) {
            this.showFallbackData();
        }
    }

    async updateLivePnL() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/pnl/live`);
            if (!response.ok) throw new Error('API not available');
            
            const data = await response.json();
            this.displayLiveData(data);
            this.displayRecentTrades(data.recentTrades);
            
        } catch (error) {
            console.log('Live API not available, using demo data');
            if (!this.isLocal) {
                this.showFallbackData();
            }
        }
    }

    displayLiveData(data) {
        // Update PnL
        const pnlElement = document.getElementById('live-pnl');
        if (pnlElement) {
            const pnlValue = parseFloat(data.totalPnL);
            pnlElement.textContent = pnlValue >= 0 ? `+${pnlValue}` : pnlValue.toString();
            pnlElement.className = `metric-value ${pnlValue >= 0 ? 'positive' : 'negative'}`;
        }

        // Update trades count
        const tradesElement = document.getElementById('live-trades');
        if (tradesElement) {
            tradesElement.textContent = data.totalTrades;
        }

        // Update symbol
        const symbolElement = document.getElementById('live-symbol');
        if (symbolElement) {
            symbolElement.textContent = data.symbol;
        }

        // Update win rate
        const winrateElement = document.getElementById('live-winrate');
        if (winrateElement) {
            winrateElement.textContent = `${data.winRate}%`;
        }

        // Update volume
        const volumeElement = document.getElementById('live-volume');
        if (volumeElement) {
            const totalVolume = data.recentTrades?.reduce((sum, trade) => 
                sum + parseFloat(Math.abs(trade.pnl)), 0) || 0;
            volumeElement.textContent = `${totalVolume.toFixed(2)} USDT`;
        }

        // Update timestamp
        const updateElement = document.getElementById('last-update');
        if (updateElement) {
            const now = new Date();
            updateElement.textContent = `Letztes Update: ${now.toLocaleTimeString()}`;
        }

        // Update status
        const statusElement = document.getElementById('bot-status');
        if (statusElement) {
            statusElement.className = 'metric-value safe';
        }
    }

    displayRecentTrades(trades) {
        const container = document.getElementById('recent-trades');
        if (!container) return;

        if (!trades || trades.length === 0) {
            container.innerHTML = '<div class="loading-placeholder">Keine aktuellen Trades</div>';
            return;
        }

        container.innerHTML = trades.map(trade => {
            const pnlValue = parseFloat(trade.pnl);
            const isProfit = pnlValue >= 0;
            
            return `
                <div class="trade-item ${isProfit ? 'profit' : 'loss'}">
                    <div class="trade-info">
                        <div class="trade-symbol">${trade.symbol}</div>
                        <div class="trade-side">${trade.side} • ${trade.qty}</div>
                    </div>
                    <div class="trade-pnl">
                        <div class="trade-amount ${isProfit ? 'positive' : 'negative'}">
                            ${isProfit ? '+' : ''}${trade.pnl} USDT
                        </div>
                        <div class="trade-time">${trade.time}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    showFallbackData() {
        // Show demo data if API is not available
        const demoData = {
            totalPnL: '+2.45',
            totalTrades: 12,
            winRate: '83.3',
            symbol: 'DEMO MODE',
            recentTrades: [
                { symbol: 'BTCUSDT', side: 'LONG', pnl: '+0.125', time: '14:32:15', qty: '0.05' },
                { symbol: 'ETHUSDT', side: 'SHORT', pnl: '+0.087', time: '14:28:42', qty: '0.15' },
                { symbol: 'SOLUSDT', side: 'LONG', pnl: '-0.032', time: '14:25:18', qty: '2.5' }
            ]
        };
        
        this.displayLiveData(demoData);
        this.displayRecentTrades(demoData.recentTrades);
        
        // Show demo notice
        const container = document.getElementById('recent-trades');
        if (container) {
            container.insertAdjacentHTML('afterbegin', 
                '<div class="error-message">Demo-Modus: Live-Daten nicht verfügbar</div>'
            );
        }
    }

    startLiveUpdates() {
        setInterval(() => {
            this.updateLivePnL();
        }, this.updateInterval);
    }
}

// Initialize Live PnL Manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LivePnLManager();
});