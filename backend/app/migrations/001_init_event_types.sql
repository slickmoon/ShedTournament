-- Initialize event types table with initial values
INSERT INTO EventTypes (name)
SELECT 'pantsed'
WHERE NOT EXISTS (
    SELECT 1 FROM EventTypes WHERE name = 'pantsed'
); 