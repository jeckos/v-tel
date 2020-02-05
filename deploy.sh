# shellcheck disable=SC2162
read -p "Commit description: " desc
git add .
git commit -m "$desc"
git push origin master
