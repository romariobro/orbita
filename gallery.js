(() => {
  const galleries = [...document.querySelectorAll('.projects-grid, .new-project-gallery, .page-gallery')];
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
    gallery.classList.add('photo-carousel');
    gallery.id ||= `photo-carousel-${index + 1}`;
    gallery.setAttribute('role', 'region');
    gallery.setAttribute('aria-label', 'Фотографии объектов — горизонтальная галерея');
    gallery.tabIndex = 0;
    const toolbar = document.createElement('div');
    toolbar.className = 'carousel-toolbar';
    toolbar.innerHTML = `<span>Листайте фотографии · нажмите для увеличения</span><div><button type="button" aria-label="Прокрутить фотографии влево" aria-controls="${gallery.id}">←</button><button type="button" aria-label="Прокрутить фотографии вправо" aria-controls="${gallery.id}">→</button></div>`;
    gallery.before(toolbar);
    const [prev, next] = toolbar.querySelectorAll('button');
    function move(direction) {
      const first = gallery.querySelector('figure');
      const distance = first.getBoundingClientRect().width + (parseFloat(getComputedStyle(gallery).gap) || 0);
      gallery.scrollBy({ left: direction * distance, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
    function update() {
      prev.disabled = gallery.scrollLeft < 2;
      next.disabled = gallery.scrollLeft + gallery.clientWidth >= gallery.scrollWidth - 2;
    }
    prev.onclick = () => move(-1);
    next.onclick = () => move(1);
    gallery.addEventListener('scroll', update, { passive: true });
    gallery.addEventListener('keydown', event => {
      if (event.target === gallery && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
        move(event.key === 'ArrowLeft' ? -1 : 1);
      }
    });
    new ResizeObserver(update).observe(gallery);
    update();
  });
})();
