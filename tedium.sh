#!/bin/sh

git push
git co staging
git rebase master
git push

git push heroku-staging staging:master
git co master