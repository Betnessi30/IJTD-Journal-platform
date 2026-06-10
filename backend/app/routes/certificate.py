"""
Certificate Blueprint — /api/certificate
Generate and download publication certificates.
"""
from flask import Blueprint, jsonify, request, send_file
import io
from app.models import Manuscript, Article

certificate_bp = Blueprint("certificate", __name__)


@certificate_bp.route("", methods=["GET"])
def get_certificate():
    """
    Get certificate data for a published manuscript
    ---
    tags:
      - Certificate
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
        description: Certificate data
      404:
        description: No published manuscript found
    """
    email    = request.args.get("email", "").strip().lower()
    ms_num   = request.args.get("manuscript_number", "").strip()

    if not email:
        return jsonify({"error": "Email is required"}), 400

    q = Manuscript.query.filter(
        Manuscript.corresponding_email.ilike(email),
        Manuscript.status.in_(["accepted", "published"]),
    )
    if ms_num:
        q = q.filter(Manuscript.manuscript_number.ilike(ms_num))

    manuscripts = q.order_by(Manuscript.submitted_at.desc()).all()
    if not manuscripts:
        return jsonify({"error": "No published manuscript found for the provided details"}), 404

    ms = manuscripts[0]

    # Try to find a linked article
    article = Article.query.filter_by(
        title=ms.title, status="published"
    ).first()

    return jsonify({
        "manuscriptNumber": ms.manuscript_number,
        "title": ms.title,
        "authors": ms.authors,
        "publicationDate": (
            article.published_at.strftime("%B %d, %Y")
            if article and article.published_at
            else "In Press"
        ),
        "doi": article.doi if article else "Pending",
        "journal": "International Journal of Transformative Development",
    })


@certificate_bp.route("/download", methods=["GET"])
def download_certificate():
    """
    Download publication certificate as PDF
    ---
    tags:
      - Certificate
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
        description: PDF certificate file
      404:
        description: No published manuscript found
    """
    email  = request.args.get("email", "").strip().lower()
    ms_num = request.args.get("manuscript_number", "").strip()

    if not email:
        return jsonify({"error": "Email is required"}), 400

    q = Manuscript.query.filter(
        Manuscript.corresponding_email.ilike(email),
        Manuscript.status.in_(["accepted", "published"]),
    )
    if ms_num:
        q = q.filter(Manuscript.manuscript_number.ilike(ms_num))

    ms = q.order_by(Manuscript.submitted_at.desc()).first()
    if not ms:
        return jsonify({"error": "No published manuscript found"}), 404

    article = Article.query.filter_by(title=ms.title, status="published").first()

    try:
        from utils.pdf_generator import generate_certificate
        pdf_bytes = generate_certificate(ms, article)
        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"certificate_{ms.manuscript_number}.pdf",
        )
    except Exception as e:
        return jsonify({"error": f"PDF generation failed: {str(e)}"}), 500