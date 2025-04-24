DROP DATABASE IF EXISTS practica;
CREATE DATABASE practica;
USE practica;

CREATE TABLE `Usuarios` (
  `uid_number` integer PRIMARY KEY AUTO_INCREMENT,
  `gid_number` integer,
  `nombre_usuario` varchar(255),
  `fecha_alta` date,
  `fecha_baja` date,
  `activo` bool,
  `contacto` varchar(255),
  `telefono` varchar(255),
  `orcid` varchar(255),
  `scholar` varchar(255),
  `wos` varchar(255),
  `scopus` varchar(255),
  `res` varchar(255)
);

CREATE TABLE `Investigadores` (
  `iid_number` integer PRIMARY KEY AUTO_INCREMENT,
  `nombre_investigador` varchar(255),
  `correo` varchar(255)
);

CREATE TABLE `Proyectos` (
  `pid_number` integer PRIMARY KEY AUTO_INCREMENT,
  `titulo` varchar(255),
  `fecha_inicio` date,
  `fecha_fin` date,
  `email` varchar(255),
  `gid_number` integer,
  `institucion` varchar(255),
  `procedencia` varchar(255),
  `categoria` enum('Ciencias Informáticas y de Comunicaciones','Ciencias de la vida')
);

CREATE TABLE `Publicaciones` (
  `result_code` integer PRIMARY KEY AUTO_INCREMENT,
  `result_description` varchar(255),
  `fecha_publicacion` date,
  `doi` varchar(255)
);

CREATE TABLE `Grupos` (
  `gid_number` integer PRIMARY KEY AUTO_INCREMENT,
  `nombre` varchar(255)
);


CREATE TABLE `Investigadores_Publicaciones` (
  `investigador_id` integer,
  `publicacion_id` integer,
  PRIMARY KEY(investigador_id,publicacion_id)
);


CREATE TABLE `Investigadores_Usuarios` (
  `usuario_id` integer,
  `investigador_id` integer,
  PRIMARY KEY(usuario_id,investigador_id)
);

CREATE TABLE `Usuarios_Proyectos` (
  `usuario_id` integer,
  `proyectos_id` integer,
  PRIMARY KEY(usuario_id,proyectos_id)
);

CREATE TABLE usuarios_grupos (
    usuario_id INT,
    grupo_id INT,
    PRIMARY KEY (usuario_id, grupo_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(uid_number) ON DELETE CASCADE,
    FOREIGN KEY (grupo_id) REFERENCES grupos(gid_number) ON DELETE CASCADE
);

ALTER TABLE proyectos MODIFY categoria VARCHAR(500);
ALTER TABLE publicaciones MODIFY result_description VARCHAR(500);
ALTER TABLE publicaciones MODIFY doi VARCHAR(500);

-- Foreign keys

ALTER TABLE `Proyectos` ADD FOREIGN KEY (`gid_number`) REFERENCES `Grupos` (`gid_number`);

ALTER TABLE `Usuarios` ADD FOREIGN KEY (`gid_number`) REFERENCES `Grupos`(`gid_number`)  ;

ALTER TABLE `Investigadores_Publicaciones` ADD FOREIGN KEY (`investigador_id`) REFERENCES `Investigadores` (`iid_number`);

ALTER TABLE `Investigadores_Publicaciones` ADD FOREIGN KEY (`publicacion_id`) REFERENCES `Publicaciones` (`result_code`);

ALTER TABLE `Investigadores_Usuarios` ADD FOREIGN KEY (`usuario_id`) REFERENCES `Usuarios` (`uid_number`);

ALTER TABLE `Investigadores_Usuarios` ADD FOREIGN KEY (`investigador_id`) REFERENCES `Investigadores` (`iid_number`);

ALTER TABLE `Usuarios_Proyectos` ADD FOREIGN KEY (`usuario_id`) REFERENCES `Usuarios` (`uid_number`);

ALTER TABLE `Usuarios_Proyectos` ADD FOREIGN KEY (`proyectos_id`) REFERENCES `Proyectos` (`pid_number`);

-- Indices para las tablas de publicaciones , proyectos, investigadores y grupos para los ids
CREATE INDEX `idx_result_code` ON `Publicaciones` (`result_code`);
CREATE INDEX `idx_pid_number` ON `Proyectos` (`pid_number`);
CREATE INDEX `idx_iid_number` ON `Investigadores` (`iid_number`);

-- Ajuste del valor de AUTO_INCREMENT para la tabla Grupos
-- ALTER TABLE `Grupos` AUTO_INCREMENT = 10000;

DELIMITER $$
CREATE TRIGGER before_insert_grupos
BEFORE INSERT ON Grupos
FOR EACH ROW
BEGIN
  DECLARE ultimo_id INT;
  SELECT IFNULL(MAX(gid_number), 0) INTO ultimo_id
  FROM Grupos;
  IF ultimo_id = 0 THEN
    SET NEW.gid_number = 10000;
  ELSE
    SET NEW.gid_number = ultimo_id + 100;
  END IF;
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER before_insert_usuarios
BEFORE INSERT ON Usuarios
FOR EACH ROW
BEGIN
  DECLARE ultimo_id INT;

  -- Obtener el último uid asociado al gid
  SELECT IFNULL(MAX(uid_number), 0) INTO ultimo_id
  FROM Usuarios
  WHERE gid_number = NEW.gid_number;

  -- Si es el primer usuario del grupo
  IF ultimo_id = 0 THEN
    SET NEW.uid_number = NEW.gid_number + 1;
  ELSE
    SET NEW.uid_number = ultimo_id + 1;
  END IF;

  -- Configurar el valor de activo basado en fecha_baja
  IF NEW.fecha_baja IS NULL THEN
    SET NEW.activo = TRUE;
  ELSEIF NEW.fecha_baja < CURDATE() THEN
    SET NEW.activo = FALSE;
  END IF;
END$$

DELIMITER ;




