from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
import io

def generate_invoice_pdf(invoice, client_user, project_name=None) -> io.BytesIO:
    buffer = io.BytesIO()
    # Create document
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter, 
        rightMargin=40, 
        leftMargin=40, 
        topMargin=40, 
        bottomMargin=40
    )
    story = []
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Heading1'],
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#6d28d9'), # Violet theme matching MechOS
        spaceAfter=15
    )
    
    body_style = styles['Normal']
    
    # Header Info Table (Logo/Company Left, Invoice Info Right)
    header_data = [
        [
            Paragraph("<b>MechOS Core Services</b><br/>Pune, Maharashtra, India<br/>Email: contact@mechstrek.in", body_style),
            Paragraph(f"<b>INVOICE</b><br/>Invoice ID: INV-{invoice.id[:8]}<br/>Date: {invoice.created_at.strftime('%Y-%m-%d') if invoice.created_at else ''}<br/>Due Date: {invoice.due_date.strftime('%Y-%m-%d')}", body_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[260, 260])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ('PADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 20))
    
    # Client Info Block
    client_data = [
        [Paragraph(f"<b>Bill To:</b><br/>{client_user.full_name or 'Client'}<br/>{client_user.email}", body_style)]
    ]
    client_table = Table(client_data, colWidths=[520])
    client_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f3f4f6')),
        ('PADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(client_table)
    story.append(Spacer(1, 25))
    
    # Line Items Table
    items_data = [
        [Paragraph("<b>Description</b>", body_style), Paragraph("<b>Amount</b>", body_style)],
        [
            Paragraph(f"Development services for project: {project_name or 'General Development'}", body_style), 
            Paragraph(f"INR {invoice.amount:,.2f}", body_style)
        ],
        [
            Paragraph("<b>Total Amount Due:</b>", body_style), 
            Paragraph(f"<b>INR {invoice.amount:,.2f}</b>", body_style)
        ]
    ]
    items_table = Table(items_data, colWidths=[400, 120])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#6d28d9')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOTTOMPADDING', (0,0), (-1,0), 8),
        ('TOPPADDING', (0,0), (-1,0), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-2), 0.5, colors.HexColor('#e5e7eb')),
        ('LINEABOVE', (0,-1), (-1,-1), 1, colors.HexColor('#6d28d9')),
        ('TOPPADDING', (0,-1), (-1,-1), 10),
        ('BOTTOMPADDING', (0,-1), (-1,-1), 10),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 40))
    
    # Footer
    story.append(Paragraph("Thank you for your business!", ParagraphStyle('Footer', parent=body_style, alignment=1, textColor=colors.HexColor('#6b7280'))))
    
    doc.build(story)
    buffer.seek(0)
    return buffer
