/**
 * Головний файл додатку для економетричного аналізу ВРП
 * Відповідає за ініціалізацію компонентів та взаємодію з користувачем
 */

// Змінна для зберігання поточної регресійної моделі
window.currentModel = null;

// Змінна для зберігання поточної кореляційної матриці
window.correlationMatrix = null;

/**
 * Функція для оновлення моделі з вибраними змінними
 * @param {Array} selectedVars - масив назв вибраних змінних
 * @returns {Boolean} успішність оновлення моделі
 */
function updateModelWithVariables(selectedVars) {
    try {
        // Перевірка наявності вибраних змінних
        if (!selectedVars || selectedVars.length === 0) {
            console.error("Не вибрано жодної змінної для моделі");
            return false;
        }
        
        // Обчислюємо регресію з вибраними змінними
        window.currentModel = calculateLinearRegression(regionsData, 'grp', selectedVars);
        
        // Перевірка успішності обчислення
        if (!window.currentModel) {
            console.error("Не вдалося обчислити регресійну модель");
            return false;
        }
        
        // Оновлюємо інтерфейс з результатами регресії
        updateRegressionUI();
        
        return true;
    } catch (error) {
        console.error("Помилка при оновленні моделі:", error);
        return false;
    }
}

/**
 * Функція для оновлення інтерфейсу на основі моделі
 */
function updateRegressionUI() {
    try {
        if (!window.currentModel) return;
        
        // Формуємо рівняння регресії
        let equation = `ВРП = ${window.currentModel.coefficients.const.toFixed(2)}`;
        
        for (const variable in window.currentModel.coefficients) {
            if (variable !== 'const') {
                const coef = window.currentModel.coefficients[variable];
                const sign = coef >= 0 ? "+" : "";
                equation += ` ${sign} ${coef.toFixed(3)} × ${varNames[variable]}`;
            }
        }
        
        // Оновлюємо елементи інтерфейсу
        
        // 1. Рівняння регресії
        const regressionEq = document.getElementById('regressionEquation');
        if (regressionEq) {
            regressionEq.innerHTML = `<strong>${equation}</strong>`;
        }
        
        // 2. Показники якості моделі
        const modelRSquared = document.getElementById('modelRSquared');
        if (modelRSquared) {
            modelRSquared.textContent = `${(window.currentModel.rSquared * 100).toFixed(2)}%`;
        }
        
        const modelAdjRSquared = document.getElementById('modelAdjustedRSquared');
        if (modelAdjRSquared) {
            modelAdjRSquared.textContent = `${(window.currentModel.adjustedRSquared * 100).toFixed(2)}%`;
        }
        
        const modelStdError = document.getElementById('modelStdError');
        if (modelStdError) {
            modelStdError.textContent = window.currentModel.standardError.toFixed(2);
        }
        
        // 3. Додаткові показники на дашборді
        const dashboardRSquared = document.getElementById('dashboardRSquared');
        if (dashboardRSquared) {
            dashboardRSquared.textContent = `${(window.currentModel.rSquared * 100).toFixed(2)}%`;
        }
        
        const interpretRSquared = document.getElementById('interpretRSquared');
        if (interpretRSquared) {
            interpretRSquared.textContent = `${(window.currentModel.rSquared * 100).toFixed(2)}%`;
        }
        
        // 4. Коефіцієнти моделі для прогнозування
        const coefficientsList = document.getElementById('coefficientsList');
        if (coefficientsList) {
            coefficientsList.innerHTML = '';
            
            // Додаємо константу
            const constItem = document.createElement('div');
            constItem.className = 'coefficient-item';
            constItem.innerHTML = `<strong>Вільний член:</strong> ${window.currentModel.coefficients.const.toFixed(3)}`;
            coefficientsList.appendChild(constItem);
            
            // Додаємо інші коефіцієнти
            for (const variable in window.currentModel.coefficients) {
                if (variable !== 'const') {
                    const item = document.createElement('div');
                    item.className = 'coefficient-item';
                    item.innerHTML = `<strong>${varNames[variable]}:</strong> ${window.currentModel.coefficients[variable].toFixed(3)}`;
                    coefficientsList.appendChild(item);
                }
            }
        }
        
        // 5. Коефіцієнт детермінації на вкладці прогнозування
        const rSquaredElement = document.getElementById('rSquaredValue');
        if (rSquaredElement) {
            rSquaredElement.textContent = `R²: ${(window.currentModel.rSquared * 100).toFixed(2)}%`;
        }
        
        // 6. Оновлюємо графік регресії
        if (typeof createRegressionComparisonChart === 'function') {
            createRegressionComparisonChart();
        }
        
        // 7. Оновлюємо таблицю VIF
        if (typeof updateVIFTable === 'function') {
            updateVIFTable();
        }
    } catch (error) {
        console.error("Помилка при оновленні інтерфейсу:", error);
    }
}

/**
 * Функція для оновлення статистики на дашборді
 */
function updateDashboardStats() {
    try {
        // Кількість регіонів
        const totalRegionsElement = document.getElementById('totalRegions');
        if (totalRegionsElement) {
            totalRegionsElement.textContent = regionsData.length;
        }
        
        // Середній і максимальний ВРП
        const grpValues = regionsData.map(r => r.grp);
        const avgGRP = grpValues.reduce((sum, val) => sum + val, 0) / grpValues.length;
        const maxGRP = Math.max(...grpValues);
        
        const avgGRPElement = document.getElementById('averageGRP');
        if (avgGRPElement) {
            avgGRPElement.textContent = formatNumber(avgGRP) + ' млн грн';
        }
        
        const maxGRPElement = document.getElementById('maxGRP');
        if (maxGRPElement) {
            maxGRPElement.textContent = formatNumber(maxGRP) + ' млн грн';
        }
    } catch (error) {
        console.error("Помилка при оновленні статистики:", error);
    }
}

/**
 * Ініціалізація вкладки "Інформаційна панель"
 */
function initDashboard() {
    try {
        // Оновлюємо статистику
        updateDashboardStats();
        
        // Створюємо графіки
        if (typeof createRegionsChart === 'function') {
            createRegionsChart();
        }
        
        if (typeof updateScatterChart === 'function') {
            updateScatterChart('investments', 'grp');
        }
        
        if (typeof createStructureChart === 'function') {
            createStructureChart();
        }
        
        // Якщо є модель, створюємо графік регресії
        if (window.currentModel && typeof createRegressionComparisonChart === 'function') {
            createRegressionComparisonChart();
        }
        
        // Додаємо обробники для діаграми розсіювання
        const xVariable = document.getElementById('xVariable');
        const yVariable = document.getElementById('yVariable');
        
        if (xVariable && yVariable) {
            xVariable.addEventListener('change', function() {
                if (typeof updateScatterChart === 'function') {
                    updateScatterChart(this.value, yVariable.value);
                }
            });
            
            yVariable.addEventListener('change', function() {
                if (typeof updateScatterChart === 'function') {
                    updateScatterChart(xVariable.value, this.value);
                }
            });
        }
    } catch (error) {
        console.error("Помилка при ініціалізації дашборду:", error);
    }
}

/**
 * Ініціалізація вкладки "Прогнозування ВРП"
 */
function initPredictionTab() {
    try {
        // Обробники подій для показу/приховання полів введення
        const checkboxes = document.querySelectorAll('.variable-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const variable = this.value;
                const inputContainer = document.getElementById(`input_container_${variable}`);
                
                if (inputContainer) {
                    inputContainer.style.display = this.checked ? 'block' : 'none';
                }
            });
        });
        
        // Заповнення форми даними вибраного регіону
        const regionSelect = document.getElementById('regionSelect');
        if (regionSelect) {
            regionSelect.addEventListener('change', function() {
                const selectedRegion = this.value;
                
                if (selectedRegion) {
                    const regionData = regionsData.find(r => r.region === selectedRegion);
                    
                    if (regionData) {
                        // Заповнюємо поля введення даними вибраного регіону
                        for (const variable of analysisVariables) {
                            const input = document.getElementById(`value_${variable}`);
                            if (input && regionData[variable] !== undefined) {
                                input.value = regionData[variable];
                            }
                        }
                    }
                }
            });
        }
        
        // Обробник форми прогнозування
        const predictionForm = document.getElementById('predictionForm');
        if (predictionForm) {
            predictionForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Збираємо вибрані змінні
                const selectedVars = [];
                document.querySelectorAll('.variable-checkbox:checked').forEach(function(checkbox) {
                    selectedVars.push(checkbox.value);
                });
                
                if (selectedVars.length === 0) {
                    alert('Будь ласка, виберіть хоча б одну змінну для моделі');
                    return;
                }
                
                // Збираємо значення змінних
                const values = {};
                let hasInvalidValue = false;
                
                selectedVars.forEach(variable => {
                    const input = document.getElementById(`value_${variable}`);
                    if (input) {
                        const value = parseFloat(input.value);
                        
                        if (isNaN(value)) {
                            alert(`Будь ласка, введіть числове значення для ${varNames[variable]}`);
                            hasInvalidValue = true;
                            return;
                        }
                        
                        values[variable] = value;
                    }
                });
                
                if (hasInvalidValue) return;
                
                // Показуємо індикатор завантаження
                const loadingElement = document.getElementById('loadingPrediction');
                const resultElement = document.getElementById('predictionResult');
                
                if (loadingElement) loadingElement.style.display = 'block';
                if (resultElement) resultElement.style.display = 'none';
                
                // Невелика затримка для анімації
                setTimeout(() => {
                    // Оновлюємо модель з вибраними змінними
                    if (updateModelWithVariables(selectedVars)) {
                        // Обчислюємо прогноз
                        const prediction = predictGRP(window.currentModel, values);
                        
                        // Оновлюємо результат
                        const predictedGRP = document.getElementById('predictedGRP');
                        if (predictedGRP) {
                            predictedGRP.textContent = formatNumber(prediction) + ' млн грн';
                        }
                    }
                    
                    // Приховуємо індикатор завантаження
                    if (loadingElement) loadingElement.style.display = 'none';
                    if (resultElement) resultElement.style.display = 'block';
                }, 800);
            });
        }
    } catch (error) {
        console.error("Помилка при ініціалізації вкладки прогнозування:", error);
    }
}

/**
 * Ініціалізація вкладки "Кореляційна матриця"
 */
function initCorrelationTab() {
    try {
        // Створюємо теплову карту кореляцій
        if (typeof createCorrelationHeatmap === 'function') {
            createCorrelationHeatmap();
        }
        
        // Оновлюємо таблицю VIF, якщо є модель
        if (window.currentModel && typeof updateVIFTable === 'function') {
            updateVIFTable();
        }
    } catch (error) {
        console.error("Помилка при ініціалізації вкладки кореляції:", error);
    }
}

/**
 * Ініціалізація вкладки "Порівняння регіонів"
 */
function initComparisonTab() {
    try {
        // Попередньо вибираємо деякі регіони для зручності
        const preSelectedRegions = ['м.Київ', 'Харківська', 'Одеська', 'Львівська'];
        const regionSelect = document.getElementById('comparisonRegions');
        
        if (regionSelect) {
            // Позначаємо попередньо вибрані регіони
            for (let i = 0; i < regionSelect.options.length; i++) {
                const option = regionSelect.options[i];
                if (preSelectedRegions.includes(option.value)) {
                    option.selected = true;
                }
            }
        }
        
        // Обробник форми порівняння
        const comparisonForm = document.getElementById('comparisonForm');
        if (comparisonForm) {
            comparisonForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Збираємо вибрані регіони
                const selectedRegions = [];
                if (regionSelect) {
                    for (let i = 0; i < regionSelect.options.length; i++) {
                        if (regionSelect.options[i].selected) {
                            selectedRegions.push(regionSelect.options[i].value);
                        }
                    }
                }
                
                if (selectedRegions.length === 0) {
                    alert('Будь ласка, виберіть хоча б один регіон для порівняння');
                    return;
                }
                
                // Збираємо вибрані показники
                const selectedVars = [];
                document.querySelectorAll('input[id^=comp_]:checked').forEach(function(checkbox) {
                    selectedVars.push(checkbox.value);
                });
                
                if (selectedVars.length === 0) {
                    alert('Будь ласка, виберіть хоча б один показник для порівняння');
                    return;
                }
                
                // Фільтруємо дані за вибраними регіонами
                const filteredData = regionsData.filter(region => selectedRegions.includes(region.region));
                
                // Оновлюємо графік і таблицю порівняння
                if (typeof updateComparisonChart === 'function') {
                    updateComparisonChart(filteredData, selectedVars);
                }
                
                if (typeof updateComparisonTable === 'function') {
                    updateComparisonTable(filteredData, selectedVars);
                }
            });
            
            // Викликаємо подію submit для початкового відображення даних
            comparisonForm.dispatchEvent(new Event('submit'));
        }
    } catch (error) {
        console.error("Помилка при ініціалізації вкладки порівняння:", error);
    }
}

/**
 * Ініціалізація всього додатку
 */
function initApp() {
    try {
        console.log("Ініціалізація економетричного аналізатора...");
        
        // Обчислюємо кореляційну матрицю
        window.correlationMatrix = calculateCorrelationMatrix(regionsData, analysisVariables);
        
        // Створюємо початкову модель з базовими змінними
        updateModelWithVariables(['assets', 'new_assets', 'retail']);
        
        // Ініціалізація всіх вкладок
        initDashboard();
        initPredictionTab();
        initCorrelationTab();
        initComparisonTab();
        
        // Додаємо обробники для вкладок
        const tabTriggers = document.querySelectorAll('#mainTab button');
        tabTriggers.forEach(tabTrigger => {
            tabTrigger.addEventListener('click', function(event) {
                // Отримуємо ідентифікатор вкладки
                const tabId = this.id;
                
                // Оновлюємо графіки при переключенні вкладок
                if (tabId === 'correlation-tab') {
                    initCorrelationTab();
                } else if (tabId === 'dashboard-tab') {
                    initDashboard();
                } else if (tabId === 'comparison-tab') {
                    // Викликаємо подію submit для оновлення даних порівняння
                    const comparisonForm = document.getElementById('comparisonForm');
                    if (comparisonForm) {
                        comparisonForm.dispatchEvent(new Event('submit'));
                    }
                }
            });
        });
        
        console.log("Ініціалізація завершена успішно!");
    } catch (error) {
        console.error("Помилка при ініціалізації додатку:", error);
    }
}

// Запускаємо ініціалізацію додатку після завантаження сторінки
document.addEventListener('DOMContentLoaded', initApp);