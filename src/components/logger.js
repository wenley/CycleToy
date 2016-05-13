
import { Observer } from 'rx';

function logger(prefix = null) {
  function log(obj) {
    if (prefix) {
      console.log(prefix);
    }
    console.log(obj);
  };
  return Observer.create(
    (obj) => log(obj),
    (err) => log(err),
    () => log('Completed')
  );
};

export default logger;
