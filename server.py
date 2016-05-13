
from flask import Flask
from flask import request
from flask import Response
import json

app = Flask(__name__)

@app.route("/")
def hello():
    print 'Saying hello'
    with open('index.html', 'r') as f:
        return f.read()

models = [{ 
    'id': 1,
    'value': 'Hello',
}]

@app.route('/models/<model_id>', methods=['GET'])
def show(model_id):
    model_id = int(model_id)
    model = list(m for m in models if m['id'] == model_id)

    if not model:
        return '', 404

    model = model[0]
    print 'Found model:', model

    print 'Processing as GET'
    return json.dumps(model)

@app.route('/models/<model_id>', methods=['PUT'])
def update(model_id):
    print 'Processing as PUT'

    model_id = int(model_id)
    model = list(m for m in models if m['id'] == model_id)

    if not model:
        return '', 404

    model = model[0]
    update_model(model, request.form)
    return json.dumps(model)

def update_model(model, updated_model):
    print "Going to overwrite", model, "with", updated_model
    for k, v in updated_model.iteritems():
        if k == 'id':
            pass
        else:
            model[k] = v

@app.route('/models', methods=['GET'])
def index():
    print 'GET all models'
    return json.dumps(models)

@app.route('/models', methods=['POST'])
def create():
    print 'POST request'
    print request.form

    model = add_model(request.form)
    return json.dumps(model)

def add_model(data):
    model = {}
    for k in data.iterkeys():
        model[k] = request.form[k]
    print model
    taken_ids = map(lambda m: m['id'], models)

    if not model.get('id', None) or model['id'] in taken_ids:
        model['id'] = max(taken_ids) + 1

    models.append(model)
    return model


@app.route("/dist/<filename>")
def asset(filename):
    print "Trying to get", filename
    with open('./dist/' + filename, 'r') as f:
        return f.read()

@app.route('/dist/stylesheets/<stylesheet>')
def stylesheet(stylesheet):
    print "Trying to get stylesheet", stylesheet
    with open ('./dist/stylesheets/' + stylesheet, 'r') as f:
        return Response(f.read(), mimetype='text/css')

if __name__ == "__main__":
    app.run(debug=True)
