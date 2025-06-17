-- Enable Row Level Security on profiles table
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on documents table
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;

-- Policy for profiles table: users can only access their own profile
CREATE POLICY "Users can view own profile" ON "profiles"
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON "profiles"
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON "profiles"
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON "profiles"
  FOR DELETE USING (auth.uid() = id);

-- Policy for documents table: users can only access documents they own
CREATE POLICY "Users can view own documents" ON "documents"
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON "documents"
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON "documents"
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON "documents"
  FOR DELETE USING (auth.uid() = user_id);