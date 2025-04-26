# Gamify Journal

## Sobre o Projeto

O **Gamify Journal** é uma plataforma que transforma a experiência de escrita em um jogo de RPG. Com este aplicativo, os usuários podem criar diários pessoais enquanto ganham experiência (XP), sobem de nível e completam missões, tornando o hábito de escrever mais divertido.

## Funcionalidades Principais

- **Sistema de RPG Integrado**: Crie e desenvolva seu personagem enquanto escreve
- **Sistema de Missões**: Complete tarefas de escrita para ganhar recompensas
- **Editor Rico de Texto**: Interface de escrita completa com formatação avançada
- **Progressão de Personagem**: Ganhe XP e suba de nível com base nas suas atividades de escrita
- **Classes de Personagem**: Escolha entre diferentes classes (Guerreiro, Mago, etc.)
- **Painel de Missões**: Visualize e gerencie suas missões ativas

## Tecnologias Utilizadas

### Frontend
- **Next.js**: Framework React para aplicações web
- **TipTap**: Editor de texto rico e extensível
- **Tailwind CSS**: Framework de CSS utilitário
- **Radix UI**: Componentes acessíveis para interfaces de usuário

### Backend
- **FastAPI**: Framework moderno e rápido para construção de APIs com Python
- **SQLAlchemy**: ORM para interação com banco de dados
- **Pydantic**: Validação de dados e settings
- **SQLite**: Banco de dados leve para desenvolvimento

## Como Iniciar

### Frontend
1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

### Backend
1. Instale as dependências do Python:
   ```bash
   pip3 install -r backend/requirements.txt
   ```
2. Inicie o servidor FastAPI:
   ```bash
   cd backend
   python3 -m uvicorn main:app --reload
   ```

### Acesso à API
- A API estará disponível em `http://localhost:8000`
- Documentação interativa (Swagger UI): `http://localhost:8000/docs`
- Documentação alternativa (ReDoc): `http://localhost:8000/redoc`

### Fluxo de Uso Básico
1. Registre-se usando o endpoint `/api/users/register`
2. Faça login para obter um token JWT em `/api/users/token`
3. Crie um personagem em `/api/characters/`
4. Escreva entradas de diário em `/api/entries/`
5. Aceite missões em `/api/quests/accept/{quest_id}`
6. Acompanhe o progresso do seu personagem em `/api/characters/me`

## Estrutura do Projeto

- `/app`: Código frontend Next.js
- `/components`: Componentes React reutilizáveis
- `/backend`: API FastAPI e lógica do servidor
  - `/routers`: Endpoints da API organizados por funcionalidade
  - `/models.py`: Modelos SQLAlchemy para o banco de dados
  - `/schemas.py`: Schemas Pydantic para validação de dados

