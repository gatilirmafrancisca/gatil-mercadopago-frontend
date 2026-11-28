# language: pt
Funcionalidade: Google Tag Manager no site inteiro (Consent Mode básico)

  Cenário: Sem aceite, o GTM não é carregado em nenhuma página
    Dado que ainda não escolhi nada no aviso de cookies
    Quando eu acesso "/regulamento-acao"
    Então devo ver o aviso de cookies
    E o GTM não deve ter sido carregado

  Cenário: Ao aceitar fora da página de doação, o GTM carrega e registra cada página
    Dado que ainda não escolhi nada no aviso de cookies
    Quando eu acesso "/regulamento-acao"
    E aceito os cookies
    Então o GTM deve ter sido carregado uma vez
    E o consentimento enviado ao GTM deve liberar estatísticos e marketing
    E o dataLayer deve ter 1 page_view_spa de "/regulamento-acao"
    Quando navego pelo link "Política de Privacidade"
    Então o dataLayer deve ter 1 page_view_spa de "/politica-de-privacidade"
    E o GTM deve ter sido carregado uma vez
    E o gtag.js do GA4 não deve ser carregado direto

  Cenário: Só estatísticos libera o GA4 e mantém anúncios negados
    Dado que ainda não escolhi nada no aviso de cookies
    Quando eu acesso "/"
    E aceito só os cookies estatísticos
    Então o GTM deve ter sido carregado uma vez
    E o consentimento enviado ao GTM deve liberar só estatísticos

  Cenário: Rifa com Pix na tela: início, pagamento e compra vão uma vez para o GTM
    Dado que já aceitei os cookies
    E que o Pix dentro do site está ligado
    E que a rifa devolve um Pix válido
    E que o status do Pix da rifa fica "PENDENTE" e depois "APROVADO"
    E que "/mercadopago/verificar-pagamento" devolve um token válido
    E "/api/rifa/numeros-ocupados" devolve [3, 47, 201]
    Quando eu acesso "/rifa?utm_source=facebook&utm_medium=pago"
    E informo o e-mail "ana@email.com" e gero o Pix
    Então o dataLayer deve ter 1 evento "begin_checkout"
    E o dataLayer deve ter 1 evento "add_payment_info" com pagamento "pix"
    E devo ser levado para a escolha do número quando o Pix for aprovado
    E o dataLayer deve ter 1 compra da rifa "123456789" de 100 reais com 1 bilhete
    Quando eu recarrego a página
    Então o dataLayer deve ter 1 compra da rifa "123456789" de 100 reais com 1 bilhete
    E o GTM deve ter sido carregado

  Cenário: Doação com Pix na tela: Donate para o Meta e nenhum purchase no navegador
    Dado que já aceitei os cookies
    E que o Pix dentro do site está ligado
    E que "/api/doacao/criar-pix" devolve um Pix válido
    E que o status do Pix fica "PENDENTE" e depois "APROVADO"
    Quando eu acesso "/doar"
    E eu seleciono o valor pré-definido de R$ 50
    E informo o e-mail "ana@email.com" e gero o Pix
    Então devo ser levado para o agradecimento quando o Pix for aprovado
    E o dataLayer deve ter 1 evento "generate_lead"
    E o dataLayer deve ter 1 evento "doacao_concluida" com event_id "rastreio-teste"
    E o dataLayer não deve ter nenhum evento "purchase"
    E o Meta Pixel não deve ser carregado direto pelo site
