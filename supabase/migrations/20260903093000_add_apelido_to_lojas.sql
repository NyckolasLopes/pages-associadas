-- Adiciona campo de apelido da loja
ALTER TABLE public.lojas ADD COLUMN IF NOT EXISTS apelido text;
COMMENT ON COLUMN public.lojas.apelido IS 'Apelido da loja exibido na página inicial / topo onde diz Aqui você tem amigos';
