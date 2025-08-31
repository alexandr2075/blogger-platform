import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1756037894466 implements MigrationInterface {
    name = 'Initial1756037894466'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "devices" DROP CONSTRAINT IF EXISTS "fk_devices_user_id"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "fk_comments_post_id"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "posts_blog_id_fkey"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_devices_user_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_devices_device_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_devices_user_device"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_devices_exp"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_comments_post_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_comments_user_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_comments_created_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_comments_deleted_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_posts_blog_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_posts_deleted_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_blogs_name"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_blogs_deleted_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_users_email"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_users_login"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_users_deleted_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_users_confirmation_code"`);
        // Drop legacy trigger function globally (removes dependent triggers as well)
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE`);
        // Drop legacy triggers that update removed updated_at columns
        await queryRunner.query(`DO $$ BEGIN
          IF EXISTS (
            SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at'
          ) THEN
            EXECUTE 'DROP TRIGGER IF EXISTS update_users_updated_at ON users';
          END IF;
        END $$;`);
        await queryRunner.query(`DO $$ BEGIN
          IF EXISTS (
            SELECT 1 FROM pg_trigger WHERE tgname = 'update_blogs_updated_at'
          ) THEN
            EXECUTE 'DROP TRIGGER IF EXISTS update_blogs_updated_at ON blogs';
          END IF;
        END $$;`);
        await queryRunner.query(`DROP TABLE IF EXISTS "likes" CASCADE`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "likes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" character varying NOT NULL, "userId" uuid NOT NULL, "postId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a9323de3f8bced7539a794b4a37" PRIMARY KEY ("id"))`);
        await queryRunner.query(`DO $$ BEGIN
        ALTER TABLE "devices" DROP COLUMN "user_id";
      EXCEPTION
        WHEN undefined_column THEN null;
      END $$;`);
        await queryRunner.query(`ALTER TABLE "devices" DROP CONSTRAINT IF EXISTS "devices_device_id_key"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN IF EXISTS "device_id"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN IF EXISTS "iat"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN IF EXISTS "device_name"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN IF EXISTS "exp"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN IF EXISTS "created_at"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN IF EXISTS "updated_at"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN IF EXISTS "user_id"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN IF EXISTS "user_login"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN IF EXISTS "post_id"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN IF EXISTS "created_at"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN IF EXISTS "updated_at"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN IF EXISTS "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN IF EXISTS "short_description"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN IF EXISTS "blog_id"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN IF EXISTS "blog_name"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN IF EXISTS "created_at"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN IF EXISTS "updated_at"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN IF EXISTS "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN IF EXISTS "website_url"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN IF EXISTS "is_membership"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN IF EXISTS "created_at"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN IF EXISTS "updated_at"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN IF EXISTS "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "password_hash"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "confirmation_code"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "confirmation_code_expiration_date"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "is_confirmed"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "name_first_name"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "name_last_name"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "created_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "updated_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "title" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "lastActiveDate" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "deviceId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "userId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "postId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "userId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "userLogin" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "shortDescription" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "blogId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "userId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "websiteUrl" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "isMembership" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "userId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordHash" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "confirmationCode" character varying`);
        await queryRunner.query(`DO $$ BEGIN
        CREATE TYPE "public"."users_isconfirmed_enum" AS ENUM('confirmed', 'unconfirmed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isConfirmed" "public"."users_isconfirmed_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletedAt" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN IF EXISTS "ip"`);
        await queryRunner.query(`ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "ip" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN IF EXISTS "content"`);
        await queryRunner.query(`ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "content" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN IF EXISTS "title"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "title" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN IF EXISTS "content"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "content" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN IF EXISTS "name"`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN IF EXISTS "description"`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "description" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_login_key"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "login"`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "login" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "email"`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" character varying NOT NULL`);
        await queryRunner.query(`DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_e8a5d59f0ac3040395f159507c6') THEN
            ALTER TABLE "devices" ADD CONSTRAINT "FK_e8a5d59f0ac3040395f159507c6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
          END IF;
        END $$;`);
        await queryRunner.query(`DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_cfd8e81fac09d7339a32e57d904') THEN
            ALTER TABLE "likes" ADD CONSTRAINT "FK_cfd8e81fac09d7339a32e57d904" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
          END IF;
        END $$;`);
        await queryRunner.query(`DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_e2fe567ad8d305fefc918d44f50') THEN
            ALTER TABLE "likes" ADD CONSTRAINT "FK_e2fe567ad8d305fefc918d44f50" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
          END IF;
        END $$;`);
        await queryRunner.query(`DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_e44ddaaa6d058cb4092f83ad61f') THEN
            ALTER TABLE "comments" ADD CONSTRAINT "FK_e44ddaaa6d058cb4092f83ad61f" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
          END IF;
        END $$;`);
        await queryRunner.query(`DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_7e8d7c49f218ebb14314fdb3749') THEN
            ALTER TABLE "comments" ADD CONSTRAINT "FK_7e8d7c49f218ebb14314fdb3749" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
          END IF;
        END $$;`);
        await queryRunner.query(`DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_55d9c167993fed3f375391c8e31') THEN
            ALTER TABLE "posts" ADD CONSTRAINT "FK_55d9c167993fed3f375391c8e31" FOREIGN KEY ("blogId") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
          END IF;
        END $$;`);
        await queryRunner.query(`DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_ae05faaa55c866130abef6e1fee') THEN
            ALTER TABLE "posts" ADD CONSTRAINT "FK_ae05faaa55c866130abef6e1fee" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
          END IF;
        END $$;`);
        await queryRunner.query(`DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_50205032574e0b039d655f6cfd3') THEN
            ALTER TABLE "blogs" ADD CONSTRAINT "FK_50205032574e0b039d655f6cfd3" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
          END IF;
        END $$;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blogs" DROP CONSTRAINT "FK_50205032574e0b039d655f6cfd3"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_ae05faaa55c866130abef6e1fee"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_55d9c167993fed3f375391c8e31"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_7e8d7c49f218ebb14314fdb3749"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_e44ddaaa6d058cb4092f83ad61f"`);
        await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "FK_e2fe567ad8d305fefc918d44f50"`);
        await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "FK_cfd8e81fac09d7339a32e57d904"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP CONSTRAINT "FK_e8a5d59f0ac3040395f159507c6"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "users_email_key" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "login"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "login" character varying(10) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "users_login_key" UNIQUE ("login")`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "description" character varying(500) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "name" character varying(15) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "content"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "content" character varying(1000) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "title" character varying(30) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "content"`);
        await queryRunner.query(`ALTER TABLE "comments" ADD "content" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "ip"`);
        await queryRunner.query(`ALTER TABLE "devices" ADD "ip" character varying(255) DEFAULT 'not specified'`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isConfirmed"`);
        await queryRunner.query(`DROP TYPE "public"."users_isconfirmed_enum"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "confirmationCode"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "passwordHash"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "isMembership"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "websiteUrl"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "blogId"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "shortDescription"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "userLogin"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "postId"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "deviceId"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "lastActiveDate"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "name_last_name" character varying(255) DEFAULT 'lastName yyy'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "name_first_name" character varying(255) DEFAULT 'firstName xxx'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "is_confirmed" character varying(20) DEFAULT 'unconfirmed'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "confirmation_code_expiration_date" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "confirmation_code" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "password_hash" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "is_membership" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "website_url" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "blog_name" character varying(15) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "blog_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "short_description" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "comments" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "comments" ADD "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "comments" ADD "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "comments" ADD "post_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "comments" ADD "user_login" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "comments" ADD "user_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "devices" ADD "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "devices" ADD "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "devices" ADD "exp" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "devices" ADD "device_name" character varying(255) DEFAULT 'not specified'`);
        await queryRunner.query(`ALTER TABLE "devices" ADD "iat" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "devices" ADD "device_id" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "devices" ADD CONSTRAINT "devices_device_id_key" UNIQUE ("device_id")`);
        await queryRunner.query(`ALTER TABLE "devices" ADD "user_id" uuid NOT NULL`);
        await queryRunner.query(`DROP TABLE "likes"`);
        await queryRunner.query(`CREATE INDEX "idx_users_confirmation_code" ON "users" ("confirmation_code") `);
        await queryRunner.query(`CREATE INDEX "idx_users_deleted_at" ON "users" ("deleted_at") `);
        await queryRunner.query(`CREATE INDEX "idx_users_login" ON "users" ("login") `);
        await queryRunner.query(`CREATE INDEX "idx_users_email" ON "users" ("email") `);
        await queryRunner.query(`CREATE INDEX "idx_blogs_deleted_at" ON "blogs" ("deleted_at") `);
        await queryRunner.query(`CREATE INDEX "idx_blogs_name" ON "blogs" ("name") `);
        await queryRunner.query(`CREATE INDEX "idx_posts_deleted_at" ON "posts" ("deleted_at") `);
        await queryRunner.query(`CREATE INDEX "idx_posts_blog_id" ON "posts" ("blog_id") `);
        await queryRunner.query(`CREATE INDEX "idx_comments_deleted_at" ON "comments" ("deleted_at") `);
        await queryRunner.query(`CREATE INDEX "idx_comments_created_at" ON "comments" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_comments_user_id" ON "comments" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "idx_comments_post_id" ON "comments" ("post_id") `);
        await queryRunner.query(`CREATE INDEX "idx_devices_exp" ON "devices" ("exp") `);
        await queryRunner.query(`CREATE INDEX "idx_devices_user_device" ON "devices" ("device_id", "user_id") `);
        await queryRunner.query(`CREATE INDEX "idx_devices_device_id" ON "devices" ("device_id") `);
        await queryRunner.query(`CREATE INDEX "idx_devices_user_id" ON "devices" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "posts_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "fk_comments_post_id" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "devices" ADD CONSTRAINT "fk_devices_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
