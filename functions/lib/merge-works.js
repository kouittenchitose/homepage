import { normalizeWork } from './normalize-work-text.js';

/** R2 の作品データをビルド済み defaultWorks で上書きし、CMS 登録の画像だけ残す */
export function mergeWorksWithDefaults(remoteWorks, defaults) {
  if (!Array.isArray(defaults) || defaults.length === 0) {
    return Array.isArray(remoteWorks) ? remoteWorks : [];
  }
  if (!Array.isArray(remoteWorks) || remoteWorks.length === 0) {
    return defaults.map(normalizeWork);
  }

  const remoteMap = new Map(remoteWorks.map((w) => [w.id, w]));
  return defaults.map((def) => {
    const remote = remoteMap.get(def.id);
    const image = remote && typeof remote.image === 'string' ? remote.image.trim() : '';
    const merged = image ? { ...def, image } : def;
    return normalizeWork(merged);
  });
}
