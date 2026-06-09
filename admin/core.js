let auth = { user: '', pass: '' };
let dataCache = {
  news: [],
  works: [],
  about: { history: [], awards: [] },
  anniv: { content: '' },
  'anniv-config': { published: false },
  sponsors: { published: false, intro: '', items: [] },
  trash: []
};
let editorState = { type: null, dirty: false };

function setEditorDirty(flag) {
      editorState.dirty = flag;
      updateEditorStatus();
    }

function updateEditorStatus() {
      const stateLabel = document.getElementById(`${editorState.type}-editor-status`);
      if (!stateLabel) return;
      if (editorState.type) {
        stateLabel.textContent = editorState.dirty ? '編集中 - 保存が必要です' : '編集中 - 保存済み';
        stateLabel.style.display = 'block';
      } else {
        stateLabel.style.display = 'none';
      }
    }

function clearEditorState() {
      editorState.type = null;
      editorState.dirty = false;
      updateEditorStatus();
    }

function closeCurrentEditor() {
      if (!editorState.type) return;
      document.getElementById(`${editorState.type}-editor`).style.display = 'none';
      clearEditorState();
    }

function saveCurrentEditor() {
      if (editorState.type === 'news') return saveNews();
      if (editorState.type === 'works') return saveWork();
      if (editorState.type === 'about') return saveAboutItem();
      return Promise.resolve();
    }

async function confirmLeaveEditor(next) {
      if (!editorState.dirty) return next();
      const saveFirst = confirm('編集中の内容があります。\nOK：保存して移動します\nキャンセル：保存せず移動します');
      if (saveFirst) {
        await saveCurrentEditor();
        next();
      } else {
        editorState.dirty = false;
        closeCurrentEditor();
        next();
      }
    }

function toggleAdminMenu() {
      document.getElementById('admin-tabs').classList.toggle('collapsed');
    }

async function checkAuth() {
      auth.user = document.getElementById('user').value.trim();
      auth.pass = document.getElementById('pass').value;
      const errEl = document.getElementById('login-err');
      errEl.textContent = '';
      try {
        await api('ping'); 
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('cms-screen').style.display = 'flex';
        await Promise.all([loadData('news'), loadData('works'), loadData('about'), loadData('trash')]);
        loadMedia();
      } catch (e) {
        if (e && e.status === 401) {
          errEl.textContent = 'ユーザー名またはパスワードが間違っています。';
        } else if (e && e.status === 404) {
          errEl.textContent = '管理APIに接続できません（/api/admin-core が見つかりません）。Functions のデプロイを確認してください。';
        } else if (e && e.status >= 500) {
          errEl.textContent = `サーバーエラー（${e.status}）。R2バインディング MEDIA_BUCKET の設定を確認してください。`;
        } else {
          errEl.textContent = e && e.message ? e.message : 'ログインに失敗しました。';
        }
      }
    }

async function api(path, body = {}) {
      const res = await fetch(`/api/admin-core`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...auth, ...body, action: path })
      });
      if (!res.ok) {
        let detail = '';
        try {
          const data = await res.json();
          detail = data && data.error ? `: ${data.error}` : '';
        } catch (_) {}
        const err = new Error(`API Error${detail}`);
        err.status = res.status;
        throw err;
      }
      return await res.json();
    }

function escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

function normalizeSponsorsPayload(raw) {
      const o = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
      const items = Array.isArray(o.items) ? o.items : [];
      return {
        published: !!o.published,
        intro: typeof o.intro === 'string' ? o.intro : '',
        items: items
          .filter((it) => it && typeof it === 'object')
          .map((it) => ({
            name: String(it.name || '').trim(),
            url: String(it.url || '').trim(),
            logoUrl: String(it.logoUrl || '').trim()
          }))
          .filter((it) => it.name.length > 0)
      };
    }

async function loadVisibilityBundle() {
      try {
        const [anniv, cfg, sp] = await Promise.all([
          api('get-json', { file: 'anniv' }),
          api('get-json', { file: 'anniv-config' }),
          api('get-json', { file: 'sponsors' })
        ]);
        dataCache.anniv = anniv || { content: '' };
        dataCache['anniv-config'] = cfg || { published: false };
        dataCache.sponsors = normalizeSponsorsPayload(sp);
      } catch (e) {
        console.error('[loadVisibilityBundle]', e);
        dataCache.anniv = dataCache.anniv || { content: '' };
        dataCache['anniv-config'] = dataCache['anniv-config'] || { published: false };
        dataCache.sponsors = dataCache.sponsors || { published: false, intro: '', items: [] };
      }
      if (typeof renderVisibilityPanel === 'function') renderVisibilityPanel();
    }

async function switchTab(event, tab) {
      await confirmLeaveEditor(() => {
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`${tab}-panel`).classList.add('active');
        if (event && event.currentTarget) {
          event.currentTarget.classList.add('active');
        } else if (event && event.target) {
          event.target.classList.add('active');
        }
        loadData(tab);
        document.getElementById('admin-tabs').classList.add('collapsed');
      });
    }

async function loadData(type) {
      try {
        if (type === 'trash') {
          await loadTrash();
          return;
        }
        if (type === 'media') {
          await loadMedia();
          return;
        }
        if (type === 'visibility') {
          await loadVisibilityBundle();
          return;
        }
        const res = await api('get-json', { file: type });
        if (type === 'about') {
          dataCache.about = res || { history: [], awards: [] };
          renderAbout();
          return;
        }
        if (type === 'anniv') {
          dataCache.anniv = res || { content: '' };
          if (typeof renderVisibilityPanel === 'function') renderVisibilityPanel();
          return;
        }
        if (type === 'anniv-config') {
          dataCache['anniv-config'] = res || { published: false };
          if (typeof renderVisibilityPanel === 'function') renderVisibilityPanel();
          return;
        }
        if (type === 'sponsors') {
          dataCache.sponsors = normalizeSponsorsPayload(res);
          if (typeof renderVisibilityPanel === 'function') renderVisibilityPanel();
          return;
        }
        dataCache[type] = res || [];
        renderList(type);
      } catch(e) { 
        if (type === 'about') {
          dataCache.about = { history: [], awards: [] };
          renderAbout();
          return;
        }
        if (type === 'anniv') {
          dataCache.anniv = { content: '' };
          if (typeof renderVisibilityPanel === 'function') renderVisibilityPanel();
          return;
        }
        if (type === 'anniv-config') {
          dataCache['anniv-config'] = { published: false };
          if (typeof renderVisibilityPanel === 'function') renderVisibilityPanel();
          return;
        }
        if (type === 'sponsors') {
          dataCache.sponsors = { published: false, intro: '', items: [] };
          if (typeof renderVisibilityPanel === 'function') renderVisibilityPanel();
          return;
        }
        dataCache[type] = [];
        renderList(type);
      }
    }

async function saveData(type) {
      try {
        console.log(`[saveData] Saving ${type}:`, dataCache[type]);
        await api('save-json', { file: type, data: dataCache[type] });
        console.log(`[saveData] ${type} saved successfully`);
        alert('保存しました。ホームページにも反映されます。');
        if(type === 'about') renderAbout(); else renderList(type);
      } catch (e) {
        console.error(`[saveData Error] Failed to save ${type}:`, e);
        alert(`保存に失敗しました: ${e.message}`);
      }
    }

function renderList(type) {
      const list = document.getElementById(`${type}-list`);
      if (!list) return;
      list.innerHTML = '';
      dataCache[type].forEach(item => {
        const div = document.createElement('div');
        div.className = 'list-item';
        const title = type === 'news' ? `${item.date || '未設定'} | ${item.title}` : `${item.year || '未設定'} | ${item.title}`;
        const safeTitle = escapeHtml(title);
        const extra = type === 'works' ? `
          <div style="margin-top:6px; color:#444; font-size:0.95rem; line-height:1.4;">
            ${escapeHtml(item.story ? (item.story.length > 70 ? `${item.story.slice(0, 70).replace(/\n/g,' ')}...` : item.story.replace(/\n/g,' ')) : '作品概要なし')}
            ${item.awards && item.awards.length ? `<div style="margin-top:8px; color:#b42318; font-size:0.9rem; font-weight:700;">🏆 ${item.awards.length}件の受賞</div>` : ''}
          </div>` : type === 'news' ? `<div style="margin-top:6px; color:#555; font-size:0.95rem;">${escapeHtml(item.tag || '')}</div>` : '';
        div.innerHTML = `
          <div class="list-item-content"><strong>${safeTitle}</strong>${extra}</div>
          <div class="list-item-actions">
            <button class="btn-secondary" onclick="edit${type === 'news'?'News':'Work'}('${item.id}')">編集</button>
            <button class="btn-danger" onclick="deleteItem('${type}', '${item.id}')">削除</button>
          </div>
        `;
        list.appendChild(div);
      });
      if (type === 'news' && typeof refreshNewsTagOptions === 'function') refreshNewsTagOptions();
    }

async function deleteItem(type, id) {
      if(!confirm('本当に削除しますか？')) return;
      const item = dataCache[type].find(i => i.id === id);
      if (item) {
        await moveToTrash(item, type);
        dataCache[type] = dataCache[type].filter(i => i.id !== id);
        saveData(type);
      }
    }

function closeEditor(type) {
      if (editorState.type === type && editorState.dirty) {
        const ok = confirm('本当にキャンセルしますか？内容が消去されます。');
        if (!ok) return;
      }
      document.getElementById(`${type}-editor`).style.display = 'none';
      if (editorState.type === type) clearEditorState();
    }

function attachEditorChangeHandlers(editorId) {
      const editor = document.getElementById(editorId);
      if (!editor) return;
      editor.querySelectorAll('input, textarea, select').forEach(el => {
        el.oninput = () => setEditorDirty(true);
      });
    }

