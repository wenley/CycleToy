
import { Observable } from 'rx';
import CycleDOM from '@cycle/dom';
import logger from './logger';
import template from './cycle-handlebars';

const baseUrl = 'http://localhost:5000';
const getUrl = function(id) {
  return baseUrl + '/models/' + id;
};
const putUrl = function(id) {
  return getUrl(id);
};
const postUrl = baseUrl + '/models';

function shallowCopy(obj) {
  const copy = {};
  for (let attr in obj) {
    if (obj.hasOwnProperty(attr)) {
      copy[attr] = obj[attr];
    }
  }
  return copy;
}

function view(models$) {
  function renderForm(model) {
    // Make shallow copy first
    const copy = shallowCopy(model);
    return copy;
  }

  const content$ = models$.map(models =>
    template('model-editor', { models: models.map(renderForm) })
  );

  return content$;
}

function ModelEditor({ DOM, HTTP }) {

  const modelBatch$ = HTTP
    .filter(response$ => response$.request.category == 'fetch-all')
    .mergeAll()
    .map(response => JSON.parse(response.text));

  function swallowErrors(stream$) {
    return Observable.create(observer => {
      const subscription = stream$.subscribe(
        (obj) => observer.onNext(obj),
        (err) => observer.onCompleted(),
        () => observer.onCompleted()
      );

      return function onDispose() {
        subscription.dispose();
      };
    });
  }

  const singleModel$ = HTTP
    .filter(response$ => response$.request.category == 'fetch')
    .map(response$ => swallowErrors(response$))
    .mergeAll()
    .map((response) => JSON.parse(response.text));

  const model$ = Observable.merge(
    modelBatch$.flatMap(models => Observable.fromArray(models)),
    singleModel$
  ).share();

  const serverModels$ = model$
    .distinctUntilChanged() // This prevents no-op server update from wiping local state
    .scan(
      (cache, updatedModel) => {
        const index = cache.findIndex(obj => obj.id == updatedModel.id);

        if (index == -1) {
          return cache.concat([updatedModel]);
        } else {
          return cache.slice(0, index).concat([updatedModel]).concat(cache.slice(index + 1));
        }
      },
      []
    ).startWith([])
    .distinctUntilChanged();

  const serverLog = serverModels$.subscribe(logger('Server'));

  const modelUpdate$ = DOM
    .select('input')
    .events('input')
    .map((ev) => {
      return {
        modelId: parseInt(ev.target.getAttribute('modelId')),
        modelField: ev.target.getAttribute('modelField'),
        value: ev.target.value,
      };
    });

  // Something to allow user to revert to server state, even when server hasn't changed
  const modelRevert$ = undefined;

  const localModels$ = Observable.merge(
    model$.map((model) => { return { kind: "server", model }; }),
    modelUpdate$.map((delta) => { return { kind: "update", delta }; })
  ).scan((cache, update) => {
    const cacheCopy = Array.from(cache);

    let updatedModel;
    if (update.kind == "server") {
      // Blow away any local state when server comes back
      updatedModel = update.model;
    } else if (update.kind == "update") {
      const delta = update.delta;
      const localCopy = cacheCopy.find(obj => obj.id == delta.modelId);

      updatedModel = shallowCopy(localCopy);
      updatedModel[delta.modelField] = delta.value;
    }

    const index = cache.findIndex((model) => model.id == updatedModel.id);
    if (index == -1) {
      cacheCopy.push(updatedModel);
    } else {
      cacheCopy[index] = updatedModel;
    }

    return cacheCopy;
  }, []);

  const localLogger = localModels$.subscribe(logger('Local models'));

  const idToSave$ = DOM
    .select('button.save')
    .events('click')
    .map((ev) => ev.target.getAttribute('modelId'));

  const putRequest$ = idToSave$
    .withLatestFrom(
      localModels$,
      (id, models) => {
      const modelToSave = models.find(obj => obj.id == id);

      return {
        url: putUrl(id),
        category: 'fetch',
        method: 'PUT',
        send: modelToSave,
        type: 'form',
      };
    });

  const idToFetch$ = DOM
    .select('.fetch-single')
    .events('click')
    .map(() => 1);

  const fetchOneRequest$ = idToFetch$
    .map(id => {
      return {
        url: getUrl(id),
        category: 'fetch',
        method: 'GET',
      };
    });

  const fetchBatchRequest$ = DOM
    .select('.fetch-all')
    .events('click')
    .startWith(null) // Load data on page load
    .map(() => {
      return {
        url: baseUrl + '/models',
        category: 'fetch-all',
        method: 'GET',
      };
    });

  const request$ = Observable.merge(
    fetchOneRequest$,
    fetchBatchRequest$,
    putRequest$
  );

  return {
    DOM: view(serverModels$),
    HTTP: request$,
  };
}

export default ModelEditor;
