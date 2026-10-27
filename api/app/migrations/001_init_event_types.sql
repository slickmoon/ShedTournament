-- Initialize event types table with initial values
INSERT INTO event_type (name)
VALUES ('pantsed'),
    ('away_game'),
    ('lost_by_foul')
ON CONFLICT (name) DO NOTHING; 