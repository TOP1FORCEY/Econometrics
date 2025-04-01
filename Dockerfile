FROM nginx:alpine

# Створюємо директорію для статичних файлів, якщо її немає в образі
RUN mkdir -p /usr/share/nginx/html/static/data

# Копіюємо HTML-файл
COPY templates/index.html /usr/share/nginx/html/index.html

# Копіюємо Excel-файл
COPY static/data/Multicolinear.xlsx /usr/share/nginx/html/static/data/Multicolinear.xlsx

# Відкриваємо порт 80
EXPOSE 80

# Запускаємо Nginx
CMD ["nginx", "-g", "daemon off;"]