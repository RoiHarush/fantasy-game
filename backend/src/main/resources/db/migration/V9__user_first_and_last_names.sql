ALTER TABLE users ADD COLUMN first_name VARCHAR(50);
ALTER TABLE users ADD COLUMN last_name VARCHAR(50);

UPDATE users
SET first_name = name
WHERE first_name IS NULL;

UPDATE users
SET last_name = ''
WHERE last_name IS NULL;
