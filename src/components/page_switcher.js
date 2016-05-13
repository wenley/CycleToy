
import Rx from 'rx';
import { div } from '@cycle/dom';

function mergeKeys(objects) {
  const result = {};

  objects.forEach(object => {
    for (let key in object) {
      if (!result.hasOwnProperty[key]) {
        result[key] = [];
      }
      result[key].push(object[key]);
    }
  });

  return result;
}

function PageSwitcher(sources, pageNames, pageFactories) {
  const DOM = sources.DOM;
  const headerIdentifiers = pageNames.map(
    (name, index) => 'header-' + name.replace(/\s+/g, '') + '-' + index
  );

  const pages = pageFactories.map(factory => factory(sources));

  const headerBar = div('.header-bar', pageNames.map(
    (name, index) => div('.header-item .' + headerIdentifiers[index], name)
  ));

  const headerSelected$s = headerIdentifiers
    .map(
      headerIdentifier => DOM
        .select('.' + headerIdentifier)
        .events('click')
        .map(() => headerIdentifier)
    );

  const selectedHeader$ = Rx.Observable.merge(...headerSelected$s)
    .startWith(headerIdentifiers[2])
    .distinctUntilChanged();
  const selectedIndex$ = selectedHeader$.map(
    identifier => headerIdentifiers.indexOf(identifier)
  );

  const laterDOMs = pages.slice(1).map(page => page.DOM);
  const content$ = pages[0].DOM
    .combineLatest(...laterDOMs)
    .combineLatest(
      selectedIndex$,
      (doms, index) => doms[index]
    ).distinctUntilChanged();
  const sinkDOM = content$.map(
      contentDOM =>
      div('', [
        headerBar,
        div('.content', [contentDOM]),
      ])
    );

  // Consolidate all subpage sinks
  const sinks = mergeKeys(pages);
  for (let key in sinks) {
    sinks[key] = Rx.Observable.merge(sinks[key]);
  }
  sinks.DOM = sinkDOM;

  // Some other, maybe useful sinks
  sinks.selectedIndex$ = selectedIndex$;
  sinks.pages = pages;

  return sinks;
}

export default PageSwitcher;
