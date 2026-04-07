-- DropIndex
DROP INDEX "Category_createdAt_idx";

-- DropIndex
DROP INDEX "RefreshToken_token_idx";

-- CreateIndex
CREATE INDEX "Category_createdAt_slug_id_idx" ON "Category"("createdAt", "slug", "id");

-- CreateIndex
CREATE INDEX "RefreshToken_token_userId_idx" ON "RefreshToken"("token", "userId");
