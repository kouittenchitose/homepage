let currentAddTarget = '';
let currentNewsImages = [];
let currentNewsLinks = [];
let currentNewsThumbnail = '';
let currentWorkSections = [];

function syncWorkSectionsFromDom() {
  const rows = document.querySelectorAll('#work-sections-list .work-sec-row');
  const next = [];
  rows.forEach((row) => {
    next.push({
      title: row.querySelector('.work-sec-title')?.value ?? '',
      body: row.querySelector('.work-sec-body')?.value ?? '',
    });
  });
  if (next.length) currentWorkSections = next;
}

function renderWorkSectionsEditor() {
  const el = document.getElementById('work-sections-list');
  if (!el) return;
  if (!currentWorkSections.length) currentWorkSections = [{ title: 'テーマ・構成', body: '' }];
  el.innerHTML = '';
  currentWorkSections.forEach((sec, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'work-sec-row';
    wrap.dataset.secI = String(i);
    wrap.style.cssText = 'border:1px solid #ddd;padding:12px;margin-bottom:10px;border-radius:8px;background:#fafafa;';
    wrap.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <strong style="font-size:0.9rem;">セクション ${i + 1}</strong>
        <button type="button" class="btn-danger" style="width:auto;padding:4px 10px;margin:0;">削除</button>
      </div>
      <label style="font-size:0.85rem;display:block;">見出し</label>
      <input type="text" class="work-sec-title" placeholder="例: 歌詞・語り・テーマ" style="width:100%;margin-bottom:8px;box-sizing:border-box;">
      <label style="font-size:0.85rem;display:block;">本文</label>`;
    const ta = document.createElement('textarea');
    ta.className = 'work-sec-body';
    ta.rows = Math.min(18, Math.max(8, String(sec.body || '').split('\n').length + 2));
    ta.style.cssText = 'width:100%;box-sizing:border-box;font-family:inherit;';
    ta.value = sec.body || '';
    wrap.querySelector('.work-sec-title').value = sec.title || '';
    wrap.appendChild(ta);
    wrap.querySelector('.btn-danger').onclick = () => removeWorkSectionRow(i);
    wrap.querySelector('.work-sec-title').addEventListener('input', () => setEditorDirty(true));
    ta.addEventListener('input', () => setEditorDirty(true));
    el.appendChild(wrap);
  });
}

function addWorkSectionRow() {
  syncWorkSectionsFromDom();
  currentWorkSections.push({ title: '', body: '' });
  renderWorkSectionsEditor();
  setEditorDirty(true);
}

function removeWorkSectionRow(index) {
  syncWorkSectionsFromDom();
  currentWorkSections.splice(index, 1);
  if (!currentWorkSections.length) currentWorkSections.push({ title: 'テーマ・構成', body: '' });
  renderWorkSectionsEditor();
  setEditorDirty(true);
}

function refreshNewsTagOptions() {
  const dl = document.getElementById('news-tag-options');
  if (!dl) return;
  const defaults = ['お知らせ', 'イベント情報', '活動報告', '重要', 'メディア', '募集'];
  const fromNews = [...new Set((dataCache.news || []).map((n) => n.tag).filter(Boolean))];
  const merged = [...new Set([...defaults, ...fromNews])];
  dl.innerHTML = merged.map((t) => `<option value="${escapeHtml(t)}">`).join('');
}

async function inlineUpload(inputId, targetInputId, folder) {
  const file = document.getElementById(inputId).files[0];
  if (!file) return alert('ファイルを選択してください');
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      console.log(`[Upload] Starting upload: ${file.name} to folder: ${folder}`);
      const res = await api('upload', { fileName: file.name, fileData: reader.result.split(',')[1], contentType: file.type, folder });
      if (!res.ok || !res.url) {
        console.error('[Upload Error]', res);
        return alert(`アップロード失敗: ${res.error || 'Unknown error'}`);
      }
      console.log(`[Upload Success] URL: ${res.url}`);
      document.getElementById(targetInputId).value = res.url;
      alert('アップロードし、URLを設定しました！');
      document.getElementById(inputId).value = ''; // 選択クリア
    } catch (e) {
      console.error('[Upload Exception]', e);
      alert(`アップロード失敗: ${e.message || e}`);
    }
  };
  reader.readAsDataURL(file);
}

function renderNewsMedia() {
  const imagesList = document.getElementById('news-images-list');
  imagesList.innerHTML = currentNewsImages.map((url, i) => `
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:5px;">
      <img src="${escapeHtml(url)}" style="height:40px; width:40px; object-fit:cover; border-radius:4px;">
      <input type="text" value="${escapeHtml(url)}" readonly style="flex:1;">
      <button class="btn-danger" style="width:auto; padding:4px 8px; margin:0;" onclick="removeNewsImage(${i})">削除</button>
    </div>
  `).join('');

  const linksList = document.getElementById('news-links-list');
  linksList.innerHTML = currentNewsLinks.map((link, i) => `
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:5px; background:#f5f5f5; padding:8px; border-radius:6px;">
      ${link.image ? `<img src="${escapeHtml(link.image)}" style="height:40px; width:40px; object-fit:cover; border-radius:4px;">` : '<div style="height:40px; width:40px; background:#ddd; border-radius:4px;"></div>'}
      <div style="flex:1; overflow:hidden;">
        <div style="font-weight:bold; font-size:0.9rem; white-space:nowrap; text-overflow:ellipsis;">${escapeHtml(link.title || link.url)}</div>
        <div style="font-size:0.8rem; color:#666; white-space:nowrap; text-overflow:ellipsis;">${escapeHtml(link.url)}</div>
      </div>
      <button class="btn-danger" style="width:auto; padding:4px 8px; margin:0;" onclick="removeNewsLink(${i})">削除</button>
    </div>
  `).join('');

  const select = document.getElementById('news-thumbnail-select');
  let options = '<option value="">設定しない（デフォルト）</option>';
  currentNewsImages.forEach((url, i) => {
    options += `<option value="${escapeHtml(url)}">画像 ${i + 1}</option>`;
  });
  currentNewsLinks.forEach((link, i) => {
    if (link.image) {
      options += `<option value="${escapeHtml(link.image)}">リンク ${i + 1} (${escapeHtml(link.title || link.url)})</option>`;
    }
  });
  select.innerHTML = options;
  if (currentNewsThumbnail) select.value = currentNewsThumbnail;
}

function removeNewsImage(index) {
  currentNewsImages.splice(index, 1);
  setEditorDirty(true);
  renderNewsMedia();
}

function removeNewsLink(index) {
  currentNewsLinks.splice(index, 1);
  setEditorDirty(true);
  renderNewsMedia();
}

async function inlineUploadNewsImage(inputId, folder) {
  const file = document.getElementById(inputId).files[0];
  if (!file) return alert('ファイルを選択してください');
  const btn = event.target;
  const originalText = btn.textContent;
  btn.textContent = 'アップロード中...';
  btn.disabled = true;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const res = await api('upload', { fileName: file.name, fileData: reader.result.split(',')[1], contentType: file.type, folder });
      if (!res.ok || !res.url) throw new Error(res.error || 'Upload failed');
      currentNewsImages.push(res.url);
      document.getElementById(inputId).value = '';
      setEditorDirty(true);
      renderNewsMedia();
    } catch (e) {
      alert(`アップロード失敗: ${e.message || e}`);
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  };
  reader.readAsDataURL(file);
}

async function addNewsLink() {
  const input = document.getElementById('news-link-input');
  const url = input.value.trim();
  if (!url) return;
  const btn = event.target;
  const originalText = btn.textContent;
  input.value = '情報取得中...';
  input.disabled = true;
  btn.disabled = true;
  try {
    const res = await fetch(`/api/ogp?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch OGP');
    currentNewsLinks.push({
      url: data.url,
      title: data.title,
      image: data.image,
      description: data.description
    });
    setEditorDirty(true);
    renderNewsMedia();
  } catch (e) {
    alert(`リンク情報の取得に失敗しました: ${e.message}`);
  } finally {
    input.value = '';
    input.disabled = false;
    btn.disabled = false;
  }
}

// Add event listener for thumbnail select
document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('news-thumbnail-select');
  if (select) {
    select.addEventListener('change', (e) => {
      currentNewsThumbnail = e.target.value;
      setEditorDirty(true);
    });
  }
});

async function editNews(id) {
  await confirmLeaveEditor(() => {
    editorState.type = 'news';
    setEditorDirty(false);
    document.getElementById('news-editor').style.display = 'block';
    const item = id ? dataCache.news.find(i => i.id === id) : { id: Date.now().toString(), title: '', date: new Date().toISOString().split('T')[0], tag: 'お知らせ', image: '', images: [], links: [], thumbnailUrl: '', body: '', pinned: false };
    document.getElementById('news-id').value = item.id;
    document.getElementById('news-title').value = item.title;
    document.getElementById('news-date').value = item.date;
    refreshNewsTagOptions();
    document.getElementById('news-tag').value = item.tag || 'お知らせ';

    currentNewsImages = item.images ? [...item.images] : (item.image ? [item.image] : []);
    currentNewsLinks = item.links ? [...item.links] : [];
    currentNewsThumbnail = item.thumbnailUrl || (currentNewsImages.length > 0 ? currentNewsImages[0] : '');
    renderNewsMedia();

    document.getElementById('news-body').value = item.body || '';
    document.getElementById('news-pinned').checked = item.pinned;
    attachEditorChangeHandlers('news-editor');
    setTimeout(() => {
      const editor = document.getElementById('news-editor');
      if (editor) editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  });
}

async function saveNews() {
  const id = document.getElementById('news-id').value;
  const select = document.getElementById('news-thumbnail-select');
  const item = {
    id, title: document.getElementById('news-title').value,
    date: document.getElementById('news-date').value,
    tag: document.getElementById('news-tag').value,
    image: currentNewsImages.length > 0 ? currentNewsImages[0] : '', // fallback
    images: currentNewsImages,
    links: currentNewsLinks,
    thumbnailUrl: select.value || '',
    body: document.getElementById('news-body').value,
    pinned: document.getElementById('news-pinned').checked
  };
  const idx = dataCache.news.findIndex(i => i.id === id);
  if (idx >= 0) dataCache.news[idx] = item; else dataCache.news.unshift(item);
  dataCache.news.sort((a, b) => new Date(b.date) - new Date(a.date));
  await saveData('news');
  closeEditor('news');
  clearEditorState();
  setTimeout(() => {
    const editor = document.getElementById('news-editor');
    if (editor) editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

async function editWork(id) {
  await confirmLeaveEditor(() => {
    editorState.type = 'works';
    setEditorDirty(false);
    document.getElementById('works-editor').style.display = 'block';
    const item = id ? dataCache.works.find(i => i.id === id) : { id: Date.now().toString(), year: '', title: '', story: '', body: '', detailSections: [], image: '', youtubeUrl: '', awards: [] };
    document.getElementById('work-id').value = item.id;
    document.getElementById('work-year').value = item.year;
    document.getElementById('work-title').value = item.title;
    document.getElementById('work-story').value = item.story || '';
    document.getElementById('work-body').value = item.body || '';
    document.getElementById('work-image').value = item.image || '';
    document.getElementById('work-youtube').value = item.youtubeUrl || '';
    document.getElementById('work-awards').value = (item.awards || []).join(', ');
    currentWorkSections =
      Array.isArray(item.detailSections) && item.detailSections.length > 0
        ? item.detailSections.map((s) => ({ title: s.title || '', body: s.body || '' }))
        : WorkSections.legacyBodyToSections(item.body || '');
    if (!currentWorkSections.length) currentWorkSections = [{ title: 'テーマ・構成', body: '' }];
    renderWorkSectionsEditor();
    attachEditorChangeHandlers('works-editor');
    setTimeout(() => {
      const editor = document.getElementById('works-editor');
      if (editor) editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  });
}

async function saveWork() {
  const id = document.getElementById('work-id').value;
  syncWorkSectionsFromDom();
  const detailSections = currentWorkSections
    .map((s) => ({ title: (s.title || '').trim(), body: s.body || '' }))
    .filter((s) => s.title || (s.body || '').trim());
  const awardsStr = document.getElementById('work-awards').value;
  const item = {
    id,
    year: document.getElementById('work-year').value,
    title: document.getElementById('work-title').value,
    story: document.getElementById('work-story').value,
    body: document.getElementById('work-body').value,
    detailSections,
    image: document.getElementById('work-image').value,
    youtubeUrl: document.getElementById('work-youtube').value.trim(),
    awards: awardsStr ? awardsStr.split(',').map((s) => s.trim()).filter((s) => s !== '') : [],
  };
  const idx = dataCache.works.findIndex(i => i.id === id);
  if (idx >= 0) dataCache.works[idx] = item; else dataCache.works.unshift(item);
  dataCache.works.sort((a, b) => b.year - a.year);
  await saveData('works');
  closeEditor('works');
  clearEditorState();
  setTimeout(() => {
    const editor = document.getElementById('works-editor');
    if (editor) editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function renderAbout() {
  if (!dataCache.about.history) dataCache.about.history = [];
  if (!dataCache.about.awards) dataCache.about.awards = [];

  const renderArray = (arr, containerId, target, labelText) => {
    const c = document.getElementById(containerId);
    c.innerHTML = '';
    arr.forEach((item, i) => {
      const year = escapeHtml(item.year || '');
      const text = escapeHtml(String(item.text || item.content || ''));
      c.innerHTML += `
            <div style="display:flex; gap:10px; align-items:flex-start; margin-bottom:12px; padding:12px; background:#f9f9f9; border-radius:8px;">
              <div style="flex:1;">
                <div style="font-weight:700; font-size:0.9rem; color:#555; margin-bottom:4px;">${year}</div>
                <div style="font-size:0.9rem; color:#333; white-space:pre-wrap; overflow-wrap:anywhere;">${text}</div>
              </div>
              <div style="display:flex; gap:6px; flex-wrap:wrap;">
                <button style="width:auto; margin:0; padding:6px 12px; font-size:0.85rem;" onclick="editAboutItem(${i}, '${target}')">編集</button>
                <button style="width:auto; margin:0; padding:6px 12px; font-size:0.85rem;" class="btn-danger" onclick="deleteAboutItem(${i}, '${target}')">削除</button>
              </div>
            </div>`;
    });
  };
  renderArray(dataCache.about.history, 'about-history-list', 'history', '年 (例: 2003年)');
  renderArray(dataCache.about.awards, 'about-awards-list', 'awards', '年・作品名');
}

async function editAboutItem(index, type) {
  await confirmLeaveEditor(() => {
    editorState.type = 'about';
    setEditorDirty(false);
    document.getElementById('about-editor').style.display = 'block';

    const list = type === 'history' ? dataCache.about.history : dataCache.about.awards;
    const item = index !== null ? list[index] : null;

    document.getElementById('about-item-type').value = type;
    document.getElementById('about-item-index').value = index !== null ? index : -1;
    document.getElementById('about-editor-title').textContent = index !== null ? `${type === 'history' ? '沿革' : '受賞歴'}を編集` : `${type === 'history' ? '沿革' : '受賞歴'}を追加`;
    document.getElementById('about-year').value = item ? (item.year || '') : '';
    document.getElementById('about-text').value = item ? (item.text || item.content || '') : '';
    document.getElementById('about-year').placeholder = type === 'history' ? '年 (例: 2003年)' : '年・作品名';
    document.getElementById('about-text').placeholder = type === 'history' ? '出来事' : '賞の名前';
    attachEditorChangeHandlers('about-editor');
    setTimeout(() => {
      const editor = document.getElementById('about-editor');
      if (editor) editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  });
}

async function saveAboutItem() {
  const type = document.getElementById('about-item-type').value;
  const index = parseInt(document.getElementById('about-item-index').value);
  const year = document.getElementById('about-year').value;
  const text = document.getElementById('about-text').value;

  if (!year || !text) return alert('年と内容を入力してください');

  const list = type === 'history' ? dataCache.about.history : dataCache.about.awards;
  const item = type === 'history' ? { year, content: text } : { year, text };

  if (index >= 0) {
    list[index] = item;
  } else {
    list.push(item);
  }

  await saveData('about');
  closeEditor('about');
  clearEditorState();
  renderAbout();
  setTimeout(() => {
    const editor = document.getElementById('about-editor');
    if (editor) editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

async function deleteAboutItem(index, target) {
  if (!confirm('この項目を本当に削除しますか？')) return;
  const list = target === 'history' ? dataCache.about.history : dataCache.about.awards;
  const item = list[index];
  if (!item) return;
  const type = target === 'history' ? 'about-history' : 'about-awards';
  await moveToTrash(item, type, `${item.year} ${item.text || item.content}`);
  list.splice(index, 1);
  await saveData('about');
  renderAbout();
}

function renderVisibilityPanel() {
  const annPub = document.getElementById('vis-anniv-published');
  if (!annPub) return;

  const cfg = dataCache['anniv-config'] || { published: false };
  annPub.checked = !!cfg.published;
  const annBody = document.getElementById('vis-anniv-content');
  if (annBody) annBody.value = (dataCache.anniv && dataCache.anniv.content) || '';

  const sp = dataCache.sponsors || { published: false, intro: '', items: [] };
  const spPub = document.getElementById('vis-sponsors-published');
  if (spPub) spPub.checked = !!sp.published;
  const spIntro = document.getElementById('vis-sponsors-intro');
  if (spIntro) spIntro.value = sp.intro || '';

  const wrap = document.getElementById('vis-sponsors-items');
  if (wrap) {
    wrap.innerHTML = '';
    const items = Array.isArray(sp.items) ? sp.items : [];
    if (items.length === 0) {
      addVisibilitySponsorRow();
    } else {
      items.forEach((it) => addVisibilitySponsorRow(it));
    }
  }
}

function sponsorRowHtml(data = { name: '', url: '', logoUrl: '' }) {
  const name = escapeHtml(data.name || '');
  const url = escapeHtml(data.url || '');
  const logoUrl = escapeHtml(data.logoUrl || '');
  return `
    <div class="vis-sponsor-row" style="border:1px solid #ddd; border-radius:10px; padding:12px; background:#fafafa;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <strong style="font-size:0.95rem;">協賛エントリ</strong>
        <button type="button" class="btn-danger" style="width:auto; padding:6px 12px;" onclick="removeVisibilitySponsorRow(this)">削除</button>
      </div>
      <div class="form-group" style="margin-bottom:10px;">
        <label>企業・団体名（必須）</label>
        <input type="text" class="vis-sp-name" value="${name}" style="width:100%; box-sizing:border-box;">
      </div>
      <div class="form-group" style="margin-bottom:10px;">
        <label>WebサイトURL（任意）</label>
        <input type="text" class="vis-sp-url" value="${url}" placeholder="https://" style="width:100%; box-sizing:border-box;">
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label>ロゴ画像URL（任意）</label>
        <input type="text" class="vis-sp-logo" value="${logoUrl}" placeholder="/media/assets/..." style="width:100%; box-sizing:border-box;">
      </div>
    </div>`;
}

function addVisibilitySponsorRow(data) {
  const wrap = document.getElementById('vis-sponsors-items');
  if (!wrap) return;
  const holder = document.createElement('div');
  holder.innerHTML = sponsorRowHtml(data || {});
  const row = holder.firstElementChild;
  if (row) wrap.appendChild(row);
}

function removeVisibilitySponsorRow(btn) {
  const row = btn && btn.closest ? btn.closest('.vis-sponsor-row') : null;
  const wrap = document.getElementById('vis-sponsors-items');
  if (!row || !wrap) return;
  row.remove();
  if (!wrap.querySelector('.vis-sponsor-row')) addVisibilitySponsorRow();
}

function collectSponsorRowsFromDom() {
  const rows = document.querySelectorAll('#vis-sponsors-items .vis-sponsor-row');
  const items = [];
  rows.forEach((row) => {
    const name = row.querySelector('.vis-sp-name')?.value?.trim() || '';
    const url = row.querySelector('.vis-sp-url')?.value?.trim() || '';
    const logoUrl = row.querySelector('.vis-sp-logo')?.value?.trim() || '';
    if (name) items.push({ name, url, logoUrl });
  });
  return items;
}

async function saveVisibilityAnniv() {
  try {
    dataCache['anniv-config'] = {
      published: !!document.getElementById('vis-anniv-published')?.checked
    };
    dataCache.anniv = {
      content: document.getElementById('vis-anniv-content')?.value ?? ''
    };
    await api('save-json', { file: 'anniv-config', data: dataCache['anniv-config'] });
    await api('save-json', { file: 'anniv', data: dataCache.anniv });
    alert('10周年記念の設定を保存しました。');
  } catch (e) {
    console.error(e);
    alert(`保存に失敗しました: ${e.message}`);
  }
}

async function saveVisibilitySponsors() {
  try {
    dataCache.sponsors = {
      published: !!document.getElementById('vis-sponsors-published')?.checked,
      intro: document.getElementById('vis-sponsors-intro')?.value ?? '',
      items: collectSponsorRowsFromDom()
    };
    await api('save-json', { file: 'sponsors', data: dataCache.sponsors });
    alert('協賛ページを保存しました。');
    renderVisibilityPanel();
  } catch (e) {
    console.error(e);
    alert(`保存に失敗しました: ${e.message}`);
  }
}

function attachAboutChangeHandlers() {
  ['about-year', 'about-text', 'news-thumbnail-select'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        if (id.startsWith('about')) {
          if (editorState.type !== 'about') editorState.type = 'about';
        }
        setEditorDirty(true);
      });
    }
  });
}