import {createPhotos} from './data.js';
import {showBigPicture} from './big-picture.js';

const picturesContainer = document.querySelector('.pictures');
const pictureTemplate = document.querySelector('#picture').content.querySelector('.picture');

const photos = createPhotos();
const fragment = document.createDocumentFragment();

photos.forEach((photo) => {
  const pictureElement = pictureTemplate.cloneNode(true);

  pictureElement.querySelector('.picture__img').src = photo.url;
  pictureElement.querySelector('.picture__img').alt = photo.description;
  pictureElement.querySelector('.picture__likes').textContent = photo.likes;
  pictureElement.querySelector('.picture__comments').textContent = photo.comments.length;

  pictureElement.addEventListener('click', (evt) => {
    evt.preventDefault();
    showBigPicture(photo);
  });

  fragment.appendChild(pictureElement);
});

picturesContainer.appendChild(fragment);
