# Chaos - Social Messaging Platform

A modern, real-time social messaging platform built with Go (backend) and Next.js (frontend). Features include user authentication, messaging, voice calls, guilds (groups), friend management, and real-time notifications.

## 🚀 Features

- **User Authentication**: JWT-based authentication with signup/signin
- **Real-time Messaging**: WebSocket-powered instant messaging
- **Voice Calls**: Real-time voice communication
- **Friend System**: Send/receive friend requests
- **User Management**: Profile management, blocking users
- **Notifications**: Real-time notifications for various events
- **Modern UI**: Built with Next.js, Tailwind CSS, and Radix UI

## 🏗️ Architecture

### Backend (Go)
- **Framework**: Echo (HTTP server)
- **Database**: PostgreSQL with Ent ORM
- **Authentication**: JWT tokens
- **Real-time**: WebSocket hub
- **Validation**: Go validator
- **Hot Reload**: Air for development

### Frontend (Next.js)
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Forms**: React Hook Form with Zod validation

## 📁 Project Structure

```
chaos/
├── cmd/
│   └── service/          # Main application entry point
├── internal/
│   ├── controller/       # HTTP request handlers
│   ├── ent/             # Database ORM (Ent)
│   ├── middleware/      # Custom middleware
│   ├── services/        # Business logic
│   ├── utility/         # Utility functions
│   └── ws/              # WebSocket implementation
├── ui/                  # Next.js frontend
├── go.mod              # Go dependencies
├── Makefile            # Build and development commands
└── .air.toml          # Hot reload configuration
```

## 🛠️ Prerequisites

- Go 1.23.3+
- Node.js 18+
- PostgreSQL
- Docker (optional)

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd chaos
```

### 2. Set up environment variables
| Variable | Description | Default |
|----------|-------------|---------|
| `SERVER_ADDR` | Server address | `:9999` |
| `DATABASE_DRIVER` | Database driver | `postgres` |
| `DATABASE_DSN` | Database connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |

### 3. Start the backend
```bash
# Install dependencies
go mod download

# Run with hot reload
make dev

# Or run directly
go run cmd/service/main.go
```

### 4. Start the frontend
```bash
cd ui
npm install
npm run dev
```

The application will be available at:
- Backend API: http://localhost:9999
- Frontend: http://localhost:3000

## 📚 API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/auth/signin` - User login
- `POST /api/v1/auth/signout` - User logout
- `GET /api/v1/auth/checkusername/:username` - Check username availability

### Messaging
- `GET /api/v1/conversations` - Get user conversations
- `POST /api/v1/conversations` - Create new conversation
- `GET /api/v1/conversations/:id/messages` - Get conversation messages
- `POST /api/v1/conversations/:id/messages` - Send message

### Friends
- `GET /api/v1/friends` - Get friends list
- `POST /api/v1/friends/request` - Send friend request
- `PUT /api/v1/friends/:id/accept` - Accept friend request

### Calls
- `POST /api/v1/calls` - Initiate call
- `PUT /api/v1/calls/:id/accept` - Accept call
- `PUT /api/v1/calls/:id/end` - End call

## 🛠️ Development

### Available Make Commands
```bash
make help          # Show all available commands
```
## 📄 License

This project is licensed under the MIT License.


