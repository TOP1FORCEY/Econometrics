FROM nginx:alpine

# Копіюємо HTML-файл у веб-директорію Nginx
COPY templates/index.html /usr/share/nginx/html/index.html

# Копіюємо Excel-файл для потенційного використання в майбутньому
COPY static/data/Multicolinear.xlsx /usr/share/nginx/html/static/data/Multicolinear.xlsx

# Відкриваємо порт 80
EXPOSE 80

# Запускаємо Nginx
CMD ["nginx", "-g", "daemon off;"]