import getpass

from sqlalchemy import select

import app.models  # noqa: F401  (registers the models)
from app.core.security import hash_password
from app.db.database import Base, SessionLocal, engine
from app.models.user import User


def main():
    Base.metadata.create_all(bind=engine)

    full_name = input("Full name: ").strip()
    email = input("Email: ").strip().lower()
    password = getpass.getpass("Password (min 8 characters): ")
    confirm = getpass.getpass("Confirm password: ")

    if len(full_name) < 2 or "@" not in email:
        print("Invalid name or email.")
        return
    if len(password) < 8 or password != confirm:
        print("Passwords must match and have at least 8 characters.")
        return

    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))
        if user is not None:
            user.role = "admin"
            user.is_active = True
            print(f"Existing user {email} is now an admin.")
        else:
            db.add(
                User(
                    full_name=full_name,
                    email=email,
                    hashed_password=hash_password(password),
                    role="admin",
                )
            )
            print(f"Admin {email} created.")
        db.commit()


if __name__ == "__main__":
    main()