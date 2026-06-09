    let auth = { user: '', pass: '' };
    let dataCache = {
      news: [],
      works: [],
      about: { history: [], awards: [] },
      anniv: { content: '' },
      'anniv-config': { published: false },
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
      if (editorState.type === 'anniv') return saveAnnivContent();
      if (editorState.type === 'anniv-config') return saveAnnivConfig();
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

    // メニューの開閉
    function toggleAdminMenu() {
      document.getElementById('admin-tabs').classList.toggle('collapsed');
    }

    async function checkAuth() {
      auth.user = document.getElementById('user').value;
      auth.pass = document.getElementById('pass').value;
      try {
        await api('ping'); 
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('cms-screen').style.display = 'flex';
        await Promise.all([loadData('news'), loadData('works'), loadData('about'), loadData('anniv'), loadData('anniv-config'), loadData('trash')]);
        loadMedia();
      } catch(e) { document.getElementById('login-err').textContent = 'ユーザー名またはパスワードが間違っています。'; }
    }

    async function api(path, body = {}) {
      const res = await fetch(`/api/admin-core`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...auth, ...body, action: path })
      });
      if(!res.ok) throw new Error('API Error');
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
        const res = await api('get-json', { file: type });
        if (type === 'about') {
          dataCache.about = res || { history: [], awards: [] };
          renderAbout();
          return;
        }
        if (type === 'anniv') {
          dataCache.anniv = res || { content: '' };
          renderAnnivContent();
          return;
        }
        if (type === 'anniv-config') {
          dataCache['anniv-config'] = res || { published: false };
          renderAnnivConfig();
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
          renderAnnivContent();
          return;
        }
        if (type === 'anniv-config') {
          dataCache['anniv-config'] = { published: false };
          renderAnnivConfig();
          return;
        }
        dataCache[type] = [];
        renderList(type);
      }
    }

    async function saveData(type) {
      await api('save-json', { file: type, data: dataCache[type] });
      alert('保存しました。ホームページにも反映されます。');
      if(type === 'about') renderAbout(); else renderList(type);
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

    async function moveToTrash(item, type, label) {
      const record = {
        id: Date.now().toString(),
        type,
        label: label || item.title || item.year || item.date || '削除済み',
        deletedAt: new Date().toISOString(),
        payload: item
      };
      await api('move-to-trash', { item: record, type: record.type, label: record.label });
      dataCache.trash.unshift(record);
      renderTrash();
    }

    async function deleteAboutItem(index, target) {
      const list = target === 'history' ? dataCache.about.history : dataCache.about.awards;
      const item = list[index];
      if (!item) return;
      if(!confirm('この項目を本当に削除しますか？')) return;
      const type = target === 'history' ? 'about-history' : 'about-awards';
      await moveToTrash(item, type, `${item.year} ${item.text || item.content}`);
      list.splice(index, 1);
      saveAbout();
    }

    async function loadTrash() {
      const res = await api('get-trash');
      dataCache.trash = res || [];
      renderTrash();
    }

    function renderTrash() {
      const list = document.getElementById('trash-list');
      list.innerHTML = '';
      dataCache.trash.forEach(item => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
          <div class="list-item-content">
            <strong>${item.label}</strong><br>
            <span style="color:#666; font-size:0.95rem;">タイプ: ${item.type} / 削除日時: ${new Date(item.deletedAt).toLocaleString()}</span>
          </div>
          <div class="list-item-actions">
            <button class="btn-secondary" onclick="restoreTrash('${item.id}')">復元</button>
            <button class="btn-danger" onclick="deleteTrashItem('${item.id}')">完全削除</button>
          </div>
        `;
        list.appendChild(div);
      });
    }

    async function restoreTrash(id) {
      await api('restore-trash', { id });
      // 復元後、最新データを取得してキャッシュを更新し、リストを再描画する
      await Promise.all([
        loadData('news'),
        loadData('works'),
        loadData('about'),
        loadData('anniv'),
        loadData('anniv-config'),
        loadTrash()
      ]);
      alert('復元しました。ホームページにも反映されます。');
    }

    async function deleteTrashItem(id) {
      if(!confirm('完全に削除しますか？この操作は元に戻せません。')) return;
      await api('delete-trash', { id });
      await loadTrash();
    }

    // 記事画面からのアップロード機能
    async function inlineUpload(inputId, targetInputId, folder) {
      const file = document.getElementById(inputId).files[0];
      if(!file) return alert('ファイルを選択してください');
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await api('upload', { fileName: file.name, fileData: reader.result.split(',')[1], contentType: file.type, folder });
          document.getElementById(targetInputId).value = res.url;
          alert('アップロードし、URLを設定しました！');
          document.getElementById(inputId).value = ''; // 選択クリア
        } catch(e) { alert('アップロード失敗'); }
      };
      reader.readAsDataURL(file);
    }

    async function editNews(id) {
      await confirmLeaveEditor(() => {
        editorState.type = 'news';
        setEditorDirty(false);
        document.getElementById('news-editor').style.display = 'block';
        const item = id ? dataCache.news.find(i => i.id === id) : { id: Date.now().toString(), title: '', date: new Date().toISOString().split('T')[0], tag: 'お知らせ', image: '', body: '', pinned: false };
        document.getElementById('news-id').value = item.id;
        document.getElementById('news-title').value = item.title;
        document.getElementById('news-date').value = item.date;
        document.getElementById('news-tag').value = item.tag || 'お知らせ';
        document.getElementById('news-image').value = item.image || '';
        document.getElementById('news-body').value = item.body || '';
        document.getElementById('news-pinned').checked = item.pinned;
        attachEditorChangeHandlers('news-editor');
      });
    }

    async function saveNews() {
      const id = document.getElementById('news-id').value;
      const item = {
        id, title: document.getElementById('news-title').value,
        date: document.getElementById('news-date').value,
        tag: document.getElementById('news-tag').value,
        image: document.getElementById('news-image').value,
        body: document.getElementById('news-body').value,
        pinned: document.getElementById('news-pinned').checked
      };
      const idx = dataCache.news.findIndex(i => i.id === id);
      if(idx >= 0) dataCache.news[idx] = item; else dataCache.news.unshift(item);
      dataCache.news.sort((a,b) => new Date(b.date) - new Date(a.date));
      await saveData('news');
      closeEditor('news');
      clearEditorState();
    }

    async function editWork(id) {
      await confirmLeaveEditor(() => {
        editorState.type = 'works';
        setEditorDirty(false);
        document.getElementById('works-editor').style.display = 'block';
        const item = id ? dataCache.works.find(i => i.id === id) : { id: Date.now().toString(), year: '', title: '', story: '', body: '', image: '', awards: [] };
        document.getElementById('work-id').value = item.id;
        document.getElementById('work-year').value = item.year;
        document.getElementById('work-title').value = item.title;
        document.getElementById('work-story').value = item.story || '';
        document.getElementById('work-body').value = item.body || '';
        document.getElementById('work-image').value = item.image || '';
        document.getElementById('work-awards').value = (item.awards||[]).join(', ');
        attachEditorChangeHandlers('works-editor');
      });
    }

    async function saveWork() {
      const id = document.getElementById('work-id').value;
      const awardsStr = document.getElementById('work-awards').value;
      const item = {
        id, year: document.getElementById('work-year').value,
        title: document.getElementById('work-title').value,
        story: document.getElementById('work-story').value,
        body: document.getElementById('work-body').value,
        image: document.getElementById('work-image').value,
        awards: awardsStr ? awardsStr.split(',').map(s=>s.trim()).filter(s=>s!=='') : []
      };
      const idx = dataCache.works.findIndex(i => i.id === id);
      if(idx >= 0) dataCache.works[idx] = item; else dataCache.works.unshift(item);
      dataCache.works.sort((a,b) => b.year - a.year);
      await saveData('works');
      closeEditor('works');
      clearEditorState();
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

    function renderAbout() {
      if(!dataCache.about.history) dataCache.about.history = [];
      if(!dataCache.about.awards) dataCache.about.awards = [];
      
      const renderArray = (arr, containerId, target, phYear, phText) => {
        const c = document.getElementById(containerId);
        c.innerHTML = '';
        arr.forEach((item, i) => {
          c.innerHTML += `
            <div class="array-item" data-index="${i}">
              <input type="text" class="ayear" value="${escapeHtml(item.year)}" placeholder="${phYear}" style="flex:1; min-width:0;">
              <textarea class="atext" placeholder="${phText}" style="flex:3; min-width:0;">${escapeHtml(String(item.text || item.content || '').replace(/<br\s*\/?>/gi, '\n').replace(/\n/g, '↵\n'))}</textarea>
              <button class="btn-danger" onclick="deleteAboutItem(${i}, '${target}')">×</button>
            </div>`;
        });
      };
      renderArray(dataCache.about.history, 'about-history-list', 'history', '年 (例: 2003年)', '出来事');
      renderArray(dataCache.about.awards, 'about-awards-list', 'awards', '年・作品名', '賞の名前');
      attachAboutChangeHandlers();
    }

    function addAboutItem(target) {
      document.getElementById(`about-${target}-list`).innerHTML += `
        <div class="array-item">
          <input type="text" class="ayear" placeholder="${target==='history'?'年':'年・作品名'}" style="flex:1;">
          <textarea class="atext" placeholder="${target==='history'?'出来事':'賞の名前'}" style="flex:3;"></textarea>
          <button class="btn-danger" onclick="this.parentElement.remove()">×</button>
        </div>`;
    }

    let currentAddTarget = '';

    function showAddForm(target) {
      if (editorState.type !== 'about') {
        editorState.type = 'about';
      }
      setEditorDirty(false);
      currentAddTarget = target;
      document.getElementById('form-title').textContent = target === 'history' ? '沿革を追加' : '受賞歴を追加';
      document.getElementById('add-year').placeholder = target === 'history' ? '年 (例: 2003年)' : '年・作品名';
      document.getElementById('add-text').placeholder = target === 'history' ? '出来事' : '賞の名前';
      document.getElementById('add-year').value = '';
      document.getElementById('add-text').value = '';
      document.getElementById('add-form').style.display = 'block';
      attachAboutChangeHandlers();
    }

    function addItem() {
      const year = document.getElementById('add-year').value;
      const text = document.getElementById('add-text').value.replace(/↵/g, '');
      if (!year || !text) return alert('年と内容を入力してください');
      const item = currentAddTarget === 'history' ? { year, content: text } : { year, text };
      dataCache.about[currentAddTarget].push(item);
      renderAbout();
      hideAddForm();
      setEditorDirty(true);
    }

    function hideAddForm() {
      const hasInput = document.getElementById('add-year').value.trim() || document.getElementById('add-text').value.trim();
      if (hasInput) {
        const ok = confirm('本当にキャンセルしますか？内容が消去されます。');
        if (!ok) return;
      }
      document.getElementById('add-form').style.display = 'none';
    }

    async function saveAbout() {
      const getArray = (containerId) => {
        return Array.from(document.getElementById(containerId).children).map(div => ({
          year: div.querySelector('.ayear').value,
          [containerId.includes('history') ? 'content' : 'text']: div.querySelector('.atext').value.replace(/↵/g, '')
        })).filter(i => i.year || (i.content || i.text));
      };
      dataCache.about.history = getArray('about-history-list');
      dataCache.about.awards = getArray('about-awards-list');
      await saveData('about');
      clearEditorState();
    }

    function renderAnnivConfig() {
      const config = dataCache['anniv-config'] || { published: false };
      const checkbox = document.getElementById('anniv-published');
      if (checkbox) checkbox.checked = !!config.published;
    }

    function renderAnnivContent() {
      const anniv = dataCache.anniv || { content: '' };
      const content = document.getElementById('anniv-content');
      if (content) content.value = anniv.content || '';
    }

    async function saveAnnivConfig() {
      const published = document.getElementById('anniv-published')?.checked || false;
      dataCache['anniv-config'] = { published };
      await saveData('anniv-config');
      clearEditorState();
    }

    async function editAnnivContent() {
      await confirmLeaveEditor(() => {
        editorState.type = 'anniv';
        setEditorDirty(false);
        document.getElementById('anniv-editor').style.display = 'block';
        renderAnnivContent();
        attachEditorChangeHandlers('anniv-editor');
      });
    }

    async function saveAnnivContent() {
      const content = document.getElementById('anniv-content').value;
      dataCache.anniv = { content };
      await saveData('anniv');
      closeEditor('anniv');
      clearEditorState();
    }

    function attachAboutChangeHandlers() {
      document.querySelectorAll('#about-history-list .ayear, #about-history-list .atext, #about-awards-list .ayear, #about-awards-list .atext').forEach(el => {
        el.oninput = () => {
          if (editorState.type !== 'about') editorState.type = 'about';
          setEditorDirty(true);
        };
        if (el.tagName.toLowerCase() === 'textarea') {
          el.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
              e.preventDefault();
              const start = this.selectionStart;
              const end = this.selectionEnd;
              const val = this.value;
              this.value = val.substring(0, start) + '↵\n' + val.substring(end);
              this.selectionStart = this.selectionEnd = start + 2;
              if (editorState.type !== 'about') editorState.type = 'about';
              setEditorDirty(true);
            }
          });
        }
      });
      ['add-year', 'add-text'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.oninput = () => {
            if (editorState.type !== 'about') editorState.type = 'about';
            setEditorDirty(true);
          };
          if (el.tagName.toLowerCase() === 'textarea') {
            el.addEventListener('keydown', function(e) {
              if (e.key === 'Enter') {
                e.preventDefault();
                const start = this.selectionStart;
                const end = this.selectionEnd;
                const val = this.value;
                this.value = val.substring(0, start) + '↵\n' + val.substring(end);
                this.selectionStart = this.selectionEnd = start + 2;
                if (editorState.type !== 'about') editorState.type = 'about';
                setEditorDirty(true);
              }
            });
          }
        }
      });
    }

    // 固定画像のアップロードと一覧
    const fixedAssetSlots = [
      { id: 'logo', label: 'サイト共通ロゴ', description: 'ヘッダー・ページ上部のロゴ表示用', keyPrefix: 'logo' },
      { id: 'hero', label: 'トップページ背景', description: 'トップページのヒーロー背景画像用', keyPrefix: 'hero-bg' }
    ];
    const allowedImageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'];

    function getFileExtension(name) {
      return name.split('.').pop().toLowerCase();
    }

    function isAllowedImageFile(name) {
      const ext = getFileExtension(name);
      return allowedImageExtensions.includes(ext);
    }

    function isFixedAssetKey(key) {
      return /^assets\/(logo|hero-bg)\./.test(String(key || ''));
    }

    function pickNewestFixed(files, keyPrefix) {
      const p = `assets/${keyPrefix}.`;
      const matches = files.filter((f) => f.key.startsWith(p));
      if (!matches.length) return null;
      matches.sort((a, b) => {
        const ta = new Date(a.uploaded || 0).getTime();
        const tb = new Date(b.uploaded || 0).getTime();
        if (tb !== ta) return tb - ta;
        return b.key.localeCompare(a.key);
      });
      return matches[0];
    }

    async function renderFixedAssets(files) {
      const container = document.getElementById('fixed-assets');
      container.innerHTML = '';
      fixedAssetSlots.forEach(slot => {
        const current = pickNewestFixed(files, slot.keyPrefix);
        const url = current ? encodeURI(`/media/${current.key}`) : '';
        container.innerHTML += `
          <div class="list-item" style="align-items:flex-start; flex-wrap:wrap;">
            <div style="flex:1; min-width:220px;">
              <strong>${slot.label}</strong>
              <p style="margin:6px 0 0; color:#555; font-size:0.9rem;">${slot.description}</p>
              <p style="margin:6px 0 0; color:#777; font-size:0.85rem;">対応拡張子: ${allowedImageExtensions.join(', ')}</p>
            </div>
            <div style="flex:1.5; min-width:250px; display:flex; flex-direction:column; gap:10px;">
              <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                <input type="file" id="fixed-${slot.id}-file" style="flex:1; min-width:180px;">
                <button class="btn-secondary" onclick="uploadFixedAsset('${slot.id}')">アップロード</button>
              </div>
              ${url ? `<div style="font-size:0.9rem; color:#333;">現在: <a href="${url}" target="_blank" rel="noopener">${current.key.replace('assets/', '')}</a></div>` : '<div style="font-size:0.9rem; color:#999;">まだ画像が設定されていません</div>'}
              ${url ? `<div style="display:flex; gap:10px; flex-wrap:wrap;"><button class="btn-secondary" style="white-space:nowrap;" onclick="copyHtmlTag('${url}')">HTMLタグをコピー</button><button class="btn-danger" style="white-space:nowrap;" onclick="deleteMedia('${current.key}')">削除</button></div>` : ''}
            </div>
          </div>`;
      });
    }

    async function loadMedia() {
      const folder = document.getElementById('view-folder').value; // 'assets' 固定
      const res = await api('list-files', { folder });
      const list = document.getElementById('media-list');
      const assets = res.files || [];
      await renderFixedAssets(assets);
      list.innerHTML = '';
      assets.forEach((f, i) => {
        const url = encodeURI(`/media/${f.key}`);
        const keyId = `media-rename-${i}`;
        const keyStr = JSON.stringify(f.key);
        const fixed = isFixedAssetKey(f.key);
        list.innerHTML += `
          <div class="list-item" style="flex-direction:row; align-items:center; gap:12px;">
            <img src="${url}" style="width:50px; height:50px; object-fit:cover; border-radius:6px; background:#eee;">
            <div class="list-item-content" style="flex:1; margin-left:15px;">
              <strong>${f.key}</strong>
              <div style="margin:8px 0;"><input type="text" value="${url}" readonly onclick="this.select()" style="padding:6px; font-size:0.9rem; width:100%; margin:0;"></div>
              <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                <input id="${keyId}" type="text" value="${f.key}" style="flex:1; padding:6px; font-size:0.9rem;" ${fixed ? 'readonly' : ''}>
                <button class="btn-secondary" style="white-space:nowrap;" onclick="renameMedia(${keyStr}, '${keyId}')">${fixed ? '固定名' : '名前変更'}</button>
                <button class="btn-secondary" style="white-space:nowrap;" onclick="copyHtmlTag('${url}')">HTMLタグをコピー</button>
              </div>
              ${fixed ? '<div style="margin-top:6px; color:#777; font-size:0.84rem;">※ 固定画像のため、名前変更はできません。</div>' : ''}
            </div>
            <div class="list-item-actions">
              <button class="btn-danger" onclick="deleteMedia('${f.key}')">削除</button>
            </div>
          </div>`;
      });
    }

    async function uploadFixedAsset(slotId) {
      const slot = fixedAssetSlots.find(s => s.id === slotId);
      if (!slot) return;
      const input = document.getElementById(`fixed-${slot.id}-file`);
      const file = input?.files?.[0];
      if (!file) return alert('画像ファイルを選択してください');
      const ext = getFileExtension(file.name);
      if (!allowedImageExtensions.includes(ext)) return alert(`対応していない拡張子です: .${ext}`);
      const fileName = `${slot.keyPrefix}.${ext}`;
      const reader = new FileReader();
      reader.onload = async () => {
        await api('upload', { fileName, fileData: reader.result.split(',')[1], contentType: file.type, folder: 'assets' });
        alert(`アップロード完了: ${fileName}`);
        input.value = '';
        loadMedia();
      };
      reader.readAsDataURL(file);
    }

    async function deleteMedia(key) {
      const fixed = isFixedAssetKey(key);
      const msg = fixed
        ? 'この画像を削除すると、サイトからロゴ／ヒーロー背景が消えます（あとから再アップロードできます）。削除しますか？'
        : '削除しますか？';
      if (!confirm(msg)) return;
      await api('delete-file', { key });
      loadMedia();
    }

    async function renameMedia(oldKey, inputId) {
      if (isFixedAssetKey(oldKey)) return alert('固定画像は名前変更できません。');
      const newKey = document.getElementById(inputId).value.trim();
      if (!newKey) return alert('新しいファイル名を入力してください');
      if (newKey === oldKey) return alert('ファイル名に変更はありません');
      if (!confirm(`ファイル名を「${oldKey}」から「${newKey}」に変更しますか？`)) return;
      await api('rename-file', { oldKey, newKey });
      loadMedia();
    }

    function copyHtmlTag(url) {
      const html = `<img src="${url}" alt="" />`;
      navigator.clipboard.writeText(html).then(() => alert('HTMLタグをコピーしました')); 
    }
