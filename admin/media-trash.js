const fixedAssetSlots = [
      { id: 'logo', label: 'サイト共通ロゴ', description: 'ヘッダー・ページ上部のロゴ表示用', keyPrefix: 'logo' },
      { id: 'hero', label: 'トップページ背景', description: 'トップページのヒーロー背景画像用', keyPrefix: 'hero-bg' }
    ];

const allowedImageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'];

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
        loadData('sponsors'),
        loadTrash()
      ]);
      alert('復元しました。ホームページにも反映されます。');
    }

async function deleteTrashItem(id) {
      if(!confirm('完全に削除しますか？この操作は元に戻せません。')) return;
      await api('delete-trash', { id });
      await loadTrash();
    }

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
      renderFixedAssets(assets);
      renderSiteInstagramSettings();
    }

async function renderSiteInstagramSettings() {
      let wrap = document.getElementById('site-extra-settings');
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'site-extra-settings';
        wrap.style.marginTop = '28px';
        const anchor = document.getElementById('fixed-assets');
        if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(wrap, anchor.nextSibling);
        else document.body.appendChild(wrap);
      }
      let site = {};
      try {
        site = await api('get-json', { file: 'site' });
      } catch (_) {}
      const cur = site.instagramPermalink || '';
      wrap.innerHTML = `
        <h4 style="margin:0 0 12px; border-bottom:2px solid var(--accent); padding-bottom:5px; display:inline-block;">Instagram 埋め込み（トップページ）</h4>
        <p style="font-size:0.92rem;color:#555;margin-bottom:10px;max-width:720px;line-height:1.55;">
          <strong>公開中の投稿・リール・IGTV</strong>のURLを貼ると、トップページのInstagram欄に公式の埋め込み枠が表示されます。
          プロフィールURL（<code>instagram.com/ユーザー名</code>）のみでは埋め込めないため、その場合は引き続き下のリンクのみ表示されます。
        </p>
        <input type="url" id="site-instagram-url" placeholder="https://www.instagram.com/p/xxxx/" style="width:100%;max-width:560px;padding:10px;margin-bottom:10px;box-sizing:border-box;">
        <div><button type="button" class="btn-secondary" onclick="saveSiteInstagram()">Instagram設定を保存</button></div>`;
      const urlInput = document.getElementById('site-instagram-url');
      if (urlInput) urlInput.value = cur;
    }

async function saveSiteInstagram() {
      const url = document.getElementById('site-instagram-url').value.trim();
      await api('save-json', { file: 'site', data: { instagramPermalink: url } });
      alert('保存しました。トップページを再読み込みすると反映されます。');
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
        try {
          console.log(`[Fixed Asset Upload] Starting upload: ${fileName} to assets folder`);
          const res = await api('upload', { fileName, fileData: reader.result.split(',')[1], contentType: file.type, folder: 'assets' });
          if (!res.ok || !res.url) {
            console.error('[Upload Error]', res);
            return alert(`アップロード失敗: ${res.error || 'Unknown error'}`);
          }
          console.log(`[Fixed Asset Upload Success] URL: ${res.url}`);
          alert(`アップロード完了: ${fileName}`);
          input.value = '';
          loadMedia();
        } catch(e) {
          console.error('[Upload Exception]', e);
          alert(`アップロード失敗: ${e.message || e}`);
        }
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

