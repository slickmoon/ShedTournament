-- Initialize event types table with initial values
INSERT INTO EventType (name)
VALUES ('pantsed')
ON CONFLICT (name) DO NOTHING; 