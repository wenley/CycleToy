
import { Observable } from 'rx';
import CycleDOM from '@cycle/dom';
import template from './cycle-handlebars';

function Counter({ DOM }, label = 'Value') {
  const increment$ = DOM.select('.increment')
    .events('click')
    .map(() => 1);

  const decrement$ = DOM.select('.decrement')
    .events('click')
    .map(() => -1);

  const value$ = Observable.merge(increment$, decrement$)
    .scan((total, change) => total + change)
    .startWith(0);

  return {
    value$,

    DOM: value$.map(
      value => template('counter', { label, value })
    ),
  };
}

export default Counter;
