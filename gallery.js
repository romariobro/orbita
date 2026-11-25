(() => {
  const projectGallery = document.querySelector('.new-project-gallery');
  const archiveGallery = document.querySelector('.page-gallery');
  if (projectGallery) {
    if (archiveGallery) {
      projectGallery.append(...archiveGallery.querySelectorAll('figure'));
      archiveGallery.remove();
      document.querySelector('.archive-project-title')?.remove();
    }
    const wide = document.createElement('div');
    wide.className = 'container wide-project-gallery';
    document.querySelector('.page-layout').before(wide);
    wide.append(projectGallery);
  }
  const homeGallery = document.querySelector('#projects .projects-grid');
  const homeArchive = document.querySelector('#projects .project-archive-gallery');
  if (homeGallery && homeArchive) {
    homeArchive.querySelectorAll('figure').forEach(figure => homeGallery.append(figure));
    homeArchive.remove();
  }
  const galleries = [...document.querySelectorAll('.projects-grid, .new-project-gallery')];
  if (!galleries.length) return;
  const photos = galleries.flatMap(gallery => [...gallery.querySelectorAll('figure img')]);
  const dialog = document.createElement('dialog');
  dialog.className = 'photo-viewer';
  dialog.setAttribute('aria-label', 'Просмотр фотографий объектов');
  dialog.innerHTML = `<div class="viewer-top"><span class="viewer-count" aria-live="polite"></span><button class="viewer-close" type="button" aria-label="Закрыть фотографию">Закрыть <span aria-hidden="true">×</span></button></div><div class="viewer-stage"><button class="viewer-prev" type="button" aria-label="Предыдущее фото">‹</button><img class="viewer-image" alt=""><button class="viewer-next" type="button" aria-label="Следующее фото">›</button></div><div class="viewer-bottom"><p class="viewer-caption"></p><span>← → — переключить · Esc — закрыть</span></div>`;
  document.body.append(dialog);
  const image = dialog.querySelector('.viewer-image');
  let current = 0;
  let opener;
  let oldOverflow;
  function show(index) {
    current = (index + photos.length) % photos.length;
    image.src = photos[current].currentSrc || photos[current].src;
    image.alt = photos[current].alt;
    dialog.querySelector('.viewer-caption').textContent = photos[current].alt;
    dialog.querySelector('.viewer-count').textContent = `${current + 1} / ${photos.length}`;
  }
  function open(index, target) {
    opener = target;
    oldOverflow = document.documentElement.style.overflow;
    show(index);
    dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
    dialog.querySelector('.viewer-close').focus();
  }
  dialog.querySelector('.viewer-close').onclick = () => dialog.close();
  dialog.querySelector('.viewer-prev').onclick = () => show(current - 1);
  dialog.querySelector('.viewer-next').onclick = () => show(current + 1);
  dialog.addEventListener('close', () => {
    document.documentElement.style.overflow = oldOverflow || '';
    opener?.focus({ preventScroll: true });
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(current + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  let touchStart;
  const stage = dialog.querySelector('.viewer-stage');
  stage.addEventListener('touchstart', event => {
    touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  stage.addEventListener('touchend', event => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) show(current + (dx < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });
  photos.forEach((photo, index) => {
    let trigger = photo.closest('a');
    if (!trigger) {
      trigger = document.createElement('button');
      trigger.type = 'button';
      photo.replaceWith(trigger);
      trigger.append(photo);
    }
    trigger.classList.add('gallery-open');
    trigger.setAttribute('aria-label', `Открыть на весь экран: ${photo.alt}`);
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.removeAttribute('target');
    trigger.addEventListener('click', event => {
      event.preventDefault();
      open(index, trigger);
    });
  });
  galleries.forEach((gallery, index) => {
    const figures = [...gallery.querySelectorAll('figure')];
    gallery.classList.add('featured-gallery');
    gallery.id ||= `project-gallery-${index + 1}`;
    gallery.setAttribute('role', 'region');
    gallery.setAttribute('aria-label', 'Фотографии объектов');
    const thumbs = document.createElement('div');
    thumbs.className = 'gallery-thumbnails';
    thumbs.setAttribute('role', 'group');
    thumbs.setAttribute('aria-label', 'Выбор фотографии');
    const controls = document.createElement('div');
    controls.className = 'gallery-controls';
    controls.innerHTML = '<span class="gallery-position" aria-live="polite"></span><span class="gallery-hint">Нажмите на фото, чтобы увеличить</span><div><button type="button" aria-label="Предыдущее фото в галерее">←</button><button type="button" aria-label="Следующее фото в галерее">→</button></div>';
    gallery.after(controls);
    controls.after(thumbs);
    let selected = 0;
    const buttons = figures.map((figure, i) => {
      const original = figure.querySelector('img');
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `Фото ${i + 1}: ${original.alt}`);
      const preview = original.cloneNode();
      preview.removeAttribute('width');
      preview.removeAttribute('height');
      preview.alt = '';
      button.append(preview);
      button.onclick = () => select(i, true);
      thumbs.append(button);
      return button;
    });
    function select(i, reveal = false) {
      selected = (i + figures.length) % figures.length;
      figures.forEach((figure, n) => {
        figure.hidden = n !== selected;
        buttons[n].setAttribute('aria-pressed', String(n === selected));
      });
      controls.querySelector('.gallery-position').textContent = `${selected + 1} / ${figures.length}`;
      if (reveal) {
        const button = buttons[selected];
        const left = button.offsetLeft - thumbs.offsetLeft;
        thumbs.scrollTo({left: Math.max(0, left - (thumbs.clientWidth - button.clientWidth) / 2), behavior: 'smooth'});
      }
    }
    const [prev,next] = controls.querySelectorAll('button');
    prev.onclick = () => select(selected - 1, true);
    next.onclick = () => select(selected + 1, true);
    thumbs.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        select(selected + (event.key === 'ArrowLeft' ? -1 : 1), true);
        buttons[selected].focus({preventScroll:true});
      }
    });
    select(0);
  });
})();
