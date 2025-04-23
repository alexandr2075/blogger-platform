import { BloggersPlatformModule } from './modules/bloggers-platform/bloggers-platform.module';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RemoveModule } from './modules/bloggers-platform/remove/remove.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URL || 'mongodb://localhost:27017',
    ),
    UserAccountsModule,
    BloggersPlatformModule,
    RemoveModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
