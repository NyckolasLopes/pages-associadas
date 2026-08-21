SELECT constraint_name, table_name, column_name
FROM information_schema.key_column_usage
WHERE table_name = 'carrinhos_abandonados';
