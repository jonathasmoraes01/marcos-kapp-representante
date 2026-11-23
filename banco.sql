-- Diagnóstico somente para leitura da instalação existente.
-- As políticas já foram criadas por migração e vinculam o acesso à conta autorizada.
-- NÃO altere os parâmetros globais de autenticação: o projeto é compartilhado.
select c.relrowsecurity as rls_habilitado,
       count(p.policyname) as politicas
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p on p.schemaname = n.nspname and p.tablename = c.relname
where n.nspname = 'public' and c.relname = 'carteira_dados'
group by c.relrowsecurity;
