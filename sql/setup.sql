CREATE AGGREGATE FUNCTION trimmean RETURNS REAL SONAME 'libtrimmean_plugin.so';

CREATE DATABASE cobitis_app CHARSET utf8mb4 COLLATE utf8mb4_bin;
CREATE USER cobitis_app@localhost IDENTIFIED BY '***';
GRANT SELECT, INSERT, UPDATE, DELETE ON cobitis_app.* TO cobitis_app@localhost;

CREATE DATABASE cobitis_session CHARSET utf8mb4 COLLATE utf8mb4_bin;
CREATE USER cobitis_session@localhost IDENTIFIED BY '***';
GRANT ALL ON cobitis_session.* TO cobitis_session@localhost;

-- On database cobitis_app

CREATE TABLE users (
    user_id         UUID NOT NULL DEFAULT UUID(),
    description     VARCHAR(400),
    auth_provider   VARCHAR(16) NOT NULL,
    auth_id         VARCHAR(64) NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT NOW(),
    updated_at      DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    PRIMARY KEY (user_id)
);

CREATE TABLE sensors (
    sensor_id    UUID NOT NULL DEFAULT UUID(),
    user_id      UUID,
    description  VARCHAR(400),
    key1         CHAR(32) NOT NULL UNIQUE,
    key2         CHAR(60) NOT NULL,
    created_at   DATETIME NOT NULL DEFAULT NOW(),
    updated_at   DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    PRIMARY KEY (sensor_id),
    FOREIGN KEY (user_id) REFERENCES users (user_id)
);

CREATE TABLE measurements (
    sensor_id   UUID NOT NULL,
    measured_at BIGINT NOT NULL,
    temp0       DOUBLE,
    temp1       DOUBLE,
    tds         DOUBLE,
    PRIMARY KEY (sensor_id, measured_at),
    FOREIGN KEY (sensor_id) REFERENCES sensors (sensor_id)
);
