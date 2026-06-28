import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_database():
    # Try with user 'postgres' and password 'admin' first (most common default)
    credentials_to_test = [
        ("postgres", "admin"),
        ("postgres", "postgres"),
        ("admin", "admin")
    ]
    
    connected = False
    for user, password in credentials_to_test:
        try:
            print(f"Trying to connect with user: {user}...")
            # Connect to the default 'postgres' database to issue the CREATE DATABASE command
            conn = psycopg2.connect(
                dbname='postgres',
                user=user,
                password=password,
                host='localhost',
                port='5432'
            )
            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            cur = conn.cursor()
            
            print(f"Connected successfully with user '{user}'. Creating mechos_db...")
            try:
                cur.execute('CREATE DATABASE mechos_db')
                print("Database 'mechos_db' created successfully.")
            except psycopg2.errors.DuplicateDatabase:
                print("Database 'mechos_db' already exists.")
            
            cur.close()
            conn.close()
            connected = True
            
            # If we connected with a user other than 'admin', we should update the .env file
            if user != "admin":
                print(f"\nUPDATING .env FILE: Your actual PostgreSQL username is '{user}'.")
                with open(".env", "r") as f:
                    content = f.read()
                
                content = content.replace("POSTGRES_USER=admin", f"POSTGRES_USER={user}")
                content = content.replace("postgresql+asyncpg://admin:admin", f"postgresql+asyncpg://{user}:{password}")
                
                with open(".env", "w") as f:
                    f.write(content)
                print("Updated .env file with correct credentials.")
                
            break
        except psycopg2.OperationalError as e:
            print(f"Failed with user {user}: {e}")
            
    if not connected:
        print("\nCould not connect to PostgreSQL with any of the tested credentials.")
        print("Please verify your PostgreSQL username and password in pgAdmin.")

if __name__ == "__main__":
    create_database()
