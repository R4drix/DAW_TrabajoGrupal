#!/usr/bin/env bash
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

cd CatagaClub
python manage.py collectstatic --no-input
python manage.py migrate
