-- Create the library table
CREATE TABLE IF NOT EXISTS library
(
    id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    sort VARCHAR(255)        NULL,
    icon VARCHAR(64)         NOT NULL
);

-- Create the library_path table
CREATE TABLE IF NOT EXISTS library_path
(
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    path       TEXT,
    library_id BIGINT,
    CONSTRAINT fk_library_path FOREIGN KEY (library_id) REFERENCES library (id)
);

-- Create the book table
CREATE TABLE IF NOT EXISTS book
(
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    file_name      VARCHAR(255)  NOT NULL,
    book_type      VARCHAR(6)    NOT NULL,
    library_id     BIGINT        NOT NULL,
    path           VARCHAR(1000) NOT NULL,
    added_on       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_time TIMESTAMP     NULL,
    pdf_progress   INT           NULL,
    epub_progress  VARCHAR(1000) NULL,

    CONSTRAINT fk_library FOREIGN KEY (library_id) REFERENCES library (id) ON DELETE CASCADE,
    CONSTRAINT unique_file_library UNIQUE (file_name, library_id)
);

-- Create indexes for the book table
CREATE INDEX IF NOT EXISTS idx_library_id ON book (library_id);
CREATE INDEX IF NOT EXISTS idx_last_read_time ON book (last_read_time);

-- Create the book_metadata table
CREATE TABLE IF NOT EXISTS book_metadata
(
    book_id        BIGINT NOT NULL PRIMARY KEY,
    title          VARCHAR(255),
    subtitle       VARCHAR(255),
    publisher      VARCHAR(255),
    published_date DATE,
    description    TEXT,
    isbn_13        VARCHAR(20),
    isbn_10        VARCHAR(20),
    page_count     INT,
    thumbnail      VARCHAR(1000),
    language       VARCHAR(10),
    rating         FLOAT,
    review_count   INT,
    CONSTRAINT fk_book_metadata FOREIGN KEY (book_id) REFERENCES book (id) ON DELETE CASCADE
);

-- Create the author table
CREATE TABLE IF NOT EXISTS author
(
    id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    CONSTRAINT unique_name UNIQUE (name)
);

-- Create the category table
CREATE TABLE IF NOT EXISTS category
(
    id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- Create the book_viewer_setting table
CREATE TABLE IF NOT EXISTS book_viewer_setting
(
    book_id         BIGINT PRIMARY KEY,
    page_number     INT         NULL,
    zoom            VARCHAR(16) NULL,
    sidebar_visible BOOLEAN     NULL,
    spread          VARCHAR(16) NULL,
    CONSTRAINT fk_book_viewer_setting FOREIGN KEY (book_id) REFERENCES book (id) ON DELETE CASCADE
);

-- Create the book_metadata_category_mapping table
CREATE TABLE IF NOT EXISTS book_metadata_category_mapping
(
    book_id     BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    PRIMARY KEY (book_id, category_id),
    CONSTRAINT fk_book_metadata_category_mapping_book FOREIGN KEY (book_id) REFERENCES book_metadata (book_id) ON DELETE CASCADE,
    CONSTRAINT fk_book_metadata_category_mapping_category FOREIGN KEY (category_id) REFERENCES category (id) ON DELETE CASCADE
);

-- Create the book_metadata_author_mapping table
CREATE TABLE IF NOT EXISTS book_metadata_author_mapping
(
    book_id   BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    PRIMARY KEY (book_id, author_id),
    CONSTRAINT fk_book_metadata_author_mapping_book FOREIGN KEY (book_id) REFERENCES book_metadata (book_id) ON DELETE CASCADE,
    CONSTRAINT fk_book_metadata_author_mapping_author FOREIGN KEY (author_id) REFERENCES author (id) ON DELETE CASCADE
);

-- Create indexes for the book_metadata_author_mapping table
CREATE INDEX IF NOT EXISTS idx_book_metadata_id ON book_metadata_author_mapping (book_id);
CREATE INDEX IF NOT EXISTS idx_author_id ON book_metadata_author_mapping (author_id);

-- Create the shelf table
CREATE TABLE IF NOT EXISTS shelf
(
    id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    sort VARCHAR(255) NULL,
    icon VARCHAR(64)  NOT NULL
);

-- Create the book_shelf_mapping table
CREATE TABLE IF NOT EXISTS book_shelf_mapping
(
    book_id  BIGINT NOT NULL,
    shelf_id BIGINT NOT NULL,
    PRIMARY KEY (book_id, shelf_id),
    CONSTRAINT fk_book_shelf_mapping_book FOREIGN KEY (book_id) REFERENCES book (id) ON DELETE CASCADE,
    CONSTRAINT fk_book_shelf_mapping_shelf FOREIGN KEY (shelf_id) REFERENCES shelf (id) ON DELETE CASCADE
);

-- Create the app_settings table
CREATE TABLE app_settings
(
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(255) NOT NULL,
    name     VARCHAR(255) NOT NULL,
    val    TEXT         NOT NULL,
    UNIQUE (category, name)
);