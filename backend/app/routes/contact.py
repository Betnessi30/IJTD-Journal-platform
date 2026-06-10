"""
Contact Blueprint — /api/contact
"""
from flask import Blueprint, jsonify, request
from app import db, mail
from app.models import ContactMessage
from flask_mail import Message

contact_bp = Blueprint("contact", __name__)


@contact_bp.route("", methods=["POST"])
def send_message():
    """
    Send a contact message
    ---
    tags:
      - Contact
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - name
            - email
            - subject
            - message
          properties:
            name:
              type: string
              example: John Doe
            email:
              type: string
              example: john@example.com
            subject:
              type: string
              example: Question about publication
            message:
              type: string
              example: I have a question about submitting my manuscript...
    responses:
      201:
        description: Message sent successfully
      400:
        description: Missing required fields
    """
    data = request.get_json(silent=True) or {}

    required = ["name", "email", "subject", "message"]
    missing = [f for f in required if not data.get(f, "").strip()]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    cm = ContactMessage(
        name=data["name"],
        email=data["email"],
        subject=data["subject"],
        message=data["message"],
    )
    db.session.add(cm)
    db.session.commit()

    # Auto-reply to sender
    try:
        msg = Message(
            subject=f"Re: {cm.subject} — IJTD",
            recipients=[cm.email],
            body=(
                f"Dear {cm.name},\n\n"
                f"Thank you for contacting IJTD.\n"
                f"We have received your message and will respond within 2 business days.\n\n"
                f"Best regards,\nThe IJTD Team"
            ),
        )
        mail.send(msg)
    except Exception:
        pass

    return jsonify({"message": "Message sent successfully"}), 201