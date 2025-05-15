# Gamify Journal

## Sobre o Projeto

O **Gamify Journal** é uma plataforma que transforma a experiência de escrita em um jogo de RPG. Com este aplicativo, os usuários podem criar diários pessoais enquanto ganham experiência (XP), sobem de nível e completam missões, tornando o hábito de escrever mais divertido.

## Funcionalidades Principais

- **Sistema de RPG Integrado**: Crie e desenvolva seu personagem enquanto escreve
- **Sistema de Missões**: Complete tarefas de escrita para ganhar recompensas
- **Editor Rico de Texto**: Interface de escrita completa com formatação avançadas
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

## Backend (Go)

Esta seção detalha o backend baseado em Go para a aplicação Gamify Journal.

### Stack de Tecnologia

*   **Linguagem:** Go (versão 1.24.2 ou superior recomendada)
*   **Framework Web/Roteador:** Chi (v5)
*   **ORM:** GORM
*   **Banco de Dados:** PostgreSQL
*   **Dependências:** Gerenciadas via Go Modules (veja `go.mod`)

### Estrutura do Projeto (Backend)

*   `cmd/server/main.go`: Ponto de entrada principal da aplicação.
*   `internal/`: Lógica interna da aplicação, não destinada à importação por outros projetos.
    *   `internal/models/`: Define as structs dos modelos do banco de dados.
    *   `internal/user/`: Gerenciamento de usuários (handlers, services, store).
    *   `internal/platform/`: Funcionalidades centrais da plataforma.
        *   `internal/platform/database/`: Lógica de conexão com o banco de dados e migrações.
*   `pkg/`: (Atualmente não utilizado, mas reservado para bibliotecas compartilháveis, se houver).
*   `api/`: (Atualmente não utilizado, poderia ser usado para arquivos de especificação de API como OpenAPI/Swagger).

### Configuração e Execução

1.  **Instalar o Go:** Certifique-se de que o Go (versão 1.24.2+) está instalado e configurado.
2.  **Configuração do Banco de Dados:**
    *   Certifique-se de que o PostgreSQL está em execução.
    *   Crie um banco de dados (ex: `gamify_journal_db`).
    *   Defina a variável de ambiente `DB_DSN` com sua string de conexão PostgreSQL. Exemplo:
        ```bash
        export DB_DSN="host=localhost user=seuusuario password=suasenha dbname=gamify_journal_db port=5432 sslmode=disable TimeZone=UTC"
        ```
        (Atualize as credenciais e o nome do banco de dados conforme necessário).
        Alternativamente, você pode modificar a DSN padrão em `internal/platform/database/database.go` para desenvolvimento local (não recomendado para credenciais sensíveis).
3.  **Instalar Dependências:** As dependências são gerenciadas por Go Modules. Elas serão baixadas automaticamente ao construir ou executar o projeto.
4.  **Executar Migrações e Iniciar o Servidor:**
    A partir da raiz do projeto (`gamify_journal/`):
    ```bash
    go run cmd/server/main.go
    ```
    Isso também executará as migrações do banco de dados para criar/atualizar tabelas. O servidor normalmente iniciará em `http://localhost:8080`, a menos que a variável de ambiente `PORT` esteja definida.

### Executando Testes

Para executar testes unitários para o backend:
```bash
go test ./internal/...
```
Para executar testes para um pacote específico (ex: user):
```bash
go test ./internal/user/...
```

### Endpoints da API Disponíveis (Iniciais)

*   `GET /health`: Verificação de saúde do servidor.
*   `POST /api/v1/users/register`: Registra um novo usuário.
    *   Payload: `{"username": "string", "email": "string", "password": "string"}`
*   `POST /api/v1/auth/login`: Faz login de um usuário existente.
    *   Payload: `{"email": "string", "password": "string"}`
*   `GET /api/v1/users/{userID}`: Obtém detalhes do usuário por ID (atualmente não protegido por autenticação).

---

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

## Estrutura do Projeto

- `/app`: Código frontend Next.js
- `/components`: Componentes React reutilizáveis
- `/backend`: API FastAPI e lógica do servidor
  - `/routers`: Endpoints da API organizados por funcionalidade
  - `/models.py`: Modelos SQLAlchemy para o banco de dados
  - `/schemas.py`: Schemas Pydantic para validação de dados

