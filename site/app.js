(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const $$ = selector => document.querySelectorAll(selector);

  const albumData = window.BOSS_ALBUM_DATA || {};
  const photos = window.BOSS_PHOTOS || [];
  const byId = new Map(photos.map(p => [String(p.id), p]));

  const book = $('#book');
  const frame = $('#book-frame');
  const lightbox = $('#lightbox');
  const contents = $('#contents-dialog');
  const effects = window.BossEffects ? window.BossEffects.create({ bookFrame: frame }) : { decorate() {}, onPage() {}, burst() {} };
  const loveMusic = window.BossMusic.createPlayer();

  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined && text !== null) el.textContent = text;
    return el;
  }

  function paper(side) {
    return element('section', 'paper ' + side);
  }

  const pad = n => String(n).padStart(2, '0');

  // Build 24 spreads
  const spreads = [];

  // Spread 0 -> Trang 01 (Cover spread)
  spreads.push({
    kind: 'cover',
    pageNum: 1,
    chapter: 0,
    title: albumData.coverSpread?.title || '4 năm. 48 tháng. 1461 ngày.',
    subtitle: 'Bìa mở đầu album kỷ niệm 12.11',
    data: albumData.coverSpread
  });

  // Spread 1..21 -> Trang 02..22 (Moments)
  if (albumData.pages) {
    albumData.pages.forEach(p => {
      spreads.push({
        kind: 'moment',
        pageNum: p.pageNum,
        chapter: p.chapter,
        title: p.title,
        subtitle: p.tag || `Khoảnh khắc ${p.pageNum}`,
        moment: p
      });
    });
  }

  // Spread 22 -> Trang 23 (Thư phần 1)
  spreads.push({
    kind: 'letter',
    pageNum: 23,
    chapter: 6,
    part: 0,
    title: albumData.letterPages?.['23']?.title || 'Bốn năm bên em, ngàn điều tuyệt vời.',
    subtitle: 'Lá thư tình của anh (Phần 1)',
    letter: albumData.letterPages?.['23']
  });

  // Spread 23 -> Trang 24 (Thư phần 2)
  spreads.push({
    kind: 'letter',
    pageNum: 24,
    chapter: 6,
    part: 1,
    title: albumData.letterPages?.['24']?.title || 'Mãi là bến đỗ bình yên của nhau nhé.',
    subtitle: 'Lá thư tình của anh (Phần 2)',
    letter: albumData.letterPages?.['24']
  });

  const getChapterName = (chIdx) => {
    if (chIdx === 0) return 'Trang mở đầu';
    if (chIdx === 6) return 'Lá thư tình';
    const ch = albumData.chapters?.find(c => c.index === chIdx);
    return ch ? ch.title.split('—')[0].trim() : `Phần ${chIdx}`;
  };

  // Render Spread 0 (Cover Spread)
  function renderCoverSpread(s) {
    const cs = s.data || {};
    const spread = element('div', 'spread cover-spread');
    spread.dataset.kind = 'cover';

    const left = paper('left');
    const content = element('div', 'cover-copy');
    content.append(
      element('span', 'overline', cs.overline || 'KỶ NIỆM TÌNH YÊU · 12.11'),
      element('p', 'full-name', cs.sub_overline || 'DÀNH TẶNG BOSS CỦA ANH')
    );

    const title = element('h1');
    if (cs.title) {
      if (cs.title.includes('<')) {
        title.innerHTML = cs.title;
      } else {
        title.textContent = cs.title;
      }
    } else {
      title.append(
        document.createTextNode('Bốn năm '),
        element('em', '', 'bên em'),
        document.createTextNode(', ngàn điều thương nhớ.')
      );
    }
    content.append(
      title,
      element('p', 'cover-sub', cs.lead || '1.460 ngày cùng nhau gom góp kỷ niệm.\nMón quà nhỏ anh tự tay chuẩn bị tặng Boss.')
    );

    const startBtn = element('button', 'primary-button', 'Mở những trang đầu ↗');
    startBtn.type = 'button';
    startBtn.dataset.goto = '1';
    content.append(startBtn, element('span', 'cover-date', cs.date || '12.11.2022 — 12.11.2026'));
    left.append(content);

    const right = paper('right');
    const figure = element('figure', 'cover-portrait');
    const image = element('img');
    image.src = cs.src || 'photos/1.jpg';
    image.alt = cs.moment_title || 'Chân dung Boss của anh';
    image.draggable = false;

    const figcap = element('figcaption');
    figcap.append(
      element('strong', '', cs.moment_title || 'Chạm mắt là thấy bình yên'),
      element('span', '', cs.text || 'Chỉ cần nhìn vào đôi mắt này, mọi muộn phiền ngoài kia đều biến mất.')
    );

    figure.append(image, figcap);
    right.append(figure, element('span', 'cover-seal', cs.seal || 'with love, từ Anh'));

    spread.append(left, right);
    return spread;
  }

  // Render Moment Spread (Trang 02 to Trang 22)
  function renderMomentSpread(s) {
    const m = s.moment;
    const spread = element('div', 'spread moment-spread');
    spread.dataset.kind = 'moment';
    spread.dataset.chapter = s.chapter;

    // Left Paper: Story
    const left = paper('left');
    const head = element('header', 'page-header');
    
    const chInfo = albumData.chapters?.find(c => c.index === s.chapter);
    const chTitle = chInfo ? chInfo.title.split('—')[0].trim() : '';
    if (chTitle) {
      head.append(element('span', 'overline', chTitle));
    }

    if (m.tag) {
      head.append(element('span', 'location-badge', '📍 ' + m.tag));
    }
    head.append(element('h2', 'moment-title', m.title));
    left.append(head);

    const storyBody = element('div', 'story-body');
    storyBody.append(element('p', 'story-text', m.text));

    if (chInfo?.quote) {
      const quoteEl = element('div', 'story-ornament');
      quoteEl.append(
        element('span', 'ornament-leaf', '🌿'),
        element('em', '', `"${chInfo.quote}"`)
      );
      storyBody.append(quoteEl);
    }
    left.append(storyBody);

    const footLeft = element('div', 'paper-footer');
    footLeft.append(
      element('span', '', 'MY BOSS · 4 NĂM YÊU THƯƠNG'),
      element('span', '', `TRANG ${pad(s.pageNum)} / ${spreads.length}`)
    );
    left.append(footLeft);

    // Right Paper: Photo or Video
    const right = paper('right');
    const figure = element('figure', 'photo-print' + (m.type === 'video' ? ' video-print' : ''));

    if (m.type === 'photo') {
      const trigger = element('button', 'photo-trigger');
      trigger.type = 'button';
      trigger.dataset.photo = String(s.pageNum);
      trigger.setAttribute('aria-label', `Xem ảnh lớn: ${m.title}`);

      const win = element('span', 'photo-window');
      const img = element('img');
      img.src = m.src;
      img.alt = m.title;
      img.draggable = false;
      win.append(img);
      trigger.append(win);
      figure.append(trigger);

      const cap = element('figcaption');
      cap.append(
        element('span', 'caption-title', m.title),
        element('small', 'caption-num', `${pad(s.pageNum)} / ${spreads.length}`)
      );
      figure.append(cap);
    } else if (m.type === 'video') {
      const win = element('div', 'video-window');
      const video = element('video');
      video.src = m.videoSrc;
      video.poster = m.poster || m.src;
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      win.append(video);
      figure.append(win);

      const cap = element('figcaption');
      cap.append(
        element('span', 'caption-title', m.title),
        element('span', 'video-badge', '▶ VIDEO KỶ NIỆM')
      );
      figure.append(cap);
    }

    right.append(figure);

    const footRight = element('div', 'paper-footer');
    footRight.append(
      element('span', '', chInfo ? chInfo.subtitle : '12.11.2022 — 12.11.2026'),
      element('span', '', pad(s.pageNum))
    );
    right.append(footRight);

    spread.append(left, right);
    return spread;
  }

  // Render Letter Spreads (Trang 23 & 24)
  function renderLetterSpread(s) {
    const l = s.letter || {};
    const spread = element('div', `spread letter-spread letter-part-${s.part}`);
    spread.dataset.kind = 'letter';
    spread.dataset.chapter = 6;

    if (s.part === 0) {
      // Trang 23
      const left = paper('left');
      const head = element('header', 'page-header');
      head.append(
        element('span', 'overline', '12 THÁNG 11 · THƯ TÌNH CỦA ANH'),
        element('h2', '', l.title || 'Bốn năm bên em, ngàn điều tuyệt vời.')
      );
      left.append(head);

      const body = element('div', 'letter-body');
      if (l.greeting) body.append(element('p', 'salutation', l.greeting));
      if (l.paragraphs) {
        l.paragraphs.slice(0, 3).forEach(p => body.append(element('p', '', p)));
      }
      left.append(body);

      const footLeft = element('div', 'paper-footer');
      footLeft.append(element('span', '', 'LÁ THƯ TÌNH · PHẦN 1'), element('span', '', 'TRANG 23 / 24'));
      left.append(footLeft);

      const right = paper('right');
      const rightBody = element('div', 'letter-body');
      if (l.paragraphs && l.paragraphs[3]) {
        rightBody.append(element('p', '', l.paragraphs[3]));
      }

      const fig = element('figure', 'letter-snapshot');
      const img = element('img');
      img.src = 'photos/7.jpg';
      img.alt = 'Chuyến đi biển kỷ niệm';
      fig.append(img, element('figcaption', '', 'Vịnh Lan Hạ · Khoảnh khắc nụ cười của hai đứa mình.'));
      rightBody.append(fig);

      rightBody.append(element('p', 'letter-turn', 'Còn tiếp ở trang sau →'));
      right.append(rightBody);

      const footRight = element('div', 'paper-footer');
      footRight.append(element('span', '', '12.11.2022 — 12.11.2026'), element('span', '', '23'));
      right.append(footRight);

      spread.append(left, right);
    } else {
      // Trang 24
      const left = paper('left');
      const head = element('header', 'page-header');
      head.append(
        element('span', 'overline', '12 THÁNG 11 · THƯ TÌNH CỦA ANH'),
        element('h2', '', l.title || 'Mãi là bến đỗ bình yên của nhau nhé.')
      );
      left.append(head);

      const body = element('div', 'letter-body');
      if (l.paragraphs) {
        l.paragraphs.slice(0, 3).forEach(p => body.append(element('p', '', p)));
      }
      left.append(body);

      const footLeft = element('div', 'paper-footer');
      footLeft.append(element('span', '', 'LÁ THƯ TÌNH · PHẦN 2'), element('span', '', 'TRANG 24 / 24'));
      left.append(footLeft);

      const right = paper('right');
      const rightBody = element('div', 'letter-body');
      if (l.paragraphs && l.paragraphs[3]) {
        rightBody.append(element('p', '', l.paragraphs[3]));
      }
      if (l.wish) {
        const wishEl = element('p', 'letter-wish');
        wishEl.innerHTML = l.wish.replace(/\n/g, '<br>');
        rightBody.append(wishEl);
      }
      if (l.signature) {
        const sigEl = element('p', 'letter-signature');
        const lines = l.signature.split('\n').map(s => s.trim()).filter(Boolean);
        if (lines.length > 1) {
          sigEl.innerHTML = lines[0] + '<br><em>' + lines.slice(1).join('<br>') + '</em>';
        } else {
          sigEl.innerHTML = '<em>' + l.signature + '</em>';
        }
        rightBody.append(sigEl);
      }

      const actions = element('div', 'closing-actions');
      const saveBtn = element('button', 'text-button', 'Tải lá thư về máy ↓');
      saveBtn.type = 'button';
      saveBtn.dataset.saveLetter = 'true';

      const restartBtn = element('button', 'text-button', 'Về lại bìa album ↗');
      restartBtn.type = 'button';
      restartBtn.dataset.goto = '0';

      actions.append(saveBtn, restartBtn);
      rightBody.append(actions);
      right.append(rightBody);

      const footRight = element('div', 'paper-footer');
      footRight.append(element('span', '', 'MY BOSS · MÃI MÃI THƯƠNG YÊU ❤️'), element('span', '', '24'));
      right.append(footRight);

      spread.append(left, right);
    }

    return spread;
  }

  function makeSpread(spreadIndex) {
    const s = spreads[spreadIndex];
    if (!s) return element('div', 'spread');
    if (s.kind === 'cover') return renderCoverSpread(s);
    if (s.kind === 'letter') return renderLetterSpread(s);
    return renderMomentSpread(s);
  }

  let current = 0;
  let turning = false;
  let animation = null;
  let bookClosed = false;
  let opening = null;

  function hashPage() {
    const key = location.hash.slice(1);
    const n = /^trang-(\d+)$/.exec(key);
    return n ? Math.max(0, Math.min(spreads.length - 1, Number(n[1]) - 1)) : 0;
  }

  function updateChrome() {
    const s = spreads[current];
    if (!s) return;

    if (s.kind === 'cover') {
      $('#chapter-overline').textContent = 'KỶ NIỆM 4 NĂM YÊU NHAU · 12.11';
      $('#chapter-title').textContent = s.title || '4 năm. 48 tháng. 1461 ngày.';
      $('#chapter-part').textContent = '12.11.2022 — 12.11.2026';
    } else if (s.kind === 'letter') {
      $('#chapter-overline').textContent = 'LÁ THƯ TÌNH CỦA ANH';
      $('#chapter-title').textContent = s.title;
      $('#chapter-part').textContent = `Trang ${s.pageNum} / 24`;
    } else {
      const chInfo = albumData.chapters?.find(c => c.index === s.chapter);
      $('#chapter-overline').textContent = chInfo ? chInfo.title.split('—')[0].trim() : getChapterName(s.chapter);
      $('#chapter-title').textContent = s.title;
      $('#chapter-part').textContent = `Trang ${pad(s.pageNum)} / ${spreads.length}`;
    }

    const indicatorText = current === 0 ? `Bìa mở đầu · 01 / ${spreads.length}` : `Trang ${pad(current + 1)} / ${spreads.length}`;
    $('#page-indicator').textContent = indicatorText;
    $('#page-progress').style.width = ((current / (spreads.length - 1)) * 100) + '%';
    
    $('#prev-page').disabled = $('#edge-prev').disabled = current === 0 || turning;
    $('#next-page').disabled = $('#edge-next').disabled = current === spreads.length - 1 || turning;

    $$('[data-chapter-target]').forEach(btn => {
      if (Number(btn.dataset.chapterTarget) === s.chapter) {
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.removeAttribute('aria-current');
      }
    });

    $('#page-announcement').textContent = `${s.title}. Trang ${current + 1} trên ${spreads.length}.`;
  }

  function bindSpreadVideos(container) {
    container.querySelectorAll('video').forEach(video => {
      video.addEventListener('play', () => {
        document.querySelectorAll('video').forEach(v => {
          if (v !== video) v.pause();
        });
        loveMusic.duck();
      });
      video.addEventListener('pause', () => {
        const anyPlaying = Array.from(document.querySelectorAll('video')).some(v => !v.paused && !v.ended);
        if (!anyPlaying) loveMusic.unduck();
      });
      video.addEventListener('ended', () => {
        loveMusic.unduck();
      });
    });
  }

  // Mount content into #book without transition
  function mountSpread(index) {
    current = index;
    const spread = makeSpread(current);
    effects.decorate(spread, spreads[current]);
    bindSpreadVideos(spread);
    spread.dataset.pageIndex = current;
    book.replaceChildren(spread);
    updateChrome();
    effects.onPage(spreads[current]);
  }

  // 3D Page flip transition
  async function showPage(index, animate = true) {
    if (bookClosed) {
      await openBook();
      if (index === current) return;
    }
    if (turning || index < 0 || index >= spreads.length) return;
    if (index === current && book.children.length) return;

    book.querySelectorAll('video').forEach(v => {
      try { v.pause(); } catch {}
    });
    loveMusic.unduck();

    if (animate) {
      loveMusic.flipSound();
    }

    const previous = book.firstElementChild;
    const forward = index > current;
    turning = Boolean(previous && animate);
    current = index;

    const next = makeSpread(current);
    effects.decorate(next, spreads[current]);
    bindSpreadVideos(next);
    next.dataset.pageIndex = current;
    book.replaceChildren(next);
    updateChrome();

    try { history.replaceState(null, '', '#trang-' + (current + 1)); } catch {}

    if (turning) {
      const layer = element('div', 'turn-layer');
      layer.setAttribute('aria-hidden', 'true');
      frame.append(layer);

      try {
        const ease = 'cubic-bezier(.32, .08, .22, 1)';
        const isMobile = matchMedia('(max-width: 760px)').matches;

        if (isMobile) {
          const d = 750;
          const leaf = element('div', 'm-leaf');
          const front = element('div', 'm-face m-front');
          const back = element('div', 'm-face m-back');
          const cast = element('div', 'turn-cast');
          const shade = element('div', 'flip-shade');
          cast.style.zIndex = 2;

          if (forward) {
            front.append(previous.cloneNode(true), shade);
            leaf.append(front, back);
            layer.append(cast, leaf);
            animation = leaf.animate(
              [{ transform: 'perspective(1800px) rotateY(0deg)' }, { transform: 'perspective(1800px) rotateY(-180deg)' }],
              { duration: d, easing: ease, fill: 'forwards' }
            );
            cast.animate([{ opacity: 0.8 }, { opacity: 0 }], { duration: d, fill: 'forwards' });
            shade.animate([{ opacity: 0 }, { opacity: 0.8 }], { duration: d / 2, fill: 'forwards' });
          } else {
            const still = element('div', 'm-static');
            still.append(previous.cloneNode(true));
            front.append(next.cloneNode(true), shade);
            leaf.append(front, back);
            layer.append(still, cast, leaf);
            animation = leaf.animate(
              [{ transform: 'perspective(1800px) rotateY(-180deg)' }, { transform: 'perspective(1800px) rotateY(0deg)' }],
              { duration: d, easing: ease, fill: 'forwards' }
            );
            cast.animate([{ opacity: 0 }, { opacity: 0.8 }], { duration: d, fill: 'forwards' });
            shade.animate([{ opacity: 0.8 }, { opacity: 0.8, offset: .5 }, { opacity: 0 }], { duration: d, fill: 'forwards' });
          }
        } else {
          // Desktop 3D Spread page flip
          const d = 820;
          const fixedPaper = previous.querySelector(forward ? '.paper.left' : '.paper.right');
          if (fixedPaper) {
            const fixed = fixedPaper.cloneNode(true);
            fixed.classList.add('turn-static', forward ? 'left' : 'right');
            layer.append(fixed);
          }

          const leaf = element('div', 'flip-leaf ' + (forward ? 'forward' : 'backward'));
          const front = element('div', 'flip-face flip-front');
          const back = element('div', 'flip-face flip-back');
          const fs = element('div', 'flip-shade');
          const bs = element('div', 'flip-shade');

          const prevTurningPaper = previous.querySelector(forward ? '.paper.right' : '.paper.left');
          const nextTurningPaper = next.querySelector(forward ? '.paper.left' : '.paper.right');

          if (prevTurningPaper) front.append(prevTurningPaper.cloneNode(true), fs);
          if (nextTurningPaper) back.append(nextTurningPaper.cloneNode(true), bs);
          leaf.append(front, back);

          const cast = element('div', 'turn-cast' + (forward ? '' : ' from-right'));
          Object.assign(cast.style, { zIndex: 2, left: forward ? '50%' : '0', right: forward ? '0' : '50%' });
          layer.append(cast, leaf);

          animation = leaf.animate(
            [{ transform: 'rotateY(0deg)' }, { transform: `rotateY(${forward ? -180 : 180}deg)` }],
            { duration: d, easing: ease, fill: 'forwards' }
          );
          fs.animate([{ opacity: 0 }, { opacity: 0.75 }], { duration: d / 2, easing: 'ease-in', fill: 'forwards' });
          bs.animate([{ opacity: 0.75 }, { opacity: 0.75, offset: .5 }, { opacity: 0 }], { duration: d, fill: 'forwards' });
          cast.animate([{ opacity: 0.9 }, { opacity: 0 }], { duration: d, fill: 'forwards' });
        }
        await animation.finished;
      } catch (err) {
      } finally {
        layer.remove();
        animation = null;
      }
    }

    turning = false;
    updateChrome();
    effects.onPage(spreads[current]);

    const nextSpread = spreads[current + 1];
    if (nextSpread?.moment?.src) {
      const im = new Image();
      im.src = nextSpread.moment.src;
    }
  }

  $('#prev-page').addEventListener('click', () => showPage(current - 1));
  $('#next-page').addEventListener('click', () => showPage(current + 1));
  $('#edge-prev').addEventListener('click', () => showPage(current - 1));
  $('#edge-next').addEventListener('click', () => showPage(current + 1));
  $('#home-link').addEventListener('click', e => { e.preventDefault(); showPage(0); });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-goto]');
    if (b) showPage(Number(b.dataset.goto));
    if (e.target.closest('[data-save-letter]')) downloadLetter();
  });

  function openContents() {
    contents.showModal();
    const currentBtn = contents.querySelector('[aria-current=page]');
    if (currentBtn) currentBtn.focus();
  }

  $('#open-contents').addEventListener('click', openContents);
  $('#page-indicator').addEventListener('click', openContents);
  $('#close-contents').addEventListener('click', () => contents.close());

  function buildTableOfContents() {
    const list = $('#contents-list');
    list.replaceChildren();

    spreads.forEach((s, idx) => {
      const btn = element('button', 'contents-entry');
      btn.type = 'button';
      btn.dataset.chapterTarget = s.chapter;

      if (s.moment?.thumb) {
        const img = element('img');
        img.src = s.moment.thumb;
        img.alt = '';
        img.width = 60;
        img.height = 70;
        btn.append(img);
      } else if (s.kind === 'cover') {
        const img = element('img');
        img.src = albumData.coverSpread?.thumb || 'thumbs/1.jpg';
        img.alt = '';
        img.width = 60;
        img.height = 70;
        btn.append(img);
      } else {
        btn.append(element('span', 'contents-icon', '💌'));
      }

      const copy = element('span', 'contents-entry-copy');
      const chInfo = albumData.chapters?.find(c => c.index === s.chapter);
      const tagLabel = s.kind === 'cover' ? 'TRANG BÌA' : s.kind === 'letter' ? 'LÁ THƯ TÌNH' : (chInfo ? chInfo.title.split('—')[0].trim() : getChapterName(s.chapter));
      copy.append(
        element('small', '', tagLabel),
        element('strong', '', s.title),
        element('span', '', s.subtitle)
      );
      btn.append(copy, element('span', 'contents-page', `Trang ${pad(s.pageNum)} ↗`));

      btn.addEventListener('click', () => {
        contents.close();
        showPage(idx);
      });
      list.append(btn);
    });
  }
  buildTableOfContents();

  // Touch Swipe
  let swipe = null, lastSwipe = 0;
  frame.addEventListener('pointerdown', e => {
    if (e.isPrimary && e.button === 0) swipe = { x: e.clientX, y: e.clientY };
  });
  frame.addEventListener('pointerup', e => {
    if (!swipe) return;
    const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      lastSwipe = Date.now();
      showPage(current + (dx < 0 ? 1 : -1));
    }
  });
  frame.addEventListener('pointercancel', () => { swipe = null; });
  frame.addEventListener('click', e => {
    if (Date.now() - lastSwipe < 350) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (lightbox.open) {
      if (e.key === 'ArrowRight') { e.preventDefault(); changeLightboxPhoto(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); changeLightboxPhoto(-1); }
      if (e.key === 'Escape') { lightbox.close(); }
      return;
    }
    if (contents.open || e.altKey || e.ctrlKey || e.metaKey || e.target.matches('input,textarea,select,video')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); showPage(current + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); showPage(current - 1); }
    if (e.key === 'Home') { e.preventDefault(); showPage(0); }
    if (e.key === 'End') { e.preventDefault(); showPage(spreads.length - 1); }
  });

  // Lightbox
  const lightboxList = photos.filter(p => p.type === 'photo');
  let lightboxIdx = 0;

  function drawLightbox() {
    const p = lightboxList[lightboxIdx];
    if (!p) return;
    const img = $('#lightbox-image');
    img.src = p.src;
    img.alt = p.title || p.label;
    $('#photo-count').textContent = `${pad(lightboxIdx + 1)} / ${lightboxList.length}`;
    $('#photo-caption').textContent = `${p.title ? p.title + ' — ' : ''}${p.text || p.label}`;
    $('#prev-photo').disabled = lightboxIdx === 0;
    $('#next-photo').disabled = lightboxIdx === lightboxList.length - 1;
  }

  function changeLightboxPhoto(offset) {
    const nextIdx = lightboxIdx + offset;
    if (nextIdx >= 0 && nextIdx < lightboxList.length) {
      lightboxIdx = nextIdx;
      const img = $('#lightbox-image');
      img.animate([
        { opacity: 0.4, transform: `scale(0.96) translateX(${offset > 0 ? '40px' : '-40px'})` },
        { opacity: 1, transform: 'scale(1) translateX(0)' }
      ], { duration: 250, easing: 'ease-out' });
      drawLightbox();
    }
  }

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-photo]');
    if (!btn) return;
    const photoId = btn.dataset.photo;
    const foundIdx = lightboxList.findIndex(p => String(p.pageNum) === photoId || String(p.id) === photoId);
    if (foundIdx !== -1) {
      lightboxIdx = foundIdx;
      drawLightbox();
      lightbox.showModal();
    }
  });

  $('#prev-photo').addEventListener('click', () => changeLightboxPhoto(-1));
  $('#next-photo').addEventListener('click', () => changeLightboxPhoto(1));
  $('#close-photo').addEventListener('click', () => lightbox.close());

  for (const dialog of [contents, lightbox]) {
    dialog.addEventListener('click', e => {
      if (e.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
    });
  }

  // Hard Cover 3D Open
  function openBook() {
    if (!bookClosed) return Promise.resolve();
    if (opening) return opening;

    loveMusic.flipSound();
    opening = (async () => {
      const cover = frame.querySelector('.hard-cover');
      if (!cover) {
        bookClosed = false;
        frame.classList.remove('book-closed', 'book-opening');
        document.body.classList.remove('is-closed');
        return;
      }

      const isMobile = matchMedia('(max-width: 760px)').matches;
      const d = isMobile ? 1100 : 1350;
      frame.classList.add('book-opening');
      frame.classList.remove('book-closed');

      const turn = cover.animate(
        [{ transform: 'perspective(2400px) rotateY(0deg)' }, { transform: 'perspective(2400px) rotateY(-180deg)' }],
        { duration: d, easing: 'cubic-bezier(.5, .05, .25, 1)', fill: 'forwards' }
      );
      if (isMobile) {
        cover.animate([{ opacity: 1 }, { opacity: 1, offset: .6 }, { opacity: 0 }], { duration: d, fill: 'forwards' });
      }
      try { await turn.finished; } catch {}
      cover.remove();
      frame.classList.remove('book-opening');
      document.body.classList.remove('is-closed');
      bookClosed = false;
      opening = null;
      book.querySelector('.primary-button')?.focus({ preventScroll: true });
    })();
    return opening;
  }

  function setupHardCover() {
    bookClosed = true;
    document.body.classList.add('is-closed');
    frame.classList.add('book-closed');

    frame.querySelector('.hard-cover')?.remove();

    const cover = element('div', 'hard-cover');
    cover.setAttribute('role', 'button');
    cover.tabIndex = 0;
    cover.setAttribute('aria-label', 'Mở cuốn album của Boss');

    const hc = albumData.hardCover || {};
    const front = element('div', 'hc-face hc-front');
    const title = element('h1');
    if (hc.title) {
      if (hc.title.includes('<')) {
        title.innerHTML = hc.title;
      } else {
        title.textContent = hc.title;
      }
    } else {
      title.append(
        document.createTextNode('Trạm Dừng '),
        element('em', '', 'Thứ 4.')
      );
    }
    const fig = element('figure', 'hc-photo');
    const img = element('img');
    img.src = hc.coverPhoto || 'photos/cover.jpg';
    img.alt = 'Ảnh bìa Boss';
    img.draggable = false;
    fig.append(img);

    front.append(
      element('span', 'hc-over', hc.overline || 'KỶ NIỆM TÌNH YÊU · 12.11'),
      title
    );
    if (hc.subtitle) {
      front.append(element('p', 'hc-sub', hc.subtitle));
    }
    front.append(
      fig,
      element('span', 'hc-name', hc.name || 'MY BOSS'),
      element('span', 'hc-date', hc.date || '12.11.2022 — 12.11.2026'),
      element('span', 'hc-open', hc.button_text || 'Chạm để mở album ✨')
    );

    const back = element('div', 'hc-face hc-back');
    if (matchMedia('(max-width: 760px)').matches) {
      back.classList.add('hc-endpaper');
    } else {
      const leftPaper = book.querySelector('.paper.left');
      if (leftPaper) back.append(leftPaper.cloneNode(true));
    }
    cover.append(front, back);
    frame.append(cover);

    cover.addEventListener('click', e => {
      e.stopPropagation();
      openBook();
    });
    cover.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        openBook();
      }
    });
  }

  function fitBook() {
    if (innerWidth > 1100) {
      const z = Math.min((innerWidth - 120) / 1180, (innerHeight - 40) / 690);
      frame.style.zoom = Math.max(0.6, z).toFixed(3);
    } else {
      frame.style.zoom = '';
    }
  }
  fitBook();
  addEventListener('resize', fitBook);
  addEventListener('hashchange', () => {
    const target = hashPage();
    if (target !== current) {
      showPage(target, true);
    }
  });

  // INITIALIZATION:
  const startPage = hashPage();
  mountSpread(startPage);

  if (startPage === 0) {
    setupHardCover();
  }

  // Music toggle controls
  const musicButton = $('#music-toggle');
  function musicLabel(playing) {
    musicButton.setAttribute('aria-pressed', String(playing));
    musicButton.setAttribute('aria-label', playing ? 'Tắt nhạc' : 'Bật nhạc');
    musicButton.querySelector('.music-label').textContent = playing ? 'Tắt nhạc' : 'Bật nhạc';
  }

  let musicWanted = true;
  try { musicWanted = localStorage.getItem('boss-music') !== 'off'; } catch {}

  function rememberMusic(on) {
    musicWanted = on;
    try { localStorage.setItem('boss-music', on ? 'on' : 'off'); } catch {}
    musicLabel(on);
  }

  async function startMusic() {
    if (!musicWanted || loveMusic.playing || document.hidden) return;
    try {
      await loveMusic.play();
      $('.audio-status').textContent = 'Đang phát giai điệu tình yêu nhẹ nhàng.';
    } catch {
      $('.audio-status').textContent = 'Âm thanh chưa sẵn sàng.';
    }
  }

  const gestureEvents = ['touchend', 'click', 'keydown'];
  function disarmMusic() { gestureEvents.forEach(t => removeEventListener(t, onFirstGesture, true)); }
  async function onFirstGesture(e) {
    if (e.target.closest?.('#music-toggle')) return;
    if (!musicWanted || loveMusic.playing) { disarmMusic(); return; }
    await startMusic();
    if (loveMusic.playing) disarmMusic();
  }
  function armMusic() { if (musicWanted) gestureEvents.forEach(t => addEventListener(t, onFirstGesture, true)); }

  musicLabel(musicWanted);
  armMusic();

  musicButton.addEventListener('click', async () => {
    if (musicWanted) {
      rememberMusic(false);
      loveMusic.stop();
      $('.audio-status').textContent = 'Đã tắt nhạc.';
      return;
    }
    rememberMusic(true);
    musicButton.disabled = true;
    try { await startMusic(); } finally { musicButton.disabled = false; }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) loveMusic.stop();
    else armMusic();
  });
  window.addEventListener('pagehide', () => loveMusic.stop());

  function downloadLetter() {
    const l1 = albumData.letterPages?.['23'] || {};
    const l2 = albumData.letterPages?.['24'] || {};
    const textLines = [
      '12 tháng 11 · Kỷ niệm 4 năm tình yêu',
      '',
      l1.greeting || 'Gửi Boss của anh,',
      '',
      ...(l1.paragraphs || []),
      '',
      ...(l2.paragraphs || []),
      '',
      l2.wish || 'Chúc mừng kỷ niệm 4 năm tình yêu của chúng mình! ❤️',
      '',
      l2.signature || 'Yêu và thương Boss thật nhiều,\nAnh của em'
    ];
    const text = textLines.join('\n\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8' }));
    const a = element('a');
    a.href = url;
    a.download = 'Thu-tinh-gui-Boss-12-11.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
})();
