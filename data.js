/**
 * Дані регіонів України для економетричного аналізу.
 * Джерело: Державна служба статистики України, 2004 рік.
 */

// Дані регіонів (конвертовані з Excel в JSON)
const regionsData = [
    {"id":1,"region":"Автономна Республіка Крим","grp":9901,"assets":43758,"investments":2740,"employment":899.7,"enterprises":43381,"income":10022,"new_assets":1804,"retail":2434.3},
    {"id":2,"region":"Вінницька","grp":8123,"assets":25993,"investments":1155,"employment":720.8,"enterprises":25292,"income":8747,"new_assets":986,"retail":1668.7},
    {"id":3,"region":"Волинська","grp":4994,"assets":14962,"investments":1064,"employment":423.9,"enterprises":15584,"income":4941,"new_assets":642,"retail":1337.6},
    {"id":4,"region":"Дніпропетровська","grp":30040,"assets":101242,"investments":5906,"employment":1554.4,"enterprises":88363,"income":20033,"new_assets":5427,"retail":6252.2},
    {"id":5,"region":"Донецька","grp":45617,"assets":120475,"investments":7239,"employment":2055.9,"enterprises":81250,"income":31906,"new_assets":7130,"retail":7281.1},
    {"id":6,"region":"Житомирська","grp":5947,"assets":21576,"investments":931,"employment":554.3,"enterprises":17926,"income":6362,"new_assets":718,"retail":1508.7},
    {"id":7,"region":"Закарпатська","grp":5297,"assets":12914,"investments":1113,"employment":551.3,"enterprises":13399,"income":5373,"new_assets":748,"retail":1446.9},
    {"id":8,"region":"Запорізька","grp":15255,"assets":72390,"investments":2745,"employment":848.6,"enterprises":45740,"income":11883,"new_assets":2270,"retail":3168.2},
    {"id":9,"region":"Івано-Франківська","grp":6916,"assets":22123,"investments":1589,"employment":534.6,"enterprises":15391,"income":6768,"new_assets":1081,"retail":1430.1},
    {"id":10,"region":"Київська","grp":11883,"assets":42270,"investments":3547,"employment":741.7,"enterprises":39593,"income":10655,"new_assets":2694,"retail":2506.3},
    {"id":11,"region":"Кіровоградська","grp":5594,"assets":17520,"investments":1357,"employment":471.9,"enterprises":16426,"income":5456,"new_assets":837,"retail":1345.2},
    {"id":12,"region":"Луганська","grp":14672,"assets":55301,"investments":2941,"employment":1018.8,"enterprises":33873,"income":13443,"new_assets":2447,"retail":2753.5},
    {"id":13,"region":"Львівська","grp":13992,"assets":44063,"investments":3634,"employment":1061.2,"enterprises":57440,"income":14307,"new_assets":2871,"retail":3644.9},
    {"id":14,"region":"Миколаївська","grp":7934,"assets":25401,"investments":1963,"employment":547.4,"enterprises":24108,"income":6824,"new_assets":1251,"retail":1771.8},
    {"id":15,"region":"Одеська","grp":17029,"assets":54775,"investments":4875,"employment":1021.6,"enterprises":51981,"income":14026,"new_assets":3285,"retail":4055.6},
    {"id":16,"region":"Полтавська","grp":13983,"assets":42153,"investments":2887,"employment":696.1,"enterprises":27124,"income":10383,"new_assets":2184,"retail":2223.2},
    {"id":17,"region":"Рівненська","grp":5599,"assets":19576,"investments":1078,"employment":453.5,"enterprises":13425,"income":5655,"new_assets":882,"retail":1287.3},
    {"id":18,"region":"Сумська","grp":6275,"assets":25243,"investments":1102,"employment":530.3,"enterprises":15693,"income":6690,"new_assets":906,"retail":1413.3},
    {"id":19,"region":"Тернопільська","grp":4577,"assets":13779,"investments":632,"employment":419.2,"enterprises":13167,"income":4854,"new_assets":513,"retail":1040.2},
    {"id":20,"region":"Харківська","grp":20524,"assets":72261,"investments":5055,"employment":1292.9,"enterprises":71085,"income":17242,"new_assets":3967,"retail":5228.2},
    {"id":21,"region":"Херсонська","grp":5200,"assets":18086,"investments":886,"employment":511.1,"enterprises":16933,"income":5421,"new_assets":744,"retail":1569.7},
    {"id":22,"region":"Хмельницька","grp":6344,"assets":19922,"investments":1150,"employment":584.8,"enterprises":19030,"income":6923,"new_assets":821,"retail":1527.4},
    {"id":23,"region":"Черкаська","grp":6623,"assets":23412,"investments":1364,"employment":576.5,"enterprises":18998,"income":6672,"new_assets":986,"retail":1494.5},
    {"id":24,"region":"Чернівецька","grp":3277,"assets":10323,"investments":656,"employment":356.3,"enterprises":9772,"income":3939,"new_assets":595,"retail":894.4},
    {"id":25,"region":"Чернігівська","grp":6181,"assets":22169,"investments":867,"employment":531.4,"enterprises":15462,"income":6210,"new_assets":731,"retail":1256.1},
    {"id":26,"region":"м.Київ","grp":61357,"assets":130758,"investments":13859,"employment":1371.1,"enterprises":171525,"income":35858,"new_assets":14306,"retail":13254.1},
    {"id":27,"region":"м.Севастополь","grp":2213,"assets":7822,"investments":557,"employment":177.0,"enterprises":11633,"income":2407,"new_assets":477,"retail":684.2}
];

// Назви змінних для відображення
const varNames = {
    'grp': 'ВРП',
    'assets': 'Основні засоби',
    'investments': 'Інвестиції',
    'employment': 'Зайнятість населення',
    'enterprises': 'Кількість підприємств',
    'income': 'Доходи населення',
    'new_assets': 'Нові основні засоби',
    'retail': 'Роздрібний товарооборот',
    'const': 'Вільний член'
};

// Колірна схема для візуалізацій
const colorScheme = [
    'rgba(78, 115, 223, 0.7)',  // синій
    'rgba(255, 99, 132, 0.7)',  // рожевий
    'rgba(255, 205, 86, 0.7)',  // жовтий
    'rgba(75, 192, 192, 0.7)',  // бірюзовий
    'rgba(153, 102, 255, 0.7)', // фіолетовий
    'rgba(255, 159, 64, 0.7)',  // оранжевий
    'rgba(54, 162, 235, 0.7)',  // блакитний
    'rgba(201, 203, 207, 0.7)'  // сірий
];

// Список змінних для аналізу (перейменовано з variables на analysisVariables)
const analysisVariables = ['grp', 'assets', 'investments', 'employment', 'enterprises', 'income', 'new_assets', 'retail'];

// Попередньо обчислені початкові коефіцієнти для трьох базових змінних
const initialCoefficients = {
    const: -874.5380448962242,
    assets: 0.1554948848384119,
    new_assets: 3.035719501617038,
    retail: 0.06958420355607586
};

// Функція для отримання кольору кореляції
function getCorrelationColor(value) {
    if (value >= 0.8) return 'rgba(42, 120, 220, 0.9)';
    if (value >= 0.6) return 'rgba(42, 120, 220, 0.7)';
    if (value >= 0.4) return 'rgba(42, 120, 220, 0.5)';
    if (value >= 0.2) return 'rgba(42, 120, 220, 0.3)';
    if (value >= 0) return 'rgba(221, 221, 221, 0.5)';
    if (value >= -0.2) return 'rgba(219, 68, 55, 0.3)';
    if (value >= -0.4) return 'rgba(219, 68, 55, 0.5)';
    if (value >= -0.6) return 'rgba(219, 68, 55, 0.7)';
    return 'rgba(219, 68, 55, 0.9)';
}

// Функція для форматування чисел з комами для тисяч
function formatNumber(number) {
    return new Intl.NumberFormat('uk-UA').format(Math.round(number));
}