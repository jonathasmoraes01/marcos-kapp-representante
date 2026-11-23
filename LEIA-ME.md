# Marcos Kapp Representante — pedidos de venda

A plataforma está publicada no GitHub Pages em https://jonathasmoraes01.github.io/marcos-kapp-representante/ e conectada ao projeto Supabase compartilhado `aura`. O e-mail do Marcos foi cadastrado e confirmado; as políticas da tabela `public.carteira_dados` restringem leitura, inclusão e alteração ao UID dessa conta e aos próprios registros. Os 29 produtos da Delic foram cadastrados no banco com preços a definir. Nenhuma senha está incluída neste pacote.

A URL de produção exibe a tela de login do aplicativo. O repositório e os arquivos do site são públicos: os dados ficam somente no Supabase, protegidos por login e RLS. Se o usuário do Marcos for removido e criado novamente, o UID muda: será necessário atualizar as políticas RLS para o novo UID. O arquivo `config.js` contém somente a URL e a chave publicável do Supabase; nunca coloque uma chave service_role ou secret no navegador.

## Recursos
- Cadastro de clientes com razão social, nome fantasia, documento, contato, endereço e foto da fachada.
- Catálogo de 29 produtos da Delic com EAN, NCM, CEST e quantidade conforme o material recebido. Preços não estavam no material e devem ser preenchidos no cadastro ou no pedido. NCM, CEST e quantidades devem ser conferidos antes de uso fiscal.
- Atenção a duas divergências: Molho Mexicano (215 ml na arte, 251 ml na tabela) e Dry Rub para Carne de Porco (180 g na arte, 160 g na tabela). Confira as embalagens.
- Pedidos com preços por cliente, prazos, condições e PDF com logo da empresa. O PDF é um documento comercial e não emite NF-e.
- Comissões estimadas mensais de 3% até R$ 50.000, 4% acima de R$ 50.000 até R$ 100.000 e 5% acima de R$ 100.000. A taxa é aplicada ao total do mês e o acumulado soma as estimativas mensais. Os valores não indicam pagamentos recebidos.
- O PDF pode ser compartilhado pelo menu nativo do aparelho. Os atalhos de WhatsApp e e-mail abrem mensagens, mas não anexam o PDF automaticamente.

## Cuidados nesta instalação
O projeto `aura` atende também outro aplicativo. Não desative o cadastro, não altere as configurações globais de autenticação e não substitua suas políticas sem avaliar o outro aplicativo. `banco.sql` é apenas uma consulta de diagnóstico; as políticas existentes já foram aplicadas por migração. Para novos acessos, revise as políticas com cuidado e teste que usuários de outros aplicativos não acessam os dados do representante.

O Supabase identificou alertas preexistentes no projeto `aura`. Revise os avisos de segurança antes de operar com informações reais: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable .

Todos os registros do aplicativo são armazenados em um único registro JSON com controle de alteração concorrente. Fotos consomem o armazenamento disponível e são copiadas para os pedidos. Para muitos usuários ou grande volume, será necessário evoluir a arquitetura. Faça backups regulares e monitore os limites e as regras de inatividade do plano gratuito.

## Publicação
O site é estático e publicado pelo GitHub Pages a partir da branch `main` (pasta raiz). Qualquer alteração enviada para `main` é publicada automaticamente em poucos minutos. O arquivo `.nojekyll` desativa o processamento Jekyll.
