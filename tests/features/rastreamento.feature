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
