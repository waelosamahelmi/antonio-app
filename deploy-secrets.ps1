# Deploy Secrets to Fly.io
# This script sets all required environment variables as Fly.io secrets

Write-Host "Setting Fly.io secrets for antonio-app..." -ForegroundColor Green

# Set all secrets at once
fly secrets set `
  VITE_SUPABASE_URL="https://hjckjncwfnldhpkqujkz.supabase.co" `
  VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqY2tqbmN3Zm5sZGhwa3F1amt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTU1MTIsImV4cCI6MjA3MTE5MTUxMn0.JloF6hh-EDQm5xWofS-Kve0ZTTF3_8k1b-XQDE1jNNw" `
  VITE_SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqY2tqbmN3Zm5sZGhwa3F1amt6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTYxNTUxMiwiZXhwIjoyMDcxMTkxNTEyfQ.5dHxww0XVoS9nOTZObcEFsjFyTVXncuqQyq0MyKBZbw" `
  VITE_API_URL="https://antonio-app.fly.dev" `
  VITE_WS_URL="https://antonio-app.fly.dev" `
  VITE_SERVER_URL="https://antonio-app.fly.dev" `
  VITE_APP_NAME="Pizzeria Antonio - Kitchen Admin" `
  VITE_ANDROID_PACKAGE="com.ravintola.antonio.admin" `
  VITE_ENABLE_ANDROID_FEATURES="true" `
  VITE_ENABLE_BLUETOOTH="true" `
  VITE_ENABLE_LOCAL_NETWORK="true" `
  VITE_DEFAULT_PRINTER_IP="192.168.1.100" `
  VITE_CLOUDINARY_CLOUD_NAME="dxsr2gbbd" `
  VITE_CLOUDINARY_API_KEY="826112581683564" `
  VITE_CLOUDINARY_API_SECRET="MlZhHf6hUTVyMD3lQjhO0NfJ9tk" `
  SUPABASE_URL="https://hjckjncwfnldhpkqujkz.supabase.co" `
  SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqY2tqbmN3Zm5sZGhwa3F1amt6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTYxNTUxMiwiZXhwIjoyMDcxMTkxNTEyfQ.5dHxww0XVoS9nOTZObcEFsjFyTVXncuqQyq0MyKBZbw" `
  SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqY2tqbmN3Zm5sZGhwa3F1amt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTU1MTIsImV4cCI6MjA3MTE5MTUxMn0.JloF6hh-EDQm5xWofS-Kve0ZTTF3_8k1b-XQDE1jNNw" `
  DATABASE_URL="postgresql://postgres.hjckjncwfnldhpkqujkz:Weezy@1996@aws-1-eu-north-1.pooler.supabase.com:6543/postgres" `
  SESSION_SECRET="PnP39RgLQ9ODAiMcmcmeD+UiqWkNKsP21ri7M/TqzvN5rdf/Hul9uaY8waV1QYNMnCZ5KstNVtAw1bQy98G8Ug==" `
  SESSION_MAX_AGE="315360000000" `
  -a antonio-app

Write-Host "`nSecrets set successfully!" -ForegroundColor Green
Write-Host "The app will automatically redeploy with the new secrets." -ForegroundColor Yellow
