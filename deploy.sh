yarn build
read -p "Commit description: " desc
read -p "Push to branch: " b
git add .
git commit -m "$desc"

