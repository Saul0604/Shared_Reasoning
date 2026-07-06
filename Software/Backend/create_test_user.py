import os
import sys

# Ensure app module can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, select
from app.core.database import engine, create_db_and_tables
from app.models.user import User
from app.core.security import get_password_hash

def create_test_user():
    create_db_and_tables()
    
    email = "test@example.com"
    password = "password123"
    full_name = "Test User"
    
    with Session(engine) as session:
        # Check if user already exists
        statement = select(User).where(User.email == email)
        existing_user = session.exec(statement).first()
        if existing_user:
            print(f"User {email} already exists!")
            return
        
        hashed_password = get_password_hash(password)
        db_user = User(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name
        )
        session.add(db_user)
        session.commit()
        session.refresh(db_user)
        print(f"Successfully created user:\nEmail: {email}\nPassword: {password}")

if __name__ == "__main__":
    create_test_user()
