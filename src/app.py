"""
High School Management System API

A super simple FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
import os
from pathlib import Path
import httpx
import base64

app = FastAPI(title="Mergington High School API",
              description="API for viewing and signing up for extracurricular activities")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")

# In-memory activity database
activities = {
    "Chess Club": {
        "description": "Learn strategies and compete in chess tournaments",
        "schedule": "Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 12,
        "participants": ["michael@mergington.edu", "daniel@mergington.edu"]
    },
    "Programming Class": {
        "description": "Learn programming fundamentals and build software projects",
        "schedule": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
        "max_participants": 20,
        "participants": ["emma@mergington.edu", "sophia@mergington.edu"]
    },
    "Gym Class": {
        "description": "Physical education and sports activities",
        "schedule": "Mondays, Wednesdays, Fridays, 2:00 PM - 3:00 PM",
        "max_participants": 30,
        "participants": ["john@mergington.edu", "olivia@mergington.edu"]
    }
}


@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


@app.get("/activities")
def get_activities():
    return activities


@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, email: str):
    """Sign up a student for an activity"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Add student
    activity["participants"].append(email)
    return {"message": f"Signed up {email} for {activity_name}"}


@app.get("/workitems/{item_id}")
async def get_work_item(item_id: int):
    """Fetch an Azure DevOps Bug or PBI work item by ID.

    Reads connection settings from environment variables:
      AZURE_DEVOPS_ORG_URL  – e.g. https://dev.azure.com/myorg
      AZURE_DEVOPS_PROJECT  – e.g. MyProject
      AZURE_DEVOPS_PAT      – Personal Access Token
    """
    org_url = os.environ.get("AZURE_DEVOPS_ORG_URL", "").rstrip("/")
    project = os.environ.get("AZURE_DEVOPS_PROJECT", "")
    pat = os.environ.get("AZURE_DEVOPS_PAT", "")

    if not org_url or not project or not pat:
        raise HTTPException(
            status_code=503,
            detail=(
                "Azure DevOps is not configured. "
                "Set AZURE_DEVOPS_ORG_URL, AZURE_DEVOPS_PROJECT, and AZURE_DEVOPS_PAT "
                "environment variables."
            ),
        )

    # Build the Azure DevOps REST API URL
    api_url = f"{org_url}/{project}/_apis/wit/workitems/{item_id}?api-version=7.0&$expand=all"

    # Basic auth: empty username + PAT
    credentials = base64.b64encode(f":{pat}".encode()).decode()
    headers = {"Authorization": f"Basic {credentials}"}

    async with httpx.AsyncClient() as client:
        response = await client.get(api_url, headers=headers)

    if response.status_code == 404:
        raise HTTPException(status_code=404, detail=f"Work item {item_id} not found")
    if response.status_code == 401:
        raise HTTPException(status_code=401, detail="Invalid Azure DevOps credentials")
    if not response.is_success:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Azure DevOps API error: {response.text}",
        )

    data = response.json()
    fields = data.get("fields", {})

    return {
        "id": data.get("id"),
        "url": data.get("url"),
        "type": fields.get("System.WorkItemType"),
        "title": fields.get("System.Title"),
        "state": fields.get("System.State"),
        "area_path": fields.get("System.AreaPath"),
        "iteration_path": fields.get("System.IterationPath"),
        "assigned_to": (fields.get("System.AssignedTo") or {}).get("displayName"),
        "created_by": (fields.get("System.CreatedBy") or {}).get("displayName"),
        "created_date": fields.get("System.CreatedDate"),
        "changed_date": fields.get("System.ChangedDate"),
        "priority": fields.get("Microsoft.VSTS.Common.Priority"),
        "severity": fields.get("Microsoft.VSTS.Common.Severity"),
        "description": fields.get("System.Description"),
        "repro_steps": fields.get("Microsoft.VSTS.TCM.ReproSteps"),
        "acceptance_criteria": fields.get("Microsoft.VSTS.Common.AcceptanceCriteria"),
        "tags": fields.get("System.Tags"),
    }
