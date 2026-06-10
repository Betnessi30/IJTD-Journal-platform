"""
utils/email_templates.py
Centralised email body + subject generators for all transactional emails.
"""


def manuscript_decision_email(manuscript, status, reviewer_comments=""):
    """Return (subject, body) for a manuscript decision notification."""
    status_labels = {
        "under_review":      "Under Review",
        "revision_required": "Revision Required",
        "accepted":          "Accepted for Publication",
        "rejected":          "Not Accepted",
        "published":         "Published",
    }
    label = status_labels.get(status, status.replace("_", " ").title())

    subject = f"IJTD — Manuscript Decision: {label} — {manuscript.manuscript_number}"

    if status == "accepted":
        action = (
            "We are pleased to inform you that your manuscript has been ACCEPTED for publication in IJTD.\n\n"
            "Our editorial team will contact you with further instructions regarding the publication process, "
            "including DOI assignment and the final proof."
        )
    elif status == "revision_required":
        action = (
            "After careful review, we request that you revise your manuscript based on the comments below "
            "before a final decision can be made. Please submit your revised manuscript within 3 weeks."
        )
    elif status == "rejected":
        action = (
            "After thorough review, we regret to inform you that your manuscript has not been accepted "
            "for publication in IJTD at this time. We appreciate your interest in our journal and "
            "encourage you to consider our feedback for future submissions."
        )
    elif status == "under_review":
        action = (
            "We are pleased to inform you that your manuscript has been assigned to a reviewer and is "
            "currently under review. You will receive our decision within 2-3 weeks."
        )
    else:
        action = f"Your manuscript status has been updated to: {label}."

    comments_section = ""
    if reviewer_comments:
        comments_section = f"\n\nREVIEWER COMMENTS:\n{'='*40}\n{reviewer_comments}\n{'='*40}"

    body = (
        f"Dear Author,\n\n"
        f"Re: Manuscript #{manuscript.manuscript_number}\n"
        f"Title: {manuscript.title}\n\n"
        f"{action}"
        f"{comments_section}\n\n"
        f"Thank you for choosing IJTD for your research.\n\n"
        f"Best regards,\nThe IJTD Editorial Team\n"
        f"contact@ijtd.com"
    )
    return subject, body


def review_invitation_email(manuscript, reviewer):
    """Return (subject, body) for a reviewer invitation."""
    subject = f"IJTD — Review Invitation: {manuscript.manuscript_number}"
    body = (
        f"Dear {reviewer.full_name},\n\n"
        f"You have been assigned to review the following manuscript submitted to IJTD:\n\n"
        f"Manuscript #: {manuscript.manuscript_number}\n"
        f"Title: {manuscript.title}\n"
        f"Type: {manuscript.manuscript_type}\n\n"
        f"Please log in to the IJTD admin portal to access the manuscript and submit your review.\n\n"
        f"We appreciate your valuable contribution to the peer-review process.\n\n"
        f"Best regards,\nThe IJTD Editorial Team\n"
        f"contact@ijtd.com"
    )
    return subject, body


def issue_alert_email(recipients, issue, volume, articles):
    """Return (subject, body) for a new issue notification."""
    subject = f"IJTD — New Issue Published: Volume {volume.number}, Issue {issue.number} ({issue.month} {volume.year})"
    article_list = "\n".join(
        f"  • {a.title} — {a.authors}" for a in articles[:10]
    )
    body = (
        f"Dear Reader,\n\n"
        f"A new issue of IJTD has been published:\n\n"
        f"Volume {volume.number}, Issue {issue.number} — {issue.month} {volume.year}\n\n"
        f"FEATURED ARTICLES:\n{article_list}\n\n"
        f"Read the full issue at: https://ijtd.com/current-issue\n\n"
        f"Best regards,\nThe IJTD Editorial Team"
    )
    return subject, body


def submission_confirmation_email(manuscript):
    """Return (subject, body) for a submission confirmation."""
    subject = f"Manuscript Received — {manuscript.manuscript_number}"
    body = (
        f"Dear Author,\n\n"
        f"Thank you for submitting your manuscript to IJTD.\n\n"
        f"Your manuscript number is: {manuscript.manuscript_number}\n"
        f"Title: {manuscript.title}\n\n"
        f"You will receive our initial decision within 2-3 weeks.\n"
        f"Track your manuscript status at: https://ijtd.com/track-manuscript\n\n"
        f"Best regards,\nThe IJTD Editorial Team\n"
        f"contact@ijtd.com"
    )
    return subject, body