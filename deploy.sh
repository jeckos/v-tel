git checkout master
git merge develop
set -e
yarn build
read -p "Commit description: " desc
git add .
git commit -m "$desc"
