/**
 * Функції для візуалізації даних економетричного аналізу
 * Бібліотека використовує Chart.js для створення різних типів графіків
 */
// Додайте виклик у вашу функцію ініціалізації або в обробник переключення вкладок
document.getElementById('correlation-tab').addEventListener('click', function() {
    createCorrelationMatrix();
});
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

// Додайте це до вашої функції createStructureChart перед створенням діаграми
const chartContainer = document.createElement('div');
chartContainer.style.width = '80%'; // Ширина 80% від контейнера
chartContainer.style.height = '450px'; // Фіксована висота
chartContainer.style.margin = '0 auto'; // Центрування

// Замінюємо оригінальний canvas новим
const originalCanvas = document.getElementById('structureChart');
const newCanvas = document.createElement('canvas');
newCanvas.id = 'structureChart';

chartContainer.appendChild(newCanvas);
originalCanvas.parentNode.replaceChild(chartContainer, originalCanvas);

// Тепер використовуємо новий canvas
const ctx = newCanvas.getContext('2d');

function createStructureChart() {
    
    const ctx = document.getElementById('structureChart');
    if (!ctx) {
        console.error('Canvas element with id "structureChart" not found');
        return null;
    }
    
    // Безпечне знищення попереднього графіка
    safeDestroyChart(window.structureChart, 'structureChart');
    
    const vars = ['assets', 'investments', 'employment', 'enterprises', 'income', 'new_assets', 'retail'];
    
    // Перевіряємо, чи існує контейнер для вибору регіонів, якщо ні - створюємо його
    let selectContainer = document.getElementById('structureRegionsSelectContainer');
    if (!selectContainer) {
        // Створюємо контейнер для вибору регіонів
        selectContainer = document.createElement('div');
        selectContainer.id = 'structureRegionsSelectContainer';
        selectContainer.className = 'mb-4 p-3 border rounded';
        
        const label = document.createElement('label');
        label.className = 'form-label';
        label.textContent = 'Оберіть регіони для відображення:';
        
        const select = document.createElement('select');
        select.id = 'structureRegionsSelect';
        select.className = 'form-select';
        select.multiple = true;
        select.size = 5;
        
        // Наповнюємо список регіонів
        regionsData.sort((a, b) => b.grp - a.grp).forEach((region, index) => {
            const option = document.createElement('option');
            option.value = region.region;
            option.textContent = `${region.region}`;
            
            // За замовчуванням обираємо топ-6 регіонів
            if (index < 2) {
                option.selected = true;
            }
            
            select.appendChild(option);
        });
        
        const helpText = document.createElement('small');
        helpText.className = 'form-text text-muted mt-2';
        helpText.textContent = 'Утримуйте Ctrl або Command для вибору декількох регіонів';
        
        const updateButton = document.createElement('button');
        updateButton.id = 'updateStructureChart';
        updateButton.className = 'btn btn-primary mt-3';
        updateButton.textContent = 'Оновити діаграму';
        updateButton.addEventListener('click', createStructureChart);
        
        // Додаємо все до контейнера
        selectContainer.appendChild(label);
        selectContainer.appendChild(select);
        selectContainer.appendChild(helpText);
        selectContainer.appendChild(document.createElement('br'));
        selectContainer.appendChild(updateButton);
        
        // Вставляємо контейнер перед полотном діаграми
        ctx.parentNode.insertBefore(selectContainer, ctx);
    }
    
    // Отримуємо вибрані регіони
    const selectedRegions = [];
    const selectElement = document.getElementById('structureRegionsSelect');
    
    for (let i = 0; i < selectElement.options.length; i++) {
        if (selectElement.options[i].selected) {
            const regionName = selectElement.options[i].value;
            const regionData = regionsData.find(r => r.region === regionName);
            if (regionData) {
                selectedRegions.push(regionData);
            }
        }
    }
    
    // Якщо нічого не вибрано, беремо топ-2 за замовчуванням
    if (selectedRegions.length === 0) {
        const topRegions = [...regionsData]
            .sort((a, b) => b.grp - a.grp)
            .slice(0, 2);
        selectedRegions.push(...topRegions);
        
        // Оновлюємо вибрані опції в селекті
        for (let i = 0; i < selectElement.options.length; i++) {
            const regionName = selectElement.options[i].value;
            selectElement.options[i].selected = topRegions.some(r => r.region === regionName);
        }
    }
    
    // Набори даних для діаграми
    const datasets = [];
    
    // Нормалізуємо дані для кожного вибраного регіону
    selectedRegions.forEach((region, index) => {
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
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 1.2, // Фіксуємо співвідношення сторін
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            boxWidth: 20, // Зменшуємо розмір легенди
                            padding: 5
                        }
                    },
                    title: {
                        font: {
                            size: 14 // Менший розмір заголовка
                        }
                    }
                },
                scales: {
                    r: {
                        ticks: {
                            display: true,
                            backdropPadding: 2, // Зменшення відступів
                            font: {
                                size: 10 // Зменшений розмір шрифту
                            }
                        },
                        pointLabels: {
                            font: {
                                size: 11 // Зменшений розмір міток осей
                            }
                        },
                        angleLines: {
                            display: true
                        }
                    }
                }
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
 * Створює інтерактивну кореляційну матрицю
 * @returns {void}
 */
function createCorrelationMatrix() {
    // Отримуємо дані кореляції з таблиці на зображенні
    const correlationData = [
        [1.000000, 0.347533, 0.398948, 0.455743, 0.072914, -0.233402, -0.731222, 0.477978],
        [0.347533, 1.000000, -0.284056, 0.571003, -0.285483, 0.382480, -0.362842, 0.642578],
        [0.398948, -0.284056, 1.000000, -0.523649, 0.152937, -0.139176, -0.092895, 0.016266],
        [0.455743, 0.571003, -0.523649, 1.000000, -0.226343, -0.227577, -0.481548, 0.473286],
        [0.072914, -0.285483, 0.152937, -0.226343, 1.000000, -0.104438, -0.147477, -0.523283],
        [-0.233402, 0.382480, -0.139176, -0.227577, -0.104438, 1.000000, -0.030252, 0.417640],
        [-0.731222, -0.362842, -0.092895, -0.481548, -0.147477, -0.030252, 1.000000, -0.494440],
        [0.477978, 0.642578, 0.016266, 0.473286, -0.523283, 0.417640, -0.494440, 1.000000]
    ];
    
    // Змінні та їх назви
    const variables = ['ВРП', 'Основні засоби', 'Інвестиції', 'Зайнятість населення', 
                       'Кількість підприємств', 'Доходи населення', 'Нові основні засоби', 
                       'Роздрібний товарооборот'];
    
    // Створення контейнера для матриці
    const matrixContainer = document.getElementById('correlationMatrixContainer');
    if (!matrixContainer) {
        console.error('Контейнер для кореляційної матриці не знайдено');
        return;
    }
    
    // Очищаємо контейнер
    matrixContainer.innerHTML = '';
    
    // Створюємо таблицю
    const table = document.createElement('table');
    table.className = 'correlation-table';
    
    // Створюємо заголовок таблиці
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // Додаємо порожню комірку у верхньому лівому куті
    const emptyHeader = document.createElement('th');
    emptyHeader.className = 'corner-cell';
    headerRow.appendChild(emptyHeader);
    
    // Додаємо назви змінних як заголовки стовпців
    variables.forEach((variable, index) => {
        const th = document.createElement('th');
        th.textContent = variable;
        th.dataset.index = index;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Створюємо тіло таблиці
    const tbody = document.createElement('tbody');
    
    // Додаємо рядки з даними
    correlationData.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');
        
        // Додаємо назву змінної як першу комірку в рядку
        const variableCell = document.createElement('th');
        variableCell.textContent = variables[rowIndex];
        variableCell.dataset.index = rowIndex;
        tr.appendChild(variableCell);
        
        // Додаємо комірки зі значеннями кореляції
        row.forEach((value, colIndex) => {
            const td = document.createElement('td');
            td.textContent = value.toFixed(3);
            
            // Встановлюємо колір фону залежно від значення кореляції
            const colorIntensity = Math.abs(value) * 100;
            if (value > 0) {
                // Позитивна кореляція - синій колір
                td.style.backgroundColor = `rgba(66, 133, 244, ${colorIntensity}%)`;
                if (value > 0.7) {
                    td.style.color = 'white';
                }
            } else if (value < 0) {
                // Негативна кореляція - червоний колір
                td.style.backgroundColor = `rgba(219, 68, 55, ${colorIntensity}%)`;
                if (value < -0.7) {
                    td.style.color = 'white';
                }
            } else {
                // Нульова кореляція - сірий
                td.style.backgroundColor = '#f5f5f5';
            }
            
            // Діагональні елементи (кореляція змінної з собою)
            if (rowIndex === colIndex) {
                td.classList.add('diagonal-cell');
                td.style.backgroundColor = '#4e73df';
                td.style.color = 'white';
            }
            
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    });
    
    table.appendChild(tbody);
    matrixContainer.appendChild(table);
    
    // Додаємо стилі для таблиці
    const style = document.createElement('style');
    style.textContent = `
        .correlation-table {
            width: 100%;
            border-collapse: collapse;
            font-family: 'Roboto', sans-serif;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin: 20px 0;
        }
        
        .correlation-table th, .correlation-table td {
            padding: 10px;
            text-align: center;
            border: 1px solid #e3e6f0;
            transition: all 0.3s;
        }
        
        .correlation-table th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        
        .correlation-table tbody tr:hover {
            background-color: rgba(0, 0, 0, 0.05);
        }
        
        .correlation-table td:hover {
            transform: scale(1.05);
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            z-index: 10;
            position: relative;
        }
        
        .corner-cell {
            background-color: #4e73df !important;
            color: white;
        }
        
        .diagonal-cell {
            font-weight: bold;
        }
    `;
    
    document.head.appendChild(style);
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