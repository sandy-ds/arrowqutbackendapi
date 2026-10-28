import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express = require('express');
import { Context, Handler } from 'aws-lambda';
import { configure as serverlessExpress } from '@vendia/serverless-express';

let cachedServer: Handler;

async function bootstrapServer(): Promise<Handler> {
  if (!cachedServer) {
    const expressApp = express();
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );

    app.enableCors({
      origin: true,
      credentials: true,
    });

    await app.init();
    cachedServer = serverlessExpress({ app: expressApp });
  }
  return cachedServer;
}

// For Vercel Serverless Deployment
export const handler: Handler = async (
  event: any,
  context: Context,
  callback: any,
) => {
  const server = await bootstrapServer();
  return server(event, context, callback);
};

// Fallback for local development (npm run start:dev)
if (process.env.NODE_ENV !== 'production') {
  async function localBootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
      origin: true,
      credentials: true,
    });

    const port = process.env.PORT ?? 3001;
    await app.listen(port);

    console.log('=================================');
    console.log('🚀 NestJS Server Started');
    console.log(`🌐 http://localhost:${port}`);
    console.log('=================================');
  }
  localBootstrap();
}