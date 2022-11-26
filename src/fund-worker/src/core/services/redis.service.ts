import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

import { RedisConfig } from '../models/config';

@Injectable()
export class RedisService {
  constructor(private configService: ConfigService) {}

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const cfg = this.configService.get<RedisConfig>('redis');
    const client = createClient({
      url: `redis://${cfg.host}:${cfg.port}`,
      password: cfg.password,
    });
    await client.connect();
    if (!ttl) {
      await client.set(key, JSON.stringify(value));
    } else {
      await client.set(key, JSON.stringify(value), { PX: ttl });
    }
    await client.disconnect();
  }

  async get<TValue>(key: string): Promise<TValue> {
    const cfg = this.configService.get<RedisConfig>('redis');
    const client = createClient({
      url: `redis://${cfg.host}:${cfg.port}`,
      password: cfg.password,
    });
    await client.connect();
    const value = await client.get(key);
    const typed = JSON.parse(value) as TValue;
    await client.disconnect();

    return typed;
  }
}
