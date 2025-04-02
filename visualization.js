/**
 * Функції для візуалізації даних економетричного аналізу
 * Бібліотека використовує Chart.js для створення різних типів графіків
 */

/**
 * Безпечне знищення Chart.js графіка
 * @param {Object} chartInstance - екземпляр графіка Chart.js
 * @param {String} chartName - ім'я змінної графіка 
 */
function safeDestroyChart(chartInstance, chartName) {
    try {
        if (chartInstance && typeof chartInstance.destroy === 'function') {
            chartInstance.destroy();
            return true;
        }
    } catch (e) {
        console.warn(`Не вдалося знищити графік ${chartName}:`, e);
    }
    return false;
}

/**
 * Створює графік ВРП за регіонами
 * @returns {Chart} об'єкт Chart.js з графіком
 */
function createRegionsChart() {
    const ctx = document.getElementById('regionsChart');
    if (!ctx) {
        console.error('Canvas element with id "regionsChart" not found');
        return null;
    }
    
    // Безпечне знищення попереднього графіка
    safeDestroyChart(window.regionsChart, 'regionsChart');
    
    // Сортуємо дані за ВРП (спадання)
    const sortedData = [...regionsData].sort((a, b) => b.grp - a.grp);
    
    // Беремо тільки топ-15 регіонів
    const top15Regions = sortedData.slice(0, 15);
    
    try {
        const chartContext = ctx.getContext('2d');
        window.regionsChart = new Chart(chartContext, {
            type: 'bar',
            data: {
                labels: top15Regions.map(r => r.region),
                datasets: [{
                    label: 'Валовий регіональний продукт (млн грн)',
                    data: top15Regions.map(r => r.grp),
                    backgroundColor: colorScheme[0],
                    borderColor: colorScheme[0].replace('0.7', '1'),
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                plugins: {
                    title: {
                        display: true,
                        text: 'Топ-15 регіонів за ВРП'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `ВРП: ${formatNumber(context.raw)} млн грн`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'ВРП (млн грн)'
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
        
        return window.regionsChart;
    } catch (e) {
        console.error('Помилка при створенні графіку регіонів:', e);
        return null;
    }
}

/**
 * Оновлює діаграму розсіювання
 * @param {String} xVar - назва змінної для осі X
 * @param {String} yVar - назва змінної для осі Y
 * @returns {Chart} об'єкт Chart.js з діаграмою
 */
function updateScatterChart(xVar, yVar) {
    const ctx = document.getElementById('scatterChart');
    if (!ctx) {
        console.error('Canvas element with id "scatterChart" not found');
        return null;
    }
    
    // Безпечне знищення попереднього графіка
    safeDestroyChart(window.scatterChart, 'scatterChart');
    
    // Отримуємо значення коефіцієнта кореляції
    let correlationValue = 0;
    if (window.correlationMatrix && window.correlationMatrix[yVar] && window.correlationMatrix[yVar][xVar]) {
        correlationValue = window.correlationMatrix[yVar][xVar].toFixed(2);
    } else {
        // Якщо кореляційна матриця не визначена, обчислюємо її
        const computedMatrix = calculateCorrelationMatrix(regionsData, ['grp', 'assets', 'investments', 'employment', 'enterprises', 'income', 'new_assets', 'retail']);
        if (computedMatrix[yVar] && computedMatrix[yVar][xVar]) {
            correlationValue = computedMatrix[yVar][xVar].toFixed(2);
        }
    }
    
    // Дані для діаграми розсіювання
    const scatterData = regionsData.map(region => ({
        x: region[xVar],
        y: region[yVar],
        region: region.region
    }));
    
    // Розрахунок лінії тренду
    const xValues = regionsData.map(r => r[xVar]);
    const yValues = regionsData.map(r => r[yVar]);
    
    // Лінійна регресія для діаграми розсіювання
    const n = xValues.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
        sumX += xValues[i];
        sumY += yValues[i];
        sumXY += xValues[i] * yValues[i];
        sumX2 += xValues[i] * xValues[i];
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Точки для лінії тренду
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const trendLineData = [
        { x: minX, y: intercept + slope * minX },
        { x: maxX, y: intercept + slope * maxX }
    ];
    
    try {
        // Створюємо діаграму
        const chartContext = ctx.getContext('2d');
        window.scatterChart = new Chart(chartContext, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: `${varNames[yVar]} vs ${varNames[xVar]} (кореляція: ${correlationValue})`,
                        data: scatterData,
                        backgroundColor: colorScheme[0],
                        borderColor: colorScheme[0].replace('0.7', '1'),
                        borderWidth: 1,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    },
                    {
                        label: 'Лінія тренду',
                        data: trendLineData,
                        type: 'line',
                        fill: false,
                        borderColor: colorScheme[1].replace('0.7', '1'),
                        borderWidth: 2,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: varNames[xVar]
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: varNames[yVar]
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.dataset.label.includes('Лінія тренду')) {
                                    return context.dataset.label;
                                }
                                const point = context.raw;
                                return `${point.region}: ${varNames[xVar]}=${formatNumber(point.x)}, ${varNames[yVar]}=${formatNumber(point.y)}`;
                            }
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
        
        return window.scatterChart;
    } catch (e) {
        console.error('Помилка при створенні діаграми розсіювання:', e);
        return null;
    }
}

/**
 * Створює структурну діаграму (радарну)
 * @returns {Chart} об'єкт Chart.js з діаграмою
 */
function createStructureChart() {
    const ctx = document.getElementById('structureChart');
    if (!ctx) {
        console.error('Canvas element with id "structureChart" not found');
        return null;
    }
    
    // Безпечне знищення попереднього графіка
    safeDestroyChart(window.structureChart, 'structureChart');
    
    const vars = ['assets', 'investments', 'employment', 'enterprises', 'income', 'new_assets', 'retail'];
    
    // Вибір 5 основних регіонів за ВРП
    const topRegions = [...regionsData]
        .sort((a, b) => b.grp - a.grp)
        .slice(0, 5);
    
    // Набори даних для діаграми
    const datasets = [];
    
    // Нормалізуємо дані для кожного регіону
    topRegions.forEach((region, index) => {
        const normalizedData = vars.map(variable => {
            // Знаходимо максимальне значення для змінної
            const max = Math.max(...regionsData.map(r => r[variable]));
            return max > 0 ? (region[variable] / max) * 100 : 0;
        });
        
        datasets.push({
            label: region.region,
            data: normalizedData,
            backgroundColor: colorScheme[index % colorScheme.length].replace('0.7', '0.2'),
            borderColor: colorScheme[index % colorScheme.length].replace('0.7', '1'),
            borderWidth: 1,
            pointBackgroundColor: colorScheme[index % colorScheme.length].replace('0.7', '1')
        });
    });
    
    try {
        // Створюємо радарну діаграму
        const chartContext = ctx.getContext('2d');
        window.structureChart = new Chart(chartContext, {
            type: 'radar',
            data: {
                labels: vars.map(v => varNames[v] || v),
                datasets: datasets
            },
            options: {
                scales: {
                    r: {
                        angleLines: {
                            display: true
                        },
                        ticks: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Економічні показники за регіонами (% від максимального значення)'
                    },
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw.toFixed(1)}%`;
                            }
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
        
        return window.structureChart;
    } catch (e) {
        console.error('Помилка при створенні структурної діаграми:', e);
        return null;
    }
}

/**
 * Створює графік порівняння фактичних і прогнозованих значень ВРП
 * @returns {Chart} об'єкт Chart.js з графіком
 */
function createRegressionComparisonChart() {
    if (!window.currentModel) {
        console.warn('Не можливо створити графік регресії: модель не визначена');
        return null;
    }
    
    const ctx = document.getElementById('regressionChart');
    if (!ctx) {
        console.error('Canvas element with id "regressionChart" not found');
        return null;
    }
    
    // Безпечне знищення попереднього графіка
    safeDestroyChart(window.regressionChart, 'regressionChart');
    
    // Відбираємо топ-10 регіонів за фактичним ВРП
    const top10Regions = [...regionsData]
        .sort((a, b) => b.grp - a.grp)
        .slice(0, 10);
    
    // Прогнозуємо ВРП для топ-10 регіонів
    const comparisonData = top10Regions.map(region => {
        return {
            region: region.region,
            actual: region.grp,
            predicted: predictGRP(window.currentModel, region)
        };
    });
    
    try {
        // Створюємо графік порівняння
        const chartContext = ctx.getContext('2d');
        window.regressionChart = new Chart(chartContext, {
            type: 'bar',
            data: {
                labels: comparisonData.map(d => d.region),
                datasets: [
                    {
                        label: 'Фактичний ВРП',
                        data: comparisonData.map(d => d.actual),
                        backgroundColor: colorScheme[0],
                        borderColor: colorScheme[0].replace('0.7', '1'),
                        borderWidth: 1
                    },
                    {
                        label: 'Прогнозований ВРП',
                        data: comparisonData.map(d => d.predicted),
                        backgroundColor: colorScheme[1],
                        borderColor: colorScheme[1].replace('0.7', '1'),
                        borderWidth: 1
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'ВРП (млн грн)'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Порівняння фактичних та прогнозованих значень ВРП'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label;
                                const value = formatNumber(context.raw);
                                return `${label}: ${value} млн грн`;
                            }
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
        
        return window.regressionChart;
    } catch (e) {
        console.error('Помилка при створенні графіку регресії:', e);
        return null;
    }
}

/**
 * Створює теплову карту кореляційної матриці
 * @returns {Chart} об'єкт Chart.js з тепловою картою
 */
function createCorrelationHeatmap() {
    const ctx = document.getElementById('correlationHeatmap');
    if (!ctx) {
        console.error('Canvas element with id "correlationHeatmap" not found');
        return null;
    }
    
    // Безпечне знищення попереднього графіка
    safeDestroyChart(window.correlationHeatmapChart, 'correlationHeatmapChart');
    
    // Використовуємо глобальні змінні або створюємо їх, якщо не існують
    const vars = typeof analysisVariables !== 'undefined' ? analysisVariables : 
                ['grp', 'assets', 'investments', 'employment', 'enterprises', 'income', 'new_assets', 'retail'];
    
    // Обчислюємо кореляційну матрицю
    let corrMatrix;
    if (window.correlationMatrix) {
        corrMatrix = window.correlationMatrix;
    } else {
        corrMatrix = calculateCorrelationMatrix(regionsData, vars);
        window.correlationMatrix = corrMatrix;
    }
    
    // Підготовка даних для теплової карти
    const heatmapData = [];
    
    vars.forEach((yVar, yIndex) => {
        vars.forEach((xVar, xIndex) => {
            if (corrMatrix[yVar] && corrMatrix[yVar][xVar] !== undefined) {
                const value = corrMatrix[yVar][xVar];
                heatmapData.push({
                    x: xIndex,
                    y: yIndex,
                    value: value
                });
            } else {
                console.warn(`Відсутнє значення кореляції для ${yVar} і ${xVar}`);
            }
        });
    });
    
    try {
        // Створюємо теплову карту
        const chartContext = ctx.getContext('2d');
        window.correlationHeatmapChart = new Chart(chartContext, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Кореляційна матриця',
                    data: heatmapData.map(point => ({
                        x: point.x,
                        y: point.y,
                        value: point.value
                    })),
                    backgroundColor: function(context) {
                        const value = context.raw.value;
                        return getCorrelationColor(value);
                    },
                    pointRadius: 25,
                    pointHoverRadius: 30
                }]
            },
            options: {
                scales: {
                    x: {
                        type: 'category',
                        labels: vars.map(v => varNames[v] || v),
                        position: 'top',
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        type: 'category',
                        labels: vars.map(v => varNames[v] || v),
                        reverse: true,
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const index = context.dataIndex;
                                const point = heatmapData[index];
                                const xVar = vars[point.x];
                                const yVar = vars[point.y];
                                return `${varNames[yVar]} і ${varNames[xVar]}: ${point.value.toFixed(3)}`;
                            }
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            },
            plugins: [{
                id: 'correlationValues',
                afterDraw: function(chart) {
                    const ctx = chart.ctx;
                    chart.data.datasets[0].data.forEach((point, index) => {
                        const datasetIndex = 0;
                        const meta = chart.getDatasetMeta(datasetIndex);
                        const element = meta.data[index];
                        
                        // Координати центру елемента
                        const position = element.getCenterPoint();
                        
                        // Отримання значення кореляції
                        const value = heatmapData[index].value;
                        
                        // Вибір кольору тексту залежно від фону
                        ctx.fillStyle = Math.abs(value) > 0.5 ? 'white' : 'black';
                        
                        // Налаштування шрифту
                        ctx.font = '12px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        
                        // Додаємо значення кореляції
                        ctx.fillText(value.toFixed(2), position.x, position.y);
                    });
                }
            }]
        });
        
        return window.correlationHeatmapChart;
    } catch (e) {
        console.error('Помилка при створенні теплової карти кореляції:', e);
        return null;
    }
}

/**
 * Оновлює таблицю факторів інфляції дисперсії
 */
function updateVIFTable() {
    if (!window.currentModel || !window.currentModel.vifValues) {
        console.warn('Не можливо оновити таблицю VIF: модель або значення VIF не визначені');
        return;
    }
    
    const vifTableBody = document.getElementById('vifTableBody');
    if (!vifTableBody) {
        console.error('Елемент vifTableBody не знайдено');
        return;
    }
    
    vifTableBody.innerHTML = '';
    
    // Сортуємо змінні за значенням VIF (від найменшого до найбільшого)
    const sortedVariables = Object.keys(window.currentModel.vifValues).sort((a, b) => {
        return window.currentModel.vifValues[a] - window.currentModel.vifValues[b];
    });
    
    // Заповнюємо таблицю VIF
    sortedVariables.forEach(variable => {
        const vif = window.currentModel.vifValues[variable];
        if (vif === undefined) return;
        
        const row = document.createElement('tr');
        
        const varCell = document.createElement('td');
        varCell.textContent = varNames[variable] || variable;
        row.appendChild(varCell);
        
        const vifCell = document.createElement('td');
        vifCell.textContent = vif ? vif.toFixed(2) : 'N/A';
        row.appendChild(vifCell);
        
        const statusCell = document.createElement('td');
        if (vif) {
            if (vif > 10) {
                statusCell.innerHTML = '<span class="badge bg-danger">Висока колінеарність</span>';
            } else if (vif > 5) {
                statusCell.innerHTML = '<span class="badge bg-warning">Середня колінеарність</span>';
            } else {
                statusCell.innerHTML = '<span class="badge bg-success">Низька колінеарність</span>';
            }
        } else {
            statusCell.innerHTML = '<span class="badge bg-secondary">Невідомо</span>';
        }
        row.appendChild(statusCell);
        
        vifTableBody.appendChild(row);
    });
}

/**
 * Оновлює графік порівняння регіонів
 * @param {Array} data - масив об'єктів з даними регіонів
 * @param {Array} analysisVariables - масив назв змінних для порівняння
 * @returns {Chart} об'єкт Chart.js з графіком
 */
function updateComparisonChart(data, analysisVariables) {
    if (!data || !analysisVariables || analysisVariables.length === 0) {
        console.error('Не вказані дані або змінні для порівняння');
        return null;
    }
    
    const ctx = document.getElementById('comparisonChart');
    if (!ctx) {
        console.error('Canvas element with id "comparisonChart" not found');
        return null;
    }
    
    // Безпечне знищення попереднього графіка
    safeDestroyChart(window.comparisonChart, 'comparisonChart');
    
    // Підготовка наборів даних
    const datasets = analysisVariables.map((variable, index) => {
        return {
            label: varNames[variable] || variable,
            data: data.map(region => region[variable]),
            backgroundColor: colorScheme[index % colorScheme.length],
            borderColor: colorScheme[index % colorScheme.length].replace('0.7', '1'),
            borderWidth: 1
        };
    });
    
    try {
        // Створюємо графік порівняння
        const chartContext = ctx.getContext('2d');
        window.comparisonChart = new Chart(chartContext, {
            type: 'bar',
            data: {
                labels: data.map(region => region.region),
                datasets: datasets
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Значення'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Порівняння показників регіонів'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${formatNumber(context.raw)}`;
                            }
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
        
        return window.comparisonChart;
    } catch (e) {
        console.error('Помилка при створенні графіку порівняння:', e);
        return null;
    }
}

/**
 * Оновлює таблицю порівняння регіонів
 * @param {Array} data - масив об'єктів з даними регіонів
 * @param {Array} analysisVariables - масив назв змінних для порівняння
 */
function updateComparisonTable(data, analysisVariables) {
    if (!data || !analysisVariables || analysisVariables.length === 0) {
        console.error('Не вказані дані або змінні для таблиці порівняння');
        return;
    }
    
    // Отримуємо посилання на елементи таблиці
    const tableHeader = document.querySelector('#comparisonTable thead tr');
    const tableBody = document.querySelector('#comparisonTable tbody');
    
    if (!tableHeader || !tableBody) {
        console.error('Не знайдено елементи таблиці порівняння');
        return;
    }
    
    // Очищаємо таблицю
    tableHeader.innerHTML = '<th>Регіон</th>';
    tableBody.innerHTML = '';
    
    // Додаємо заголовки для вибраних показників
    analysisVariables.forEach(variable => {
        const th = document.createElement('th');
        th.textContent = varNames[variable] || variable;
        tableHeader.appendChild(th);
    });
    
    // Додаємо рядки з даними
    data.forEach(region => {
        const row = document.createElement('tr');
        
        // Додаємо назву регіону
        const regionCell = document.createElement('td');
        regionCell.textContent = region.region;
        row.appendChild(regionCell);
        
        // Додаємо значення для кожного показника
        analysisVariables.forEach(variable => {
            const cell = document.createElement('td');
            cell.textContent = formatNumber(region[variable]);
            row.appendChild(cell);
        });
        
        tableBody.appendChild(row);
    });
}