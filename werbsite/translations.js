// Translations object with all text content in German and English
const translations = {
    de: {
        // Navigation
        'nav.features': 'Features',
        'nav.performance': 'Performance',
        'nav.pricing': 'Pricing',
        'nav.contact': 'Kontakt',

        // Hero Section
        'hero.title': 'Professioneller Market Maker Bot<br>für Kryptowährungen',
        'hero.subtitle': 'TotalHedge ist ein fortschrittlicher Market Maker Bot, der kontinuierlich Liquidität bereitstellt und durch Bid-Ask-Spreads profitiert. Optimiert für Bybit mit 24/7 automatisiertem Trading.',
        'hero.demo': 'Live Demo ansehen',
        'hero.learn': 'Mehr erfahren',
        'hero.stat1': 'Liquiditätsbereitstellung',
        'hero.stat2': 'Reaktionszeit',
        'hero.stat3': 'Market Making',

        // Features Section
        'features.title': 'Warum TotalHedge Market Maker?',
        'features.speed.title': 'Ultraschnelle Ausführung',
        'features.speed.desc': 'FastExecutionStream für millisekunden-genaue Order-Platzierung und -Verwaltung. Keine verpassten Opportunities.',
        'features.market.title': 'Intelligentes Market Making',
        'features.market.desc': 'Fortschrittliche Orderbook-Analyse mit dynamischer Preisfindung für optimale Entry- und Exit-Points.',
        'features.risk.title': 'Risikomanagement',
        'features.risk.desc': 'Integrierte Stop-Loss-, Take-Profit- und Trailing-Stop-Mechanismen für maximalen Schutz Ihres Kapitals.',
        'features.monitor.title': 'Real-Time Monitoring',
        'features.monitor.desc': 'Live-Überwachung von Positionen, Liquidationen, und Marktbewegungen mit Telegram-Benachrichtigungen.',
        'features.config.title': 'Vollständig Konfigurierbar',
        'features.config.desc': 'Anpassbare Strategien für Long/Short Positionen, variable Positionsgrößen und flexible Timeframes.',
        'features.analytics.title': 'Performance Analytics',
        'features.analytics.desc': 'Detaillierte PnL-Reports, Drawdown-Analyse und Performance-Tracking für kontinuierliche Optimierung.',

        // Technology Section
        'tech.title': 'Fortschrittliche Technologie',
        'tech.subtitle': 'TotalHedge nutzt modernste Algorithmen und Echtzeit-Datenstreams für präzises Trading:',
        'tech.websocket': '<strong>WebSocket-Streams:</strong> Echtzeit Orderbook und Trade-Daten',
        'tech.bybit': '<strong>Bybit API Integration:</strong> Direkte Anbindung an eine der weltweit führenden Krypto-Börsen',
        'tech.liquidation': '<strong>Liquidation Monitoring:</strong> Identifikation von Markt-Ineffizienzen',
        'tech.sizing': '<strong>Dynamic Position Sizing:</strong> Automatische Anpassung an Marktvolatilität',
        'tech.multiasset': '<strong>Multi-Asset Support:</strong> BTC, ETH, SOL, XRP und viele weitere',
        'tech.partnership': '<strong>Bybit Partnership:</strong> Premium API-Zugang und institutionelle Features',

        // Partner Section
        'partner.official': 'Offizieller Partner',
        'partner.description': 'TotalHedge ist exklusiv für die Bybit-Exchange optimiert. Als offizieller Partner bieten wir direkten API-Zugang, niedrigste Latenz und Premium-Support für institutionelle Trading-Lösungen.',
        'partner.users': 'Bybit Nutzer',
        'partner.volume24h': '24h Volumen',
        'partner.uptime': 'Exchange Uptime',

        // Trading Strategy Section
        'strategy.title': 'Die TotalHedge Trading-Strategie',
        'strategy.intro': 'Der Kern unseres Systems basiert auf fortschrittlichen Market-Making-Algorithmen, die Markt-Ineffizienzen identifizieren und ausnutzen.',
        'strategy.market.title': 'Liquidity Provision Strategy',
        'strategy.market.desc': 'TotalHedge positioniert sich als Market Maker, indem er kontinuierlich Bid- und Ask-Orders im Orderbook platziert. Durch das Ausnutzen der Bid-Ask-Spreads generiert der Bot konsistente Profits.',
        'strategy.market.how': 'Funktionsweise:',
        'strategy.market.step1': 'Echtzeit-Analyse des Orderbooks mit WebSocket-Streams',
        'strategy.market.step2': 'Dynamische Preisfindung basierend auf Markttiefe',
        'strategy.market.step3': 'Verteilung von Limit-Orders über mehrere Preisniveaus',
        'strategy.market.step4': 'Sofortige Neupositionierung bei Marktbewegungen',
        'strategy.liquidation.title': 'Liquidation Hunting',
        'strategy.liquidation.desc': 'Der Bot überwacht Liquidations-Events und nutzt die daraus resultierenden Preisbewegungen für profitable Trades.',
        'strategy.risk.title': 'Dynamic Risk Management',
        'strategy.risk.desc': 'Intelligente Stop-Loss- und Take-Profit-Mechanismen passen sich automatisch an Marktvolatilität an.',
        'strategy.arbitrage.title': 'Micro-Arbitrage',
        'strategy.arbitrage.desc': 'Ausnutzung kleinster Preisunterschiede zwischen verschiedenen Orderbook-Levels.',
        'strategy.performance.title': 'Strategie-Performance',
        'strategy.performance.spread': 'Profit pro Trade',
        'strategy.performance.trades': 'Trades pro Tag',
        'strategy.performance.latency': 'Ausführungszeit',
        'strategy.performance.winrate': 'Win-Rate',
        'strategy.code.title': 'Kern-Algorithmus',

        // Performance Section
        'performance.title': 'Beeindruckende Performance',
        'performance.profits.title': 'Konsistente Gewinne',
        'performance.profits.desc': 'Automatisierte Profit-Optimierung durch intelligente Market-Making-Strategien',
        'performance.availability.title': '24/7 Verfügbarkeit',
        'performance.availability.desc': 'Niemals eine Gelegenheit verpassen - der Bot arbeitet rund um die Uhr',
        'performance.precision.title': 'Präzise Ausführung',
        'performance.precision.desc': 'Millisekunden-genaue Order-Platzierung für optimale Markt-Entry-Points',
        'performance.dashboard.title': 'Live Performance Dashboard',
        'performance.dashboard.session': 'Aktuelle Session',
        'performance.dashboard.pnl': 'PnL heute',
        'performance.dashboard.trades': 'Trades heute', 
        'performance.dashboard.risk': 'Bot Status',
        'performance.dashboard.low': 'NIEDRIG',
        'performance.dashboard.drawdown': 'Drawdown: -0.8%',
        'performance.dashboard.live': 'Live',
        'performance.dashboard.active': 'AKTIV',
        'performance.dashboard.winrate': 'Win-Rate:',
        'performance.dashboard.volume': 'Volumen:',
        'performance.recent.title': 'Letzte Trades',

        // Pricing Section
        'pricing.title': 'Investieren Sie in Ihre Zukunft',
        'pricing.month': '/Monat',
        'pricing.popular': 'Beliebt',
        'pricing.select': 'Auswählen',
        'pricing.contact': 'Kontakt',
        'pricing.starter.title': 'Starter',
        'pricing.starter.feature1': '1 Trading Paar',
        'pricing.starter.feature2': 'Basis Risk Management',
        'pricing.starter.feature3': 'Telegram Benachrichtigungen',
        'pricing.starter.feature4': 'Email Support',
        'pricing.pro.title': 'Professional',
        'pricing.pro.feature1': 'Unbegrenzte Trading Paare',
        'pricing.pro.feature2': 'Erweiterte Strategien',
        'pricing.pro.feature3': 'Live Dashboard',
        'pricing.pro.feature4': 'PnL Analytics',
        'pricing.pro.feature5': 'Priority Support',
        'pricing.pro.feature6': 'Custom Konfiguration',
        'pricing.enterprise.title': 'Enterprise',
        'pricing.enterprise.feature1': 'Multi-Exchange Support',
        'pricing.enterprise.feature2': 'White-Label Lösung',
        'pricing.enterprise.feature3': 'Dedicated Server',
        'pricing.enterprise.feature4': '24/7 Phone Support',
        'pricing.enterprise.feature5': 'Custom Development',
        'pricing.enterprise.feature6': 'API Access',

        // Contact Section
        'contact.title': 'Bereit zu starten?',
        'contact.subtitle': 'Kontaktieren Sie uns für eine persönliche Demo und maßgeschneiderte Lösung',
        'contact.discord': 'TotalHedge Community',
        'contact.trial.title': 'Kostenlose 7-Tage Testversion',
        'contact.trial.desc': 'Testen Sie TotalHedge risikofrei mit unserem Demo-Account',
        'contact.trial.button': 'Jetzt kostenlos testen',

        // Footer
        'footer.description': 'Führender Anbieter von Market Making-Lösungen. TotalHedge stellt kontinuierlich Liquidität bereit und generiert Profits durch intelligente Spread-Strategien.',
        'footer.market': 'Market Making',
        'footer.risk': 'Risk Management',
        'footer.analytics': 'Real-Time Analytics',
        'footer.multiasset': 'Multi-Asset Support',
        'footer.docs': 'Dokumentation',
        'footer.api': 'API Reference',
        'footer.community': 'Community Forum',
        'footer.chat': 'Live Chat',
        'footer.privacy': 'Datenschutz',
        'footer.terms': 'AGB',
        'footer.imprint': 'Impressum',
        'footer.copyright': '© 2026 ngiworks. TotalHedge ist ein Produkt von ngiworks.',
        'footer.disclaimer': 'Trading birgt Risiken. Vergangene Performance ist keine Garantie für zukünftige Ergebnisse.',
        'footer.partner': 'Offizieller Bybit Partner',

        // Company Section
        'company.title': 'Von den Experten bei ngiworks',
        'company.subtitle': 'ngiworks ist ein führendes Unternehmen für quantitative Handelsalgorithmen und Fintech-Lösungen. Mit jahrelanger Erfahrung in der Entwicklung von Trading-Software für institutionelle Kunden.',
        'company.years': 'Jahre Erfahrung',
        'company.volume': 'Handelsvolumen',
        'company.uptime': 'Uptime',
        'company.tagline': 'Algorithmic Trading Solutions',
        'company.enterprise': 'Enterprise-Grade',
        'company.enterprise.desc': 'Institutional-level Sicherheit und Zuverlässigkeit',
        'company.research': 'R&D Focus',
        'company.research.desc': 'Ständige Innovation in Trading-Algorithmen'
    },

    en: {
        // Navigation
        'nav.features': 'Features',
        'nav.performance': 'Performance',
        'nav.pricing': 'Pricing',
        'nav.contact': 'Contact',

        // Hero Section
        'hero.title': 'Professional Market Maker Bot<br>for Cryptocurrencies',
        'hero.subtitle': 'TotalHedge is an advanced market maker bot that continuously provides liquidity and profits from bid-ask spreads. Optimized for Bybit with 24/7 automated trading.',
        'hero.demo': 'View Live Demo',
        'hero.learn': 'Learn More',
        'hero.stat1': 'Liquidity Provision',
        'hero.stat2': 'Response Time',
        'hero.stat3': 'Market Making',

        // Features Section
        'features.title': 'Why TotalHedge Market Maker?',
        'features.speed.title': 'Ultra-Fast Execution',
        'features.speed.desc': 'FastExecutionStream for millisecond-precise order placement and management. No missed opportunities.',
        'features.market.title': 'Intelligent Market Making',
        'features.market.desc': 'Advanced orderbook analysis with dynamic price discovery for optimal entry and exit points.',
        'features.risk.title': 'Risk Management',
        'features.risk.desc': 'Integrated stop-loss, take-profit, and trailing-stop mechanisms for maximum protection of your capital.',
        'features.monitor.title': 'Real-Time Monitoring',
        'features.monitor.desc': 'Live monitoring of positions, liquidations, and market movements with Telegram notifications.',
        'features.config.title': 'Fully Configurable',
        'features.config.desc': 'Customizable strategies for long/short positions, variable position sizes and flexible timeframes.',
        'features.analytics.title': 'Performance Analytics',
        'features.analytics.desc': 'Detailed PnL reports, drawdown analysis and performance tracking for continuous optimization.',

        // Technology Section
        'tech.title': 'Advanced Technology',
        'tech.subtitle': 'TotalHedge uses cutting-edge algorithms and real-time data streams for precise trading:',
        'tech.websocket': '<strong>WebSocket Streams:</strong> Real-time orderbook and trade data',
        'tech.bybit': '<strong>Bybit API Integration:</strong> Direct connection to one of the world\'s leading crypto exchanges',
        'tech.liquidation': '<strong>Liquidation Monitoring:</strong> Identification of market inefficiencies',
        'tech.sizing': '<strong>Dynamic Position Sizing:</strong> Automatic adaptation to market volatility',
        'tech.multiasset': '<strong>Multi-Asset Support:</strong> BTC, ETH, SOL, XRP and many more',
        'tech.partnership': '<strong>Bybit Partnership:</strong> Premium API access and institutional features',

        // Partner Section
        'partner.official': 'Official Partner',
        'partner.description': 'TotalHedge is exclusively optimized for Bybit Exchange. As an official partner, we provide direct API access, lowest latency, and premium support for institutional trading solutions.',
        'partner.users': 'Bybit Users',
        'partner.volume24h': '24h Volume',
        'partner.uptime': 'Exchange Uptime',

        // Trading Strategy Section
        'strategy.title': 'The TotalHedge Trading Strategy',
        'strategy.intro': 'The core of our system is based on advanced market-making algorithms that identify and exploit market inefficiencies.',
        'strategy.market.title': 'Liquidity Provision Strategy',
        'strategy.market.desc': 'TotalHedge positions itself as a market maker by continuously placing bid and ask orders in the orderbook. By exploiting bid-ask spreads, the bot generates consistent profits.',
        'strategy.market.how': 'How it works:',
        'strategy.market.step1': 'Real-time orderbook analysis with WebSocket streams',
        'strategy.market.step2': 'Dynamic price discovery based on market depth',
        'strategy.market.step3': 'Distribution of limit orders across multiple price levels',
        'strategy.market.step4': 'Immediate repositioning on market movements',
        'strategy.liquidation.title': 'Liquidation Hunting',
        'strategy.liquidation.desc': 'The bot monitors liquidation events and exploits the resulting price movements for profitable trades.',
        'strategy.risk.title': 'Dynamic Risk Management',
        'strategy.risk.desc': 'Intelligent stop-loss and take-profit mechanisms automatically adapt to market volatility.',
        'strategy.arbitrage.title': 'Micro-Arbitrage',
        'strategy.arbitrage.desc': 'Exploitation of smallest price differences between different orderbook levels.',
        'strategy.performance.title': 'Strategy Performance',
        'strategy.performance.spread': 'Profit per Trade',
        'strategy.performance.trades': 'Trades per Day',
        'strategy.performance.latency': 'Execution Time',
        'strategy.performance.winrate': 'Win Rate',
        'strategy.code.title': 'Core Algorithm',

        // Performance Section
        'performance.title': 'Impressive Performance',
        'performance.profits.title': 'Consistent Profits',
        'performance.profits.desc': 'Automated profit optimization through intelligent market-making strategies',
        'performance.availability.title': '24/7 Availability',
        'performance.availability.desc': 'Never miss an opportunity - the bot works around the clock',
        'performance.precision.title': 'Precise Execution',
        'performance.precision.desc': 'Millisecond-precise order placement for optimal market entry points',
        'performance.dashboard.title': 'Live Performance Dashboard',
        'performance.dashboard.session': 'Current Session',
        'performance.dashboard.pnl': 'PnL Today',
        'performance.dashboard.trades': 'Trades Today',
        'performance.dashboard.risk': 'Bot Status', 
        'performance.dashboard.low': 'LOW',
        'performance.dashboard.drawdown': 'Drawdown: -0.8%',
        'performance.dashboard.live': 'Live',
        'performance.dashboard.active': 'ACTIVE',
        'performance.dashboard.winrate': 'Win Rate:',
        'performance.dashboard.volume': 'Volume:',
        'performance.recent.title': 'Recent Trades',

        // Pricing Section
        'pricing.title': 'Invest in Your Future',
        'pricing.month': '/month',
        'pricing.popular': 'Popular',
        'pricing.select': 'Select',
        'pricing.contact': 'Contact',
        'pricing.starter.title': 'Starter',
        'pricing.starter.feature1': '1 Trading Pair',
        'pricing.starter.feature2': 'Basic Risk Management',
        'pricing.starter.feature3': 'Telegram Notifications',
        'pricing.starter.feature4': 'Email Support',
        'pricing.pro.title': 'Professional',
        'pricing.pro.feature1': 'Unlimited Trading Pairs',
        'pricing.pro.feature2': 'Advanced Strategies',
        'pricing.pro.feature3': 'Live Dashboard',
        'pricing.pro.feature4': 'PnL Analytics',
        'pricing.pro.feature5': 'Priority Support',
        'pricing.pro.feature6': 'Custom Configuration',
        'pricing.enterprise.title': 'Enterprise',
        'pricing.enterprise.feature1': 'Multi-Exchange Support',
        'pricing.enterprise.feature2': 'White-Label Solution',
        'pricing.enterprise.feature3': 'Dedicated Server',
        'pricing.enterprise.feature4': '24/7 Phone Support',
        'pricing.enterprise.feature5': 'Custom Development',
        'pricing.enterprise.feature6': 'API Access',

        // Contact Section
        'contact.title': 'Ready to Start?',
        'contact.subtitle': 'Contact us for a personal demo and customized solution',
        'contact.discord': 'TotalHedge Community',
        'contact.trial.title': 'Free 7-Day Trial',
        'contact.trial.desc': 'Test TotalHedge risk-free with our demo account',
        'contact.trial.button': 'Start Free Trial',

        // Footer
        'footer.description': 'Leading provider of market making solutions. TotalHedge continuously provides liquidity and generates profits through intelligent spread strategies.',
        'footer.market': 'Market Making',
        'footer.risk': 'Risk Management',
        'footer.analytics': 'Real-Time Analytics',
        'footer.multiasset': 'Multi-Asset Support',
        'footer.docs': 'Documentation',
        'footer.api': 'API Reference',
        'footer.community': 'Community Forum',
        'footer.chat': 'Live Chat',
        'footer.privacy': 'Privacy',
        'footer.terms': 'Terms',
        'footer.imprint': 'Imprint',
        'footer.copyright': '© 2026 ngiworks. TotalHedge is a product of ngiworks.',
        'footer.disclaimer': 'Trading involves risks. Past performance is no guarantee of future results.',
        'footer.partner': 'Official Bybit Partner',

        // Company Section
        'company.title': 'From the experts at ngiworks',
        'company.subtitle': 'ngiworks is a leading company for quantitative trading algorithms and fintech solutions. With years of experience developing trading software for institutional clients.',
        'company.years': 'Years Experience',
        'company.volume': 'Trading Volume',
        'company.uptime': 'Uptime',
        'company.tagline': 'Algorithmic Trading Solutions',
        'company.enterprise': 'Enterprise-Grade',
        'company.enterprise.desc': 'Institutional-level security and reliability',
        'company.research': 'R&D Focus',
        'company.research.desc': 'Continuous innovation in trading algorithms'
    }
};

// Current language (default: German)
let currentLanguage = 'de';

// Function to translate all elements with data-translate attribute
function translatePage(language) {
    currentLanguage = language;
    
    // Get all elements with data-translate attribute
    const elements = document.querySelectorAll('[data-translate]');
    
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        const translation = translations[language][key];
        
        if (translation) {
            // Check if translation contains HTML
            if (translation.includes('<strong>') || translation.includes('<br>')) {
                element.innerHTML = translation;
            } else {
                element.textContent = translation;
            }
        }
    });
    
    // Update language button states
    updateLanguageButtons();
    
    // Save language preference
    localStorage.setItem('preferredLanguage', language);
    
    // Update document language attribute
    document.documentElement.lang = language;
}

// Function to update language button visual states
function updateLanguageButtons() {
    const langButtons = document.querySelectorAll('.lang-btn');
    
    langButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.id === `lang-${currentLanguage}`) {
            btn.classList.add('active');
        }
    });
}

// Initialize localization system
function initLocalization() {
    // Check for saved language preference
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && translations[savedLanguage]) {
        currentLanguage = savedLanguage;
    }
    
    // Set up language switcher event listeners
    document.addEventListener('DOMContentLoaded', () => {
        const langDE = document.getElementById('lang-de');
        const langEN = document.getElementById('lang-en');
        
        if (langDE) {
            langDE.addEventListener('click', () => translatePage('de'));
        }
        
        if (langEN) {
            langEN.addEventListener('click', () => translatePage('en'));
        }
        
        // Apply initial translation
        translatePage(currentLanguage);
    });
}

// Auto-detect browser language
function detectBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    
    if (browserLang.startsWith('de')) {
        return 'de';
    } else if (browserLang.startsWith('en')) {
        return 'en';
    }
    
    return 'de'; // Default to German
}

// Initialize with browser language detection if no preference is saved
if (!localStorage.getItem('preferredLanguage')) {
    currentLanguage = detectBrowserLanguage();
}

// Initialize the localization system
initLocalization();

console.log('Localization system initialized! 🌐');