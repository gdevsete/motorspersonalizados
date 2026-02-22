# Motors Personalizados 🏍️

![Motors Personalizados](https://img.shields.io/badge/React-18-blue) ![Vite](https://img.shields.io/badge/Vite-5-purple) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-cyan) ![Supabase](https://img.shields.io/badge/Supabase-Backend-green)

E-commerce premium para venda de miniaturas personalizadas de motos (chaveiros exclusivos).

## 🚀 Stack Tecnológica

- **React 18** - Biblioteca UI
- **Vite** - Build tool ultrarrápido
- **Tailwind CSS** - Estilização utility-first
- **React Router DOM** - Navegação SPA
- **Supabase** - Backend (Auth + Database + Storage)
- **React Hot Toast** - Notificações
- **React Icons** - Ícones

## 📁 Estrutura do Projeto

```
src/
├── components/       # Componentes reutilizáveis
│   ├── Header/
│   ├── Footer/
│   ├── ProtectedRoute/
│   └── UI/           # Botões, inputs, etc.
├── pages/            # Páginas da aplicação
│   ├── Home/
│   ├── Personalizar/
│   ├── Login/
│   ├── Cadastro/
│   ├── MinhaConta/
│   └── Admin/
├── layouts/          # Layouts base
├── services/         # Integração com Supabase
├── hooks/            # Hooks customizados
├── context/          # Contextos React
├── utils/            # Funções utilitárias
├── lib/              # Configurações (Supabase client)
└── assets/           # Arquivos estáticos
```

## 🔧 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/motors-personalizados.git
cd motors-personalizados
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e configure suas credenciais do Supabase:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### 4. Configure o banco de dados Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Vá em **SQL Editor**
3. Execute o script `supabase-schema.sql` incluído neste projeto
4. Vá em **Storage** e crie um bucket chamado `moto-images` com acesso público

### 5. Execute o projeto

```bash
npm run dev
```

Acesse: http://localhost:5173

## 🌐 Deploy na Vercel

### Opção 1: Deploy automático

1. Conecte seu repositório GitHub à Vercel
2. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy automático a cada push

### Opção 2: Deploy manual

```bash
npm run build
npx vercel --prod
```

## 📱 Funcionalidades

### Públicas
- ✅ Home com hero, como funciona, galeria e depoimentos
- ✅ Formulário de personalização com cálculo de preço
- ✅ Upload de foto da moto
- ✅ Seleção de cores e opções extras
- ✅ Login / Cadastro / Recuperação de senha

### Usuário Autenticado
- ✅ Visualizar histórico de pedidos
- ✅ Acompanhar status dos pedidos
- ✅ Criar novos pedidos

### Admin
- ✅ Listar todos os pedidos
- ✅ Alterar status dos pedidos
- ✅ Gerenciar depoimentos
- ✅ Gerenciar produtos

## 💰 Precificação

| Item | Valor |
|------|-------|
| Miniatura base | R$ 79,00 |
| Nome gravado | +R$ 10,00 |
| Embalagem premium | +R$ 20,00 |

## 🎨 Design

- **Tema**: Dark mode premium
- **Cor principal**: #ff1e1e (vermelho)
- **Background**: #0a0a0a (preto)
- **Estilo**: Moderno, minimalista, responsivo

## 📂 Scripts Disponíveis

```bash
npm run dev      # Desenvolvimento
npm run build    # Build para produção
npm run preview  # Preview do build
npm run lint     # Verificar código
```

## 🔐 Banco de Dados

### Tabelas

**orders**
- Pedidos dos clientes com todas personalizações

**testimonials**
- Depoimentos de clientes para exibição na home

**products**
- Produtos disponíveis para venda

### Storage

**moto-images**
- Bucket para armazenar fotos enviadas pelos clientes

## 📝 Licença

Este projeto é privado e de uso comercial.

---

Desenvolvido com ❤️ para apaixonados por motos
