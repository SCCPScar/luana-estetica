# Luana Estética — Atualizações

## O que mudou nesta versão

1. **Cores Cherry & Matcha** — paleta toda em #670626 (cherry) e #BAD797 (matcha).
2. **Decoração** — folhas trocadas por cerejinhas e cubos de gelo (SVGs + emojis).
3. **Anamnese com múltipla escolha** — Espessura, Sensibilidade, Tipo de unhas, Tipo de pé,
   Objetivo corporal e Pressão de massagem agora são checkboxes (sem limite de opções).
4. **Fotos antes/depois** — nova secção na ficha para enviar fotos da cliente,
   guardadas no Firebase Storage e mostradas na ficha e no detalhe da cliente.
5. **Agenda de próximas sessões** — bloco no topo da página inicial que lista as
   próximas sessões marcadas (com base no campo "Próxima sessão prevista" de cada plano).
6. **Exportar / Imprimir ficha em PDF** — botão "🖨️ Imprimir / PDF" no detalhe da
   cliente; usa a função de imprimir do navegador (Guardar como PDF) já com um
   layout limpo, sem menus nem botões.
7. **Exportar CSV (backup)** — botão "⬇️ Exportar CSV" na página inicial, exporta
   todas as clientes para um ficheiro que abre no Excel/Google Sheets.
8. **Validação de campos** — telefone, e-mail e data de nascimento são validados
   antes de guardar a ficha.
9. **Modal de confirmação** — excluir ficha, plano, sessão ou terminar sessão
   agora mostra um aviso mais claro em vez do alerta padrão do navegador.
10. **Responsividade mobile** — ajustes para telemóvel/tablet (botões, modais,
    cabeçalho da ficha empilham melhor em ecrãs pequenos).

11. **Clicar no logo "Luana Estética" volta para a página inicial** — já não é
    preciso usar o botão "← Voltar" sempre que se quer voltar à lista de clientes.
12. **+ Agendar (agenda rápida)** — botão novo ao lado de "Próximas Sessões" que
    permite marcar um compromisso para qualquer cliente (data + nota), sem
    precisar criar um plano de tratamento inteiro. Continua a aparecer também
    tudo que vier do campo "Próxima sessão prevista" dentro dos planos.
13. **Proteção contra perda de dados** — se a Luana guardar uma ficha e fechar
    a aba/navegador logo a seguir, o site agora força o envio dos dados
    pendentes para o Firestore antes de fechar (em vez de depender só do
    pequeno atraso de sincronização).

## Sobre a ficha que desapareceu

A causa mais provável: o sistema guarda as alterações na nuvem com um
pequeno atraso (~250ms) depois de clicar em "Guardar Ficha", para evitar
sobrecarregar o Firestore quando há várias alterações seguidas. Se a aba foi
fechada ou o telemóvel/computador "dormiu" logo a seguir a guardar, esse envio
pode não ter chegado a completar — e por isso a ficha nunca chegou a ser
guardada na nuvem. A versão 13 acima reduz bastante esse risco.

Para confirmar se a ficha está mesmo perdida (e não é só um problema de
visualização), vale a pena verificar diretamente na Firebase Console:
**Firestore Database → Dados → coleção `users` → o teu UID → `fichas`** — se a
ficha não estiver lá, infelizmente terá mesmo de ser recriada; a partir de
agora deve ficar protegida com a alteração 13.



### 1. Ativar o Firebase Storage (para as fotos)
No Firebase Console → **Storage** → "Começar" (caso ainda não esteja ativo no projeto).

### 2. Publicar as novas regras de segurança
Este pacote inclui dois ficheiros novos na raiz do projeto:

- `firestore.rules` — regras da base de dados (clientes/fichas)
- `storage.rules` — regras das fotos

Para aplicar, no terminal dentro da pasta do projeto:

```bash
firebase deploy --only firestore:rules,storage:rules
```

Ou, mais simples, copiar e colar o conteúdo de cada ficheiro diretamente no
Firebase Console:
- **Firestore Database → Regras** → colar conteúdo de `firestore.rules` → Publicar
- **Storage → Regras** → colar conteúdo de `storage.rules` → Publicar

> As regras do Firestore já estavam corretas (cada utilizador só acede às suas
> próprias fichas) — apenas reforcei com uma validação extra do campo "nome".
> As regras do Storage são novas, garantindo que cada esteticista só vê e
> apaga as fotos da sua própria conta.

### 3. Publicar o site
Se o site usa **GitHub Pages**: basta dar `git push`, é automático (alguns
minutos).

Se o site usa **Firebase Hosting**: depois do push, correr também:
```bash
firebase deploy --only hosting
```

---

## NOVO: Portal da Cliente (acesso por papéis)

Esta versão acrescenta um segundo tipo de acesso ao site, além da tua conta
de administradora:

- **Tu (administradora)**: continuas a ver tudo — área "Clientes", criar,
  editar, excluir fichas, planos e sessões. Nada muda no teu dia a dia.
- **Cliente**: ao entrar com a própria conta, vê só a própria ficha (em
  modo leitura), pode atualizar telefone, e-mail e morada, e vê as
  próprias sessões agendadas. A área "Clientes" e o botão "+ Nova Ficha"
  ficam completamente escondidos para ela — nunca vê dados de outras
  clientes.

**Como funciona o convite:** na ficha de cada cliente (do teu lado), há um
botão novo **"🔗 Convidar Cliente"** que gera um código único de 6
caracteres. Envias esse código à cliente (WhatsApp, SMS, o que preferires).
Ela entra no site, cria a própria conta com o e-mail/senha que quiser, e na
primeira vez introduz esse código — isso liga a conta dela à ficha certa,
automaticamente, sem precisares de criar nada manualmente.

### ⚠️ Passo obrigatório antes de publicar esta versão

Esta funcionalidade só funciona depois de identificares a tua conta de
administradora para o sistema. Sem este passo, ninguém — nem tu —
consegue aceder à área de "Clientes".

1. Firebase Console → **Authentication** → lista de utilizadores → encontra
   a tua conta (a que já usas para entrar) → copia o **User UID** (uma
   sequência longa de letras e números).
2. Abre `js/firebase-config.js` neste pacote e substitui:
   ```js
   const ADMIN_UID = "COLOQUE_AQUI_O_SEU_UID";
   ```
   pelo UID copiado, mantendo as aspas.
3. Abre `firestore.rules` e faz exatamente o mesmo: substitui
   `"COLOQUE_AQUI_O_SEU_UID"` (dentro da função `isAdmin()`) pelo MESMO UID.
4. Publica o `firestore.rules` atualizado (Firestore Database → Regras →
   colar → Publicar) e faz o push do código (`git add . && git commit -m
   "portal da cliente" && git push`).

Se esqueceres este passo, o site vai tratar a tua própria conta como se
fosse uma cliente comum (vais cair no ecrã de "introduzir código de
convite" em vez de veres a área de Clientes).

### Novas coleções no Firestore (criadas automaticamente pelo site)
- `convites/{codigo}` — cada convite gerado pela administradora.
- `clientes/{uid}` — liga a conta de login da cliente à ficha dela.

Não precisas de criar estas coleções manualmente; o site cria-as sozinho
na primeira vez que usares "Convidar Cliente" / a cliente resgatar o código.

### Limitações desta primeira versão
- Suporta apenas **uma administradora** (não várias contas de admin).
- A cliente não vê fotos nem o histórico clínico/observações — só os dados
  de identificação básicos, serviços e datas agendadas. Se quiseres que
  ela veja também as fotos de evolução, é uma alteração pequena, é só
  pedir.
