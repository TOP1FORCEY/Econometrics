from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score
import json
import os
import statsmodels.api as sm

app = Flask(__name__)

# Шлях до файлу даних
DATA_FILE = 'static/data/Multicolinear.xlsx'

def load_data():
    """Завантаження та обробка даних з Excel-файлу"""
    try:
        # Зчитуємо дані, пропускаючи перший рядок заголовку
        df = pd.read_excel(DATA_FILE, skiprows=1)
        
        # Перейменовуємо колонки для зручності
        columns = {
            'Валовий регіональний продукт (ВРП) у фактичних цінах, млн грн': 'grp',
            'Основні засоби у фактичних цінах, млн грн': 'assets',
            'Інвестиції в основний капітал у фактичних цінах, млн грн': 'investments',
            'Зайнятість населення, тис. осіб': 'employment',
            'Кількість підприємств на початок 2005 року, од.': 'enterprises',
            'Доходи населення, млн грн': 'income',
            'Введення в дію нових основних засобів, млн грн': 'new_assets',
            'Роздрібний товарооборот підприємств, млн грн': 'retail',
            'Область': 'region',
            '№ з/п': 'id'
        }
        
        # Перейменовуємо колонки
        df = df.rename(columns=columns)
        
        # Відбираємо тільки потрібні колонки
        selected_columns = ['id', 'region', 'grp', 'assets', 'investments', 'employment', 
                           'enterprises', 'income', 'new_assets', 'retail']
        
        # Фільтруємо тільки рядки з даними регіонів
        df = df[df['id'].notna()][selected_columns]
        
        return df
    except Exception as e:
        print(f"Помилка завантаження даних: {e}")
        # Повертаємо пустий DataFrame якщо сталася помилка
        return pd.DataFrame()

def calculate_correlation_matrix(df):
    """Розрахунок кореляційної матриці"""
    # Вибираємо числові колонки
    numeric_columns = ['grp', 'assets', 'investments', 'employment', 
                      'enterprises', 'income', 'new_assets', 'retail']
    
    # Розрахунок кореляційної матриці
    corr_matrix = df[numeric_columns].corr().round(3)
    
    return corr_matrix

def calculate_vif(df, independent_vars):
    """Розрахунок фактору інфляції дисперсії (VIF) для виявлення мультиколінеарності"""
    # Перевіряємо дані на наявність NaN або Inf
    df_clean = df.copy()
    
    # Замінюємо NaN на середні значення
    for var in independent_vars:
        df_clean[var] = df_clean[var].replace([np.inf, -np.inf], np.nan)
        df_clean[var] = df_clean[var].fillna(df_clean[var].mean())
    
    vif_data = pd.DataFrame()
    vif_data["feature"] = independent_vars
    
    # Для кожної змінної створюємо модель де вона є залежною, а інші незалежними
    for i in range(len(independent_vars)):
        try:
            y = df_clean[independent_vars[i]]
            X = df_clean[independent_vars[:i] + independent_vars[i+1:]]
            
            # Додаємо константу
            X = sm.add_constant(X)
            
            # Розрахунок VIF
            model = sm.OLS(y, X).fit()
            r_squared = model.rsquared
            vif = 1 / (1 - r_squared)
            vif_data.loc[i, "VIF"] = vif
        except Exception as e:
            print(f"Помилка при розрахунку VIF для {independent_vars[i]}: {e}")
            vif_data.loc[i, "VIF"] = np.nan
    
    # Замінюємо будь-які NaN значення у результатах
    vif_data["VIF"] = vif_data["VIF"].fillna(999)  # Високе значення для змінних із проблемами
    
    return vif_data

def build_regression_model(df, independent_vars):
    """Побудова регресійної моделі з вибраними змінними"""
    # Очищаємо дані
    df_clean = df.copy()
    
    # Замінюємо NaN та Inf на середні значення
    for col in independent_vars + ['grp']:
        df_clean[col] = df_clean[col].replace([np.inf, -np.inf], np.nan)
        if df_clean[col].isna().any():
            mean_val = df_clean[col].mean(skipna=True)
            df_clean[col] = df_clean[col].fillna(mean_val)
    
    # Підготовка даних
    X = df_clean[independent_vars]
    y = df_clean['grp']
    
    # Додавання константи для перехоплення
    X = sm.add_constant(X)
    
    # Побудова моделі
    try:
        model = sm.OLS(y, X).fit()
        
        # Отримання коефіцієнтів
        coefficients = model.params.to_dict()
        
        # Розрахунок R-квадрат
        r_squared = model.rsquared
        
        # Прогнозовані значення
        df_clean['predicted_grp'] = model.predict(X)
        
        return {
            'coefficients': coefficients,
            'r_squared': r_squared,
            'summary': model.summary(),
            'predicted_values': df_clean[['region', 'grp', 'predicted_grp']].to_dict(orient='records')
        }
    except Exception as e:
        print(f"Помилка при побудові регресійної моделі: {e}")
        # Повертаємо заглушку у випадку помилки
        return {
            'coefficients': {var: 0 for var in ['const'] + independent_vars},
            'r_squared': 0,
            'summary': None,
            'predicted_values': df_clean[['region', 'grp']].assign(predicted_grp=0).to_dict(orient='records')
        }

@app.route('/')
def index():
    """Головна сторінка"""
    try:
        # Завантажуємо дані
        df = load_data()
        
        if df.empty:
            return render_template('error.html', message="Не вдалося завантажити дані")
        
        # Отримуємо список регіонів
        regions = df['region'].tolist()
        
        # Отримуємо змінні для аналізу
        variables = ['assets', 'investments', 'employment', 'enterprises', 'income', 'new_assets', 'retail']
        
        # Розрахунок кореляційної матриці
        corr_matrix = calculate_correlation_matrix(df)
        
        # Перетворюємо кореляційну матрицю в JSON для використання на клієнті
        corr_data = corr_matrix.to_json()
        
        # Розрахунок VIF для виявлення мультиколінеарності
        vif_data = calculate_vif(df, variables)
        
        # Сортуємо за VIF для вибору найменш колінеарних змінних
        vif_data = vif_data.sort_values('VIF')
        
        # Вибираємо 3 найменш колінеарні змінні
        default_vars = vif_data['feature'].head(3).tolist()
        
        # Будуємо модель з вибраними змінними
        model_result = build_regression_model(df, default_vars)
        
        # Перетворюємо дані в JSON для передачі в шаблон
        data_json = df.to_json(orient='records')
        
        return render_template('index.html', 
                              regions=regions,
                              variables=variables,
                              default_vars=default_vars,
                              corr_data=corr_data,
                              vif_data=vif_data.to_dict(orient='records'),
                              model_result=model_result,
                              data_json=data_json)
    
    except Exception as e:
        return render_template('error.html', message=f"Помилка: {str(e)}")

@app.route('/predict', methods=['POST'])
def predict():
    """API для прогнозування ВРП на основі вибраних змінних та їх значень"""
    try:
        # Отримуємо дані з POST-запиту
        data = request.get_json()
        
        # Вибрані змінні та їх значення
        selected_vars = data.get('variables', [])
        values = data.get('values', {})
        
        # Завантажуємо дані
        df = load_data()
        
        # Будуємо модель
        model_result = build_regression_model(df, selected_vars)
        
        # Підготовка даних для прогнозу
        prediction_data = {}
        for var in selected_vars:
            prediction_data[var] = float(values.get(var, 0))
        
        # Додаємо константу
        prediction_data['const'] = 1.0
        
        # Розрахунок прогнозу
        coefficients = model_result['coefficients']
        predicted_grp = sum(coefficients[var] * prediction_data[var] for var in prediction_data)
        
        return jsonify({
            'predicted_grp': predicted_grp,
            'coefficients': coefficients,
            'r_squared': model_result['r_squared']
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/compare_regions', methods=['POST'])
def compare_regions():
    """API для порівняння регіонів за вибраними показниками"""
    try:
        # Отримуємо дані з POST-запиту
        data = request.get_json()
        
        # Вибрані регіони та показники
        selected_regions = data.get('regions', [])
        selected_vars = data.get('variables', [])
        
        # Завантажуємо дані
        df = load_data()
        
        # Фільтруємо дані за вибраними регіонами
        filtered_df = df[df['region'].isin(selected_regions)]
        
        # Вибираємо тільки потрібні колонки
        result_df = filtered_df[['region'] + selected_vars]
        
        return jsonify(result_df.to_dict(orient='records'))
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    # Створюємо директорію для даних, якщо вона не існує
    os.makedirs('static/data', exist_ok=True)
    
    # Запускаємо додаток в режимі розробки
    app.run(debug=True)