// F-010 State Watcher — runs in the recorded page (main world), injected by the background
// through CDP (Page.addScriptToEvaluateOnNewDocument + Runtime.evaluate for the open page).
// Finds everything with a `data-watch` prop in the React fiber tree, reads its current value
// and sends changes to the extension through the CDP binding `__apiLensEmit`.
// Logic ported from the state-watcher prototype.
(() => {
  // Already running (Record pressed again on the same page) → just send everything again.
  if (window.__apiLensWatch) {
    window.__apiLensWatch.resync();
    return;
  }

  const ATTR = 'data-watch';
  const VAL = 'data-watch-value';
  const POLL_MS = 1000;

  const last = new Map(); // name -> JSON (to detect changes)

  const emit = (msg) => {
    try {
      window.__apiLensEmit(JSON.stringify(msg));
    } catch (e) {
      // binding gone (recording stopped)
    }
  };

  // ---------- Serialization (functions, DOM nodes etc. cannot travel) ----------
  function safe(v, depth = 0, seen = new WeakSet()) {
    if (v === undefined) return '‹undefined›';
    if (v === null || typeof v === 'string' || typeof v === 'boolean') return v;
    if (typeof v === 'number') return Number.isFinite(v) ? v : String(v);
    if (typeof v === 'bigint') return v.toString() + 'n';
    if (typeof v === 'symbol') return v.toString();
    if (typeof v === 'function') return '‹ƒ ' + (v.name || 'anonymous') + '›';
    if (depth > 8) return '‹…›';
    if (seen.has(v)) return '‹Circular›';
    seen.add(v);
    try {
      if (v instanceof Date) return isNaN(v) ? '‹Invalid Date›' : v.toISOString();
      if (v.$d instanceof Date && typeof v.format === 'function') return '‹dayjs ' + v.format() + '›';
      if (v._isAMomentObject) return '‹moment ' + v.format() + '›';
      if (typeof Element !== 'undefined' && v instanceof Element)
        return '‹' + v.tagName.toLowerCase() + (v.id ? '#' + v.id : '') + '›';
      if (typeof File !== 'undefined' && v instanceof File) return '‹File ' + v.name + ' ' + v.size + 'b›';
      if (v.$$typeof) {
        const t = v.type;
        return '‹<' + (typeof t === 'string' ? t : (t && (t.displayName || t.name)) || 'Component') + ' />›';
      }
      if (v instanceof Map)
        return { '‹Map›': [...v].slice(0, 100).map(([k, x]) => [safe(k, depth + 1, seen), safe(x, depth + 1, seen)]) };
      if (v instanceof Set) return { '‹Set›': [...v].slice(0, 100).map((x) => safe(x, depth + 1, seen)) };
      if (Array.isArray(v)) {
        const arr = v.slice(0, 100).map((x) => safe(x, depth + 1, seen));
        if (v.length > 100) arr.push('‹+' + (v.length - 100) + ' more›');
        return arr;
      }
      const out = {};
      for (const k of Object.keys(v).slice(0, 200)) {
        let x;
        try {
          x = v[k];
        } catch (e) {
          x = '‹getter error›';
        }
        out[k] = safe(x, depth + 1, seen);
      }
      return out;
    } finally {
      seen.delete(v);
    }
  }

  // ---------- Fiber helpers ----------
  const isComponent = (f) =>
    typeof f.type === 'function' ||
    (typeof f.type === 'object' && f.type !== null && (f.type.render || f.type.type));
  const nameOf = (f) => {
    const t = f.type;
    if (typeof t === 'string') return t;
    if (!t) return 'Anonymous';
    return (
      t.displayName || t.name ||
      (t.render && (t.render.displayName || t.render.name)) ||
      (t.type && (t.type.displayName || t.type.name)) ||
      'Anonymous'
    );
  };
  const sourceOf = (f) => {
    const s = f._debugSource;
    return s ? s.fileName.split(/[\\/]/).slice(-2).join('/') + ':' + s.lineNumber : undefined;
  };
  const isFormMethods = (o) => o && typeof o === 'object' && typeof o.getValues === 'function' && o.control;

  // useState / useReducer values and a react-hook-form useForm() of a component
  function hooksOf(fiber) {
    const states = [];
    let form = null;
    if (fiber.tag === 1 && fiber.stateNode) return { states: [fiber.stateNode.state], form: null }; // class
    let h = fiber.memoizedState;
    let i = 0;
    while (h && i < 300) {
      const q = h.queue;
      if (q && typeof q.lastRenderedReducer === 'function') {
        states.push(h.memoizedState);
      } else if (!q && h.memoizedState && typeof h.memoizedState === 'object' && 'current' in h.memoizedState) {
        // useRef — react-hook-form keeps the useForm() result in a ref
        const cur = h.memoizedState.current;
        if (!form && isFormMethods(cur)) form = cur;
      }
      h = h.next;
      i++;
    }
    return { states, form };
  }

  // Nearest react-hook-form FormProvider above
  function nearestForm(fiber) {
    for (let p = fiber.return; p; p = p.return) {
      const v = p.memoizedProps && p.memoizedProps.value;
      if (isFormMethods(v)) return v;
    }
    return null;
  }

  function nearestComponent(fiber) {
    for (let p = fiber.return; p; p = p.return) if (isComponent(p)) return p;
    return null;
  }

  // RHF inputs are uncontrolled: typing does not re-render React,
  // so subscribe to the form's own subjects to hear about it immediately.
  const subscribedForms = new WeakSet();
  function subscribeForm(c) {
    if (!c || subscribedForms.has(c)) return;
    subscribedForms.add(c);
    const subj = c._subjects || {};
    for (const key of ['values', 'state', 'array', 'watch']) {
      try {
        subj[key] && subj[key].subscribe && subj[key].subscribe({ next: () => schedule() });
      } catch (e) {}
    }
  }

  const getPath = (o, path) => String(path).split('.').reduce((a, k) => (a == null ? a : a[k]), o);

  function formSnapshot(m, field) {
    const c = m.control;
    subscribeForm(c);
    const fs = (c && c._formState) || {};
    if (field != null) return { field, value: m.getValues(field), error: getPath(fs.errors, field) };
    return {
      values: m.getValues(),
      errors: fs.errors,
      isDirty: fs.isDirty,
      isValid: fs.isValid,
      isSubmitting: fs.isSubmitting,
      submitCount: fs.submitCount,
    };
  }

  function cleanProps(p) {
    const out = {};
    for (const k of Object.keys(p || {})) {
      if (k === 'children' || k === ATTR || k === VAL) continue;
      out[k] = p[k];
    }
    return out;
  }

  // Value to show for one fiber with `data-watch`
  function snapshot(fiber) {
    const p = fiber.memoizedProps || {};

    // 1) Explicit value: <X data-watch="name" data-watch-value={value} />
    if (VAL in p) return { kind: 'value', value: p[VAL] };

    // 2) FormProvider or a useForm() result passed as a prop
    if (isFormMethods(p)) return { kind: 'form', value: formSnapshot(p) };
    if (isFormMethods(p.form)) return { kind: 'form', value: formSnapshot(p.form) };

    // 3) DOM element (input, form, div…)
    if (typeof fiber.type === 'string') {
      const m = nearestForm(fiber);
      if (m && p.name) return { kind: 'field', value: formSnapshot(m, p.name) };
      if (m && fiber.type === 'form') return { kind: 'form', value: formSnapshot(m) };
      const owner = nearestComponent(fiber);
      if (!owner) return { kind: 'element', value: cleanProps(p) };
      fiber = owner; // show the component the element belongs to
    }

    // 4) Component: props + states (+ form when it calls useForm)
    const { states, form } = hooksOf(fiber);
    const value = { props: cleanProps(fiber.memoizedProps), state: states };
    if (form) value.form = formSnapshot(form);
    return { kind: form ? 'component+form' : 'component', component: nameOf(fiber), value };
  }

  // ---------- Scanning the tree ----------
  function getRoots() {
    const roots = new Set();
    const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (hook && hook.getFiberRoots && hook.renderers) {
      for (const id of hook.renderers.keys()) {
        try {
          hook.getFiberRoots(id).forEach((r) => roots.add(r.current));
        } catch (e) {}
      }
    }
    if (roots.size === 0 && document.body) {
      const els = [document.body, ...document.body.querySelectorAll('body > *, body > * > *')];
      for (const el of els) {
        const k = Object.keys(el).find((x) => x.startsWith('__reactContainer$'));
        if (k && el[k]) roots.add((el[k].stateNode && el[k].stateNode.current) || el[k]);
        if (el._reactRootContainer && el._reactRootContainer._internalRoot)
          roots.add(el._reactRootContainer._internalRoot.current);
      }
    }
    return roots;
  }

  function scan() {
    const found = new Map();
    const counts = {};
    for (const root of getRoots()) {
      const stack = [root];
      let n = 0;
      while (stack.length && n < 100000) {
        const f = stack.pop();
        n++;
        if (!f) continue;
        const p = f.memoizedProps;
        if (p && typeof p === 'object' && p[ATTR] != null && p[ATTR] !== false) {
          let name = String(p[ATTR] === true ? nameOf(f) : p[ATTR]);
          counts[name] = (counts[name] || 0) + 1;
          if (counts[name] > 1) name += ' #' + counts[name];
          try {
            const s = snapshot(f);
            found.set(name, { kind: s.kind, component: s.component, value: safe(s.value), source: sourceOf(f), on: nameOf(f) });
          } catch (e) {
            found.set(name, { kind: 'error', value: String(e), source: sourceOf(f), on: nameOf(f) });
          }
        }
        if (f.sibling) stack.push(f.sibling);
        if (f.child) stack.push(f.child);
      }
    }
    return found;
  }

  function flush(force) {
    let found;
    try {
      found = scan();
    } catch (e) {
      return;
    }
    const changed = {};
    const removed = [];
    let any = false;
    for (const [name, data] of found) {
      const json = JSON.stringify(data);
      if (force || last.get(name) !== json) {
        last.set(name, json);
        changed[name] = Object.assign({}, data, { ts: Date.now() });
        any = true;
      }
    }
    for (const name of [...last.keys()]) {
      if (!found.has(name)) {
        last.delete(name);
        removed.push(name);
        any = true;
      }
    }
    if (any || force) emit({ changed, removed, reset: !!force });
  }

  // Merge several commits into one scan
  let timer = null;
  const schedule = () => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      flush(false);
    }, 50);
  };

  // ---------- Catching updates ----------
  // With React DevTools installed, hook into its commits for instant updates.
  // We never CREATE the hook ourselves — that would break React DevTools.
  let wrapped = false;
  function tryWrapHook() {
    const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook || wrapped || typeof hook.onCommitFiberRoot !== 'function') return;
    const orig = hook.onCommitFiberRoot;
    hook.onCommitFiberRoot = function (...args) {
      schedule();
      return orig.apply(this, args);
    };
    wrapped = true;
  }
  tryWrapHook();
  document.addEventListener('DOMContentLoaded', tryWrapHook);

  // Fallback: poll every second (no hook, or ref / mutable changes)
  setInterval(() => {
    tryWrapHook();
    flush(false);
  }, POLL_MS);

  window.__apiLensWatch = {
    resync: () => {
      last.clear();
      flush(true);
    },
  };
  window.__apiLensWatch.resync();
})();
