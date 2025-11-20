import sys
import os
import copy
from urllib.parse import quote

from fastapi.testclient import TestClient

# Ensure we can import the app module from src/
ROOT = os.path.dirname(os.path.dirname(__file__))
SRC_PATH = os.path.join(ROOT, "src")
sys.path.insert(0, SRC_PATH)

from app import app, activities


client = TestClient(app)


def setup_function(func):
    # deep copy activities to restore later
    func._activities_backup = copy.deepcopy(activities)


def teardown_function(func):
    # restore the original activities state
    activities.clear()
    activities.update(func._activities_backup)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Expect some known activity to exist
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"]["participants"], list)


def test_signup_and_remove_participant():
    activity = "Chess Club"
    email = "test_student@example.com"

    # Sign up
    url = f"/activities/{quote(activity)}/signup?email={quote(email)}"
    resp = client.post(url)
    assert resp.status_code == 200
    assert f"Signed up {email}" in resp.json().get("message", "")

    # Verify participant added
    resp = client.get("/activities")
    participants = resp.json()[activity]["participants"]
    assert email in participants

    # Remove participant
    del_url = f"/activities/{quote(activity)}/participants?email={quote(email)}"
    resp = client.delete(del_url)
    assert resp.status_code == 200
    assert f"Removed {email}" in resp.json().get("message", "")

    # Verify removed
    resp = client.get("/activities")
    participants = resp.json()[activity]["participants"]
    assert email not in participants
