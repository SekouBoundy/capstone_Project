-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================

-- Anyone can read non-suspended profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (is_suspended = FALSE OR auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (for new signups)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- VERIFICATION REQUESTS
-- ============================================================

-- Users can read their own verification requests
CREATE POLICY "Users can read own verification requests"
  ON verification_requests FOR SELECT
  USING (auth.uid() = profile_id);

-- Users can insert their own verification requests
CREATE POLICY "Users can insert own verification requests"
  ON verification_requests FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Admins can read all verification requests
CREATE POLICY "Admins can read all verification requests"
  ON verification_requests FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can update all verification requests
CREATE POLICY "Admins can update all verification requests"
  ON verification_requests FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- PROPERTIES
-- ============================================================

-- Anyone can read published properties
CREATE POLICY "Published properties are viewable by everyone"
  ON properties FOR SELECT
  USING (status = 'published' OR owner_id = auth.uid() OR
         EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Owners can create properties
CREATE POLICY "Owners can create properties"
  ON properties FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Owners can update their own properties
CREATE POLICY "Owners can update own properties"
  ON properties FOR UPDATE
  USING (auth.uid() = owner_id);

-- Owners can delete their own properties
CREATE POLICY "Owners can delete own properties"
  ON properties FOR DELETE
  USING (auth.uid() = owner_id);

-- Admins can update any property
CREATE POLICY "Admins can update any property"
  ON properties FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can delete any property
CREATE POLICY "Admins can delete any property"
  ON properties FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- PROPERTY IMAGES
-- ============================================================

-- Anyone can read property images for published properties
CREATE POLICY "Property images viewable by everyone"
  ON property_images FOR SELECT
  USING (EXISTS (SELECT 1 FROM properties WHERE id = property_id AND status = 'published'));

-- Owners can manage their own property images
CREATE POLICY "Owners can manage own property images"
  ON property_images FOR ALL
  USING (EXISTS (SELECT 1 FROM properties WHERE id = property_id AND owner_id = auth.uid()));

-- ============================================================
-- PRODUCTS
-- ============================================================

-- Anyone can read active products
CREATE POLICY "Active products are viewable by everyone"
  ON products FOR SELECT
  USING (status = 'active' OR seller_id = auth.uid() OR
         EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Users can create products
CREATE POLICY "Users can create products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- Sellers can update their own products
CREATE POLICY "Sellers can update own products"
  ON products FOR UPDATE
  USING (auth.uid() = seller_id);

-- Sellers can delete their own products
CREATE POLICY "Sellers can delete own products"
  ON products FOR DELETE
  USING (auth.uid() = seller_id);

-- Admins can update any product
CREATE POLICY "Admins can update any product"
  ON products FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can delete any product
CREATE POLICY "Admins can delete any product"
  ON products FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- CONVERSATIONS
-- ============================================================

-- Participants can read their conversations
CREATE POLICY "Participants can read own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = participant_a OR auth.uid() = participant_b);

-- Participants can create conversations
CREATE POLICY "Participants can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = participant_a OR auth.uid() = participant_b);

-- ============================================================
-- MESSAGES
-- ============================================================

-- Participants can read messages in their conversations
CREATE POLICY "Participants can read conversation messages"
  ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conversation_id
    AND (participant_a = auth.uid() OR participant_b = auth.uid())
  ));

-- Participants can send messages in their conversations
CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conversation_id
    AND (participant_a = auth.uid() OR participant_b = auth.uid())
  ));

-- ============================================================
-- REPORTS
-- ============================================================

-- Users can read their own reports
CREATE POLICY "Users can read own reports"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id OR
         EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Users can create reports
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Admins can update any report
CREATE POLICY "Admins can update any report"
  ON reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- FAVORITES
-- ============================================================

-- Users can read their own favorites
CREATE POLICY "Users can read own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create favorites
CREATE POLICY "Users can create favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);
