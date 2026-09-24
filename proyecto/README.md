# API de Mascotas — Clínica Veterinaria (Docker + Nginx + Node.js + MySQL)

Sistema empaquetado en contenedores Docker que expone una API REST CRUD de mascotas
detrás de un proxy inverso Nginx, con persistencia de datos en MySQL.

## Arquitectura

```
Cliente -> Nginx (puerto 8080) -> API Node.js/Express (puerto interno 3000) -> MySQL (puerto interno 3306)
```

Solo el puerto de Nginx (8080) se publica hacia la máquina anfitriona. La API y la base
de datos solo son accesibles dentro de la red interna de Docker (`red_interna`).

| Servicio | Imagen base            | Puerto interno | Puerto publicado | Función                          |
|----------|-------------------------|-----------------|-------------------|-----------------------------------|
| nginx    | nginx:1.27-alpine       | 80              | 8080              | Proxy inverso hacia la API        |
| api      | node:22-alpine (propia) | 3000            | —                 | API REST CRUD de mascotas         |
| db       | mysql:8.4               | 3306            | —                 | Base de datos con volumen         |

## Estructura del proyecto

```
proyecto/
├── docker-compose.yml
├── api/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   └── index.js
├── nginx/
│   └── default.conf
└── db/
    └── init.sql
```

## Requisitos

- Docker y Docker Compose instalados (no se necesita Node.js ni MySQL locales).

## Construcción y ejecución

```bash
# 1. Construir las imágenes
docker compose build

# 2. Levantar el sistema en segundo plano
docker compose up -d

# 3. Verificar que los tres contenedores están corriendo
docker compose ps

# 4. Revisar los logs hasta confirmar la conexión a MySQL
docker compose logs -f api
```

## Endpoints de la API (a través de Nginx, puerto 8080)

Todas las pruebas se hacen contra `http://localhost:8080`, nunca directamente contra la API.

```bash
# Listar todas las mascotas
curl http://localhost:8080/mascotas

# Obtener una mascota por id
curl http://localhost:8080/mascotas/1

# Registrar una nueva mascota
curl -X POST http://localhost:8080/mascotas \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Luna","especie":"Perro","edad":3,"peso":12.5}'

# Actualizar una mascota
curl -X PUT http://localhost:8080/mascotas/1 \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Michi","especie":"Gato","edad":4,"peso":4.2}'

# Eliminar una mascota
curl -X DELETE http://localhost:8080/mascotas/1
```

## Verificar persistencia de datos

```bash
# Registrar una mascota
curl -X POST http://localhost:8080/mascotas -H "Content-Type: application/json" \
  -d '{"nombre":"Toby","especie":"Perro","edad":1,"peso":8.0}'

# Bajar los contenedores SIN borrar el volumen
docker compose down

# Levantar de nuevo
docker compose up -d

# Confirmar que la mascota sigue existiendo
curl http://localhost:8080/mascotas
```

## Limpieza completa

```bash
# Elimina contenedores y también el volumen de datos
docker compose down -v

# Listar y borrar imágenes creadas si es necesario
docker images
docker rmi <nombre_o_id_de_la_imagen>
```

## Variables de entorno de la API

La API toma la configuración de conexión a MySQL desde variables de entorno
(definidas en `docker-compose.yml`), sin credenciales escritas en el código:

- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

## Notas

- El script `db/init.sql` se ejecuta automáticamente en el primer arranque del
  contenedor de MySQL porque se monta en `/docker-entrypoint-initdb.d/`.
- La API reintenta la conexión a MySQL varias veces al iniciar, para tolerar que
  el contenedor de base de datos tarde unos segundos en estar listo.
