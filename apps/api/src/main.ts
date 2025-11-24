import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.WEB_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(cookieParser());

  app.setGlobalPrefix('api', {
    exclude: [
      'p/:slug',
      's/:token',
      'templates',
      'templates/featured',
      'templates/category/:category',
      'templates/slug/:slug',
      'templates/apply/:cardId',
      'templates/custom-css/:cardId',
      'templates/:id',
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Nexus Cards API')
    .setDescription('Digital business card platform API documentation')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('cards', 'Business cards')
    .addTag('contacts', 'Contact management')
    .addTag('analytics', 'Analytics and reporting')
    .addTag('nfc', 'NFC tag management')
    .addTag('share-links', 'Shareable links')
    .addTag('billing', 'Subscription and billing')
    .addTag('integrations', 'Third-party integrations')
    .addTag('webhooks', 'Webhook subscriptions')
    .addTag('admin', 'Admin endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addCookieAuth('access_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'access_token',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.API_PORT || 3001;
  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(`API server running on http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log(`API documentation available at http://localhost:${port}/api-docs`);
}

bootstrap();
