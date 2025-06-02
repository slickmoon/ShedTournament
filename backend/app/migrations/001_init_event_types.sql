-- Initialize event types table with initial values
INSERT INTO event_type (name)
VALUES ('pantsed')
ON CONFLICT (name) DO NOTHING; 