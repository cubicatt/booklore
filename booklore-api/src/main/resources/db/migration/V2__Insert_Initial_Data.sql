INSERT INTO shelf (name, icon)
VALUES
    ('Favorites', 'heart');

INSERT INTO app_settings (category, name, val)
VALUES
    ('epub', 'theme', 'white'),
    ('epub', 'fontSize', '150'),
    ('epub', 'font', 'serif');

INSERT INTO app_settings (category, name, val)
VALUES
    ('pdf', 'spread', 'odd'),
    ('pdf', 'zoom', 'page-fit'),
    ('pdf', 'sidebar', 'true');

INSERT INTO app_settings (category, name, val)
VALUES
    ('reader_setting', 'pdf', 'individual'),
    ('reader_setting', 'epub', 'individual');

INSERT INTO app_settings (category, name, val)
VALUES
    (
        'quick_book_match',
        'all_books',
        '{
            "defaultProvider": "Google",
            "refreshCovers": true,
            "mergeCategories": true,
            "fieldOptions": {
                "title": {
                    "p2": "GoodReads",
                    "p1": "Amazon",
                    "default": "Google"
                },
                "description": {
                    "p2": "GoodReads",
                    "p1": "Amazon",
                    "default": "Google"
                },
                "authors": {
                    "p2": "GoodReads",
                    "p1": "Amazon",
                    "default": "Google"
                },
                "categories": {
                    "p2": "Amazon",
                    "p1": "GoodReads",
                    "default": "Google"
                },
                "cover": {
                    "p2": "GoodReads",
                    "p1": "Amazon",
                    "default": "Google"
                }
            }
        }'
    );