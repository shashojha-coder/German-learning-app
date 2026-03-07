"""
ApplyAI - Job Application Generator
Flask backend that proxies AI requests to Anthropic API.
"""

import os
from flask import Flask, render_template, jsonify, request
import requests as http_requests

app = Flask(__name__)

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/generate", methods=["POST"])
def generate():
    if not ANTHROPIC_API_KEY:
        return jsonify({"error": "ANTHROPIC_API_KEY not configured on the server."}), 500

    payload = request.get_json()
    if not payload:
        return jsonify({"error": "Invalid request body."}), 400

    system_prompt = payload.get("system", "")
    user_prompt = payload.get("prompt", "")

    if not user_prompt:
        return jsonify({"error": "No prompt provided."}), 400

    # Limit prompt size to prevent abuse
    if len(user_prompt) > 15000:
        return jsonify({"error": "Prompt too long (max 15000 chars)."}), 400

    try:
        resp = http_requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "Content-Type": "application/json",
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
            },
            json={
                "model": ANTHROPIC_MODEL,
                "max_tokens": 4096,
                "system": system_prompt,
                "messages": [{"role": "user", "content": user_prompt}],
            },
            timeout=120,
        )
        resp.raise_for_status()
        data = resp.json()
        text = "".join(block.get("text", "") for block in data.get("content", []))
        return jsonify({"text": text})

    except http_requests.exceptions.Timeout:
        return jsonify({"error": "AI request timed out. Try again."}), 504
    except http_requests.exceptions.HTTPError as e:
        status = e.response.status_code if e.response is not None else 500
        detail = ""
        try:
            detail = e.response.json().get("error", {}).get("message", "")
        except Exception:
            pass
        return jsonify({"error": f"Anthropic API error ({status}): {detail}"}), 502
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


if __name__ == "__main__":
    if not ANTHROPIC_API_KEY:
        print("⚠  WARNING: Set ANTHROPIC_API_KEY environment variable before running.")
        print("   export ANTHROPIC_API_KEY='sk-ant-...'")
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)
