import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_proposal_pdf(proposal_data: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=12
    )

    h2_style = ParagraphStyle(
        'H2Style',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#0EA5E9'),
        spaceAfter=8
    )

    normal_style = styles['Normal']

    # Header
    story.append(Paragraph("<b>MECH STREK - PROJECT PROPOSAL & CONTRACT</b>", title_style))
    story.append(Paragraph(f"<b>Proposal Title:</b> {proposal_data.get('title', 'Project Scope')}", h2_style))
    story.append(Paragraph(f"<b>Proposal ID:</b> {proposal_data.get('id', 'N/A')}", normal_style))
    story.append(Paragraph(f"<b>Client ID:</b> {proposal_data.get('client_id', 'N/A')}", normal_style))
    story.append(Paragraph(f"<b>Status:</b> {proposal_data.get('status', 'DRAFT')}", normal_style))
    story.append(Spacer(1, 16))

    # Scope / Deliverables
    story.append(Paragraph("<b>Scope of Deliverables</b>", h2_style))
    scope_items = proposal_data.get('scope_deliverables', [])
    if isinstance(scope_items, list) and scope_items:
        table_data = [["Deliverable", "Description", "Price (INR)"]]
        for item in scope_items:
            table_data.append([
                Paragraph(str(item.get('title', '')), normal_style),
                Paragraph(str(item.get('description', '')), normal_style),
                f"₹{item.get('price', 0):,}"
            ])
        t = Table(table_data, colWidths=[150, 270, 100])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ]))
        story.append(t)
    else:
        story.append(Paragraph("No specific itemized scope defined.", normal_style))

    story.append(Spacer(1, 16))
    total_val = proposal_data.get('total_amount', 0)
    story.append(Paragraph(f"<b>Total Investment: ₹{total_val:,} INR</b>", ParagraphStyle('Total', parent=title_style, fontSize=16)))
    
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
