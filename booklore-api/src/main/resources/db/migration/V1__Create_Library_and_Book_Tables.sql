CREATE TABLE IF NOT EXISTS library
(
    id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    sort VARCHAR(255)        NULL,
    icon VARCHAR(64)         NOT NULL
);

CREATE TABLE IF NOT EXISTS library_path
(
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    path       TEXT,
    library_id BIGINT,
    CONSTRAINT fk_library_path FOREIGN KEY (library_id) REFERENCES library (id)
);

CREATE TABLE IF NOT EXISTS book
(
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    file_name       VARCHAR(255)  NOT NULL,
    file_sub_path   VARCHAR(512)  NOT NULL,
    book_type       VARCHAR(6)    NOT NULL,
    library_id      BIGINT        NOT NULL,
    library_path_id BIGINT        NOT NULL,
    added_on        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_time  TIMESTAMP     NULL,
    pdf_progress    INT           NULL,
    epub_progress   VARCHAR(1000) NULL,

    CONSTRAINT fk_library FOREIGN KEY (library_id) REFERENCES library (id) ON DELETE CASCADE,
    CONSTRAINT fk_library_path_id FOREIGN KEY (library_path_id) REFERENCES library_path (id) ON DELETE CASCADE,
    CONSTRAINT unique_file_library UNIQUE (file_name, library_id)
);

CREATE INDEX IF NOT EXISTS idx_library_id ON book (library_id);
CREATE INDEX IF NOT EXISTS idx_last_read_time ON book (last_read_time);

CREATE TABLE IF NOT EXISTS book_metadata
(
    book_id               BIGINT    NOT NULL PRIMARY KEY,
    title                 VARCHAR(255),
    subtitle              VARCHAR(255),
    publisher             VARCHAR(255),
    published_date        DATE,
    description           TEXT,
    isbn_13               VARCHAR(20),
    isbn_10               VARCHAR(20),
    page_count            INT,
    thumbnail             VARCHAR(1000),
    language              VARCHAR(10),
    rating                FLOAT,
    review_count          INT,
    cover                 VARCHAR(255),
    cover_updated_on      TIMESTAMP NULL,
    series_name           VARCHAR(255),
    series_number         INT,
    series_total          INT,
    title_locked          BOOLEAN DEFAULT FALSE,
    authors_locked        BOOLEAN DEFAULT FALSE,
    categories_locked     BOOLEAN DEFAULT FALSE,
    subtitle_locked       BOOLEAN DEFAULT FALSE,
    publisher_locked      BOOLEAN DEFAULT FALSE,
    published_date_locked BOOLEAN DEFAULT FALSE,
    description_locked    BOOLEAN DEFAULT FALSE,
    isbn_13_locked        BOOLEAN DEFAULT FALSE,
    isbn_10_locked        BOOLEAN DEFAULT FALSE,
    page_count_locked     BOOLEAN DEFAULT FALSE,
    thumbnail_locked      BOOLEAN DEFAULT FALSE,
    language_locked       BOOLEAN DEFAULT FALSE,
    cover_locked          BOOLEAN DEFAULT FALSE,
    series_name_locked    BOOLEAN DEFAULT FALSE,
    series_number_locked  BOOLEAN DEFAULT FALSE,
    series_total_locked   BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_book_metadata FOREIGN KEY (book_id) REFERENCES book (id) ON DELETE CASCADE
);

CREATE TABLE book_award
(
    id          BIGINT       NOT NULL PRIMARY KEY AUTO_INCREMENT,
    book_id     BIGINT       NOT NULL,
    name        VARCHAR(255) NOT NULL,
    awarded_at  TIMESTAMP    NOT NULL,
    category    VARCHAR(255) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    CONSTRAINT fk_book_awards_book FOREIGN KEY (book_id) REFERENCES book (id) ON DELETE CASCADE,
    CONSTRAINT unique_book_award UNIQUE (book_id, name, category, awarded_at)
);

CREATE TABLE IF NOT EXISTS author
(
    id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    CONSTRAINT unique_name UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS category
(
    id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS pdf_viewer_preference
(
    book_id         BIGINT PRIMARY KEY,
    zoom            VARCHAR(16) NULL,
    sidebar_visible BOOLEAN     NULL,
    spread          VARCHAR(16) NULL,
    CONSTRAINT fk_pdf_viewer_setting FOREIGN KEY (book_id) REFERENCES book (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS epub_viewer_preference
(
    book_id   BIGINT PRIMARY KEY,
    theme     VARCHAR(128) NULL,
    font      VARCHAR(128) NULL,
    font_size INT          NULL,
    CONSTRAINT fk_epub_viewer_setting FOREIGN KEY (book_id) REFERENCES book (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS book_metadata_category_mapping
(
    book_id     BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    PRIMARY KEY (book_id, category_id),
    CONSTRAINT fk_book_metadata_category_mapping_book FOREIGN KEY (book_id) REFERENCES book_metadata (book_id) ON DELETE CASCADE,
    CONSTRAINT fk_book_metadata_category_mapping_category FOREIGN KEY (category_id) REFERENCES category (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS book_metadata_author_mapping
(
    book_id   BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    PRIMARY KEY (book_id, author_id),
    CONSTRAINT fk_book_metadata_author_mapping_book FOREIGN KEY (book_id) REFERENCES book_metadata (book_id) ON DELETE CASCADE,
    CONSTRAINT fk_book_metadata_author_mapping_author FOREIGN KEY (author_id) REFERENCES author (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_book_metadata_id ON book_metadata_author_mapping (book_id);
CREATE INDEX IF NOT EXISTS idx_author_id ON book_metadata_author_mapping (author_id);

CREATE TABLE IF NOT EXISTS shelf
(
    id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    sort VARCHAR(255) NULL,
    icon VARCHAR(64)  NOT NULL
);

CREATE TABLE IF NOT EXISTS book_shelf_mapping
(
    book_id  BIGINT NOT NULL,
    shelf_id BIGINT NOT NULL,
    PRIMARY KEY (book_id, shelf_id),
    CONSTRAINT fk_book_shelf_mapping_book FOREIGN KEY (book_id) REFERENCES book (id) ON DELETE CASCADE,
    CONSTRAINT fk_book_shelf_mapping_shelf FOREIGN KEY (shelf_id) REFERENCES shelf (id) ON DELETE CASCADE
);

CREATE TABLE app_settings
(
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(255) NOT NULL,
    name     VARCHAR(255) NOT NULL,
    val      TEXT         NOT NULL,
    UNIQUE (category, name)
);