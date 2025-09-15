import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './modules/users/domain/user.entity';
import { Device } from './modules/devices/domain/device.entity';
import { Blog } from './modules/bloggers-platform/blogs/domain/blog.entity';
import { Post } from './modules/bloggers-platform/posts/domain/post.entity';
import { Like } from './modules/bloggers-platform/posts/domain/like.entity';
import { Comment } from './modules/bloggers-platform/comments/domain/comment.entity';
import { Player } from './modules/game-quiz/domain/player.entity';
import { Answers } from './modules/game-quiz/domain/answers.entity';
import { Game } from './modules/game-quiz/domain/game.entity';
import { Questions } from './modules/game-quiz/domain/questions.entity';

const env = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${env}` });

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '12345',
  database: process.env.POSTGRES_DB || 'blogger-platform',
  entities: [User, Device, Blog, Post, Like, Comment, Player, Answers, Game, Questions],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: true,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
