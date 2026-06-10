"""
Manuscripts Blueprint — /api/manuscripts
"""
import os
import uuid
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request, current_app
from werkzeug.utils import secure_filename
from app import db, mail
from app.models import Manuscript
from flask_mail import Message

manuscripts_bp = Blueprint("manuscripts", __name__)

ALLOWED_EXTENSIONS = {"doc", "docx"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def generate_manuscript_number():
    """Generate unique manuscript number e.g. IJTD-2026-00042"""
    year = datetime.now(timezone.utc).year
    last = (
        Manuscript.query
        .filter(Manuscript.manuscript_number.like(f"IJTD-{year}-%"))
        .order_by(Manuscript.id.desc())
        .first()
    )
    seq = int(last.manuscript_number.split("-")[-1]) + 1 if last else 1
    return f"IJTD-{year}-{seq:05d}"


@manuscripts_bp.route("/submit", methods=["POST", "OPTIONS"])
def submit_manuscript():
    """
    Submit a new manuscript
    ---
    tags:
      - Manuscripts
    consumes:
      - multipart/form-data
    parameters:
      - name: manuscriptType
        in: formData
        type: string
        required: true
      - name: title
        in: formData
        type: string
        required: true
      - name: abstract
        in: formData
        type: string
        required: true
      - name: keywords
        in: formData
        type: string
        required: true
      - name: authors
        in: formData
        type: string
        required: true
      - name: email
        in: formData
        type: string
        required: true
      - name: file
        in: formData
        type: file
        required: false
    responses:
      201:
        description: Manuscript submitted successfully
      400:
        description: Missing required fields or invalid file
    """
    # Handle CORS preflight
    if request.method == "OPTIONS":
        return jsonify({}), 200

    data = request.form

    required = ["manuscriptType", "title", "abstract", "keywords", "authors", "email"]
    missing  = [f for f in required if not data.get(f, "").strip()]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    # Handle file upload (optional — authors can also email the file)
    file_path = None
    if "file" in request.files:
        f = request.files["file"]
        if f and f.filename:
            if not allowed_file(f.filename):
                return jsonify({"error": "Only .doc / .docx files are accepted"}), 400
            filename  = secure_filename(f.filename)
            unique_fn = f"{uuid.uuid4().hex}_{filename}"
            dest      = os.path.join(current_app.config["UPLOAD_FOLDER"], unique_fn)
            f.save(dest)
            file_path = unique_fn

    ms = Manuscript(
        manuscript_number   = generate_manuscript_number(),
        manuscript_type     = data["manuscriptType"],
        title               = data["title"],
        abstract            = data["abstract"],
        keywords            = data["keywords"],
        authors             = data["authors"],
        corresponding_email = data["email"].strip().lower(),
        file_path           = file_path,
        status              = "submitted",
    )
    db.session.add(ms)
    db.session.commit()

    # Confirmation email (best-effort — won't fail submission if mail is not configured)
    try:
        msg = Message(
            subject=f"Manuscript Received — {ms.manuscript_number}",
            recipients=[ms.corresponding_email],
            body=(
                f"Dear Author,\n\n"
                f"Thank you for submitting your manuscript to IJTD.\n\n"
                f"Your manuscript number is: {ms.manuscript_number}\n"
                f"Title: {ms.title}\n\n"
                f"You will receive our initial decision within 2-3 weeks.\n"
                f"Track your manuscript at: {os.getenv('FRONTEND_URL', 'http://localhost:3000')}/track-manuscript\n\n"
                f"Best regards,\nThe IJTD Editorial Team"
            ),
        )
        mail.send(msg)
    except Exception:
        pass

    return jsonify({
        "message":           "Manuscript submitted successfully",
        "manuscript_number": ms.manuscript_number,
    }), 201


@manuscripts_bp.route("/track", methods=["GET"])
def track_manuscript():
    """
    Track manuscript status by email (and optionally manuscript number)
    ---
    tags:
      - Manuscripts
    parameters:
      - name: email
        in: query
        type: string
        required: true
      - name: manuscript_number
        in: query
        type: string
        required: false
    responses:
      200:
        description: List of manuscripts
      404:
        description: No manuscripts found
    """
    email  = request.args.get("email", "").strip().lower()
    ms_num = request.args.get("manuscript_number", "").strip()

    if not email:
        return jsonify({"error": "Email is required"}), 400

    q = Manuscript.query.filter(Manuscript.corresponding_email.ilike(email))
    if ms_num:
        q = q.filter(Manuscript.manuscript_number.ilike(ms_num))

    manuscripts = q.order_by(Manuscript.submitted_at.desc()).all()

    if not manuscripts:
        return jsonify({"error": "No manuscripts found for the provided details"}), 404

    return jsonify([ms.to_dict() for ms in manuscripts])