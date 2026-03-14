from flask import Flask, render_template, jsonify, request
import json
import os

app = Flask(__name__)
DATA_FILE = 'arrange.json'

def get_data():
    if not os.path.exists(DATA_FILE): return []
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=4)

@app.route('/')
def home():
    return render_template('arrange_game.html')

@app.route('/admin')
def admin_page():
    return render_template('arrange_admin.html')

@app.route('/api/sequences', methods=['GET', 'POST'])
def manage_sequences():
    data = get_data()
    if request.method == 'GET': return jsonify(data)
    if request.method == 'POST':
        data.append(request.json)
        save_data(data)
        return jsonify({"message": "Added!"}), 201

@app.route('/api/sequences/<int:seq_id>', methods=['PUT', 'DELETE'])
def update_delete(seq_id):
    data = get_data()
    if request.method == 'DELETE':
        data = [s for s in data if s['id'] != seq_id]
        save_data(data)
    if request.method == 'PUT':
        for i, s in enumerate(data):
            if s['id'] == seq_id:
                data[i] = request.json
                break
        save_data(data)
    return jsonify({"message": "Success"})

if __name__ == '__main__':
    app.run(debug=True)