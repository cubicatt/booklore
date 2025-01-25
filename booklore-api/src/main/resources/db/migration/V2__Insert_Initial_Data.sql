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
            "allP1": "Amazon",
            "allP2": "GoodReads",
            "allP3": "Google",
            "refreshCovers": true,
            "mergeCategories": true,
            "fieldOptions": {
                "title": {
                    "p1": "Amazon",
                    "p2": "GoodReads",
                    "p3": "Google"
                },
                "description": {
                    "p1": "Amazon",
                    "p2": "GoodReads",
                    "p3": "Google"
                },
                "authors": {
                    "p1": "Amazon",
                    "p2": "GoodReads",
                    "p3": "Google"
                },
                "categories": {
                    "p1": "GoodReads",
                    "p2": "Amazon",
                    "p3": "Google"
                },
                "cover": {
                    "p1": "Amazon",
                    "p2": "GoodReads",
                    "p3": "Google"
                }
            }
        }'
    );