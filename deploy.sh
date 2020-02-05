git checkout master
git merge develop
yarn build
read -p "Commit description: " desc
git add .
git commit -m "$desc"
