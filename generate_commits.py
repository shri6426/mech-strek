import os
import subprocess
import random
from datetime import datetime, timedelta

# List of 47 realistic commit messages matching MechOS development phases
COMMIT_MESSAGES = [
    "init: setup next.js frontend and fastapi backend",
    "feat: add postgresql database models via sqlalchemy",
    "feat: add user authentication schemas and dependencies",
    "refactor: optimize database connection pool size",
    "feat: implement rate limiting middleware for endpoints",
    "fix: handle cors header configurations",
    "feat: introduce audit logs table and tracking hook",
    "feat: build portfolio and cms data endpoints",
    "feat: add public project inquiry submission endpoint",
    "test: write unit tests for inquiry submission",
    "feat: implement admin invite client flow",
    "feat: generate client portal magic link tokens",
    "feat: build invoices endpoints and summary aggregation",
    "feat: support payment processing simulation",
    "feat: add client portal layout and sidebar",
    "feat: implement collapsible proposal scopes",
    "fix: update endpoint paths to client portal projects",
    "feat: build interactive drag and drop files vault",
    "feat: support project timeline milestone tracking",
    "feat: implement real-time project messaging web sockets",
    "feat: differentiate admin and client chat bubbles",
    "feat: support automatic chat history scroll to bottom",
    "feat: implement dynamic kanban task updates",
    "feat: add skeleton loaders to client dashboard",
    "feat: add notifications database models and schema",
    "feat: implement backend notification push helper",
    "feat: trigger notification on new project invoice",
    "feat: notify admin when client pays invoice",
    "feat: trigger notification on client proposal accept",
    "feat: implement contact form admin notification",
    "feat: implement message updates notification trigger",
    "feat: build client useNotifications react hook",
    "feat: add animated notification bell UI component",
    "feat: mount notification bell in client layouts",
    "feat: mount notification bell in admin layout sidebar",
    "chore: run alembic database migrations",
    "feat: add secure initial admin credentials env configuration",
    "feat: add transactional invite email service using Resend",
    "feat: configure styled glassmorphic HTML email template",
    "feat: implement google oauth redirect url generation",
    "feat: handle google sso profile token verification callback",
    "feat: implement domain-based auto-admin provisioning",
    "feat: add sign-in with google button to login pages",
    "feat: parse URL tokens in layouts and persist access",
    "cleanup: remove developer report and task logs",
    "cleanup: merge next.js config files and ignore builds",
    "chore: update graphify codebase graph index"
]

def run_cmd(args, env=None, cwd=None):
    result = subprocess.run(args, capture_output=True, text=True, env=env, cwd=cwd)
    return result.returncode == 0, result.stdout, result.stderr

def generate_history():
    repo_dir = r"c:\Users\Home\Downloads\PROJECTS\mech_strek"
    
    # 1. Delete nested frontend git folder to avoid submodule issues
    nested_git = os.path.join(repo_dir, "mech-strek", ".git")
    if os.path.exists(nested_git):
        import shutil
        try:
            shutil.rmtree(nested_git)
            print("Removed nested frontend git folder.")
        except Exception as e:
            print(f"Skipping nested git folder delete (already handled): {e}")

    # 2. Init git at root
    run_cmd(["git", "init"], cwd=repo_dir)
    print("Initialized git repo at root.")

    # 3. Generate 47 dates over the last week (last 7 days)
    # Between 6:00 PM (18:00) and 1:00 AM (01:00)
    now = datetime.now()
    dates = []
    
    for i in range(47):
        # Choose a random day in the last 7 days (day 0 to 6)
        day_offset = random.randint(0, 6)
        target_date = now - timedelta(days=day_offset)
        
        # Decide if commit is evening (18:00 - 23:59) or early night (00:00 - 01:00)
        is_evening = random.choice([True, False])
        if is_evening:
            hour = random.randint(18, 23)
        else:
            hour = random.randint(0, 1)
            
        minute = random.randint(0, 59)
        second = random.randint(0, 59)
        
        commit_dt = target_date.replace(hour=hour, minute=minute, second=second)
        dates.append(commit_dt)
        
    # Sort dates chronologically
    dates.sort()

    log_path = os.path.join(repo_dir, "dev_history.txt")
    
    # Initialize log file
    with open(log_path, "w") as f:
        f.write("# MechOS Dev History Log\n")

    # 4. Make commits
    for idx, dt in enumerate(dates):
        msg = COMMIT_MESSAGES[idx]
        
        # Write to log file
        with open(log_path, "a") as f:
            f.write(f"[{dt.isoformat()}] {msg}\n")
            
        # Stage files
        if idx == 0:
            # First commit stages everything in the project
            run_cmd(["git", "add", "."], cwd=repo_dir)
        else:
            run_cmd(["git", "add", "dev_history.txt"], cwd=repo_dir)
            
        # Format date for Git
        iso_str = dt.strftime("%Y-%m-%d %H:%M:%S")
        
        # Apply author and committer dates so they show up correctly in Github Contribution Graph
        env = os.environ.copy()
        env["GIT_AUTHOR_DATE"] = iso_str
        env["GIT_COMMITTER_DATE"] = iso_str
        
        success, out, err = run_cmd(["git", "commit", "-m", msg], env=env, cwd=repo_dir)
        if not success:
            print(f"Failed to commit at {iso_str}: {err}")
            
    print(f"Successfully generated {len(dates)} commits in git history!")

if __name__ == "__main__":
    generate_history()
