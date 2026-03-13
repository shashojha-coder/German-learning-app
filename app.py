"""
German Language Learning App - A1 to B2 Roadmap
Flask-based interactive web application
"""


from flask import Flask, render_template, jsonify, request
import json
import os
import re
import unicodedata

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key')

# Load learning data (cached in memory)
DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "content.json")
_cached_data = None

def load_datita():
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
    # Merge all vocab sections into one
    merged_words = []
    for sec in level_data.get("vocab_sections", []):
        merged_words.extend(sec.get("words", []))
    merged_section = {
        "id": "all_vocab",
        "title": "All Vocabulary",
        "words": merged_words
    }
    # For adjective exercises, pass a flag or extra data if needed (handled in template/js)
    level_data["vocab_sections"] = [merged_section]
    return render_template("vocab.html", level=level_data, all_levels=data["levels"])


@app.route("/sentences/<level>")
def sentences(level):
    data = load_data()
    level_data = next((l for l in data["levels"] if l["id"] == level), None)
    if not level_data:
        return "Level not found", 404
    return render_template("sentences.html", level=level_data, all_levels=data["levels"])



# Robust normalization for German sentence comparison
def normalize_text(text):
    """
    Normalize German text for comparison.
    - Convert to lowercase
    - Remove accents
    - Normalize whitespace
    - Remove punctuation
    """
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ASCII', 'ignore').decode('ASCII')
    text = re.sub(r'[.!?,;:\"—–\-]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

@app.route("/api/check-sentence", methods=["POST"])
def check_sentence():
    """API endpoint to check sentence answers."""
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({"error": "Invalid request"}), 400
    user_answer = payload.get("answer")
    correct_answer = payload.get("correct")
    if not user_answer or not correct_answer:
        return jsonify({"error": "Missing answer or correct response"}), 400
    user_answer = str(user_answer)[:500]
    correct_answer = str(correct_answer)[:500]
    user_clean = normalize_text(user_answer)
    correct_clean = normalize_text(correct_answer)
    is_correct = user_clean == correct_clean
    return jsonify({
        "correct": is_correct,
        "expected": correct_answer,
        "user_normalized": user_clean,
        "correct_normalized": correct_clean
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug, host="0.0.0.0", port=port)
