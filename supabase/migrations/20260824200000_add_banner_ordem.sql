-- Migration: adiciona campo `ordem` à tabela `banners`
-- Usado para ordenação por drag-and-drop no painel admin.
-- O valor padrão 0 garante compatibilidade retroativa com banners existentes.

ALTER TABLE banners
  ADD COLUMN IF NOT EXISTS ordem integer NOT NULL DEFAULT 0;

-- Inicializar a ordem dos banners existentes baseado na data de criação (id crescente)
-- para manter a ordem visual preexistente
UPDATE banners
SET ordem = sub.row_num - 1
FROM (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY COALESCE(loja_id::text, 'global'), posicao
           ORDER BY created_at ASC, id ASC
         ) AS row_num
  FROM banners
) sub
WHERE banners.id = sub.id;
