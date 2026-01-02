from datetime import date, timedelta
from database import db
from email_service import send_email

def process_bill_reminders():
    connection = db.get_connection()
    cursor = connection.cursor()
    today = date.today()

    cursor.execute("""
        SELECT 
            b.id,
            b.bill_name,
            b.amount,
            b.due_date,
            b.reminder_days,
            b.last_reminder_sent,
            u.email
        FROM bills b
        JOIN users u ON b.user_id = u.id
        WHERE b.status != 'PAID'
    """)

    bills = cursor.fetchall()

    for bill in bills:
        reminder_date = bill["due_date"] - timedelta(days=bill["reminder_days"])

        # Send only if today >= reminder date
        if today >= reminder_date:

            # Avoid duplicate mail on same day
            if bill["last_reminder_sent"] == today:
                continue

            subject = f"⏰ Bill Reminder: {bill['bill_name']}"
            body = f"""
Hello,

This is a friendly reminder for your bill.

Bill Name : {bill['bill_name']}
Amount    : ₹{bill['amount']}
Due Date  : {bill['due_date']}

Please ensure timely payment to avoid penalties.

– SpendWise
"""

            send_email(bill["email"], subject, body)

            cursor.execute(
                "UPDATE bills SET last_reminder_sent = ? WHERE id = ?",
                (today, bill["id"])
            )

    connection.commit()
    cursor.close()
    connection.close()
