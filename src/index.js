
import Rx from 'rx';
import Cycle from '@cycle/core';
import CycleDOM from '@cycle/dom';
import CycleHttp from '@cycle/http';
import isolate from '@cycle/isolate';

import Counter from './components/counter';
import PageSwitcher from './components/page_switcher';
import ModelEditor from './components/model-editor';

const div = CycleDOM.div;

function main(sources) {

  // Labeled Content Pages
  const WeightCounter = (sources) => isolate(Counter, 'weight')(sources, 'Weight');
  const HeightCounter = (sources) => isolate(Counter, 'height')(sources, 'Height');
  const SpecialEditor = (sources) => isolate(ModelEditor, 'special')(sources);

  const MainPageSwitcher = isolate(PageSwitcher, 'mainSwitcher');

  const pageSwitcher = MainPageSwitcher(
    sources,
    ['Weight', 'Height', 'Model'],
    [WeightCounter, HeightCounter, SpecialEditor]
  );
  const switchedHTTP = pageSwitcher.pages[2].HTTP;

  return {
    DOM: pageSwitcher.DOM,
    HTTP: pageSwitcher.HTTP,
  };
}

const drivers = {
  DOM: CycleDOM.makeDOMDriver('.app'),
  HTTP: CycleHttp.makeHTTPDriver(),
};

Cycle.run(main, drivers);
