(() => {
  'use strict';

  /*
   * 管理者ページ専用のSupabase設定。
   * 他アプリとの変数名衝突を避けるため quiz_ プレフィックスを使用。
   * Publishable key はブラウザ側で使用する前提のキーです。
   */
  const quiz_supabase_url = 'https://uczkqklqdbzkxerboatx.supabase.co/rest/v1';
  const quiz_supabase_key = 'sb_publishable_3GgBI0FRcfcA7YaN0VWu7A_DpU1jI_k';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  let quiz_questions = [];
  let quiz_finals = [];
  let quiz_active_tab = 'normal';
  let quiz_editing_id = null;
  let quiz_supabase_error = '';

  const quiz_escape = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));

  const quiz_headers = (extra = {}) => ({
    apikey: quiz_supabase_key,
    Authorization: `Bearer ${quiz_supabase_key}`,
    'Content-Type': 'application/json',
    ...extra
  });

  async function quiz_api(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: quiz_headers(options.headers || {}),
      cache: 'no-store'
    });

    const text = await response.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch (_) {}

    if (!response.ok) {
      throw new Error(
        `${response.status}: ${body?.message || body?.hint || text || 'Supabase error'}`
      );
    }
    return body;
  }

  function quiz_normalize_question(row) {
    const choices = [
      row.option1 ?? '',
      row.option2 ?? '',
      row.option3 ?? '',
      row.option4 ?? ''
    ];
    const correctIndex = Number(row.correct_option);
    return {
      ...row,
      choices,
      answer: choices[correctIndex - 1] ?? ''
    };
  }

  async function quiz_load_questions() {
    const rows = await quiz_api(
      `${quiz_supabase_url}/quiz_questions?select=*&order=id.asc`
    );
    return (Array.isArray(rows) ? rows : []).map(quiz_normalize_question);
  }

  async function quiz_load_finals() {
    const response = await fetch('final_races.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`final_races.json の読み込みに失敗しました (${response.status})`);
    }

    const data = await response.json();

    if (Array.isArray(data)) return data;
    if (Array.isArray(data.races)) return data.races;
    if (Array.isArray(data.finalRaces)) return data.finalRaces;
    if (Array.isArray(data.finals)) return data.finals;

    return [];
  }

  function quiz_render_summary() {
    const summary = $('#db-summary');
    if (!summary) return;

    summary.innerHTML = `
      <div class="summary-card">
        <b>${quiz_questions.length}</b><span>通常問題</span>
      </div>
      <div class="summary-card">
        <b>${quiz_finals.length}</b><span>FINAL DB</span>
      </div>
      <div class="summary-card">
        <b>${quiz_questions.filter(q => q.active !== false).length}</b><span>出題中</span>
      </div>
    `;

    const seedButton = $('#seed-questions-btn');
    if (seedButton) {
      seedButton.hidden = quiz_questions.length !== 0;
    }
  }

  function quiz_render_normal() {
    const list = $('#normal-list');
    if (!list) return;

    const search = ($('#search-input')?.value || '').trim().toLowerCase();

    const rows = quiz_questions.filter((q) => {
      const haystack = [
        q.id,
        q.question,
        q.answer,
        q.explanation,
        ...(q.choices || [])
      ].join(' ').toLowerCase();

      return haystack.includes(search);
    });

    if (!rows.length) {
      list.innerHTML = `
        <div class="empty">
          ${quiz_questions.length ? '検索結果がありません。' : '通常問題がありません。'}
        </div>
      `;
      return;
    }

    list.innerHTML = rows.map((q) => {
      const choices = q.choices.map((choice, index) => {
        const correct = String(choice).trim() === String(q.answer).trim();
        return `
          <div class="choice-item ${correct ? 'answer' : ''}">
            <b>${index + 1}.</b> ${quiz_escape(choice)}
          </div>
        `;
      }).join('');

      return `
        <article class="data-card">
          <div class="card-head">
            <div class="card-id">#${quiz_escape(q.id)}</div>
            <div class="card-meta">${q.active === false ? '停止中' : '出題中'}</div>
          </div>

          <div class="card-question">${quiz_escape(q.question)}</div>

          <div class="choice-grid">${choices}</div>

          <div class="answer-tag">
            ANSWER: ${quiz_escape(q.answer)}
          </div>

          <div class="explanation">
            ${quiz_escape(q.explanation || '')}
          </div>

          <div class="card-actions">
            <button type="button" class="small-btn edit-question" data-id="${quiz_escape(q.id)}">
              編集
            </button>
            <button type="button" class="small-btn danger delete-question" data-id="${quiz_escape(q.id)}">
              削除
            </button>
          </div>
        </article>
      `;
    }).join('');

    $$('.edit-question').forEach((button) => {
      button.addEventListener('click', () => quiz_open_editor(button.dataset.id));
    });

    $$('.delete-question').forEach((button) => {
      button.addEventListener('click', () => quiz_delete_question(button.dataset.id));
    });
  }

  function quiz_value(value) {
    if (Array.isArray(value)) return value.join(' ／ ');
    return String(value ?? '—');
  }

  function quiz_render_finals() {
    const list = $('#final-list');
    if (!list) return;

    const search = ($('#search-input')?.value || '').trim().toLowerCase();
    const year = $('#year-filter')?.value || '';

    const rows = quiz_finals.filter((race) => {
      const yearMatch = !year || String(race.year ?? '') === year;
      const haystack = [
        race.id, race.year, race.date, race.race, race.venue,
        quiz_value(race.winner), quiz_value(race.second),
        quiz_value(race.third), quiz_value(race.fourth),
        quiz_value(race.fifth), race.time
      ].join(' ').toLowerCase();

      return yearMatch && haystack.includes(search);
    });

    if (!rows.length) {
      list.innerHTML = '<div class="empty">FINAL問題がありません。</div>';
      return;
    }

    list.innerHTML = rows.map((race) => `
      <article class="data-card final-card">
        <div class="final-date">
          ${quiz_escape(race.date || race.year || '')}<br>
          ${quiz_escape(race.venue || '')}
        </div>

        <div>
          <div class="card-id">${quiz_escape(race.id || '')}</div>
          <div class="final-race-name">${quiz_escape(race.race || '')}</div>

          <div class="finish-grid">
            <div class="finish-item"><b>1ST</b>${quiz_escape(quiz_value(race.winner))}</div>
            <div class="finish-item"><b>2ND</b>${quiz_escape(quiz_value(race.second))}</div>
            <div class="finish-item"><b>3RD</b>${quiz_escape(quiz_value(race.third))}</div>
            <div class="finish-item"><b>4TH</b>${quiz_escape(quiz_value(race.fourth))}</div>
            <div class="finish-item"><b>5TH</b>${quiz_escape(quiz_value(race.fifth))}</div>
            <div class="finish-item"><b>TIME</b>${quiz_escape(race.time || '—')}</div>
          </div>

          <div class="verification-row">
            <span>WINNER: ${quiz_escape(race.verification?.winner || '—')}</span>
            <span>TOP5: ${quiz_escape(race.verification?.top5 || '—')}</span>
            <span>TIME: ${quiz_escape(race.verification?.time || '—')}</span>
          </div>
        </div>
      </article>
    `).join('');
  }

  function quiz_render() {
    quiz_render_summary();

    const normal = $('#normal-list');
    const finals = $('#final-list');
    const yearFilter = $('#year-filter');

    if (quiz_active_tab === 'normal') {
      if (normal) normal.hidden = false;
      if (finals) finals.hidden = true;
      if (yearFilter) yearFilter.hidden = true;
      quiz_render_normal();
    } else {
      if (normal) normal.hidden = true;
      if (finals) finals.hidden = false;
      if (yearFilter) yearFilter.hidden = false;
      quiz_render_finals();
    }
  }

  function quiz_set_final_years() {
    const select = $('#year-filter');
    if (!select) return;

    const years = [...new Set(
      quiz_finals.map((race) => race.year).filter(Boolean)
    )].sort((a, b) => Number(b) - Number(a));

    select.innerHTML =
      '<option value="">全年度</option>' +
      years.map((year) =>
        `<option value="${quiz_escape(year)}">${quiz_escape(year)}年</option>`
      ).join('');
  }

  async function quiz_load_all() {
    // FINALはSupabaseが失敗しても表示できるよう、独立して読み込む。
    try {
      quiz_finals = await quiz_load_finals();
      quiz_set_final_years();
    } catch (error) {
      console.error('FINAL load error:', error);
      quiz_finals = [];
    }

    try {
      quiz_questions = await quiz_load_questions();
      quiz_supabase_error = '';
    } catch (error) {
      console.error('Supabase load error:', error);
      quiz_questions = [];
      quiz_supabase_error = error.message;
    }

    quiz_render();

    // SupabaseのエラーはFINAL画面を潰さず、通常問題側にだけ表示。
    if (quiz_supabase_error && $('#normal-list')) {
      $('#normal-list').innerHTML = `
        <div class="empty">
          Supabase接続エラー：${quiz_escape(quiz_supabase_error)}
          <br><br>
          URL / Publishable key / quiz_questionsテーブル / RLS を確認してください。
        </div>
      `;
    }
  }

  async function quiz_load_seed() {
    const response = await fetch('questions.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`questions.json の読み込みに失敗しました (${response.status})`);
    }

    const data = await response.json();
    const seed = Array.isArray(data) ? data : data.questions;

    if (!Array.isArray(seed) || seed.length !== 100) {
      throw new Error(`初期問題が100問ではありません（${seed?.length ?? 0}問）`);
    }

    return seed;
  }

  function quiz_seed_row(question) {
    const choices = question.choices || [];
    if (choices.length !== 4) {
      throw new Error(`問題ID ${question.id ?? ''}: 選択肢が4つではありません。`);
    }

    const correct = choices.findIndex(
      (choice) => String(choice).trim() === String(question.answer).trim()
    ) + 1;

    if (correct < 1) {
      throw new Error(`問題ID ${question.id ?? ''}: 正解を4択から特定できません。`);
    }

    return {
      question: question.question,
      option1: choices[0],
      option2: choices[1],
      option3: choices[2],
      option4: choices[3],
      correct_option: correct,
      explanation: question.explanation || '',
      active: true
    };
  }

  async function quiz_seed_100() {
    if (quiz_questions.length > 0) {
      alert(
        `現在Supabaseに${quiz_questions.length}問あります。\n` +
        '初期100問の一括登録は、通常問題が0問のときだけ実行します。'
      );
      return;
    }

    if (!confirm('初期100問をSupabaseへ登録します。よろしいですか？')) return;

    const button = $('#seed-questions-btn');
    if (button) button.disabled = true;

    try {
      const seed = await quiz_load_seed();
      const rows = seed.map(quiz_seed_row);

      // 20問ずつ登録
      for (let i = 0; i < rows.length; i += 20) {
        await quiz_api(`${quiz_supabase_url}/quiz_questions`, {
          method: 'POST',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify(rows.slice(i, i + 20))
        });
      }

      // 必ずSupabaseから再取得して、登録結果を確認する。
      quiz_questions = await quiz_load_questions();

      if (quiz_questions.length < 100) {
        throw new Error(
          `登録後の確認で${quiz_questions.length}問しか取得できませんでした。`
        );
      }

      quiz_supabase_error = '';
      quiz_render();

      alert(`初期100問を登録しました。\n現在の通常問題：${quiz_questions.length}問`);
    } catch (error) {
      console.error('seed error:', error);
      alert(`初期100問の登録に失敗しました。\n\n${error.message}`);
    } finally {
      if (button) button.disabled = false;
    }
  }

  function quiz_open_editor(id = null) {
    quiz_editing_id = id == null ? null : String(id);

    const question = quiz_editing_id
      ? quiz_questions.find((q) => String(q.id) === quiz_editing_id)
      : null;

    $('#editor-title').textContent = question
      ? '通常問題を編集'
      : '通常問題を追加';

    $('#question-id').textContent = question
      ? `ID: ${question.id}`
      : 'NEW';

    $('#q-question').value = question?.question || '';

    [1, 2, 3, 4].forEach((number) => {
      $(`#q-option${number}`).value =
        question?.choices?.[number - 1] || '';
    });

    const correctIndex = question
      ? Number(question.correct_option || 1)
      : 1;

    $('#q-correct').value = String(
      correctIndex >= 1 && correctIndex <= 4 ? correctIndex : 1
    );

    $('#q-explanation').value = question?.explanation || '';

    $('#editor').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function quiz_close_editor() {
    quiz_editing_id = null;
    if ($('#editor')) $('#editor').hidden = true;
  }

  async function quiz_save_question(event) {
    event.preventDefault();

    const options = [1, 2, 3, 4].map(
      (number) => $(`#q-option${number}`).value.trim()
    );

    const payload = {
      question: $('#q-question').value.trim(),
      option1: options[0],
      option2: options[1],
      option3: options[2],
      option4: options[3],
      correct_option: Number($('#q-correct').value),
      explanation: $('#q-explanation').value.trim(),
      active: true
    };

    if (
      !payload.question ||
      options.some((value) => !value) ||
      !payload.explanation
    ) {
      alert('問題文・4択・正解・解説をすべて入力してください。');
      return;
    }

    try {
      const url = quiz_editing_id
        ? `${quiz_supabase_url}/quiz_questions?id=eq.${encodeURIComponent(quiz_editing_id)}`
        : `${quiz_supabase_url}/quiz_questions`;

      await quiz_api(url, {
        method: quiz_editing_id ? 'PATCH' : 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(payload)
      });

      quiz_close_editor();
      quiz_questions = await quiz_load_questions();
      quiz_supabase_error = '';
      quiz_render();
    } catch (error) {
      console.error('save question error:', error);
      alert(`保存に失敗しました。\n\n${error.message}`);
    }
  }

  async function quiz_delete_question(id) {
    const question = quiz_questions.find(
      (item) => String(item.id) === String(id)
    );

    if (!question) return;

    if (!confirm(`この問題を削除しますか？\n\n${question.question}`)) {
      return;
    }

    try {
      await quiz_api(
        `${quiz_supabase_url}/quiz_questions?id=eq.${encodeURIComponent(id)}`,
        { method: 'DELETE' }
      );

      quiz_questions = await quiz_load_questions();
      quiz_render();
    } catch (error) {
      console.error('delete question error:', error);
      alert(`削除に失敗しました。\n\n${error.message}`);
    }
  }

  $$('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      quiz_active_tab = tab.dataset.tab || 'normal';

      $$('.tab').forEach((item) => item.classList.remove('active'));
      tab.classList.add('active');

      quiz_render();
    });
  });

  $('#search-input')?.addEventListener('input', quiz_render);
  $('#year-filter')?.addEventListener('change', quiz_render);
  $('#seed-questions-btn')?.addEventListener('click', quiz_seed_100);
  $('#add-question-btn')?.addEventListener('click', () => quiz_open_editor());
  $('#cancel-editor-btn')?.addEventListener('click', quiz_close_editor);
  $('#question-form')?.addEventListener('submit', quiz_save_question);

  quiz_load_all();
})();
