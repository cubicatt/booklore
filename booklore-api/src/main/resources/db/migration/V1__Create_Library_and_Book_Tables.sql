CREATE TABLE IF NOT EXISTS library
(
    id    BIGINT AUTO_INCREMENT PRIMARY KEY,
    name  VARCHAR(255) UNIQUE NOT NULL,
    paths BLOB
);

CREATE TABLE IF NOT EXISTS book
(
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    title      VARCHAR(255),
    file_name  VARCHAR(255)  NOT NULL,
    library_id BIGINT        NOT NULL,
    path       VARCHAR(1000) NOT NULL,
    CONSTRAINT fk_library FOREIGN KEY (library_id) REFERENCES library (id) ON DELETE CASCADE,
    CONSTRAINT unique_file_library UNIQUE (file_name, library_id)
);

CREATE TABLE IF NOT EXISTS author
(
    id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    CONSTRAINT unique_name UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS book_author_mapping
(
    book_id   BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    CONSTRAINT fk_book_author_mapping_book FOREIGN KEY (book_id) REFERENCES book (id) ON DELETE CASCADE,
    CONSTRAINT fk_book_author_mapping_author FOREIGN KEY (author_id) REFERENCES author (id),
    CONSTRAINT unique_book_author UNIQUE (book_id, author_id)
);

CREATE TABLE IF NOT EXISTS book_viewer_setting
(
    book_id         BIGINT PRIMARY KEY,
    page_number     INT         DEFAULT 1,
    zoom            VARCHAR(32) DEFAULT 'page-fit',
    sidebar_visible BOOLEAN     DEFAULT false,
    spread          VARCHAR(32) DEFAULT 'off',
    CONSTRAINT fk_book_viewer_setting FOREIGN KEY (book_id) REFERENCES book (id) ON DELETE CASCADE
);