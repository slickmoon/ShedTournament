-- Initialize event types table with initial values
INSERT INTO EventType (name)
SELECT 'pantsed'
WHERE NOT EXISTS (
    SELECT 1 FROM EventType WHERE name = 'pantsed'
); 