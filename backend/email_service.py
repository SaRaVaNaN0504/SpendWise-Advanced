import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

EMAIL_ADDRESS = "saro.05.11.04@gmail.com"
EMAIL_PASSWORD = "avtvfboeizmnzeup"  # Gmail App Password

def send_email(to_email: str, subject: str, body: str):
    msg = MIMEMultipart()
    msg["From"] = EMAIL_ADDRESS
    msg["To"] = to_email
    msg["Subject"] = subject

    msg.attach(MIMEText(body, "plain"))

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.send_message(msg)



if __name__ == "__main__":
    send_email(
        to_email="your_personal_email@gmail.com",
        subject="SpendWise Email Test",
        body="""
Hello 👋

If you received this email, your SpendWise email notification system is working correctly.

– SpendWise Assistant
"""
    )
