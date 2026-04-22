# Run this once from D:\GitHub\seneca_sdk to push the scaffold to GitHub.
# After it succeeds, delete this file.
Remove-Item -Recurse -Force .git -ErrorAction SilentlyContinue
git init
git config user.email "seongwonkc@gmail.com"
git config user.name "Kevin Choi"
git remote add origin https://github.com/seongwonkc/seneca_sdk.git
git add .
git commit -m "chore: scaffold @seneca/sdk v0.0.1 - three-surface architecture, privacy-first"
git branch -M main
git push -u origin main
