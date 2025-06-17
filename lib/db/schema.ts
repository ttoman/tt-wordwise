import {
  timestamp,
  pgTable,
  text,
  uuid,
  index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

console.log('🔄 Loading database schema...');

// Profiles table to store public user data
// Keyed by Supabase auth user's UID
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // References auth.users(id)
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
});

console.log('✅ Profiles table schema defined');

// Documents table for user-created content
// References auth.users directly for simplicity and reliability
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    title: text('title').notNull().default('Untitled Document'),
    content: text('content'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    // Add indexes for faster queries on user_id and updated_at
    return {
      userIdx: index('user_idx').on(table.userId),
      updatedAtIdx: index('updated_at_idx').on(table.updatedAt),
    };
  }
);

console.log('✅ Documents table schema defined');

// Relations for documents
export const documentsRelations = relations(documents, ({ one }) => ({
  author: one(profiles, {
    fields: [documents.userId],
    references: [profiles.id],
  }),
}));

console.log('✅ Documents relations defined');

// Relations for profiles
export const profilesRelations = relations(profiles, ({ many }) => ({
  documents: many(documents),
}));

console.log('✅ Profiles relations defined');
console.log('✨ Database schema loaded successfully');