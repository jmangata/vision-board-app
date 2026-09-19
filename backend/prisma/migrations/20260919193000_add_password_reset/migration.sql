-- Réinitialisation de mot de passe : colonnes de token (hashé) et d'expiration sur users.
ALTER TABLE "users" ADD COLUMN "reset_token" TEXT;
ALTER TABLE "users" ADD COLUMN "reset_token_expiry" TIMESTAMP(3);
