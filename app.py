import os
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from sqlalchemy.orm import DeclarativeBase

# Configure logging
logging.basicConfig(level=logging.DEBUG)

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
migrate = Migrate()

# create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "resticly-default-secret")

# configure the database using PostgreSQL from environment
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# initialize the app with the extensions
db.init_app(app)

# Import models here to avoid circular imports
import models

# Initialize Flask-Migrate
migrate.init_app(app, db)

# Import routes to register them with the app
import routes

# Initialize database tables
with app.app_context():
    db.create_all()

# Initialize scheduler outside app context to avoid issues with teardown
from scheduler import init_scheduler
init_scheduler(app)
