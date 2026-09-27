const uploadInput = document.querySelector('.img-upload__input');
const uploadOverlay = document.querySelector('.img-upload__overlay');
const uploadCancel = document.querySelector('.img-upload__cancel');
const previewImage = document.querySelector('.img-upload__preview img');
const effectPreviews = document.querySelectorAll('.effects__preview');

const scaleSmaller = document.querySelector('.scale__control--smaller');
const scaleBigger = document.querySelector('.scale__control--bigger');
const scaleValue = document.querySelector('.scale__control--value');

const effectsList = document.querySelector('.effects__list');
const effectLevelContainer = document.querySelector('.img-upload__effect-level');
const effectLevelSlider = document.querySelector('.effect-level__slider');
const effectLevelValue = document.querySelector('.effect-level__value');

const uploadForm = document.querySelector('.img-upload__form');
const hashtagInput = document.querySelector('.text__hashtags');
const descriptionInput = document.querySelector('.text__description');
const submitButton = document.querySelector('.img-upload__submit');

const picturesContainer = document.querySelector('.pictures');
const pictureTemplate = document
  .querySelector('#picture')
  .content
  .querySelector('.picture');

const bigPicture = document.querySelector('.big-picture');
const bigPictureImage = bigPicture.querySelector('.big-picture__img img');
const bigPictureLikes = bigPicture.querySelector('.likes-count');
const bigPictureCaption = bigPicture.querySelector('.social__caption');
const bigPictureComments = bigPicture.querySelector('.social__comments');
const bigPictureCommentsCount = bigPicture.querySelector('.social__comment-count');
const bigPictureClose = bigPicture.querySelector('.big-picture__cancel');
const commentsLoader = bigPicture.querySelector('.comments-loader');

const commentTemplate = bigPicture
  .querySelector('.social__comment')
  .cloneNode(true);

const filtersBlock = document.querySelector('.img-filters');
const filtersForm = document.querySelector('.img-filters__form');
const filterButtons = document.querySelectorAll('.img-filters__button');

const SCALE_STEP = 25;
const MIN_SCALE = 25;
const MAX_SCALE = 100;

const MAX_HASHTAGS = 5;
const MAX_HASHTAG_LENGTH = 20;
const MAX_DESCRIPTION_LENGTH = 140;

const COMMENTS_STEP = 5;
const RANDOM_PICTURES_COUNT = 10;
const RERENDER_DELAY = 500;

const SEND_DATA_URL = 'https://29.javascript.htmlacademy.pro/kekstagram';
const GET_DATA_URL = 'https://29.javascript.htmlacademy.pro/kekstagram/data';

const HASHTAG_PATTERN = /^#[a-zа-яё0-9]{1,19}$/i;

let currentScale = MAX_SCALE;
let currentEffect = 'none';

let currentComments = [];
let shownCommentsCount = 0;

let loadedPictures = [];

const pristine = new window.Pristine(uploadForm, {
  classTo: 'img-upload__field-wrapper',
  errorTextParent: 'img-upload__field-wrapper',
});

const getHashtags = () =>
  hashtagInput.value
    .trim()
    .split(/\s+/)
    .filter((hashtag) => hashtag.length > 0);

const validateHashtagFormat = () => {
  const hashtags = getHashtags();

  return hashtags.every((hashtag) => HASHTAG_PATTERN.test(hashtag));
};

const validateHashtagCount = () => {
  const hashtags = getHashtags();

  return hashtags.length <= MAX_HASHTAGS;
};

const validateUniqueHashtags = () => {
  const hashtags = getHashtags().map((hashtag) => hashtag.toLowerCase());

  return new Set(hashtags).size === hashtags.length;
};

const validateDescription = () =>
  descriptionInput.value.length <= MAX_DESCRIPTION_LENGTH;

pristine.addValidator(
  hashtagInput,
  validateHashtagFormat,
  `Хэш-тег должен начинаться с #, содержать только буквы и цифры и быть не длиннее ${MAX_HASHTAG_LENGTH} символов`
);

pristine.addValidator(
  hashtagInput,
  validateHashtagCount,
  `Нельзя указать больше ${MAX_HASHTAGS} хэш-тегов`
);

pristine.addValidator(
  hashtagInput,
  validateUniqueHashtags,
  'Хэш-теги не должны повторяться'
);

pristine.addValidator(
  descriptionInput,
  validateDescription,
  `Комментарий не может быть длиннее ${MAX_DESCRIPTION_LENGTH} символов`
);

const updateScale = () => {
  scaleValue.value = `${currentScale}%`;
  previewImage.style.transform = `scale(${currentScale / 100})`;
};

const updateEffect = (value) => {
  effectLevelValue.value = value;

  if (currentEffect === 'chrome') {
    previewImage.style.filter = `grayscale(${value})`;
  }

  if (currentEffect === 'sepia') {
    previewImage.style.filter = `sepia(${value})`;
  }

  if (currentEffect === 'marvin') {
    previewImage.style.filter = `invert(${value}%)`;
  }

  if (currentEffect === 'phobos') {
    previewImage.style.filter = `blur(${value}px)`;
  }

  if (currentEffect === 'heat') {
    previewImage.style.filter = `brightness(${value})`;
  }
};

const resetEffect = () => {
  currentEffect = 'none';

  previewImage.style.filter = '';
  effectLevelValue.value = '';
  effectLevelContainer.classList.add('hidden');

  const originalEffect = document.querySelector('#effect-none');
  originalEffect.checked = true;
};

const resetUploadForm = () => {
  uploadInput.value = '';
  hashtagInput.value = '';
  descriptionInput.value = '';

  currentScale = MAX_SCALE;

  updateScale();
  resetEffect();

  pristine.reset();
};

const closeUploadForm = () => {
  uploadOverlay.classList.add('hidden');
  document.body.classList.remove('modal-open');

  resetUploadForm();
};

const showMessage = (type) => {
  const template = document.querySelector(`#${type}`);
  const message = template.content
    .querySelector(`.${type}`)
    .cloneNode(true);

  const closeButton = message.querySelector(`.${type}__button`);

  const closeMessage = () => {
    message.remove();
    document.removeEventListener('keydown', onMessageEscKeydown);
  };

  function onMessageEscKeydown(evt) {
    if (evt.key === 'Escape') {
      evt.preventDefault();
      closeMessage();
    }
  }

  closeButton.addEventListener('click', () => {
    closeMessage();
  });

  message.addEventListener('click', (evt) => {
    if (evt.target === message) {
      closeMessage();
    }
  });

  document.addEventListener('keydown', onMessageEscKeydown);
  document.body.append(message);
};

const createComment = (comment) => {
  const commentElement = commentTemplate.cloneNode(true);

  const avatar = commentElement.querySelector('.social__picture');
  const text = commentElement.querySelector('.social__text');

  avatar.src = comment.avatar;
  avatar.alt = comment.name;
  text.textContent = comment.message;

  return commentElement;
};

const renderComments = () => {
  const nextCommentsCount = Math.min(
    shownCommentsCount + COMMENTS_STEP,
    currentComments.length
  );

  const fragment = document.createDocumentFragment();

  for (let i = shownCommentsCount; i < nextCommentsCount; i++) {
    fragment.append(createComment(currentComments[i]));
  }

  bigPictureComments.append(fragment);

  shownCommentsCount = nextCommentsCount;

  bigPictureCommentsCount.textContent =
    `${shownCommentsCount} из ${currentComments.length} комментариев`;

  if (shownCommentsCount >= currentComments.length) {
    commentsLoader.classList.add('hidden');
  } else {
    commentsLoader.classList.remove('hidden');
  }
};

const openBigPicture = (picture) => {
  bigPictureImage.src = picture.url;
  bigPictureImage.alt = picture.description;

  bigPictureLikes.textContent = picture.likes;
  bigPictureCaption.textContent = picture.description;

  currentComments = picture.comments;
  shownCommentsCount = 0;

  bigPictureComments.innerHTML = '';

  renderComments();

  bigPicture.classList.remove('hidden');
  document.body.classList.add('modal-open');
};

const closeBigPicture = () => {
  bigPicture.classList.add('hidden');
  document.body.classList.remove('modal-open');

  bigPictureComments.innerHTML = '';
  currentComments = [];
  shownCommentsCount = 0;
};

const clearPictures = () => {
  picturesContainer
    .querySelectorAll('.picture')
    .forEach((picture) => picture.remove());
};

const renderPictures = (pictures) => {
  clearPictures();

  const fragment = document.createDocumentFragment();

  pictures.forEach((picture) => {
    const pictureElement = pictureTemplate.cloneNode(true);
    const image = pictureElement.querySelector('.picture__img');

    image.src = picture.url;
    image.alt = picture.description;

    pictureElement.querySelector('.picture__likes').textContent =
      picture.likes;

    pictureElement.querySelector('.picture__comments').textContent =
      picture.comments.length;

    pictureElement.addEventListener('click', (evt) => {
      evt.preventDefault();
      openBigPicture(picture);
    });

    fragment.append(pictureElement);
  });

  picturesContainer.append(fragment);
};

const getRandomPictures = () => {
  const picturesCopy = loadedPictures.slice();

  for (let i = picturesCopy.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));

    const temporaryItem = picturesCopy[i];
    picturesCopy[i] = picturesCopy[randomIndex];
    picturesCopy[randomIndex] = temporaryItem;
  }

  return picturesCopy.slice(0, RANDOM_PICTURES_COUNT);
};

const getDiscussedPictures = () =>
  loadedPictures
    .slice()
    .sort((firstPicture, secondPicture) =>
      secondPicture.comments.length - firstPicture.comments.length
    );

const debounce = (callback, delay) => {
  let timeoutId;

  return (...args) => {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
  };
};

const setActiveFilter = (activeButton) => {
  filterButtons.forEach((button) => {
    button.classList.remove('img-filters__button--active');
  });

  activeButton.classList.add('img-filters__button--active');
};

const applyFilter = (filterId) => {
  if (filterId === 'filter-random') {
    renderPictures(getRandomPictures());
    return;
  }

  if (filterId === 'filter-discussed') {
    renderPictures(getDiscussedPictures());
    return;
  }

  renderPictures(loadedPictures);
};

const debouncedApplyFilter = debounce(applyFilter, RERENDER_DELAY);

const showLoadError = () => {
  const errorMessage = document.createElement('div');

  errorMessage.textContent = 'Не удалось загрузить фотографии';

  errorMessage.style.position = 'fixed';
  errorMessage.style.top = '20px';
  errorMessage.style.left = '50%';
  errorMessage.style.transform = 'translateX(-50%)';
  errorMessage.style.padding = '15px 25px';
  errorMessage.style.backgroundColor = 'white';
  errorMessage.style.color = 'black';
  errorMessage.style.zIndex = '1000';

  document.body.append(errorMessage);

  setTimeout(() => {
    errorMessage.remove();
  }, 5000);
};

const loadPictures = async () => {
  try {
    const response = await fetch(GET_DATA_URL);

    if (!response.ok) {
      throw new Error('Failed to load pictures');
    }

    loadedPictures = await response.json();

    renderPictures(loadedPictures);

    filtersBlock.classList.remove('img-filters--inactive');
  } catch (error) {
    if (error) {
      showLoadError();
    }
  }
};

window.noUiSlider.create(effectLevelSlider, {
  range: {
    min: 0,
    max: 1,
  },
  start: 1,
  step: 0.1,
  connect: 'lower',
});

effectLevelSlider.noUiSlider.on('update', (values, handle) => {
  updateEffect(Number(values[handle]));
});

uploadInput.addEventListener('change', () => {
  const file = uploadInput.files[0];

  if (file) {
    const imageUrl = URL.createObjectURL(file);

    previewImage.src = imageUrl;

    effectPreviews.forEach((preview) => {
      preview.style.backgroundImage = `url("${imageUrl}")`;
    });
  }

  currentScale = MAX_SCALE;

  updateScale();
  resetEffect();

  uploadOverlay.classList.remove('hidden');
  document.body.classList.add('modal-open');
});

scaleSmaller.addEventListener('click', () => {
  if (currentScale > MIN_SCALE) {
    currentScale -= SCALE_STEP;
    updateScale();
  }
});

scaleBigger.addEventListener('click', () => {
  if (currentScale < MAX_SCALE) {
    currentScale += SCALE_STEP;
    updateScale();
  }
});

effectsList.addEventListener('change', (evt) => {
  currentEffect = evt.target.value;

  if (currentEffect === 'none') {
    previewImage.style.filter = '';
    effectLevelContainer.classList.add('hidden');

    return;
  }

  effectLevelContainer.classList.remove('hidden');

  if (currentEffect === 'chrome' || currentEffect === 'sepia') {
    effectLevelSlider.noUiSlider.updateOptions({
      range: {
        min: 0,
        max: 1,
      },
      start: 1,
      step: 0.1,
    });
  }

  if (currentEffect === 'marvin') {
    effectLevelSlider.noUiSlider.updateOptions({
      range: {
        min: 0,
        max: 100,
      },
      start: 100,
      step: 1,
    });
  }

  if (currentEffect === 'phobos') {
    effectLevelSlider.noUiSlider.updateOptions({
      range: {
        min: 0,
        max: 3,
      },
      start: 3,
      step: 0.1,
    });
  }

  if (currentEffect === 'heat') {
    effectLevelSlider.noUiSlider.updateOptions({
      range: {
        min: 1,
        max: 3,
      },
      start: 3,
      step: 0.1,
    });
  }
});

uploadCancel.addEventListener('click', () => {
  closeUploadForm();
});

bigPictureClose.addEventListener('click', () => {
  closeBigPicture();
});

commentsLoader.addEventListener('click', () => {
  renderComments();
});

filtersForm.addEventListener('click', (evt) => {
  const filterButton = evt.target.closest('.img-filters__button');

  if (!filterButton) {
    return;
  }

  setActiveFilter(filterButton);
  debouncedApplyFilter(filterButton.id);
});

document.addEventListener('keydown', (evt) => {
  const messageIsOpen =
    document.querySelector('.success') ||
    document.querySelector('.error');

  if (messageIsOpen) {
    return;
  }

  if (evt.key === 'Escape') {
    if (!bigPicture.classList.contains('hidden')) {
      closeBigPicture();

      return;
    }

    const activeElement = document.activeElement;

    if (
      activeElement === hashtagInput ||
      activeElement === descriptionInput
    ) {
      return;
    }

    if (!uploadOverlay.classList.contains('hidden')) {
      closeUploadForm();
    }
  }
});

uploadForm.addEventListener('submit', async (evt) => {
  evt.preventDefault();

  const isValid = pristine.validate();

  if (!isValid) {
    return;
  }

  submitButton.disabled = true;

  try {
    const response = await fetch(SEND_DATA_URL, {
      method: 'POST',
      body: new FormData(uploadForm),
    });

    if (!response.ok) {
      throw new Error('Failed to send form');
    }

    closeUploadForm();
    showMessage('success');
  } catch (error) {
    if (error) {
      showMessage('error');
    }
  } finally {
    submitButton.disabled = false;
  }
});

loadPictures();
