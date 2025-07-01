import uuid
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, Clockin, User, Project

DATABASE_URL = "postgresql://postgres:TuPassMySegura123!@db:5432/clockin_app"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_sample_clockin():
    db = SessionLocal()
    try:
        # Find the admin user
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            print("Admin user not found.")
            return

        # Create a dummy project if none exists
        project = db.query(Project).first()
        if not project:
            project = Project(
                id=uuid.uuid4(),
                name="Sample Project",
                description="A sample project for testing",
                state="CA",
                city="Los Angeles",
                street="Main St",
                street_number="123",
                postal_code="90001",
                location_lat=34.052235,
                location_long=-118.243683,
            )
            db.add(project)
            db.commit()
            db.refresh(project)
            print("Created a sample project.")

        # Create a sample clockin for the admin user
        clockin = Clockin(
            id=uuid.uuid4(),
            user_id=admin_user.id,
            project_id=project.id,
            start_time=datetime.utcnow() - timedelta(hours=2),
            end_time=datetime.utcnow() - timedelta(hours=1),
            status="completed",
            location_lat=34.052235,
            location_long=-118.243683,
            postal_code="90001",
            photo_path="/uploads/clockins/sample.jpg",
            approved=True,
        )
        db.add(clockin)
        db.commit()
        db.refresh(clockin)
        print(f"Sample clockin created for user {admin_user.username} and project {project.name}.")

        # Create a ProjectHistory entry
        from app.models import ProjectHistory, ProjectStatusEnum
        db.add(ProjectHistory(
            id=uuid.uuid4(),
            project_id=project.id,
            user_id=admin_user.id,
            clockin_id=clockin.id,
            date=datetime.utcnow(),
            status=ProjectStatusEnum.in_progress,
            start_date=project.start_date,
            end_date=project.end_date,
            state=project.state or "",
            city=project.city or "",
            street=project.street or "",
            street_number=project.street_number or "",
            postal_code=project.postal_code or ""
        ))
        db.commit()
        print("Sample ProjectHistory entry created.")

    except Exception as e:
        db.rollback()
        print(f"Error creating sample clockin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_clockin()
