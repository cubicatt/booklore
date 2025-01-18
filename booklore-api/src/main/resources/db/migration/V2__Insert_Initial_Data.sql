INSERT INTO shelf (name, icon)
VALUES ('Favorites', 'heart');

INSERT INTO app_settings (category, name, val)
VALUES ('epub', 'theme', 'white'),
       ('epub', 'fontSize', '120'),
       ('epub', 'font', 'serif');

INSERT INTO app_settings (category, name, val)
VALUES ('pdf', 'spread', 'odd'),
       ('pdf', 'zoom', 'page-fit'),
       ('pdf', 'sidebar', 'true');

INSERT INTO app_settings (category, name, val)
VALUES ('reader_setting', 'pdf', 'individual'),
       ('reader_setting', 'epub', 'individual');