/**
 * F-009 Redux Action Tracker — script injected into the recorded page (main world) via
 * CDP `Page.addScriptToEvaluateOnNewDocument`, so it runs before the app's own code.
 *
 * Like Redux DevTools, it defines `window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__`. RTK's
 * configureStore() calls it and our enhancer joins the chain. After every plain action
 * reaching the reducer, { type, payload, state of the user's scopes } is sent to the
 * background through the CDP binding (`Runtime.addBinding` → `Runtime.bindingCalled`).
 * If Redux DevTools is installed too, its compose is still called — both keep working.
 *
 * Kept as plain JS text (not a bundled function) so the bundler cannot touch it.
 */

export const REDUX_BINDING = '__apiLensEmit';
/** Page global holding the scopes, updated live when the user edits them. */
const SCOPES_GLOBAL = '__apiLensScopes';
/** One serialized field (payload / a scope's state) larger than this is replaced by a note. */
const FIELD_LIMIT = 200 * 1024;

export function reduxInjectSource(scopes: string[]): string {
  return `(() => {
  if (window.${SCOPES_GLOBAL}) return;
  window.${SCOPES_GLOBAL} = ${JSON.stringify(scopes)};
  const send = (msg) => {
    try { window.${REDUX_BINDING}(JSON.stringify(msg)); } catch (e) {}
  };
  const clean = (v) => {
    try {
      const seen = new WeakSet();
      const s = JSON.stringify(v, (k, x) => {
        if (typeof x === 'function') return '[function]';
        if (typeof x === 'bigint') return String(x);
        if (x && typeof x === 'object') {
          if (seen.has(x)) return '[circular]';
          seen.add(x);
        }
        return x;
      });
      if (s === undefined) return undefined;
      if (s.length > ${FIELD_LIMIT}) return '[too large: ' + Math.round(s.length / 1024) + ' KB]';
      return JSON.parse(s);
    } catch (e) {
      return '[unserializable]';
    }
  };
  const pick = (state) => {
    const out = {};
    for (const scope of window.${SCOPES_GLOBAL} || []) {
      let v = state;
      for (const part of scope.split('.')) v = v == null ? undefined : v[part];
      out[scope] = v === undefined ? '[not found]' : clean(v);
    }
    return out;
  };
  const compose = (...f) => f.length === 0 ? (x) => x : f.reduce((a, b) => (...x) => a(b(...x)));

  const enhancer = (createStore) => (...args) => {
    const store = createStore(...args);
    send({ kind: 'init' });
    const dispatch = (action) => {
      const result = store.dispatch(action);
      if (action && typeof action === 'object' && typeof action.type === 'string') {
        send({
          kind: 'action',
          time: Date.now(),
          type: action.type,
          payload: clean(action.payload),
          state: pick(store.getState()),
        });
      }
      return result;
    };
    return Object.assign({}, store, { dispatch });
  };

  let real = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;
  const ours = (...args) => {
    const base = real;
    if (args.length === 1 && args[0] && typeof args[0] === 'object') {
      const inner = base ? base(args[0]) : compose;
      return (...enhancers) => inner(...enhancers, enhancer);
    }
    return (base || compose)(...args, enhancer);
  };
  try {
    Object.defineProperty(window, '__REDUX_DEVTOOLS_EXTENSION_COMPOSE__', {
      configurable: true,
      get: () => ours,
      set: (v) => { if (v !== ours) real = v; },
    });
  } catch (e) {}
})();`;
}

/** Live scope update for an already loaded page. */
export function reduxScopesUpdateSource(scopes: string[]): string {
  return `window.${SCOPES_GLOBAL} = ${JSON.stringify(scopes)};`;
}
