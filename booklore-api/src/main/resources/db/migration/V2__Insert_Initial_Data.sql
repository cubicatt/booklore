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

-- Insert JSON data into app_settings
INSERT INTO app_settings (category, name, val)
VALUES
    (
        'quick_book_match',
        'all_books',
        '{
            "defaultProvider": "Amazon",
            "refreshCovers": false,
            "fieldOptions": {
                "title": {
                    "default": "Amazon",
                    "p2": null,
                    "p1": null
                },
                "description": {
                    "default": "Amazon",
                    "p2": null,
                    "p1": null
                },
                "authors": {
                    "default": "Amazon",
                    "p2": null,
                    "p1": null
                },
                "categories": {
                    "default": "Amazon",
                    "p2": null,
                    "p1": null
                },
                "cover": {
                    "default": "Amazon",
                    "p2": null,
                    "p1": null
                }
            }
        }'
    );