import resend
from app.core.config import settings

if settings.RESEND_API_KEY:
    resend.api_key = settings.RESEND_API_KEY

def send_invite_email(email: str, name: str, magic_link: str) -> None:
    if not settings.RESEND_API_KEY:
        print("RESEND_API_KEY not configured.")
        print(f"Invite email for {name} ({email}) - Magic Link: {magic_link}")
        return

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're invited to MechOS</title>
    <style>
        body {{
            margin: 0;
            padding: 0;
            background-color: #080808;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #d4d4d8;
        }}
        .container {{
            max-width: 600px;
            margin: 40px auto;
            padding: 40px;
            background-color: #111111;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            text-align: center;
        }}
        .logo-container {{
            display: inline-block;
            margin-bottom: 32px;
        }}
        .logo {{
            width: 40px;
            height: 40px;
            line-height: 40px;
            background: linear-gradient(135deg, #7c3aed, #4f46e5);
            border-radius: 12px;
            color: #ffffff;
            font-weight: bold;
            font-size: 20px;
            display: inline-block;
            text-align: center;
        }}
        .logo-text {{
            font-size: 20px;
            font-weight: bold;
            color: #ffffff;
            display: inline-block;
            vertical-align: middle;
            margin-left: 10px;
        }}
        h2 {{
            color: #ffffff;
            font-size: 24px;
            font-weight: 600;
            margin-top: 0;
            margin-bottom: 16px;
        }}
        p {{
            font-size: 15px;
            line-height: 1.6;
            color: #a1a1aa;
            margin-bottom: 24px;
        }}
        .cta-button {{
            display: inline-block;
            background: linear-gradient(90deg, #7c3aed, #6366f1);
            color: #ffffff !important;
            font-weight: 600;
            font-size: 14px;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 12px;
            margin-bottom: 32px;
        }}
        .divider {{
            height: 1px;
            background-color: rgba(255, 255, 255, 0.08);
            margin: 32px 0;
        }}
        .footer {{
            font-size: 12px;
            color: #52525b;
            line-height: 1.5;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-container">
            <div class="logo">M</div>
            <div class="logo-text">MechOS Studio</div>
        </div>
        
        <h2>Welcome to your workspace, {name}</h2>
        <p>You have been invited to access your client portal. Click the button below to sign in instantly without password entry:</p>
        
        <a href="{magic_link}" class="cta-button">Access MechOS</a>
        
        <p style="font-size: 13px; color: #71717a; margin-top: 0;">This link is secure and will expire in 24 hours.</p>
        
        <div class="divider"></div>
        
        <div class="footer">
            <p style="margin: 0 0 8px 0;">Sent by MechOS Studio. Please do not share this link with anyone else.</p>
            <p style="margin: 0;">&copy; 2026 MechStrek Agency. All rights reserved.</p>
        </div>
    </div>
</body>
</html>"""

    resend.Emails.send({
        "from": settings.EMAIL_FROM,
        "to": [email],
        "subject": "⚡ Invitation to your Client Portal - MechOS",
        "html": html_content
    })
