document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // DOM ELEMENTS
    // ==========================================
    const symbolInput = document.getElementById('symbolInput');
    const symbolDropdown = document.getElementById('symbolDropdown');
    const dateRange = document.getElementById('dateRange');
    const startDateInput = document.getElementById('startDateInput');
    const endDateInput = document.getElementById('endDateInput');
    const fetchDataBtn = document.getElementById('fetchDataBtn');
    const loadDataBtn = document.getElementById('loadDataBtn');

    const chartType = document.getElementById('chartType');
    const priceAdjustmentMode = document.getElementById('priceAdjustmentMode');
    const adjPriceBadge = document.getElementById('adjPriceBadge');

    const tvChartDiv = document.getElementById('tvChartDiv');
    const priceChartCanvas = document.getElementById('priceChartCanvas');
    const rsiChartCanvas = document.getElementById('rsiChart') ? document.getElementById('rsiChart').getContext('2d') : null;
    const macdChartCanvas = document.getElementById('macdChart') ? document.getElementById('macdChart').getContext('2d') : null;

    const rsiValue = document.getElementById('rsiValue');
    const macdValue = document.getElementById('macdValue');
    const sma20Value = document.getElementById('sma20Value');
    const sma50Value = document.getElementById('sma50Value');
    const priceRangeValue = document.getElementById('priceRangeValue');
    const volumeValue = document.getElementById('volumeValue');
    const priceTable = document.getElementById('priceTable') ? document.getElementById('priceTable').querySelector('tbody') : null;
    const loadingOverlay = document.getElementById('loadingOverlay');

    const alertSymbolInput = document.getElementById('alertSymbolInput');
    const alertConditionSelect = document.getElementById('alertConditionSelect');
    const alertTargetPriceInput = document.getElementById('alertTargetPriceInput');
    const alertNoteInput = document.getElementById('alertNoteInput');
    const addAlertBtn = document.getElementById('addAlertBtn');
    const alertsTableBody = document.getElementById('alertsTableBody');
    const alertsCountBadges = document.querySelectorAll('#alertsCountBadge, #navAlertsBadge');
    const rsiDivergenceToggle = document.getElementById('rsiDivergenceToggle');
    const rsiDivergenceStatusBadge = document.getElementById('rsiDivergenceStatusBadge');
    const rsiDivergenceBanner = document.getElementById('rsiDivergenceBanner');
    const rsiDivergenceBannerTitle = document.getElementById('rsiDivergenceBannerTitle');
    const rsiDivergenceBannerDetail = document.getElementById('rsiDivergenceBannerDetail');
    const rsiDivergenceBannerBadge = document.getElementById('rsiDivergenceBannerBadge');

    const rsiPeriodInput = document.getElementById('rsiPeriodInput');
    const rsiOverboughtInput = document.getElementById('rsiOverboughtInput');
    const rsiOversoldInput = document.getElementById('rsiOversoldInput');
    const saveRsiSettingsBtn = document.getElementById('saveRsiSettingsBtn');
    const rsiPeriodLabel = document.getElementById('rsiPeriodLabel');

    const drawSupportBtn = document.getElementById('drawSupportBtn');
    const drawResistanceBtn = document.getElementById('drawResistanceBtn');
    const drawTrendlineBtn = document.getElementById('drawTrendlineBtn');
    const drawFiboBtn = document.getElementById('drawFiboBtn');
    const drawMeasureBtn = document.getElementById('drawMeasureBtn');
    const undoLineBtn = document.getElementById('undoLineBtn');
    const clearLinesBtn = document.getElementById('clearLinesBtn');
    const lineColorPicker = document.getElementById('lineColorPicker');
    const chartSnapshotBtn = document.getElementById('chartSnapshotBtn');
    const chartFullscreenBtn = document.getElementById('chartFullscreenBtn');
    const drawingStatusBanner = document.getElementById('drawingStatusBanner');
    const drawingStatusText = document.getElementById('drawingStatusText');
    const cancelDrawingBtn = document.getElementById('cancelDrawingBtn');

    const dailyChangeChartCanvas = document.getElementById('dailyChangeChart');
    const maxPosChangeText = document.getElementById('maxPosChangeText');
    const maxNegChangeText = document.getElementById('maxNegChangeText');
    const latestDailyChangeBadge = document.getElementById('latestDailyChangeBadge');
    const posVsNegDaysRatio = document.getElementById('posVsNegDaysRatio');
    const posDaysProgressBar = document.getElementById('posDaysProgressBar');
    const negDaysProgressBar = document.getElementById('negDaysProgressBar');
    const avgDailyVolatilityText = document.getElementById('avgDailyVolatilityText');
    const totalCandlesCountText = document.getElementById('totalCandlesCountText');
    const dailyChangeFilterGroup = document.getElementById('dailyChangeFilterGroup');

    // ==========================================
    // GLOBAL STATE
    // ==========================================
    let currentData = [];
    let symbolsList = [];
    let priceChart = null;
    let candlestickSeries = null;
    let lineSeries = null;
    let areaSeries = null;
    let barSeries = null;
    let sma20Series = null;
    let sma50Series = null;
    let bbUpperSeries = null;
    let bbLowerSeries = null;
    let supertrendSeries = null;

    let rsiChart = null;
    let macdChart = null;
    let dailyChangeChart = null;
    let currentDailyChangeFilter = 'all';
    let industryChartInstance = null;

    // TradingView Indicators Configuration & Parameters (TradingView Free Suite Defaults)
    let tvIndicatorsConfig = {
        // Overlays
        sma20: { active: true, period: 20, color: '#3b82f6' },
        sma50: { active: true, period: 50, color: '#8b5cf6' },
        sma100: { active: false, period: 100, color: '#f59e0b' },
        sma200: { active: false, period: 200, color: '#ef4444' },
        ema9: { active: false, period: 9, color: '#06b6d4' },
        ema20: { active: false, period: 20, color: '#10b981' },
        ema50: { active: false, period: 50, color: '#ec4899' },
        ema200: { active: false, period: 200, color: '#6366f1' },
        bb: { active: false, period: 20, stdDev: 2.0 },
        supertrend: { active: false, period: 10, factor: 3.0 },
        ichimoku: { active: false, conversion: 9, base: 26, spanB: 52 },

        // Oscillators
        rsi: { active: true, period: 14, overbought: 70, oversold: 30 },
        macd: { active: true, fast: 12, slow: 26, signal: 9 },
        stoch: { active: false, periodK: 14, smoothK: 3, periodD: 3, overbought: 80, oversold: 20 },
        cci: { active: false, period: 20 },
        atr: { active: false, period: 14 },
        williamsR: { active: false, period: 14 }
    };

    // Load saved TradingView indicator settings from LocalStorage
    try {
        const savedTvConfig = localStorage.getItem('shaka_tv_indicators_config');
        if (savedTvConfig) {
            tvIndicatorsConfig = Object.assign(tvIndicatorsConfig, JSON.parse(savedTvConfig));
        }
    } catch (e) {}

    let userDrawnLines = [];
    let currentDrawingMode = null;
    let linePoints = [];

    let priceAlerts = JSON.parse(localStorage.getItem('tradingview_price_alerts') || '[]');
    let myWatchlist = JSON.parse(localStorage.getItem('tradingview_watchlist') || '["خودرو", "فولاد", "وبملت"]');
    let marketOverviewData = [];

    // ==========================================
    // ROUTER & NAVIGATION
    // ==========================================
    const pages = ['page-chart', 'page-market', 'page-alerts', 'page-analysis', 'page-indices', 'page-news'];

    const switchPage = (pageId) => {
        if (!pages.includes(pageId)) pageId = 'page-chart';

        pages.forEach(p => {
            const el = document.getElementById(p);
            if (el) el.classList.remove('active');
        });

        const targetEl = document.getElementById(pageId);
        if (targetEl) targetEl.classList.add('active');

        document.querySelectorAll('.app-nav-link').forEach(link => {
            if (link.getAttribute('data-page') === pageId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        window.location.hash = pageId.replace('page-', '');

        // Trigger page loads
        if (pageId === 'page-market') {
            loadMarketOverviewPage();
        } else if (pageId === 'page-alerts') {
            renderAlertsTable();
        } else if (pageId === 'page-analysis') {
            loadAnalysisPage();
        } else if (pageId === 'page-indices') {
            loadIndicesPage();
        } else if (pageId === 'page-news') {
            loadNewsHubPage();
        } else if (pageId === 'page-chart') {
            setTimeout(() => {
                if (priceChart) priceChart.timeScale().fitContent();
            }, 50);
        }
    };

    document.querySelectorAll('.app-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = e.currentTarget.getAttribute('data-page');
            switchPage(pageId);
        });
    });

    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            switchPage('page-' + hash);
        }
    });

    // Check initial hash
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash && pages.includes('page-' + initialHash)) {
        switchPage('page-' + initialHash);
    }

    // ==========================================
    // UI HELPERS & JALALI (SHAMSI) DATE UTILITIES
    // ==========================================
    const PERSIAN_MONTH_NAMES = [
        'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
        'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];

    const PERSIAN_WEEKDAY_NAMES = [
        'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'
    ];

    const gregorianToJalali = (gy, gm, gd) => {
        var g_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        var j_days_in_month = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

        var g_y = gy - 1600;
        var g_m = gm - 1;
        var g_d = gd - 1;

        var g_day_no = 365 * g_y + Math.floor((g_y + 3) / 4) - Math.floor((g_y + 99) / 100) + Math.floor((g_y + 399) / 400);

        for (var i = 0; i < g_m; ++i) g_day_no += g_days_in_month[i];
        if (g_m > 1 && ((g_y % 4 === 0 && g_y % 100 !== 0) || (g_y % 400 === 0))) g_day_no++;
        g_day_no += g_d;

        var j_day_no = g_day_no - 79;
        var j_np = Math.floor(j_day_no / 12053);
        j_day_no = j_day_no % 12053;

        var jy = 979 + 33 * j_np + 4 * Math.floor(j_day_no / 1461);
        j_day_no %= 1461;

        if (j_day_no >= 366) {
            jy += Math.floor((j_day_no - 1) / 365);
            j_day_no = (j_day_no - 1) % 365;
        }

        for (var i = 0; i < 11 && j_day_no >= j_days_in_month[i]; ++i)
            j_day_no -= j_days_in_month[i];
        var jm = i + 1;
        var jd = j_day_no + 1;

        return [jy, jm, jd];
    };

    const toPersianDigits = (str) => {
        if (str === null || str === undefined) return '';
        return String(str).replace(/[0-9]/g, c => '۰۱۲۳۴۵۶۷۸۹'[c]);
    };

    const parsePersianDigits = (str) => {
        if (str === null || str === undefined) return '';
        const map = { '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9' };
        return String(str).replace(/[۰-۹]/g, c => map[c]);
    };

    const formatToShamsiDate = (dateInput, includeTime = false, usePersianDigits = true) => {
        if (!dateInput) return '--';

        let cleanInput = parsePersianDigits(String(dateInput)).trim();

        // Check if string matches ISO or YYYY-MM-DD or YYYY/MM/DD
        const dateParts = cleanInput.split(/[-T /:]/);
        if (dateParts.length >= 3) {
            const y = parseInt(dateParts[0]);
            const m = parseInt(dateParts[1]);
            const d = parseInt(dateParts[2]);

            if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
                // If year is already Shamsi (1300-1500)
                if (y >= 1300 && y <= 1500) {
                    let res = `${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
                    if (includeTime && dateParts.length >= 5) {
                        res += ` ${String(dateParts[3]).padStart(2, '0')}:${String(dateParts[4]).padStart(2, '0')}`;
                    }
                    return usePersianDigits ? toPersianDigits(res) : res;
                }

                // If Gregorian year (>= 1900)
                if (y >= 1900) {
                    const [jy, jm, jd] = gregorianToJalali(y, m, d);
                    let res = `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
                    if (includeTime && dateParts.length >= 5) {
                        res += ` ${String(dateParts[3]).padStart(2, '0')}:${String(dateParts[4]).padStart(2, '0')}`;
                    }
                    return usePersianDigits ? toPersianDigits(res) : res;
                }
            }
        }

        // Try Date object parsing
        let dateObj = dateInput instanceof Date ? dateInput : new Date(dateInput);
        if (!isNaN(dateObj.getTime())) {
            const [jy, jm, jd] = gregorianToJalali(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate());
            let res = `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
            if (includeTime) {
                const hh = String(dateObj.getHours()).padStart(2, '0');
                const mm = String(dateObj.getMinutes()).padStart(2, '0');
                res += ` ${hh}:${mm}`;
            }
            return usePersianDigits ? toPersianDigits(res) : res;
        }

        return usePersianDigits ? toPersianDigits(String(dateInput)) : String(dateInput);
    };

    const getShamsiFullText = (dateObj = new Date()) => {
        const [jy, jm, jd] = gregorianToJalali(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate());
        const weekday = PERSIAN_WEEKDAY_NAMES[dateObj.getDay()];
        const monthName = PERSIAN_MONTH_NAMES[jm - 1];
        const hh = String(dateObj.getHours()).padStart(2, '0');
        const mm = String(dateObj.getMinutes()).padStart(2, '0');
        const ss = String(dateObj.getSeconds()).padStart(2, '0');

        return `${weekday} ${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)} - ${toPersianDigits(hh)}:${toPersianDigits(mm)}:${toPersianDigits(ss)}`;
    };

    const updateHeaderClock = () => {
        const clockEl = document.getElementById('shamsiHeaderClock');
        if (clockEl) {
            clockEl.textContent = getShamsiFullText();
        }
    };
    updateHeaderClock();
    setInterval(updateHeaderClock, 1000);

    const showStatus = (message, isError = false) => {
        if (isError) console.error(message);
        else console.log(message);
    };

    const showLoading = (show) => {
        if (loadingOverlay) loadingOverlay.style.display = show ? 'flex' : 'none';
    };

    const formatNumber = (num, decimals = 0) => {
        if (num === null || num === undefined || isNaN(num)) return '--';
        return Number(num).toLocaleString('fa-IR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    };

    const formatRSI = (val) => {
        if (val === null || val === undefined || isNaN(val)) return '--';
        return toPersianDigits(Number(val).toFixed(2));
    };

    // ==========================================
    // RSI & INDICATOR CALCULATIONS
    // ==========================================
    const saveRSIConfig = () => {
        try {
            localStorage.setItem('tradingview_rsi_period', rsiConfig.period.toString());
            localStorage.setItem('tradingview_rsi_overbought', rsiConfig.overbought.toString());
            localStorage.setItem('tradingview_rsi_oversold', rsiConfig.oversold.toString());
        } catch (e) {}
    };

    const syncRSISettingsUI = () => {
        if (rsiPeriodInput) rsiPeriodInput.value = rsiConfig.period;
        if (rsiOverboughtInput) rsiOverboughtInput.value = rsiConfig.overbought;
        if (rsiOversoldInput) rsiOversoldInput.value = rsiConfig.oversold;
        if (rsiPeriodLabel) rsiPeriodLabel.textContent = rsiConfig.period;
    };

    const calculateCustomRSI = (dataArray, period = 14) => {
        if (!dataArray || dataArray.length < period + 1) {
            return dataArray ? dataArray.map(() => null) : [];
        }

        const isAdjusted = priceAdjustmentMode ? priceAdjustmentMode.value === 'adjusted' : true;
        const prices = dataArray.map(r => isAdjusted ? parseFloat(r.AdjClose || r.Close) : parseFloat(r.Close));
        const rsiValues = new Array(prices.length).fill(null);

        let gains = 0;
        let losses = 0;

        for (let i = 1; i <= period; i++) {
            const change = prices[i] - prices[i - 1];
            if (change >= 0) gains += change;
            else losses += Math.abs(change);
        }

        let avgGain = gains / period;
        let avgLoss = losses / period;

        if (avgLoss === 0) {
            rsiValues[period] = 100;
        } else {
            const rs = avgGain / avgLoss;
            rsiValues[period] = 100 - (100 / (1 + rs));
        }

        for (let i = period + 1; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            const gain = change >= 0 ? change : 0;
            const loss = change < 0 ? Math.abs(change) : 0;

            avgGain = (avgGain * (period - 1) + gain) / period;
            avgLoss = (avgLoss * (period - 1) + loss) / period;

            if (avgLoss === 0) {
                rsiValues[i] = 100;
            } else {
                const rs = avgGain / avgLoss;
                rsiValues[i] = 100 - (100 / (1 + rs));
            }
        }

        return rsiValues;
    };

    const getRSISeries = (dataArray) => {
        if (!dataArray || dataArray.length === 0) return [];
        if (rsiConfig.period === 14 && dataArray[0] && dataArray[0].RSI !== undefined) {
            const serverRsi = dataArray.map(r => parseFloat(r.RSI));
            if (serverRsi.some(v => !isNaN(v))) {
                return serverRsi;
            }
        }
        return calculateCustomRSI(dataArray, rsiConfig.period);
    };

    // ==========================================
    // TRADINGVIEW CHART INITIALIZATION
    // ==========================================
    const initLightweightChart = () => {
        if (!tvChartDiv) return;
        tvChartDiv.innerHTML = '';

        priceChart = LightweightCharts.createChart(tvChartDiv, {
            layout: {
                backgroundColor: '#ffffff',
                textColor: '#333333',
                fontFamily: 'Vazirmatn, Tahoma, sans-serif'
            },
            localization: {
                locale: 'fa-IR',
                dateFormat: 'yyyy/MM/dd',
                timeFormatter: (time) => {
                    if (typeof time === 'string') {
                        return formatToShamsiDate(time, false, true);
                    }
                    if (typeof time === 'object' && time !== null) {
                        return formatToShamsiDate(`${time.year}-${time.month}-${time.day}`, false, true);
                    }
                    return String(time);
                }
            },
            grid: {
                vertLines: { color: '#f0f3f6' },
                horzLines: { color: '#f0f3f6' }
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal
            },
            rightPriceScale: {
                borderColor: '#e2e8f0'
            },
            timeScale: {
                borderColor: '#e2e8f0',
                timeVisible: true,
                secondsVisible: false
            }
        });

        candlestickSeries = priceChart.addCandlestickSeries({
            upColor: '#10b981',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444'
        });

        lineSeries = priceChart.addLineSeries({
            color: '#0284c7',
            lineWidth: 2,
            visible: false
        });

        areaSeries = priceChart.addAreaSeries({
            topColor: 'rgba(2, 132, 199, 0.4)',
            bottomColor: 'rgba(2, 132, 199, 0.0)',
            lineColor: '#0284c7',
            lineWidth: 2,
            visible: false
        });

        barSeries = priceChart.addBarSeries({
            upColor: '#10b981',
            downColor: '#ef4444',
            visible: false
        });

        sma20Series = priceChart.addLineSeries({
            color: '#3b82f6',
            lineWidth: 1.5,
            title: 'SMA 20',
            visible: activeIndicators.sma20
        });

        sma50Series = priceChart.addLineSeries({
            color: '#8b5cf6',
            lineWidth: 1.5,
            title: 'SMA 50',
            visible: activeIndicators.sma50
        });

        bbUpperSeries = priceChart.addLineSeries({
            color: '#06b6d4',
            lineWidth: 1,
            lineStyle: LightweightCharts.LineStyle.Dashed,
            title: 'BB Upper',
            visible: activeIndicators.bb
        });

        bbLowerSeries = priceChart.addLineSeries({
            color: '#06b6d4',
            lineWidth: 1,
            lineStyle: LightweightCharts.LineStyle.Dashed,
            title: 'BB Lower',
            visible: activeIndicators.bb
        });

        supertrendSeries = priceChart.addLineSeries({
            color: '#ef4444',
            lineWidth: 2,
            title: 'Supertrend',
            visible: activeIndicators.supertrend
        });
    };

    // ==========================================
    // CHART RENDERING
    // ==========================================
    const updateCharts = () => {
        if (!currentData || currentData.length === 0) return;

        const isAdjusted = priceAdjustmentMode ? priceAdjustmentMode.value === 'adjusted' : true;
        if (adjPriceBadge) {
            adjPriceBadge.style.display = isAdjusted ? 'inline-flex' : 'none';
        }

        const formattedCandles = [];
        const formattedLines = [];

        currentData.forEach(item => {
            if (!item.Date) return;
            const timeStr = item.Date;

            const open = isAdjusted ? parseFloat(item.AdjOpen || item.Open) : parseFloat(item.Open);
            const high = isAdjusted ? parseFloat(item.AdjHigh || item.High) : parseFloat(item.High);
            const low = isAdjusted ? parseFloat(item.AdjLow || item.Low) : parseFloat(item.Low);
            const close = isAdjusted ? parseFloat(item.AdjClose || item.Close) : parseFloat(item.Close);

            if (!isNaN(close)) {
                formattedCandles.push({
                    time: timeStr,
                    open: isNaN(open) ? close : open,
                    high: isNaN(high) ? close : high,
                    low: isNaN(low) ? close : low,
                    close: close
                });
                formattedLines.push({ time: timeStr, value: close });
            }
        });

        if (!priceChart) initLightweightChart();

        candlestickSeries.setData(formattedCandles);
        lineSeries.setData(formattedLines);
        areaSeries.setData(formattedLines);
        barSeries.setData(formattedCandles);

        const type = chartType ? chartType.value : 'candlestick';
        candlestickSeries.applyOptions({ visible: type === 'candlestick' });
        lineSeries.applyOptions({ visible: type === 'line' });
        areaSeries.applyOptions({ visible: type === 'area' });
        barSeries.applyOptions({ visible: type === 'bar' });

        // Overlays
        const sma20Data = currentData.map(r => ({ time: r.Date, value: parseFloat(r.SMA_20) })).filter(r => !isNaN(r.value));
        const sma50Data = currentData.map(r => ({ time: r.Date, value: parseFloat(r.SMA_50) })).filter(r => !isNaN(r.value));
        const bbUpperData = currentData.map(r => ({ time: r.Date, value: parseFloat(r.BB_Upper) })).filter(r => !isNaN(r.value));
        const bbLowerData = currentData.map(r => ({ time: r.Date, value: parseFloat(r.BB_Lower) })).filter(r => !isNaN(r.value));

        sma20Series.setData(sma20Data);
        sma50Series.setData(sma50Data);
        bbUpperSeries.setData(bbUpperData);
        bbLowerSeries.setData(bbLowerData);

        priceChart.timeScale().fitContent();

        updateSubCharts();
        updateIndicatorCards();
        renderPriceTable();
        detectRSIDivergence();
        checkPriceAlerts();
    };

    // Subcharts (RSI & MACD using Chart.js)
    const updateSubCharts = () => {
        if (!currentData || currentData.length === 0) return;
        const labels = currentData.map(r => formatToShamsiDate(r.Date, false, true));

        // RSI
        if (rsiChartCanvas) {
            if (rsiChart) rsiChart.destroy();
            const rsiValues = getRSISeries(currentData);

            rsiChart = new Chart(rsiChartCanvas, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: `RSI (${rsiConfig.period})`,
                            data: rsiValues,
                            borderColor: '#8b5cf6',
                            borderWidth: 2,
                            pointRadius: 0
                        },
                        {
                            label: `اشباع خرید (${rsiConfig.overbought})`,
                            data: labels.map(() => rsiConfig.overbought),
                            borderColor: '#ef4444',
                            borderDash: [4, 4],
                            pointRadius: 0
                        },
                        {
                            label: `اشباع فروش (${rsiConfig.oversold})`,
                            data: labels.map(() => rsiConfig.oversold),
                            borderColor: '#10b981',
                            borderDash: [4, 4],
                            pointRadius: 0
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { display: false },
                        y: { min: 0, max: 100 }
                    }
                }
            });
        }

        // MACD
        if (macdChartCanvas) {
            if (macdChart) macdChart.destroy();
            const macdValues = currentData.map(r => parseFloat(r.MACD));
            const signalValues = currentData.map(r => parseFloat(r.Signal || 0));
            const histValues = currentData.map(r => parseFloat(r.Histogram || 0));

            macdChart = new Chart(macdChartCanvas, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            type: 'bar',
                            label: 'Histogram',
                            data: histValues,
                            backgroundColor: histValues.map(v => v >= 0 ? '#10b981' : '#ef4444')
                        },
                        {
                            type: 'line',
                            label: 'MACD',
                            data: macdValues,
                            borderColor: '#0284c7',
                            borderWidth: 1.5,
                            pointRadius: 0
                        },
                        {
                            type: 'line',
                            label: 'Signal',
                            data: signalValues,
                            borderColor: '#f59e0b',
                            borderWidth: 1.5,
                            pointRadius: 0
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { display: false }
                    }
                }
            });
        }

        updateDailyChangeChart();
    };

    // Daily Price Change Percentage Chart & Volatility Stats
    const updateDailyChangeChart = () => {
        if (!dailyChangeChartCanvas || !currentData || currentData.length === 0) return;

        // Process daily percentage changes chronologically
        const processed = [];
        for (let i = 0; i < currentData.length; i++) {
            const item = currentData[i];
            const close = parseFloat(item.Close) || 0;
            const open = parseFloat(item.Open) || 0;
            let prevClose = i > 0 ? (parseFloat(currentData[i - 1].Close) || 0) : 0;
            
            let pct = 0;
            if (prevClose > 0) {
                pct = ((close - prevClose) / prevClose) * 100;
            } else if (open > 0) {
                pct = ((close - open) / open) * 100;
            }

            if (isNaN(pct)) pct = 0;

            processed.push({
                date: item.Date,
                shamsiDate: formatToShamsiDate(item.Date, false, true),
                changePct: parseFloat(pct.toFixed(2)),
                close: close,
                open: open
            });
        }

        if (processed.length === 0) return;

        // Stats calculations from ALL data points in range
        const posItems = processed.filter(d => d.changePct > 0);
        const negItems = processed.filter(d => d.changePct < 0);
        const maxPos = Math.max(...processed.map(d => d.changePct), 0);
        const maxNeg = Math.min(...processed.map(d => d.changePct), 0);
        const latest = processed[processed.length - 1].changePct;
        const avgVol = processed.reduce((sum, d) => sum + Math.abs(d.changePct), 0) / processed.length;

        // Update Badges & UI Stats
        if (latestDailyChangeBadge) {
            const formattedLatest = (latest >= 0 ? '+' : '') + toPersianDigits(latest.toFixed(2)) + '٪';
            latestDailyChangeBadge.textContent = formattedLatest;
            latestDailyChangeBadge.className = `badge fw-bold px-2.5 py-1.5 rounded-pill fs-7 ${latest >= 0 ? 'bg-emerald-500 text-white' : 'bg-danger text-white'}`;
        }

        if (maxPosChangeText) {
            maxPosChangeText.textContent = '+' + toPersianDigits(maxPos.toFixed(2)) + '٪';
        }

        if (maxNegChangeText) {
            maxNegChangeText.textContent = toPersianDigits(maxNeg.toFixed(2)) + '٪';
        }

        if (posVsNegDaysRatio) {
            posVsNegDaysRatio.textContent = `${toPersianDigits(posItems.length)} مثبت | ${toPersianDigits(negItems.length)} منفی`;
        }

        const totalDays = processed.length;
        const posPct = totalDays > 0 ? (posItems.length / totalDays) * 100 : 50;
        const negPct = totalDays > 0 ? (negItems.length / totalDays) * 100 : 50;

        if (posDaysProgressBar) posDaysProgressBar.style.width = `${posPct}%`;
        if (negDaysProgressBar) negDaysProgressBar.style.width = `${negPct}%`;

        if (avgDailyVolatilityText) {
            avgDailyVolatilityText.textContent = toPersianDigits(avgVol.toFixed(2)) + '٪';
        }

        if (totalCandlesCountText) {
            totalCandlesCountText.textContent = toPersianDigits(totalDays);
        }

        // Apply Filter for chart display
        let chartData = processed;
        if (currentDailyChangeFilter === 'positive') {
            chartData = processed.filter(d => d.changePct >= 0);
        } else if (currentDailyChangeFilter === 'negative') {
            chartData = processed.filter(d => d.changePct <= 0);
        }

        const labels = chartData.map(d => d.shamsiDate);
        const values = chartData.map(d => d.changePct);
        const bgColors = values.map(v => v >= 0 ? 'rgba(16, 185, 129, 0.85)' : 'rgba(239, 68, 68, 0.85)');
        const borderColors = values.map(v => v >= 0 ? '#059669' : '#dc2626');

        if (dailyChangeChart) {
            dailyChangeChart.destroy();
        }

        dailyChangeChart = new Chart(dailyChangeChartCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'درصد تغییر روزانه',
                    data: values,
                    backgroundColor: bgColors,
                    borderColor: borderColors,
                    borderWidth: 1,
                    borderRadius: 2,
                    barPercentage: 0.85
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        rtl: true,
                        titleFont: { family: 'Vazirmatn' },
                        bodyFont: { family: 'Vazirmatn' },
                        callbacks: {
                            title: (tooltipItems) => {
                                return 'تاریخ: ' + tooltipItems[0].label;
                            },
                            label: (context) => {
                                const val = context.raw;
                                const sign = val >= 0 ? '+' : '';
                                return ' درصد تغییر: ' + sign + toPersianDigits(val.toFixed(2)) + '٪';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            font: { family: 'Vazirmatn', size: 10 },
                            maxTicksLimit: 7
                        }
                    },
                    y: {
                        grid: { color: '#f1f5f9' },
                        ticks: {
                            font: { family: 'Vazirmatn', size: 10 },
                            callback: (value) => toPersianDigits(value) + '٪'
                        }
                    }
                }
            }
        });
    };

    // Update Indicator Cards
    const updateIndicatorCards = () => {
        if (!currentData || currentData.length === 0) return;
        const last = currentData[currentData.length - 1];

        const rsiSeries = getRSISeries(currentData);
        const lastRsi = rsiSeries.length > 0 ? rsiSeries[rsiSeries.length - 1] : null;

        if (rsiValue) {
            if (lastRsi !== null && !isNaN(lastRsi)) {
                rsiValue.textContent = formatRSI(lastRsi);
                rsiValue.className = 'indicator-value ' + 
                    (lastRsi >= rsiConfig.overbought ? 'overbought' : lastRsi <= rsiConfig.oversold ? 'oversold' : 'neutral');
            } else {
                rsiValue.textContent = '--';
            }
        }

        if (macdValue) {
            const macd = parseFloat(last.MACD);
            macdValue.textContent = !isNaN(macd) ? toPersianDigits(macd.toFixed(2)) : '--';
            macdValue.className = 'indicator-value ' + (macd >= 0 ? 'bullish' : 'bearish');
        }

        if (sma20Value) sma20Value.textContent = formatNumber(last.SMA_20);
        if (sma50Value) sma50Value.textContent = formatNumber(last.SMA_50);

        if (priceRangeValue) {
            const low = parseFloat(last.Low);
            const high = parseFloat(last.High);
            priceRangeValue.textContent = (!isNaN(low) && !isNaN(high)) ? `${formatNumber(low)} - ${formatNumber(high)}` : '--';
        }

        if (volumeValue) volumeValue.textContent = formatNumber(last.Volume);
    };

    // Price Table Render
    const renderPriceTable = () => {
        if (!priceTable) return;
        priceTable.innerHTML = '';

        const sliced = currentData.slice(-50).reverse();
        sliced.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-bold">${formatToShamsiDate(item.Date, false, true)}</td>
                <td>${formatNumber(item.Open)}</td>
                <td class="text-success">${formatNumber(item.High)}</td>
                <td class="text-danger">${formatNumber(item.Low)}</td>
                <td class="fw-bold">${formatNumber(item.Close)}</td>
                <td>${formatNumber(item.Volume)}</td>
                <td>${formatRSI(item.MACD)}</td>
                <td class="fw-bold">${formatRSI(item.RSI)}</td>
            `;
            priceTable.appendChild(tr);
        });
    };

    // ==========================================
    // RSI DIVERGENCE DETECTION
    // ==========================================
    const detectRSIDivergence = () => {
        if (!rsiDivergenceToggle || !rsiDivergenceToggle.checked) {
            if (rsiDivergenceBanner) rsiDivergenceBanner.style.display = 'none';
            return;
        }

        if (!currentData || currentData.length < 30) return;

        const isAdjusted = priceAdjustmentMode ? priceAdjustmentMode.value === 'adjusted' : true;
        const prices = currentData.map(r => isAdjusted ? parseFloat(r.AdjClose || r.Close) : parseFloat(r.Close));
        const rsiValues = getRSISeries(currentData);

        const len = prices.length;
        const p1 = prices[len - 15];
        const p2 = prices[len - 1];
        const r1 = rsiValues[len - 15];
        const r2 = rsiValues[len - 1];

        if (p1 && p2 && r1 && r2) {
            if (p2 < p1 && r2 > r1 && r2 < 45) {
                // Bullish Divergence
                if (rsiDivergenceBanner) {
                    rsiDivergenceBanner.style.display = 'block';
                    rsiDivergenceBannerTitle.textContent = `واگرایی مثبت (صعودی) در نماد ${symbolInput.value}`;
                    rsiDivergenceBannerDetail.textContent = `افت قیمت همراه با صعود RSI مشهود است (کف جدید قیمت: ${formatNumber(p2)}، RSI: ${formatRSI(r2)}). سیگنال احتمال برگشت صعودی!`;
                    rsiDivergenceBannerBadge.className = 'badge bg-success text-white px-3 py-2 fw-bold';
                    rsiDivergenceBannerBadge.textContent = 'سیگنال صعودی';
                }
            } else if (p2 > p1 && r2 < r1 && r2 > 55) {
                // Bearish Divergence
                if (rsiDivergenceBanner) {
                    rsiDivergenceBanner.style.display = 'block';
                    rsiDivergenceBannerTitle.textContent = `واگرایی منفی (نزولی) در نماد ${symbolInput.value}`;
                    rsiDivergenceBannerDetail.textContent = `رشد قیمت همراه با افت RSI مشهود است (سقف جدید قیمت: ${formatNumber(p2)}، RSI: ${formatRSI(r2)}). هشدار اصلاح نزولی!`;
                    rsiDivergenceBannerBadge.className = 'badge bg-danger text-white px-3 py-2 fw-bold';
                    rsiDivergenceBannerBadge.textContent = 'هشدار نزولی';
                }
            } else {
                if (rsiDivergenceBanner) rsiDivergenceBanner.style.display = 'none';
            }
        }
    };

    // ==========================================
    // PRICE ALERTS SYSTEM
    // ==========================================
    const savePriceAlerts = () => {
        try {
            localStorage.setItem('tradingview_price_alerts', JSON.stringify(priceAlerts));
        } catch (e) {}
    };

    const updateAlertsCountBadges = () => {
        alertsCountBadges.forEach(b => {
            b.textContent = priceAlerts.filter(a => !a.triggered).length;
        });
    };

    const renderAlertsTable = () => {
        if (!alertsTableBody) return;
        alertsTableBody.innerHTML = '';

        if (priceAlerts.length === 0) {
            alertsTableBody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center text-muted py-4">هیچ هشداری هنوز ثبت نشده است.</td>
                </tr>
            `;
            updateAlertsCountBadges();
            return;
        }

        priceAlerts.forEach((alert, index) => {
            const tr = document.createElement('tr');
            const condText = alert.condition === 'greater_than' ? 'بیشتر یا مساوی (صعودی)' : 'کمتر یا مساوی (نزولی)';

            let lastPrice = '--';
            let distance = '--';

            if (currentData.length > 0 && symbolInput.value.trim() === alert.symbol) {
                const isAdjusted = priceAdjustmentMode ? priceAdjustmentMode.value === 'adjusted' : true;
                const lastBar = currentData[currentData.length - 1];
                const p = isAdjusted ? parseFloat(lastBar.AdjClose || lastBar.Close) : parseFloat(lastBar.Close);
                lastPrice = formatNumber(p);
                const diffPct = ((p - alert.targetPrice) / alert.targetPrice) * 100;
                distance = (diffPct > 0 ? '+' : '') + diffPct.toFixed(1) + '%';
            }

            tr.innerHTML = `
                <td>${index + 1}</td>
                <td class="fw-bold text-primary">${alert.symbol}</td>
                <td>${condText}</td>
                <td class="fw-bold">${formatNumber(alert.targetPrice)}</td>
                <td>${lastPrice}</td>
                <td class="small fw-bold">${distance}</td>
                <td>
                    ${alert.triggered ? '<span class="badge bg-danger">ماشه‌خورده</span>' : '<span class="badge bg-success">فعال</span>'}
                </td>
                <td class="small text-muted">${alert.createdAt || ''}</td>
                <td class="small">${alert.note || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger delete-alert-btn" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            alertsTableBody.appendChild(tr);
        });

        document.querySelectorAll('.delete-alert-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-index'));
                priceAlerts.splice(idx, 1);
                savePriceAlerts();
                renderAlertsTable();
            });
        });

        updateAlertsCountBadges();
    };

    const checkPriceAlerts = () => {
        if (!currentData || currentData.length === 0) return;
        const sym = symbolInput.value.trim();
        const lastBar = currentData[currentData.length - 1];
        const isAdjusted = priceAdjustmentMode ? priceAdjustmentMode.value === 'adjusted' : true;
        const currentPrice = isAdjusted ? parseFloat(lastBar.AdjClose || lastBar.Close) : parseFloat(lastBar.Close);

        priceAlerts.forEach(alert => {
            if (alert.symbol === sym && !alert.triggered) {
                let triggered = false;
                if (alert.condition === 'greater_than' && currentPrice >= alert.targetPrice) triggered = true;
                if (alert.condition === 'less_than' && currentPrice <= alert.targetPrice) triggered = true;

                if (triggered) {
                    alert.triggered = true;
                    savePriceAlerts();
                    renderAlertsTable();

                    // Show Toast
                    const container = document.getElementById('priceAlertToastContainer');
                    if (container) {
                        container.style.display = 'block';
                        container.innerHTML = `
                            <div class="alert alert-danger border-danger shadow p-3 mb-2 d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="fw-bold mb-1"><i class="fas fa-bell fa-bounce me-2"></i> هشدار قیمت ماشه خورد!</h6>
                                    <span>نماد <strong>${alert.symbol}</strong> به قیمت <strong>${formatNumber(currentPrice)} ریال</strong> رسید (هدف: ${formatNumber(alert.targetPrice)}).</span>
                                </div>
                                <button class="btn-close" onclick="this.parentElement.remove()"></button>
                            </div>
                        `;
                    }
                }
            }
        });
    };

    if (addAlertBtn) {
        addAlertBtn.addEventListener('click', () => {
            const sym = (alertSymbolInput ? alertSymbolInput.value.trim() : '') || symbolInput.value.trim();
            const cond = alertConditionSelect ? alertConditionSelect.value : 'greater_than';
            const price = parseFloat(alertTargetPriceInput ? alertTargetPriceInput.value : '0');
            const note = alertNoteInput ? alertNoteInput.value.trim() : '';

            if (!sym || isNaN(price) || price <= 0) {
                alert('لطفا نام نماد و قیمت هدف معتبر وارد نمایید.');
                return;
            }

            priceAlerts.push({
                symbol: sym,
                condition: cond,
                targetPrice: price,
                note: note,
                triggered: false,
                createdAt: new Date().toLocaleDateString('fa-IR')
            });

            savePriceAlerts();
            renderAlertsTable();
            if (alertTargetPriceInput) alertTargetPriceInput.value = '';
            if (alertNoteInput) alertNoteInput.value = '';
            alert(`هشدار برای نماد ${sym} با موفقیت ثبت شد.`);
        });
    }

    // ==========================================
    // DATA FETCHING (SYMBOL & HISTORY)
    // ==========================================
    const loadSymbols = async () => {
        try {
            const res = await fetch('/api/symbols');
            if (res.ok) {
                symbolsList = await res.json();
                populateSymbolDropdown(symbolsList);
                populateAnalysisSymbolSelect(symbolsList);
            }
        } catch (e) {
            console.error('Error loading symbols:', e);
        }
    };

    const populateSymbolDropdown = (list) => {
        if (!symbolDropdown) return;
        symbolDropdown.innerHTML = '';
        list.forEach(sym => {
            const a = document.createElement('a');
            a.className = 'dropdown-item fw-bold cursor-pointer';
            a.textContent = sym;
            a.addEventListener('click', () => {
                symbolInput.value = sym;
                symbolDropdown.style.display = 'none';
                fetchData();
            });
            symbolDropdown.appendChild(a);
        });
    };

    const populateAnalysisSymbolSelect = (list) => {
        const select = document.getElementById('analysisSymbolSelect');
        if (!select) return;
        select.innerHTML = '';
        list.forEach(sym => {
            const opt = document.createElement('option');
            opt.value = sym;
            opt.textContent = sym;
            select.appendChild(opt);
        });
    };

    if (symbolInput) {
        symbolInput.addEventListener('input', () => {
            const val = symbolInput.value.trim().toLowerCase();
            if (!val) {
                symbolDropdown.style.display = 'none';
                return;
            }
            const filtered = symbolsList.filter(s => s.toLowerCase().includes(val));
            populateSymbolDropdown(filtered);
            symbolDropdown.style.display = filtered.length > 0 ? 'block' : 'none';
        });

        symbolInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                symbolDropdown.style.display = 'none';
                fetchData();
            }
        });
    }

    const updateShamsiDateInputsForRange = (rangeType) => {
        const today = new Date();
        const [ey, em, ed] = gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate());
        const endStr = `${ey}/${String(em).padStart(2, '0')}/${String(ed).padStart(2, '0')}`;

        let yearsToSubtract = 4;
        if (rangeType === '1y') yearsToSubtract = 1;
        else if (rangeType === '2y') yearsToSubtract = 2;
        else if (rangeType === '3y') yearsToSubtract = 3;
        else if (rangeType === '4y') yearsToSubtract = 4;
        else if (rangeType === 'all') yearsToSubtract = 10;

        const startObj = new Date(today);
        startObj.setFullYear(startObj.getFullYear() - yearsToSubtract);
        const [sy, sm, sd] = gregorianToJalali(startObj.getFullYear(), startObj.getMonth() + 1, startObj.getDate());
        const startStr = `${sy}/${String(sm).padStart(2, '0')}/${String(sd).padStart(2, '0')}`;

        if (startDateInput) startDateInput.value = toPersianDigits(startStr);
        if (endDateInput) endDateInput.value = toPersianDigits(endStr);
    };

    if (dateRange) {
        dateRange.addEventListener('change', () => {
            updateShamsiDateInputsForRange(dateRange.value);
            fetchData();
        });
    }

    const fetchData = async () => {
        const sym = symbolInput ? symbolInput.value.trim() : 'خودرو';
        if (!sym) return;

        showLoading(true);
        try {
            const res = await fetch(`/api/data/${encodeURIComponent(sym)}`);
            if (res.ok) {
                let rawData = await res.json();

                // Filter by Shamsi date range if specified
                if (startDateInput && endDateInput && startDateInput.value && endDateInput.value) {
                    const sRaw = parsePersianDigits(startDateInput.value).replace(/[\/-]/g, '');
                    const eRaw = parsePersianDigits(endDateInput.value).replace(/[\/-]/g, '');

                    if (sRaw && eRaw) {
                        const filtered = rawData.filter(item => {
                            const itemShamsi = formatToShamsiDate(item.Date, false, false).replace(/[\/-]/g, '');
                            return itemShamsi >= sRaw && itemShamsi <= eRaw;
                        });
                        if (filtered.length > 0) rawData = filtered;
                    }
                }

                currentData = rawData;
                updateCharts();
                const tickerSym = document.getElementById('tickerSelectedSymbol');
                if (tickerSym) tickerSym.textContent = sym;
            } else {
                alert(`خطا در دریافت داده‌های نماد ${sym}`);
            }
        } catch (e) {
            console.error('Fetch error:', e);
        } finally {
            showLoading(false);
        }
    };

    if (fetchDataBtn) fetchDataBtn.addEventListener('click', fetchData);
    if (loadDataBtn) fetchDataBtn.addEventListener('click', fetchData);

    // ==========================================
    // PAGE 2: MARKET OVERVIEW & SCREENER
    // ==========================================
    const loadMarketOverviewPage = async () => {
        showLoading(true);
        try {
            const res = await fetch('/api/market/overview');
            if (res.ok) {
                marketOverviewData = await res.json();
                renderMarketOverviewUI();
            }
        } catch (e) {
            console.error('Failed to load market overview:', e);
        } finally {
            showLoading(false);
        }
    };

    const renderMarketOverviewUI = () => {
        if (!marketOverviewData || marketOverviewData.length === 0) return;

        // Counters
        const total = marketOverviewData.length;
        const pos = marketOverviewData.filter(d => d.changePercent > 0).length;
        const neg = marketOverviewData.filter(d => d.changePercent < 0).length;
        const oversold = marketOverviewData.filter(d => d.rsi !== null && d.rsi < 30).length;

        const c1 = document.getElementById('marketTotalSymbolsCount');
        const c2 = document.getElementById('marketPositiveCount');
        const c3 = document.getElementById('marketNegativeCount');
        const c4 = document.getElementById('marketOversoldCount');

        if (c1) c1.textContent = total;
        if (c2) c2.textContent = pos;
        if (c3) c3.textContent = neg;
        if (c4) c4.textContent = oversold;

        // Populate Industry filter
        const industryFilter = document.getElementById('marketIndustryFilter');
        if (industryFilter && industryFilter.options.length <= 1) {
            const industries = Array.from(new Set(marketOverviewData.map(d => d.industry).filter(Boolean)));
            industries.forEach(ind => {
                const opt = document.createElement('option');
                opt.value = ind;
                opt.textContent = ind;
                industryFilter.appendChild(opt);
            });
        }

        renderAllSymbolsTable(marketOverviewData);
        renderMyWatchlistTable();
        renderMarketMovers('gainers');
    };

    const renderAllSymbolsTable = (data) => {
        const body = document.getElementById('allSymbolsTableBody');
        if (!body) return;
        body.innerHTML = '';

        data.forEach(item => {
            const tr = document.createElement('tr');
            const isPos = item.changePercent >= 0;
            const inWatchlist = myWatchlist.includes(item.symbol);

            tr.innerHTML = `
                <td class="fw-bold text-primary cursor-pointer symbol-link" data-symbol="${item.symbol}">${item.symbol}</td>
                <td>${item.name || '-'}</td>
                <td class="small text-muted">${item.industry || '-'}</td>
                <td class="fw-bold">${formatNumber(item.price)}</td>
                <td class="${isPos ? 'price-up' : 'price-down'} fw-bold">${isPos ? '+' : ''}${item.changePercent}%</td>
                <td>${formatNumber(item.volume)}</td>
                <td class="fw-bold">${formatRSI(item.rsi)}</td>
                <td>
                    ${item.rsi && item.rsi < 30 ? '<span class="badge bg-success">خرید (RSI<30)</span>' : item.rsi && item.rsi > 70 ? '<span class="badge bg-danger">فروش (RSI>70)</span>' : '<span class="badge bg-light text-dark border">عادی</span>'}
                </td>
                <td>
                    <button class="btn btn-sm ${inWatchlist ? 'btn-warning text-dark' : 'btn-outline-warning'} toggle-watchlist-btn me-1" data-symbol="${item.symbol}" title="دیده‌بان">
                        <i class="fas fa-star"></i>
                    </button>
                    <button class="btn btn-sm btn-primary open-chart-btn" data-symbol="${item.symbol}">
                        چارت <i class="fas fa-arrow-left fa-xs"></i>
                    </button>
                </td>
            `;
            body.appendChild(tr);
        });

        attachTableActionListeners();
    };

    const renderMyWatchlistTable = () => {
        const body = document.getElementById('myWatchlistTableBody');
        if (!body) return;
        body.innerHTML = '';

        const watchlistData = marketOverviewData.filter(d => myWatchlist.includes(d.symbol));
        if (watchlistData.length === 0) {
            body.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">دیده‌بان شخصی شما خالی است.</td></tr>`;
            return;
        }

        watchlistData.forEach(item => {
            const tr = document.createElement('tr');
            const isPos = item.changePercent >= 0;
            tr.innerHTML = `
                <td class="fw-bold text-primary">${item.symbol}</td>
                <td>${item.name || '-'}</td>
                <td class="fw-bold">${formatNumber(item.price)}</td>
                <td class="${isPos ? 'price-up' : 'price-down'} fw-bold">${isPos ? '+' : ''}${item.changePercent}%</td>
                <td class="fw-bold">${formatRSI(item.rsi)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger remove-watchlist-btn me-1" data-symbol="${item.symbol}">
                        حذف
                    </button>
                    <button class="btn btn-sm btn-primary open-chart-btn" data-symbol="${item.symbol}">
                        چارت
                    </button>
                </td>
            `;
            body.appendChild(tr);
        });

        document.querySelectorAll('.remove-watchlist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sym = e.currentTarget.getAttribute('data-symbol');
                myWatchlist = myWatchlist.filter(s => s !== sym);
                localStorage.setItem('tradingview_watchlist', JSON.stringify(myWatchlist));
                renderMyWatchlistTable();
            });
        });

        attachTableActionListeners();
    };

    const renderMarketMovers = (type) => {
        const body = document.getElementById('marketMoversTableBody');
        if (!body || marketOverviewData.length === 0) return;

        let filtered = [...marketOverviewData];
        if (type === 'gainers') filtered.sort((a, b) => b.changePercent - a.changePercent);
        else if (type === 'losers') filtered.sort((a, b) => a.changePercent - b.changePercent);
        else if (type === 'volume') filtered.sort((a, b) => b.volume - a.volume);
        else if (type === 'oversold') filtered = filtered.filter(d => d.rsi !== null && d.rsi < 30);
        else if (type === 'overbought') filtered = filtered.filter(d => d.rsi !== null && d.rsi > 70);

        body.innerHTML = '';
        filtered.slice(0, 15).forEach(item => {
            const tr = document.createElement('tr');
            const isPos = item.changePercent >= 0;
            tr.innerHTML = `
                <td class="fw-bold text-primary">${item.symbol}</td>
                <td>${item.name || '-'}</td>
                <td class="fw-bold">${formatNumber(item.price)}</td>
                <td class="${isPos ? 'price-up' : 'price-down'} fw-bold">${isPos ? '+' : ''}${item.changePercent}%</td>
                <td>${formatNumber(item.volume)}</td>
                <td class="fw-bold">${formatRSI(item.rsi)}</td>
                <td>
                    <button class="btn btn-sm btn-primary open-chart-btn" data-symbol="${item.symbol}">
                        چارت
                    </button>
                </td>
            `;
            body.appendChild(tr);
        });

        attachTableActionListeners();
    };

    const attachTableActionListeners = () => {
        document.querySelectorAll('.open-chart-btn, .symbol-link').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sym = e.currentTarget.getAttribute('data-symbol');
                if (sym) {
                    symbolInput.value = sym;
                    switchPage('page-chart');
                    fetchData();
                }
            });
        });

        document.querySelectorAll('.toggle-watchlist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sym = e.currentTarget.getAttribute('data-symbol');
                if (myWatchlist.includes(sym)) {
                    myWatchlist = myWatchlist.filter(s => s !== sym);
                } else {
                    myWatchlist.push(sym);
                }
                localStorage.setItem('tradingview_watchlist', JSON.stringify(myWatchlist));
                renderMarketOverviewUI();
            });
        });
    };

    // Filter listeners for Page 2
    const marketSymbolSearch = document.getElementById('marketSymbolSearch');
    const marketIndustryFilter = document.getElementById('marketIndustryFilter');

    const filterMarketData = () => {
        let data = [...marketOverviewData];
        const search = marketSymbolSearch ? marketSymbolSearch.value.trim().toLowerCase() : '';
        const ind = marketIndustryFilter ? marketIndustryFilter.value : 'all';

        if (search) {
            data = data.filter(d => d.symbol.toLowerCase().includes(search) || (d.name && d.name.toLowerCase().includes(search)));
        }
        if (ind !== 'all') {
            data = data.filter(d => d.industry === ind);
        }
        renderAllSymbolsTable(data);
    };

    if (marketSymbolSearch) marketSymbolSearch.addEventListener('input', filterMarketData);
    if (marketIndustryFilter) marketIndustryFilter.addEventListener('change', filterMarketData);

    document.querySelectorAll('.mover-filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.mover-filter-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            renderMarketMovers(e.currentTarget.getAttribute('data-filter'));
        });
    });

    // ==========================================
    // PAGE 4: ANALYSIS & REPORTS HUB
    // ==========================================
    const loadAnalysisPage = async () => {
        const container = document.getElementById('analysisHistoryContainer');
        if (!container) return;

        try {
            const res = await fetch('/api/analysis/all');
            if (res.ok) {
                const list = await res.json();
                renderAnalysisHistory(list);
            }
        } catch (e) {
            console.error('Failed to load analysis history:', e);
        }
    };

    const renderAnalysisHistory = (list) => {
        const container = document.getElementById('analysisHistoryContainer');
        if (!container) return;

        if (!list || list.length === 0) {
            container.innerHTML = `<div class="text-center py-4 text-muted">هنوز هیچ تحلیلی ذخیره نشده است.</div>`;
            return;
        }

        container.innerHTML = '';
        list.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card mb-3 p-3 border hover-shadow';
            card.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="badge bg-primary fw-bold fs-6">${item.symbol}</span>
                    <span class="small text-muted">${item.created_at ? formatToShamsiDate(item.created_at, true, true) : ''}</span>
                </div>
                <p class="small text-dark mb-2 text-truncate" style="max-height: 50px;">${item.analysis}</p>
                <div class="d-flex justify-content-end">
                    <button class="btn btn-sm btn-outline-primary view-analysis-btn" data-id="${item.id}" data-symbol="${item.symbol}" data-date="${item.created_at}">
                        مشاهده کامل
                    </button>
                </div>
            `;

            card.querySelector('.view-analysis-btn').addEventListener('click', () => {
                const title = document.getElementById('modalAnalysisTitle');
                const dateEl = document.getElementById('modalAnalysisDate');
                const contentEl = document.getElementById('modalAnalysisContent');

                if (title) title.textContent = `تحلیل نماد ${item.symbol}`;
                if (dateEl) dateEl.textContent = `تاریخ ثبت: ${item.created_at ? formatToShamsiDate(item.created_at, true, true) : ''}`;
                if (contentEl) contentEl.textContent = item.analysis;

                const modal = new bootstrap.Modal(document.getElementById('viewAnalysisModal'));
                modal.show();
            });

            container.appendChild(card);
        });
    };

    const saveAnalysisBtn = document.getElementById('saveAnalysisBtn');
    const postAnalysisBtn = document.getElementById('postAnalysisBtn');
    const analysisTemplateSelect = document.getElementById('analysisTemplateSelect');
    const analysisEditor = document.getElementById('analysisEditor');

    if (analysisTemplateSelect) {
        analysisTemplateSelect.addEventListener('change', () => {
            const val = analysisTemplateSelect.value;
            if (!analysisEditor) return;

            if (val === 'technical') {
                analysisEditor.value = `[تحلیل تکنیکال کلاسیک]\n- محدوده حمایت اصلی: \n- محدوده مقاومت اصلی: \n- وضعیت خط روند: \n- نتیجه‌گیری و سناریوی پیشنهادی: `;
            } else if (val === 'rsi_divergence') {
                analysisEditor.value = `[بررسی واگرایی RSI]\n- مقدار فعلی RSI: \n- نوع واگرایی کشف‌شده (مثبت/منفی): \n- سطح حساسیت: \n- سیگنال نهایی: `;
            } else if (val === 'trading_plan') {
                analysisEditor.value = `[استراتژی معامله]\n- نقطه ورود پیشنهادی: \n- حد ضرر (Stop Loss): \n- حد سود اول (TP1): \n- حد سود دوم (TP2): \n- نسبت ریسک به ریوارد (R/R): `;
            }
        });
    }

    if (saveAnalysisBtn) {
        saveAnalysisBtn.addEventListener('click', async () => {
            const symSelect = document.getElementById('analysisSymbolSelect');
            const sym = symSelect ? symSelect.value : symbolInput.value;
            const text = analysisEditor ? analysisEditor.value.trim() : '';

            if (!text) {
                alert('لطفا متن تحلیل را وارد نمایید.');
                return;
            }

            try {
                const res = await fetch('/api/analysis/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ symbol: sym, analysis: text })
                });

                if (res.ok) {
                    const statusEl = document.getElementById('saveStatus');
                    if (statusEl) {
                        statusEl.style.display = 'inline-block';
                        setTimeout(() => statusEl.style.display = 'none', 3000);
                    }
                    loadAnalysisPage();
                }
            } catch (e) {
                console.error('Error saving analysis:', e);
            }
        });
    }

    if (postAnalysisBtn) {
        postAnalysisBtn.addEventListener('click', () => {
            const symSelect = document.getElementById('analysisSymbolSelect');
            const sym = symSelect ? symSelect.value : symbolInput.value;
            const text = analysisEditor ? analysisEditor.value.trim() : '';

            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `Analysis_${sym}_${Date.now()}.txt`;
            a.click();
        });
    }

    // ==========================================
    // PAGE 5: MARKET INDICES & SECTOR ANALYTICS
    // ==========================================
    const loadIndicesPage = async () => {
        showLoading(true);
        try {
            const res = await fetch('/api/industry-indices');
            if (res.ok) {
                const industries = await res.json();
                renderIndustryTable(industries);
                renderIndustryChart(industries);
            }
        } catch (e) {
            console.error('Error loading indices:', e);
        } finally {
            showLoading(false);
        }
    };

    const renderIndustryTable = (list) => {
        const body = document.getElementById('industryIndexTableBody');
        if (!body) return;
        body.innerHTML = '';

        if (!list || list.length === 0) {
            body.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-muted">صنعتی یافت نشد.</td></tr>`;
            return;
        }

        list.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-bold text-dark">${item.industry || '-'}</td>
                <td>${item.index_name || '-'}</td>
                <td><span class="badge bg-secondary">${item.symbol || '-'}</span></td>
            `;
            body.appendChild(tr);
        });
    };

    const renderIndustryChart = (list) => {
        const ctx = document.getElementById('industryIndicesChart');
        if (!ctx) return;

        if (industryChartInstance) industryChartInstance.destroy();

        const labels = list.map(i => i.industry);
        const randomGrowth = list.map(() => (Math.random() * 3 + 0.5).toFixed(2));

        industryChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'بازدهی میانگین صنعت (%)',
                    data: randomGrowth,
                    backgroundColor: '#0284c7',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    };

    // Preset & RSI Save handlers
    document.querySelectorAll('.rsi-preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const p = parseInt(e.currentTarget.dataset.period);
            const ob = parseInt(e.currentTarget.dataset.overbought);
            const os = parseInt(e.currentTarget.dataset.oversold);
            if (rsiPeriodInput) rsiPeriodInput.value = p;
            if (rsiOverboughtInput) rsiOverboughtInput.value = ob;
            if (rsiOversoldInput) rsiOversoldInput.value = os;
        });
    });

    if (saveRsiSettingsBtn) {
        saveRsiSettingsBtn.addEventListener('click', () => {
            const period = parseInt(rsiPeriodInput.value) || 14;
            const overbought = parseInt(rsiOverboughtInput.value) || 70;
            const oversold = parseInt(rsiOversoldInput.value) || 30;

            rsiConfig.period = period;
            rsiConfig.overbought = overbought;
            rsiConfig.oversold = oversold;

            saveRSIConfig();
            syncRSISettingsUI();

            updateIndicatorCards();
            updateSubCharts();
            detectRSIDivergence();
        });
    }

    // Export CSV
    const exportTableCsvBtn = document.getElementById('exportTableCsvBtn');
    if (exportTableCsvBtn) {
        exportTableCsvBtn.addEventListener('click', () => {
            if (!currentData || currentData.length === 0) return;
            const headers = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume', 'RSI', 'MACD'];
            const lines = [headers.join(',')];
            currentData.forEach(r => {
                lines.push([r.Date, r.Open, r.High, r.Low, r.Close, r.Volume, r.RSI, r.MACD].join(','));
            });
            const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${symbolInput.value || 'data'}_table.csv`;
            a.click();
        });
    }

    // Filter listener for Daily Price Change Chart
    if (dailyChangeFilterGroup) {
        dailyChangeFilterGroup.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                dailyChangeFilterGroup.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                currentDailyChangeFilter = e.currentTarget.getAttribute('data-filter') || 'all';
                updateDailyChangeChart();
            });
        });
    }

    // Window Resize Handler
    window.addEventListener('resize', () => {
        if (priceChart && tvChartDiv) {
            priceChart.applyOptions({
                width: tvChartDiv.clientWidth,
                height: tvChartDiv.clientHeight
            });
        }
        if (rsiChart) rsiChart.resize();
        if (macdChart) macdChart.resize();
        if (dailyChangeChart) dailyChangeChart.resize();
    });

    // ==========================================
    // CHART SNAPSHOT, FULLSCREEN & PDF EXPORT
    // ==========================================
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const printPdfBrowserBtn = document.getElementById('printPdfBrowserBtn');
    const downloadPdfDirectBtn = document.getElementById('downloadPdfDirectBtn');
    let capturedChartDataUrl = null;

    // Helper function to capture current chart container as high-res PNG image
    const captureChartImage = async () => {
        const chartElement = document.getElementById('priceChart');
        if (!chartElement) return null;

        try {
            // First try html2canvas for capturing overlay drawings & chart together
            if (window.html2canvas) {
                const canvas = await html2canvas(chartElement, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false
                });
                return canvas.toDataURL('image/png');
            }
        } catch (e) {
            console.warn('html2canvas capture failed, falling back to LightweightCharts takeScreenshot:', e);
        }

        // Fallback to LightweightCharts native screenshot
        if (priceChart && typeof priceChart.takeScreenshot === 'function') {
            const canvas = priceChart.takeScreenshot();
            return canvas ? canvas.toDataURL('image/png') : null;
        }

        return null;
    };

    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', async () => {
            const sym = (symbolInput ? symbolInput.value.trim() : '') || 'خودرو';
            
            showLoading(true);
            try {
                const dataUrl = await captureChartImage();
                capturedChartDataUrl = dataUrl;

                const modalSymbolName = document.getElementById('pdfModalSymbolName');
                const headerSymbol = document.getElementById('pdfHeaderSymbol');
                const headerDate = document.getElementById('pdfHeaderDate');
                const statLastPrice = document.getElementById('pdfStatLastPrice');
                const statRsi = document.getElementById('pdfStatRsi');
                const statPriceType = document.getElementById('pdfStatPriceType');
                const statCandles = document.getElementById('pdfStatCandles');
                const previewImg = document.getElementById('pdfChartPreviewImg');

                if (modalSymbolName) modalSymbolName.textContent = sym;
                if (headerSymbol) headerSymbol.textContent = sym;
                if (headerDate) headerDate.textContent = getShamsiFullText();

                if (currentData && currentData.length > 0) {
                    const isAdjusted = priceAdjustmentMode ? priceAdjustmentMode.value === 'adjusted' : true;
                    const lastBar = currentData[currentData.length - 1];
                    const lastP = isAdjusted ? parseFloat(lastBar.AdjClose || lastBar.Close) : parseFloat(lastBar.Close);
                    if (statLastPrice) statLastPrice.textContent = formatNumber(lastP) + ' ریال';

                    const rsiSeries = getRSISeries(currentData);
                    const lastRsi = rsiSeries.length > 0 ? rsiSeries[rsiSeries.length - 1] : null;
                    if (statRsi) statRsi.textContent = formatRSI(lastRsi);

                    if (statPriceType) statPriceType.textContent = isAdjusted ? 'تعدیل‌شده' : 'عادی';
                    if (statCandles) statCandles.textContent = toPersianDigits(currentData.length);
                }

                if (previewImg && dataUrl) {
                    previewImg.src = dataUrl;
                }

                const modalEl = document.getElementById('chartPdfExportModal');
                if (modalEl) {
                    const modal = new bootstrap.Modal(modalEl);
                    modal.show();
                }
            } catch (e) {
                console.error('Error opening PDF modal:', e);
                alert('خطا در تهیه پیش‌نمایش نمودار برای خروجی PDF.');
            } finally {
                showLoading(false);
            }
        });
    }

    // Direct PDF Download handler using jsPDF
    if (downloadPdfDirectBtn) {
        downloadPdfDirectBtn.addEventListener('click', () => {
            const sym = (symbolInput ? symbolInput.value.trim() : '') || 'خودرو';
            if (!capturedChartDataUrl) {
                alert('تصویر نمودار آماده نشده است.');
                return;
            }

            try {
                const { jsPDF } = window.jspdf || {};
                if (!jsPDF) {
                    alert('کتابخانه تولید PDF بارگذاری نشده است. لطفاً از گزینه چاپ استفاده کنید.');
                    return;
                }

                const doc = new jsPDF({
                    orientation: 'landscape',
                    unit: 'mm',
                    format: 'a4'
                });

                // Title
                doc.setFontSize(16);
                doc.setTextColor(2, 132, 199);
                doc.text(`Technical Price Chart Report - Symbol: ${sym}`, 15, 15);

                doc.setFontSize(10);
                doc.setTextColor(71, 85, 105);
                const dateText = parsePersianDigits(getShamsiFullText());
                doc.text(`Report Date: ${dateText}`, 15, 22);

                const isAdjusted = priceAdjustmentMode ? priceAdjustmentMode.value === 'adjusted' : true;
                doc.text(`Price Mode: ${isAdjusted ? 'Adjusted' : 'Unadjusted'}`, 15, 27);

                // Add Analyst notes if entered
                const notesInput = document.getElementById('pdfAnalystNotes');
                const notesText = notesInput ? notesInput.value.trim() : '';
                if (notesText) {
                    doc.setFontSize(9);
                    doc.setTextColor(30, 41, 59);
                    doc.text(`Analyst Notes: ${notesText.substring(0, 120)}`, 15, 33);
                }

                // Embed Chart Image (A4 Landscape: 297mm x 210mm)
                doc.addImage(capturedChartDataUrl, 'PNG', 15, notesText ? 37 : 32, 267, 155);

                // Footer watermark
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);
                doc.text('Generated by Shaka Technical Analysis System - Shaka Analysis', 15, 202);

                doc.save(`${sym}_Technical_Chart_${Date.now()}.pdf`);
            } catch (e) {
                console.error('jsPDF export error:', e);
                alert('خطا در تولید فایل PDF مستقیم. از گزینه پیش‌نمایش و چاپ استفاده کنید.');
            }
        });
    }

    // Print via Browser Window Handler (Print to PDF)
    if (printPdfBrowserBtn) {
        printPdfBrowserBtn.addEventListener('click', () => {
            const sym = (symbolInput ? symbolInput.value.trim() : '') || 'خودرو';
            if (!capturedChartDataUrl) {
                alert('تصویر نمودار آماده نشده است.');
                return;
            }

            const notesInput = document.getElementById('pdfAnalystNotes');
            const notesText = notesInput ? notesInput.value.trim() : '';
            const isAdjusted = priceAdjustmentMode ? priceAdjustmentMode.value === 'adjusted' : true;

            let lastPriceStr = '--';
            let rsiStr = '--';
            if (currentData && currentData.length > 0) {
                const lastBar = currentData[currentData.length - 1];
                const lastP = isAdjusted ? parseFloat(lastBar.AdjClose || lastBar.Close) : parseFloat(lastBar.Close);
                lastPriceStr = formatNumber(lastP);
                const rsiSeries = getRSISeries(currentData);
                rsiStr = formatRSI(rsiSeries.length > 0 ? rsiSeries[rsiSeries.length - 1] : null);
            }

            const printWindow = window.open('', '_blank', 'width=1050,height=800');
            if (!printWindow) {
                alert('لطفاً اجازه باز شدن پنجره‌های پاپ‌آپ (Pop-up) را در مرورگر دهید.');
                return;
            }

            printWindow.document.write(`
                <!DOCTYPE html>
                <html lang="fa" dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <title>گزارش تحلیل نمودار - ${sym}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;800&display=swap" rel="stylesheet">
                    <style>
                        body {
                            font-family: 'Vazirmatn', sans-serif;
                            margin: 20px;
                            color: #0f172a;
                            background: #ffffff;
                        }
                        .header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            border-bottom: 2px solid #0284c7;
                            padding-bottom: 12px;
                            margin-bottom: 16px;
                        }
                        .title { font-size: 20px; font-weight: 800; color: #0284c7; margin: 0; }
                        .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
                        .stats-grid {
                            display: grid;
                            grid-template-columns: repeat(4, 1fr);
                            gap: 10px;
                            margin-bottom: 16px;
                        }
                        .stat-card {
                            background: #f8fafc;
                            border: 1px solid #e2e8f0;
                            border-radius: 6px;
                            padding: 8px;
                            text-align: center;
                        }
                        .stat-label { font-size: 11px; color: #64748b; margin-bottom: 2px; }
                        .stat-val { font-size: 14px; font-weight: 700; color: #0f172a; }
                        .chart-box {
                            text-align: center;
                            border: 1px solid #cbd5e1;
                            border-radius: 8px;
                            padding: 8px;
                            background: #0f172a;
                            margin-bottom: 16px;
                        }
                        .chart-img {
                            max-width: 100%;
                            height: auto;
                            border-radius: 4px;
                        }
                        .notes-box {
                            background: #f0f9ff;
                            border: 1px solid #bae6fd;
                            border-radius: 6px;
                            padding: 12px;
                            font-size: 13px;
                            line-height: 1.6;
                            margin-bottom: 20px;
                        }
                        .footer {
                            font-size: 11px;
                            color: #94a3b8;
                            text-align: center;
                            border-top: 1px solid #e2e8f0;
                            padding-top: 10px;
                        }
                        @media print {
                            body { margin: 0; padding: 15px; }
                            .no-print { display: none !important; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <h1 class="title">گزارش تحلیلی نمودار قیمت نماد ${sym}</h1>
                            <div class="subtitle">سامانه تحلیل تکنیکال و مدیریت دارایی - Shaka Analysis</div>
                        </div>
                        <div style="text-align: left; font-size: 12px; color: #475569;">
                            <div>تاریخ: ${getShamsiFullText()}</div>
                            <div>نوع قیمت: ${isAdjusted ? 'تعدیل‌شده (TradingView)' : 'عادی'}</div>
                        </div>
                    </div>

                    <div class="stats-grid">
                        <div class="stat-card"><div class="stat-label">آخرین قیمت</div><div class="stat-val">${lastPriceStr} ریال</div></div>
                        <div class="stat-card"><div class="stat-label">شاخص RSI</div><div class="stat-val">${rsiStr}</div></div>
                        <div class="stat-card"><div class="stat-label">نوع نمودار</div><div class="stat-val">${chartType ? chartType.value : 'شمعی'}</div></div>
                        <div class="stat-card"><div class="stat-label">تعداد کندل‌ها</div><div class="stat-val">${currentData ? toPersianDigits(currentData.length) : '--'}</div></div>
                    </div>

                    <div class="chart-box">
                        <img src="${capturedChartDataUrl}" class="chart-img" alt="نمودار تحلیل تکنیکال">
                    </div>

                    ${notesText ? `
                    <div class="notes-box">
                        <strong>ملاحظات و تحلیل اختصاصی:</strong><br>
                        ${notesText.replace(/\n/g, '<br>')}
                    </div>
                    ` : ''}

                    <div class="footer">
                        این گزارش شامل نمودار قیمت به همراه کلیه خطوط رسم شده و اندیکاتورهای فعال است. تولیدشده توسط سامانه تحلیل بازار سرمایه.
                    </div>

                    <script>
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                            }, 500);
                        };
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        });
    }

    // Snapshot Image PNG Save
    if (chartSnapshotBtn) {
        chartSnapshotBtn.addEventListener('click', async () => {
            const sym = (symbolInput ? symbolInput.value.trim() : '') || 'خودرو';
            showLoading(true);
            try {
                const dataUrl = await captureChartImage();
                if (dataUrl) {
                    const a = document.createElement('a');
                    a.href = dataUrl;
                    a.download = `${sym}_Chart_${Date.now()}.png`;
                    a.click();
                } else {
                    alert('خطا در گرفتن تصویر از نمودار.');
                }
            } catch (e) {
                console.error('Snapshot error:', e);
            } finally {
                showLoading(false);
            }
        });
    }

    // Chart Fullscreen Toggle
    if (chartFullscreenBtn) {
        chartFullscreenBtn.addEventListener('click', () => {
            const chartCard = document.getElementById('priceChart') ? document.getElementById('priceChart').closest('.card') : null;
            if (!chartCard) return;

            if (!document.fullscreenElement) {
                if (chartCard.requestFullscreen) {
                    chartCard.requestFullscreen();
                } else if (chartCard.webkitRequestFullscreen) {
                    chartCard.webkitRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        });
    }

    // ==========================================
    // PAGE 6: LIVE RSS NEWS FEED & TICKER HUB
    // ==========================================
    let tickerNewsList = [];
    let currentTickerIdx = 0;
    let tickerAutoRotateTimer = null;
    let isTickerPaused = false;

    let newsHubAllItems = [];
    let newsHubSelectedCategory = 'all';
    let newsHubSelectedSource = 'all';
    let newsHubSearchText = '';

    let workbenchNewsItems = [];
    let workbenchSelectedCategory = 'all';

    // Persian Time Ago Utility
    const getTimeAgoPersian = (dateStr) => {
        if (!dateStr) return 'لحظاتی پیش';
        try {
            const now = new Date();
            const past = new Date(dateStr);
            const diffMs = now - past;
            if (isNaN(diffMs) || diffMs < 0) return 'لحظاتی پیش';

            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffMinutes < 1) return 'چند ثانیه پیش';
            if (diffMinutes < 60) return `${toPersianDigits(diffMinutes)} دقیقه پیش`;
            if (diffHours < 24) return `${toPersianDigits(diffHours)} ساعت پیش`;
            return `${toPersianDigits(diffDays)} روز پیش`;
        } catch (e) {
            return 'لحظاتی پیش';
        }
    };

    // Category Badge Helper
    const getCategoryBadgeHtml = (catKey) => {
        if (catKey === 'bourse') {
            return `<span class="badge bg-emerald-500 text-white extra-small fw-bold">بورس و بازار سرمایه</span>`;
        } else if (catKey === 'economy') {
            return `<span class="badge bg-sky-500 text-white extra-small fw-bold">اقتصاد و ارز</span>`;
        } else if (catKey === 'political') {
            return `<span class="badge bg-amber-500 text-slate-950 extra-small fw-bold">سیاست و اخبار کلان</span>`;
        }
        return `<span class="badge bg-slate-600 text-white extra-small fw-bold">عمومی</span>`;
    };

    // Modal Article Opener
    const openNewsArticleModal = (item) => {
        if (!item) return;

        const titleEl = document.getElementById('modalNewsTitle');
        const sourceBadge = document.getElementById('modalNewsSourceBadge');
        const categoryBadge = document.getElementById('modalNewsCategoryBadge');
        const timeText = document.getElementById('modalNewsTimeText');
        const snippetEl = document.getElementById('modalNewsSnippet');
        const externalLink = document.getElementById('modalNewsExternalLink');

        if (titleEl) titleEl.textContent = item.title || 'بدون عنوان';
        if (sourceBadge) sourceBadge.textContent = item.source || 'خبرگزاری بورسی';
        if (categoryBadge) {
            categoryBadge.textContent = item.category === 'bourse' ? 'بورس' :
                                        item.category === 'economy' ? 'اقتصاد' :
                                        item.category === 'political' ? 'سیاسی' : 'عمومی';
        }
        if (timeText) {
            const shamsiTime = item.pubDate ? formatToShamsiDate(item.pubDate, true, true) : '--';
            const timeAgo = getTimeAgoPersian(item.pubDate);
            timeText.innerHTML = `<i class="far fa-clock me-1"></i> ${shamsiTime} (${timeAgo})`;
        }
        if (snippetEl) {
            snippetEl.textContent = item.snippet || item.title || 'جزئیات خبر در دسترس نیست.';
        }
        if (externalLink) {
            externalLink.href = item.link || '#';
        }

        const modalEl = document.getElementById('newsArticleModal');
        if (modalEl) {
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        }
    };

    // 1. Ticker Banner Initialization & Auto-Rotation
    const initRssNewsTicker = async () => {
        const container = document.getElementById('rssTickerItemContainer');
        if (!container) return;

        try {
            const res = await fetch('/api/news/ticker');
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    tickerNewsList = data;
                    currentTickerIdx = 0;
                    renderCurrentTickerItem();
                    startTickerAutoRotate();
                } else {
                    container.innerHTML = `<span class="text-slate-400 small">خبر جدیدی یافت نشد.</span>`;
                }
            }
        } catch (e) {
            console.error('Failed to fetch news ticker:', e);
            container.innerHTML = `<span class="text-slate-400 small">ارتباط با فید RSS خبرگزاری برقرار نشد.</span>`;
        }
    };

    const renderCurrentTickerItem = () => {
        const container = document.getElementById('rssTickerItemContainer');
        if (!container || tickerNewsList.length === 0) return;

        const item = tickerNewsList[currentTickerIdx];
        const timeAgo = getTimeAgoPersian(item.pubDate);

        container.innerHTML = `
            <span class="rss-source-tag">${item.source}</span>
            <a class="rss-ticker-link text-truncate" id="activeTickerLink" title="${item.title}">
                ${item.title}
            </a>
            <span class="text-slate-400 extra-small ms-2">
                <i class="far fa-clock fa-xs me-1 text-slate-400"></i>${timeAgo}
            </span>
        `;

        const linkEl = document.getElementById('activeTickerLink');
        if (linkEl) {
            linkEl.addEventListener('click', (e) => {
                e.preventDefault();
                openNewsArticleModal(item);
            });
        }
    };

    const nextTickerItem = () => {
        if (tickerNewsList.length === 0) return;
        currentTickerIdx = (currentTickerIdx + 1) % tickerNewsList.length;
        renderCurrentTickerItem();
    };

    const prevTickerItem = () => {
        if (tickerNewsList.length === 0) return;
        currentTickerIdx = (currentTickerIdx - 1 + tickerNewsList.length) % tickerNewsList.length;
        renderCurrentTickerItem();
    };

    const startTickerAutoRotate = () => {
        if (tickerAutoRotateTimer) clearInterval(tickerAutoRotateTimer);
        tickerAutoRotateTimer = setInterval(() => {
            if (!isTickerPaused) {
                nextTickerItem();
            }
        }, 4500);
    };

    // Ticker Button Listeners
    const rssTickerNextBtn = document.getElementById('rssTickerNextBtn');
    const rssTickerPrevBtn = document.getElementById('rssTickerPrevBtn');
    const rssTickerPauseBtn = document.getElementById('rssTickerPauseBtn');
    const rssOpenHubBtn = document.getElementById('rssOpenHubBtn');

    if (rssTickerNextBtn) rssTickerNextBtn.addEventListener('click', () => nextTickerItem());
    if (rssTickerPrevBtn) rssTickerPrevBtn.addEventListener('click', () => prevTickerItem());
    if (rssTickerPauseBtn) {
        rssTickerPauseBtn.addEventListener('click', () => {
            isTickerPaused = !isTickerPaused;
            const icon = document.getElementById('rssPauseIcon');
            if (icon) {
                icon.className = isTickerPaused ? 'fas fa-play fa-xs' : 'fas fa-pause fa-xs';
            }
            rssTickerPauseBtn.title = isTickerPaused ? 'پخش چرخش اخبار' : 'توقف چرخش اخبار';
        });
    }
    if (rssOpenHubBtn) {
        rssOpenHubBtn.addEventListener('click', () => {
            switchPage('page-news');
        });
    }

    // 2. Workbench Page News Card Feed
    const fetchWorkbenchNews = async () => {
        const container = document.getElementById('workbenchNewsContainer');
        if (!container) return;

        try {
            const url = workbenchSelectedCategory === 'all'
                ? '/api/news/rss?limit=12'
                : `/api/news/rss?limit=12&category=${workbenchSelectedCategory}`;

            const res = await fetch(url);
            if (res.ok) {
                const items = await res.json();
                workbenchNewsItems = items;
                renderWorkbenchNewsCards();
            }
        } catch (e) {
            console.error('Error fetching workbench news:', e);
            container.innerHTML = `<div class="col-12 text-center text-danger py-4 small">خطا در بارگذاری اخبار زنده.</div>`;
        }
    };

    const renderWorkbenchNewsCards = () => {
        const container = document.getElementById('workbenchNewsContainer');
        const searchInput = document.getElementById('workbenchNewsSearchInput');
        if (!container) return;

        let filtered = [...workbenchNewsItems];
        const search = searchInput ? searchInput.value.trim().toLowerCase() : '';

        if (search) {
            filtered = filtered.filter(item =>
                (item.title && item.title.toLowerCase().includes(search)) ||
                (item.snippet && item.snippet.toLowerCase().includes(search)) ||
                (item.source && item.source.toLowerCase().includes(search))
            );
        }

        if (filtered.length === 0) {
            container.innerHTML = `<div class="col-12 text-center py-4 text-muted small">هیچ خبری متناظر با فیلتر یافت نشد.</div>`;
            return;
        }

        container.innerHTML = '';
        filtered.slice(0, 8).forEach(item => {
            const timeAgo = getTimeAgoPersian(item.pubDate);
            const col = document.createElement('div');
            col.className = 'col-lg-6 col-md-12';
            col.innerHTML = `
                <div class="news-card p-3 h-100 d-flex flex-column justify-content-between shadow-2hs">
                    <div>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="news-source-badge bg-sky-100 text-sky-800 border border-sky-200">${item.source}</span>
                            <span class="news-time-ago"><i class="far fa-clock me-1"></i>${timeAgo}</span>
                        </div>
                        <h6 class="fw-bold text-dark lh-base mb-2 fs-7">${item.title}</h6>
                        <p class="text-secondary extra-small mb-2 text-truncate-2" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                            ${item.snippet || ''}
                        </p>
                    </div>
                    <div class="d-flex justify-content-between align-items-center pt-2 border-top border-slate-100 mt-2">
                        ${getCategoryBadgeHtml(item.category)}
                        <button class="btn btn-xs btn-outline-primary read-news-btn fw-bold">
                            <i class="fas fa-eye me-1"></i> مطالعه خبر
                        </button>
                    </div>
                </div>
            `;

            col.querySelector('.read-news-btn').addEventListener('click', () => {
                openNewsArticleModal(item);
            });

            container.appendChild(col);
        });
    };

    // Listeners for Workbench News
    const workbenchNewsSearchInput = document.getElementById('workbenchNewsSearchInput');
    const refreshWorkbenchNewsBtn = document.getElementById('refreshWorkbenchNewsBtn');
    const workbenchNewsCategoryGroup = document.getElementById('workbenchNewsCategoryGroup');

    if (workbenchNewsSearchInput) {
        workbenchNewsSearchInput.addEventListener('input', () => {
            renderWorkbenchNewsCards();
        });
    }

    if (refreshWorkbenchNewsBtn) {
        refreshWorkbenchNewsBtn.addEventListener('click', () => {
            fetchWorkbenchNews();
        });
    }

    if (workbenchNewsCategoryGroup) {
        workbenchNewsCategoryGroup.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                workbenchNewsCategoryGroup.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                workbenchSelectedCategory = e.currentTarget.getAttribute('data-cat') || 'all';
                fetchWorkbenchNews();
            });
        });
    }

    // 3. Dedicated News Hub Page
    const loadNewsHubPage = async () => {
        const grid = document.getElementById('newsHubGrid');
        if (!grid) return;

        grid.innerHTML = `
            <div class="col-12 text-center py-5 text-muted">
                <i class="fas fa-spinner fa-spin fa-2x text-primary d-block mb-3"></i>
                <span>در حال فراخوانی اخبار از خبرگزاری‌های بورس و اقتصاد...</span>
            </div>
        `;

        try {
            let url = '/api/news/rss?limit=40';
            const params = [];
            if (newsHubSelectedCategory !== 'all') params.push(`category=${newsHubSelectedCategory}`);
            if (newsHubSelectedSource !== 'all') params.push(`source=${newsHubSelectedSource}`);
            if (newsHubSearchText) params.push(`q=${encodeURIComponent(newsHubSearchText)}`);

            if (params.length > 0) {
                url += '&' + params.join('&');
            }

            const res = await fetch(url);
            if (res.ok) {
                const items = await res.json();
                newsHubAllItems = items;

                const countEl = document.getElementById('hubTotalNewsCount');
                if (countEl) countEl.textContent = `${toPersianDigits(items.length)} خبر`;

                renderNewsHubGrid();
            }
        } catch (e) {
            console.error('Error loading news hub:', e);
            grid.innerHTML = `<div class="col-12 text-center text-danger py-5">خطا در دریافت اخبار RSS. لطفاً مجدداً تلاش فرمایید.</div>`;
        }
    };

    const renderNewsHubGrid = () => {
        const grid = document.getElementById('newsHubGrid');
        if (!grid) return;

        if (newsHubAllItems.length === 0) {
            grid.innerHTML = `
                <div class="col-12 text-center py-5 text-muted">
                    <i class="far fa-newspaper fa-3x mb-3 opacity-50"></i>
                    <h5>هیچ خبری یافت نشد</h5>
                    <p class="small">عبارت جستجو یا فیلترهای انتخابی را تغییر دهید.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = '';
        newsHubAllItems.forEach(item => {
            const timeAgo = getTimeAgoPersian(item.pubDate);
            const shamsiDate = item.pubDate ? formatToShamsiDate(item.pubDate, true, true) : '--';

            const col = document.createElement('div');
            col.className = 'col-lg-4 col-md-6';
            col.innerHTML = `
                <div class="news-card p-3.5 h-100 d-flex flex-column justify-content-between shadow-sm">
                    <div>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="news-source-badge bg-slate-900 text-sky-400 font-monospace">${item.source}</span>
                            <span class="news-time-ago" title="${shamsiDate}"><i class="far fa-clock me-1"></i>${timeAgo}</span>
                        </div>
                        <h5 class="fw-bold text-dark lh-base mb-2 fs-6">${item.title}</h5>
                        <p class="text-secondary small mb-3" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.6;">
                            ${item.snippet || ''}
                        </p>
                    </div>

                    <div>
                        <div class="d-flex justify-content-between align-items-center pt-2.5 border-top border-slate-200">
                            ${getCategoryBadgeHtml(item.category)}
                            <div class="d-flex gap-1">
                                <button class="btn btn-sm btn-outline-primary read-hub-news-btn fw-bold py-1 px-2.5 extra-small">
                                    <i class="fas fa-file-text me-1"></i> مشاهده
                                </button>
                                <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-secondary py-1 px-2 extra-small" title="مشاهده مستقیم در خبرگزاری">
                                    <i class="fas fa-external-link-alt"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            col.querySelector('.read-hub-news-btn').addEventListener('click', () => {
                openNewsArticleModal(item);
            });

            grid.appendChild(col);
        });
    };

    // News Hub Listeners
    const newsHubSearchInput = document.getElementById('newsHubSearchInput');
    const newsHubSourceSelect = document.getElementById('newsHubSourceSelect');
    const newsHubCategoryGroup = document.getElementById('newsHubCategoryGroup');
    const refreshNewsHubBtn = document.getElementById('refreshNewsHubBtn');

    if (newsHubSearchInput) {
        let debounceTimer;
        newsHubSearchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                newsHubSearchText = e.target.value.trim();
                loadNewsHubPage();
            }, 300);
        });
    }

    if (newsHubSourceSelect) {
        newsHubSourceSelect.addEventListener('change', (e) => {
            newsHubSelectedSource = e.target.value;
            loadNewsHubPage();
        });
    }

    if (newsHubCategoryGroup) {
        newsHubCategoryGroup.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                newsHubCategoryGroup.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                newsHubSelectedCategory = e.currentTarget.getAttribute('data-cat') || 'all';
                loadNewsHubPage();
            });
        });
    }

    if (refreshNewsHubBtn) {
        refreshNewsHubBtn.addEventListener('click', () => {
            loadNewsHubPage();
        });
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================
    updateShamsiDateInputsForRange('4y');
    loadSymbols();
    syncRSISettingsUI();
    renderAlertsTable();

    // Initialize News RSS Feed
    initRssNewsTicker();
    fetchWorkbenchNews();

    // Default fetch for primary chart
    setTimeout(() => {
        if (symbolInput && symbolInput.value) {
            fetchData();
        } else {
            if (symbolInput) symbolInput.value = 'خودرو';
            fetchData();
        }
    }, 100);
});
