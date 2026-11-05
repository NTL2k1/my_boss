(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const photos = window.BOSS_PHOTOS || [];
  const byId = new Map(photos.map((p, i) => [p.id, { ...p, number: i + 1 }]));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const book = $('#book');
  const frame = $('#book-frame');
  const effects = window.BossEffects.create({ bookFrame: frame });
  const lightbox = $('#lightbox');
  const contents = $('#contents-dialog');
  const letterSource = $('#letter-template').content.querySelector('article');
  const paragraphs = [...letterSource.querySelectorAll(':scope > p')];

  const captions = {
    '1': 'Chỉ cần nhìn vào đôi mắt này, mọi muộn phiền ngoài kia đều biến mất.',
    '2': 'Đi đâu không quan trọng, quan trọng là luôn có Boss kề bên.',
    '3': 'Hoàng hôn hôm ấy rất đẹp, nhưng mắt anh chỉ mải ngắm em.',
    '4': 'Em như cơn sóng nhỏ, vừa mát lành vừa làm xao xuyến cả mùa hè.',
    '5': 'Lúc nào cũng rạng rỡ và ngập tràn năng lượng thế này nhé!',
    '6': 'Bình yên đôi khi chỉ là ngồi ngắm em cười vu vơ.',
    '7': 'Ra ngoài là Boss quyền lực, về cạnh anh là "tay đua nhí" đáng yêu.',
    '8': 'Nắng sớm, hoa hồng, và người xinh đẹp nhất trong mắt anh.',
    '9': 'Giữa biển trời bao la, tìm được nhau là điều may mắn nhất đời anh.',
    '10': 'Nàng thơ của anh giữa vịnh biển kỳ vĩ.',
    '11': 'Nụ cười thả ga, đắm mình trọn vẹn trong làn nước xanh mát.',
    '12': 'Một buổi hẹn hò xem phim, ly bắp rang và nụ cười quen thuộc.',
    '13': '12.11 — 4 năm cùng nhau đi qua bao thăng trầm, cảm ơn Boss vì luôn ở đây.',
    '14': 'Nặn gốm thì cần kiên nhẫn, còn yêu em thì anh chưa từng thấy đủ.',
    '15': 'Tác phẩm có thể chưa hoàn hảo, nhưng khoảnh khắc bên em thì luôn là tuyệt nhất.'
  };

  const chapters = [
    {
      name: 'Chạm mắt là thấy bình yên',
      subtitle: 'Người khiến cả thế giới của anh dịu lại.',
      quote: 'Ánh mắt em là nơi bình yên nhất anh từng biết.',
      ids: ['1', '8']
    },
    {
      name: 'Vitamin Sea cùng Boss',
      subtitle: 'Biển xanh, nắng vàng và những nụ cười tỏa nắng.',
      quote: 'Cùng em đi đến tận cùng chân trời góc biển.',
      ids: ['2', '3', '4', '9', '10', '11']
    },
    {
      name: 'Em bé ba tuổi của anh',
      subtitle: 'Những phút giây tinh nghịch và hồn nhiên nhất.',
      quote: 'Ở bên anh, em cứ việc làm em bé vô tư.',
      ids: ['5', '6', '7']
    },
    {
      name: 'Gom nhặt những buổi hẹn hò',
      subtitle: 'Rạp phim quen, bàn gốm nhỏ và những chiều bên nhau.',
      quote: 'Hạnh phúc đong đầy từ những điều thật giản đơn.',
      ids: ['12', '14', '15']
    },
    {
      name: '4 Năm một chặng đường',
      subtitle: '12.11 · Một cột mốc đặc biệt của hai đứa mình.',
      text: 'Bốn năm không quá dài, nhưng đủ để hai đứa mình cùng trưởng thành, thấu hiểu và trở thành một phần không thể thiếu của nhau. Cảm ơn Boss vì đã luôn đồng hành cùng anh.',
      quote: '12.11.2021 — 12.11.2025 · 4 năm thương yêu.',
      ids: ['13']
    },
    {
      name: 'Gửi Boss của những năm tháng sau',
      subtitle: 'Lá thư từ tận đáy lòng anh dành cho em.',
      quote: 'Con đường phía trước, anh vẫn luôn ở đây nắm chặt tay em.',
      letter: true
    }
  ];

  // Build page sequence
  const pages = [{ kind: 'cover', chapter: -1 }];

  chapters.forEach((chapter, index) => {
    chapter.start = pages.length;
    if (chapter.letter) {
      for (let part = 0; part < 2; part++) {
        pages.push({ kind: 'letter', chapter: index, part });
      }
      chapter.parts = 2;
      return;
    }

    const list = chapter.ids;
    const groups = [];
    if (list.length === 1) {
      groups.push(list);
    } else if (list.length <= 2) {
      groups.push(list);
    } else if (list.length === 3) {
      groups.push(list);
    } else if (list.length === 6) {
      groups.push(list.slice(0, 2), list.slice(2, 4), list.slice(4, 6));
    } else {
      for (let i = 0; i < list.length; i += 3) {
        groups.push(list.slice(i, i + 3));
      }
    }

    chapter.parts = groups.length;
    groups.forEach((ids, part) => pages.push({ kind: 'photos', chapter: index, ids, part }));
  });

  const pad = n => String(n).padStart(2, '0');

  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function paper(side) {
    return element('section', 'paper ' + side);
  }

  function pageHead(chapter, page, full = false) {
    const head = element('header', 'page-header');
    head.append(
      element('span', 'overline', page.letter ? 'LÁ THƯ TÌNH YÊU' : 'CHƯƠNG ' + pad(page.chapter + 1))
    );
    if (full) head.append(element('h2', '', chapter.name));
    else head.append(element('p', 'page-small-note', chapter.quote));
    return head;
  }

  function photoFigure(id) {
    const photo = byId.get(id);
    const figure = element('figure', 'photo-print');
    figure.style.setProperty('--ar', (photo.width / photo.height).toFixed(4));
    if (photo.width > photo.height) figure.classList.add('landscape');

    const button = element('button', 'photo-trigger');
    button.type = 'button';
    button.dataset.photo = id;
    button.setAttribute('aria-label', 'Xem ảnh lớn: ' + (captions[id] || photo.label));

    const windowEl = element('span', 'photo-window');
    const img = element('img');
    img.src = photo.src;
    img.alt = captions[id] || photo.label;
    img.width = photo.width;
    img.height = photo.height;
    img.draggable = false;
    windowEl.append(img);
    button.append(windowEl);

    const caption = element('figcaption');
    caption.append(
      element('span', '', captions[id] || photo.label),
      element('small', '', pad(photo.number))
    );
    figure.append(button, caption);
    return figure;
  }

  function photoGrid(ids) {
    const grid = element('div', 'photo-grid ' + (ids.length === 2 ? 'two' : 'single'));
    ids.forEach(id => grid.append(photoFigure(id)));
    return grid;
  }

  function pageFoot(page, side) {
    const footer = element('div', 'paper-footer');
    footer.append(
      element('span', '', 'MY BOSS · 4 NĂM YÊU THƯƠNG'),
      element('span', '', pad(pages.indexOf(page) * 2 + (side === 'right' ? 0 : -1)))
    );
    return footer;
  }

  function coverSpread() {
    const spread = element('div', 'spread cover-spread');
    spread.dataset.kind = 'cover';

    const left = paper('left');
    const content = element('div', 'cover-copy');
    content.append(
      element('span', 'overline', 'KỶ NIỆM TÌNH YÊU · 12.11'),
      element('p', 'full-name', 'DÀNH TẶNG BOSS CỦA ANH')
    );

    const title = element('h1');
    title.append(
      document.createTextNode('Bốn năm '),
      element('em', '', 'bên em'),
      document.createTextNode(', ngàn điều thương nhớ.')
    );
    content.append(
      title,
      element('p', 'cover-sub', '1.460 ngày cùng nhau gom góp kỷ niệm.\nMón quà nhỏ anh tự tay viết tặng Boss.')
    );

    const start = element('button', 'primary-button', 'Mở những trang đầu  ↗');
    start.type = 'button';
    start.dataset.goto = '1';
    content.append(start, element('span', 'cover-date', '12.11.2021 — 12.11.2025'));
    left.append(content);

    const right = paper('right');
    const figure = element('figure', 'cover-portrait');
    const image = element('img');
    image.src = byId.get('1').src;
    image.alt = 'Chân dung Boss của anh';
    image.draggable = false;
    figure.append(image, element('figcaption', '', 'Nụ cười làm tim anh tan chảy mỗi ngày.'));
    right.append(figure, element('span', 'cover-seal', 'with love, từ Anh'));
    spread.append(left, right);
    return spread;
  }

  const letterParts = [
    { title: 'Bốn năm bên em, ngàn điều tuyệt vời.', left: [0, 1, 2], right: [3] },
    { title: 'Mãi là bến đỗ bình yên của nhau nhé.', left: [4, 5, 6], right: [7, 8] }
  ];

  function letterSpread(page) {
    const part = letterParts[page.part];
    const spread = element('div', 'spread letter-spread letter-part-' + page.part);
    spread.dataset.kind = 'letter';

    const left = paper('left');
    const head = element('header', 'page-header');
    head.append(element('span', 'overline', '12 THÁNG 11 · THƯ TÌNH CỦA ANH'), element('h2', '', part.title));
    left.append(head);

    const body = element('div', 'letter-body');
    if (page.part === 0) body.append(element('p', 'salutation', 'Gửi Boss của anh,'));
    part.left.forEach(i => {
      if (paragraphs[i]) body.append(paragraphs[i].cloneNode(true));
    });
    left.append(body, pageFoot(page, 'left'));

    const right = paper('right');
    const rest = element('div', 'letter-body');
    part.right.forEach(i => {
      if (paragraphs[i]) rest.append(paragraphs[i].cloneNode(true));
    });

    if (page.part === 0) {
      rest.append(element('p', 'letter-turn', 'Còn tiếp ở trang sau →'));
    } else {
      const save = element('button', 'text-button', 'Tải lá thư về máy ↓');
      save.type = 'button';
      save.dataset.saveLetter = 'true';
      const restart = element('button', 'text-button', 'Về lại bìa album ↗');
      restart.type = 'button';
      restart.dataset.goto = '0';
      const actions = element('div', 'closing-actions');
      actions.append(save, restart);
      rest.append(actions);
    }
    right.append(rest, pageFoot(page, 'right'));
    spread.append(left, right);
    return spread;
  }

  function makeSpread(page) {
    if (page.kind === 'cover') return coverSpread();
    if (page.kind === 'letter') return letterSpread(page);

    const chapter = chapters[page.chapter];
    const spread = element('div', 'spread photo-spread count-' + page.ids.length);
    spread.dataset.kind = 'photos';
    spread.dataset.chapter = page.chapter;

    const left = paper('left'), right = paper('right');
    left.append(pageHead(chapter, page, true));

    if (page.ids.length === 1) {
      left.append(photoGrid(page.ids), pageFoot(page, 'left'));
      const note = element('div', 'story-note');
      note.append(
        element('span', 'story-symbol', '🌿'),
        element('span', 'overline', '12.11 · 4 NĂM MỘT CHẶNG ĐƯỜNG'),
        element('h3', '', chapter.subtitle),
        element('p', '', chapter.text),
        element('span', 'little-signature', chapter.quote)
      );
      right.append(note);
    } else if (page.ids.length === 2) {
      left.append(photoGrid([page.ids[0]]), pageFoot(page, 'left'));
      right.append(pageHead(chapter, page, false), photoGrid([page.ids[1]]));
    } else {
      // 3 photos: 2 on left, 1 on right
      left.append(photoGrid(page.ids.slice(0, 2)), pageFoot(page, 'left'));
      right.append(pageHead(chapter, page, false), photoGrid(page.ids.slice(2)));
    }

    right.append(pageFoot(page, 'right'));
    spread.append(left, right);
    return spread;
  }

  let current = 0, turning = false, animation = null, bookClosed = false, opening = null;
  let currentPhoto = 0, lastPhotoId = null;

  function hashPage() {
    const key = location.hash.slice(1);
    const n = /^trang-(\d+)$/.exec(key);
    return n ? Math.max(0, Math.min(pages.length - 1, Number(n[1]) - 1)) : 0;
  }

  function updateChrome() {
    const page = pages[current], chapter = chapters[page.chapter];
    $('#chapter-overline').textContent = page.kind === 'cover' ? 'KỶ NIỆM 4 NĂM YÊU NHAU' : page.kind === 'letter' ? 'LÁ THƯ TÌNH YÊU' : 'CHƯƠNG ' + pad(page.chapter + 1);
    $('#chapter-title').textContent = chapter ? chapter.subtitle : '4 năm bên em, ngàn điều tuyệt vời.';
    $('#chapter-part').textContent = chapter ? `Phần ${page.part + 1} / ${chapter.parts}` : '12.11.2021 — 12.11.2025';
    $('#page-indicator').textContent = current === 0 ? `Bìa album · 01 / ${pages.length}` : `Trang ${pad(current + 1)} / ${pages.length}`;
    $('#page-progress').style.width = (current / (pages.length - 1) * 100) + '%';
    $('#prev-page').disabled = $('#edge-prev').disabled = current === 0 || turning;
    $('#next-page').disabled = $('#edge-next').disabled = current === pages.length - 1 || turning;
    document.querySelectorAll('[data-chapter-target]').forEach(b => {
      if (Number(b.dataset.chapterTarget) === page.chapter) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    $('#page-announcement').textContent = `${current === 0 ? 'Bìa album' : chapter.name}. Trang ${current + 1} trên ${pages.length}.`;
  }

  async function showPage(index, animate = true) {
    if (bookClosed) {
      openBook().then(() => { if (index > 1) showPage(index); });
      return;
    }
    if (turning || index < 0 || index >= pages.length || (index === current && book.children.length)) return;

    const previous = book.firstElementChild;
    const forward = index > current;
    turning = Boolean(previous && animate && !reduced.matches);
    current = index;

    const next = makeSpread(pages[current]);
    effects.decorate(next, pages[current]);
    next.dataset.pageIndex = current;
    book.replaceChildren(next);
    updateChrome();

    try { history.replaceState(null, '', '#trang-' + (current + 1)); } catch {}

    if (turning) {
      const layer = element('div', 'turn-layer');
      layer.setAttribute('aria-hidden', 'true');
      frame.append(layer);
      try {
        const ease = 'cubic-bezier(.35,.1,.25,1)';
        if (matchMedia('(max-width:760px)').matches) {
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
            animation = leaf.animate([{ transform: 'perspective(1800px) rotateY(0deg)' }, { transform: 'perspective(1800px) rotateY(-180deg)' }], { duration: d, easing: ease, fill: 'forwards' });
            cast.animate([{ opacity: 1 }, { opacity: 0 }], { duration: d, fill: 'forwards' });
            shade.animate([{ opacity: 0 }, { opacity: 1 }], { duration: d / 2, fill: 'forwards' });
          } else {
            const still = element('div', 'm-static');
            still.append(previous.cloneNode(true));
            front.append(next.cloneNode(true), shade);
            leaf.append(front, back);
            layer.append(still, cast, leaf);
            animation = leaf.animate([{ transform: 'perspective(1800px) rotateY(-180deg)' }, { transform: 'perspective(1800px) rotateY(0deg)' }], { duration: d, easing: ease, fill: 'forwards' });
            cast.animate([{ opacity: 0 }, { opacity: 1 }], { duration: d, fill: 'forwards' });
            shade.animate([{ opacity: 1 }, { opacity: 1, offset: .5 }, { opacity: 0 }], { duration: d, fill: 'forwards' });
          }
        } else {
          const d = 820;
          const fixed = previous.querySelector(forward ? '.paper.left' : '.paper.right').cloneNode(true);
          fixed.classList.add('turn-static', forward ? 'left' : 'right');
          layer.append(fixed);

          const leaf = element('div', 'flip-leaf ' + (forward ? 'forward' : 'backward'));
          const front = element('div', 'flip-face flip-front');
          const back = element('div', 'flip-face flip-back');
          const fs = element('div', 'flip-shade');
          const bs = element('div', 'flip-shade');

          front.append(previous.querySelector(forward ? '.paper.right' : '.paper.left').cloneNode(true), fs);
          back.append(next.querySelector(forward ? '.paper.left' : '.paper.right').cloneNode(true), bs);
          leaf.append(front, back);

          const cast = element('div', 'turn-cast' + (forward ? '' : ' from-right'));
          Object.assign(cast.style, { zIndex: 2, left: forward ? '50%' : '0', right: forward ? '0' : '50%' });
          layer.append(cast, leaf);

          animation = leaf.animate([{ transform: 'rotateY(0deg)' }, { transform: `rotateY(${forward ? -180 : 180}deg)` }], { duration: d, easing: ease, fill: 'forwards' });
          fs.animate([{ opacity: 0 }, { opacity: 1 }], { duration: d / 2, easing: 'ease-in', fill: 'forwards' });
          bs.animate([{ opacity: 1 }, { opacity: 1, offset: .5 }, { opacity: 0 }], { duration: d, fill: 'forwards' });
          cast.animate([{ opacity: 1 }, { opacity: 0 }], { duration: d, fill: 'forwards' });
        }
        await animation.finished;
      } catch {} finally {
        layer.remove();
        animation = null;
      }
    }

    turning = false;
    updateChrome();
    effects.onPage(pages[current]);

    // Preload next spread images
    const following = pages[current + 1];
    if (following?.ids) {
      following.ids.forEach(id => {
        const im = new Image();
        im.src = byId.get(id).src;
      });
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
    if (e.target.closest('[data-save-letter]')) saveLetter();
  });

  function openContents() {
    contents.showModal();
    const currentButton = contents.querySelector('[aria-current=page]');
    if (currentButton) currentButton.focus();
  }

  $('#open-contents').addEventListener('click', openContents);
  $('#page-indicator').addEventListener('click', openContents);
  $('#close-contents').addEventListener('click', () => contents.close());

  function contentsEntry(name, start, chapterIndex, ids, summary) {
    const button = element('button', 'contents-entry');
    button.type = 'button';
    button.dataset.chapterTarget = chapterIndex;
    if (ids?.length) {
      const image = element('img');
      image.src = byId.get(ids[0]).thumb;
      image.alt = '';
      image.width = 70;
      image.height = 85;
      button.append(image);
    } else {
      button.append(element('span', 'contents-icon', chapterIndex === -1 ? '🌿' : '❤️'));
    }
    const text = element('span', 'contents-entry-copy');
    text.append(
      element('small', '', chapterIndex === -1 ? 'TRANG BÌA' : chapterIndex === 5 ? 'LÁ THƯ TÌNH' : 'CHƯƠNG ' + pad(chapterIndex + 1)),
      element('strong', '', name),
      element('span', '', summary)
    );
    button.append(text, element('span', 'contents-page', pad(start + 1) + ' ↗'));
    button.addEventListener('click', () => { contents.close(); showPage(start); });
    $('#contents-list').append(button);
  }

  contentsEntry('Bốn năm bên em, ngàn điều thương nhớ.', 0, -1, null, 'Bìa album kỷ niệm 12.11');
  chapters.forEach((c, i) => contentsEntry(c.name, c.start, i, c.ids, c.letter ? '2 trang thư gửi Boss' : `${c.ids.length} khoảnh khắc`));

  // Swipe support
  let swipe = null, lastSwipe = 0;
  frame.addEventListener('pointerdown', e => {
    if (e.isPrimary && e.button === 0) swipe = { x: e.clientX, y: e.clientY };
  });
  frame.addEventListener('pointerup', e => {
    if (!swipe) return;
    const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
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

  // Lightbox
  function drawPhoto() {
    const photo = photos[currentPhoto];
    $('#lightbox-image').src = photo.src;
    $('#lightbox-image').alt = captions[photo.id] || photo.label;
    $('#photo-count').textContent = `${pad(currentPhoto + 1)} / ${photos.length}`;
    $('#photo-caption').textContent = captions[photo.id] || photo.label;
    $('#prev-photo').disabled = currentPhoto === 0;
    $('#next-photo').disabled = currentPhoto === photos.length - 1;
  }

  document.addEventListener('click', e => {
    const button = e.target.closest('[data-photo]');
    if (!button) return;
    lastPhotoId = button.dataset.photo;
    currentPhoto = photos.findIndex(p => p.id === lastPhotoId);
    drawPhoto();
    lightbox.showModal();
  });

  function changePhoto(n) {
    const next = currentPhoto + n;
    if (next >= 0 && next < photos.length) {
      currentPhoto = next;
      drawPhoto();
    }
  }

  $('#prev-photo').addEventListener('click', () => changePhoto(-1));
  $('#next-photo').addEventListener('click', () => changePhoto(1));
  $('#close-photo').addEventListener('click', () => lightbox.close());

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (lightbox.open) {
      if (e.key === 'ArrowRight') { e.preventDefault(); changePhoto(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); changePhoto(-1); }
      return;
    }
    if (contents.open || e.altKey || e.ctrlKey || e.metaKey || e.target.matches('input,textarea,select')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); showPage(current + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); showPage(current - 1); }
    if (e.key === 'Home') { e.preventDefault(); showPage(0); }
    if (e.key === 'End') { e.preventDefault(); showPage(pages.length - 1); }
  });

  for (const dialog of [contents, lightbox]) {
    dialog.addEventListener('click', e => {
      if (e.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
    });
  }

  function saveLetter() {
    const clone = letterSource.cloneNode(true);
    clone.querySelector('.letter-actions')?.remove();
    clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
    const text = [...clone.children].map(el => el.textContent.trim()).join('\n\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8' }));
    const link = element('a');
    link.href = url;
    link.download = 'Thu-tinh-gui-Boss-12-11.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  addEventListener('hashchange', () => showPage(hashPage(), false));
  addEventListener('resize', () => { if (animation) animation.finish(); });

  showPage(hashPage(), false);

  // Hard cover state on load
  if (current === 0 && !reduced.matches) {
    bookClosed = true;
    document.body.classList.add('is-closed');
    frame.classList.add('book-closed');
    const cover = element('div', 'hard-cover');
    cover.setAttribute('role', 'button');
    cover.tabIndex = 0;
    cover.setAttribute('aria-label', 'Mở cuốn album của Boss');

    const front = element('div', 'hc-face hc-front');
    const title = element('h1');
    title.append(
      document.createTextNode('Bốn năm '),
      element('em', '', 'bên em'),
      document.createTextNode(', ngàn điều thương nhớ.')
    );
    const fig = element('figure', 'hc-photo');
    const img = element('img');
    img.src = byId.get('5').src;
    img.alt = '';
    img.draggable = false;
    fig.append(img);

    front.append(
      element('span', 'hc-over', 'KỶ NIỆM TÌNH YÊU · 12.11'),
      title,
      fig,
      element('span', 'hc-name', 'MY BOSS'),
      element('span', 'hc-date', '12.11.2021 — 12.11.2025'),
      element('span', 'hc-open', 'Chạm để mở album ✨')
    );

    const back = element('div', 'hc-face hc-back');
    if (matchMedia('(max-width:760px)').matches) {
      back.classList.add('hc-endpaper');
    } else {
      back.append(book.querySelector('.paper.left').cloneNode(true));
    }
    cover.append(front, back);
    frame.append(cover);

    cover.addEventListener('click', e => { e.stopPropagation(); openBook(); });
    cover.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        openBook();
      }
    });
    setTimeout(() => cover.focus({ preventScroll: true }), 60);
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

  function openBook() {
    if (!bookClosed) return Promise.resolve();
    if (opening) return opening;
    opening = (async () => {
      const cover = frame.querySelector('.hard-cover');
      const mobile = matchMedia('(max-width:760px)').matches;
      const d = mobile ? 1150 : 1500;
      frame.classList.add('book-opening');
      frame.classList.remove('book-closed');
      const turn = cover.animate(
        [{ transform: 'perspective(2200px) rotateY(0deg)' }, { transform: 'perspective(2200px) rotateY(-180deg)' }],
        { duration: d, easing: 'cubic-bezier(.5,.05,.25,1)', fill: 'forwards' }
      );
      if (mobile) cover.animate([{ opacity: 1 }, { opacity: 1, offset: .5 }, { opacity: 0 }], { duration: d, fill: 'forwards' });
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

  // Music controls
  const musicButton = $('#music-toggle');
  const loveMusic = window.BossMusic.createPlayer();

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

  function pauseMusic() { loveMusic.stop(); }

  async function startMusic() {
    if (!musicWanted || loveMusic.playing || document.hidden) return;
    try {
      await loveMusic.play();
      if (!musicWanted || document.hidden) { pauseMusic(); return; }
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
      pauseMusic();
      $('.audio-status').textContent = 'Đã tắt nhạc.';
      return;
    }
    rememberMusic(true);
    musicButton.disabled = true;
    try { await startMusic(); } finally { musicButton.disabled = false; }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseMusic();
    else armMusic();
  });
  window.addEventListener('pagehide', pauseMusic);
})();

