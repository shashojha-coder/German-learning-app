"""
German Language Learning App - A1 to B2 Roadmap
Flask-based interactive web application
"""

from flask import Flask, render_template, jsonify, request
import json
import os

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key')

# Register admin blueprint (content management)
try:
    from applyai.admin.routes import admin_bp
    app.register_blueprint(admin_bp)
except Exception as e:
    print(f"[WARN] Admin interface not loaded: {e}")

# Load learning data (cached in memory)
DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "content.json")
_cached_data = None

def load_data():
    global _cached_data
    if _cached_data is None:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            _cached_data = json.load(f)
    return _cached_data


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
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({"error": "Invalid request"}), 400
    user_answer = str(payload.get("answer", ""))[:500].strip().lower()
    correct_answer = str(payload.get("correct", ""))[:500].strip().lower()
    # Allow minor punctuation differences
    user_clean = user_answer.rstrip(".!?").strip()
    correct_clean = correct_answer.rstrip(".!?").strip()
    is_correct = user_clean == correct_clean
    return jsonify({"correct": is_correct, "expected": correct_answer})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug, host="0.0.0.0", port=port)
