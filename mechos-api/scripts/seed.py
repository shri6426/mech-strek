import asyncio
import sys
import os

# Add parent directory to path to allow importing app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.models.portfolio import PortfolioProject
from app.models.cms import Service, FaqItem
from app.models.testimonial import Testimonial
from app.models.inquiry import Inquiry, InquiryStatus
from app.models.client_portal import ClientProject, Invoice, ProjectTimeline, ClientFile
from app.models.proposal import Proposal, ProposalScopeItem
from app.models.project_management import ProjectMilestone, ActivityFeed
from datetime import datetime, timedelta

async def seed_data():
    async with AsyncSessionLocal() as session:
        # 1. Seed Admin
        from app.core.config import settings
        email = settings.INITIAL_ADMIN_EMAIL
        password = settings.INITIAL_ADMIN_PASSWORD
        
        query = select(User).where(User.email == email)
        result = await session.execute(query)
        existing_user = result.scalars().first()

        if not existing_user:
            admin_user = User(
                email=email,
                hashed_password=get_password_hash(password),
                full_name="MechStrek Founder",
                role=UserRole.ADMIN,
                is_active=True
            )
            session.add(admin_user)
            await session.flush()
            print(f"Added admin user: {email}")
        else:
            admin_user = existing_user

        # Seed Client User
        client_email = "client@techstart.in"
        client_pwd = "ClientPassword123!"
        query = select(User).where(User.email == client_email)
        result = await session.execute(query)
        existing_client = result.scalars().first()

        if not existing_client:
            client_user = User(
                email=client_email,
                hashed_password=get_password_hash(client_pwd),
                full_name="Rahul Sharma (TechStart India)",
                role=UserRole.CLIENT,
                is_active=True
            )
            session.add(client_user)
            await session.flush()
            print(f"Added sample client user: {client_email}")
        else:
            client_user = existing_client

        # 2. Seed Services
        query = select(Service).limit(1)
        result = await session.execute(query)
        if not result.scalars().first():
            services = [
                Service(
                    title="Web Application Development",
                    description="Custom, high-performance web applications built with modern frameworks.",
                    price_label="From ₹4L",
                    published=True,
                    display_order=1
                ),
                Service(
                    title="Digital Transformation",
                    description="Modernize your legacy systems into scalable digital platforms.",
                    price_label="Custom",
                    published=True,
                    display_order=2
                )
            ]
            session.add_all(services)
            print("Added demo services")

        # 3. Seed Portfolio
        query = select(PortfolioProject).limit(1)
        result = await session.execute(query)
        if not result.scalars().first():
            projects = [
                PortfolioProject(
                    title="Global E-Commerce Platform",
                    category="Web App",
                    client="Reliance Retail",
                    year="2023",
                    description="A highly scalable e-commerce platform processing 10k+ orders daily.",
                    image_url="https://images.unsplash.com/photo-1661956602116-aa6865609028?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                    tags=["Next.js", "FastAPI", "PostgreSQL"],
                    published=True,
                    display_order=1
                )
            ]
            session.add_all(projects)
            print("Added demo portfolio project")

        # 4. Seed Testimonials
        query = select(Testimonial).limit(1)
        result = await session.execute(query)
        if not result.scalars().first():
            testimonials = [
                Testimonial(
                    quote="Mech Strek completely transformed our digital presence. The new web application is incredibly fast and intuitive.",
                    author="Rahul Sharma",
                    role="CEO",
                    company="TechStart India",
                    rating=5,
                    published=True,
                    display_order=1
                )
            ]
            session.add_all(testimonials)
            print("Added demo testimonial")

        # 5. Seed Inquiries
        query = select(Inquiry).limit(1)
        result = await session.execute(query)
        if not result.scalars().first():
            inquiries = [
                Inquiry(
                    name="Amit Patel",
                    business="Patel Logistics",
                    email="amit@patellogistics.in",
                    phone="+91 9876543210",
                    details="We need a custom dashboard to track our fleet across India. Real-time updates and driver management are key.",
                    budget="₹5L - ₹10L",
                    status=InquiryStatus.NEW,
                ),
                Inquiry(
                    name="Priya Sharma",
                    business="Boutique Fashions",
                    email="priya@boutiquefashions.com",
                    phone="+91 8765432109",
                    details="Looking to build an e-commerce platform for our premium clothing line. Needs to handle high traffic during festival sales.",
                    budget="₹3L - ₹6L",
                    status=InquiryStatus.IN_DISCUSSION,
                ),
                Inquiry(
                    name="Vikram Singh",
                    business="FinTech Solutions",
                    email="vikram.singh@fintechsol.in",
                    phone="+91 7654321098",
                    details="Require a secure web app for processing B2B payments and generating automated GST invoices.",
                    budget="₹10L+",
                    status=InquiryStatus.CONTACTED,
                )
            ]
            session.add_all(inquiries)
            print("Added demo lead inquiries")

        # 6. Seed Client Portal Data for sample client
        client_obj = client_user
        
        if client_obj:
            # Seed project
            q_proj = select(ClientProject).where(ClientProject.client_id == client_obj.id)
            res_proj = await session.execute(q_proj)
            sample_proj = res_proj.scalars().first()
            if not sample_proj:
                sample_proj = ClientProject(
                    client_id=client_obj.id,
                    name="TechStart India Enterprise App",
                    description="High-throughput digital portal with automated GST billing and real-time inventory management.",
                    status="In Progress",
                    progress_percent=80,
                    today_update="Designer completed Homepage."
                )
                session.add(sample_proj)
                await session.flush()

                # Seed Invoice
                sample_inv = Invoice(
                    client_id=client_obj.id,
                    project_id=sample_proj.id,
                    amount=450000.0,
                    status="Pending",
                    due_date=datetime.utcnow() + timedelta(days=15)
                )
                session.add(sample_inv)

                # Seed Proposal
                sample_prop = Proposal(
                    client_id=client_obj.id,
                    title="Enterprise Portal Modernization Scope",
                    notes="Itemized architectural roadmap for cloud transformation and real-time WebSocket messaging integration.",
                    total_amount=450000.0,
                    status="SENT"
                )
                session.add(sample_prop)
                await session.flush()

                scope1 = ProposalScopeItem(
                    proposal_id=sample_prop.id,
                    title="Frontend Next.js 14 App Router & Design System",
                    description="Custom glassmorphism dark theme UI, responsive navigation, and client portal dashboard.",
                    price=250000.0,
                    display_order=1
                )
                scope2 = ProposalScopeItem(
                    proposal_id=sample_prop.id,
                    title="FastAPI Async Backend & PostgreSQL Engine",
                    description="OAuth2 JWT authentication, WebSocket chat server, and automated billing engines.",
                    price=200000.0,
                    display_order=2
                )
                session.add_all([scope1, scope2])

            # Check Timelines / Milestones
            q_tm = select(ProjectTimeline).where(ProjectTimeline.project_id == sample_proj.id)
            if not (await session.execute(q_tm)).scalars().first():
                tm1 = ProjectTimeline(
                    project_id=sample_proj.id,
                    title="Design Sign-off & Wireframes",
                    description="Completed UI/UX wireframes and component architecture mockups.",
                    is_completed=True,
                    display_order=1
                )
                tm2 = ProjectTimeline(
                    project_id=sample_proj.id,
                    title="Frontend App Router Integration",
                    description="Building responsive React dashboard components and client portal layout.",
                    is_completed=True,
                    display_order=2
                )
                tm3 = ProjectTimeline(
                    project_id=sample_proj.id,
                    title="Backend REST API & Database Settlement",
                    description="FastAPI async endpoints, PostgreSQL schemas, and WebSocket chat rooms.",
                    is_completed=False,
                    display_order=3
                )
                tm4 = ProjectTimeline(
                    project_id=sample_proj.id,
                    title="UAT & Production Deployment",
                    description="Final security audit, Docker deployment, and live CI/CD pipeline verification.",
                    is_completed=False,
                    display_order=4
                )
                session.add_all([tm1, tm2, tm3, tm4])

            # Seed ProjectMilestones (Discovery, Design, Development, Testing, Deployment)
            q_ms = select(ProjectMilestone).where(ProjectMilestone.project_id == sample_proj.id)
            if not (await session.execute(q_ms)).scalars().first():
                ms_list = [
                    ProjectMilestone(project_id=sample_proj.id, title="Discovery", description="Requirement gathering and scoping.", is_completed=True, due_date=datetime.utcnow() - timedelta(days=20)),
                    ProjectMilestone(project_id=sample_proj.id, title="Design", description="UI/UX wireframes and prototype approvals.", is_completed=True, due_date=datetime.utcnow() - timedelta(days=10)),
                    ProjectMilestone(project_id=sample_proj.id, title="Development", description="Core coding, components, and API integration.", is_completed=False, due_date=datetime.utcnow() + timedelta(days=5)),
                    ProjectMilestone(project_id=sample_proj.id, title="Testing", description="QA validation, bug tracking, and client UAT.", is_completed=False, due_date=datetime.utcnow() + timedelta(days=12)),
                    ProjectMilestone(project_id=sample_proj.id, title="Deployment", description="Production release and launch checklist.", is_completed=False, due_date=datetime.utcnow() + timedelta(days=20))
                ]
                session.add_all(ms_list)

            # Seed ActivityFeed logs
            q_act = select(ActivityFeed).where(ActivityFeed.project_id == sample_proj.id)
            if not (await session.execute(q_act)).scalars().first():
                acts = [
                    ActivityFeed(project_id=sample_proj.id, user_id=client_obj.id, action="File Uploaded", details="Rahul Sharma uploaded logo.png"),
                    ActivityFeed(project_id=sample_proj.id, user_id=client_obj.id, action="Proposal Accepted", details="Rahul Sharma accepted proposal Enterprise Portal Modernization Scope"),
                    ActivityFeed(project_id=sample_proj.id, user_id=client_obj.id, action="Invoice Paid", details="Invoice INV-#101 paid via client portal"),
                    ActivityFeed(project_id=sample_proj.id, user_id=client_obj.id, action="Client Message", details="Rahul Sharma: 'Looks great! Can we start coding?'")
                ]
                session.add_all(acts)

            # Check Sample Deliverable File
            q_file = select(ClientFile).where(ClientFile.project_id == sample_proj.id)
            if not (await session.execute(q_file)).scalars().first():
                sample_file = ClientFile(
                    project_id=sample_proj.id,
                    uploader_id=admin_user.id if 'admin_user' in locals() else client_obj.id,
                    file_name="Architecture_Blueprint_v1.pdf",
                    file_url="http://localhost:8000/uploads/demo_blueprint.pdf",
                    file_type="pdf"
                )
                session.add(sample_file)

            print("Added sample client portal project, proposal, timelines, files, milestones, activities, and invoice records!")

        await session.commit()
        print("Database successfully seeded!")

if __name__ == "__main__":
    asyncio.run(seed_data())
