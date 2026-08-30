<div align="center">

<br />

# 📖 Millie Munds

### Um webapp de RPG de mesa para o universo Millie Munds — fichas de personagem, inventário, habilidades, tarot e campanhas, tudo em um só lugar.

<br />

<img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
<img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
<img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
<img src="https://img.shields.io/badge/NextAuth.js-000000?style=for-the-badge&logo=auth0&logoColor=white" alt="NextAuth" />
<img src="https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="TailwindCSS" />

<br /><br />

<img src="https://img.shields.io/badge/status-em%20desenvolvimento-yellow?style=flat-square" alt="status" />
<img src="https://img.shields.io/badge/licença-privado-lightgrey?style=flat-square" alt="licença" />

</div>

<br />

## 📚 Sobre o projeto

**Millie Munds** é um universo de fantasia construído ao longo de anos — mitologia, cosmologia e raças próprias, catalogadas em um compêndio físico. Este repositório é o **companion digital** desse universo: uma ferramenta de mesa (VTT-lite) pensada para o Mestre e os jogadores gerenciarem campanhas sem depender de planilhas soltas.

O app cobre o ciclo completo de uma sessão: criar personagem escolhendo raça e universo de origem, evoluir com XP e rank, equipar itens do inventário compartilhado, desbloquear habilidades na árvore de skills, e tirar cartas de tarot narrativo direto na campanha — tudo sincronizado entre Mestre e jogadores em tempo real.

<br />

## ✨ Funcionalidades

<table>
<tr>
<td width="50%" valign="top">

### 🧙 Personagens
- Criação guiada por categoria (aluno, professor, NPC, monstro)
- ~170 raças catalogadas, cada uma com raça, elemento, rank de nascença e descrição
- Distribuição de atributos com pontos limitados por rank
- Evolução de raça (ascensão / corrupção / permanência)
- Cálculo automático de PV, PM, rank atual e nível de perigo

### 🎒 Inventário
- Itens compartilhados por campanha (equipamentos, consumíveis, relíquias, livros)
- Livros com capítulos navegáveis dentro do próprio item
- Entrega de itens entre personagens pelo Mestre

</td>
<td width="50%" valign="top">

### ⚡ Habilidades
- Árvore de habilidades por elemento, com órbita visual
- Desbloqueio vinculado ao nível do personagem
- Dashboard do Mestre para conceder habilidades manualmente

### 🔮 Tarot & Mundos
- Leituras de tarot (comum e profunda) em tempo real, com polling
- Mundos navegáveis com capítulos de lore escritos pelo Mestre
- Painel do Mestre: convite de jogadores, XP, condições de status

### ⚙️ Conta & Campanha
- Perfil, avatar, senha, preferências visuais e notificações
- Sair, arquivar ou excluir campanha com confirmação em duas etapas

</td>
</tr>
</table>

<br />

## 📸 Screenshots

<div align="center">

<img src="./millie/docs/screenshot-home.png" alt="Tela inicial" width="32%" />
<img src="./millie/docs/screenshot-personagem.png" alt="Ficha de personagem" width="32%" />
<img src="./millie/docs/screenshot-tarot.png" alt="Tela de personagem" width="32%" />

<sub>Castelo inicial · Ficha de personagem · Tela de personagem</sub>

</div>

<br />

## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| Framework | [Next.js](https://nextjs.org/) (App Router, Turbopack) |
| Linguagem | TypeScript |
| Banco de dados | PostgreSQL |
| ORM | [Prisma](https://www.prisma.io/) |
| Autenticação | [NextAuth.js](https://next-auth.js.org/) (Credentials + JWT) + bcrypt |
| Estilo | Tailwind CSS com design system e tokens customizados |
| Ícones | [lucide-react](https://lucide.dev/) |

<br />

## 🚀 Rodando localmente

<details>
<summary><strong>1. Clonar e instalar dependências</strong></summary>

<br />

```bash
git clone https://github.com/SEU-USUARIO/MillieMunds.git
cd MillieMunds/millie
npm install
```

</details>

<details>
<summary><strong>2. Configurar variáveis de ambiente</strong></summary>

<br />

Crie um arquivo `.env` na raiz de `millie/` com:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/milliemunds"
AUTH_SECRET="uma-string-aleatoria-e-longa"
```

> Gere o `AUTH_SECRET` com `npx auth secret` ou qualquer gerador de string aleatória.

</details>

<details>
<summary><strong>3. Preparar o banco de dados</strong></summary>

<br />

```bash
npx prisma migrate dev
npx prisma db seed
```

O seed popula universos, mundos, raças (com descrições do compêndio) e dados iniciais de exemplo.

</details>

<details>
<summary><strong>4. Rodar o servidor de desenvolvimento</strong></summary>

<br />

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

</details>

<br />

## 📁 Estrutura do projeto

```
millie/
├── app/                  → rotas (App Router) e Server Actions
│   ├── (auth)/           → login e cadastro
│   ├── (site)/           → páginas autenticadas do app
│   └── actions/          → Server Actions por domínio (character, campaign, world...)
├── componentes/          → componentes React, organizados por página/feature
├── lib/                  → Prisma client, tipos, hooks, contexts, utils
├── prisma/               → schema.prisma e seed.ts
└── public/assets/        → fontes, imagens, SVGs e cartas de tarot
```

<br />

## 🗺️ Roadmap

- [ ] Exigir arquivamento antes de permitir exclusão de campanha
- [ ] Validação de força de senha
- [ ] Rate limiting no login
- [ ] Aviso de alterações não salvas nas abas de Configurações
- [ ] Compêndio in-app navegável (reaproveitando as descrições de raça)
- [ ] Imagens de raça no preview do modal de criação de personagem
- [ ] Suporte a múltiplos idiomas

<br />

## 👤 Autor

Feito por **[Lívia](https://github.com/SEU-USUARIO)** — escritora e worldbuilder do universo Millie Munds.

<br />

<div align="center">
<sub>Projeto pessoal, não licenciado para uso comercial. Todo o conteúdo narrativo (raças, mitologia, universo) é propriedade da autora.</sub>
</div>
