"""
app/routes/manuscripts.py — Word documents only (.doc / .docx)

IJTD editorial workflow:
  • Authors submit in Word format (.doc or .docx) ONLY.
  • PDFs submitted by authors are NOT accepted.
  • The editor takes the accepted Word file, formats it using the IJTD
    editorial template, converts it to PDF, and uploads the formatted PDF
    via the admin dashboard before publication.
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

# Only Word documents accepted from authors
ALLOWED_EXTS = {"doc", "docx"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTS


def generate_manuscript_number():
    year = datetime.now(timezone.utc).year
    last = (
        Manuscript.query
        .filter(Manuscript.manuscript_number.like(f"IJTD-{year}-%"))
        .order_by(Manuscript.id.desc())
        .first()
    )
    seq = int(last.manuscript_number.split("-")[-1]) + 1 if last else 1
    return f"IJTD-{year}-{seq:05d}"


def send_confirmation(ms):
    """Send submission confirmation email — silently ignored if mail not configured."""
    try:
        frontend = os.getenv("FRONTEND_URL", "http://localhost:3000")
        msg = Message(
            subject    = f"[IJTD] Manuscript Received — {ms.manuscript_number}",
            recipients = [ms.corresponding_email],
            html       = f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px">
  <div style="background:#0B1E3D;padding:24px;border-radius:8px;text-align:center;margin-bottom:24px">
    <h1 style="color:#fff;margin:0;font-size:20px">International Journal of Transformative Development</h1>
    <p style="color:#93c5fd;margin:4px 0 0;font-size:13px">IJTD — ASAIE Publishing</p>
  </div>
  <div style="background:#fff;padding:28px;border-radius:8px;border:1px solid #e5e7eb">
    <h2 style="color:#0B1E3D;margin-top:0">Manuscript Received</h2>
    <p style="color:#374151">Dear Author,</p>
    <p style="color:#374151">
      Thank you for submitting your manuscript to IJTD. We have received your
      Word document and it is currently awaiting editorial assignment.
    </p>
    <div style="background:#eff6ff;border-left:4px solid #2563eb;padding:16px;border-radius:4px;margin:20px 0">
      <p style="margin:0;font-size:13px;color:#1e40af"><strong>Manuscript Number:</strong> {ms.manuscript_number}</p>
      <p style="margin:8px 0 0;font-size:13px;color:#1e40af"><strong>Title:</strong> {ms.title}</p>
      <p style="margin:8px 0 0;font-size:13px;color:#1e40af"><strong>Submitted:</strong> {ms.submitted_at.strftime('%B %d, %Y') if ms.submitted_at else 'Today'}</p>
    </div>
    <p style="color:#374151">
      You will receive our editorial decision within <strong>2–3 weeks</strong>.
      If your manuscript is accepted, you will receive payment instructions for
      the Article Processing Charge (APC) before publication.
    </p>
    <div style="text-align:center;margin:20px 0">
      <a href="{frontend}/track-manuscript"
         style="background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">
        Track Manuscript
      </a>
    </div>
    <p style="color:#6b7280;font-size:13px">
      Please quote your manuscript number <strong>{ms.manuscript_number}</strong> in all
      future correspondence with the editorial office.
    </p>
  </div>
  <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px">
    IJTD Editorial Office &bull; contact@ijtd.com &bull; Yaoundé, Cameroon
  </p>
</div>""",
        )
        mail.send(msg)
    except Exception as e:
        current_app.logger.warning(f"Confirmation email not sent (mail not configured?): {e}")


@manuscripts_bp.route("/submit", methods=["POST", "OPTIONS"])
def submit_manuscript():
    """
    Submit a new manuscript.
    Accepts: multipart/form-data
    File: .doc or .docx ONLY (Word format required by IJTD editorial process)
    """
    if request.method == "OPTIONS":
        return jsonify({}), 200

    data    = request.form
    missing = [
        f for f in ["manuscriptType", "title", "abstract", "keywords", "authors", "email"]
        if not data.get(f, "").strip()
    ]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    file_path = None
    if "file" in request.files:
        f = request.files["file"]
        if f and f.filename:
            if not allowed_file(f.filename):
                return jsonify({
                    "error": (
                        "Only Word documents (.doc or .docx) are accepted. "
                        "PDF files cannot be submitted — the editorial team will "
                        "produce a formatted PDF after acceptance."
                    )
                }), 400
            unique_fn = f"{uuid.uuid4().hex}_{secure_filename(f.filename)}"
            f.save(os.path.join(current_app.config["UPLOAD_FOLDER"], unique_fn))
            file_path = unique_fn

    if not file_path:
        return jsonify({
            "error": "A Word document (.doc or .docx) is required. Please attach your manuscript file."
        }), 400

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

    send_confirmation(ms)

    return jsonify({
        "message":           "Manuscript submitted successfully",
        "manuscript_number": ms.manuscript_number,
    }), 201


@manuscripts_bp.route("/track", methods=["GET"])
def track_manuscript():
    """
    Track manuscript status by corresponding author email.
    Optional: filter by manuscript_number.
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