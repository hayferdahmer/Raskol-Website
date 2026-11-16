(() => {
  'use strict';
  const form = document.getElementById('ticketForm');
  if (!form) return;
  const category = document.getElementById('ticketCategory');
  const subject = document.getElementById('ticketSubject');
  const message = document.getElementById('ticketMessage');
  const files = document.getElementById('ticketFiles');
  const preview = document.getElementById('ticketPreview');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    document.getElementById('previewSubject').textContent = subject.value.trim();
    document.getElementById('previewCategory').textContent = category.value;
    document.getElementById('previewMessage').textContent = message.value.trim();

    const fileNames = [...files.files].map((file) => file.name);
    document.getElementById('previewFiles').textContent = fileNames.length
      ? 'Выбрано файлов: ' + fileNames.join(', ')
      : 'Вложения не выбраны.';

    preview.hidden = false;
    preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
})();
