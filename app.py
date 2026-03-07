"""
German Language Learning App - A1 to B2 Roadmap
Flask-based interactive web application
"""

from flask import Flask, render_template, jsonify, request
import json
import os

app = Flask(__name__)

# Load learning data
DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "content.json")

def load_data():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@app.route("/")
def index():
    data = load_data()
    return render_template("index.html", levels=data["levels"])


@app.route("/vocab/<level>")
def vocab(level):
    data = load_data()
    level_data = next((l for l in data["levels"] if l["id"] == level), None)
    if not level_data:
        return "Level not found", 404
    return render_template("vocab.html", level=level_data, all_levels=data["levels"])


@app.route("/sentences/<level>")
def sentences(level):
    data = load_data()
    level_data = next((l for l in data["levels"] if l["id"] == level), None)
    if not level_data:
        return "Level not found", 404
    return render_template("sentences.html", level=level_data, all_levels=data["levels"])


@app.route("/api/check-sentence", methods=["POST"])
def check_sentence():
    """API endpoint to check sentence answers."""
    payload = request.get_json()
    user_answer = payload.get("answer", "").strip().lower()
    correct_answer = payload.get("correct", "").strip().lower()
    # Allow minor punctuation differences
    user_clean = user_answer.rstrip(".!?").strip()
    correct_clean = correct_answer.rstrip(".!?").strip()
    is_correct = user_clean == correct_clean
    return jsonify({"correct": is_correct, "expected": correct_answer})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(debug=True, host="0.0.0.0", port=port)
