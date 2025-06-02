-- Initialize event types table with initial values
INSERT INTO event_types (name)
SELECT 'pantsed'
WHERE NOT EXISTS (
    SELECT 1 FROM event_types WHERE name = 'pantsed'
); 