# Crypto Price Alert Service

A microservice that monitors cryptocurrency prices using Binance API and sends notifications through RabbitMQ when price alerts are triggered.

## Features

- Real-time cryptocurrency price monitoring via Binance WebSocket
- Flexible alert configurations:
  - Price threshold alerts (above/below target price)
  - Different duration types (once, one day, continuous)
  - Customizable expiration times
- RabbitMQ integration for notification delivery
- Comprehensive logging system
- MongoDB for alert storage and management
- Dockerized deployment

## Prerequisites

- Docker and Docker Compose
- MongoDB
- RabbitMQ
- Node.js (for development)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# MongoDB
MONGODB_URI=
NODE_ENV=development
PORT=3000
RABBITMQ_URI=amqp://rabbitmq:5672

```

## Installation & Running

1. Clone the repository:
```bash
git clone https://github.com/yourusername/crypto-alert-service.git
cd crypto-alert-service
```

2. Start the services using Docker Compose:
```bash
docker-compose up -d
```

The service will be available at `http://localhost:3000`

## API Endpoints

### Create Alert
```http
POST /api/alerts
```

Request body:
```json
{
  "symbol": "BTCUSDT",
  "targetPrice": 50000,
  "type": "ABOVE",
  "durationType": "ONCE",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

### Get Alerts
```http
GET /api/alerts
```

### Update Alert
```http
PUT /api/alerts/:id
```

### Delete Alert
```http
DELETE /api/alerts/:id
```

## Alert Types

- `ABOVE`: Triggers when price goes above the target
- `BELOW`: Triggers when price goes below the target

## Duration Types

- `ONCE`: Triggers only once when condition is met
- `ONE_DAY`: Triggers multiple times within 24 hours
- `CONTINUOUS`: Triggers continuously until manually disabled

## Logging

The service uses a structured logging system with the following levels:
- ERROR: For error events
- WARN: For warning events
- INFO: For general operational events
- DEBUG: For detailed debugging information

Logs are written to both console and files with daily rotation.

## Development

1. Install dependencies:
```bash
npm install
```

2. Run in development mode:
```bash
npm run dev
```

## Testing

Run the test suite:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.