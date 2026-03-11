
from flask import Blueprint, render_template, request, redirect, url_for, flash, session
import json
import os
from functools import wraps

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

CONTENT_PATH = os.path.join(os.path.dirname(__file__), '../../data/content.json')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')  # Change in production!

# --- Auth Decorator ---
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return redirect(url_for('admin.login', next=request.url))
        return f(*args, **kwargs)
    return decorated

@admin_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        password = request.form.get('password')
        if password == ADMIN_PASSWORD:
            session['admin_logged_in'] = True
            flash('Logged in successfully!', 'success')
            next_url = request.args.get('next') or url_for('admin.admin_dashboard')
            return redirect(next_url)
        else:
            flash('Incorrect password.', 'danger')
    return render_template('admin/login.html')

@admin_bp.route('/logout')
def logout():
    session.pop('admin_logged_in', None)
    flash('Logged out.', 'info')
    return redirect(url_for('admin.login'))

@admin_bp.route('/')
@login_required
def admin_dashboard():
    with open(CONTENT_PATH, 'r', encoding='utf-8') as f:
        content = json.load(f)
    return render_template('admin/dashboard.html', content=content)

@admin_bp.route('/edit', methods=['GET', 'POST'])
@login_required
def edit_content():
    if request.method == 'POST':
        new_content = request.form.get('content')
        try:
            data = json.loads(new_content)
            with open(CONTENT_PATH, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            flash('Content updated successfully!', 'success')
        except Exception as e:
            flash(f'Error: {e}', 'danger')
        return redirect(url_for('admin.edit_content'))
    else:
        with open(CONTENT_PATH, 'r', encoding='utf-8') as f:
            content = f.read()
        return render_template('admin/edit.html', content=content)
