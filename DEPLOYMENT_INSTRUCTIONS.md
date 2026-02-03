# KWSC DEPLOYMENT GUIDE (VERCEL)

Doston, is file me wo tamam maloomat hain jo aapko Vercel par deployment ke liye chahiye.

## 1. Environment Variables (.env)
Vercel dashboard me ye values **Key** aur **Value** ke taur par add karein:

```env
# Frontend (Supabase)
VITE_SUPABASE_URL="https://xrhhvartdyonadzzkxty.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyaGh2YXJ0ZHlvbmFkenpreHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mzk0NTMsImV4cCI6MjA4MzIxNTQ1M30.h3v65QBRDBLGHQpeWY14fWDtPcQvahE4JDEPSlge7hY"

# Backend (SQL Server / Database)
DATABASE_URL="YOUR_DB_CONNECTION_STRING"
JWT_SECRET="KWSC_SECRET_2026"
PORT=5000
```

## 2. GitHub Repo Link
Deployment ke waqt is repo ko select karein:
`https://github.com/ashhadshahzeb-cmd/KWSC-Medical.git`

## 3. Quick Steps for Vercel
1. Vercel dashboard par **"Add New" > "Project"** par jayein.
2. **KWSC-Medical** repo import karein.
3. **Framework Preset**: Vite (detected automatically).
4. **Environment Variables**: Upar di gayi list se charon (4) variables add karein.
5. **Deploy**: "Deploy" dabayein aur 2 minute intizar karein.

## 4. Key Features to Test
- **Voice AI**: Urdu aur English me commands.
- **Hands-Free Entry**: Entry pages par voice se data fill karna.
- **Backend API**: Stats aur history loading checkout karna.
