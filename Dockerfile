FROM nginx:alpine

# Копіюємо HTML-файл
COPY index.html /usr/share/nginx/html/index.html

# Відкриваємо порт 80
EXPOSE 80

# Запускаємо Nginx
CMD ["nginx", "-g", "daemon off;"]