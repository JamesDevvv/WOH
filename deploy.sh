#!/bin/bash
# ── Word of Hope — Production Deploy Script ───────────────────────────────────
# Run once on your server: bash deploy.sh
set -e

echo "📋 Step 1: Copy and fill in environment variables"
if [ ! -f .env.production ]; then
  cp .env.production.example .env.production
  echo "⚠️  Edit .env.production with your real values, then re-run this script."
  exit 1
fi

echo "🐳 Step 2: Build and start app + database (HTTP only first)"
# Start without SSL so certbot can do the ACME challenge
docker compose up -d postgres app nginx

echo "⏳ Waiting for app to be ready..."
sleep 10

echo "🔐 Step 3: Obtain SSL certificate from Let's Encrypt"
docker compose run --rm certbot

echo "🔄 Step 4: Reload nginx to pick up SSL certificates"
docker compose exec nginx nginx -s reload

echo "🔁 Step 5: Set up auto-renewal (add to crontab)"
(crontab -l 2>/dev/null; echo "0 3 * * * cd $(pwd) && docker compose run --rm certbot renew && docker compose exec nginx nginx -s reload") | crontab -

echo ""
echo "✅ Deployment complete!"
echo "   🌐 Visit: https://wordofhopesc.com"
echo ""
echo "   Useful commands:"
echo "   docker compose logs -f app    — view app logs"
echo "   docker compose restart app    — restart app"
echo "   docker compose down           — stop all"
echo "   docker compose pull && docker compose up -d --build  — update"
