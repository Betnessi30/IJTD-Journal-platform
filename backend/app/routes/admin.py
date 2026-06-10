"""
Admin Blueprint — /api/admin
All routes require admin or editor role.

FIX: Import auth helpers after ensuring sys.path includes backend root.
"""
import os
import sys

# Ensure backend root is on path so "auth" and "utils" modules can be imported
_backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _backend_root not in sys.path:
    sys.path.insert(0, _backend_root)

from flask import Blueprint, jsonify, request
from app import db, mail
from app.models import User, Role, Manuscript, Article, Issue, Volume, JoinApplication, ContactMessage
from auth import admin_required, editor_required
from utils.email_templates import manuscript_decision_email, review_invitation_email
from flask_mail import Message

admin_bp = Blueprint("admin", __name__)


# ── Dashboard stats ────────────────────────────────────────────────────────────

@admin_bp.route("/stats", methods=["GET"])
@editor_required
def get_stats():
    """
    Dashboard overview statistics
    ---
    tags:
      - Admin
    responses:
      200:
        description: Dashboard statistics
    """
    try:
        total_manuscripts  = Manuscript.query.count()
        submitted          = Manuscript.query.filter_by(status="submitted").count()
        under_review       = Manuscript.query.filter_by(status="under_review").count()
        accepted           = Manuscript.query.filter_by(status="accepted").count()
        rejected           = Manuscript.query.filter_by(status="rejected").count()
        published_articles = Article.query.filter_by(status="published").count()
        total_users        = User.query.count()
        pending_apps       = JoinApplication.query.filter_by(status="pending").count()
        unread_messages    = ContactMessage.query.filter_by(is_read=False).count()

        return jsonify({
            "manuscripts": {
                "total":        total_manuscripts,
                "submitted":    submitted,
                "under_review": under_review,
                "accepted":     accepted,
                "rejected":     rejected,
            },
            "articles":     {"published": published_articles},
            "users":        {"total": total_users},
            "applications": {"pending": pending_apps},
            "messages":     {"unread": unread_messages},
        })
    except Exception as e:
        return jsonify({"error": f"Stats query failed: {str(e)}"}), 500


# ── Manuscript management ──────────────────────────────────────────────────────

@admin_bp.route("/manuscripts", methods=["GET"])
@editor_required
def list_manuscripts():
    """List all manuscripts with optional status filter."""
    status   = request.args.get("status")
    page     = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)

    q = Manuscript.query
    if status:
        q = q.filter_by(status=status)
    q = q.order_by(Manuscript.submitted_at.desc())
    pagination = q.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "manuscripts":  [m.to_dict() for m in pagination.items],
        "total":        pagination.total,
        "pages":        pagination.pages,
        "current_page": page,
    })


@admin_bp.route("/manuscripts/<int:ms_id>", methods=["GET"])
@editor_required
def get_manuscript(ms_id):
    """Get single manuscript details."""
    ms = Manuscript.query.get_or_404(ms_id)
    return jsonify(ms.to_dict())


@admin_bp.route("/manuscripts/<int:ms_id>/status", methods=["PUT"])
@editor_required
def update_manuscript_status(ms_id):
    """Update manuscript status and optionally send decision email."""
    ms   = Manuscript.query.get_or_404(ms_id)
    data = request.get_json(silent=True) or {}

    new_status = data.get("status")
    comments   = data.get("reviewer_comments", "")
    send_email = data.get("send_email", True)

    valid_statuses = ["submitted", "under_review", "revision_required", "accepted", "rejected"]
    if new_status not in valid_statuses:
        return jsonify({"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}), 400

    ms.status = new_status
    if comments:
        ms.reviewer_comments = comments
    db.session.commit()

    if send_email:
        try:
            subject, body = manuscript_decision_email(ms, new_status, comments)
            msg = Message(subject=subject, recipients=[ms.corresponding_email], body=body)
            mail.send(msg)
        except Exception:
            pass  # Don't fail the status update if email fails

    return jsonify({"message": "Status updated", "manuscript": ms.to_dict()})


@admin_bp.route("/manuscripts/<int:ms_id>/assign-reviewer", methods=["PUT"])
@editor_required
def assign_reviewer(ms_id):
    """Assign a reviewer to a manuscript."""
    ms   = Manuscript.query.get_or_404(ms_id)
    data = request.get_json(silent=True) or {}
    reviewer_id = data.get("reviewer_id")

    reviewer = User.query.get(reviewer_id)
    if not reviewer or reviewer.role.name not in ("reviewer", "editor", "admin"):
        return jsonify({"error": "Invalid reviewer"}), 400

    ms.assigned_reviewer_id = reviewer_id
    if ms.status == "submitted":
        ms.status = "under_review"
    db.session.commit()

    try:
        subject, body = review_invitation_email(ms, reviewer)
        msg = Message(subject=subject, recipients=[reviewer.email], body=body)
        mail.send(msg)
    except Exception:
        pass

    return jsonify({"message": "Reviewer assigned", "manuscript": ms.to_dict()})


@admin_bp.route("/manuscripts/<int:ms_id>/publish", methods=["POST"])
@editor_required
def publish_manuscript(ms_id):
    """Publish accepted manuscript as an Article in a specific issue."""
    ms   = Manuscript.query.get_or_404(ms_id)
    data = request.get_json(silent=True) or {}

    issue_id = data.get("issue_id")
    doi      = data.get("doi", ms.manuscript_number)
    pdf_url  = data.get("pdf_url", "")
    category = data.get("category", ms.manuscript_type or "Research Article")

    if ms.status != "accepted":
        return jsonify({"error": "Only accepted manuscripts can be published"}), 400
    if not issue_id:
        return jsonify({"error": "issue_id is required"}), 400

    from datetime import datetime, timezone
    article = Article(
        issue_id     = issue_id,
        title        = ms.title,
        abstract     = ms.abstract,
        keywords     = ms.keywords,
        authors      = ms.authors,
        category     = category,
        doi          = doi,
        pdf_url      = pdf_url,
        status       = "published",
        published_at = datetime.now(timezone.utc),
    )
    db.session.add(article)
    ms.status = "published"
    db.session.commit()

    return jsonify({"message": "Article published", "article_id": article.id}), 201


# ── User management ────────────────────────────────────────────────────────────

@admin_bp.route("/users", methods=["GET"])
@admin_required
def list_users():
    """List all users, optionally filtered by role."""
    role_filter = request.args.get("role")
    q = User.query
    if role_filter:
        q = q.join(Role).filter(Role.name == role_filter)
    users = q.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users])


@admin_bp.route("/users", methods=["POST"])
@admin_required
def create_user():
    """Create a new user."""
    data    = request.get_json(silent=True) or {}
    required = ["email", "full_name", "password", "role"]
    missing  = [f for f in required if not data.get(f, "").strip()]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    if User.query.filter_by(email=data["email"].lower()).first():
        return jsonify({"error": "Email already in use"}), 409

    role = Role.query.filter_by(name=data["role"]).first()
    if not role:
        return jsonify({"error": f"Invalid role: {data['role']}"}), 400

    user = User(
        email       = data["email"].strip().lower(),
        full_name   = data["full_name"].strip(),
        role_id     = role.id,
        institution = data.get("institution", ""),
        country     = data.get("country", ""),
        is_active   = True,
    )
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


@admin_bp.route("/users/<int:user_id>", methods=["PUT"])
@admin_required
def update_user(user_id):
    """Update user details."""
    user = User.query.get_or_404(user_id)
    data = request.get_json(silent=True) or {}

    if "full_name"   in data: user.full_name   = data["full_name"].strip()
    if "institution" in data: user.institution = data["institution"]
    if "country"     in data: user.country     = data["country"]
    if "is_active"   in data: user.is_active   = bool(data["is_active"])
    if "role" in data:
        role = Role.query.filter_by(name=data["role"]).first()
        if not role:
            return jsonify({"error": f"Invalid role: {data['role']}"}), 400
        user.role_id = role.id
    if "password" in data and data["password"]:
        if len(data["password"]) < 8:
            return jsonify({"error": "Password must be at least 8 characters"}), 400
        user.set_password(data["password"])

    db.session.commit()
    return jsonify(user.to_dict())


@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@admin_required
def delete_user(user_id):
    """Deactivate (soft-delete) a user."""
    user = User.query.get_or_404(user_id)
    user.is_active = False
    db.session.commit()
    return jsonify({"message": "User deactivated"})


# ── Issue / Volume management ──────────────────────────────────────────────────

@admin_bp.route("/issues", methods=["GET"])
@editor_required
def list_issues():
    """List all issues across all volumes."""
    issues = Issue.query.join(Volume).order_by(
        Volume.number.desc(), Issue.number.desc()
    ).all()
    result = []
    for issue in issues:
        d = issue.to_dict()
        d["volume_number"]  = issue.volume.number
        d["volume_year"]    = issue.volume.year
        d["article_count"]  = Article.query.filter_by(
            issue_id=issue.id, status="published"
        ).count()
        result.append(d)
    return jsonify(result)


@admin_bp.route("/issues/<int:issue_id>/articles", methods=["GET"])
@editor_required
def issue_articles(issue_id):
    """List all articles in an issue."""
    articles = Article.query.filter_by(issue_id=issue_id).order_by(
        Article.published_at.desc()
    ).all()
    return jsonify([a.to_dict(detail=True) for a in articles])


# ── Join Applications ──────────────────────────────────────────────────────────

@admin_bp.route("/applications", methods=["GET"])
@editor_required
def list_applications():
    """List join applications, filtered by status."""
    status = request.args.get("status", "pending")
    q      = JoinApplication.query
    if status != "all":
        q = q.filter_by(status=status)
    apps = q.order_by(JoinApplication.submitted_at.desc()).all()
    return jsonify([a.to_dict() for a in apps])


@admin_bp.route("/applications/<int:app_id>/status", methods=["PUT"])
@editor_required
def update_application(app_id):
    """Approve or reject a join application."""
    app_record = JoinApplication.query.get_or_404(app_id)
    data       = request.get_json(silent=True) or {}
    new_status = data.get("status")

    if new_status not in ("approved", "rejected"):
        return jsonify({"error": "Status must be 'approved' or 'rejected'"}), 400

    app_record.status = new_status
    db.session.commit()

    try:
        verdict = "approved" if new_status == "approved" else "not approved at this time"
        msg = Message(
            subject  = f"IJTD — Your {app_record.application_type.title()} Application Update",
            recipients=[app_record.email],
            body=(
                f"Dear {app_record.full_name},\n\n"
                f"We have reviewed your application to join IJTD as a "
                f"{app_record.application_type} and it has been {verdict}.\n\n"
                f"Best regards,\nThe IJTD Editorial Team"
            ),
        )
        mail.send(msg)
    except Exception:
        pass

    return jsonify({"message": f"Application {new_status}", "application": app_record.to_dict()})


# ── Contact messages ───────────────────────────────────────────────────────────

@admin_bp.route("/messages", methods=["GET"])
@editor_required
def list_messages():
    """List contact messages."""
    unread_only = request.args.get("unread") == "true"
    q = ContactMessage.query
    if unread_only:
        q = q.filter_by(is_read=False)
    messages = q.order_by(ContactMessage.created_at.desc()).all()
    return jsonify([m.to_dict() for m in messages])


@admin_bp.route("/messages/<int:msg_id>/read", methods=["PUT"])
@editor_required
def mark_read(msg_id):
    """Mark a contact message as read."""
    msg = ContactMessage.query.get_or_404(msg_id)
    msg.is_read = True
    db.session.commit()
    return jsonify({"message": "Marked as read"})


# ── Reviewers list ─────────────────────────────────────────────────────────────

@admin_bp.route("/reviewers", methods=["GET"])
@editor_required
def list_reviewers():
    """List active reviewers for manuscript assignment."""
    reviewers = (
        User.query
        .join(Role)
        .filter(Role.name.in_(["reviewer", "editor", "admin"]), User.is_active == True)
        .order_by(User.full_name.asc())
        .all()
    )
    return jsonify([u.to_dict() for u in reviewers])