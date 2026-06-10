"""
IJTD Backend — Application Factory
"""
import os
from datetime import datetime, timezone, timedelta
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_mail import Mail
from flask_jwt_extended import JWTManager
from flasgger import Swagger

db      = SQLAlchemy()
migrate = Migrate()
mail    = Mail()
jwt     = JWTManager()


def now_utc():
    return datetime.now(timezone.utc)


def create_app():
    app = Flask(__name__)

    # ── Configuration ──────────────────────────────────────────────────────
    app.config["SECRET_KEY"]     = os.getenv("SECRET_KEY", "dev-secret-key")
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "jwt-dev-secret")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"]  = timedelta(hours=int(os.getenv("JWT_ACCESS_HOURS", 8)))
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=int(os.getenv("JWT_REFRESH_DAYS", 30)))

    # CRITICAL: tell flask-jwt-extended the identity is a string
    # (we store str(user.id) — this prevents the 422 Unprocessable Entity error)

    database_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/ijtd_db")
    app.config["SQLALCHEMY_DATABASE_URI"]        = database_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_ENGINE_OPTIONS"]      = {
        "pool_size": 10, "pool_recycle": 3600, "pool_pre_ping": True,
    }

    app.config["UPLOAD_FOLDER"]        = os.path.join(
        os.path.dirname(__file__), os.getenv("UPLOAD_FOLDER", "uploads")
    )
    app.config["MAX_CONTENT_LENGTH"]   = int(os.getenv("MAX_CONTENT_LENGTH", 16 * 1024 * 1024))

    app.config["MAIL_SERVER"]          = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    app.config["MAIL_PORT"]            = int(os.getenv("MAIL_PORT", 587))
    app.config["MAIL_USE_TLS"]         = os.getenv("MAIL_USE_TLS", "True") == "True"
    app.config["MAIL_USERNAME"]        = os.getenv("MAIL_USERNAME", "")
    app.config["MAIL_PASSWORD"]        = os.getenv("MAIL_PASSWORD", "")
    app.config["MAIL_DEFAULT_SENDER"]  = os.getenv("MAIL_DEFAULT_SENDER", "contact@ijtd.com")

    # ── Swagger ────────────────────────────────────────────────────────────
    swagger_config = {
        "headers": [],
        "specs": [{"endpoint": "apispec", "route": "/apispec.json",
                   "rule_filter": lambda rule: True, "model_filter": lambda tag: True}],
        "static_url_path": "/flasgger_static",
        "swagger_ui": True,
        "specs_route": "/apidocs/",
    }
    swagger_template = {
        "swagger": "2.0",
        "info": {"title": "IJTD API", "version": "1.0.0"},
        "basePath": "/api",
        "schemes": ["http", "https"],
        "securityDefinitions": {
            "BearerAuth": {"type": "apiKey", "in": "header", "name": "Authorization"}
        },
        "tags": [
            {"name": "Auth",           "description": "Authentication"},
            {"name": "Articles",       "description": "Article operations"},
            {"name": "Manuscripts",    "description": "Submit and track manuscripts"},
            {"name": "Volumes",        "description": "Volume and issue management"},
            {"name": "Editorial Board","description": "Editorial team"},
            {"name": "Contact",        "description": "Contact form"},
            {"name": "Join",           "description": "Apply as reviewer or editor"},
            {"name": "Certificate",    "description": "Publication certificates"},
            {"name": "Admin",          "description": "Admin dashboard (requires auth)"},
            {"name": "System",         "description": "Health checks"},
        ],
    }
    Swagger(app, config=swagger_config, template=swagger_template)

    # ── Extensions ─────────────────────────────────────────────────────────
    db.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)
    jwt.init_app(app)

    # ── CORS — allow all origins in dev, restrict in production ────────────
    # Allow multipart/form-data and Authorization headers explicitly
    CORS(app,
         origins=[
             os.getenv("FRONTEND_URL", "http://localhost:3000"),
             "http://localhost:5000",
         ],
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    )

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # ── Blueprints ─────────────────────────────────────────────────────────
    from app.routes.articles    import articles_bp
    from app.routes.manuscripts import manuscripts_bp
    from app.routes.editorial   import editorial_bp
    from app.routes.join        import join_bp
    from app.routes.contact     import contact_bp
    from app.routes.volumes     import volumes_bp
    from app.routes.certificate import certificate_bp
    from app.routes.admin       import admin_bp

    import sys as _sys, os as _os
    _sys.path.insert(0, _os.path.dirname(_os.path.dirname(__file__)))
    from routes_auth import auth_bp

    app.register_blueprint(articles_bp,    url_prefix="/api/articles")
    app.register_blueprint(manuscripts_bp, url_prefix="/api/manuscripts")
    app.register_blueprint(editorial_bp,   url_prefix="/api/editorial-board")
    app.register_blueprint(join_bp,        url_prefix="/api/join")
    app.register_blueprint(contact_bp,     url_prefix="/api/contact")
    app.register_blueprint(volumes_bp,     url_prefix="/api/volumes")
    app.register_blueprint(certificate_bp, url_prefix="/api/certificate")
    app.register_blueprint(admin_bp,       url_prefix="/api/admin")
    app.register_blueprint(auth_bp,        url_prefix="/api/auth")

    # ── JWT error handlers ─────────────────────────────────────────────────
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({"error": "Invalid token", "detail": str(error)}), 422

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({"error": "Authorization token required"}), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_data):
        return jsonify({"error": "Token has expired"}), 401

    # ── Root routes ────────────────────────────────────────────────────────
    @app.route("/")
    def index():
        return jsonify({
            "name": "IJTD API", "version": "1.0.0", "status": "running",
            "swagger_ui": "http://localhost:5000/apidocs/",
        })

    @app.route("/api/health")
    def health():
        """
        Health check endpoint
        ---
        tags:
          - System
        responses:
          200:
            description: API is healthy
        """
        return jsonify({
            "status": "ok",
            "message": "IJTD API is running",
            "timestamp": now_utc().isoformat(),
        })

    return app