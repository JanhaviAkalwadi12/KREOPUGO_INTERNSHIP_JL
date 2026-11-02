import os
import uuid
from flask import Flask, render_template, request, redirect, url_for, session

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, 'templates'),
    static_folder=os.path.join(BASE_DIR, 'static'),
    static_url_path='/static'
)
app.secret_key = "juicy_secret_123"

# Consistent run ID across serverless function instances; configurable via RUN_ID env var
RUN_ID = os.environ.get("RUN_ID", "juicy_life_session_run_key")


def login_required():
    return session.get('logged') == True and session.get('run') == RUN_ID

def safe_next(target):
    # only allow internal paths like /stock (blocks external redirects)
    if target and target.startswith('/') and not target.startswith('//'):
        return target
    return '/dashboard'

@app.after_request
def no_cache(resp):
    # always load fresh pages so data entered on one page shows on the others
    resp.headers['Cache-Control'] = 'no-store'
    return resp

@app.route('/login', methods=['GET', 'POST'])
def login():
    nxt = request.values.get('next', '')
    if login_required():
        return redirect(safe_next(nxt))
    if request.method == 'POST':
        email = request.form.get('email', '').lower().strip()
        pw = request.form.get('password', '').strip()
        if (email in ["admin@gmail.com"]) and pw == "7890":
            session.clear()
            session['logged'] = True
            session['run'] = RUN_ID
            return redirect(safe_next(nxt))
        return render_template('login.html', error="Wrong!", next=nxt)
    return render_template('login.html', next=nxt)

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('landing'))   # logout returns to the Landing page

@app.route('/')
@app.route('/index')
@app.route('/index.html')
@app.route('/landing')
def landing():
    # landing (Home) is always shown first, with or without login
    return render_template('landing.html')

def protected(template):
    if not login_required():
        return redirect(url_for('login', next=request.path))
    return render_template(template)

@app.route('/dashboard')
def dashboard():
    return protected('dashboard.html')

@app.route('/stock')
def stock():
    return protected('stock.html')

@app.route('/vendor')
def vendor():
    return protected('vendor.html')

@app.route('/billing')
def billing():
    return protected('billing.html')

@app.route('/report')
def report():
    return protected('report.html')

if __name__ == '__main__':
    app.run(debug=True)
