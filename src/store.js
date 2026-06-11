const _listeners = {};
const _history = [];
let _historyEnabled = false;

export function enableHistory() {
  _historyEnabled = true;
}

export function getHistory() {
  return [..._history];
}

export function subscribe(key, fn) {
  (_listeners[key] ||= []).push(fn);
  return () => {
    _listeners[key] = _listeners[key]?.filter(f => f !== fn);
  };
}

export function subscribeMany(keys, fn) {
  const unsubs = keys.map(k => subscribe(k, fn));
  return () => unsubs.forEach(u => u());
}

export function notify(key, value, prev) {
  if (_historyEnabled) {
    _history.push({ key, prev, value, at: Date.now() });
    if (_history.length > 100) _history.shift();
  }
  _listeners[key]?.forEach(fn => fn(value, prev));
}

export function createReactiveArray(key, baseArr = []) {
  const arr = [...baseArr];
  return new Proxy(arr, {
    set(target, prop, value) {
      const oldLen = target.length;
      target[prop] = value;
      if (prop === 'length' || !isNaN(Number(prop))) {
        notify(key, [...target], [...target]);
      }
      return true;
    },
    get(target, prop) {
      if (prop === 'push') {
        return (...items) => {
          Array.prototype.push.apply(target, items);
          notify(key, [...target], []);
          return target.length;
        };
      }
      if (prop === 'pop') {
        return () => {
          const result = Array.prototype.pop.apply(target);
          notify(key, [...target], []);
          return result;
        };
      }
      if (prop === 'splice') {
        return (...args) => {
          const result = Array.prototype.splice.apply(target, args);
          notify(key, [...target], []);
          return result;
        };
      }
      if (prop === 'shift') {
        return () => {
          const result = Array.prototype.shift.apply(target);
          notify(key, [...target], []);
          return result;
        };
      }
      if (prop === 'unshift') {
        return (...items) => {
          const result = Array.prototype.unshift.apply(target, items);
          notify(key, [...target], []);
          return result;
        };
      }
      if (prop === 'filter') {
        return (...args) => Array.prototype.filter.apply(target, args);
      }
      if (prop === 'map') {
        return (...args) => Array.prototype.map.apply(target, args);
      }
      if (prop === 'reduce') {
        return (...args) => Array.prototype.reduce.apply(target, args);
      }
      if (prop === 'slice') {
        return (...args) => Array.prototype.slice.apply(target, args);
      }
      if (prop === 'find') {
        return (...args) => Array.prototype.find.apply(target, args);
      }
      if (prop === 'includes') {
        return (...args) => Array.prototype.includes.apply(target, args);
      }
      if (prop === 'indexOf') {
        return (...args) => Array.prototype.indexOf.apply(target, args);
      }
      if (prop === 'some') {
        return (...args) => Array.prototype.some.apply(target, args);
      }
      if (prop === 'every') {
        return (...args) => Array.prototype.every.apply(target, args);
      }
      if (prop === Symbol.iterator) {
        return target[Symbol.iterator].bind(target);
      }
      if (prop === 'length') return target.length;
      const val = target[prop];
      return typeof val === 'function' ? val.bind(target) : val;
    }
  });
}
