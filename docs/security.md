# Security Documentation - Wordwise

## Row-Level Security (RLS) Policies

Wordwise implements comprehensive Row-Level Security policies to ensure users can only access their own data.

### Tables Protected by RLS

#### 1. Profiles Table
**Purpose**: Stores public user profile information keyed by Supabase auth UID.

**Policies Applied**:
- `Users can view own profile` - SELECT access limited to `auth.uid() = id`
- `Users can insert own profile` - INSERT only allowed for `auth.uid() = id`
- `Users can update own profile` - UPDATE only allowed for `auth.uid() = id`
- `Users can delete own profile` - DELETE only allowed for `auth.uid() = id`

**Security Guarantee**: Users cannot access, modify, or delete other users' profile data.

#### 2. Documents Table
**Purpose**: Stores user-created documents and content.

**Policies Applied**:
- `Users can view own documents` - SELECT access limited to `auth.uid() = user_id`
- `Users can insert own documents` - INSERT only allowed for `auth.uid() = user_id`
- `Users can update own documents` - UPDATE only allowed for `auth.uid() = user_id`
- `Users can delete own documents` - DELETE only allowed for `auth.uid() = user_id`

**Security Guarantee**: Users cannot access, modify, or delete other users' documents.

### Authentication Flow

1. **Unauthenticated Requests**:
   - Redirected to `/auth/login` by Next.js middleware
   - Database queries return empty results due to `auth.uid()` being null

2. **Authenticated Requests**:
   - `auth.uid()` function returns the current user's ID from Supabase auth
   - Policies enforce access control based on ownership

### Testing RLS Policies

The RLS policies have been tested to ensure:
- ✅ Unauthenticated users cannot access any data
- ✅ Authenticated users can only access their own data
- ✅ Cross-account access is properly rejected

### Database Security Best Practices

1. **Principle of Least Privilege**: Users only have access to their own data
2. **Defense in Depth**: Multiple layers of security (middleware + RLS + application logic)
3. **Audit Trail**: All database operations are logged and traceable
4. **Secure by Default**: RLS is enabled on all user data tables

### Policy Implementation Details

```sql
-- Enable RLS on tables
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON "profiles"
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON "profiles"
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON "profiles"
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON "profiles"
  FOR DELETE USING (auth.uid() = id);

-- Documents policies
CREATE POLICY "Users can view own documents" ON "documents"
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON "documents"
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON "documents"
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON "documents"
  FOR DELETE USING (auth.uid() = user_id);
```

### Monitoring and Maintenance

- **Regular Audits**: RLS policies should be reviewed regularly
- **Testing**: Automated tests verify policy effectiveness
- **Monitoring**: Database access patterns are monitored for anomalies
- **Updates**: Policies are updated as application requirements evolve

---

**Last Updated**: January 2025
**Status**: ✅ Implemented and Tested