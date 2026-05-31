// Mini pub/sub para que PageHeader publique el título actual
// y el Topbar lo lea en cliente sin necesidad de un Context Provider.
type Listener = (title: string) => void;

let _title = '';
const _listeners = new Set<Listener>();

export const pageTitleStore = {
  get: () => _title,
  set: (title: string) => {
    _title = title;
    _listeners.forEach((l) => l(title));
  },
  subscribe: (listener: Listener) => {
    _listeners.add(listener);
    return () => _listeners.delete(listener);
  },
};
