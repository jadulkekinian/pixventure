# PixVenture - Vercel Deployment Guide

## 🚀 Quick Deploy (5 Minutes)

### Step 1: Setup Git & GitHub

#### 1.1 Initialize Git (if not already)
```bash
cd "c:\Users\Darren\Documents\Pix Adventure"
git init
git add .
git commit -m "Initial commit - PixVenture game"
```

#### 1.2 Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `pixventure`
3. Description: "AI-powered text and image adventure game"
4. **Keep it Private** (or Public, up to you)
5. **Do NOT** initialize with README (we already have code)
6. Click "Create repository"

#### 1.3 Push to GitHub
```bash
# Replace with YOUR GitHub username
git remote add origin https://github.com/YOUR_USERNAME/pixventure.git
git branch -M main
git push -u origin main
```

---

### Step 2: Deploy to Vercel

#### 2.1 Sign Up/Login
1. Go to https://vercel.com
2. Click "Sign Up" or "Log In"
3. **Choose "Continue with GitHub"** (easiest!)
4. Authorize Vercel to access your GitHub

#### 2.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. Find `pixventure` repository in the list
3. Click **"Import"**

#### 2.3 Configure Project
Vercel will auto-detect Next.js. Settings should be:

```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build (auto-detected)
Output Directory: .next (auto-detected)
Install Command: npm install (auto-detected)
```

**Just keep defaults!** ✅

#### 2.4 Add Environment Variables

Click **"Environment Variables"**, add these 3 variables:

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: [your Supabase project URL]

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY  
Value: [your Supabase anon key]

Name: NEXT_PUBLIC_JDK_ORIGIN
Value: https://your-jdk-domain.com
```

> **Where to get Supabase values?**
> 1. Go to https://app.supabase.com
> 2. Select your project
> 3. Settings → API
> 4. Copy "Project URL" and "anon public" key

#### 2.5 Deploy!
1. Click **"Deploy"**
2. Wait ~2-3 minutes ⏳
3. You'll see: "Congratulations! 🎉"
4. Your game URL: `https://pixventure-xxx.vercel.app`

---

### Step 3: Test Your Deployment

#### 3.1 Open Game URL
Click the deployment URL, you should see the PixVenture start screen!

#### 3.2 Test Basic Functionality
- ✅ Start screen loads
- ✅ Can change language
- ✅ Click "START ADVENTURE"
- ✅ Story generates
- ✅ Image appears
- ✅ Can type commands

#### 3.3 Get Your Production URL
```
Example: https://pixventure-abc123.vercel.app

Save this URL! You'll use it in JDK web.
```

---

### Step 4: Update JDK Web Integration

In your JDK web (Hostinger), update the iframe src:

```html
<iframe 
  src="https://pixventure-abc123.vercel.app"  <!-- Your actual Vercel URL -->
  width="100%"
  height="800px"
>
</iframe>
```

Also update postMessage origin validation:

```javascript
if (event.origin !== 'https://pixventure-abc123.vercel.app') {
  return;
}
```

---

## 🔄 Re-deploy After Code Changes

### Option A: Auto Deploy (Recommended)
```bash
# Just push to GitHub, Vercel auto-deploys!
git add .
git commit -m "Your changes"
git push
```

Vercel will automatically detect and deploy. Check progress at:
https://vercel.com/dashboard

### Option B: Manual Deploy
1. Go to Vercel dashboard
2. Click your project
3. Click "Deployments" tab
4. Click "Redeploy" on any previous deployment

---

## 🎨 Custom Domain (Optional)

### Setup Custom Domain
1. Go to Project Settings → Domains
2. Add domain: `pixventure.yourdomain.com`
3. Add CNAME record in your DNS:
   ```
   CNAME pixventure → cname.vercel-dns.com
   ```
4. Wait ~5 minutes for DNS propagation
5. SSL auto-configured! ✅

---

## 📊 Monitor Your Deployment

### Vercel Dashboard
- **Deployments**: See all deployment history
- **Analytics**: Page views, performance
- **Logs**: Real-time function logs
- **Settings**: Update env variables

Access: https://vercel.com/dashboard

---

## ❓ Troubleshooting

### Build Failed?

**Check build logs:**
1. Go to deployment page
2. Scroll to "Build Logs"
3. Look for errors

**Common issues:**
```
Error: Missing dependencies
Fix: npm install locally first

Error: Type errors
Fix: Run npm run build locally to see errors

Error: Environment variables missing
Fix: Add them in Vercel dashboard → Settings → Environment Variables
```

### Game Not Loading?

1. **Check deployment status** - Must say "Ready"
2. **Check browser console** - Look for errors
3. **Verify env variables** - All 3 should be set
4. **Clear cache** - Hard refresh (Ctrl+Shift+R)

### Iframe Not Working?

1. **HTTPS required** - Both sites must use HTTPS
2. **Origin mismatch** - Update NEXT_PUBLIC_JDK_ORIGIN
3. **CORS issue** - Check browser console

---

## 📝 Important URLs to Save

```
Production URL: https://pixventure-xxx.vercel.app
Vercel Dashboard: https://vercel.com/dashboard
GitHub Repo: https://github.com/YOUR_USERNAME/pixventure
Supabase Dashboard: https://app.supabase.com
```

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables added
- [ ] Deployment successful
- [ ] Game tested and working
- [ ] Production URL saved
- [ ] JDK web iframe updated
- [ ] postMessage tested

---

**Ready to deploy?** Follow Step 1 first, then let me know when you're ready for Step 2! 🚀
