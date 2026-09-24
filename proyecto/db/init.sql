-- Se ejecuta automáticamente en el primer arranque del contenedor de MySQL
-- porque se monta en /docker-entrypoint-initdb.d/

CREATE DATABASE IF NOT EXISTS clinica_veterinaria;
USE clinica_veterinaria;

CREATE TABLE IF NOT EXISTS mascotas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    especie VARCHAR(50) NOT NULL,
    edad INT NOT NULL,
    peso DECIMAL(5,2) NOT NULL
);

INSERT INTO mascotas (nombre, especie, edad, peso) VALUES
    ('Luna', 'Perro', 3, 12.50),
    ('Michi', 'Gato', 2, 4.20),
    ('Rocky', 'Perro', 5, 22.80);
