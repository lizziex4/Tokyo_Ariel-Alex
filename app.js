import { seedTrip } from './data.js';

const LOCAL_DATA = 'tokyo-mama-trip-data-v1';
const LOCAL_HISTORY = 'tokyo-mama-trip-history-v1';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clone = value => JSON.parse(JSON.stringify(value));
const escapeHtml = (value = '') => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text = escapeHtml;
const categoryInfo = {
  food: {label: '美食餐廳', icon: '♨'}, shopping: {label: '購物逛街',icon: '◇'},
  transport: {label: '交通移動',icon: '➜'}, hotel: {label: '住宿飯店',icon: '⌂'},
  experience: {label: '景點體驗',icon: '✦'}
};
const statusInfo = {
  reserved: {label: '已預約',css: 'reserved'},
  check: {label: '待確認',css: 'check'},
  planned: {label: '一般行程',css: 'planned'}
};
const humanDate = (dateStr, includeYear = false) => {
  if (!dateStr) return '';
  const [year,month,day] = dateStr.split('-');
  return `${includeYear ? `${year}/` : ''}${Number(month)}/${Number(day)}`;
};
const uniqueId = () => (globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(36).slice(2,9)}`);

let trip;
let historyEntries = [];
let selectedDay = 0;
let activeView = 'overview';
let editingId = null;
let toastTimeout;
let writing = false;

function loadLocal() {
  try {
    const data = JSON.parse(localStorage.getItem(LOCAL_DATA) || 'null');
    if (validTrip(data)) return data;
  } catch (e) { console.warn('無法讀取本機行程',e); }
  return clone(seedTrip);
}
function loadHistory() {
  try { const parsed = JSON.parse(localStorage.getItem(LOCAL_HISTORY) || '[]'); return Array.isArray(parsed) ? parsed.slice(0,50) : []; }
  catch { return []; }
}
function validTrip(value) {
  return Boolean(value && typeof value === 'object' && Array.isArray(value.days)
    && value.days.length === 5 && value.days.every(d => d && typeof d.date === 'string' && Array.isArray(d.activities))
    && Array.isArray(value.checklist) && typeof value.generalNote === 'string');
}
function saveLocal() {
  // 兩份都儲存成功才算完成，避免手機容量不足時誤稱已儲存。
  const previousData = localStorage.getItem(LOCAL_DATA);
  const previousHistory = localStorage.getItem(LOCAL_HISTORY);
  try {
    localStorage.setItem(LOCAL_DATA, JSON.stringify(trip));
    localStorage.setItem(LOCAL_HISTORY, JSON.stringify(historyEntries.slice(0, 50)));
    return true;
  } catch (error) {
    console.error('本機儲存失敗', error);
    try {
      if (previousData === null) localStorage.removeItem(LOCAL_DATA);
      else localStorage.setItem(LOCAL_DATA, previousData);
      if (previousHistory === null) localStorage.removeItem(LOCAL_HISTORY);
      else localStorage.setItem(LOCAL_HISTORY, previousHistory);
    } catch { /* 儲存空間不可用，已告知使用者 */ }
    return false;
  }
}
function showToast(message) {
  const node = $('#toast'); node.textContent = message;
  node.classList.add('visible'); clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => node.classList.remove('visible'), 3300);
}
function status(message = '已保存在這台裝置') {
  const node = $('#sync-status');
  node.className = 'sync-status cloud';
  node.innerHTML = `<span class="status-dot"></span>${escapeHtml(message)}`;
}
function requireEdit() {
  if (writing) { showToast('正在儲存上一筆修改，請再試一次。'); return false; }
  return true;
}
function applyChange(base, mutate) {
  const next = clone(base);
  mutate(next);
  if (!validTrip(next)) throw new Error('行程格式不正確，已取消變更。');
  return next;
}
async function commit(label, mutate) {
  if (!requireEdit()) return false;
  writing = true;
  const previousTrip = clone(trip);
  const previousHistory = clone(historyEntries);
  try {
    const next = applyChange(trip, mutate);
    // 第一筆修改前的原始內容也保留一份，才能完整復原。
    if (!historyEntries.length) {
      historyEntries.push({id:uniqueId(),label:'修改前的原始行程',actor:'這台裝置',at:new Date().toISOString(),snapshot:clone(previousTrip)});
    }
    trip = next;
    historyEntries.unshift({id:uniqueId(),label,actor:'這台裝置',at:new Date().toISOString(),snapshot:clone(trip)});
    historyEntries = historyEntries.slice(0,50);
    if (!saveLocal()) throw new Error('本機儲存失敗，請確認是否為無痕模式、儲存空間是否已滿。');
    render();
    status();
    showToast('已儲存在這台裝置。');
    return true;
  } catch (error) {
    trip = previousTrip;
    historyEntries = previousHistory;
    console.error('儲存失敗', error);
    showToast(`儲存失敗：${String(error.message || '請再試一次').slice(0,110)}`);
    return false;
  } finally { writing = false; }
}

function render() {
  renderOverview(); renderSchedule(); renderChecklist(); renderHistory(); renderSettings();
  $$('.view').forEach(el => el.classList.toggle('active',el.id === `${activeView}-view`));
  $$('[data-view]').forEach(el => {
    el.classList.toggle('active',el.dataset.view === activeView);
    el.setAttribute('aria-current',el.dataset.view === activeView ? 'page' : 'false');
  });
}
function setView(view, dayIndex = null) {
  if (Number.isInteger(dayIndex)) selectedDay = dayIndex;
  activeView = view;
  render(); window.scrollTo({top:0,behavior:'smooth'});
}
function renderOverview() {
  const activities = trip.days.flatMap(d => d.activities);
  const reservedCount = activities.filter(i => i.status === 'reserved').length;
  $('#overview-stats').innerHTML = `
    <div class="stat-card"><div class="stat-icon">◷</div><div><div class="stat-meta">旅行日期</div><div class="stat-value">1/7（四）— 1/11（一）</div></div></div>
    <div class="stat-card"><div class="stat-icon">⌂</div><div><div class="stat-meta">下榻飯店</div><div class="stat-value">六本木雷姆飯店</div></div></div>
    <div class="stat-card"><div class="stat-icon">✓</div><div><div class="stat-meta">行程安排</div><div class="stat-value">${activities.length} 個安排 · ${reservedCount} 項已預約</div></div></div>`;
  $('#overview-days').innerHTML = trip.days.map((d,index) => `<button class="overview-day" type="button" data-open-day="${index}"><span class="od-label">DAY 0${index+1}</span><span class="od-date">${humanDate(d.date)}</span><span class="od-weekday">星期${text(d.weekday)}</span><span class="od-title">${text(d.shortTitle)}</span><span class="od-arrow">↗</span></button>`).join('');
  const plans = trip.days.flatMap((d,di) => d.activities.filter(a => a.status !== 'planned').map(a => ({...a,dayIndex:di, date:d.date})));
  $('#reservations').innerHTML = plans.length ? plans.slice(0,7).map(a => `<div class="reservation-row"><div class="reservation-top"><div><div class="reservation-name">${text(a.title)}</div><div class="reservation-sub">${humanDate(a.date)}　${text(a.start)} ${a.location ? '· '+text(a.location) : ''}</div></div><span class="pill ${statusInfo[a.status]?.css || 'planned'}">${statusInfo[a.status]?.label || '一般行程'}</span></div></div>`).join('') : '<div class="empty-state">目前沒有預約項目</div>';
  $('#notice-list').innerHTML = (trip.notices || []).map(n => `<div class="notice-row"><span class="notice-icon">✧</span><div><div class="notice-title">${text(n.title)}</div><div class="notice-body">${text(n.body)}</div>${/^https:\/\//.test(n.source || '') ? `<a href="${text(n.source)}" target="_blank" rel="noopener noreferrer">查看參考資訊 ↗</a>` : ''}</div></div>`).join('');
}
function renderSchedule() {
  selectedDay = Math.max(0,Math.min(selectedDay,trip.days.length-1));
  $('#day-tabs').innerHTML = trip.days.map((d,i) => `<button role="tab" aria-selected="${i === selectedDay}" type="button" data-select-day="${i}" class="day-tab ${i === selectedDay?'selected':''}"><div class="tab-overline">DAY 0${i+1}</div><div class="tab-date">${humanDate(d.date)}</div><div class="tab-sub">星期${text(d.weekday)} · ${text(d.shortTitle)}</div></button>`).join('');
  const day = trip.days[selectedDay];
  $('#day-head').innerHTML = `<h3>${text(day.title)}</h3><p>${text(day.subtitle)}</p>`;
  const activities = [...day.activities].sort((a,b) => (a.start || '').localeCompare(b.start || ''));
  $('#timeline').innerHTML = activities.length ? activities.map(activityCard).join('') : `<div class="empty-state">今天還沒有行程，可以按「新增行程」安排。</div>`;
}
function activityCard(a) {
  const category = categoryInfo[a.category] || categoryInfo.experience;
  const badge = statusInfo[a.status] || statusInfo.planned;
  return `<article class="timeline-item ${a.done?'is-done':''}">
    <div class="timeline-marker"></div><div class="timeline-time">${text(a.start)}${a.end?`<span class="time-end">至 ${text(a.end)}</span>`:''}</div>
    <div class="event-card ${a.done?'is-done':''}"><div class="event-main"><div class="event-category-icon category-${text(a.category)}" aria-hidden="true">${category.icon}</div><div class="event-text"><div class="event-title-line"><h4 class="event-title">${text(a.title)}</h4>${a.status !== 'planned'?`<span class="pill ${badge.css}">${badge.label}</span>`:''}</div>${a.location?`<div class="event-location">⌖ ${text(a.location)}</div>`:''}</div></div>
    ${a.description ? `<p class="event-desc">${text(a.description)}</p>` : ''}${a.tip ? `<div class="event-tip">✳　${text(a.tip)}</div>` : ''}
    <div class="event-footer"><label class="check-done"><input type="checkbox" data-done="${text(a.id)}" ${a.done?'checked':''}> 已完成</label><div class="event-actions">${(a.mapsQuery || a.location) ? `<a class="link-button" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.mapsQuery || a.location)}">⌖ Google 地圖 ↗</a>` : ''}<button class="link-button edit-link" type="button" data-edit="${text(a.id)}">✎ 編輯行程</button></div></div></div></article>`;
}
function renderChecklist() {
  const done = trip.checklist.filter(t => t.done).length;
  $('#check-progress').textContent = `${done}/${trip.checklist.length} 完成`;
  $('#check-items').innerHTML = trip.checklist.map(t => `<div class="task-row ${t.done?'done':''}"><input type="checkbox" id="check-${text(t.id)}" data-task="${text(t.id)}" ${t.done?'checked':''}><label for="check-${text(t.id)}">${text(t.label)}</label><button class="task-remove" type="button" data-task-delete="${text(t.id)}" aria-label="刪除${text(t.label)}">×</button></div>`).join('') || '<div class="empty-state">待辦都完成了，可以再新增一項。</div>';
  const note = $('#general-note');
  if (document.activeElement !== note) note.value = trip.generalNote;
}
function renderHistory() {
  $('#history-list').innerHTML = historyEntries.length ? historyEntries.slice(0,60).map(h => {
    const displayDate = h.at?.toDate ? h.at.toDate() : new Date(h.at || Date.now());
    const dateText = Number.isNaN(displayDate.getTime()) ? '時間記錄中' : displayDate.toLocaleString('zh-TW', {timeZone:'Asia/Tokyo',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
    return `<div class="history-row"><span class="history-mark">↺</span><div class="history-text"><strong>${text(h.label || '更新行程')}</strong><small>${text(h.actor || '家人')} · ${text(dateText)}（日本時間）</small></div><button class="history-restore" type="button" data-restore="${text(h.id)}">還原此版</button></div>`;
  }).join('') : `<div class="empty-state">還沒有修改紀錄。第一次修改後就會出現在這裡。</div>`;
}
function renderSettings() {
  $('#sync-explanation').textContent = '所有修改都儲存在目前手機的這個瀏覽器，不用帳號、也不會傳到其他人的裝置。重新開啟相同網址，就能接著編輯。';
  $('#user-summary').textContent = `目前共有 ${trip.days.reduce((sum,d)=>sum+d.activities.length,0)} 項行程，保留 ${historyEntries.length} 筆版本紀錄。`;
}

function openEditor(id = null) {
  if (!requireEdit()) return;
  editingId = id;
  const form = $('#editor-form');
  form.reset();
  const day = trip.days[selectedDay];
  form.elements.date.innerHTML = trip.days.map(d => `<option value="${text(d.date)}">${humanDate(d.date)}（${text(d.weekday)}）</option>`).join('');
  let itemData = null;
  if (id) {
    for (const d of trip.days) { itemData = d.activities.find(a=>a.id===id); if(itemData){break;} }
  }
  $('#dialog-title').textContent = itemData ? '編輯行程' : '新增行程';
  $('#delete-event').hidden = !itemData;
  const entry = itemData || {date:day.date,start:'10:00',end:'',category:'shopping',title:'',location:'',description:'',tip:'',mapsQuery:'',status:'planned'};
  for (const name of ['title','location','start','end','category','description','tip','mapsQuery','status']) form.elements[name].value = entry[name] || '';
  form.elements.date.value = itemData ? trip.days.find(d=>d.activities.some(a=>a.id===id)).date : day.date;
  $('#event-dialog').showModal();
  setTimeout(() => form.elements.title.focus(), 50);
}
function closeEditor() { $('#event-dialog').close(); editingId = null; }
function findItem(data,id) {
  for (const day of data.days) { const index=day.activities.findIndex(a=>a.id===id); if(index>=0) return {day,index, item:day.activities[index]}; }
  return null;
}
function attachEvents() {
  document.addEventListener('click',async event => {
    const viewControl = event.target.closest('[data-view]');
    if (viewControl) { setView(viewControl.dataset.view); return; }
    const dayCard = event.target.closest('[data-open-day]');
    if (dayCard) { setView('schedule',Number(dayCard.dataset.openDay)); return; }
    const tab = event.target.closest('[data-select-day]');
    if (tab) { selectedDay=Number(tab.dataset.selectDay); renderSchedule(); return; }
    if (event.target.closest('[data-add]')) {openEditor();return;}
    const edit = event.target.closest('[data-edit]');
    if (edit) {openEditor(edit.dataset.edit); return;}
    const taskDelete = event.target.closest('[data-task-delete]');
    if (taskDelete) {
      if (!requireEdit()) return;
      const id = taskDelete.dataset.taskDelete;
      const task = trip.checklist.find(t=>t.id===id);
      if (task && confirm(`要刪除「${task.label}」這項待辦嗎？`)) await commit(`刪除待辦：${task.label}`, data => {data.checklist=data.checklist.filter(t=>t.id!==id);});
      return;
    }
    const restore = event.target.closest('[data-restore]');
    if (restore) {
      const h = historyEntries.find(entry => entry.id === restore.dataset.restore);
      if (!h?.snapshot || !validTrip(h.snapshot)) {showToast('找不到這個版本的備份。');return;}
      if (!confirm(`確定要將整份行程還原為「${h.label}」當時的版本嗎？\n\n還原前的版本也會另存成一筆紀錄。`)) return;
      const snapshot=clone(h.snapshot);
      await commit(`還原版本：${h.label}`, data => {Object.keys(data).forEach(key => delete data[key]);Object.assign(data,clone(snapshot));});
      return;
    }
  });
  document.addEventListener('change',async event => {
    const done = event.target.closest('[data-done]');
    if(done) { const id=done.dataset.done; const value=done.checked; await commit(`${value?'完成':'取消完成'}行程：${findItem(trip,id)?.item.title || '行程'}`,data => {const found=findItem(data,id);if(found)found.item.done=value;});return; }
    const task = event.target.closest('[data-task]');
    if(task) {const id=task.dataset.task,value=task.checked;await commit(`${value?'完成':'取消完成'}待辦：${trip.checklist.find(t=>t.id===id)?.label || '待辦'}`,data=>{const found=data.checklist.find(t=>t.id===id);if(found)found.done=value;});return;}
  });
  $('#editor-form').addEventListener('submit',async e => {
    e.preventDefault();
    const fields = new FormData(e.currentTarget);
    const obj = Object.fromEntries(fields.entries());
    obj.title = (obj.title || '').trim(); obj.location=(obj.location||'').trim();
    if (!obj.title || !obj.start || !trip.days.some(d => d.date === obj.date)) {showToast('請填寫行程名稱、日期與開始時間。');return;}
    if (obj.end && obj.end < obj.start) {showToast('結束時間不能早於開始時間。');return;}
    const existedId = editingId;
    const id = existedId || uniqueId();
    const priorDayIndex = trip.days.findIndex(d=>d.activities.some(a=>a.id===existedId));
    const ok = await commit(`${existedId?'修改':'新增'}行程：${obj.title}`,data => {
      let wasDone = false;
      if (existedId) { const old=findItem(data,existedId); if(old){wasDone=old.item.done;old.day.activities.splice(old.index,1);} }
      const destination = data.days.find(d=>d.date===obj.date);
      if (!destination) throw new Error('找不到指定日期');
      destination.activities.push({id,start:obj.start,end:obj.end,title:obj.title,location:obj.location,category:obj.category,description:obj.description,tip:obj.tip,mapsQuery:obj.mapsQuery||obj.location,status:obj.status,done:wasDone});
    });
    if (ok) {selectedDay=trip.days.findIndex(d=>d.date===obj.date);closeEditor();setView('schedule',selectedDay);}
  });
  $('#delete-event').addEventListener('click',async () => {
    if (!editingId) return;
    const found=findItem(trip,editingId);
    if(!found)return;
    if(!confirm(`確定要刪除「${found.item.title}」嗎？\n刪除後仍可透過修改紀錄還原。`))return;
    const id=editingId;
    const ok=await commit(`刪除行程：${found.item.title}`,data=>{const locate=findItem(data,id);if(locate)locate.day.activities.splice(locate.index,1);});
    if(ok)closeEditor();
  });
  $('#close-editor').addEventListener('click',closeEditor);
  $('#cancel-editor').addEventListener('click',closeEditor);
  $('#event-dialog').addEventListener('click',event=>{if(event.target===event.currentTarget)closeEditor();});
  $('#add-task-form').addEventListener('submit',async e=>{
    e.preventDefault(); const input=e.currentTarget.elements.task; const value=input.value.trim(); if(!value)return;
    const id=uniqueId(); const ok=await commit(`新增待辦：${value}`, data=>data.checklist.push({id,label:value,done:false}));
    if(ok)input.value='';
  });
  $('#save-note').addEventListener('click',async () => {
    const value=$('#general-note').value;
    await commit('更新旅行備忘錄',data=>{data.generalNote=value;});
  });
  $('#share-button').addEventListener('click',shareLink);
  $('#top-share').addEventListener('click',shareBackup);
  $('#share-backup-button').addEventListener('click',shareBackup);
  $('#share-text-button').addEventListener('click',shareTextTrip);
  $('#export-button').addEventListener('click',exportBackup);
  $('#import-file').addEventListener('change',importBackup);
  $('#print-button').addEventListener('click',printTrip);
}

async function shareLink() {
  const url = window.location.href.split('#')[0].split('?')[0];
  try {
    await navigator.clipboard.writeText(url);
    showToast('已複製網站連結。提醒：不包含這台手機的修改。');
  } catch { window.prompt('複製網址（網址不包含已修改的行程）：',url); }
}
function buildBackup() {
  return {
    format:'tokyo-journal-v2',
    exportedAt:new Date().toISOString(),
    trip:clone(trip),
    history:clone(historyEntries)
  };
}
function backupFile() {
  const json = JSON.stringify(buildBackup(), null, 2);
  const fileName = `東京五天四夜-完整行程與修改紀錄-${new Date().toISOString().slice(0,10)}.json`;
  return new File([json], fileName, {type:'application/json'});
}
function downloadFile(file) {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  document.body.appendChild(anchor);
  anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}
function exportBackup() {
  try {
    downloadFile(backupFile());
    showToast('已下載完整備份。可在 LINE 用「檔案」傳送給家人。');
  } catch(error) { console.error(error); showToast('下載失敗，請再試一次。'); }
}
async function shareBackup() {
  const file = backupFile();
  if (navigator.share && navigator.canShare?.({files:[file]})) {
    try {
      await navigator.share({files:[file],title:'東京五天四夜・完整行程備份',text:'這是我修改後的東京行程，包含修改紀錄。'});
    } catch(error) {
      if (error.name !== 'AbortError') { console.error(error); showToast('分享失敗，請改用下載備份。'); }
    }
  } else {
    downloadFile(file);
    showToast('已下載 JSON 檔，請到 LINE 聊天室用「檔案」傳送。');
  }
}
function buildTextTrip() {
  const lines = [
    '東京五天四夜｜2027/1/7－1/11',
    `匯出日期：${new Date().toLocaleString('zh-TW')}`,
    `住宿：${trip.hotel || '未填寫'}`,
    '',
  ];
  for (const [index, day] of trip.days.entries()) {
    lines.push(`━━━━━━━━━━ DAY ${index + 1}｜${humanDate(day.date,true)}（${day.weekday}） ━━━━━━━━━━`);
    lines.push(day.title || '');
    const acts = [...day.activities].sort((a,b)=>(a.start||'').localeCompare(b.start||''));
    for (const activity of acts) {
      const meta = activity.status==='reserved'?'【已預約】':activity.status==='check'?'【待確認】':'';
      lines.push(`${activity.start || '時間未定'}${activity.end ? '–'+activity.end : ''}｜${activity.title || ''} ${meta}${activity.done?'（已完成）':''}`);
      if (activity.location) lines.push(`地點：${activity.location}`);
      if (activity.description) lines.push(`安排：${activity.description}`);
      if (activity.tip) lines.push(`提醒：${activity.tip}`);
      lines.push('');
    }
  }
  lines.push('━━━━━━━━━━ 行前待辦 ━━━━━━━━━━');
  for (const task of trip.checklist) lines.push(`${task.done?'[完成]':'[待辦]'} ${task.label}`);
  lines.push('', '━━━━━━━━━━ 旅行備忘錄 ━━━━━━━━━━', trip.generalNote || '（無）','');
  lines.push('━━━━━━━━━━ 修改紀錄（最新在前） ━━━━━━━━━━');
  if (historyEntries.length) for (const record of historyEntries) {
    const time = record.at ? new Date(record.at).toLocaleString('zh-TW') : '';
    lines.push(`• ${time} ${record.label || '更新行程'}`);
  }
  else lines.push('（還沒有修改）');
  return lines.join('\n');
}
async function shareTextTrip() {
  const content = buildTextTrip();
  if (navigator.share) {
    try {
      await navigator.share({title:'東京五天四夜行程（文字版）',text:content});
      return;
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.warn('分享文字失敗，改複製',error);
    }
  }
  try {
    await navigator.clipboard.writeText(content);
    showToast('完整行程文字已複製，可直接貼到 LINE。');
  } catch {
    downloadFile(new File([content], '東京五天四夜-文字版行程.txt', {type:'text/plain;charset=utf-8'}));
    showToast('已下載文字版行程，請分享文字檔。');
  }
}
async function importBackup(e) {
  const file = e.target.files?.[0];
  e.target.value='';
  if (!file) return;
  if (file.size > 6_000_000) { showToast('備份檔太大，請確認檔案。'); return; }
  try {
    const parsed = JSON.parse(await file.text());
    if (!validTrip(parsed.trip) || !['tokyo-journal-v1','tokyo-journal-v2'].includes(parsed.format)) {
      showToast('這不是可識別的東京行程備份檔。'); return;
    }
    if (!confirm('匯入會覆蓋這台裝置目前的行程與待辦，也會以備份檔內的修改紀錄取代現有紀錄。\n\n建議先匯出目前的備份。是否確定匯入？')) return;
    const previousTrip = clone(trip);
    const previousHistory = clone(historyEntries);
    trip=clone(parsed.trip);
    // 兼容舊版匯出的 JSON（不含修改紀錄）。
    historyEntries=Array.isArray(parsed.history) ? parsed.history.filter(h=>h && typeof h.label==='string' && validTrip(h.snapshot)).slice(0,49) : [];
    historyEntries.unshift({id:uniqueId(),label:'從檔案匯入行程',actor:'這台裝置',at:new Date().toISOString(),snapshot:clone(trip)});
    if (!saveLocal()) {
      trip=previousTrip; historyEntries=previousHistory;
      throw new Error('手機儲存空間不足，匯入已取消。');
    }
    selectedDay=0;render();setView('overview');status();showToast('匯入完成，已保留備份內的修改紀錄。');
  } catch(error) {console.error(error);showToast(`匯入失敗：${String(error.message || '檔案格式錯誤').slice(0,70)}`);}
}
function printTrip() {
  const printable = $('#print-all');
  printable.innerHTML = `<header><h1>東京五天四夜・完整行程</h1><p>2027 年 1 月 7 日至 11 日</p></header>` + trip.days.map((day,index)=>
    `<section class="print-day"><h2>DAY ${index+1}｜${humanDate(day.date,true)}（星期${text(day.weekday)}）｜${text(day.title)}</h2>` +
    [...day.activities].sort((a,b)=>(a.start||'').localeCompare(b.start||'')).map(a=>
      `<div class="print-activity"><strong>${text(a.start)}${a.end ? '–'+text(a.end):''}　${text(a.title)}</strong>`+
      `${a.status==='reserved'?'〈已預約〉':a.status==='check'?'〈待確認〉':''}`+
      `${a.location?`<p>地點：${text(a.location)}</p>`:''}`+
      `${a.description?`<p>${text(a.description)}</p>`:''}`+
      `${a.tip?`<p>提醒：${text(a.tip)}</p>`:''}</div>`
    ).join('')+`</section>`
  ).join('');
  window.print();
}

trip=loadLocal();
historyEntries=loadHistory();
attachEvents();render();status();
if ('serviceWorker' in navigator && location.protocol==='https:') {
  navigator.serviceWorker.register('./sw.js').catch(console.warn);
}
