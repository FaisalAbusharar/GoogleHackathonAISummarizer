import Choices from './choices.min.js';

document.addEventListener('DOMContentLoaded', () => {
  new Choices('#length', {
    searchEnabled: false,
    itemSelectText: '',
  });
});