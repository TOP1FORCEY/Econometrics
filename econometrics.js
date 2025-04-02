/**
 * Економетричні функції для аналізу даних
 * Бібліотека реалізує методи регресійного аналізу та обчислення факторів інфляції дисперсії
 */

/**
 * Функція для обчислення множинної лінійної регресії методом найменших квадратів
 * @param {Array} data - масив об'єктів з даними
 * @param {String} dependentVar - назва залежної змінної
 * @param {Array} independentVars - масив назв незалежних змінних
 * @returns {Object} об'єкт з результатами регресії
 */
function calculateLinearRegression(data, dependentVar, independentVars) {
    // Перевірка наявності даних
    if (!data || data.length === 0 || !dependentVar || !independentVars || independentVars.length === 0) {
        console.error("Недостатньо даних для регресії");
        return null;
    }
    
    // Кількість спостережень та змінних
    const n = data.length;
    const k = independentVars.length;
    
    // Масив Y (залежна змінна)
    const Y = data.map(item => item[dependentVar]);
    
    // Матриця X (незалежні змінні з додаванням колонки з одиниць для константи)
    const X = data.map(item => [1, ...independentVars.map(v => item[v])]);
    
    try {
        // Транспонована матриця X
        const Xt = transposeMatrix(X);
        
        // Обчислення (X'X)^(-1)
        const XtX = multiplyMatrices(Xt, X);
        const XtX_inv = invertMatrix(XtX);
        
        if (!XtX_inv) {
            console.error("Неможливо обчислити обернену матрицю. Можлива мультиколінеарність.");
            return null;
        }
        
        // Обчислення X'Y
        const XtY = multiplyMatrixVector(Xt, Y);
        
        // Обчислення коефіцієнтів: β = (X'X)^(-1)X'Y
        const beta = multiplyMatrixVector(XtX_inv, XtY);
        
        // Обчислення прогнозованих значень
        const predicted = X.map(row => {
            let sum = 0;
            for (let i = 0; i < row.length; i++) {
                sum += row[i] * beta[i];
            }
            return sum;
        });
        
        // Обчислення залишків
        const residuals = Y.map((y, i) => y - predicted[i]);
        
        // Сума квадратів залишків (RSS)
        const RSS = residuals.reduce((sum, r) => sum + r * r, 0);
        
        // Загальна сума квадратів (TSS)
        const mean_Y = Y.reduce((sum, y) => sum + y, 0) / n;
        const TSS = Y.reduce((sum, y) => sum + (y - mean_Y) * (y - mean_Y), 0);
        
        // Коефіцієнт детермінації (R^2)
        const rSquared = 1 - (RSS / TSS);
        
        // Скоригований R^2
        const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1) / (n - k - 1));
        
        // Стандартна помилка регресії
        const standardError = Math.sqrt(RSS / (n - k - 1));
        
        // Створення об'єкта коефіцієнтів для зручності
        const coefficients = {
            const: beta[0]
        };
        
        independentVars.forEach((varName, i) => {
            coefficients[varName] = beta[i + 1];
        });
        
        // Обчислення VIF (фактор інфляції дисперсії) для незалежних змінних
        const vifValues = calculateVIFValues(data, independentVars);
        
        return {
            coefficients,
            rSquared,
            adjustedRSquared,
            standardError,
            predicted,
            residuals,
            vifValues
        };
    } catch (error) {
        console.error("Помилка при обчисленні регресії:", error);
        return null;
    }
}

/**
 * Функція для обчислення факторів інфляції дисперсії (VIF)
 * @param {Array} data - масив об'єктів з даними
 * @param {Array} independentVars - масив назв незалежних змінних
 * @returns {Object} об'єкт з факторами інфляції дисперсії для кожної змінної
 */
function calculateVIFValues(data, independentVars) {
    const vifValues = {};
    
    for (let i = 0; i < independentVars.length; i++) {
        const currentVar = independentVars[i];
        const otherVars = independentVars.filter(v => v !== currentVar);
        
        // Перевірка: якщо залишилося 0 змінних, VIF не можна розрахувати
        if (otherVars.length === 0) {
            vifValues[currentVar] = 1;
            continue;
        }
        
        // Регресія поточної змінної на інші незалежні змінні
        const auxRegression = calculateSimpleRegression(data, currentVar, otherVars);
        
        // Якщо допоміжна регресія не змогла бути обчислена
        if (!auxRegression) {
            vifValues[currentVar] = null;
            continue;
        }
        
        // VIF = 1 / (1 - R^2 допоміжної регресії)
        vifValues[currentVar] = 1 / (1 - auxRegression.rSquared);
    }
    
    return vifValues;
}

/**
 * Спрощена функція для регресії (використовується в обчисленні VIF)
 * @param {Array} data - масив об'єктів з даними
 * @param {String} dependentVar - назва залежної змінної
 * @param {Array} independentVars - масив назв незалежних змінних
 * @returns {Object} об'єкт з результатами регресії (тільки R^2)
 */
function calculateSimpleRegression(data, dependentVar, independentVars) {
    if (!data || data.length === 0 || !dependentVar || !independentVars || independentVars.length === 0) {
        return null;
    }
    
    const n = data.length;
    const Y = data.map(item => item[dependentVar]);
    const X = data.map(item => [1, ...independentVars.map(v => item[v])]);
    
    try {
        const Xt = transposeMatrix(X);
        const XtX = multiplyMatrices(Xt, X);
        const XtX_inv = invertMatrix(XtX);
        
        if (!XtX_inv) return null;
        
        const XtY = multiplyMatrixVector(Xt, Y);
        const beta = multiplyMatrixVector(XtX_inv, XtY);
        
        const predicted = X.map(row => {
            let sum = 0;
            for (let i = 0; i < row.length; i++) {
                sum += row[i] * beta[i];
            }
            return sum;
        });
        
        const residuals = Y.map((y, i) => y - predicted[i]);
        const RSS = residuals.reduce((sum, r) => sum + r * r, 0);
        
        const mean_Y = Y.reduce((sum, y) => sum + y, 0) / n;
        const TSS = Y.reduce((sum, y) => sum + (y - mean_Y) * (y - mean_Y), 0);
        
        const rSquared = 1 - (RSS / TSS);
        
        return { rSquared };
    } catch (error) {
        console.error("Помилка при обчисленні допоміжної регресії:", error);
        return null;
    }
}

/**
 * Функція для обчислення кореляційної матриці
 * @param {Array} data - масив об'єктів з даними
 * @param {Array} variables - масив назв змінних
 * @returns {Object} об'єкт з кореляційною матрицею
 */
function calculateCorrelationMatrix(data, variables) {
    const n = data.length;
    const correlationMatrix = {};
    
    // Ініціалізація кореляційної матриці
    variables.forEach(var1 => {
        correlationMatrix[var1] = {};
        variables.forEach(var2 => {
            correlationMatrix[var1][var2] = 0;
        });
    });
    
    // Обчислення середніх значень
    const means = {};
    variables.forEach(variable => {
        means[variable] = data.reduce((sum, item) => sum + item[variable], 0) / n;
    });
    
    // Обчислення стандартних відхилень
    const stdDevs = {};
    variables.forEach(variable => {
        const variance = data.reduce((sum, item) => {
            const diff = item[variable] - means[variable];
            return sum + diff * diff;
        }, 0) / n;
        stdDevs[variable] = Math.sqrt(variance);
    });
    
    // Обчислення коефіцієнтів кореляції
    variables.forEach(var1 => {
        variables.forEach(var2 => {
            if (var1 === var2) {
                correlationMatrix[var1][var2] = 1; // Кореляція змінної з самою собою завжди 1
            } else {
                let covariance = 0;
                for (let i = 0; i < n; i++) {
                    covariance += (data[i][var1] - means[var1]) * (data[i][var2] - means[var2]);
                }
                covariance /= n;
                
                const correlation = covariance / (stdDevs[var1] * stdDevs[var2]);
                correlationMatrix[var1][var2] = correlation;
                correlationMatrix[var2][var1] = correlation; // Матриця симетрична
            }
        });
    });
    
    return correlationMatrix;
}

/**
 * Функція для передбачення значення на основі моделі
 * @param {Object} model - об'єкт моделі регресії
 * @param {Object} data - об'єкт з даними для прогнозу
 * @returns {Number} прогнозоване значення
 */
function predictGRP(model, data) {
    if (!model || !model.coefficients || !data) {
        return null;
    }
    
    let prediction = model.coefficients.const || 0;
    
    for (const variable in model.coefficients) {
        if (variable !== 'const' && data[variable] !== undefined) {
            prediction += model.coefficients[variable] * data[variable];
        }
    }
    
    return prediction;
}

/**
 * Транспонування матриці
 * @param {Array} matrix - вхідна матриця
 * @returns {Array} транспонована матриця
 */
function transposeMatrix(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result = Array(cols).fill().map(() => Array(rows).fill(0));
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            result[j][i] = matrix[i][j];
        }
    }
    
    return result;
}

/**
 * Множення матриць
 * @param {Array} a - перша матриця
 * @param {Array} b - друга матриця
 * @returns {Array} результат множення матриць
 */
function multiplyMatrices(a, b) {
    const rowsA = a.length;
    const colsA = a[0].length;
    const rowsB = b.length;
    const colsB = b[0].length;
    
    if (colsA !== rowsB) {
        console.error("Неможливо помножити матриці: невідповідні розміри");
        return null;
    }
    
    const result = Array(rowsA).fill().map(() => Array(colsB).fill(0));
    
    for (let i = 0; i < rowsA; i++) {
        for (let j = 0; j < colsB; j++) {
            for (let k = 0; k < colsA; k++) {
                result[i][j] += a[i][k] * b[k][j];
            }
        }
    }
    
    return result;
}

/**
 * Множення матриці на вектор
 * @param {Array} matrix - матриця
 * @param {Array} vector - вектор
 * @returns {Array} результат множення
 */
function multiplyMatrixVector(matrix, vector) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    
    if (cols !== vector.length) {
        console.error("Неможливо помножити матрицю на вектор: невідповідні розміри");
        return null;
    }
    
    const result = Array(rows).fill(0);
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            result[i] += matrix[i][j] * vector[j];
        }
    }
    
    return result;
}

/**
 * Обчислення мінору матриці
 * @param {Array} matrix - вхідна матриця
 * @param {Number} row - рядок, який виключається
 * @param {Number} col - стовпець, який виключається
 * @returns {Array} мінор матриці
 */
function getMinor(matrix, row, col) {
    const result = [];
    
    for (let i = 0; i < matrix.length; i++) {
        if (i !== row) {
            const temp = [];
            for (let j = 0; j < matrix[i].length; j++) {
                if (j !== col) {
                    temp.push(matrix[i][j]);
                }
            }
            result.push(temp);
        }
    }
    
    return result;
}

/**
 * Обчислення детермінанта матриці
 * @param {Array} matrix - вхідна матриця
 * @returns {Number} детермінант матриці
 */
function determinant(matrix) {
    // Базовий випадок для матриці 1x1
    if (matrix.length === 1) {
        return matrix[0][0];
    }
    
    // Базовий випадок для матриці 2x2
    if (matrix.length === 2) {
        return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    }
    
    let det = 0;
    const n = matrix.length;
    
    // Розкладання за першим рядком
    for (let j = 0; j < n; j++) {
        det += Math.pow(-1, j) * matrix[0][j] * determinant(getMinor(matrix, 0, j));
    }
    
    return det;
}

/**
 * Обчислення оберненої матриці
 * @param {Array} matrix - вхідна матриця
 * @returns {Array} обернена матриця
 */
function invertMatrix(matrix) {
    const n = matrix.length;
    
    // Для малих матриць використовуємо точний метод
    if (n <= 4) {
        // Створюємо матрицю алгебраїчних доповнень
        const adjMatrix = Array(n).fill().map(() => Array(n).fill(0));
        
        // Детермінант вихідної матриці
        const det = determinant(matrix);
        
        // Перевірка на виродженість
        if (Math.abs(det) < 1e-10) {
            console.error("Матриця вироджена (детермінант близький до нуля)");
            return null;
        }
        
        // Обчислення матриці алгебраїчних доповнень
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const minor = getMinor(matrix, i, j);
                const sign = Math.pow(-1, i + j);
                const minorDet = determinant(minor);
                adjMatrix[j][i] = sign * minorDet; // Транспонування відбувається тут
            }
        }
        
        // Ділення кожного елемента на детермінант
        const invMatrix = Array(n).fill().map(() => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                invMatrix[i][j] = adjMatrix[i][j] / det;
            }
        }
        
        return invMatrix;
    } else {
        // Для великих матриць використовуємо метод Гауса-Жордана
        return invertMatrixGaussJordan(matrix);
    }
}

/**
 * Обчислення оберненої матриці методом Гауса-Жордана
 * @param {Array} matrix - вхідна матриця
 * @returns {Array} обернена матриця
 */
function invertMatrixGaussJordan(matrix) {
    const n = matrix.length;
    
    // Створюємо доповнену матрицю [A|I]
    const augmented = [];
    for (let i = 0; i < n; i++) {
        augmented[i] = matrix[i].slice(); // Копіюємо рядок матриці
        // Додаємо одиничну матрицю
        for (let j = 0; j < n; j++) {
            augmented[i].push(i === j ? 1 : 0);
        }
    }
    
    // Прямий хід методу Гауса
    for (let i = 0; i < n; i++) {
        // Пошук максимального елемента у стовпці для часткового вибору
        let maxEl = Math.abs(augmented[i][i]);
        let maxRow = i;
        for (let j = i + 1; j < n; j++) {
            if (Math.abs(augmented[j][i]) > maxEl) {
                maxEl = Math.abs(augmented[j][i]);
                maxRow = j;
            }
        }
        
        // Перевірка на виродженість
        if (maxEl < 1e-10) {
            console.error("Матриця вироджена");
            return null;
        }
        
        // Обмін рядків
        if (maxRow !== i) {
            [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
        }
        
        // Нормалізація поточного рядка
        const pivot = augmented[i][i];
        for (let j = i; j < 2 * n; j++) {
            augmented[i][j] /= pivot;
        }
        
        // Виключаємо поточний стовпець з усіх інших рядків
        for (let j = 0; j < n; j++) {
            if (j !== i) {
                const factor = augmented[j][i];
                for (let k = i; k < 2 * n; k++) {
                    augmented[j][k] -= factor * augmented[i][k];
                }
            }
        }
    }
    
    // Витягуємо праву частину (обернену матрицю)
    const invMatrix = Array(n).fill().map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            invMatrix[i][j] = augmented[i][j + n];
        }
    }
    
    return invMatrix;
}