#!/bin/bash

echo "========================================"
echo "   GitHub + Railway Deployment Script"
echo "========================================"
echo

echo "Checking git status..."
git status
echo

echo "Adding all changes to git..."
git add .
echo

read -p "Enter commit message (or press Enter for default): " commit_message
if [ -z "$commit_message" ]; then
    commit_message="Deploy to Railway via GitHub"
fi

echo "Committing changes..."
git commit -m "$commit_message"
echo

echo "Pushing to GitHub..."
git push origin main
echo

echo "========================================"
echo "   Deployment initiated!"
echo "========================================"
echo
echo "Your changes have been pushed to GitHub."
echo "Railway will automatically detect the push and start deploying."
echo
echo "You can monitor the deployment at:"
echo "https://railway.app/dashboard"
echo
echo "Health check will be available at:"
echo "https://your-app.railway.app/actuator/health"
echo
echo "Deployment complete!"