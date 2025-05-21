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
- **Go**: Linguagem de programação para o backend.
- **Chi (v5)**: Framework web/roteador leve para Go.
- **GORM**: ORM para interação com banco de dados PostgreSQL.
- **PostgreSQL**: Banco de dados relacional.

## Backend (Go)

Esta seção detalha o backend baseado em Go para a aplicação Gamify Journal.

### Stack de Tecnologia

*   **Linguagem:** Go (versão 1.24.2 ou superior recomendada)
*   **Framework Web/Roteador:** Chi (v5)
*   **ORM:** GORM
*   **Banco de Dados:** PostgreSQL
*   **Dependências:** Gerenciadas via Go Modules (veja `go.mod`)

### Estrutura do Projeto (Backend)

*   `backend/cmd/server/main.go`: Ponto de entrada principal da aplicação backend.
*   `backend/internal/`: Lógica interna da aplicação backend, não destinada à importação por outros projetos.
    *   `backend/internal/models/`: Define as structs dos modelos do banco de dados.
    *   `backend/internal/user/`: Gerenciamento de usuários (handlers, services, store).
    *   `backend/internal/platform/`: Funcionalidades centrais da plataforma.
        *   `backend/internal/platform/database/`: Lógica de conexão com o banco de dados e migrações.
*   `backend/pkg/`: (Atualmente não utilizado, mas reservado para bibliotecas compartilháveis, se houver).
*   `backend/api/`: (Atualmente não utilizado, poderia ser usado para arquivos de especificação de API como OpenAPI/Swagger).
*   `backend/go.mod`, `backend/go.sum`: Arquivos de módulos Go para gerenciamento de dependências do backend.

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
        Alternativamente, você pode modificar a DSN padrão em `backend/internal/platform/database/database.go` para desenvolvimento local (não recomendado para credenciais sensíveis).
3.  **Instalar Dependências (Backend):** As dependências são gerenciadas por Go Modules. Elas serão baixadas automaticamente ao construir ou executar o projeto. Navegue até a pasta do backend:
    ```bash
    cd backend
    go mod tidy # Para garantir que as dependências estão sincronizadas
    ```
4.  **Executar Migrações e Iniciar o Servidor (Backend):**
    Ainda dentro da pasta `backend/`:
    ```bash
    go run cmd/server/main.go
    ```
    Isso também executará as migrações do banco de dados para criar/atualizar tabelas. O servidor normalmente iniciará em `http://localhost:8080`, a menos que a variável de ambiente `PORT` esteja definida.

### Executando Testes (Backend)

Para executar testes unitários para o backend (a partir da pasta `backend/`):
```bash
cd backend
go test ./internal/...
```
Para executar testes para um pacote específico (ex: user, a partir da pasta `backend/`):
```bash
cd backend
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
1. Clone o repositório.
2. Navegue até a pasta do frontend e instale as dependências:
   ```bash
   cd frontend
   pnpm install
   ```
3. Inicie o servidor de desenvolvimento (a partir da pasta `frontend/`):
   ```bash
   pnpm dev
   ```

### Backend (Go)

Consulte a seção "Backend (Go)" mais acima para instruções detalhadas sobre configuração e execução do backend em Go. Os passos resumidos são (executados de dentro da pasta `backend/` após navegar até ela com `cd backend`):

1. Certifique-se de ter o Go (1.24.2+ recomendado) e o PostgreSQL instalados.
2. Configure a variável de ambiente `DB_DSN`.
3. Execute `go mod tidy` para instalar/verificar dependências.
4. Execute o servidor: `go run cmd/server/main.go`.

## Estrutura do Projeto

- `frontend/`: Contém todo o código da aplicação frontend (Next.js).
  - `frontend/app/`: Código frontend Next.js (App Router).
  - `frontend/components/`: Componentes React reutilizáveis.
  - `frontend/package.json`: Dependências e scripts do frontend.
- `backend/`: Contém todo o código da aplicação backend (Go).
  - `backend/cmd/`: Aplicações principais do backend Go (e.g. `main.go` do servidor).
  - `backend/internal/`: Código privado do backend Go (modelos, serviços, handlers, etc.).
  - `backend/go.mod`, `backend/go.sum`: Arquivos de módulos Go para gerenciamento de dependências do backend.
- `README.md`: Este arquivo.
- `docs/detailed_info.txt`: Informações detalhadas do projeto (para desenvolvedores).

Consulte a seção "Backend (Go)" para uma descrição mais detalhada da estrutura interna do backend.

