LernMate — GitHub Pages publish

This folder contains a Pages-ready copy of your web app.

What I added
- `index.html` — a publishable copy of your app (use `LernMate.html` as the editable source).
- `.github/workflows/pages.yml` — GitHub Actions workflow that packages the repository and deploys to GitHub Pages automatically when you push to `main`.

How to publish (quick):
1. Create a new repository on GitHub (or use an existing one).
2. From your local folder, push files to the repository:

```bash
git init
git add .
git commit -m "Initial LernMate Pages site"
git branch -M main
# replace <USER> and <REPO> with your GitHub username and repo name
git remote add origin https://github.com/<USER>/<REPO>.git
git push -u origin main
```

3. After push, GitHub Actions will run the `pages.yml` workflow and deploy the site. Visit `https://<USER>.github.io/<REPO>/` after a minute or two.

Notes & security
- Do NOT hard-code any secrets (PATs) into files that go into the repo. Your app stores the GitHub PAT in `localStorage` only.
- If you want continuous publishing from edits to `LernMate.html`, keep editing locally, then copy the updated HTML into `index.html` and push.

If you want, I can:
- Prepare a small script to sync `LernMate.html` -> `index.html` automatically.
- Help create the GitHub repo for you if you provide a token (I will not store it). 
