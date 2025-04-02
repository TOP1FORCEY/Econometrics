FROM nginx:alpine

# Копіюємо HTML-файл
COPY . /usr/share/nginx/html/

# Відкриваємо порт 80
EXPOSE 80

# Запускаємо Nginx
CMD ["nginx", "-g", "daemon off;"]