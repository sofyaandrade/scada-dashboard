# PLC.Bridge Frontend

> **Work in progress:** this project is under active development as part of my undergraduate thesis (TCC). It is not production-ready yet.

A web dashboard for configuring industrial Programmable Logic Controllers (PLCs) and monitoring their Modbus tags through the [PLC.Bridge Go backend](https://github.com/sofyaandrade/backend-tcc).

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Lovable](https://img.shields.io/badge/initial%20implementation-Lovable-FF4A64)](https://lovable.dev/)
[![Status](https://img.shields.io/badge/status-in%20development-orange)](#project-status)

## Implementation Disclosure

The **initial interface and project scaffold were generated with [Lovable](https://lovable.dev/)**.

My work on this repository has focused on adapting that initial implementation to the thesis requirements, including:

- Connecting the application to the custom Go backend
- Adapting authentication and protected navigation
- Mapping backend PLC and tag models to frontend types
- Integrating CRUD operations for PLCs and tags
- Connecting real-time tag values and PLC connection statuses
- Adjusting application state, service functions, forms, and error handling

This repository should therefore be understood as an **AI-assisted frontend integration and adaptation project**, rather than a user interface built entirely from scratch.

## Main Features

- JWT-based login connected to the backend API
- Protected application routes
- Dashboard with online, offline, and connecting PLC statuses
- PLC creation, editing, and deletion
- Tag creation, editing, and deletion
- Real-time tag and connection-status polling at one-second intervals
- Modbus configuration fields for tag type, operation, offset, and byte order
- Session-scoped authentication storage
- Responsive collapsible navigation
- Light and dark themes with persisted preference
- Loading, empty, and error states for backend operations

## Integration Flow

```text
+-------------------------+
|      React Frontend     |
| Dashboard and Forms     |
+------------+------------+
             |
             | Authenticated REST requests
             | PLC and tag CRUD
             | 1-second status/value polling
             v
+-------------------------+
|      Go Backend API     |
| Gin + JWT + Casbin      |
+------------+------------+
             |
             | Concurrent Modbus TCP workers
             v
+-------------------------+
|     Industrial PLCs     |
| Coils and Registers     |
+-------------------------+
```

The frontend requests PLC configuration, real-time tag values, and device statuses in parallel. Backend responses are normalized and mapped to UI-specific models before being exposed through React context.

## Technical Highlights

- **Typed API layer:** a shared `fetch` wrapper handles base URLs, JSON payloads, Bearer tokens, response parsing, and HTTP errors.
- **Backend model adaptation:** dedicated mapping functions translate the Go API response format into frontend-friendly PLC and tag models.
- **Parallel data loading:** `Promise.all` combines PLC metadata, real-time values, statuses, and configuration options.
- **Near-real-time monitoring:** the PLC context refreshes device state and tag values every second.
- **Authentication lifecycle:** JWT payloads are decoded to restore user information and reject expired sessions.
- **State organization:** React Context coordinates authentication, theme, and PLC domain state, while Redux Toolkit supports asynchronous API actions.
- **File-based routing:** TanStack Router provides typed routes and protected application layouts.
- **Reusable component system:** the interface uses Radix UI primitives and shadcn-style components.

## Tech Stack

| Area | Technology |
| --- | --- |
| Language | TypeScript |
| UI library | React 19 |
| Full-stack framework | TanStack Start |
| Routing | TanStack Router |
| State management | React Context + Redux Toolkit |
| Styling | Tailwind CSS 4 |
| UI primitives | Radix UI / shadcn-style components |
| Forms and validation tooling | React Hook Form + Zod |
| Build tooling | Vite |
| Icons | Lucide React |
| Initial generation | Lovable |

## Project Structure

```text
src/
|-- components/             # Application and reusable UI components
|   `-- ui/                 # Radix-based component library
|-- contexts/               # Authentication, theme, and PLC state
|-- hooks/                  # Context access and responsive hooks
|-- interface/              # Backend response contracts
|-- pages/                  # Login, dashboard, and PLC detail screens
|-- routes/                 # TanStack file-based routes
|-- services/               # API client and backend integrations
|-- store/                  # Redux Toolkit store and reducers
|-- types/                  # Frontend domain types
|-- router.tsx              # Router configuration
`-- styles.css              # Theme tokens and global styles
```

## Running Locally

### Requirements

- Node.js
- npm
- The [backend project](https://github.com/sofyaandrade/backend-tcc) running locally

### Setup

```bash
git clone https://github.com/sofyaandrade/scada-dashboard.git
cd frontend-tcc
npm install
npm run dev
```

The development server starts on port `2910` and can be accessed locally at `http://localhost:2910`.

If you need to open the dashboard from another machine on the network, use the host machine IP, for example `http://192.168.0.10:2910`.

By default, the frontend connects to the backend at `http://localhost:1710`. If the browser is running on another machine, `localhost` will not point to your backend. In that case, create a `.env` file with the backend IP:

```env
VITE_BACKEND_URL=http://192.168.0.10:1710
```

## Available Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format the project with Prettier |

## Backend Resources Used

| Resource | Frontend usage |
| --- | --- |
| `/login` | User authentication |
| `/clps` | PLC listing and CRUD operations |
| `/clps/status` | Connection-status monitoring |
| `/tags` | Tag listing and CRUD operations |
| `/tags/real-time` | Current Modbus tag values |
| `/swaps` | Byte and word order options |
| `/type-clps` | Available PLC types |
| `/type-tags` | Available tag data types |
| `/type-operations` | Available Modbus operations |

Protected requests include the JWT access token in the `Authorization: Bearer <token>` header.

## Project Status

This frontend is an **active undergraduate thesis project** and remains under development. Its current goal is to provide a usable interface for the backend's authentication, PLC configuration, tag configuration, and real-time monitoring capabilities.

Planned improvements include:

- Automated component and integration tests
- Automatic refresh-token handling
- More detailed loading and API error feedback
- Form validation consolidation
- Accessibility review
- Removal of unused generated components and legacy service code
- CI pipeline for linting, type checking, and builds
- Deployment and production configuration

## Academic Context

PLC.Bridge explores the integration between industrial automation devices and web applications. This frontend acts as the visualization and configuration layer for a Go middleware that communicates concurrently with multiple PLCs over Modbus TCP.
